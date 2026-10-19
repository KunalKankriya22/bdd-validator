import { Component, OnInit, OnDestroy, AfterViewInit, effect, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { OverlayModule } from '@angular/cdk/overlay';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { LinkUnitService } from './services/link-unit.service';
import { PatientModel, PatientQueryParams } from './models/patient.model';
import { PatientFilterValue } from './models/patient-filter.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PatientFilterPanel } from './components/patient-filter-panel';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

/**
 * Link Unit to Special Donation Component
 * List view showing patients who need special donations
 * Users can click eye icon to view details and link units
 */
@Component({
  selector: 'app-link-unit-to-special-donation',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    PatientFilterPanel,
    DataTable
  ],
  templateUrl: './link-unit-to-special-donation.html',
  styleUrls: ['./link-unit-to-special-donation.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.nextPageLabel = '';
        intl.previousPageLabel = '';
        intl.firstPageLabel = '';
        intl.lastPageLabel = '';
        return intl;
      }
    }
  ]
})
export class LinkUnitToSpecialDonationComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `link-unit-special-donation-${LinkUnitToSpecialDonationComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  // SessionStorage key for filter state persistence
  private readonly FILTER_STORAGE_KEY = 'linkUnitToSpecialDonation_filters';

  @ViewChild('statusTemplate', { static: false }) statusTemplate!: TemplateRef<any>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by patient name or ID',
    minLength: 3,
    ariaLabel: 'Search by patient name or ID',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<PatientModel> = {
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
      column: 'patientName',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No patients found',
    loadingMessage: 'Loading patients...',
    showPagination: true,
    enableRowHighlight: false
  };

  dataSource: PatientModel[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  appliedFilters: PatientFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  get showEmptyState(): boolean {
    return !this.isLoading && !this.hasError &&
           this.dataSource.length === 0 &&
           !this.searchText &&
           !this.appliedFilters;
  }

  get showNoResultsState(): boolean {
    return !this.isLoading && !this.hasError &&
           this.dataSource.length === 0 &&
           !!(this.searchText || this.appliedFilters);
  }

  filterOverlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: 0,
      offsetY: -3
    }
  ];

  searchText = '';
  requestState: PatientQueryParams = {};

  private destroy$ = new Subject<void>();

  get isSearchAndFilterDisabled(): boolean {
    return this.isLoading || this.hasError;
  }

  constructor(
    private linkUnitService: LinkUnitService,
    private router: Router,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
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
    this.restoreFilterState();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    // Assign the status template to the status column
    const statusColumn = this.tableConfig.columns.find(col => col.key === 'status');
    if (statusColumn && this.statusTemplate) {
      statusColumn.cellTemplate = this.statusTemplate;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by patient name or ID',
      minLength: 3,
      ariaLabel: 'Search patients by name or ID',
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
        column: 'patientName',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No patients found',
      loadingMessage: 'Loading patients...',
      showPagination: true,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<PatientModel>[] {
    return [
      {
        key: 'patientName',
        header: 'Patient Name',
        sortable: true,
        width: '260px'
      },
      {
        key: 'patientId',
        header: 'Patient ID',
        width: '119px'
      },
      {
        key: 'dateOfBirth',
        header: 'Date of Birth',
        width: '136px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'sex',
        header: 'Sex',
        width: '86px',
        valueFormatter: (value) => this.formatSex(value)
      },
      {
        key: 'surgeryDate',
        header: 'Surgery Date',
        width: '136px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'neededBy',
        header: 'Needed By',
        width: '128.43px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'shipTo',
        header: 'Ship To',
        width: '277.29px'
      },
      {
        key: 'status',
        header: 'Status',
        width: '112px'
      }
    ];
  }

  private getRowActions(): RowAction<PatientModel>[] {
    return [
      {
        icon: 'visibility',
        label: '',
        ariaLabel: '',
        color: 'default',
        action: 'view'
      }
    ];
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadData();
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const params: PatientQueryParams = {
      ...this.requestState,
      chapterId: this.headerService.getCurrentChapterId()
    };

    console.log('📊 Loading data with params:', params);
    console.log('📊 Current filters applied:', this.appliedFilters);

    const skip = (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    this.linkUnitService.getPatients(params, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📊 Response received - Total:', response.totalCount, 'Records:', response.data.length);
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalCount;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Failed to load patients. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    const trimmedText = searchText?.trim() || '';
    this.searchText = trimmedText;
    this.requestState = {
      ...this.requestState,
      searchText: trimmedText || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onApplyFilters(filters: PatientFilterValue): void {
    this.appliedFilters = filters;
    this.isFilterOpen = false;

    console.log('🔍 Filter values received:', filters);
    console.log('🔍 Status filter value:', filters.status, 'Type:', typeof filters.status);

    this.requestState = {
      ...this.requestState,
      status: filters.status || undefined,
      shipTo: filters.shipTo || undefined,
      surgeryDate: filters.surgeryDate || undefined,
      surgeryDatePeriod: filters.surgeryDatePeriod?.toUpperCase() as 'BEFORE' | 'AFTER' | undefined,
      neededByDate: filters.neededBy || undefined,
      neededByDatePeriod: filters.neededByPeriod?.toUpperCase() as 'BEFORE' | 'AFTER' | undefined
    };

    console.log('📤 Request state after filters:', this.requestState);
    console.log('📤 Status in request state:', this.requestState.status);

    this.updateFilterChips(filters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateFilterChips(filters: PatientFilterValue): void {
    const chips: FilterChip[] = [];

    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        value: filters.status
      });
    }

    if (filters.surgeryDate && filters.surgeryDatePeriod) {
      const date = new Date(filters.surgeryDate);
      const dateStr = DateFieldValidationUtility.formatDateForUI(date);
      const op = filters.surgeryDatePeriod?.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'surgeryDate',
        label: `Surgery Date ${op} ${dateStr}`,
        value: filters.surgeryDate
      });
    }

    if (filters.neededBy && filters.neededByPeriod) {
      const date = new Date(filters.neededBy);
      const dateStr = DateFieldValidationUtility.formatDateForUI(date);
      const op = filters.neededByPeriod?.toUpperCase() === 'AFTER' ? '≥' : '≤';
      chips.push({
        key: 'neededBy',
        label: `Needed By ${op} ${dateStr}`,
        value: filters.neededBy
      });
    }

    this.filterChips = chips;
  }

  private formatDateForChip(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onRemoveFilterChip(chipId: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = { ...this.appliedFilters };

    switch (chipId) {
      case 'status':
        updatedFilters.status = null;
        break;
      case 'surgeryDate':
        updatedFilters.surgeryDate = null;
        updatedFilters.surgeryDatePeriod = null;
        break;
      case 'neededBy':
        updatedFilters.neededBy = null;
        updatedFilters.neededByPeriod = null;
        break;
    }

    this.onApplyFilters(updatedFilters);
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.requestState = {
      searchText: this.searchText || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Clear sessionStorage when filters are cleared
    this.clearFilterState();

    this.loadData();
  }

  private clearAll(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.isFilterOpen = false;
    this.searchText = '';
    this.requestState = {};

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Clear sessionStorage when all filters/state is cleared (e.g., chapter change)
    this.clearFilterState();
  }

  onRowAction(event: TableRowActionEvent<PatientModel>): void {
    switch (event.action) {
      case 'view':
        this.onViewPatient(event.row);
        break;
    }
  }

  onViewPatient(patient: PatientModel): void {
    // Save filter state before navigating
    this.saveFilterState();

    this.router.navigate([
      '/donor-functions/special-donations/link-unit-to-special-donation',
      patient.patientId,
      patient.surgId
    ], { state: { patient } });
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
      patientName: 'PatientName',
      patientId: 'PatId',
      surgeryDate: 'SurgeryDate',
      neededBy: 'DateNeededBy',
      status: 'Status'
    };

    this.requestState = {
      ...this.requestState,
      sortColumn: event.direction === 'default' ? undefined : sortColumnMap[event.column],
      sortOrder: event.direction === 'default' ? undefined : (event.direction === 'A' ? 'ASC' : 'DESC')
    };

    this.loadData();
  }

  /**
   * Save current filter state to sessionStorage before navigation
   */
  private saveFilterState(): void {
    try {
      const filterState = {
        appliedFilters: this.appliedFilters,
        filterChips: this.filterChips,
        searchText: this.searchText,
        requestState: this.requestState,
        pagination: this.tableConfig.pagination ? {
          pageSize: this.tableConfig.pagination.pageSize,
          pageIndex: this.tableConfig.pagination.pageIndex
        } : null,
        sortConfig: this.tableConfig.sortConfig ? {
          column: this.tableConfig.sortConfig.column,
          direction: this.tableConfig.sortConfig.direction
        } : null
      };

      sessionStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filterState));
      console.log('💾 Filter state saved to sessionStorage:', filterState);
    } catch (error) {
      console.error('Failed to save filter state to sessionStorage:', error);
    }
  }

  /**
   * Restore filter state from sessionStorage on component initialization
   */
  private restoreFilterState(): void {
    try {
      const stored = sessionStorage.getItem(this.FILTER_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const filterState = JSON.parse(stored);
      console.log('🔄 Restoring filter state from sessionStorage:', filterState);

      // Restore filter values
      if (filterState.appliedFilters) {
        this.appliedFilters = filterState.appliedFilters;
      }

      if (filterState.filterChips) {
        this.filterChips = filterState.filterChips;
      }

      if (filterState.searchText !== undefined) {
        this.searchText = filterState.searchText;
      }

      if (filterState.requestState) {
        this.requestState = filterState.requestState;
      }

      // Restore pagination
      if (filterState.pagination && this.tableConfig.pagination) {
        this.tableConfig.pagination.pageSize = filterState.pagination.pageSize;
        this.tableConfig.pagination.pageIndex = filterState.pagination.pageIndex;
      }

      // Restore sorting
      if (filterState.sortConfig && this.tableConfig.sortConfig) {
        this.tableConfig.sortConfig.column = filterState.sortConfig.column;
        this.tableConfig.sortConfig.direction = filterState.sortConfig.direction;
      }

      // Clear sessionStorage after restoration to avoid stale data
      sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
      console.log('✅ Filter state restored and cleared from sessionStorage');
    } catch (error) {
      console.error('Failed to restore filter state from sessionStorage:', error);
      // Clear corrupted data
      sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
    }
  }

  /**
   * Clear filter state from sessionStorage
   */
  private clearFilterState(): void {
    try {
      sessionStorage.removeItem(this.FILTER_STORAGE_KEY);
      console.log('🗑️ Filter state cleared from sessionStorage');
    } catch (error) {
      console.error('Failed to clear filter state from sessionStorage:', error);
    }
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatSex(sex: string | null | undefined): string {
    if (!sex) return '-';
    return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex;
  }
}
