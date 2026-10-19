import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import moment from 'moment';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ConfirmNonAcceptableDialogComponent } from './confirm-non-acceptable-dialog/confirm-non-acceptable-dialog';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { VerifyControlValuesForTestBatchService } from './verify-control-values-for-test-batch.service';
import { ViewUnitsDialogComponent } from './dialogs/view-units-dialog/view-units-dialog';
import { ViewReagentsDialogComponent } from './dialogs/view-reagents-dialog/view-reagents-dialog';
import {
  TestBatchLovDto,
  TestBatchTestLovDto,
  TestRunLovDto,
  TestKitLovDto,
  ParmValueLovDto,
  TestBatchDetail,
  TestBatchParm,
  TestBatchParmVerifyDto,
  TestBatchReagent,
} from './verify-control-values-for-test-batch.model';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

/**
 * Verify Control Values for Test Batch Component (TSIENTPM)
 * MLT-13692
 *
 * Allows technicians to enter and validate test batch parameters.
 * Supports dual-technician workflow (Tech1 entry, Tech2 confirmation).
 */
@Component({
  selector: 'app-verify-control-values-for-test-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatMomentDateModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './verify-control-values-for-test-batch.html',
  styleUrls: ['./verify-control-values-for-test-batch.scss'],
})
export class VerifyControlValuesForTestBatchComponent implements OnInit, OnDestroy, AfterViewInit {
  // Unique ID for accessibility
  private static nextId = 0;
  protected readonly componentId = `verify-control-values-${VerifyControlValuesForTestBatchComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(VerifyControlValuesForTestBatchService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loginService = inject(LoginService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('valueTemplate', { static: false }) valueTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: false }) statusTemplate!: TemplateRef<any>;
  @ViewChild('confirmTemplate', { static: false }) confirmTemplate!: TemplateRef<any>;

  // Pessimistic lock state (Gap 1)
  private lockedTbId: string | null = null;
  private lockedTestId: string | null = null;

  // DEVICE/REAGENT LOV cache (Gap 2)
  protected readonly parmValueOptions = signal<Map<string, ParmValueLovDto[]>>(new Map());

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.releaseLockIfHeld();
  }

  // User context
  protected userId: string = '';

  // State preservation key for sessionStorage
  private readonly STATE_STORAGE_KEY = 'TSIENTPM_state';

  // Date validation - using DateFieldValidationUtility (same pattern as Define HLA Antigen)
  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  /**
   * Date filter: Allow past dates and today, BLOCK future dates
   * FMB error 8030: "future date is not allowed"
   */
  dateFilter = (date: any): boolean => {
    if (!date) return true;
    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');
    // Allow past dates and today, block future dates
    return !checkDate.isAfter(today, 'day');
  };

  /** Error matcher for date fields - only shows error for past dates and invalid format */
  // Error matcher is created per parameter field - see getDateErrorMatcher() method

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // LOV data
  protected readonly testBatches = signal<TestBatchLovDto[]>([]);
  protected readonly tests = signal<TestBatchTestLovDto[]>([]);
  protected readonly runs = signal<TestRunLovDto[]>([]);
  protected readonly kits = signal<TestKitLovDto[]>([]);

  // Batch data
  protected readonly batchDetail = signal<TestBatchDetail | null>(null);
  protected readonly hasLoadedData = signal<boolean>(false); // Track if data has been loaded at least once
  protected readonly parameters = signal<TestBatchParm[]>([]);

  // Selection state (managed by data-table component)
  protected readonly selectedParameters = signal<TestBatchParm[]>([]);
  protected readonly reagents = signal<TestBatchReagent[]>([]);

  // Pagination state
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSize = signal<number>(25);

  // Search term as signal
  protected readonly searchTerm = signal<string>('');

  // Filtered parameters based on search
  protected readonly filteredParameters = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const params = this.parameters();

    if (!search) return params;

    return params.filter(p =>
      p.parmCode?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    );
  });

  // Paginated parameters
  protected readonly paginatedParameters = computed(() => {
    const filtered = this.filteredParameters();
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  // Computed flags
  protected readonly requiresTech2 = computed(() =>
    this.batchDetail()?.tech2Reqd === 'Y'
  );

  protected readonly isTech2Mode = computed(() => {
    const params = this.parameters();
    return params.length > 0 && params[0].techNo === 2;
  });

  protected readonly hasNotAcceptableValues = computed(() =>
    this.parameters().some(p => p.acceptFlag === 'N')
  );

  protected readonly batchSaved = signal<boolean>(false);
  protected readonly confirmingBatch = signal<boolean>(false);

  // FMB: SAVE (KEY-COMMIT) is enabled once parameters are loaded and user has entered/modified values.
  // No "pending acceptFlag" gate — backend validates each parameter during save.
  protected readonly canSave = computed(() => {
    const hasDetail = this.batchDetail() !== null;
    const hasParams = this.parameters().length > 0;
    const formValid = this.filterForm.valid;

    // Check if any parameter value has been entered or modified
    const hasChanges = this.parameters().some(param => {
      const form = this.parameterForms.get(param.parmCode);
      if (!form) return false;

      const currentValue = form.get('parmValue')?.value;

      // Convert Moment to string for comparison
      let valueToCompare = currentValue;
      if (currentValue && typeof currentValue === 'object' && 'format' in currentValue) {
        valueToCompare = currentValue.format('DD-MMM-YYYY');
      }

      const valueChanged = valueToCompare && valueToCompare !== param.parmValue;
      const firstTechChanged = form.get('firstTech')?.value && form.get('firstTech')?.value !== param.firstTech;

      return valueChanged || firstTechChanged;
    });

    return hasDetail && hasParams && formValid && hasChanges;
  });

  // FMB: CONFIRM BATCH (CONTINUE) only appears AFTER a save where parm_check_flag = 'N'.
  // No row selection required — it applies to the entire batch.
  protected readonly canConfirmBatch = computed(() => {
    const hasBatchData = this.batchDetail() !== null && this.parameters().length > 0;

    // Only enable after save returned parm_check_flag = 'N' (non-acceptable values)
    return hasBatchData && this.batchSaved() && !this.confirmingBatch();
  });

  // Forms
  filterForm!: FormGroup;
  parameterForms: Map<string, FormGroup> = new Map();

  // Search controls for dropdowns
  testBatchSearchControl = new FormControl('');
  testSearchControl = new FormControl('');
  runSearchControl = new FormControl('');
  kitSearchControl = new FormControl('');

  // Filtered dropdown options
  protected readonly filteredTestBatches = signal<TestBatchLovDto[]>([]);
  protected readonly filteredTests = signal<TestBatchTestLovDto[]>([]);
  protected readonly filteredRuns = signal<TestRunLovDto[]>([]);
  protected readonly filteredKits = signal<TestKitLovDto[]>([]);

  // Sorting state
  private sortColumn?: string;
  private sortDirection?: string;

  // Table columns
  protected readonly displayedColumns = [
    'sequence',
    'code',
    'description',
    'value',
    'firstTech',
    'confirm',
    'status',
  ];

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Verify Control Values for Test Batch', link: null },
    ],
  };

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 0, // Allow empty search to trigger restore
    ariaLabel: 'Search parameters by code or description',
    searchOnEnterOnly: true, // Search on Enter, but allow clear to trigger immediately
  };

  // Data table configuration
  tableConfig: DataTableConfig<TestBatchParm> = {
    columns: [
      { key: 'sequence', header: 'Sequence', sortable: true, width: '80px' },
      { key: 'parmCode', header: 'Code', sortable: false, width: '120px' },
      { key: 'description', header: 'Description', sortable: false, width: '180px' },
      { key: 'parmValue', header: 'Value', sortable: false, type: 'custom', width: '240px' },
      { key: 'firstTech', header: 'First Tech', sortable: false, valueFormatter: (value, row) => row.firstTech || '-', width: '120px' },
      { key: 'confirmFlag', header: 'Confirm', sortable: false, type: 'custom', width: '80px' },
      { key: 'acceptFlag', header: 'Status', sortable: false, type: 'custom', width: '150px' },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No parameters found',
    emptySubMessage: 'Try adjusting your search criteria',
    enableSelection: true,
    selectionKey: 'parmCode',
    sortConfig: {
      column: '',
      direction: 'default'
    }
  };

  async ngOnInit(): Promise<void> {
    // Initialize form first (template needs it immediately)
    this.initForm();

    // Load user in parallel with initial data
    await Promise.all([
      this.loadCurrentUser(),
      this.loadInitialData()
    ]);

    this.setupFormListeners();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();

    // Check for initial query params (from navigation back from Place Group Interdiction)
    // NOTE: sessionStorage state restoration (in ngAfterViewInit) takes precedence over query params
    // Only process query params if there's no saved state in sessionStorage
    const hasSavedState = !!sessionStorage.getItem(this.STATE_STORAGE_KEY);

    const initialParams = this.route.snapshot.queryParams;
    if (!hasSavedState && initialParams['testBatchId']) {
      // Set testBatchId first to trigger loading of tests
      this.filterForm.patchValue({
        testBatchId: initialParams['testBatchId']
      }, { emitEvent: false });

      // Wait for tests to load
      await this.loadBatchTests(initialParams['testBatchId']);

      // Now set the other fields (tests are loaded, so testId will be valid)
      this.filterForm.patchValue({
        testId: initialParams['testId'] || null,
        runId: initialParams['runId'] || null,
        testKitId: initialParams['testKitId'] || null,
      }, { emitEvent: false });

      // Auto-retrieve if we have required fields
      if (initialParams['testBatchId'] && initialParams['testId']) {
        await this.retrieve();
      }
    }

    // Continue to listen for query param changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params: any) => {
      // Skip if these are the initial params we already handled
      if (params === initialParams) return;

      if (params['testBatchId']) {
        this.filterForm.patchValue({
          testBatchId: params['testBatchId'],
          testId: params['testId'] || null,
          runId: params['runId'] || null,
          testKitId: params['testKitId'] || null,
        }, { emitEvent: false });

        if (params['testBatchId'] && params['testId']) {
          await this.retrieve();
        }
      }
    });
  }

  /**
   * Load current user from login service (stored in cookies after login)
   */
  private async loadCurrentUser(): Promise<void> {
    try {
      // Get username from cookies (stored after successful login)
      this.userId = this.loginService.getStoredUsername();
      console.log('Current user loaded from cookies:', this.userId);

      if (!this.userId) {
        console.warn('No username found in cookies, using SYSTEM as fallback');
        this.userId = 'SYSTEM';
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      this.userId = 'SYSTEM'; // Fallback
    }
  }

  ngAfterViewInit(): void {
    // Link templates to table columns after view init
    const valueColumn = this.tableConfig.columns.find(c => c.key === 'parmValue');
    const statusColumn = this.tableConfig.columns.find(c => c.key === 'acceptFlag');
    const confirmColumn = this.tableConfig.columns.find(c => c.key === 'confirmFlag');

    if (valueColumn) valueColumn.cellTemplate = this.valueTemplate;
    if (statusColumn) statusColumn.cellTemplate = this.statusTemplate;
    if (confirmColumn) confirmColumn.cellTemplate = this.confirmTemplate;

    // Trigger change detection to ensure templates are applied
    this.cdr.detectChanges();

    // Attempt to restore state from sessionStorage after all initializations
    this.restoreState();
  }

  /**
   * Save current screen state to sessionStorage
   * Preserves form values, pagination, search term, and current batch data
   */
  private saveState(): void {
    try {
      const state = {
        filterForm: this.filterForm.value,
        pageIndex: this.pageIndex(),
        pageSize: this.pageSize(),
        searchTerm: this.searchTerm(),
        batchDetail: this.batchDetail(),
        parameters: this.parameters(),
        selectedParameters: this.selectedParameters(),
        parameterForms: Array.from(this.parameterForms.entries()).map(([key, formGroup]) => ({
          key,
          value: formGroup.value
        })),
        timestamp: new Date().getTime()
      };
      sessionStorage.setItem(this.STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save screen state:', error);
    }
  }

  /**
   * Restore screen state from sessionStorage
   * Called after view initialization to restore user's previous position
   */
  private async restoreState(): Promise<void> {
    try {
      const stateJson = sessionStorage.getItem(this.STATE_STORAGE_KEY);
      if (!stateJson) return;

      const state = JSON.parse(stateJson);

      // Clear the state after reading (one-time restoration)
      sessionStorage.removeItem(this.STATE_STORAGE_KEY);

      // Check if state is recent (within last 30 minutes to prevent stale data)
      const now = new Date().getTime();
      const age = now - (state.timestamp || 0);
      if (age > 30 * 60 * 1000) {
        console.log('Saved state is too old, ignoring');
        return;
      }

      // Restore filter form values and load all dependent data
      if (state.filterForm) {
        const { testBatchId, testId, runId, testKitId } = state.filterForm;

        // If we have testBatchId and testId, load all LOVs and retrieve batch data
        if (testBatchId && testId) {
          this.loading.set(true);

          try {
            // Step 1: Load tests LOV (required before setting testId)
            const tests = await this.service.getBatchTests(testBatchId, '2');
            this.tests.set(tests);
            this.filteredTests.set(tests);

            // Step 2: Load batch detail first (needed for parmType to load runs)
            const detail = await this.service.getBatchDetail(testBatchId, testId);
            this.batchDetail.set(detail);

            // Step 3: Load runs and kits LOVs in parallel (now that batchDetail is loaded)
            await Promise.all([
              this.loadTestRuns(testId),
              this.loadTestKits(testId)
            ]);

            // Step 4: Now set the filter form with all values
            this.filterForm.patchValue({
              testBatchId,
              testId,
              runId: runId || '',
              testKitId: testKitId || ''
            }, { emitEvent: false });

            // Step 5: Retrieve full batch data (parameters, reagents, etc.)
            // This will re-fetch batch detail but also get parameters
            await this.retrieve();

            // Step 6: Restore pagination and search after data loads
            if (state.pageIndex !== undefined) this.pageIndex.set(state.pageIndex);
            if (state.pageSize !== undefined) this.pageSize.set(state.pageSize);
            if (state.searchTerm) this.searchTerm.set(state.searchTerm);

            // Step 7: Restore parameter form values (e.g., user was in middle of editing)
            if (state.parameterForms && Array.isArray(state.parameterForms)) {
              // Wait a tick for parameterForms to be created by retrieve()
              setTimeout(() => {
                state.parameterForms.forEach((item: any) => {
                  const form = this.parameterForms.get(item.key);
                  if (form && item.value) {
                    form.patchValue(item.value, { emitEvent: false });
                  }
                });
              }, 100);
            }

            console.log('Screen state restored successfully');
          } catch (error) {
            console.error('Failed to restore batch data:', error);
            this.snackbarService.showError('Failed to restore previous screen state');
          } finally {
            this.loading.set(false);
          }
        } else {
          // Partial state - just restore form values without loading data
          this.filterForm.patchValue(state.filterForm, { emitEvent: false });
        }
      }
    } catch (error) {
      console.warn('Failed to restore screen state:', error);
    }
  }

  ngOnDestroy(): void {
    this.releaseLockIfHeld();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form
   */
  private initForm(): void {
    this.filterForm = this.fb.group({
      testBatchId: ['', Validators.required],
      testId: ['', Validators.required],
      runId: ['', Validators.maxLength(14)],
      testKitId: ['', Validators.maxLength(14)],
    });
  }

  /**
   * Load initial LOV data
   */
  private async loadInitialData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load pending test batches
      // FMB defaults to Tech Mode 2 (show only "Confirmation incomplete" batches)
      // Tech Mode 2: Show batches where FIRST_TECH != current user AND SECOND_TECH IS NULL
      const batches = await this.service.getPendingBatches('2');
      this.testBatches.set(batches);
      this.filteredTestBatches.set(batches);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.snackbarService.showError('Failed to load test batches');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Setup form value change listeners
   */
  private setupFormListeners(): void {
    // Load tests when test batch changes
    this.filterForm.get('testBatchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (tbId) => {
        // Always clear batch data when testBatchId changes (including when switching between batches)
        this.clearBatchData();

        // Clear all LOVs immediately (don't wait for else block)
        this.tests.set([]);
        this.filteredTests.set([]);
        this.runs.set([]);
        this.filteredRuns.set([]);
        this.kits.set([]);
        this.filteredKits.set([]);

        // Reset dependent fields BEFORE loading new data
        this.filterForm.patchValue(
          { testId: '', runId: '', testKitId: '' },
          { emitEvent: false }
        );

        // Load new tests if tbId is provided
        if (tbId) {
          await this.loadBatchTests(tbId);
        }
      });

    // Load runs/kits and batch detail when test changes (as per FMB)
    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (testId) => {
        if (testId) {
          const tbId = this.filterForm.get('testBatchId')?.value;
          if (tbId) {
            try {
              // Load batch detail to get parmType, runId, testKitId (as per FMB)
              const detail = await this.service.getBatchDetail(tbId, testId);
              this.batchDetail.set(detail);

              // Load runs and kits LOV data (as per FMB)
              await Promise.all([
                this.loadTestRuns(testId),
                this.loadTestKits(testId)
              ]);

              // Auto-populate run and kit if they exist in batch detail (as per FMB)
              if (detail) {
                this.filterForm.patchValue(
                  {
                    runId: detail.runId || '',
                    testKitId: detail.testKitId || ''
                  },
                  { emitEvent: false }
                );
              }
            } catch (error) {
              console.error('Error loading batch detail:', error);
              this.runs.set([]);
              this.filteredRuns.set([]);
              this.kits.set([]);
              this.filteredKits.set([]);
            }
          }
        } else {
          this.runs.set([]);
          this.filteredRuns.set([]);
          this.kits.set([]);
          this.filteredKits.set([]);
          this.clearBatchData();
          // Reset dependent fields
          this.filterForm.patchValue(
            { runId: '', testKitId: '' },
            { emitEvent: false }
          );
        }
      });
  }

  /**
   * Load batch tests LOV
   */
  private async loadBatchTests(tbId: string): Promise<void> {
    try {
      // Use Tech Mode 2 to match FMB behavior (show only "Confirmation incomplete" tests)
      const tests = await this.service.getBatchTests(tbId, '2');
      this.tests.set(tests);
      this.filteredTests.set(tests);
    } catch (error) {
      console.error('Error loading batch tests:', error);
      this.snackbarService.showError('Failed to load tests');
    }
  }

  /**
   * Load test runs LOV
   */
  private async loadTestRuns(testId: string): Promise<void> {
    try {
      const parmType = this.batchDetail()?.parmType;
      const runs = await this.service.getTestRuns(testId, parmType);
      this.runs.set(runs);
      this.filteredRuns.set(runs);
    } catch (error) {
      console.error('Error loading test runs:', error);
      this.snackbarService.showError('Failed to load runs');
    }
  }

  /**
   * Load test kits LOV
   */
  private async loadTestKits(testId: string): Promise<void> {
    try {
      const kits = await this.service.getTestKits(testId);
      this.kits.set(kits);
      this.filteredKits.set(kits);
    } catch (error) {
      console.error('Error loading test kits:', error);
      this.snackbarService.showError('Failed to load kits');
    }
  }

  /**
   * Load reagents for test kit
   */
  private async loadReagents(tbId: string, testId: string, testKitId: string): Promise<void> {
    try {
      const reagents = await this.service.getReagents(tbId, testId, testKitId);
      this.reagents.set(reagents);
    } catch (error) {
      console.error('Error loading reagents:', error);
      this.snackbarService.showError('Failed to load reagents');
      this.reagents.set([]);
    }
  }

  /**
   * Retrieve batch detail and parameters
   */
  async retrieve(): Promise<void> {
    if (!this.filterForm.valid) {
      this.snackbarService.showError('Please select Test Batch and Test');
      return;
    }

    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    this.loading.set(true);
    this.batchSaved.set(false);
    try {
      // Release any existing lock before acquiring a new one
      await this.releaseLockIfHeld();

      // Validate batch before loading (Gap 5: band header + result count checks)
      try {
        const validation = await this.service.validateBatch(tbId, testId);
        if (!validation.success) {
          const errorMessage = validation.message || 'Batch validation failed';
          this.snackbarService.showError(errorMessage);
          this.loading.set(false);
          return;
        }
      } catch (valError: any) {
        const errorMessage = valError?.error?.message || 'Batch validation failed';
        this.snackbarService.showError(errorMessage);
        this.loading.set(false);
        return;
      }

      // Acquire pessimistic lock (Gap 1)
      try {
        const lockResult = await this.service.lockBatch(tbId, testId);
        if (!lockResult.success) {
          this.snackbarService.showError(lockResult.message || 'Record is locked by another user');
          this.loading.set(false);
          return;
        }
        this.lockedTbId = tbId;
        this.lockedTestId = testId;
      } catch (lockError: any) {
        const errorMessage = lockError?.error?.message || 'Record is locked by another user';
        this.snackbarService.showError(errorMessage);
        this.loading.set(false);
        return;
      }

      // Get batch detail first (needed for parmType)
      const detail = await this.service.getBatchDetail(tbId, testId);
      this.batchDetail.set(detail);

      // Now load runs and kits with parmType from batch detail
      await Promise.all([
        this.loadTestRuns(testId),
        this.loadTestKits(testId)
      ]);

      // Load reagents if kit is specified
      if (detail && detail.testKitId) {
        await this.loadReagents(tbId, testId, detail.testKitId);
      } else {
        this.reagents.set([]);
      }

      // Get parameters (with search term if provided)
      const searchTerm = this.searchTerm() || undefined;
      const params = await this.service.getParameters(tbId, testId, undefined, undefined, searchTerm);
      this.parameters.set(params);

      // Load DEVICE/REAGENT LOV options (Gap 2)
      await this.loadParmValueOptions(params);

      // Create FormGroup for each parameter
      this.parameterForms.clear();
      params.forEach(param => {
        this.parameterForms.set(param.parmCode, this.createParameterFormGroup(param));
      });

      // Reset pagination
      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.pageIndex.set(0);

      // Mark that data has been loaded successfully
      this.hasLoadedData.set(true);
    } catch (error: any) {
      console.error('Error retrieving batch:', error);
      this.snackbarService.showError(
        error?.error?.message || 'Failed to retrieve batch parameters'
      );
      this.clearBatchData();
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Reload parameters after save to refresh UI with database values
   */
  private async reloadParameters(tbId: string, testId: string): Promise<void> {
    try {
      // Get parameters from backend with current sort and search
      const searchTerm = this.searchTerm() || undefined;
      const params = await this.service.getParameters(tbId, testId, this.sortColumn, this.sortDirection, searchTerm);
      this.parameters.set(params);

      // Update existing FormGroups with new values
      this.parameterForms.clear();
      params.forEach(param => {
        this.parameterForms.set(param.parmCode, this.createParameterFormGroup(param));
      });
    } catch (error) {
      console.error('Error reloading parameters:', error);
      // Don't show error to user - save was successful, this is just a refresh
    }
  }

  /**
   * Handle sort change on parameters table
   */
  onSortChange(event: TableSortEvent): void {
    // Update table config sortConfig
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Map sort direction to API format (A -> ASC, D -> DESC, default -> no sort)
    if (event.direction === 'A' || event.direction === 'D') {
      this.sortColumn = event.column;
      this.sortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
    } else {
      this.sortColumn = undefined;
      this.sortDirection = undefined;
    }

    // Reload parameters with new sort
    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;
    if (tbId && testId) {
      this.reloadParameters(tbId, testId);
    }
  }

  /**
   * Create FormGroup for parameter
   */
  private createParameterFormGroup(param: TestBatchParm): FormGroup {
    const validators = [Validators.maxLength(14)];

    // Add datatype-specific validators
    if (param.datatype === 'NUMBER') {
      validators.push(Validators.pattern(/^-?\d+(\.\d+)?$/));
      if (param.acceptMin != null) {
        validators.push(Validators.min(param.acceptMin));
      }
      if (param.acceptMax != null) {
        validators.push(Validators.max(param.acceptMax));
      }
    }

    // Convert DATE string values to Moment objects for datepicker
    let initialValue: any = param.parmValue || '';
    if (param.datatype === 'DATE' && param.parmValue) {
      // Backend can return date in multiple formats:
      // - ISO format: "2026-06-28" (YYYY-MM-DD)
      // - Oracle format: "28-JUN-2026" (DD-MMM-YYYY)
      // - Short format: "28-06-26" (DD-MM-YY)
      // - FMB format: "06-23-26" (MM-DD-YY)
      initialValue = moment(param.parmValue, ['MM-DD-YY', 'YYYY-MM-DD', 'DD-MMM-YYYY', 'DD-MM-YY'], true);
      if (!initialValue.isValid()) {
        console.warn('Invalid date format for parameter:', param.parmCode, param.parmValue);
        initialValue = '';
      }
    }

    const formGroup = this.fb.group({
      parmCode: [param.parmCode],
      sequence: [param.sequence],
      parmValue: [initialValue, validators],
      confirmFlag: [param.confirmFlag === 'Y'], // Checkbox boolean value
      acceptFlag: [{ value: param.acceptFlag || '', disabled: true }],
      firstTech: [{ value: param.firstTech || '', disabled: true }],
      datatype: [param.datatype],
      acceptMin: [param.acceptMin],
      acceptMax: [param.acceptMax],
    });

    // Note: In the actual component template, we'll add (blur) event to trigger validation
    // This matches FMB POST_CHECK trigger which fires when user leaves the field
    // See: validateAndSetFirstTech() method

    return formGroup;
  }

  /**
   * Update parameter in the signal
   */
  private updateParameter(parmCode: string, updates: Partial<TestBatchParm>): void {
    const params = this.parameters();
    const index = params.findIndex(p => p.parmCode === parmCode);
    if (index !== -1) {
      const updated = [...params];
      updated[index] = { ...updated[index], ...updates };
      this.parameters.set(updated);
    }
  }

  /**
   * Handle date change from calendar selection
   * Called when user selects a date from the datepicker
   */
  onDateChange(parmCode: string): void {
    console.log('Date changed via calendar for:', parmCode);
    this.validateAndSetFirstTech(parmCode);
  }

  /**
   * Handle blur event on date field
   * Called when user manually types date and leaves the field
   */
  onDateBlur(parmCode: string): void {
    console.log('Date field blurred for:', parmCode);
    this.validateAndSetFirstTech(parmCode);
  }

  /**
   * Validate and set FirstTech when user leaves the field (matching FMB POST_CHECK)
   * Called from onDateChange and onDateBlur events
   */
  protected validateAndSetFirstTech(parmCode: string): void {
    const form = this.parameterForms.get(parmCode);
    if (!form) return;

    const value = form.get('parmValue')?.value;
    const param = this.parameters().find(p => p.parmCode === parmCode);
    if (!param || !value || value === param.parmValue) return;

    console.log('Validating and setting FirstTech for:', parmCode, 'Value:', value, 'Current user:', this.userId);

    // Validate using client-side logic with chapter local date
    const acceptFlag = this.validateParameterValue(
      value,
      param.datatype || '',
      form.get('acceptMin')?.value,
      form.get('acceptMax')?.value
    );

    console.log('Validation result - acceptFlag:', acceptFlag);

    // Set FirstTech to current user (matching FMB: :parms.first_tech := :banner.user_id)
    // This happens when user leaves the field (blur), before SAVE
    form.patchValue({
      firstTech: this.userId,
      acceptFlag
    }, { emitEvent: false });

    // Update the parameters signal to trigger UI update
    this.updateParameter(parmCode, {
      firstTech: this.userId,
      acceptFlag,
      parmValue: value
    });

    console.log('FirstTech and acceptFlag updated successfully');
  }

  /**
   * Validate parameter value and return acceptFlag (matching FMB CHECK_VALUE + CHECK_NUMERICS logic)
   *
   * FMB Business Logic:
   * - NUMBER: value must be between acceptMin and acceptMax
   * - DATE: days from current date must be between acceptMin and acceptMax
   * - DATETIME: minutes from current datetime must be between acceptMin and acceptMax
   * - DEVICE: must exist in EQUIPMENT, status='IN', no downtime, QC current (backend only)
   * - REAGENT: must exist in REAGENT_STORE_MST, not expired (backend only)
   *
   * Client-side validation (immediate feedback):
   * - NUMBER: full validation against min/max
   * - DATE: calculate days difference, validate against min/max
   * - DATETIME: calculate minutes difference, validate against min/max
   * - DEVICE/REAGENT: default to 'Y', backend validates on save (requires DB queries)
   *
   * Returns 'Y' if acceptable, 'N' if not acceptable, '' if no value
   */
  private validateParameterValue(
    value: string | null,
    datatype: string,
    acceptMin: number | null | undefined,
    acceptMax: number | null | undefined
  ): string {
    if (!value) return '';

    // NUMBER datatype: Client-side validation
    if (datatype === 'NUMBER') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'N'; // Invalid number

      // Check against max (FMB error 9006: "Value above acceptable maximum")
      if (acceptMax != null && numValue > acceptMax) {
        return 'N';
      }
      // Check against min (FMB error 9005: "Value below acceptable minimum")
      if (acceptMin != null && numValue < acceptMin) {
        return 'N';
      }
      return 'Y'; // Within acceptable range
    }

    // DATE datatype: Calculate days from current date using chapter local date
    if (datatype === 'DATE') {
      try {
        // Get chapter local date from ChapterTimezoneService
        const chapterLocalDate = this.chapterTimezoneService.chapterLocalDate();
        if (!chapterLocalDate) {
          console.warn('Chapter local date not available, skipping validation');
          return 'Y'; // Let backend validate
        }

        // Handle Moment object (from datepicker) or Date string
        let dateValue: moment.Moment;
        if (value && typeof value === 'object' && 'format' in value) {
          // Moment object from datepicker
          dateValue = value;
        } else {
          dateValue = moment(value);
        }

        if (!dateValue.isValid()) return 'N'; // Invalid date

        // Normalize to date-only (strip time component)
        const currentDate = chapterLocalDate.clone().startOf('day');
        const enteredDate = dateValue.clone().startOf('day');

        // FMB CHECK_NUMERICS: Validate not future date (error 8030)
        if (enteredDate.isAfter(currentDate)) {
          console.log('Date validation: Future date not allowed');
          return 'N';
        }

        // FMB CHECK_NUMERICS: Calculate days difference
        // FMB: temp_value := round(trunc(v_local_time) - trunc(szDate), 0)
        // Result: 0 = today, 1 = yesterday, 2 = 2 days ago
        const daysDifference = currentDate.diff(enteredDate, 'days');

        console.log('Date validation:', {
          enteredDate: enteredDate.format('YYYY-MM-DD'),
          currentDate: currentDate.format('YYYY-MM-DD'),
          daysDifference,
          acceptMin,
          acceptMax
        });

        // FMB CHECK_NUMERICS: Check against accept_max (error 9006)
        if (acceptMax != null && daysDifference > acceptMax) {
          console.log('Date validation: Above max range');
          return 'N';
        }

        // FMB CHECK_NUMERICS: Check against accept_min (error 9005)
        if (acceptMin != null && daysDifference < acceptMin) {
          console.log('Date validation: Below min range');
          return 'N';
        }

        console.log('Date validation: Acceptable');
        return 'Y'; // Within acceptable range
      } catch (error) {
        console.error('Date validation error:', error);
        return 'N';
      }
    }

    // DATETIME datatype: Calculate minutes from current datetime
    if (datatype === 'DATETIME') {
      try {
        // Handle Moment object (from datepicker) or Date string
        let datetimeValue: Date;
        if (value && typeof value === 'object' && 'toDate' in value) {
          // Moment object
          datetimeValue = (value as any).toDate();
        } else {
          datetimeValue = new Date(value);
        }

        if (isNaN(datetimeValue.getTime())) return 'N'; // Invalid datetime

        // IMPORTANT: Client-side validation is SKIPPED for DATETIME fields
        // Reason: We don't have access to chapter local datetime on the client side
        // The browser's local datetime may differ from chapter local datetime due to timezone
        // Backend will perform accurate validation using chapter local datetime from timezone service
        //
        // FMB behavior: Uses v_local_time = get_local_time(chapter_id, sysdate)
        // Frontend limitation: No access to chapter timezone conversion
        // Solution: Show as acceptable on client, let backend validate and return error if invalid
        console.log('DateTime validation: Skipping client-side validation - backend will validate against chapter local datetime');
        return 'Y'; // Let backend validate
      } catch (error) {
        console.error('DateTime validation error:', error);
        return 'N';
      }
    }

    // DEVICE, REAGENT: Backend validates on save
    // (requires database queries for equipment status, QC checks, reagent expiry, etc.)
    return 'Y';
  }

  /**
   * Get parameter FormGroup
   */
  getParameterForm(parmCode: string): FormGroup | undefined {
    return this.parameterForms.get(parmCode);
  }

  /**
   * Get parameter value control
   */
  getParameterValueControl(parmCode: string): FormControl {
    const form = this.parameterForms.get(parmCode);
    return (form?.get('parmValue') as FormControl) || new FormControl('');
  }

  /**
   * Get parameter confirm flag control
   */
  getParameterConfirmControl(parmCode: string): FormControl {
    const form = this.parameterForms.get(parmCode);
    return (form?.get('confirmFlag') as FormControl) || new FormControl(false);
  }

  /**
   * Save/verify parameters
   */
  async save(): Promise<void> {
    if (!this.canSave()) {
      this.snackbarService.showError('Cannot save: invalid form state');
      return;
    }

    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;
    const runId = this.filterForm.get('runId')?.value || undefined;
    const testKitId = this.filterForm.get('testKitId')?.value || undefined;

    // Build parameters array
    const parameters = Array.from(this.parameterForms.entries()).map(([parmCode, form]) => {
      let parmValue = form.get('parmValue')?.value || '';

      // Convert Moment object to YYYY-MM-DD string (ISO 8601 date-only format)
      // This ensures .NET DateTime.TryParse parses it as local date WITHOUT timezone conversion
      // The backend then stores it in FMB format (MM-DD-YY) in the database
      if (parmValue && typeof parmValue === 'object' && 'format' in parmValue) {
        parmValue = parmValue.format('YYYY-MM-DD');
      }

      return {
        parmCode,
        parmValue,
        confirmFlag: form.get('confirmFlag')?.value || '',
      };
    });

    const dto: TestBatchParmVerifyDto = {
      runId,
      testKitId,
      parameters,
    };

    this.saving.set(true);
    try {
      // FMB KEY-COMMIT: Save parameters
      // If parm_check_flag = 'Y', backend commits automatically
      // If parm_check_flag = 'N', backend saves but doesn't commit (user must confirm)
      const result = await this.service.saveParameters(tbId, testId, dto);
      if (result.success) {
        // Extract parmCheckFlag from result
        const parmCheckFlag = (result as any)?.data?.[0]?.parmCheckFlag;

        if (parmCheckFlag === 'Y') {
          // All acceptable - batch committed automatically (matching FMB COMMIT_BATCH)
          // Figma: "Test batch {tbId} verified successfully."
          this.snackbarService.showSuccess(
            `Test batch ${tbId} verified successfully.`
          );
          // Don't clear form - keep the data displayed for user reference
          this.batchSaved.set(true);
        } else if (parmCheckFlag === 'N') {
          // Non-acceptable values - saved but NOT committed (matching FMB navigate to CONTINUE popup)
          // Figma: "Parameters are saved successfully for verification"
          this.snackbarService.showSuccess(
            'Parameters are saved successfully for verification'
          );
          // Set batchSaved to true to enable CONFIRM BATCH button
          this.batchSaved.set(true);

          // Reload parameters to refresh UI with updated acceptFlag values
          await this.reloadParameters(tbId, testId);
        } else {
          // Unknown state
          this.snackbarService.showSuccess(
            'Parameters are saved successfully for verification'
          );
          this.batchSaved.set(true);
          await this.reloadParameters(tbId, testId);
        }
      } else {
        // Extract error code from result
        const errorCode = (result as any)?.errorCode || (result as any)?.error_code;
        const errorMessage = result.message || 'Save failed';

        // Format: "ErrorCode: Description" if error code exists
        const displayMessage = errorCode
          ? `Error ${errorCode}: ${errorMessage}`
          : errorMessage;

        this.snackbarService.showError(displayMessage);
      }
    } catch (error: any) {
      console.error('Error saving parameters:', error);

      // Extract error code and message from response
      const errorCode = error?.error?.errorCode || error?.error?.error_code;
      const errorMessage = error?.error?.message || error?.error?.error || 'Failed to save parameters';

      // Format: "ErrorCode: Description" if error code exists
      const displayMessage = errorCode
        ? `Error ${errorCode}: ${errorMessage}`
        : errorMessage;

      this.snackbarService.showError(displayMessage);
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Confirm batch (final commit after save)
   * This button appears after successful SAVE
   */
  async confirmBatch(): Promise<void> {
    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    if (!tbId || !testId) {
      this.snackbarService.showError('Test batch and test must be selected');
      return;
    }

    // Show confirmation dialog ONLY if there are non-acceptable values
    if (this.hasNotAcceptableValues()) {
      const confirmed = await this.confirmNotAcceptableValues();
      if (!confirmed) {
        return;
      }
    }

    this.confirmingBatch.set(true);
    try {
      // FMB CONTINUE = 'Y' + COMMIT_BATCH: Calls move_holding_tests to void non-acceptable tests
      const result = await this.service.confirmBatch(tbId, testId);
      if (result.success) {
        // Figma: "Test batch {tbId} verified successfully."
        this.snackbarService.showSuccess(
          `Test batch ${tbId} verified successfully.`
        );
        // Clear form after confirm batch - batch is now complete
        this.clearAll();
      } else {
        // Extract error code from result
        const errorCode = (result as any)?.errorCode || (result as any)?.error_code;
        const errorMessage = result.message || 'Confirmation failed';

        // Format: "ErrorCode: Description" if error code exists
        const displayMessage = errorCode
          ? `Error ${errorCode}: ${errorMessage}`
          : errorMessage;

        this.snackbarService.showError(displayMessage);
      }
    } catch (error: any) {
      console.error('Error confirming batch:', error);

      // Extract error code and message from response
      const errorCode = error?.error?.errorCode || error?.error?.error_code;
      const errorMessage = error?.error?.message || error?.error?.error || 'Failed to confirm batch';

      // Format: "ErrorCode: Description" if error code exists
      const displayMessage = errorCode
        ? `Error ${errorCode}: ${errorMessage}`
        : errorMessage;

      this.snackbarService.showError(displayMessage);
    } finally {
      this.confirmingBatch.set(false);
    }
  }

  /**
   * Show confirmation dialog for not acceptable values
   */
  private async confirmNotAcceptableValues(): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmNonAcceptableDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true
    });

    const result = await dialogRef.afterClosed().toPromise();
    return result === true;
  }

  /**
   * Clear all form data
   */
  clearAll(): void {
    this.releaseLockIfHeld();
    this.filterForm.reset();
    this.clearBatchData();
    this.tests.set([]);
    this.runs.set([]);
    this.kits.set([]);
  }

  /**
   * Clear batch data
   */
  private clearBatchData(): void {
    this.batchDetail.set(null);
    this.parameters.set([]);
    this.parameterForms.clear();
    this.selectedParameters.set([]);
    this.hasLoadedData.set(false); // Reset loaded flag
  }

  /**
   * Handle selection change from data-table
   */
  onSelectionChange(selectedRows: TestBatchParm[]): void {
    this.selectedParameters.set(selectedRows);
  }

  /**
   * Cancel and navigate back
   */
  cancel(): void {
    // Reset/clear the form and data
    this.clearAll();
  }

  /**
   * Navigate to Place Group Interdiction/Hold screen
   * Pre-populate with Mode=TBID and Value=current batch ID
   * Preserves current form state in URL for back navigation
   */
  placeGroupInterdiction(): void {
    const tbId = this.filterForm.get('testBatchId')?.value;
    if (!tbId) {
      this.snackbarService.showError('Please select a test batch first');
      return;
    }

    // Save complete screen state to sessionStorage before navigation
    // This will be restored when the user returns via breadcrumb
    this.saveState();

    // Capture current form state for restoration on back navigation
    const currentFormState = {
      testBatchId: this.filterForm.get('testBatchId')?.value,
      testId: this.filterForm.get('testId')?.value,
      runId: this.filterForm.get('runId')?.value,
      testKitId: this.filterForm.get('testKitId')?.value,
    };

    // Construct return URL with query params manually (URLSearchParams handles encoding)
    // Note: Use the registered route path from route-registry.ts
    const returnPath = '/laboratory-functions/testing-modules/test-staging-parameters/verify-control-values';
    const params = new URLSearchParams();
    Object.entries(currentFormState).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const returnUrl = params.toString() ? `${returnPath}?${params.toString()}` : returnPath;

    // FMB: check substr(tb_id, 8, 2) — if 'TB' → TBID, else → ITBID
    const mode = tbId.length >= 9 && tbId.substring(7, 9) === 'TB' ? 'TBID' : 'ITBID';

    // Navigate with query params for Place Group Interdiction + state for breadcrumb and return URL
    this.router.navigate(['/laboratory-functions/place-group-interdiction'], {
      queryParams: {
        mode,
        value: tbId,
        returnUrl
      },
      state: {
        fromVerifyControlValues: true
      }
    });
  }

  /**
   * View reagents dialog
   */
  async viewReagents(): Promise<void> {
    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;
    const testKitId = this.filterForm.get('testKitId')?.value;

    if (!testKitId) {
      this.snackbarService.showError('Please select a test kit first');
      return;
    }

    this.dialog.open(ViewReagentsDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0' },
      panelClass: 'right-side-drawer',
      data: {
        tbId,
        testId,
        testKitId,
        kitId: testKitId
      },
    });
  }

  /**
   * View units dialog
   */
  async viewUnits(): Promise<void> {
    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    if (!tbId || !testId) {
      this.snackbarService.showError('Please select a test batch and test first');
      return;
    }

    this.dialog.open(ViewUnitsDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0' },
      panelClass: 'right-side-drawer',
      data: {
        tbId,
        testId,
        batchId: tbId
      },
    });
  }


  /**
   * Setup search filtering for dropdowns
   */
  private setupSearchFilters(): void {
    // Test Batch search
    this.testBatchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestBatchOptions();
      });

    // Test search
    this.testSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestOptions();
      });

    // Run search
    this.runSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterRunOptions();
      });

    // Kit search
    this.kitSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterKitOptions();
      });
  }

  /**
   * Filter test batch options based on search text
   */
  private filterTestBatchOptions(): void {
    const searchTerm = (this.testBatchSearchControl.value || '').toLowerCase().trim();
    const batches = this.testBatches();
    if (!searchTerm) {
      this.filteredTestBatches.set(batches);
    } else {
      this.filteredTestBatches.set(
        batches.filter(batch =>
          batch.tbId.toLowerCase().includes(searchTerm) ||
          (batch.testId && batch.testId.toLowerCase().includes(searchTerm))
        )
      );
    }
  }

  /**
   * Filter test options based on search text
   */
  private filterTestOptions(): void {
    const searchTerm = (this.testSearchControl.value || '').toLowerCase().trim();
    const tests = this.tests();
    if (!searchTerm) {
      this.filteredTests.set(tests);
    } else {
      this.filteredTests.set(
        tests.filter(test => test.testId.toLowerCase().includes(searchTerm))
      );
    }
  }

  /**
   * Filter run options based on search text
   */
  private filterRunOptions(): void {
    const searchTerm = (this.runSearchControl.value || '').toLowerCase().trim();
    const runs = this.runs();
    if (!searchTerm) {
      this.filteredRuns.set(runs);
    } else {
      this.filteredRuns.set(
        runs.filter(run => run.runId.toLowerCase().includes(searchTerm))
      );
    }
  }

  /**
   * Filter kit options based on search text
   */
  private filterKitOptions(): void {
    const searchTerm = (this.kitSearchControl.value || '').toLowerCase().trim();
    const kits = this.kits();
    if (!searchTerm) {
      this.filteredKits.set(kits);
    } else {
      this.filteredKits.set(
        kits.filter(kit =>
          kit.testKitId.toLowerCase().includes(searchTerm) ||
          kit.kitLotNumber?.toLowerCase().includes(searchTerm)
        )
      );
    }
  }

  /**
   * Subscribe to chapter changes and refresh the page
   * When user changes chapter, all data becomes invalid and page must reload
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear all data and reload page when chapter changes
        this.clearAll();

        // Reload initial data for new chapter
        this.loadInitialData();
      });
  }

  /**
   * Get error matcher for date field (creates on demand per parameter)
   * Matches Define HLA Antigen pattern
   */
  protected getDateErrorMatcher(parmCode: string): ErrorStateMatcher {
    return DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getDateError(parmCode));
  }

  /**
   * Get date validation error message for date parameters
   * Validates: invalid format + future dates only
   * FMB error 8030: "future date is not allowed"
   * Matches Define HLA Antigen effective date validation pattern
   */
  protected getDateError(parmCode: string): string {
    const form = this.parameterForms.get(parmCode);
    if (!form) return '';

    const control = form.get('parmValue');
    if (!control) return '';

    // Use the same validation utility as Define HLA Antigen
    // This handles: matDatepickerParse errors, invalid formats, and shows errors immediately
    const error = DateFieldValidationUtility.getStartDateCrossFieldError(
      control,
      'Date',
      '', // No end date field for single date validation
      null // No cross-field form errors
    );

    // If there's already an error from the utility, return it
    if (error) return error;

    // Additional check: Future date validation (FMB error 8030)
    const value = control.value;
    if (value && moment.isMoment(value) && value.isValid()) {
      const selectedDate = value.clone().startOf('day');
      const today = this.minDate.clone().startOf('day');

      if (selectedDate.isAfter(today, 'day')) {
        return 'Future date is not allowed';
      }
    }

    return '';
  }

  /**
   * Handle date input for automatic validation (like Define HLA Antigen)
   * Triggers validation on every keystroke for immediate feedback
   */
  protected onDateInput(event: Event, parmCode: string): void {
    const form = this.parameterForms.get(parmCode);
    if (!form) return;

    const control = form.get('parmValue');
    if (!control) return;

    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      control
    );
  }

  /**
   * Handle search input - searches Code and Description fields in backend
   */
  async onSearch(searchText: string): Promise<void> {
    this.searchTerm.set(searchText);
    this.pageIndex.set(0); // Reset to first page on search

    // Only reload if we have already retrieved batch data
    const tbId = this.filterForm.get('testBatchId')?.value;
    const testId = this.filterForm.get('testId')?.value;
    const hasLoadedData = this.parameters().length > 0 || this.batchDetail();

    if (tbId && testId && hasLoadedData) {
      try {
        this.loading.set(true);
        // Reload parameters with search term (searches PARM_CODE and DESCRIPTION in backend)
        const params = await this.service.getParameters(
          tbId,
          testId,
          this.sortColumn,
          this.sortDirection,
          searchText || undefined
        );
        this.parameters.set(params);

        // Update FormGroups
        this.parameterForms.clear();
        params.forEach(param => {
          this.parameterForms.set(param.parmCode, this.createParameterFormGroup(param));
        });
      } catch (error) {
        console.error('Error searching parameters:', error);
        this.snackbarService.showError('Failed to search parameters');
      } finally {
        this.loading.set(false);
      }
    }
  }

  /**
   * Release pessimistic lock if one is held (Gap 1)
   */
  private async releaseLockIfHeld(): Promise<void> {
    if (this.lockedTbId && this.lockedTestId) {
      try {
        await this.service.unlockBatch(this.lockedTbId, this.lockedTestId);
      } catch {
        // Best-effort unlock — server-side timeout handles abandoned locks
      } finally {
        this.lockedTbId = null;
        this.lockedTestId = null;
      }
    }
  }

  /**
   * Load DEVICE/REAGENT LOV options for autocomplete (Gap 2)
   */
  private async loadParmValueOptions(params: TestBatchParm[]): Promise<void> {
    const datatypes = new Set(
      params.filter(p => p.datatype === 'DEVICE' || p.datatype === 'REAGENT').map(p => p.datatype!)
    );
    const optionsMap = new Map<string, ParmValueLovDto[]>();
    for (const datatype of datatypes) {
      try {
        const options = await this.service.getParmValuesLov(datatype);
        optionsMap.set(datatype, options);
      } catch {
        optionsMap.set(datatype, []);
      }
    }
    this.parmValueOptions.set(optionsMap);
  }

  /**
   * Get autocomplete options for a DEVICE/REAGENT parameter
   */
  protected getParmOptions(datatype: string): ParmValueLovDto[] {
    return this.parmValueOptions().get(datatype) || [];
  }

  /**
   * Handle confirm flag change from Tech 2 (Gap 4)
   * When Tech 2 sets confirmFlag to 'N', the value field becomes editable for re-entry
   */
  protected onConfirmFlagChange(parmCode: string, checked: boolean): void {
    const form = this.parameterForms.get(parmCode);
    if (!form) return;
    const confirmValue = checked ? 'Y' : 'N';
    form.patchValue({ confirmFlag: checked }, { emitEvent: false });
    this.updateParameter(parmCode, { confirmFlag: confirmValue });
  }

  /**
   * Handle page change
   */
  onPageChange(event: TablePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
