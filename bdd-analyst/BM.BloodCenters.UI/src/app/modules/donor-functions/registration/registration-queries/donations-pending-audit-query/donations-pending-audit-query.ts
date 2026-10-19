import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, AbstractControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PendingAuditFilterChipsUtils } from '../shared/utils/pending-audit-filter-chips.utils';
import { PendingAuditFilterValue } from '../shared/models/pending-audit-query.model';

import { DonationsPendingAuditQueryService } from './services/donations-pending-audit-query.service';
import {
  DonationsPendingAuditDto,
  DonationsPendingAuditQueryDto,
  DriveOption,
  StatusOption,
  DonationTypeOption,
  ProcedureCodeOption
} from './models/donations-pending-audit-query.model';

@Component({
  selector: 'app-donations-pending-audit-query',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterPanelBase,
    FilterChips
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './donations-pending-audit-query.html',
  styleUrls: ['./donations-pending-audit-query.scss']
})
export class DonationsPendingAuditQuery implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<DonationsPendingAuditDto>;
  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DonationsPendingAuditQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  filterForm!: FormGroup;

  readonly driveOptions = signal<DriveOption[]>([]);
  readonly donationTypeOptions = signal<DonationTypeOption[]>([]);
  readonly procedureCodeOptions = signal<ProcedureCodeOption[]>([]);
  readonly statusOptions = signal<StatusOption[]>([
    { code: 'A', description: 'All' },
    { code: 'R', description: 'Ready for Audit' },
    { code: 'N', description: 'No Donor' }
  ]);

  allData: DonationsPendingAuditDto[] = [];
  dataSource: DonationsPendingAuditDto[] = [];
  totalFound = 0;
  searchKeyword = '';

  maxDate: moment.Moment = this.chapterTimezoneService.getChapterLocalDate();
  isLoadingData = false;
  isLoadingDrives = false;
  hasRetrievedData = false;
  showEmptyState = true;
  showFilterPanel = false;
  filterPanelTop = 0;
  filterPanelLeft = 0;

  // Filter form
  filterPanelForm!: FormGroup;

  // Applied filters
  appliedDonationType: string | null = null;
  appliedProcedureCode: string | null = null;
  appliedFilters: PendingAuditFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Drive ID or Donor ID',
    minLength: 2,
    ariaLabel: 'Search donations pending audit',
    searchOnEnterOnly: true
  };

  // Dropdown search
  readonly driveSearchControl = new FormControl('');
  readonly donationTypeSearchControl = new FormControl('');
  readonly procedureCodeSearchControl = new FormControl('');
  readonly driveSearch = signal('');
  readonly donationTypeSearch = signal('');
  readonly procedureCodeSearch = signal('');

  readonly filteredDrives = computed(() => {
    const search = this.driveSearch().toLowerCase();
    const options = this.driveOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.driveId || '').toLowerCase().includes(search) ||
      (o.sponsorName || '').toLowerCase().includes(search)
    );
  });

  readonly filteredDonationTypes = computed(() => {
    const search = this.donationTypeSearch().toLowerCase();
    const options = this.donationTypeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.value || '').toLowerCase().includes(search) ||
      (o.label || '').toLowerCase().includes(search)
    );
  });

  readonly filteredProcedureCodes = computed(() => {
    const search = this.procedureCodeSearch().toLowerCase();
    const options = this.procedureCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.value || '').toLowerCase().includes(search) ||
      (o.label || '').toLowerCase().includes(search)
    );
  });

  // Check if retrieve button should be disabled
  get isRetrieveDisabled(): boolean {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const driveId = this.filterForm.get('driveId')?.value;

    // RETRIEVE is enabled if:
    // 1. Both dates are filled, OR
    // 2. Drive ID is selected (dates are optional per FMB)
    const hasDateRange = fromDate && toDate;
    const hasDriveId = driveId && driveId.trim() !== '';

    // Disable during loading or if no criteria selected
    return !(hasDateRange || hasDriveId) || this.isLoadingData || this.isLoadingDrives;
  }

  // Check if clear all button should be disabled
  get isClearDisabled(): boolean {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const driveId = this.filterForm.get('driveId')?.value;
    const status = this.filterForm.get('status')?.value;

    // CLEAR ALL is enabled if:
    // 1. Any filter is set (dates, drive ID), OR
    // 2. Status is not default ('R'), OR
    // 3. Data has been retrieved, OR
    // 4. Advanced filters are applied
    const hasAnyFilter = fromDate || toDate || (driveId && driveId.trim() !== '');
    const hasNonDefaultStatus = status !== 'R';
    const hasAdvancedFilters = this.appliedDonationType || this.appliedProcedureCode || this.searchKeyword;

    return !(hasAnyFilter || hasNonDefaultStatus || this.hasRetrievedData || hasAdvancedFilters);
  }

  tableConfig: DataTableConfig<DonationsPendingAuditDto> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        type: 'text',
        minWidth: '160px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: false,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) =>
          value ? DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--' : '--'
      },
      {
        key: 'donorId',
        header: 'Donor ID',
        sortable: false,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: false,
        type: 'text',
        minWidth: '100px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        sortable: false,
        type: 'text',
        minWidth: '110px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'insertUser',
        header: 'User',
        sortable: false,
        type: 'text',
        minWidth: '90px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'insertDate',
        header: 'Inserted Date',
        sortable: false,
        type: 'text',
        minWidth: '180px',
        valueFormatter: (value: string | null) => {
          if (!value) return '--';
          const d = new Date(value);
          const dateStr = DateFieldValidationUtility.formatDateForUI(d) || '';
          const hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h = hours % 12 || 12;
          return `${dateStr}, ${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        }
      }
    ],
    rowActions: [
      { label: 'Donation Entry Details', action: 'entryDetails' },
      { label: 'Audit Donation', action: 'auditDonation' }
    ],
    showActionsAsMenu: true,
    enableRowHighlight: false,
    stickyHeader: true,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    sortConfig: { column: 'unitId', direction: 'D' },
    sortIconMap: { default: 'arrow_downward' },
    emptyMessage: 'No donations pending audit found',
    loadingMessage: 'Loading donations...'
  };

  constructor() {
    this.initializeForm();
    this.initializeFilterPanelForm();

    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveSearch.set(value || ''));

    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donationTypeSearch.set(value || ''));

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.procedureCodeSearch.set(value || ''));

    // Subscribe to date changes for validation and drives reload
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDates();
        this.reloadDrivesOnDateChange();
      });

    this.filterForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDates();
        this.reloadDrivesOnDateChange();
      });

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

    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid()) {
        this.maxDate = chapterDate.clone().startOf('day');
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    // Load drives initially without date parameters - backend applies default 30-day range
    this.loadDrives();

    // Check if returning from Audit Donation with search state
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['searchFromDate'] || params['searchDriveId']) {
        // Restore form values
        if (params['searchFromDate']) {
          this.filterForm.patchValue({
            fromDate: moment(params['searchFromDate'])
          });
        }
        if (params['searchToDate']) {
          this.filterForm.patchValue({
            toDate: moment(params['searchToDate'])
          });
        }
        if (params['searchDriveId']) {
          this.filterForm.patchValue({
            driveId: params['searchDriveId']
          });
        }
        if (params['searchStatus']) {
          this.filterForm.patchValue({
            status: params['searchStatus']
          });
        }

        // Restore applied filters
        this.appliedDonationType = params['searchDonationType'] || null;
        this.appliedProcedureCode = params['searchProcedureCode'] || null;
        this.searchKeyword = params['searchKeyword'] || null;

        // Auto-retrieve with restored state
        setTimeout(() => {
          this.onRetrieve();
        }, 500);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      driveId: [''],
      status: ['R']
    });
  }

  private initializeFilterPanelForm(): void {
    this.filterPanelForm = this.fb.group({
      donationType: [null],
      procedureCode: [null]
    });
  }

  private setDefaultDates(): void {
    const chapterDate = this.getChapterCurrentDate();
    const defaultFromDate = moment(chapterDate).subtract(25, 'days');

    this.filterForm.patchValue({
      fromDate: defaultFromDate,
      toDate: moment(chapterDate)
    });
  }

  private getChapterCurrentDate(): Date {
    const chapterMoment = this.chapterTimezoneService.getChapterLocalDate();
    return chapterMoment.toDate();
  }

  private loadDrives(fromDate?: string | null, toDate?: string | null): void {
    this.isLoadingDrives = true;

    this.service.getDrivesDropdown(fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.driveOptions.set(result.data || []);
          this.isLoadingDrives = false;
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to load drives'));
          this.isLoadingDrives = false;
          this.driveOptions.set([]);
        }
      });
  }

  private reloadDrivesOnDateChange(): void {
    const fromControl = this.filterForm.get('fromDate');
    const toControl = this.filterForm.get('toDate');

    // Only reload if both dates are filled and have no validation errors
    if (fromControl?.value && toControl?.value &&
        !fromControl.errors && !toControl.errors) {
      this.filterForm.patchValue({ driveId: '' }, { emitEvent: false });
      const fromDate = DateFieldValidationUtility.serializeDateForApi(fromControl.value);
      const toDate = DateFieldValidationUtility.serializeDateForApi(toControl.value);
      this.loadDrives(fromDate, toDate);
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataSource = [];
        this.allData = [];
        this.totalFound = 0;
        this.hasRetrievedData = false;
        this.showEmptyState = true;
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = 0;
        }
        // Clear dates and drives
        this.filterForm.patchValue({
          fromDate: null,
          toDate: null
        });
        this.driveOptions.set([]);
      });
  }

  onRetrieve(): void {
    const formValue = this.filterForm.getRawValue();

    // Validate: either dates are filled OR drive ID is selected (per FMB - all are optional with NVL)
    const hasDateRange = formValue.fromDate && formValue.toDate;
    const hasDriveId = formValue.driveId && formValue.driveId.trim() !== '';

    // Check partial date entry FIRST (more specific case) – if the user started entering
    // a date range but only filled one side, always require both regardless of driveId.
    if ((formValue.fromDate && !formValue.toDate) || (!formValue.fromDate && formValue.toDate)) {
      this.showError('Both From Date and To Date are required when using date filters');
      this.filterForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // If no dates and no drive ID, ask the user to supply at least one filter.
    if (!hasDateRange && !hasDriveId) {
      this.showError('Please select a date range or Drive ID to retrieve');
      return;
    }

    // Focus first invalid field if form has validation errors
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.isLoadingData = true;
    this.showEmptyState = false;

    // Get pagination values (default to page 1 if this is a new retrieve)
    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    const request: DonationsPendingAuditQueryDto = {
      fromDate: formValue.fromDate ? DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) : null,
      toDate: formValue.toDate ? DateFieldValidationUtility.serializeDateForApi(formValue.toDate) : null,
      driveId: formValue.driveId || null,
      donationType: this.appliedDonationType || null,
      procedureCode: this.appliedProcedureCode || null,
      searchKeyword: this.searchKeyword || null,
      status: formValue.status,
      sortColumn: this.tableConfig.sortConfig?.column || 'unitId',
      sortOrder: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' : 'DESC',
      take: take,
      skip: skip
    };

    this.service.searchDonationsPendingAudit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data?.resp || [];
          this.dataSource = this.allData;
          this.totalFound = response.totalCount || 0;

          // Update donation types and procedure codes from search response
          this.donationTypeOptions.set(response.data?.donationType || []);
          this.procedureCodeOptions.set(response.data?.procedureCode || []);

          // Update pagination total records from API response
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = this.totalFound;
          }

          this.hasRetrievedData = true;
          this.isLoadingData = false;

          if (this.dataSource.length === 0) {
            this.showInfo('No donations pending audit found');
          }
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to retrieve donations'));
          this.isLoadingData = false;
          this.dataSource = [];
          this.totalFound = 0;

          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
        }
      });
  }

  onSearch(keyword: string): void {
    this.searchKeyword = keyword || '';

    // Reset pagination when searching
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Search keyword will be sent to server on retrieve
    // Server searches in Drive ID and Donor ID only
    this.onRetrieve();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    // Re-fetch data with new sort order
    this.onRetrieve();
  }

  onPageChange(event: TablePageEvent): void {
    // Update pagination config and refetch data from server
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }

    // Fetch new page from server (maintains current search keyword and filters)
    this.onRetrieve();
  }

  onRowAction(event: TableRowActionEvent<DonationsPendingAuditDto>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'entryDetails') {
      if (!event.row.unitId) return;
      this.dialog.open(DonationEntryDetailsDialogComponent, {
        width: '1000px',
        height: '90vh',
        maxWidth: '100vw',
        maxHeight: '90vh',
        data: { unitId: event.row.unitId },
        disableClose: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0', top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop'
      });
    } else if (event.action === 'auditDonation') {
      if (!event.row.unitId) return;

      // Build returnUrl with current URL and query params
      const returnUrl = this.router.url;
      const formValue = this.filterForm.getRawValue();

      // Pass search state via queryParams to restore on back navigation
      this.router.navigate([ROUTE_REGISTRY[RouteKey.AuditDonation].path], {
        queryParams: {
          returnUrl,
          unitId: event.row.unitId,
          collectionDate: event.row.collDate,
          // Pass search state
          searchFromDate: formValue.fromDate ? DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) : null,
          searchToDate: formValue.toDate ? DateFieldValidationUtility.serializeDateForApi(formValue.toDate) : null,
          searchDriveId: formValue.driveId || null,
          searchStatus: formValue.status || null,
          searchDonationType: this.appliedDonationType || null,
          searchProcedureCode: this.appliedProcedureCode || null,
          searchKeyword: this.searchKeyword || null
        }
      });
    }
  }

  onClearAll(): void {
    // Clear dates to null instead of setting defaults
    this.filterForm.patchValue({
      fromDate: null,
      toDate: null,
      driveId: '',
      status: 'R'
    });
    this.dataSource = [];
    this.allData = [];
    this.totalFound = 0;
    this.searchKeyword = '';
    this.hasRetrievedData = false;
    this.showEmptyState = true;

    // Clear applied filters
    this.appliedDonationType = null;
    this.appliedProcedureCode = null;
    this.filterPanelForm.reset({
      donationType: null,
      procedureCode: null
    });

    // Clear dropdown search controls
    this.driveSearchControl.setValue('');
    this.donationTypeSearchControl.setValue('');
    this.procedureCodeSearchControl.setValue('');

    // Reload drives with default 30-day range (instead of clearing)
    this.loadDrives();

    // Reset pagination to defaults
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.pageSize = 25;
      this.tableConfig.pagination.totalRecords = 0;
    }
  }

  onOpenFilterPanel(): void {
    // Populate filter panel form with current applied filters
    this.filterPanelForm.patchValue({
      donationType: this.appliedDonationType,
      procedureCode: this.appliedProcedureCode
    });

    // Calculate filter panel position
    if (this.filterButtonRef) {
      const buttonElement = this.filterButtonRef.nativeElement;
      const rect = buttonElement.getBoundingClientRect();
      this.filterPanelTop = rect.bottom + 8; // 8px gap below button
      this.filterPanelLeft = rect.left;
    }

    this.showFilterPanel = true;
  }

  onCloseFilterPanel(): void {
    this.showFilterPanel = false;
  }

  onApplyFilters(): void {
    const formValue = this.filterPanelForm.value;
    this.appliedDonationType = formValue.donationType || null;
    this.appliedProcedureCode = formValue.procedureCode || null;

    // Update applied filters and chips
    this.appliedFilters = {
      donationType: this.appliedDonationType,
      procedureCode: this.appliedProcedureCode
    };
    this.filterChips = PendingAuditFilterChipsUtils.toFilterChips(
      this.appliedFilters,
      this.donationTypeOptions(),
      this.procedureCodeOptions()
    );

    this.showFilterPanel = false;

    // Reset pagination when filters change
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Only trigger retrieve if data has been retrieved before
    if (this.hasRetrievedData) {
      this.onRetrieve();
    }
  }

  onClearFilters(): void {
    this.filterPanelForm.reset({
      donationType: null,
      procedureCode: null
    });
    this.donationTypeSearchControl.reset();
    this.procedureCodeSearchControl.reset();
  }

  get hasActiveFilters(): boolean {
    return !!(this.appliedDonationType || this.appliedProcedureCode);
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = PendingAuditFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );

    // Update form and applied values
    this.appliedDonationType = updatedFilters.donationType;
    this.appliedProcedureCode = updatedFilters.procedureCode;
    this.appliedFilters = updatedFilters;

    // Update chips
    this.filterChips = PendingAuditFilterChipsUtils.toFilterChips(
      updatedFilters,
      this.donationTypeOptions(),
      this.procedureCodeOptions()
    );

    // Update filter panel form
    this.filterPanelForm.patchValue({
      donationType: updatedFilters.donationType,
      procedureCode: updatedFilters.procedureCode
    });

    // Reset pagination and reload data
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.onRetrieve();
    }
  }

  clearAllFilters(): void {
    const clearedFilters = PendingAuditFilterChipsUtils.clearAll();

    this.appliedDonationType = null;
    this.appliedProcedureCode = null;
    this.appliedFilters = clearedFilters;
    this.filterChips = [];

    // Update filter panel form
    this.filterPanelForm.patchValue({
      donationType: null,
      procedureCode: null
    });

    // Reset pagination and reload data
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.onRetrieve();
    }
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterPanelForm.value;
    const hasNoSelection = !formValue.donationType && !formValue.procedureCode;
    const hasAppliedFilters = !!(this.appliedDonationType || this.appliedProcedureCode);
    return hasNoSelection && !hasAppliedFilters;
  }

  onDriveSelectOpenedChange(isOpen: boolean): void {
    if (!isOpen) {
      this.driveSearchControl.setValue('');
    }
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate')
    );
  }

  private validateDates(): void {
    const fromControl = this.filterForm.get('fromDate');
    const toControl = this.filterForm.get('toDate');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const todayStr = chapterToday.format('YYYY-MM-DD');

    // Conditional required validation - if one date is filled, the other becomes required
    if (from && !to) {
      this.addDateError(toControl, 'required');
    }
    if (to && !from) {
      this.addDateError(fromControl, 'required');
    }

    // Check if fromDate is in the future
    if (from) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      if (fromStr && fromStr > todayStr) {
        this.addDateError(fromControl, 'futureDate');
      }
    }

    // Check if toDate is in the future
    if (to) {
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (toStr && toStr > todayStr) {
        this.addDateError(toControl, 'futureDate');
      }
    }

    // Check if fromDate is after toDate (Oracle error 7029)
    if (from && to && !fromControl?.hasError('futureDate') && !toControl?.hasError('futureDate')) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (fromStr && toStr && fromStr > toStr) {
        this.addDateError(fromControl, 'fromAfterTo');
      }
      // Bidirectional check: toDate is before fromDate (Oracle error 9192)
      if (fromStr && toStr && toStr < fromStr) {
        this.addDateError(toControl, 'toBeforeFrom');
      }
    }
  }

  private clearCustomDateErrors(control: AbstractControl | null): void {
    if (!control?.errors) return;
    const errors = { ...control.errors };
    delete errors['futureDate'];
    delete errors['fromAfterTo'];
    delete errors['toBeforeFrom'];
    delete errors['required'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.filterForm.controls)
      .find(key => this.filterForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const err = error as { error?: { errorResponse?: { error?: string }; message?: string }; message?: string };
    return err?.error?.errorResponse?.error || err?.error?.message || err?.message || fallback;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
