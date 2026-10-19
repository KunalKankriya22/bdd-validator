import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { startWith, takeUntil, filter } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { NonExtractedBatchesApiService } from './services/non-extracted-batches-api.service';
import { BatchInProgressStateService } from '../sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query/services/batch-in-progress-state.service';
import {
  BatchDto,
  UnitDto,
  TestResultDto,
  ContractLookupDto,
  NonExtractedBatchesQueryParams,
  ResultStatus
} from './models/non-extracted-batches.model';

/**
 * Non-Extracted Batches Query Component
 *
 * Provides a three-panel master-detail-detail interface for querying
 * batches with non-extracted test results. Users can drill down from
 * batches → units → test results.
 *
 * Navigation: Laboratory Functions => Sample Management > Regional Sample Tracking >
 * Regional Sample Tracking Queries > Non-Extracted Batches Query
 *
 * Mnemonic: NEBQ
 */
@Component({
  selector: 'app-non-extracted-batches-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './non-extracted-batches-query.html',
  styleUrls: ['./non-extracted-batches-query.scss']
})
export class NonExtractedBatchesQueryComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `non-extracted-batches-query-${NonExtractedBatchesQueryComponent.nextId++}`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(NonExtractedBatchesApiService);
  private readonly stateService = inject(BatchInProgressStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();

  maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });
  lastChangedDateField: 'start' | 'end' | null = null;

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  private readonly _pageHeaderEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      // Include BIPQ breadcrumb if user navigated from there
      const breadcrumbs = this.shouldAutoRetrieve
        ? [
            { label: 'Home', link: '/home' },
            {
              label: 'Batch In-Progress Query',
              link: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'
            },
            { label: pageData.title, link: null }
          ]
        : [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ];

      this.pageHeaderConfig = {
        breadcrumbs,
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
  });

  // Form
  queryForm!: FormGroup;
  submitted = signal<boolean>(false);
  private datesInitialized = false;

  // Effect to set default dates when chapter date becomes available
  private readonly _dateDefaultsEffect = effect(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid() && this.queryForm && !this.datesInitialized) {
      this.datesInitialized = true;
      const defaultFromDate = chapterDate.clone().subtract(3, 'days');
      const defaultToDate = chapterDate.clone();
      this.queryForm.patchValue({
        fromDate: defaultFromDate,
        toDate: defaultToDate
      }, { emitEvent: false });
    }
  });

  // Search control for Contract ID dropdown
  contractIdSearchControl = new FormControl('');
  private contractIdSearchSignal = toSignal(this.contractIdSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Signal-based state
  protected readonly contracts = signal<ContractLookupDto[]>([]);
  protected readonly batches = signal<BatchDto[]>([]);
  protected readonly units = signal<UnitDto[]>([]);
  protected readonly testResults = signal<TestResultDto[]>([]);
  protected readonly selectedBatchId = signal<string | null>(null);
  protected readonly selectedUnitId = signal<string | null>(null);
  protected readonly selectedUnitCollDate = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly loadingResults = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  private readonly selectedContractId = signal<string>('');
  private pendingContractId: string | null = null;
  private shouldAutoRetrieve = false;

  // Computed values
  protected readonly filteredContracts = computed(() => {
    const searchTerm = this.contractIdSearchSignal()?.toLowerCase() || '';
    const options = this.contracts();
    if (!searchTerm) return options;
    return options.filter(item =>
      (item.contractId || '').toLowerCase().startsWith(searchTerm)
    );
  });
  protected readonly hasResults = computed(() => this.batches().length > 0);
  protected readonly contractDescription = computed(() => {
    const contractId = this.selectedContractId();
    if (!contractId) return '';
    const contract = this.contracts().find(c => c.contractId === contractId);
    return contract?.company || '';
  });
  protected readonly unitsHeader = computed(() => {
    const batchId = this.selectedBatchId();
    return batchId ? `Unextracted Units | ${batchId}` : 'Unextracted Units';
  });
  protected readonly resultsHeader = computed(() => {
    const unitId = this.selectedUnitId();
    return unitId ? `Unextracted Results | ${unitId}` : 'Unextracted Results';
  });

  // Table column definitions
  batchColumns: string[] = ['batchId', 'numberOfUnits', 'qcCheckinDate'];
  unitColumns: string[] = ['unitId', 'collDate', 'qcDate'];
  resultColumns: string[] = ['testSeqNo', 'testId', 'resultStatus1', 'interimResult'];

  // Sorted data for tables
  sortedBatches = computed(() => this.batches());
  sortedUnits = computed(() => this.units());
  sortedResults = computed(() => this.testResults());

  get today(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  get isRetrieveDisabled(): boolean {
    return this.loading()
      || this.hasDateErrors('fromDate')
      || this.hasDateErrors('toDate');
  }

  ngOnInit(): void {
    // Check if navigation came from Batch In-Progress Query
    const navigationState = history.state;
    this.shouldAutoRetrieve = !!navigationState?.fromBatchInProgressQuery;
    console.log('🔍 ngOnInit - Navigation state:', navigationState);
    console.log('🔍 shouldAutoRetrieve:', this.shouldAutoRetrieve);

    this.initForm();
    this.loadContracts();
    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();
    this.subscribeToQueryParams();

    this.queryForm.get('contractId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedContractId.set(value || '');

        // DON'T save to state service here!
        // This would overwrite BIPQ's saved state when navigating from there.
        // Only BIPQ should save its complete state.
      });
  }

  /**
   * Subscribe to query params for contract restoration
   * Priority 1: Query params (from Batch In-Progress Query navigation)
   * Priority 2: State service (from previous session)
   */
  private subscribeToQueryParams(): void {
    console.log('🔍 Setting up query param subscription...');

    // Priority 1: Check query params
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((params: Params) => !!params['contractId'])
      )
      .subscribe((params: Params) => {
        const contractId = params['contractId'];
        console.log('📥 Query param detected:', contractId);

        // Store as pending until contracts are loaded
        this.pendingContractId = contractId;
        console.log('Stored as pendingContractId');

        // DON'T save to state service - would overwrite BIPQ's complete state

        // Try to apply immediately if contracts are already loaded
        this.applyPendingContract();
      });

    // Priority 2: Check snapshot for immediate access
    const initialContractId = this.route.snapshot.queryParams['contractId'];
    console.log('📸 Snapshot contractId:', initialContractId);

    if (initialContractId) {
      this.pendingContractId = initialContractId;
      console.log('Using snapshot contractId');
      return; // Already handled by subscription
    }

    // Priority 3: Restore from state service
    const savedContract = this.stateService.getSelectedContract();
    console.log('💾 Saved contract from state:', savedContract);

    if (savedContract?.contractId) {
      // Store as pending until contracts load
      this.pendingContractId = savedContract.contractId;
      console.log('Using saved contract:', savedContract.contractId);
    }
  }

  /**
   * Apply pending contract ID after contracts are loaded
   * Auto-triggers RETRIEVE if contract came from query params
   */
  private applyPendingContract(): void {
    console.log('🔧 applyPendingContract called');
    console.log('pendingContractId:', this.pendingContractId);
    console.log('contracts available:', this.contracts().length);

    if (!this.pendingContractId) return;

    const contractExists = this.contracts().some(c => c.contractId === this.pendingContractId);
    console.log('Contract exists:', contractExists);

    if (contractExists) {
      console.log('✅ Applying contract:', this.pendingContractId);

      // Clear search to ensure selected contract is visible
      this.contractIdSearchControl.setValue('', { emitEvent: false });
      console.log('Search control cleared');

      // Set form value now that contracts are loaded
      this.queryForm.patchValue({ contractId: this.pendingContractId });
      console.log('Form patched with:', this.pendingContractId);
      console.log('Form value is now:', this.queryForm.get('contractId')?.value);

      // Force change detection to update the view
      this.cdr.detectChanges();
      console.log('Change detection triggered');

      // Auto-retrieve if navigated from Batch In-Progress Query
      if (this.shouldAutoRetrieve) {
        console.log('🚀 Auto-retrieving batches...');
        // Defer to next tick to ensure UI is fully updated
        setTimeout(() => {
          this.ngZone.run(() => {
            this.onRetrieve();
          });
        }, 0);
      }

      this.pendingContractId = null;
    } else {
      console.warn('❌ Contract NOT found in list');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the query form with validation
   * Default dates are set via effect when chapter date becomes available
   */
  private initForm(): void {
    this.queryForm = this.fb.group({
      contractId: [''],
      fromDate: [null],
      toDate: [null]
    });
    this.datesInitialized = false;
  }

  /**
   * Load active contracts for dropdown
   */
  private loadContracts(): void {
    console.log('📡 Loading contracts from API...');
    this.apiService.getActiveContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          console.log('✅ Contracts received:', contracts.length);
          console.log('Sample contracts:', contracts.slice(0, 3));

          this.contracts.set(contracts.sort((a, b) => a.contractId.localeCompare(b.contractId)));
          console.log('Contracts signal updated');

          // Apply pending contract ID from query params or state service
          this.applyPendingContract();

          // DON'T update state service - would overwrite BIPQ's complete state
        },
        error: (err) => {
          console.error('Error loading contracts:', err);
          this.snackbarService.showError('Failed to load contracts');
        }
      });
  }

  /**
   * Subscribe to chapter changes from header
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadContracts();
      });
  }

  onDateBlur(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.queryForm.get(controlName);
    if (this.tryParseDDMMYYShorthand(inputValue, control)) return;
    DateFieldValidationUtility.handleEndDateInput(inputValue, control);
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.queryForm.get('fromDate')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.queryForm.get('toDate')
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
    const control = this.queryForm.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'From Date is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'From Date is invalid';
    if (control.hasError('futureDate')) return 'From Date cannot be in the future';
    if (control.hasError('fromAfterTo')) return 'From Date cannot be after To Date';
    return '';
  }

  getToDateError(): string {
    const control = this.queryForm.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'To Date is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'To Date is invalid';
    if (control.hasError('futureDate')) return 'To Date cannot be in the future';
    if (control.hasError('toDateRequired')) return 'To Date is required when From Date is entered';
    return '';
  }

  private hasDateErrors(controlName: string): boolean {
    const ctrl = this.queryForm.get(controlName);
    if (!ctrl) return false;
    return ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDateFormat')
      || ctrl.hasError('invalidDate') || ctrl.hasError('matDatepickerMin')
      || ctrl.hasError('futureDate') || ctrl.hasError('fromAfterTo')
      || ctrl.hasError('toDateRequired');
  }

  private setupDateValidationListeners(): void {
    this.queryForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        this.validateDates();
      });

    this.queryForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
        this.validateDates();
      });
  }

  private validateDates(): void {
    const fromControl = this.queryForm.get('fromDate');
    const toControl = this.queryForm.get('toDate');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    const chapterToday = this.maxDate();
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

  /**
   * Handle form submission
   */
  onRetrieve(): void {
    this.submitted.set(true);

    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    const chapterToday = chapterDate && chapterDate.isValid()
      ? chapterDate.clone()
      : moment();

    if (!this.queryForm.get('fromDate')?.value) {
      this.queryForm.get('fromDate')?.setValue(chapterToday.clone().subtract(3, 'days'));
    }
    if (!this.queryForm.get('toDate')?.value) {
      this.queryForm.get('toDate')?.setValue(chapterToday.clone());
    }

    this.executeBatchQuery();
  }

  /**
   * Execute batch query API call
   */
  private executeBatchQuery(): void {
    const formValue = this.queryForm.value;

    // Validate that dates are present
    if (!formValue.fromDate || !formValue.toDate) {
      this.snackbarService.showError('From Date and To Date are required');
      return;
    }

    // Format dates as ISO 8601 date strings (YYYY-MM-DD) for backend parsing
    const fromDateMoment = moment(formValue.fromDate);
    const toDateMoment = moment(formValue.toDate);

    if (!fromDateMoment.isValid() || !toDateMoment.isValid()) {
      this.snackbarService.showError('Invalid date format');
      return;
    }

    const params: NonExtractedBatchesQueryParams = {
      fromDate: fromDateMoment.format('YYYY-MM-DD'),
      toDate: toDateMoment.format('YYYY-MM-DD')
    };

    if (formValue.contractId) {
      params.contractId = formValue.contractId;
    }

    console.log('🔍 API Request Params:', params);

    this.loading.set(true);
    this.error.set(null);
    this.clearResults();

    // Safety timeout: Force clear loading after 30 seconds if request hangs
    const loadingTimeout = setTimeout(() => {
      if (this.loading()) {
        console.warn('[NonExtractedBatchQuery] Loading timeout - forcing loading state to clear');
        this.loading.set(false);
        this.snackbarService.showError('Request timed out. Please try again.');
      }
    }, 30000);

    this.apiService.queryBatches(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          clearTimeout(loadingTimeout);
          this.batches.set(response.batches);
          this.loading.set(false);

          if (response.batches.length === 0) {
            this.snackbarService.showSuccess('No batches found matching the criteria');
          } else {
            this.snackbarService.showSuccess('Successfully retrieved batches');
          }
        },
        error: (err) => {
          clearTimeout(loadingTimeout);
          this.loading.set(false);
          this.error.set(err.message || 'Failed to retrieve batches');
          this.snackbarService.showError(err.message || 'Failed to retrieve batches');
        }
      });
  }

  /**
   * Handle batch row selection
   */
  onBatchSelect(batch: BatchDto): void {
    this.selectedBatchId.set(batch.batchId);
    this.selectedUnitId.set(null);
    this.testResults.set([]);
    this.loadUnitsForBatch(batch.batchId);
  }

  /**
   * Load units for selected batch
   */
  private loadUnitsForBatch(batchId: string): void {
    const contractId = this.queryForm.get('contractId')?.value || undefined;

    this.loadingUnits.set(true);
    this.units.set([]);

    this.apiService.getUnitsForBatch(batchId, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.units.set(units);
          this.loadingUnits.set(false);
        },
        error: (err) => {
          this.loadingUnits.set(false);
          this.snackbarService.showError(err.message || 'Failed to load units for batch');
        }
      });
  }

  /**
   * Handle unit row selection
   */
  onUnitSelect(unit: UnitDto): void {
    this.selectedUnitId.set(unit.unitId);
    this.selectedUnitCollDate.set(unit.collDate);
    this.loadTestResultsForUnit(unit);
  }

  /**
   * Load test results for selected unit
   */
  private loadTestResultsForUnit(unit: UnitDto): void {
    const batchId = this.selectedBatchId();
    if (!batchId) return;

    const contractId = this.queryForm.get('contractId')?.value || undefined;

    this.loadingResults.set(true);
    this.testResults.set([]);

    this.apiService.getTestResultsForUnit(batchId, unit.unitId, unit.collDate, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.testResults.set(results);
          this.loadingResults.set(false);
        },
        error: (err) => {
          this.loadingResults.set(false);
          this.snackbarService.showError(err.message || 'Failed to load test results for unit');
        }
      });
  }

  /**
   * Clear all form fields and results
   * Resets dates to default values based on chapter date (From: 3 days prior, To: current chapter date)
   */
  clearAll(): void {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    const chapterToday = chapterDate && chapterDate.isValid()
      ? chapterDate.clone()
      : moment();
    const defaultFromDate = chapterToday.clone().subtract(3, 'days');
    const defaultToDate = chapterToday.clone();

    this.queryForm.reset({
      contractId: '',
      fromDate: defaultFromDate,
      toDate: defaultToDate
    });
    this.submitted.set(false);
    Object.keys(this.queryForm.controls).forEach(key => {
      this.queryForm.get(key)?.setErrors(null);
    });
    this.clearResults();
  }

  /**
   * Clear results panels
   */
  private clearResults(): void {
    this.batches.set([]);
    this.units.set([]);
    this.testResults.set([]);
    this.selectedBatchId.set(null);
    this.selectedUnitId.set(null);
    this.selectedUnitCollDate.set(null);
  }

  /**
   * Sort table data
   */
  onSortBatches(sort: Sort): void {
    const data = this.batches().slice();
    if (!sort.active || sort.direction === '') {
      this.batches.set(data);
      return;
    }

    const sorted = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'batchId':
          return this.compare(a.batchId, b.batchId, isAsc);
        case 'numberOfUnits':
          return this.compare(a.numberOfUnits || 0, b.numberOfUnits || 0, isAsc);
        default:
          return 0;
      }
    });

    this.batches.set(sorted);
  }

  onSortUnits(sort: Sort): void {
    const data = this.units().slice();
    if (!sort.active || sort.direction === '') {
      this.units.set(data);
      return;
    }

    const sorted = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'unitId':
          return this.compare(a.unitId, b.unitId, isAsc);
        case 'collDate':
          return this.compare(a.collDate, b.collDate, isAsc);
        default:
          return 0;
      }
    });

    this.units.set(sorted);
  }

  onSortResults(sort: Sort): void {
    const data = this.testResults().slice();
    if (!sort.active || sort.direction === '') {
      this.testResults.set(data);
      return;
    }

    const sorted = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'testSeqNo':
          return this.compare(a.testSeqNo, b.testSeqNo, isAsc);
        case 'testId':
          return this.compare(a.testId, b.testId, isAsc);
        default:
          return 0;
      }
    });

    this.testResults.set(sorted);
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  navigateToBatchesInProgress(): void {
    const contractId = this.queryForm.get('contractId')?.value;
    this.router.navigate(
      ['/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'],
      {
        queryParams: contractId ? { contractId } : undefined,
        state: { fromNonExtractedBatchQuery: true }
      }
    );
  }

  navigateToSamplesQuery(): void {
    const unitId = this.selectedUnitId();
    const collDate = this.selectedUnitCollDate();

    if (!unitId) {
      this.snackbarService.showError('Please select a unit first');
      return;
    }

    this.router.navigate(
      ['/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/samples-query'],
      {
        queryParams: { unitId, collDate },
        state: {
          fromNonExtractedBatchQuery: true,
          alreadyParsed: true  // Unit ID is already in 13-char format
        }
      }
    );
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  /**
   * Format datetime for display (DD-MMM-YYYY, HH:mm)
   */
  formatDateTime(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm').toUpperCase() : value;
  }

  formatDateTimeUtc(value: string | null): string {
    if (!value) return '';
    const m = moment.utc(value);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm').toUpperCase() : value;
  }

  isHighlightedResult(status: string | null): boolean {
    return status === ResultStatus.Repeat;
  }

  /**
   * Check if batch is selected
   */
  isBatchSelected(batch: BatchDto): boolean {
    return this.selectedBatchId() === batch.batchId;
  }

  /**
   * Check if unit is selected
   */
  isUnitSelected(unit: UnitDto): boolean {
    return this.selectedUnitId() === unit.unitId;
  }

  /**
   * Get page header configuration
   */
  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || '';

    // Check if user navigated from Batch In-Progress Query
    const breadcrumbs = this.shouldAutoRetrieve
      ? [
          { label: 'Home', link: '/home' },
          {
            label: 'Batch In-Progress Query',
            link: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'
          },
          { label: title, link: null }
        ]
      : [
          { label: 'Home', link: '/home' },
          { label: title, link: null }
        ];

    return {
      title,
      breadcrumbs,
      subtitle: '',
    };
  }

  /**
   * Form control accessor
   */
  get f() {
    return this.queryForm.controls;
  }

  /**
   * Generate unique element IDs for accessibility
   */
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;
}
