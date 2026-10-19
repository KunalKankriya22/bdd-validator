import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PoolAboValuesApiService } from './services/pool-abo-values-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  PoolAboValueTableModel,
  PoolAboValueFilterValue,
  PoolAboValueFormValue,
  CreateValidAboPooledSldDto,
  UpdateValidAboPooledSldDto,
  LookUp,
  LookUpWithDescription,
  SearchValidAboPooledSldRequest
} from './models/pool-abo-values.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PoolAboValueFilterChipsUtils } from './utils/filter-chips.utils';
import { PoolAboValueFilterPanel } from './pool-abo-value-filter-panel/pool-abo-value-filter-panel';
import { AddEditPoolAboValueComponent } from './add-edit-pool-abo-value/add-edit-pool-abo-value';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';

@Component({
  selector: 'app-valid-pool-abo-values',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditPoolAboValueComponent
  ],
  templateUrl: './valid-pool-abo-values.component.html',
  styleUrls: ['./valid-pool-abo-values.component.scss']
})
export class ValidPoolAboValuesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('addEditComponent') addEditComponent?: AddEditPoolAboValueComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<PoolAboValueTableModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'poolSld',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: PoolAboValueFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: PoolAboValueTableModel[] = [];
  sortDirection: 'ASC' | 'DESC' = 'ASC';
  searchKeyword = '';
  currentPageSize = 25;
  currentPageIndex = 0;

  // Add/Edit dropdown options (Pool SLD lookup)
  poolSldOptions: LookUpWithDescription[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: PoolAboValueTableModel | null = null;
  private triggerElement: HTMLElement | null = null;
  private filterTriggerElement: HTMLElement | null = null;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: PoolAboValuesApiService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private menuService: MenuService
  ) {
    this.initializeConfigurations();

    // Update page header config when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.ValidPoolAboValues].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadLookupOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close side panel when chapter changes
        this.closeSidePanel();

        this.loadLookupOptions();
        this.loadData();
      });
  }

  private loadLookupOptions(): void {
    // Load Pool SLD lookup from API
    this.service.getPoolSldLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (poolSldData) => {
          // Transform for add/edit dialog (with description)
          this.poolSldOptions = poolSldData.map(item => ({
            key: item.aboLabel,
            value: item.aboLabel,
            description: item.aboShortName
          }));
        },
        error: (error) => {
          this.loggingService.error('Error loading Pool SLD lookup', error);
          this.snackbarService.showError('Failed to load Pool SLD options');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    setTimeout(() => this.filterTriggerElement?.focus());
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW POOL ABO VALUE',
          icon: 'add',
          onClick: () => this.openAddDialog(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by System Label decision',
      minLength: 1,
      ariaLabel: 'Search by System Label decision',
      searchOnEnterOnly: false
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'poolNumber',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No valid pool ABO values available to display',
      loadingMessage: 'Loading valid pool ABO values...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<PoolAboValueTableModel>[] {
    return [
      {
        key: 'opos',
        header: 'O Pos',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'oneg',
        header: 'O Neg',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'apos',
        header: 'A Pos',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'aneg',
        header: 'A Neg',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'bpos',
        header: 'B Pos',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'bneg',
        header: 'B Neg',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'abpos',
        header: 'AB Pos',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'abneg',
        header: 'AB Neg',
        width: '80px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'unitSchemeType',
        header: 'Schema',
        width: '120px',
        valueFormatter: (value) => value === 'I' ? 'ISBT' : 'Coda-bar'
      },
      {
        key: 'rhLabelFlag',
        header: 'Rh Required',
        width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'poolSld',
        header: 'Pool',
        sortable: true,
        width: '100px'
      },
      {
        key: 'poolSldDesc',
        header: 'System Label decision',
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => value || '-'
      }
    ];
  }

  private getRowActions(): RowAction<PoolAboValueTableModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit pool ABO value',
        ariaLabel: 'Edit pool ABO value',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const take = this.currentPageSize;
    const skip = this.currentPageIndex * this.currentPageSize;

    const searchRequest: SearchValidAboPooledSldRequest = {
      poolSld: null,
      poolSldDesc: this.searchKeyword || null, // Search only by System Label decision
      unitSchemeType: null,
      rhLabelFlag: null,
      searchItem: null,
      sortDirection: this.sortDirection,
      // Blood type filters
      opos: this.appliedFilters?.opos || null,
      oneg: this.appliedFilters?.oneg || null,
      apos: this.appliedFilters?.apos || null,
      aneg: this.appliedFilters?.aneg || null,
      bpos: this.appliedFilters?.bpos || null,
      bneg: this.appliedFilters?.bneg || null,
      abpos: this.appliedFilters?.abpos || null,
      abneg: this.appliedFilters?.abneg || null,
      // Date range filters (convert period + date to from/to)
      effDateFrom: this.appliedFilters?.effDatePeriod === 'after' ? this.appliedFilters.effDate || null : null,
      effDateTo: this.appliedFilters?.effDatePeriod === 'before' ? this.appliedFilters.effDate || null : null,
      termDateFrom: this.appliedFilters?.termDatePeriod === 'after' ? this.appliedFilters.termDate || null : null,
      termDateTo: this.appliedFilters?.termDatePeriod === 'before' ? this.appliedFilters.termDate || null : null
    };

    this.service
      .searchValidAboPooledSld(take, skip, searchRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data || [];

          // Update pagination config
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total || 0;
            this.tableConfig.pagination.pageIndex = this.currentPageIndex;
            this.tableConfig.pagination.pageSize = this.currentPageSize;
          }

          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading valid pool ABO values', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchKeyword = searchText;
    this.currentPageIndex = 0; // Reset to first page on search
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Toggle sort direction ('A' = ascending, 'D' = descending)
    if (event.direction === 'A') {
      this.sortDirection = 'ASC';
    } else if (event.direction === 'D') {
      this.sortDirection = 'DESC';
    } else {
      this.sortDirection = 'ASC';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<PoolAboValueTableModel>): void {
    switch (event.action) {
      case 'edit':
        this.openEditDialog(event.row);
        break;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
      return;
    }

    this.filterTriggerElement = document.activeElement as HTMLElement;
    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(PoolAboValueFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    setTimeout(() => {
      const panelEl = this.overlayRef?.overlayElement;
      const firstFocusable = panelEl?.querySelector<HTMLElement>('mat-select, input, button');
      firstFocusable?.focus();
    });

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });
  }

  applyFilters(filters: PoolAboValueFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = PoolAboValueFilterChipsUtils.convertFiltersToChips(filters);
    this.currentPageIndex = 0; // Reset to first page on filter change
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = PoolAboValueFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = PoolAboValueFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.currentPageIndex = 0; // Reset to first page on filter change
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return PoolAboValueFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchKeyword = '';
    if (this.searchBarComponent) {
      this.searchBarComponent.clearSearch();
    }
    this.currentPageIndex = 0; // Reset to first page on filter clear
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  openAddDialog(): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  openEditDialog(row: PoolAboValueTableModel): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    setTimeout(() => this.triggerElement?.focus());
  }

  onSave(formValue: PoolAboValueFormValue): void {
    if (this.sidePanelMode === 'add') {
      this.handleAdd(formValue, false);
    } else {
      this.handleUpdate(formValue);
    }
  }

  onSaveAndCreateAnother(formValue: PoolAboValueFormValue): void {
    this.handleAdd(formValue, true);
  }

  private handleAdd(formValue: PoolAboValueFormValue, createAnother: boolean): void {
    const payload: CreateValidAboPooledSldDto = {
      opos: formValue.opos || null,
      oneg: formValue.oneg || null,
      apos: formValue.apos || null,
      aneg: formValue.aneg || null,
      bpos: formValue.bpos || null,
      bneg: formValue.bneg || null,
      abpos: formValue.abpos || null,
      abneg: formValue.abneg || null,
      unitSchemeType: formValue.unitSchemeType!,
      rhLabelFlag: formValue.rhLabelFlag!,
      poolSld: formValue.poolSld!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null
    };

    this.service.createValidAboPooledSld(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Always reset submitting state (runs on both success and error)
          this.addEditComponent?.resetSubmittingState();
        })
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Valid ABO Pooled SLD record has been successfully added.');
          this.loadData();

          if (createAnother) {
            // Reset to add mode with empty form
            this.sidePanelMode = 'add';
            this.sidePanelData = null;
          } else {
            this.closeSidePanel();
          }
        },
        error: (error) => {
          const errorMessage = error.error?.errorResponse?.error || error.error?.message || 'Failed to add record. Please try again.';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  private handleUpdate(formValue: PoolAboValueFormValue): void {
    if (!this.sidePanelData) return;

    const payload: UpdateValidAboPooledSldDto = {
      opos: formValue.opos || null,
      oneg: formValue.oneg || null,
      apos: formValue.apos || null,
      aneg: formValue.aneg || null,
      bpos: formValue.bpos || null,
      bneg: formValue.bneg || null,
      abpos: formValue.abpos || null,
      abneg: formValue.abneg || null,
      unitSchemeType: formValue.unitSchemeType!,
      rhLabelFlag: formValue.rhLabelFlag!,
      poolSld: formValue.poolSld!,
      poolSldDesc: formValue.poolSldDesc!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null
    };

    this.service.updateValidAboPooledSld(this.sidePanelData.auditKey, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Always reset submitting state (runs on both success and error)
          this.addEditComponent?.resetSubmittingState();
        })
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Valid ABO Pooled SLD record has been successfully updated.');
          this.loadData();
          this.closeSidePanel();
        },
        error: (error) => {
          const errorMessage = error.error?.errorResponse?.error || error.error?.message || 'Failed to update record. Please try again.';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeOverlay();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
