import { Component, OnInit, OnDestroy, effect, inject, signal, computed } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, forkJoin, merge, takeUntil, debounceTime, startWith } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { DeferralsOnHoldQueryService } from './services/deferrals-on-hold-query.service';
import { DeferralsOnHoldStateService } from './services/deferrals-on-hold-state.service';
import {
  DeferralHoldModel,
  DeferralHoldQueryDto,
  LookupDto,
  HoldReasonDialogData,
} from './models/deferrals-on-hold-query.model';
import { HoldReasonDialog } from './components/hold-reason-dialog/hold-reason-dialog';
import { DeferralEntryDetailsDialogComponent } from '@shared/components/deferral-entry-details-dialog/deferral-entry-details-dialog';

@Component({
  selector: 'app-deferrals-on-hold-query',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './deferrals-on-hold-query.html',
  styleUrls: ['./deferrals-on-hold-query.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
})
export class DeferralsOnHoldQueryComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private queryService = inject(DeferralsOnHoldQueryService);
  private stateService = inject(DeferralsOnHoldStateService);
  private pageHeaderService = inject(PageHeaderService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private snackbarService = inject(SnackbarService);
  lastChangedDateField: 'start' | 'end' | null = null;
  maxDate: moment.Moment = this.chapterTimezoneService.getChapterLocalDate();

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );
  get f() { return this.filterForm.controls; }

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: ROUTE_REGISTRY[RouteKey.Home].path }],
    title: '',
    subtitle: '',
    actions: [],
  };

  tableConfig: DataTableConfig<DeferralHoldModel> = {
    columns: [
      { key: 'deferralId', header: 'Deferral ID', sortable: true, type: 'text', width: '120px' },
      { key: 'transactionId', header: 'Transaction ID', sortable: false, type: 'text', width: '130px' },
      { key: 'batchId', header: 'Batch ID', sortable: false, type: 'text', width: '120px' },
      { key: 'driveId', header: 'Drive ID', sortable: false, type: 'text', width: '120px' },
      { key: 'donorId', header: 'Donor ID', sortable: false, type: 'text', width: '120px' },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        type: 'text',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value),
      },
      { key: 'donationType', header: 'Donation Type', sortable: false, type: 'text', width: '110px' },
      { key: 'procedureCode', header: 'Procedure Code', sortable: false, type: 'text', width: '120px' },
      { key: 'user', header: 'User', sortable: false, type: 'text', width: '100px' },
      {
        key: 'dateTimeOfRegistration',
        header: 'Date and Time of Registration',
        sortable: false,
        type: 'text',
        width: '200px',
        valueFormatter: (value) => DateFieldValidationUtility.formatDateTimeWithMeridiem(value as string),
      },
      {
        key: 'auditComplete',
        header: 'Audit Complete',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => value ? value : '--',
      },
    ],
    rowActions: [
      { icon: 'description', label: 'Deferral Entry', ariaLabel: 'Deferral entry', action: 'deferral-entry' },
      { icon: 'info', label: 'Hold Reason', ariaLabel: 'Hold reason', action: 'hold-reason' },
      { icon: 'person_add', label: 'Attach Donor', ariaLabel: 'Attach donor', action: 'attach-donor' },
      { icon: 'edit', label: 'Update Deferral', ariaLabel: 'Update deferral', action: 'update-deferral' },
      { icon: 'fact_check', label: 'Update Audit', ariaLabel: 'Update audit', action: 'update-audit' },
    ],
    sortConfig: { column: 'deferralId', direction: 'default' },
    stickyHeader: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view Results',
  };

  filterForm!: FormGroup;
  driveIds: LookupDto[] = [];
  batchIds: LookupDto[] = [];
  deferralIds: LookupDto[] = [];
  transactionIds: LookupDto[] = [];
  users: LookupDto[] = [];
  interdictionCodes: LookupDto[] = [];

  // Search controls for dropdowns
  driveIdSearchControl = new FormControl('');
  batchIdSearchControl = new FormControl('');
  deferralIdSearchControl = new FormControl('');
  transactionIdSearchControl = new FormControl('');
  userSearchControl = new FormControl('');
  interdictionCodeSearchControl = new FormControl('');

  // Signals for full option sets
  driveIdsSignal = signal<LookupDto[]>([]);
  batchIdsSignal = signal<LookupDto[]>([]);
  deferralIdsSignal = signal<LookupDto[]>([]);
  transactionIdsSignal = signal<LookupDto[]>([]);
  usersSignal = signal<LookupDto[]>([]);
  interdictionCodesSignal = signal<LookupDto[]>([]);

  // Convert search FormControl valueChanges to signals
  driveIdSearchSignal = toSignal(this.driveIdSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  batchIdSearchSignal = toSignal(this.batchIdSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  deferralIdSearchSignal = toSignal(this.deferralIdSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  transactionIdSearchSignal = toSignal(this.transactionIdSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  userSearchSignal = toSignal(this.userSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  interdictionCodeSearchSignal = toSignal(this.interdictionCodeSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Computed filtered options
  filteredDriveIds = computed(() => {
    const searchTerm = this.driveIdSearchSignal()?.toLowerCase() || '';
    const options = this.driveIdsSignal();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.code || '').toLowerCase().includes(searchTerm) ||
      (item.description || '').toLowerCase().includes(searchTerm)
    );
  });

  filteredBatchIds = computed(() => {
    const searchTerm = this.batchIdSearchSignal()?.toLowerCase() || '';
    const options = this.batchIdsSignal();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.code || '').toLowerCase().includes(searchTerm) ||
      (item.description || '').toLowerCase().includes(searchTerm)
    );
  });

  filteredDeferralIds = computed(() => {
    const searchTerm = this.deferralIdSearchSignal()?.toLowerCase() || '';
    const options = this.deferralIdsSignal();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.code || '').toLowerCase().includes(searchTerm) ||
      (item.description || '').toLowerCase().includes(searchTerm)
    );
  });

  filteredTransactionIds = computed(() => {
    const searchTerm = this.transactionIdSearchSignal()?.toLowerCase() || '';
    const options = this.transactionIdsSignal();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.code || '').toLowerCase().includes(searchTerm) ||
      (item.description || '').toLowerCase().includes(searchTerm)
    );
  });

  filteredUsers = computed(() => {
    const searchTerm = this.userSearchSignal()?.toLowerCase() || '';
    const options = this.usersSignal();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.code || '').toLowerCase().includes(searchTerm) ||
      (item.description || '').toLowerCase().includes(searchTerm)
    );
  });

  filteredInterdictionCodes = computed(() => {
    const searchTerm = this.interdictionCodeSearchSignal()?.toLowerCase() || '';
    const options = this.interdictionCodesSignal();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.code || '').toLowerCase().includes(searchTerm) ||
      (item.description || '').toLowerCase().includes(searchTerm)
    );
  });

  dataSource: DeferralHoldModel[] = [];
  totalCount = 0;
  errorMessage: string | null = null;
  isLoadingDropdowns = false;
  isLoadingData = false;
  hasSearched = false;
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DeferralHoldModel | null = null;

  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeForm();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: ROUTE_REGISTRY[RouteKey.Home].path },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [],
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
    this.setupDateChangeWatcher();
    this.setupDriveCascade();
    this.setupDateValidationListeners();

    // Load dropdowns and handle return navigation after they're loaded
    this.loadDropdownsAndRestoreState();
  }

  /**
   * Load dropdowns and restore state if returning from child screen
   */
  private async loadDropdownsAndRestoreState(): Promise<void> {
    // First, load the dropdowns
    await this.loadDropdowns();

    // Check if there's saved state from the service (when returning from child screens)
    const savedState = this.stateService.getState();

    if (savedState && savedState['_fromChild']) {
      // Returning from child component - restore state and auto-retrieve (even if filters are empty)
      await this.restoreStateFromService(savedState);
      this.stateService.clearState(); // Clear after restoring
    }
    // If no saved state, it's a fresh page load - user must click RETRIEVE manually
  }

  /**
   * Restore filter state from saved service state
   */
  private async restoreStateFromService(savedState: Record<string, any>): Promise<void> {
    const formUpdates: any = {};

    // Restore dates
    if (savedState['driveDateFrom']) {
      formUpdates.driveDateFrom = moment(savedState['driveDateFrom'], 'YYYY-MM-DD');
    }
    if (savedState['driveDateTo']) {
      formUpdates.driveDateTo = moment(savedState['driveDateTo'], 'YYYY-MM-DD');
    }

    // Restore dropdowns
    if (savedState['driveId']) formUpdates.driveId = savedState['driveId'];
    if (savedState['batchId']) formUpdates.batchId = savedState['batchId'];
    if (savedState['deferralId']) formUpdates.deferralId = savedState['deferralId'];
    if (savedState['transactionId']) formUpdates.transactionId = savedState['transactionId'];
    if (savedState['userId']) formUpdates.userId = savedState['userId'];
    if (savedState['interdictionCode']) {
      formUpdates.interdictionCode = typeof savedState['interdictionCode'] === 'string'
        ? savedState['interdictionCode'].split(',')
        : savedState['interdictionCode'];
    }

    // Apply form updates if any
    if (Object.keys(formUpdates).length > 0) {
      // First apply the form values
      this.filterForm.patchValue(formUpdates, { emitEvent: false });

      // If we have dates or driveId, we need to load dependent LOVs (deferralIds, transactionIds, users)
      if (savedState['driveDateFrom'] || savedState['driveId']) {
        const fromDate = savedState['driveDateFrom'] || undefined;
        const toDate = savedState['driveDateTo'] || undefined;
        const driveId = savedState['driveId'] || undefined;

        // Load dependent LOVs
        await this.loadDependentLovs(fromDate, toDate, driveId);
      }
    }

    // Always auto-retrieve data when returning from child (even if no filters)
    this.loadData(false);
    this.hasSearched = true;
  }

  /**
   * Handle return navigation from child screens (Attach Donor, Update Deferral, Update Audit)
   * Restore filter state from URL query parameters
   * @returns true if state was restored and data loaded, false otherwise
   */
  private async handleReturnNavigation(): Promise<boolean> {
    // Use snapshot to get the current query params synchronously
    const params = this.route.snapshot.queryParams;

    // Check if we're returning from a child screen with preserved state
    if (params && Object.keys(params).length > 0) {
      const formUpdates: any = {};

      // Restore dates
      if (params['driveDateFrom']) {
        formUpdates.driveDateFrom = moment(params['driveDateFrom'], 'YYYY-MM-DD');
      }
      if (params['driveDateTo']) {
        formUpdates.driveDateTo = moment(params['driveDateTo'], 'YYYY-MM-DD');
      }

      // Restore dropdowns
      if (params['driveId']) formUpdates.driveId = params['driveId'];
      if (params['batchId']) formUpdates.batchId = params['batchId'];
      if (params['deferralId']) formUpdates.deferralId = params['deferralId'];
      if (params['transactionId']) formUpdates.transactionId = params['transactionId'];
      if (params['userId']) formUpdates.userId = params['userId'];
      if (params['interdictionCode']) {
        formUpdates.interdictionCode = params['interdictionCode'].split(',');
      }

      // Apply form updates if any
      if (Object.keys(formUpdates).length > 0) {
        // First apply the form values
        this.filterForm.patchValue(formUpdates, { emitEvent: false });

        // If we have dates or driveId, we need to load dependent LOVs (deferralIds, transactionIds, users)
        if (params['driveDateFrom'] || params['driveId']) {
          const fromDate = params['driveDateFrom'] || undefined;
          const toDate = params['driveDateTo'] || undefined;
          const driveId = params['driveId'] || undefined;

          // Load dependent LOVs
          await this.loadDependentLovs(fromDate, toDate, driveId);
        }

        // Always auto-retrieve data if any filters were restored
        // Clear query params after data loads successfully
        this.loadData(true); // Pass flag to indicate we should clear query params after load
        this.hasSearched = true;
        return true; // State was restored
      } else {
        // No filters to restore, just clear query params
        this.clearQueryParams();
        return false; // No state to restore
      }
    }

    return false; // No query params present
  }

  /**
   * Clear query parameters from URL
   */
  private clearQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  /**
   * Load dependent LOVs (deferralIds, transactionIds, users) based on date filters
   */
  private async loadDependentLovs(fromDate?: string, toDate?: string, driveId?: string): Promise<void> {
    try {
      const results = await forkJoin({
        deferralIds: this.queryService.getDeferralsLov(fromDate, toDate, driveId),
        transactionIds: this.queryService.getTransactionsLov(fromDate, toDate, driveId),
        users: this.queryService.getUsersLov(fromDate, toDate, driveId),
      }).toPromise();

      if (results) {
        this.deferralIds = this.sortByDescription(results.deferralIds);
        this.deferralIdsSignal.set(this.deferralIds);
        this.transactionIds = this.sortByDescription(results.transactionIds);
        this.transactionIdsSignal.set(this.transactionIds);
        this.users = this.sortByDescription(results.users);
        this.usersSignal.set(this.users);
      }
    } catch (error) {
      console.error('Error loading dependent LOVs:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isRetrieveDisabled(): boolean {
    return this.isLoadingData
      || this.hasDateErrors('driveDateFrom')
      || this.hasDateErrors('driveDateTo');
  }

  private get hasAnyFilterValue(): boolean {
    const v = this.filterForm.value;
    return !!v.driveDateFrom
      || !!v.driveDateTo
      || !!v.driveId
      || !!v.batchId
      || !!v.deferralId
      || !!v.transactionId
      || !!v.userId
      || (v.interdictionCode && v.interdictionCode.length > 0);
  }

  get isClearAllDisabled(): boolean {
    if (this.isLoadingData) return true;
    return !this.hasAnyFilterValue && !this.hasSearched && this.dataSource.length === 0;
  }

  onRetrieve(): void {
    const LOV_LIMIT = 21; // days

    const fromDate = this.filterForm.get('driveDateFrom')?.value;
    const toDate = this.filterForm.get('driveDateTo')?.value;
    const driveId = this.filterForm.get('driveId')?.value;
    const batchId = this.filterForm.get('batchId')?.value;
    const deferralId = this.filterForm.get('deferralId')?.value;
    const transactionId = this.filterForm.get('transactionId')?.value;
    const userId = this.filterForm.get('userId')?.value;

    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    // Scenario 1: All Empty - All filters are NULL
    if (!fromDate && !toDate && !driveId && !batchId && !deferralId && !transactionId && !userId) {
      this.filterForm.patchValue({
        driveDateFrom: chapterLocalDate.clone().subtract(LOV_LIMIT, 'days'),
        driveDateTo: chapterLocalDate.clone()
      }, { emitEvent: false });
    }
    // Scenario 2: Only User ID - Only userId has value, rest NULL
    else if (!fromDate && !toDate && !driveId && !batchId && !deferralId && !transactionId && userId) {
      this.filterForm.patchValue({
        driveDateFrom: chapterLocalDate.clone().subtract(LOV_LIMIT, 'days'),
        driveDateTo: chapterLocalDate.clone()
      }, { emitEvent: false });
    }
    // Scenario 3: From without To - from_date exists, to_date is NULL
    else if (fromDate && !toDate) {
      this.filterForm.patchValue({
        driveDateTo: fromDate.clone()
      }, { emitEvent: false });
    }
    // Scenario 4 & 5: Any Other Filter OR Both Dates Exist - No auto-set

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData(false);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.filterForm.get('interdictionCode')?.setValue([]);
    this.dataSource = [];
    this.totalCount = 0;
    this.errorMessage = null;
    this.hasSearched = false;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
    this.batchIds = [];
    this.batchIdsSignal.set([]);
    this.deferralIds = [];
    this.deferralIdsSignal.set([]);
    this.transactionIds = [];
    this.transactionIdsSignal.set([]);
    this.users = [];
    this.usersSignal.set([]);
    this.driveIdSearchControl.setValue('');
    this.batchIdSearchControl.setValue('');
    this.deferralIdSearchControl.setValue('');
    this.transactionIdSearchControl.setValue('');
    this.userSearchControl.setValue('');
    this.interdictionCodeSearchControl.setValue('');
  }

  onRowAction(event: TableRowActionEvent<DeferralHoldModel>): void {
    switch (event.action) {
      case 'deferral-entry':
        this.onDeferralEntry(event.row);
        break;
      case 'hold-reason':
        this.onHoldReason(event.row);
        break;
      case 'attach-donor':
        this.onAttachDonor(event.row);
        break;
      case 'update-deferral':
        this.onUpdateDeferral(event.row);
        break;
      case 'update-audit':
        this.onUpdateAudit(event.row);
        break;
    }
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.loadData(false);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.loadData(false);
  }

  onDateBlur(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get(controlName);
    if (this.tryParseDDMMYYShorthand(inputValue, control)) return;
    DateFieldValidationUtility.handleEndDateInput(inputValue, control);
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('driveDateFrom')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('driveDateTo')
    );
  }

  private tryParseDDMMYYShorthand(inputValue: string, control: AbstractControl | null): boolean {
    if (!control) return false;
    const trimmed = inputValue?.trim();
    const match = trimmed?.match(/^(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      const [, day, month, year] = match;
      const parsedDate = moment(`${day}-${month}-20${year}`, 'DD-MM-YYYY', true);
      if (parsedDate.isValid()) {
        control.setValue(parsedDate);
        control.markAsTouched();
        return true;
      }
    }
    return false;
  }

  getFromDateError(): string {
    const control = this.filterForm.get('driveDateFrom');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Drive Date From is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Drive Date From is invalid';
    if (control.hasError('futureDate')) return 'Drive Date From cannot be in the future';
    if (control.hasError('fromAfterTo')) return 'Drive Date From cannot be after Drive Date To';
    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('driveDateTo');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Drive Date To is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Drive Date To is invalid';
    if (control.hasError('futureDate')) return 'Drive Date To cannot be in the future';
    if (control.hasError('toDateRequired')) return 'Drive Date To is required when Drive Date From is entered';
    return '';
  }

  private hasDateErrors(controlName: string): boolean {
    const ctrl = this.filterForm.get(controlName);
    if (!ctrl) return false;
    return ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDateFormat')
      || ctrl.hasError('invalidDate') || ctrl.hasError('matDatepickerMin')
      || ctrl.hasError('futureDate') || ctrl.hasError('fromAfterTo')
      || ctrl.hasError('toDateRequired');
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      driveDateFrom: [null],
      driveDateTo: [null],
      driveId: [null],
      batchId: [null],
      deferralId: [null],
      transactionId: [null],
      userId: [null],
      interdictionCode: [[]],
    });
  }

  private setupDateValidationListeners(): void {
    this.filterForm.get('driveDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        this.validateDates();
      });

    this.filterForm.get('driveDateTo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
        this.validateDates();
      });
  }

  private validateDates(): void {
    const fromControl = this.filterForm.get('driveDateFrom');
    const toControl = this.filterForm.get('driveDateTo');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const todayStr = chapterToday.format('YYYY-MM-DD');

    if (from) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      if (fromStr && fromStr > todayStr) {
        this.addDateError(fromControl, 'futureDate');
      }
    }

    if (to) {
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (toStr && toStr > todayStr) {
        this.addDateError(toControl, 'futureDate');
      }
    }

    if (from && to && !fromControl?.hasError('futureDate') && !toControl?.hasError('futureDate')) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (fromStr && toStr && fromStr > toStr) {
        this.addDateError(fromControl, 'fromAfterTo');
      }
    }

    if (from && !to && !fromControl?.hasError('matDatepickerParse') && !toControl?.hasError('matDatepickerParse')) {
      this.addDateError(toControl, 'toDateRequired');
    }
  }

  private clearCustomDateErrors(control: AbstractControl | null): void {
    if (!control?.errors) return;
    const errors = { ...control.errors };
    delete errors['futureDate'];
    delete errors['fromAfterTo'];
    delete errors['toDateRequired'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  private setupDateChangeWatcher(): void {
    merge(
      this.filterForm.get('driveDateFrom')!.valueChanges,
      this.filterForm.get('driveDateTo')!.valueChanges
    ).pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadDateFilteredLovs();
    });
  }

  private setupDriveCascade(): void {
    this.filterForm.get('driveId')!.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.reloadTransactionsLov();
      this.reloadDeferralsLov();
      this.reloadUsersLov();
    });
  }

  get areDateFiltersComplete(): boolean {
    return this.isFromDateValid();
  }

  private isFromDateValid(): boolean {
    const fromControl = this.filterForm.get('driveDateFrom');
    if (!fromControl) return false;
    const fromDate = DateFieldValidationUtility.serializeDateForApi(fromControl.value);
    if (!fromDate) return false;
    if (fromControl.hasError('matDatepickerParse') || fromControl.hasError('invalidDateFormat')
      || fromControl.hasError('invalidDate') || fromControl.hasError('futureDate')) {
      return false;
    }
    const toDate = DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateTo')?.value);
    if (toDate && fromDate > toDate) return false;
    return true;
  }

  private clearDateDependentLovs(): void {
    this.deferralIds = [];
    this.deferralIdsSignal.set([]);
    this.transactionIds = [];
    this.transactionIdsSignal.set([]);
    this.users = [];
    this.usersSignal.set([]);
    this.filterForm.get('deferralId')?.setValue(null);
    this.filterForm.get('transactionId')?.setValue(null);
    this.filterForm.get('userId')?.setValue(null);
  }

  private reloadDateFilteredLovs(): void {
    const fromDate = DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateFrom')?.value);
    const toDate = DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateTo')?.value);

    if (!this.isFromDateValid()) {
      this.clearDateDependentLovs();
      forkJoin({
        driveIds: this.queryService.getDrivesLov(fromDate || undefined, toDate || undefined),
        batchIds: this.queryService.getSetsLov(fromDate || undefined, toDate || undefined),
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe(results => {
          this.driveIds = this.sortByDescription(results.driveIds);
          this.driveIdsSignal.set(this.driveIds);
          this.batchIds = this.sortByDescription(results.batchIds);
          this.batchIdsSignal.set(this.batchIds);
        });
      return;
    }

    const driveId = this.filterForm.get('driveId')?.value || undefined;

    forkJoin({
      driveIds: this.queryService.getDrivesLov(fromDate!, toDate || undefined),
      batchIds: this.queryService.getSetsLov(fromDate!, toDate || undefined),
      deferralIds: this.queryService.getDeferralsLov(fromDate!, toDate || undefined, driveId),
      transactionIds: this.queryService.getTransactionsLov(
        fromDate!, toDate || undefined, driveId
      ),
      users: this.queryService.getUsersLov(fromDate!, toDate || undefined, driveId),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        this.driveIds = this.sortByDescription(results.driveIds);
        this.driveIdsSignal.set(this.driveIds);
        this.batchIds = this.sortByDescription(results.batchIds);
        this.batchIdsSignal.set(this.batchIds);
        this.deferralIds = this.sortByDescription(results.deferralIds);
        this.deferralIdsSignal.set(this.deferralIds);
        this.transactionIds = this.sortByDescription(results.transactionIds);
        this.transactionIdsSignal.set(this.transactionIds);
        this.users = this.sortByDescription(results.users);
        this.usersSignal.set(this.users);
      },
    });
  }

  private reloadTransactionsLov(): void {
    const isValid = this.isFromDateValid();
    const fromDate = isValid
      ? DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateFrom')?.value)
      : undefined;
    const toDate = isValid
      ? DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateTo')?.value)
      : undefined;
    const driveId = this.filterForm.get('driveId')?.value;

    if (!fromDate && !driveId) {
      this.transactionIds = [];
      this.transactionIdsSignal.set([]);
      this.filterForm.get('transactionId')?.setValue(null);
      return;
    }

    this.queryService.getTransactionsLov(
      fromDate || undefined, toDate || undefined, driveId || undefined
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.transactionIds = this.sortByDescription(data);
        this.transactionIdsSignal.set(this.transactionIds);
        const selected = this.filterForm.get('transactionId')?.value;
        if (selected && !this.transactionIds.some(t => t.code === selected)) {
          this.filterForm.get('transactionId')?.setValue(null);
        }
      },
    });
  }

  private reloadDeferralsLov(): void {
    const isValid = this.isFromDateValid();
    const fromDate = isValid
      ? DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateFrom')?.value)
      : undefined;
    const toDate = isValid
      ? DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateTo')?.value)
      : undefined;
    const driveId = this.filterForm.get('driveId')?.value;

    if (!fromDate && !driveId) {
      this.deferralIds = [];
      this.deferralIdsSignal.set([]);
      this.filterForm.get('deferralId')?.setValue(null);
      return;
    }

    this.queryService.getDeferralsLov(
      fromDate || undefined, toDate || undefined, driveId || undefined
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.deferralIds = this.sortByDescription(data);
        this.deferralIdsSignal.set(this.deferralIds);
        const selected = this.filterForm.get('deferralId')?.value;
        if (selected && !this.deferralIds.some(d => d.code === selected)) {
          this.filterForm.get('deferralId')?.setValue(null);
        }
      },
    });
  }

  private reloadUsersLov(): void {
    const isValid = this.isFromDateValid();
    const fromDate = isValid
      ? DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateFrom')?.value)
      : undefined;
    const toDate = isValid
      ? DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('driveDateTo')?.value)
      : undefined;
    const driveId = this.filterForm.get('driveId')?.value;

    if (!fromDate && !driveId) {
      this.users = [];
      this.usersSignal.set([]);
      this.filterForm.get('userId')?.setValue(null);
      return;
    }

    this.queryService.getUsersLov(
      fromDate || undefined, toDate || undefined, driveId || undefined
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.users = this.sortByDescription(data);
        this.usersSignal.set(this.users);
        const selected = this.filterForm.get('userId')?.value;
        if (selected && !this.users.some(u => u.code === selected)) {
          this.filterForm.get('userId')?.setValue(null);
        }
      },
    });
  }

  private async loadDropdowns(): Promise<void> {
    this.isLoadingDropdowns = true;

    try {
      const results = await forkJoin({
        driveIds: this.queryService.getDrivesLov(),
        batchIds: this.queryService.getSetsLov(),
        interdictionCodes: this.queryService.getInterdictionCodesLov(),
      }).toPromise();

      if (results) {
        this.driveIds = this.sortByDescription(results.driveIds);
        this.driveIdsSignal.set(this.driveIds);
        this.batchIds = this.sortByDescription(results.batchIds);
        this.batchIdsSignal.set(this.batchIds);
        this.interdictionCodes = this.sortByDescription(results.interdictionCodes);
        this.interdictionCodesSignal.set(this.interdictionCodes);
      }
      this.isLoadingDropdowns = false;
    } catch (error) {
      this.isLoadingDropdowns = false;
      this.errorMessage = 'Failed to load filter options. Please try refreshing the page.';
      console.error('Error loading dropdowns:', error);
    }
  }

  private loadData(clearQueryParamsAfterLoad: boolean = false): void {
    this.isLoadingData = true;
    this.errorMessage = null;
    this.hasSearched = true;

    const formValue = this.filterForm.value;

    const request: DeferralHoldQueryDto = {};

    if (formValue.driveDateFrom) {
      request.driveDateFrom = DateFieldValidationUtility.serializeDateForApi(formValue.driveDateFrom) ?? undefined;
    }
    if (formValue.driveDateTo) {
      request.driveDateTo = DateFieldValidationUtility.serializeDateForApi(formValue.driveDateTo) ?? undefined;
    }
    if (formValue.driveId) request.driveId = formValue.driveId;
    if (formValue.batchId) request.batchId = formValue.batchId;
    if (formValue.deferralId) request.deferralId = formValue.deferralId;
    if (formValue.transactionId) request.transactionId = formValue.transactionId;
    if (formValue.userId) request.userId = formValue.userId;
    if (formValue.interdictionCode && formValue.interdictionCode.length > 0) {
      request.interdictionCode = formValue.interdictionCode.join(',');
    }

    const sortConfig = this.tableConfig.sortConfig;
    if (sortConfig && sortConfig.direction !== 'default') {
      request.sortBy = sortConfig.column;
      request.sortDirection = sortConfig.direction === 'D' ? 'DESC' : 'ASC';
    }

    const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
    const skip = (this.tableConfig.pagination?.pageIndex ?? 0) * pageSize;

    this.queryService
      .searchDeferralHolds(pageSize, skip, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource = result.data;
          this.totalCount = result.total;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = result.total;
          }
          this.isLoadingData = false;

          // Clear query params after data is successfully loaded (if requested)
          if (clearQueryParamsAfterLoad) {
            this.clearQueryParams();
          }
        },
        error: (error) => {
          this.dataSource = [];
          this.totalCount = 0;
          this.isLoadingData = false;

          if (error?.error?.errorResponse?.error) {
            this.errorMessage = error.error.errorResponse.error;
          } else if (error?.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error?.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'An error occurred while loading data';
          }

          // Clear query params even on error to avoid confusion
          if (clearQueryParamsAfterLoad) {
            this.clearQueryParams();
          }
        },
      });
  }

  private onDeferralEntry(row: DeferralHoldModel): void {
    if (!row.donorId) {
      this.snackbarService.showError('Donor ID is required to view deferral entry details.');
      return;
    }
    this.dialog.open(DeferralEntryDetailsDialogComponent, {
      width: '70vw',
      maxWidth: '90vw',
      maxHeight: 'calc(100vh - 64px)',
      height: 'calc(100vh - 64px)',
      data: {
        donorId: row.donorId,
        driveDate: row.collDate ? DateFieldValidationUtility.serializeDateForApi(moment(row.collDate)) ?? '' : '',
      },
      disableClose: false,
      panelClass: 'deferral-entry-dialog-right-panel',
      hasBackdrop: true,
      position: {
        top: '64px',
        right: '0',
      },
    });
  }

  private sortByDescription(items: LookupDto[]): LookupDto[] {
    return [...items].sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  }

  private onHoldReason(row: DeferralHoldModel): void {
    const dialogData: HoldReasonDialogData = {
      deferralId: row.deferralId,
      transactionId: row.transactionId,
      donorId: row.donorId,
      donorName: row.donorName || '',
    };

    this.dialog.open(HoldReasonDialog, {
      width: '70vw',
      maxWidth: '90vw',
      maxHeight: 'calc(100vh - 64px)',
      height: 'calc(100vh - 64px)',
      data: dialogData,
      panelClass: 'hold-reason-dialog-right-panel',
      hasBackdrop: true,
      position: {
        top: '64px',
        right: '0',
      },
    });
  }

  private onAttachDonor(row: DeferralHoldModel): void {
    // Save current filter state to service before navigation
    const currentFormState = this.getFilterStateForUrl();
    this.stateService.saveState(currentFormState);

    // Navigate to Attach Donor without any query params (clean navigation)
    // State restoration handled by service when returning
    this.router.navigate([ROUTE_REGISTRY[RouteKey.AttachDonor].path], {
      state: {
        fromDeferralsOnHoldQuery: true,
        returnPath: '/donor-functions/registration/registration-queries/deferrals-on-hold-query'
      }
    });
  }

  private onUpdateDeferral(row: DeferralHoldModel): void {
    // Save current filter state to service before navigation
    const currentFormState = this.getFilterStateForUrl();
    this.stateService.saveState(currentFormState);

    // Pass state via router for child component breadcrumb setup (WITHOUT filterState)
    // Child will build breadcrumb without query params, state restoration handled by service
    this.router.navigate([ROUTE_REGISTRY[RouteKey.UpdateDeferral].path], {
      queryParams: {
        deferralId: row.deferralId
      },
      state: {
        fromDeferralsOnHoldQuery: true,
        returnPath: '/donor-functions/registration/registration-queries/deferrals-on-hold-query'
        // NOTE: filterState intentionally omitted - state restoration handled by service
      }
    });
  }

  private onUpdateAudit(row: DeferralHoldModel): void {
    if (!row.deferralId) {
      this.snackbarService.showError('Deferral ID is required to view audit details.');
      return;
    }

    // Save current filter state to service before navigation
    const currentFormState = this.getFilterStateForUrl();
    this.stateService.saveState(currentFormState);

    // Pass state via router for child component breadcrumb setup (WITHOUT filterState)
    // Child will build breadcrumb without query params, state restoration handled by service
    this.router.navigate([ROUTE_REGISTRY[RouteKey.DonationDeferralAuditDrawer].path], {
      queryParams: {
        deferralId: row.deferralId
      },
      state: {
        fromDeferralsOnHoldQuery: true,
        returnPath: '/donor-functions/registration/registration-queries/deferrals-on-hold-query'
        // NOTE: filterState intentionally omitted - state restoration handled by service
      }
    });
  }

  /**
   * Get current filter state for URL preservation
   * Used when navigating to child screens to enable breadcrumb navigation back
   */
  private getFilterStateForUrl(): Record<string, string> {
    const formValue = this.filterForm.value;
    const state: Record<string, string> = {};

    // Add flag to indicate we're coming from a child component
    state['_fromChild'] = 'true';

    if (formValue.driveDateFrom) {
      state['driveDateFrom'] = DateFieldValidationUtility.serializeDateForApi(formValue.driveDateFrom) || '';
    }
    if (formValue.driveDateTo) {
      state['driveDateTo'] = DateFieldValidationUtility.serializeDateForApi(formValue.driveDateTo) || '';
    }
    if (formValue.driveId) {
      state['driveId'] = formValue.driveId;
    }
    if (formValue.batchId) {
      state['batchId'] = formValue.batchId;
    }
    if (formValue.deferralId) {
      state['deferralId'] = formValue.deferralId;
    }
    if (formValue.transactionId) {
      state['transactionId'] = formValue.transactionId;
    }
    if (formValue.userId) {
      state['userId'] = formValue.userId;
    }
    if (formValue.interdictionCode && formValue.interdictionCode.length > 0) {
      state['interdictionCode'] = formValue.interdictionCode.join(',');
    }

    return state;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    return DateFieldValidationUtility.formatDateForUI(moment(dateString))?.toUpperCase() || dateString;
  }
}
