import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ValidFiltersApiService } from './services/valid-filters-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ValidFilterModel,
  ValidFilterQueryParamsDto,
  ValidFilterFilterValue,
  ValidFilterFormValue,
  ValidFilterCreateDto,
  ValidFilterUpdateDto,
  DropdownItem,
  CatalogDropdownItem,
} from './models/valid-filters.model';

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
import { ValidFilterFilterChipsUtils } from './utils/filter-chips.utils';
import { ValidFiltersFilterPanel } from './valid-filters-filter-panel/valid-filters-filter-panel';
import { AddEditValidFilterComponent } from './add-edit-valid-filter/add-edit-valid-filter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';

@Component({
  selector: 'app-valid-filters',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditValidFilterComponent
  ],
  templateUrl: './valid-filters.component.html',
  styleUrls: ['./valid-filters.component.scss']
})
export class ValidFiltersComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(AddEditValidFilterComponent) sideDrawer!: AddEditValidFilterComponent;
  @ViewChild(DataTable) dataTableComponent!: DataTable<ValidFilterModel>;

  private readonly cdr = inject(ChangeDetectorRef);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<ValidFilterModel> = {
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
      column: 'vendorName',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ValidFilterFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ValidFilterModel[] = [];
  requestState: ValidFilterQueryParamsDto = {};

  filterCatalogs: DropdownItem[] = [];
  filterProductTypes: DropdownItem[] = [];

  addCatalogs: CatalogDropdownItem[] = [];
  addProductTypes: DropdownItem[] = [];

  private currentSearchKeyword: string | undefined;

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidFilterModel | null = null;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: ValidFiltersApiService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private menuService: MenuService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.ValidFilters].path;
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
        this.closeSidePanel();
        this.loadLookupOptions();
        this.loadData();
      });
  }

  private loadLookupOptions(): void {
    this.service.getFilterDropdown(this.requestState.vendorName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.filterCatalogs = response.catalogs;
          this.filterProductTypes = response.productTypes;
        },
        error: (error) => {
          this.loggingService.error('Error loading filter dropdown options', error);
          this.snackbarService.showError('Failed to load filter options');
        }
      });

    this.service.getAddDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.addCatalogs = response.catalogs;
          this.addProductTypes = response.productTypes;
        },
        error: (error) => {
          this.loggingService.error('Error loading add/edit dropdown options', error);
          this.snackbarService.showError('Failed to load form options');
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
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW',
          onClick: () => this.openAddDrawer(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Manufacture Name and Product Type',
      minLength: 1,
      ariaLabel: 'Search valid filters',
      searchOnEnterOnly: true
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
        column: 'vendorName',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No valid filters available to display',
      loadingMessage: 'Loading valid filters...',
      showPagination: true,
      noDataIcon: "search",
    };
  }

  private getTableColumns(): TableColumn<ValidFilterModel>[] {
    return [
      {
        key: 'vendorName',
        header: 'Manufacturer Name',
        width: '180px'
      },
      {
        key: 'catalogNumber',
        header: 'Catalog',
        width: '160px'
      },
      {
        key: 'productType',
        header: 'Product Type',
        width: '140px'
      },
      {
        key: 'numberOfDays',
        header: 'Days',
        width: '100px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<ValidFilterModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit valid filter',
        ariaLabel: 'Edit valid filter',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '–';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    const queryDto: ValidFilterQueryParamsDto = {
      vendorName: this.requestState.vendorName || undefined,
      catalogNumber: this.requestState.catalogNumber || undefined,
      productType: this.requestState.productType || undefined,
      numberOfDays: this.requestState.numberOfDays != null ? this.requestState.numberOfDays : undefined,
      sortColumn: this.requestState.sortColumn || undefined,
      sortOrder: this.requestState.sortOrder || undefined
    };

    this.service
      .getValidFilters(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalCount;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading valid filters', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.closeSidePanel();
    this.currentSearchKeyword = searchText || undefined;
    this.requestState.vendorName = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
    this.loadLookupOptions();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    const sortColumnMap: Record<string, string> = {
      vendorName: 'VendorName',
      catalogNumber: 'CatalogNumber',
      productType: 'ProductType',
      effDate: 'EffDate'
    };

    this.requestState.sortColumn = sortColumnMap[event.column] || event.column;
    this.requestState.sortOrder =
      event.direction === 'default' ? undefined : (event.direction === 'A' ? 'ASC' : 'DESC');

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ValidFilterModel>): void {
    if (event.action === 'edit') {
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = event.row;
      }
      this.openEditDrawer(event.row);
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
      return;
    }

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
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(ValidFiltersFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.catalogOptions = this.filterCatalogs;
    componentRef.instance.productTypeOptions = this.filterProductTypes;

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

  applyFilters(filters: ValidFilterFilterValue): void {
    this.closeSidePanel();
    this.appliedFilters = filters;
    this.filterChips = ValidFilterFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      catalogNumber: filters.catalogNumber || undefined,
      productType: filters.productType || undefined,
      numberOfDays: filters.days != null ? filters.days : undefined,
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.closeSidePanel();
    this.appliedFilters = ValidFilterFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ValidFilterFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ValidFilterFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.closeSidePanel();
    this.appliedFilters = null;
    this.filterChips = [];

    const {
      catalogNumber, productType, numberOfDays,
      ...rest
    } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
    this.loadLookupOptions();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const {
        catalogNumber, productType, numberOfDays,
        ...rest
      } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      catalogNumber: this.appliedFilters.catalogNumber || undefined,
      productType: this.appliedFilters.productType || undefined,
      numberOfDays: this.appliedFilters.days != null ? this.appliedFilters.days : undefined,
    };
  }

  // Side panel methods
  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  openEditDrawer(row: ValidFilterModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = row;
    }
    this.cdr.detectChanges();
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  onSidePanelSave(formValue: ValidFilterFormValue): void {
    if (this.sidePanelMode === 'add') {
      this.handleCreate(formValue, false);
    } else {
      this.handleUpdate(formValue);
    }
  }

  onSidePanelSaveAndCreateAnother(formValue: ValidFilterFormValue): void {
    this.handleCreate(formValue, true);
  }

  private handleCreate(formValue: ValidFilterFormValue, createAnother: boolean): void {
    const payload: ValidFilterCreateDto = {
      vendorName: formValue.vendorName!,
      catalogNumber: formValue.catalogNumber!,
      productType: formValue.productType!,
      numberOfDays: formValue.numberOfDays!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
    };

    this.service.createValidFilter(payload).subscribe({
      next: () => {
        this.snackbarService.showSuccess(`Valid Filter record '${payload.vendorName}' added successfully`);
        this.loadLookupOptions();
        this.loadData();

        if (createAnother) {
          this.sideDrawer?.form.reset();
          this.sideDrawer.catalogSearchCtrl.setValue('');
          this.sideDrawer.productTypeSearchCtrl.setValue('');
          this.sideDrawer.isSubmitting = false;
        } else {
          this.closeSidePanel();
        }
      },
      error: (error) => {
        if (this.sideDrawer) {
          this.sideDrawer.isSubmitting = false;
          this.sideDrawer.errorMessage = error.error?.errorResponse?.error
            || error.error?.message
            || error.message
            || 'Failed to add valid filter. Please try again.';
          this.sideDrawer.cdr.markForCheck();
        }
      }
    });
  }

  private handleUpdate(formValue: ValidFilterFormValue): void {
    const row = this.sidePanelData!;
    const payload: ValidFilterUpdateDto = {
      vendorName: row.vendorName,
      productType: formValue.productType || row.productType,
      numberOfDays: formValue.numberOfDays!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) ?? undefined,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? null
    };

    this.service.updateValidFilter(row.catalogNumber, payload, row.productType).subscribe({
      next: () => {
        this.snackbarService.showSuccess(`Valid Filter record '${row.vendorName}' updated successfully`);
        this.closeSidePanel();
        this.loadLookupOptions();
        this.loadData();
      },
      error: (error) => {
        if (this.sideDrawer) {
          this.sideDrawer.isSubmitting = false;
          this.sideDrawer.errorMessage = error.error?.errorResponse?.error
            || error.error?.message
            || error.message
            || 'Failed to update valid filter. Please try again.';
          this.sideDrawer.cdr.markForCheck();
        }
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

    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSidePanel();
      } else if (this.overlayRef) {
        this.closeOverlay();
      }
    }
  }
}
