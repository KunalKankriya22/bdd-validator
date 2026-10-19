import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DateRangePairErrorStateMatcher } from '@shared/error-state-matchers/date-range-pair-error-state.matcher';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableRowActionEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { BoxDetailsService } from '../services/box-details.service';
import {
  BoxSearchResult,
  OpenBoxSearchResult,
  BoxSearchParams,
  BoxStatusFilter,
  BoxStatusCode,
  BoxReadyForShipment,
  ReadyForShipmentFilterValue,
} from '../models/box-details.model';
import { ReadyForShipmentFilterPanelComponent } from '../ready-for-shipment-filter-panel/ready-for-shipment-filter-panel';

@Component({
  selector: 'app-box-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './box-management.html',
  styleUrls: ['./box-management.scss'],
})
export class BoxManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableRef?: DataTable<BoxSearchResult>;
  @ViewChild('readyCard', { read: ElementRef }) readyCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly boxDetailsService = inject(BoxDetailsService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);

  private readonly destroy$ = new Subject<void>();
  private readonly cancelLoad$ = new Subject<void>(); // cancels in-flight loadData requests
  private overlayRef: OverlayRef | null = null;

  // Page header configuration - fully dynamic from menu
  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || '', link: null },
      ],
      title: pageData?.title || '',
      subtitle: pageData?.subtitle || '',
    };
  });

  // Signal-based state
  protected readonly boxes = signal<BoxSearchResult[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly totalRecords = signal<number>(0);
  protected readonly totalOpenBoxes = signal<number>(0);
  protected readonly activeTabIndex = signal<number>(0);

  // Ready for Shipment state
  protected readonly readyBoxes = signal<BoxReadyForShipment[]>([]);
  protected readonly readyLoading = signal<boolean>(false);
  protected readonly readyTotalRecords = signal<number>(0);

  protected readonly isReadyTab = computed(() => this.activeTabIndex() === 2);

  protected readonly dataLoadAnnouncement = computed(() => {
    if (!this.hasSearched() || this.loading()) return '';
    const count = this.totalRecords();
    return `${count} ${count === 1 ? 'box' : 'boxes'} found`;
  });

  protected readonly readyLoadAnnouncement = computed(() => {
    if (this.readyLoading()) return '';
    const count = this.readyTotalRecords();
    if (!count) return '';
    return `${count} ${count === 1 ? 'box' : 'boxes'} ready for shipment`;
  });

  // Filter state
  isFilterOpen = false;
  appliedFilters: ReadyForShipmentFilterValue | null = null;
  filterChips: FilterChip[] = [];

  availablePriorities: string[] = [];
  availableConsignees: string[] = [];
  availablePackedByUsers: string[] = [];

  // Form
  filterForm!: FormGroup;
  searchText = '';
  readySearchText = '';

  // Pagination (1-based for API) - Default 25
  private pageSize = 25;
  private pageNumber = 1;

  // Open Boxes sort state — direction matches data-table: 'A'=ASC, 'D'=DESC
  private openBoxesSortColumn: string | null = 'BoxId';
  private openBoxesSortOrder: 'A' | 'D' | null = 'D';

  // Ready for Shipment pagination
  private readyPageSize = 25;
  private readySkip = 0;
  private readySortOrder: 'ASC' | 'DESC' = 'ASC';

  // Table configuration
  tableConfig!: DataTableConfig<BoxSearchResult>;
  readyTableConfig!: DataTableConfig<BoxReadyForShipment>;

  // All Boxes columns — stored so applyTabColumns can restore them when switching away from Open Boxes
  private readonly allBoxesColumns: DataTableConfig<BoxSearchResult>['columns'] = [
    { key: 'boxId',              header: 'Box ID',       width: '130px', sortable: true },
    { key: 'status',             header: 'Status',       width: '80px',  sortable: false,
      valueFormatter: (value: string | null) => this.formatStatus(value) },
    { key: 'consigneeId',        header: 'Consignee ID', width: '130px', sortable: false },
    { key: 'consigneeName',      header: 'Consignee',    width: '200px', truncate: true, sortable: false },
    { key: 'boxTypeDescription', header: 'Box Type',     width: '90px',  sortable: false },
    { key: 'packedBy',           header: 'Packed by',    width: '90px',  sortable: false },
    { key: 'packedDate',         header: 'Pack Date',    width: '160px', sortable: false,
      valueFormatter: (value: string | null) =>
        value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '' },
  ];

  // Open Boxes columns (SHQOPBOX: Box ID, Warehouse, Customer Name, Customer Type, Order Class, Order Date, Pack Date, Packed by)
  private readonly openBoxesColumns: DataTableConfig<BoxSearchResult>['columns'] = [
    {
      key: 'boxId',
      header: 'Box ID',
      width: '130px',
      sortable: true,
    },
    {
      key: 'warehouseDescription',
      header: 'Warehouse',
      width: '160px',
      sortable: false,
    },
    {
      key: 'customerName',
      header: 'Customer Name',
      width: '200px',
      truncate: true,
      sortable: false,
    },
    {
      key: 'customerType',
      header: 'Customer Type',
      width: '130px',
      sortable: false,
    },
    {
      key: 'orderClass',
      header: 'Order Class',
      width: '130px',
      sortable: false,
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      width: '120px',
      sortable: false,
      valueFormatter: (value: string | null) =>
        value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '',
    },
    {
      key: 'packedDate',
      header: 'Pack Date',
      width: '160px',
      sortable: false,
      valueFormatter: (value: string | null) =>
        value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
    },
    {
      key: 'packedBy',
      header: 'Packed by',
      width: '100px',
      sortable: false,
    },
  ];
  searchConfig!: SearchBarConfig;
  readySearchConfig!: SearchBarConfig;

  readonly tabs: { label: string; status: BoxStatusFilter; apiStatus: BoxStatusCode | null }[] = [
    { label: 'All Boxes', status: 'all', apiStatus: null },
    { label: 'Open Boxes', status: 'open', apiStatus: 'O' },
    { label: 'Ready for Shipment', status: 'ready', apiStatus: 'RD' },
  ];

  // Max date for datepickers (chapter date - no future dates)
  maxDate: Moment = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  // Date filter to disable future dates
  dateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const chapterDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    return date.isSameOrBefore(chapterDate, 'day');
  };

  // Date range validation
  dateRangeErrorMatcher!: DateRangePairErrorStateMatcher;
  protected lastModifiedDateField = signal<'fromDate' | 'toDate' | null>(null);

  private filterOptionsLoaded = false;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        // Effect for page header updates
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const tabButtons = this.elementRef.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>;
      const panelIds = ['box-panel-open', 'box-panel-open', 'box-panel-ready'];
      tabButtons.forEach((btn: HTMLElement, i: number) => {
        if (panelIds[i]) btn.setAttribute('aria-controls', panelIds[i]);
      });
    }, 0);
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToFilterChanges();
    this.initTableConfig();
    this.initReadyTableConfig();
    this.initSearchConfig();
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.cancelLoad$.next();
    this.cancelLoad$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      showDiscardAndMfgCustomer: [false],
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')],
    });

    this.dateRangeErrorMatcher = new DateRangePairErrorStateMatcher(() => this.filterForm);

    this.filterForm.get('fromDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastModifiedDateField.set('fromDate'));

    this.filterForm.get('toDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastModifiedDateField.set('toDate'));
  }

  // Explicit filter-change handler — called directly from (selectionChange) / (closed) events.
  // More reliable than valueChanges for mat-select and mat-datepicker in Angular Material.
  onFilterChange(): void {
    this.pageNumber = 1;
    this.loadData();
  }

  // No-op kept for ngOnInit call — subscriptions replaced by direct event bindings
  private subscribeToFilterChanges(): void { }


  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'boxId',
          header: 'Box ID',
          width: '130px',
          sortable: true,
        },
        {
          key: 'status',
          header: 'Status',
          width: '80px',
          sortable: false,
          valueFormatter: (value: string | null) => this.formatStatus(value),
        },
        {
          key: 'consigneeId',
          header: 'Consignee ID',
          width: '130px',
          sortable: false,
        },
        {
          key: 'consigneeName',
          header: 'Consignee',
          width: '200px',
          truncate: true,
          sortable: false,
        },
        {
          key: 'boxTypeDescription',
          header: 'Box Type',
          width: '90px',
          sortable: false,
        },
        {
          key: 'packedBy',
          header: 'Packed by',
          width: '90px',
          sortable: false,
        },
        {
          key: 'packedDate',
          header: 'Pack Date',
          width: '160px',
          sortable: false,
          valueFormatter: (value: string | null) =>
            value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
        },
      ],
      rowActions: [
        {
          icon: 'visibility',
          action: 'view',
          ariaLabel: 'View box details',
          visible: () => true,
        },
      ],
      pagination: {
        pageSize: this.pageSize,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      sortConfig: {
        column: 'boxId',
        direction: 'D',
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      showPagination: true,
      showTableOnEmpty: true,
      noDataIcon: 'search',
      emptyMessage: 'Search results will display here.',
      loadingMessage: 'Loading boxes...',
      enableRowHighlight: true,
      showActionsAsMenu: false,
    };
  }

  private initReadyTableConfig(): void {
    this.readyTableConfig = {
      columns: [
        {
          key: 'boxId',
          header: 'Box ID',
          width: '110px',
          sortable: true,
        },
        {
          key: 'priority',
          header: 'Priority',
          width: '90px',
          sortable: false,
        },
        {
          key: 'consigneeName',
          header: 'Consignee',
          width: '170px',
          truncate: true,
          sortable: false,
        },
        {
          key: 'estArrivalTime',
          header: 'Est. Arrival Time',
          width: '155px',
          sortable: false,
          valueFormatter: (value: string | null) =>
            value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
        },
        {
          key: 'orderNo',
          header: 'Order',
          width: '100px',
          sortable: false,
        },
        {
          key: 'boxType',
          header: 'Box Type',
          width: '90px',
          sortable: false,
        },
        {
          key: 'packedByName',
          header: 'Packed by',
          width: '100px',
          sortable: false,
        },
        {
          key: 'closedDate',
          header: 'Close Date',
          width: '155px',
          sortable: false,
          valueFormatter: (value: string | null) =>
            value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
        },
      ],
      pagination: {
        pageSize: this.readyPageSize,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      showPagination: true,
      showTableOnEmpty: true,
      emptyMessage: 'No boxes ready for shipment',
      emptySubMessage: 'There are currently no closed boxes awaiting shipment assignment',
      noDataIcon: 'local_shipping',
      loadingMessage: 'Loading boxes ready for shipment...',
      enableRowHighlight: true,
      showActionsAsMenu: false,
    };
  }

  private initSearchConfig(): void {
    this.searchConfig = {
      placeholder: 'Search By Box ID',
      minLength: 1,
      searchOnEnterOnly: true,
      alwaysShowTooltip: true,
    };

    this.readySearchConfig = {
      placeholder: 'Search by box ID',
      minLength: 1,
      searchOnEnterOnly: true,
      alwaysShowTooltip: true,
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetAndReload();
      });
  }

  private resetAndReload(): void {
    this.boxes.set([]);
    this.totalRecords.set(0);
    this.pageNumber = 1;
    this.searchText = '';
    this.hasSearched.set(false);
    this.openBoxesSortColumn = 'BoxId';
    this.openBoxesSortOrder = 'D';
    this.initForm();

    this.readyBoxes.set([]);
    this.readyTotalRecords.set(0);
    this.readySkip = 0;
    this.readySearchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.filterOptionsLoaded = false;

    if (this.isReadyTab()) {
      this.loadReadyForShipmentData();
    } else {
      this.loadData();
    }
  }

  protected loadData(): void {
    // Cancel any in-flight previous loadData request to prevent race conditions
    this.cancelLoad$.next();
    this.loading.set(true);
    this.hasSearched.set(true);

    const formValue = this.filterForm.value;
    const currentTab = this.tabs[this.activeTabIndex()];

    const params: BoxSearchParams = {
      fromDate: formValue.fromDate ? moment(formValue.fromDate).format('YYYY-MM-DD') : undefined,
      toDate: formValue.toDate ? moment(formValue.toDate).format('YYYY-MM-DD') : undefined,
      status: currentTab.apiStatus,
      searchTerm: this.searchText || undefined,
      showDiscardAndMfgCustomer: formValue.showDiscardAndMfgCustomer || false,
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      sortColumn: this.openBoxesSortColumn ?? undefined,
      sortOrder: this.openBoxesSortOrder === 'A' ? 'ASC' : this.openBoxesSortOrder === 'D' ? 'DESC' : undefined,
    };

    const isOpenBoxes = this.activeTabIndex() === 1;

    if (isOpenBoxes) {
      // Open Boxes — dedicated SHQOPBOX endpoint (status='OP', warehouse filter, customer/order-class lookups)
      this.boxDetailsService
        .searchOpenBoxes(params)
        .pipe(takeUntil(this.destroy$), takeUntil(this.cancelLoad$))
        .subscribe({
          next: (data) => {
            const items = (data?.items || []).map((r: OpenBoxSearchResult) => ({
              boxId:                r.boxId,
              status:               null,  // Open Boxes uses dedicated columns — status column not shown
              warehouseId:          r.warehouseId,
              warehouseDescription: r.warehouseDescription,
              customerName:         r.customerName,
              customerType:         r.customerType,
              orderClass:           r.orderClass,
              orderDate:            r.orderDate,
              packedDate:           r.packedDate,
              packedBy:             r.packedBy,
              // unused fields for All/RD compatibility
              consigneeId: null, consigneeName: null, boxType: null,
              boxTypeDescription: null, customerId: null, creationDate: r.orderDate ?? '',
            } as BoxSearchResult));
            this.boxes.set(items);
            this.totalRecords.set(data?.totalCount ?? items.length);
            this.totalOpenBoxes.set(data?.totalOpenBoxes ?? 0);
            this.updateTablePagination();
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error loading open boxes:', error);
            this.snackbarService.showError('Failed to load open boxes. Please try again.');
            this.boxes.set([]);
            this.totalRecords.set(0);
            this.loading.set(false);
          },
        });
    } else {
      // All Boxes / Ready for Shipment — existing endpoint unchanged
      this.boxDetailsService
        .searchBoxes(params)
        .pipe(takeUntil(this.destroy$), takeUntil(this.cancelLoad$))
        .subscribe({
          next: (response) => {
            const items = response.data?.items || [];
            this.boxes.set(items);
            const total = response.data?.totalCount ?? items.length;
            this.totalRecords.set(total);
            this.updateTablePagination();
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error loading boxes:', error);
            this.snackbarService.showError('Failed to load boxes. Please try again.');
            this.boxes.set([]);
            this.totalRecords.set(0);
            this.loading.set(false);
          },
        });
    }
  }

  protected loadReadyForShipmentData(): void {
    this.readyLoading.set(true);

    if (!this.filterOptionsLoaded) {
      this.loadFilterOptions();
    }

    const take = Math.min(100, Math.max(1, this.readyPageSize));

    this.boxDetailsService
      .getBoxesReadyForShipment({
        sortOrder: this.readySortOrder,
        take,
        skip: this.readySkip,
        searchTerm: this.readySearchText || null,
        priority: this.appliedFilters?.priority || null,
        consigneeName: this.appliedFilters?.consignee || null,
        packedByName: this.appliedFilters?.packedBy || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data || [];
          const total = response.totalCount || 0;
          this.readyBoxes.set(data);
          this.readyTotalRecords.set(total);
          this.updateReadyTablePagination(total);
          this.updateBoxIdColumnHeader(total);
          this.readyLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading boxes ready for shipment:', error);
          this.snackbarService.showError('Failed to load boxes ready for shipment. Please try again.');
          this.readyBoxes.set([]);
          this.readyTotalRecords.set(0);
          this.updateReadyTablePagination(0);
          this.updateBoxIdColumnHeader(0);
          this.readyLoading.set(false);
        },
      });
  }

  private loadFilterOptions(): void {
    const priorities = new Set<string>();
    const consignees = new Set<string>();
    const packedByUsers = new Set<string>();

    const fetchPage = (skip: number): void => {
      this.boxDetailsService
        .getBoxesReadyForShipment({
          sortOrder: 'ASC',
          take: 100,
          skip,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const boxes = response.data || [];

            boxes.forEach((box) => {
              if (box.priority) priorities.add(box.priority);
              if (box.consigneeName) consignees.add(box.consigneeName);
              if (box.packedByName) packedByUsers.add(box.packedByName);
            });

            if (boxes.length === 100) {
              fetchPage(skip + 100);
            } else {
              this.availablePriorities = [...priorities].sort();
              this.availableConsignees = [...consignees].sort();
              this.availablePackedByUsers = [...packedByUsers].sort();
              this.filterOptionsLoaded = true;
            }
          },
          error: (error) => {
            console.error('Error loading filter options:', error);
            this.filterOptionsLoaded = false;
          },
        });
    };

    fetchPage(0);
  }

  private updateBoxIdColumnHeader(totalCount: number): void {
    this.readyTableConfig = {
      ...this.readyTableConfig,
      columns: this.readyTableConfig.columns.map((col) =>
        col.key === 'boxId'
          ? { ...col, header: `Box ID (${totalCount})` }
          : col
      ),
    };
  }

  private updateTablePagination(): void {
    if (this.tableConfig.pagination) {
      const isOpenBoxes = this.activeTabIndex() === 1;
      const updatedColumns = isOpenBoxes
        ? this.openBoxesColumns.map(col =>
            col.key === 'boxId'
              ? { ...col, header: `Box ID (${this.totalRecords()})` }
              : col
          )
        : this.tableConfig.columns;
      this.tableConfig = {
        ...this.tableConfig,
        columns: updatedColumns,
        pagination: {
          ...this.tableConfig.pagination,
          totalRecords: this.totalRecords(),
          pageIndex: this.pageNumber - 1,
          pageSize: this.pageSize,
        },
      };
    }
  }

  private updateReadyTablePagination(total: number): void {
    this.readyTableConfig = {
      ...this.readyTableConfig,
      pagination: {
        ...this.readyTableConfig.pagination!,
        totalRecords: total,
        pageIndex: Math.floor(this.readySkip / this.readyPageSize),
        pageSize: this.readyPageSize,
      },
    };
  }

  private formatStatus(status: string | null): string {
    if (!status) return '';
    const statusMap: Record<string, string> = {
      'O': 'Open',
      'OP': 'Open',
      'CL': 'Closed',
      'RD': 'Ready',
      'PK': 'Packed',
      'AV': 'Available',
      'SH': 'Shipped',
      'DL': 'Delivered',
    };
    return statusMap[status] || status;
  }

  // --- Tab ---

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
    this.pageNumber = 1;
    this.closeFilterOverlay();
    this.applyTabColumns(index);
    // Clear stale data immediately so previous tab's rows don't flash with new columns
    this.boxes.set([]);
    this.totalRecords.set(0);
    this.totalOpenBoxes.set(0);
    this.openBoxesSortColumn = 'BoxId';
    this.openBoxesSortOrder  = 'D';
    this.tableConfig = { ...this.tableConfig, sortConfig: { column: 'boxId', direction: 'D' } };

    if (index === 2) {
      this.readySkip = 0;
      this.readySearchText = '';
      this.readySortOrder = 'ASC';
      this.appliedFilters = null;
      this.filterChips = [];
      this.filterOptionsLoaded = false;
      this.loadReadyForShipmentData();
    } else {
      this.loadData();
    }
  }

  private applyTabColumns(index: number): void {
    const isOpenBoxes = index === 1;
    this.tableConfig = {
      ...this.tableConfig,
      columns: isOpenBoxes ? this.openBoxesColumns : this.allBoxesColumns,
    };
  }

  onRetrieve(): void {
    this.pageNumber = 1;
    this.loadData();
  }

  onSearch(searchText: string): void {
    this.searchText = searchText?.trim() || '';
    this.pageNumber = 1;
    this.loadData();
  }

  onReadySearch(searchText: string): void {
    this.readySearchText = searchText?.trim() || '';
    this.readySkip = 0;
    this.loadReadyForShipmentData();
  }

  onClearFilters(): void {
    // Reset values only — do NOT recreate form (that would duplicate subscriptions)
    this.filterForm.patchValue({ fromDate: null, toDate: null, showDiscardAndMfgCustomer: false }, { emitEvent: false });
    this.searchText = '';
    this.pageNumber = 1;
    if (this.searchBarComponent) {
      this.searchBarComponent.clearSearch();
    }
    this.loadData();
  }

  // --- Filter (Ready for Shipment) via CDK Overlay ---

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    if (!this.filterOptionsLoaded) {
      this.loadFilterOptions();
    }

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -4,
        },
      ])
      .withFlexibleDimensions(true)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 380,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(ReadyForShipmentFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    setTimeout(() => {
      const firstFocusable = this.overlayRef
        ?.overlayElement
        ?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }, 0);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.priorities = this.availablePriorities;
    componentRef.instance.consignees = this.availableConsignees;
    componentRef.instance.packedByUsers = this.availablePackedByUsers;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.applyReadyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      this.filterBtn?.nativeElement?.focus();
    }
  }

  private applyReadyFilters(filters: ReadyForShipmentFilterValue): void {
    const hasAnyValue = filters.priority || filters.consignee || filters.packedBy;
    this.appliedFilters = hasAnyValue ? filters : null;
    this.filterChips = this.convertFiltersToChips(filters);
    this.readySkip = 0;
    this.loadReadyForShipmentData();
  }

  hasActiveFilters(): boolean {
    if (!this.appliedFilters) return false;
    return !!(this.appliedFilters.priority || this.appliedFilters.consignee || this.appliedFilters.packedBy);
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    const updated = { ...this.appliedFilters, [chipKey]: null };
    const hasAnyValue = updated.priority || updated.consignee || updated.packedBy;
    this.appliedFilters = hasAnyValue ? updated : null;
    this.filterChips = this.appliedFilters
      ? this.convertFiltersToChips(this.appliedFilters)
      : [];
    this.readySkip = 0;
    this.loadReadyForShipmentData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.readySkip = 0;
    this.loadReadyForShipmentData();
  }

  private convertFiltersToChips(filters: ReadyForShipmentFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.priority) {
      chips.push({
        key: 'priority',
        label: `Priority: ${filters.priority}`,
        value: filters.priority,
      });
    }

    if (filters.consignee) {
      chips.push({
        key: 'consignee',
        label: `Consignee: ${filters.consignee}`,
        value: filters.consignee,
      });
    }

    if (filters.packedBy) {
      chips.push({
        key: 'packedBy',
        label: `Packed By: ${filters.packedBy}`,
        value: filters.packedBy,
      });
    }

    return chips;
  }

  // --- Pagination ---

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageIndex + 1;
    this.loadData();
  }

  onOpenBoxesSortChange(event: TableSortEvent): void {
    const isActive = event.direction === 'A' || event.direction === 'D';
    this.openBoxesSortColumn = isActive ? 'BoxId' : null;
    this.openBoxesSortOrder  = isActive ? (event.direction as 'A' | 'D') : null;
    // Update sortConfig so data-table shows correct sort icon
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: isActive ? { column: event.column, direction: event.direction as 'A' | 'D' } : undefined,
    };
    this.pageNumber = 1;
    this.loadData();
  }

  onReadyPageChange(event: TablePageEvent): void {
    this.readyPageSize = event.pageSize;
    this.readySkip = event.pageIndex * event.pageSize;
    this.loadReadyForShipmentData();
  }

  onReadySortChange(event: TableSortEvent): void {
    this.readySortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.readySkip = 0;
    this.readyTableConfig = {
      ...this.readyTableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction,
      },
    };
    this.loadReadyForShipmentData();
  }

  onRowAction(event: TableRowActionEvent<BoxSearchResult>): void {
    if (event.action === 'view') {
      this.navigateToDetails(event.row);
    }
  }

  private navigateToDetails(box: BoxSearchResult): void {
    this.router.navigate(['/distribution/box-details', box.boxId]);
  }

  // Date validation handlers
  onDateInputChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.filterForm.get(controlName);
    if (!control) return;

    const trimmedInput = input.value?.trim();
    if (!trimmedInput) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      return;
    }

    const parsedDate = moment(trimmedInput, ['DD-MMM-YYYY', 'DD/MMM/YYYY', 'DD-MM-YYYY', 'DD/MM/YYYY'], true);
    if (!parsedDate.isValid()) {
      control.setErrors({ ...control.errors, invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  onDateBlur(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.filterForm.get(controlName);
    if (!control) return;

    const trimmedInput = input.value?.trim();
    if (trimmedInput && !control.value) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'From Date is invalid';
    }

    if (this.filterForm.errors?.['dateRangeInvalid'] && this.lastModifiedDateField() === 'fromDate') {
      return 'From Date cannot be after To Date';
    }

    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'To Date is invalid';
    }

    if (this.filterForm.errors?.['dateRangeInvalid'] && this.lastModifiedDateField() !== 'fromDate') {
      return 'To Date must be on or after From Date';
    }

    return '';
  }

  get isRetrieveDisabled(): boolean {
    const fromDateControl = this.filterForm.get('fromDate');
    const toDateControl = this.filterForm.get('toDate');

    const hasFromDateError = fromDateControl?.hasError('matDatepickerParse') ||
      fromDateControl?.hasError('invalidDateFormat') ||
      fromDateControl?.hasError('invalidDate');

    const hasToDateError = toDateControl?.hasError('matDatepickerParse') ||
      toDateControl?.hasError('invalidDateFormat') ||
      toDateControl?.hasError('invalidDate');

    const hasDateRangeError = this.filterForm.errors?.['dateRangeInvalid'];

    return hasFromDateError || hasToDateError || hasDateRangeError;
  }

  get f() {
    return this.filterForm.controls;
  }
}
