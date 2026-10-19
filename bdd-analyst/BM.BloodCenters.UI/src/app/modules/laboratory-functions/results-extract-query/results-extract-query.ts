import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
  ViewChild,
  TemplateRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, EMPTY, startWith } from 'rxjs';
import { takeUntil, switchMap, tap, map, catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormControl } from '@angular/forms';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { ResultsExtractQueryApiService } from './services/results-extract-query-api.service';
import {
  ContractOption,
  BatchRecord,
  UnitRecord,
  ResultsExtractQueryRequest,
  BatchDisplay,
  UnitDisplay,
  TestResultDisplay
} from './models/results-extract-query.model';

@Component({
  selector: 'app-results-extract-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar
  ],
  templateUrl: './results-extract-query.html',
  styleUrl: './results-extract-query.scss',
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class ResultsExtractQuery implements OnInit, OnDestroy, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `results-extract-query-${ResultsExtractQuery.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ResultsExtractQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = this.getPageHeaderConfig();

  // Cell templates for color-coded columns
  @ViewChild('testIdCellTpl', { static: true }) testIdCellTpl!: TemplateRef<unknown>;
  @ViewChild('resultCellTpl', { static: true }) resultCellTpl!: TemplateRef<unknown>;
  @ViewChild('interimResultCellTpl', { static: true }) interimResultCellTpl!: TemplateRef<unknown>;
  @ViewChild('unitIdCellTpl', { static: true }) unitIdCellTpl!: TemplateRef<unknown>;

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly detailLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly hasSearched = signal<boolean>(false);
  private fromDateInputText = '';
  private toDateInputText = '';
  private readonly batchDetailTrigger$ = new Subject<{ batch: BatchRecord; contractId: string }>();

  // Contract searchable dropdown state
  protected readonly contracts = signal<ContractOption[]>([]);
  protected readonly contractsLoading = signal<boolean>(false);
  protected readonly contractDescription = signal<string>('');

  contractSearchCtrl = new FormControl('');
  contractSearchSignal = toSignal(this.contractSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredContracts = computed(() => {
    const searchTerm = this.contractSearchSignal()?.toLowerCase() || '';
    const options = this.contracts();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.contractId.toLowerCase().includes(searchTerm) ||
      option.company.toLowerCase().includes(searchTerm)
    );
  });

  // Results data state
  protected readonly allBatches = signal<BatchRecord[]>([]);
  protected readonly totalBatches = signal<number>(0);
  protected readonly selectedBatch = signal<BatchRecord | null>(null);
  protected readonly selectedUnit = signal<UnitRecord | null>(null);

  // Search filters for each panel
  protected readonly batchSearchTerm = signal<string>('');
  protected readonly unitSearchTerm = signal<string>('');
  protected readonly testSearchTerm = signal<string>('');

  // Search bar configs
  protected readonly batchSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Batch ID',
    minLength: 1,
    ariaLabel: 'Search batches',
    debounceTime: 200
  };

  protected readonly unitSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID',
    minLength: 1,
    ariaLabel: 'Search units',
    debounceTime: 200
  };

  protected readonly testSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Test ID',
    minLength: 1,
    ariaLabel: 'Search test results',
    debounceTime: 200
  };

  // Data table configs — initialized in ngAfterViewInit after templates are available
  batchTableConfig!: DataTableConfig<BatchDisplay>;
  unitTableConfig!: DataTableConfig<UnitDisplay>;
  testTableConfig!: DataTableConfig<TestResultDisplay>;

  // Computed filtered data
  protected readonly filteredBatches = computed(() => {
    const batches = this.allBatches();
    const searchTerm = this.batchSearchTerm().toLowerCase().trim();
    if (!searchTerm) return batches;
    return batches.filter(batch => batch.batchId.toLowerCase().includes(searchTerm));
  });

  protected readonly displayBatches = computed<BatchDisplay[]>(() => {
    return this.filteredBatches().map(batch => ({
      ...batch,
      extractDateFormatted: this.formatDate(batch.extractDateTime),
      extractDateTimeFormatted: this.formatDateTime(batch.extractDateTime)
    }));
  });

  protected readonly units = computed<UnitDisplay[]>(() => {
    const batch = this.selectedBatch();
    if (!batch) return [];
    return batch.units.map(unit => ({
      ...unit,
      hasWarning: this.hasReactiveResult(unit),
      qcTestDateFormatted: unit.qcTestDate ? this.formatDateTimeWithTimezone(unit.qcTestDate) : '',
      unitIdDisplay: this.formatUnitIdWithSuffix(unit.unitId, unit.checkDigit)
    }));
  });

  protected readonly filteredUnits = computed(() => {
    const units = this.units();
    const searchTerm = this.unitSearchTerm().toLowerCase().trim();
    if (!searchTerm) return units;
    return units.filter(unit => unit.unitId.toLowerCase().includes(searchTerm));
  });

  protected readonly selectedUnitDisplay = computed<UnitDisplay | null>(() => {
    const unit = this.selectedUnit();
    if (!unit) return null;
    return {
      ...unit,
      hasWarning: this.hasReactiveResult(unit),
      qcTestDateFormatted: unit.qcTestDate ? this.formatDateTimeWithTimezone(unit.qcTestDate) : '',
      unitIdDisplay: this.formatUnitIdWithSuffix(unit.unitId, unit.checkDigit)
    };
  });

  protected readonly testResults = computed<TestResultDisplay[]>(() => {
    const unit = this.selectedUnit();
    if (!unit) return [];
    return unit.testResults.map(test => ({
      ...test,
      testIdColor: this.getResultColor(test.resultStatus1 || ''),
      resultColor: this.getResultColor(test.resultStatus1 || ''),
      interimResultColor: this.getResultColor(test.interimResult || '')
    }));
  });

  protected readonly filteredTestResults = computed(() => {
    const results = this.testResults();
    const searchTerm = this.testSearchTerm().toLowerCase().trim();
    if (!searchTerm) return results;
    return results.filter(test => test.testId.toLowerCase().includes(searchTerm));
  });

  protected readonly batchCount = computed(() => this.filteredBatches().length);
  protected readonly unitCount = computed(() => this.filteredUnits().length);
  protected readonly testResultCount = computed(() => this.filteredTestResults().length);

  // Row highlight computeds — use key-based lookup for reference equality with DataTable
  protected readonly selectedBatchForHighlight = computed(() => {
    const batch = this.selectedBatch();
    if (!batch) return null;
    return this.displayBatches().find(b => b.batchId === batch.batchId && b.extractDateTimeGmt === batch.extractDateTimeGmt) || null;
  });

  protected readonly selectedUnitForHighlight = computed(() => {
    const unit = this.selectedUnit();
    if (!unit) return null;
    return this.filteredUnits().find(u => u.unitId === unit.unitId) || null;
  });

  protected readonly maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });

  protected readonly showEmptyState = computed(() => !this.hasSearched() && !this.loading());
  protected readonly showNoResults = computed(() => this.hasSearched() && this.allBatches().length === 0 && !this.loading());

  searchForm!: FormGroup;
  private lastChangedDateField: 'from' | 'to' | null = null;
  private datesInitialized = false;

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
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
      const bc = this.batchCount();
      const uc = this.unitCount();
      const tc = this.testResultCount();
      if (this.batchTableConfig) {
        this.updateColumnHeaderCounts(bc, uc, tc);
      }
    });

    // Effect to set default dates when chapter date becomes available
    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid() && this.searchForm && !this.datesInitialized) {
        this.datesInitialized = true;
        const defaultFromDate = chapterDate.clone().subtract(2, 'days');
        const defaultToDate = chapterDate.clone();
        this.searchForm.patchValue({
          fromDate: defaultFromDate,
          toDate: defaultToDate
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.setupDateChangeTracking();
    this.setupBatchDetailPipeline();
    this.setupContractAutocomplete();
    this.subscribeToChapterChanges();
    this.initTableConfigs();
  }

  ngAfterViewInit(): void {
    // Initial update to apply cell templates
    this.updateColumnHeaderCounts(
      this.batchCount(),
      this.unitCount(),
      this.testResultCount()
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      contractId: ['', [Validators.required, Validators.maxLength(9)]],
      fromDate: [null, [Validators.required, DateFieldValidationUtility.validDateValidator()]],
      toDate: [null, [Validators.required, DateFieldValidationUtility.validDateValidator()]]
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
    });
  }

  private setupDateChangeTracking(): void {
    this.searchForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastChangedDateField = 'from');
    this.searchForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastChangedDateField = 'to');
  }

  onFromDateInput(event: Event): void {
    this.fromDateInputText = (event.target as HTMLInputElement).value;
  }

  onToDateInput(event: Event): void {
    this.toDateInputText = (event.target as HTMLInputElement).value;
  }

  getFromDateError(): string {
    const control = this.searchForm.get('fromDate');
    if (control && !control.value && this.fromDateInputText.trim() &&
        control.hasError('required') && !control.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }
    const formErrors = this.lastChangedDateField === 'from' ? this.searchForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(control, 'From Date', 'To Date', formErrors);
  }

  getToDateError(): string {
    const control = this.searchForm.get('toDate');
    if (control && !control.value && this.toDateInputText.trim() &&
        control.hasError('required') && !control.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }
    const formErrors = this.lastChangedDateField === 'to' ? this.searchForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(control, 'To Date', 'From Date', formErrors);
  }

  private setupBatchDetailPipeline(): void {
    this.batchDetailTrigger$.pipe(
      tap(({ batch }) => {
        this.selectedBatch.set(batch);
        this.selectedUnit.set(null);
        this.detailLoading.set(true);
      }),
      switchMap(({ batch, contractId }) =>
        this.apiService.getBatchDetail({
          contractId,
          batchId: batch.batchId,
          extractDateTime: batch.extractDateTimeGmt
        }).pipe(
          map(detail => ({ batch, detail })),
          catchError(err => {
            this.detailLoading.set(false);
            const msg = err.error?.errorResponse?.error || 'Failed to load batch details';
            this.snackbarService.showError(msg);
            return EMPTY;
          })
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ batch, detail }) => {
      const batches = this.allBatches();
      const idx = batches.findIndex(b => b.batchId === batch.batchId && b.extractDateTimeGmt === batch.extractDateTimeGmt);
      if (idx >= 0) {
        const updated = { ...batches[idx], units: detail.units };
        const arr = [...batches];
        arr[idx] = updated;
        this.allBatches.set(arr);
        this.selectedBatch.set(updated);
      }
      this.detailLoading.set(false);
      if (detail.units.length > 0) this.onUnitSelected(detail.units[0]);
    });
  }

  private initTableConfigs(): void {
    this.batchTableConfig = {
      columns: [
        { key: 'batchId', header: 'Batch ID', sortable: false },
        { key: 'chapterId', header: 'Chapter', sortable: false, width: '80px' },
        { key: 'unitCount', header: 'Count', sortable: false, width: '60px' },
        { key: 'extractDateTimeFormatted', header: 'Extract Date', sortable: false }
      ],
      enableRowHighlight: true,
      showPagination: false,
      emptyMessage: 'No batches found',
      showTableOnEmpty: true
    };

    this.unitTableConfig = {
      columns: [
        { key: 'unitIdDisplay', header: 'Unit ID', sortable: false },
        { key: 'qcTestDateFormatted', header: 'QC Date', sortable: false }
      ],
      enableRowHighlight: true,
      showPagination: false,
      emptyMessage: 'Select a batch to view units',
      showTableOnEmpty: true
    };

    this.testTableConfig = {
      columns: [
        { key: 'testSeqNo', header: 'Sequence', sortable: false, width: '80px' },
        { key: 'testId', header: 'Test ID', sortable: false },
        { key: 'resultStatus1', header: 'Result', sortable: false, width: '80px' },
        { key: 'interimResult', header: 'Interim Result', sortable: false, width: '100px' }
      ],
      enableRowHighlight: false,
      showPagination: false,
      emptyMessage: 'Select a unit to view test results',
      showTableOnEmpty: true
    };
  }


  private setupContractAutocomplete(): void {
    this.contractsLoading.set(true);
    this.apiService.getAllValidContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validContracts) => {
          const contractOptions: ContractOption[] = validContracts.map(contract => ({
            contractId: contract.contractId,
            company: contract.company,
            centerId: contract.centerId || ''
          }));
          this.contracts.set(contractOptions);
          this.contractsLoading.set(false);
        },
        error: (err) => {
          this.contractsLoading.set(false);
          this.snackbarService.showError('Failed to load contracts');
          console.error('Error loading contracts:', err);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleChapterChange());
  }

  private handleChapterChange(): void {
    this.searchForm.reset();
    this.searchForm.markAsPristine();
    this.searchForm.markAsUntouched();
    Object.keys(this.searchForm.controls).forEach(key => {
      this.searchForm.get(key)?.setErrors(null);
    });
    this.contractDescription.set('');
    this.contractSearchCtrl.setValue('');
    this.submitted.set(false);
    this.hasSearched.set(false);
    this.allBatches.set([]);
    this.totalBatches.set(0);
    this.selectedBatch.set(null);
    this.selectedUnit.set(null);
    this.error.set(null);
    this.detailLoading.set(false);
    this.lastChangedDateField = null;
    this.fromDateInputText = '';
    this.toDateInputText = '';
    this.datesInitialized = false;
    this.clearAllSearchTerms();
    this.setupContractAutocomplete();
  }

  get f() {
    return this.searchForm.controls;
  }

  onContractSelected(contractId: string): void {
    const contract = this.contracts().find(c => c.contractId === contractId);
    this.contractDescription.set(contract ? `${contract.company} (${contract.centerId})` : '');
  }

  onRetrieve(): void {
    this.submitted.set(true);

    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    if (!this.searchForm.get('fromDate')?.value) {
      this.searchForm.patchValue({ fromDate: chapterDate.clone().subtract(2, 'days') });
    }
    if (!this.searchForm.get('toDate')?.value) {
      this.searchForm.patchValue({ toDate: chapterDate.clone() });
    }

    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) (firstInvalid as HTMLElement).focus();
      return;
    }

    const formValue = this.searchForm.value;
    const request: ResultsExtractQueryRequest = {
      contractId: formValue.contractId,
      fromDate: formValue.fromDate ? moment(formValue.fromDate).format('YYYY-MM-DD') : null,
      toDate: formValue.toDate ? moment(formValue.toDate).format('YYYY-MM-DD') : null,
      take: 9999,
      skip: 0
    };

    this.loading.set(true);
    this.error.set(null);
    this.selectedBatch.set(null);
    this.selectedUnit.set(null);
    // Clear all grid search filters when retrieving new data
    this.clearAllSearchTerms();

    this.apiService.queryResultsWithCount(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.allBatches.set(response.data.batches);
          this.totalBatches.set(response.totalCount);
          this.hasSearched.set(true);
          this.loading.set(false);

          if (response.data.batches.length > 0) {
            this.onBatchSelected(response.data.batches[0]);
          }
        },
        error: err => {
          this.loading.set(false);
          const errorMessage = err.error?.message || err.error?.errorResponse?.error || 'Failed to retrieve results';
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onClearAll(): void {
    this.datesInitialized = false;
    this.searchForm.reset();
    this.searchForm.markAsPristine();
    this.searchForm.markAsUntouched();
    Object.keys(this.searchForm.controls).forEach(key => {
      this.searchForm.get(key)?.setErrors(null);
    });
    this.contractDescription.set('');
    this.contractSearchCtrl.setValue('');
    this.submitted.set(false);
    this.hasSearched.set(false);
    this.error.set(null);
    this.allBatches.set([]);
    this.totalBatches.set(0);
    this.selectedBatch.set(null);
    this.selectedUnit.set(null);
    this.detailLoading.set(false);
    this.lastChangedDateField = null;
    this.fromDateInputText = '';
    this.toDateInputText = '';
    this.clearAllSearchTerms();

    // Reset flag allows the effect to repopulate default dates
    // The effect will fire after reset() clears the form
  }

  onBatchSelected(batch: BatchRecord | BatchDisplay): void {
    const rec = batch as BatchRecord;
    if (rec.units?.length > 0) {
      this.selectedBatch.set(rec);
      this.selectedUnit.set(null);
      this.onUnitSelected(rec.units[0]);
      return;
    }
    this.batchDetailTrigger$.next({ batch: rec, contractId: this.searchForm.value.contractId });
  }

  onUnitSelected(unit: UnitRecord | UnitDisplay): void {
    this.selectedUnit.set(unit as UnitRecord);
  }

  onBatchSearch(value: string): void {
    this.batchSearchTerm.set(value);
  }

  onUnitSearch(value: string): void {
    this.unitSearchTerm.set(value);
  }

  onTestSearch(value: string): void {
    this.testSearchTerm.set(value);
  }

  clearAllSearchTerms(): void {
    this.batchSearchTerm.set('');
    this.unitSearchTerm.set('');
    this.testSearchTerm.set('');
  }

  private updateColumnHeaderCounts(batchCount: number, unitCount: number, testCount: number): void {
    this.batchTableConfig = {
      ...this.batchTableConfig,
      columns: this.batchTableConfig.columns.map(col =>
        col.key === 'batchId'
          ? { ...col, header: batchCount > 0 ? `Batch ID (${batchCount})` : 'Batch ID' }
          : { ...col }
      )
    };

    this.unitTableConfig = {
      ...this.unitTableConfig,
      columns: this.unitTableConfig.columns.map(col => {
        const newCol = col.key === 'unitIdDisplay'
          ? { ...col, header: unitCount > 0 ? `Unit ID (${unitCount})` : 'Unit ID' }
          : { ...col };
        // Apply cell template for Unit ID column
        if (col.key === 'unitIdDisplay' && this.unitIdCellTpl) {
          newCol.cellTemplate = this.unitIdCellTpl;
        }
        return newCol;
      })
    };

    this.testTableConfig = {
      ...this.testTableConfig,
      columns: this.testTableConfig.columns.map(col => {
        const newCol = col.key === 'resultStatus1'
          ? { ...col, header: testCount > 0 ? `Result(${testCount})` : 'Result' }
          : { ...col };
        // Apply cell templates for test result columns
        if (col.key === 'testId' && this.testIdCellTpl) {
          newCol.cellTemplate = this.testIdCellTpl;
        } else if (col.key === 'resultStatus1' && this.resultCellTpl) {
          newCol.cellTemplate = this.resultCellTpl;
        } else if (col.key === 'interimResult' && this.interimResultCellTpl) {
          newCol.cellTemplate = this.interimResultCellTpl;
        }
        return newCol;
      })
    };
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  private formatDateTime(dateTimeString: string | null): string {
    if (!dateTimeString) return '';
    const m = moment(dateTimeString);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm') : dateTimeString;
  }

  /**
   * Format a GMT/UTC datetime string to chapter-local time
   * Used for fields like qcTestDate that come from API in GMT
   * @param gmtDateTimeString - GMT/UTC datetime string from API
   * @returns Formatted string in chapter-local time (DD-MMM-YYYY, HH:mm)
   */
  private formatDateTimeWithTimezone(gmtDateTimeString: string | null): string {
    if (!gmtDateTimeString) return '';
    const gmtMoment = moment.utc(gmtDateTimeString);
    if (!gmtMoment.isValid()) return gmtDateTimeString;

    // Convert GMT to chapter-local time using ChapterTimezoneService
    const localMoment = this.chapterTimezoneService.convertGmtToLocal(gmtMoment);
    return localMoment.format('DD-MMM-YYYY, HH:mm');
  }

  private formatUnitIdWithSuffix(unitId: string, checkDigit: string): string {
    if (!checkDigit) return unitId;
    return `${unitId}-${checkDigit}`;
  }

  private hasReactiveResult(unit: UnitRecord): boolean {
    return unit.testResults.some(test =>
      test.resultStatus1 === 'R' || test.interimResult === 'R'
    );
  }

  getResultColor(result: string): string | undefined {
    if (result?.toUpperCase() === 'R') return '#d32f2f';
    return undefined;
  }

  /**
   * Initialize page header configuration from menu item
   * @returns Initial PageHeaderConfig
   */
  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || '';

    return {
      title,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ],
      subtitle: ''
    };
  }
}
