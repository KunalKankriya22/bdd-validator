import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { DriveCategoryRulesService } from './services/drive-category-rules.service';
import {
  DriveCategoryRuleModel,
  DriveCategoryRuleQueryDto,
  DriveCategoryRuleFilterValue
} from './models/drive-category-rules.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveCategoryRuleFilterChipsUtils } from './utils/filter-chips.utils';
import { DriveCategoryRuleFilterPanel } from './components/filter-panel/filter-panel';
import { AddEditRuleComponent } from './components/add-edit-rule/add-edit-rule';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { PageHeaderService } from '@shared/services/page-header.service';
import moment from 'moment';

@Component({
  selector: 'app-define-drive-category-rules',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditRuleComponent
  ],
  templateUrl: './define-drive-category-rules.html',
  styleUrls: ['./define-drive-category-rules.scss']
})
export class DefineDriveCategoryRulesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

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

  tableConfig: DataTableConfig<DriveCategoryRuleModel> = {
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
      column: 'ruleId',
      direction: 'D'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DriveCategoryRuleFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DriveCategoryRuleModel[] = [];
  requestState: DriveCategoryRuleQueryDto = {
    sortBy: 'ruleId',
    sortDirection: 'D'
  };

  isLoading = false;
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DriveCategoryRuleModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private driveCategoryRulesService: DriveCategoryRulesService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW RULE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new rule',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Rule ID or Category or Description',
      minLength: 2,
      ariaLabel: 'Search drive category rules by Rule ID, Category, or Description',
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
        column: 'ruleId',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No records found matching the current criteria',
      loadingMessage: 'Loading drive category rules data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DriveCategoryRuleModel>[] {
    return [
      {
        key: 'ruleId',
        header: 'Rule ID',
        sortable: true,
        width: '120px'
      },
      {
        key: 'driveCategory',
        header: 'Category',
        width: '150px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '250px'
      },
      {
        key: 'numberAllowed',
        header: 'Drives',
        width: '100px',
        valueFormatter: (value) => value ?? '-'
      },
      {
        key: 'maxSize',
        header: 'Size',
        width: '100px',
        valueFormatter: (value) => value ?? '-'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<DriveCategoryRuleModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit rule',
        ariaLabel: 'Edit rule {{ruleId}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(showLoading: boolean = true): void {
    if (showLoading) {
      this.isLoading = true;
    }

    const skip = (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    this.driveCategoryRulesService
      .getDriveCategoryRules(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DriveCategoryRuleModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading drive category rules data:', error);
          // Error handling is done globally by authInterceptor
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchTerm = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
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

    // Map sort direction to API format: 'A' for ascending, 'D' for descending
    if (event.direction === 'default') {
      this.requestState.sortBy = undefined;
      this.requestState.sortDirection = undefined;
    } else {
      this.requestState.sortBy = event.column;
      this.requestState.sortDirection = event.direction === 'A' ? 'A' : 'D';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DriveCategoryRuleModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: DriveCategoryRuleModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
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
      .withPush(true)
      .withViewportMargin(16)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(DriveCategoryRuleFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: DriveCategoryRuleFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    this.requestState = {
      ...this.requestState,
      showTerminated: filters.showTerminated || undefined,
      effectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      effectiveDateValue: filters.effectiveDateValue || undefined,
      terminationDatePeriod: filters.terminationDatePeriod || undefined,
      terminationDateValue: filters.terminationDateValue || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DriveCategoryRuleFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DriveCategoryRuleFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DriveCategoryRuleFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { showTerminated, effectiveDatePeriod, effectiveDateValue, terminationDatePeriod, terminationDateValue, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { showTerminated, effectiveDatePeriod, effectiveDateValue, terminationDatePeriod, terminationDateValue, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      showTerminated: this.appliedFilters.showTerminated || undefined,
      effectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      effectiveDateValue: this.appliedFilters.effectiveDateValue || undefined,
      terminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      terminationDateValue: this.appliedFilters.terminationDateValue || undefined
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+N: Create new record
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
