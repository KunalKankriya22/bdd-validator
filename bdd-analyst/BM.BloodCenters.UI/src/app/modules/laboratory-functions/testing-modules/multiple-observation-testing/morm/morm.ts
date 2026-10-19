import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import moment, { Moment } from 'moment';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared components and services
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { RouteKey } from '../../../../../core/constants/route-keys';

// Module-specific imports
import { MormApiService } from './services/morm-api.service';
import {
  TestBandDto,
  MatrixResultDto,
  MormRow,
  MormFilterFormValue,
  RESULT_VALUES,
  MultipleObservationResultMatrixDto,
  SaveMultipleObservationResultMatrixRequestDto,
  SaveMatrixResultDto,
  TestDropdownDto,
  TestTypeDropdownDto,
  ResultInterpretationLovDto
} from './models/morm.model';

/**
 * Multiple Observation Result Matrix Component
 * Defines test result observations and valid results for a test by manufacturer
 * JIRA: MLT-13336
 */
@Component({
  selector: 'app-morm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './morm.html',
  styleUrl: './morm.scss'
})
export class MultipleObservationResultMatrixComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `morm-${MultipleObservationResultMatrixComponent.nextId++}`;

  // ID generator methods
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(MormApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingDropdowns = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly testBands = signal<TestBandDto[]>([]);
  protected readonly resultRows = signal<MormRow[]>([]);
  protected readonly selectedTestId = signal<string | null>(null);
  protected readonly selectedTestType = signal<string | null>(null);
  protected readonly formTestId = signal<string | null>(null);
  protected readonly formTestType = signal<string | null>(null);
  protected readonly testDescription = signal<string>('-');
  protected readonly testTypeDescription = signal<string>('-');
  protected readonly tests = signal<TestDropdownDto[]>([]);
  protected readonly testTypes = signal<TestTypeDropdownDto[]>([]);
  protected readonly resultInterpretations = signal<ResultInterpretationLovDto[]>([]);

  // Search controls for dropdowns
  testSearchControl = new FormControl<string>('');
  testTypeSearchControl = new FormControl<string>('');

  // Filtered options
  filteredTests = signal<TestDropdownDto[]>([]);
  filteredTestTypes = signal<TestTypeDropdownDto[]>([]);

  // Sentinel values for disabled mat-option rows
  readonly selectPanelLoadingValue = '__SELECT_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__SELECT_PANEL_EMPTY__';

  // Band values for dropdowns
  readonly bandValues = RESULT_VALUES;

  // Section and column headers
  readonly sectionHeaders = {
    bandValues: 'Band Values',
    resultInterpretation: 'Result Interpretation Description'
  };

  readonly columnHeaders = {
    resultInterpretation: 'Result Interpretation',
    effectiveDate: 'Effective Date',
    terminationDate: 'Termination Date'
  };

  // Page header config
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Filter form
  filterForm!: FormGroup<{
    testId: FormControl<string | null>;
    testType: FormControl<string | null>;
  }>;

  // Computed values
  protected readonly hasData = computed(() => {
    return this.resultRows().length > 0;
  });

  protected readonly canRetrieve = computed(() => {
    const testId = this.formTestId();
    const testType = this.formTestType();
    return !!(testId && testType);
  });

  protected readonly canClearFilters = computed(() => true);

  protected readonly testIdTooltip = computed(() => {
    const testId = this.formTestId();
    if (!testId) return '';
    const test = this.tests().find(t => t.testId === testId);
    return test?.display || testId;
  });

  protected readonly testTypeTooltip = computed(() => {
    const testType = this.formTestType();
    if (!testType) return '';
    const type = this.testTypes().find(t => t.testType === testType);
    return type?.display || testType;
  });

  protected readonly hasDirtyRows = computed(() => {
    return this.resultRows().some(row => row.isDirty && !row.isDeleted);
  });

  protected readonly hasDuplicates = computed(() => {
    return !!this.checkForDuplicates();
  });

  protected readonly duplicateErrorMessage = computed(() => {
    return this.checkForDuplicates() || '';
  });

  protected readonly canSave = computed(() => {
    const dirtyRows = this.resultRows().filter(row => row.isDirty && !row.isDeleted);
    if (dirtyRows.length === 0) return false;

    // Check for duplicates
    if (this.hasDuplicates()) return false;

    // Check if all dirty rows are valid
    return dirtyRows.every(row => this.isRowValid(row));
  });

  constructor() {
    this.initializeForm();
    this.initializePageHeader();
    this.setupSearchFilters();
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdowns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      testId: new FormControl<string | null>(null, Validators.required),
      testType: new FormControl<string | null>(null, Validators.required)
    });

    // Subscribe to form value changes to update signals
    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.formTestId.set(value ?? null);
      });

    this.filterForm.get('testType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.formTestType.set(value ?? null);
      });
  }

  private initializePageHeader(): void {
    // Update page header config when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.MultipleObservationResultMatrix].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.pageHeaderConfig = {
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

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAllFilters();
        this.loadDropdowns();
      });
  }

  private setupSearchFilters(): void {
    // Test search filter
    this.testSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const filtered = this.tests().filter(test =>
          test.display.toLowerCase().includes(searchTerm?.toLowerCase() || '')
        );
        this.filteredTests.set(filtered);
      });

    // Test type search filter
    this.testTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const filtered = this.testTypes().filter(type =>
          type.display.toLowerCase().includes(searchTerm?.toLowerCase() || '')
        );
        this.filteredTestTypes.set(filtered);
      });
  }

  private loadDropdowns(): void {
    this.loadingDropdowns.set(true);

    // Load tests LOV
    this.apiService.getTestsLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingDropdowns.set(false))
      )
      .subscribe({
        next: (data) => {
          const tests: TestDropdownDto[] = data.map(item => ({
            testId: item.testId,
            description: item.testDescription || '',
            display: item.testDescription
              ? `${item.testId} - ${item.testDescription}`
              : item.testId
          }));
          this.tests.set(tests);
          this.filteredTests.set(tests);
        },
        error: (error) => {
          console.error('Error loading tests LOV:', error);
          this.tests.set([]);
          this.filteredTests.set([]);
        }
      });
  }

  private loadTestTypesForTest(testId: string): void {
    if (!testId) {
      this.testTypes.set([]);
      this.filteredTestTypes.set([]);
      return;
    }

    this.loadingDropdowns.set(true);

    this.apiService.getTestTypesLov(testId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingDropdowns.set(false))
      )
      .subscribe({
        next: (data) => {
          const types: TestTypeDropdownDto[] = data.map(item => ({
            testType: item.testType,
            description: item.testTypeDescription || '',
            display: item.testTypeDescription
              ? `${item.testType} - ${item.testTypeDescription}`
              : item.testType
          }));
          this.testTypes.set(types);
          this.filteredTestTypes.set(types);
        },
        error: (error) => {
          console.error('Error loading test types LOV:', error);
          this.testTypes.set([]);
          this.filteredTestTypes.set([]);
        }
      });
  }

  // Event handlers
  onTestIdChanged(): void {
    const testId = this.filterForm.get('testId')?.value ?? null;
    this.selectedTestId.set(testId);

    // Load test types when test ID changes
    if (testId) {
      this.loadTestTypesForTest(testId);

      // Update description from selected test
      const test = this.tests().find(t => t.testId === testId);
      this.testDescription.set(test?.description || testId);
    } else {
      this.testTypes.set([]);
      this.filteredTestTypes.set([]);
      this.testDescription.set('-');

      // Clear test type selection
      this.filterForm.patchValue({ testType: null });
    }
  }

  onTestTypeChanged(): void {
    const testType = this.filterForm.get('testType')?.value ?? null;
    if (testType) {
      const type = this.testTypes().find(t => t.testType === testType);
      this.testTypeDescription.set(type?.description || testType);
    } else {
      this.testTypeDescription.set('-');
    }
  }

  onTestSelectOpened(isOpen: boolean): void {
    if (isOpen) {
      this.testSearchControl.setValue('');
    }
  }

  onTestTypeSelectOpened(isOpen: boolean): void {
    if (isOpen) {
      this.testTypeSearchControl.setValue('');
    }
  }

  onRetrieve(): void {
    if (!this.canRetrieve()) return;

    const testId = this.filterForm.get('testId')?.value!;
    const testType = this.filterForm.get('testType')?.value!;

    this.selectedTestId.set(testId);
    this.selectedTestType.set(testType);

    this.loading.set(true);

    this.apiService.getMatrix(testId, testType)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data: MultipleObservationResultMatrixDto) => {
          this.testBands.set(data.testBands);
          this.testDescription.set(data.testDescription || testId);
          this.testTypeDescription.set(data.testTypeDescription || testType);

          // Convert matrix results to rows, prepend empty row for new entry
          const rows: MormRow[] = data.matrixResults.map(result => this.mapDtoToRow(result, testId, testType));
          const emptyRow = this.createEmptyRow(testId, testType, data.testBands);
          this.resultRows.set([emptyRow, ...rows]);

          this.snackbarService.showSuccess(`Retrieved ${rows.length} record(s)`);
          this.loadResultInterpretations(testId);
        },
        error: (error) => {
          console.error('Error retrieving matrix data:', error);
          this.testBands.set([]);
          this.resultRows.set([]);
          this.resultInterpretations.set([]);
          this.testDescription.set('-');
          this.testTypeDescription.set('-');

          const errorMessage = error?.error?.message || 'Failed to retrieve matrix data';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onCancel(): void {
    this.onClearAllFilters();
  }

  onClearAllFilters(): void {
    this.filterForm.reset();
    this.filterForm.markAsPristine();
    this.filterForm.markAsUntouched();
    Object.values(this.filterForm.controls).forEach(control => {
      control.markAsPristine();
      control.markAsUntouched();
      control.setErrors(null);
    });
    this.selectedTestId.set(null);
    this.selectedTestType.set(null);
    this.formTestId.set(null);
    this.formTestType.set(null);
    this.resultRows.set([]);
    this.testBands.set([]);
    this.resultInterpretations.set([]);
    this.testDescription.set('-');
    this.testTypeDescription.set('-');
  }

  onClearAllTable(): void {
    // Reset all dirty rows to original state
    const rows = this.resultRows();
    const clearedRows = rows.map(row => {
      if (row.isDirty && row.originalData) {
        return this.mapDtoToRow(row.originalData, row.testId, row.testType);
      }
      return row;
    }).filter(row => !row.isNew);

    this.resultRows.set(clearedRows);
    this.snackbarService.showInfo('All changes cleared');
  }

  private checkForDuplicates(): string | null {
    const dirtyRows = this.resultRows().filter(row => row.isDirty && !row.isDeleted);
    const testId = this.selectedTestId();
    const testType = this.selectedTestType();

    for (const currentRow of dirtyRows) {
      // Check against all existing rows (excluding the current row if editing)
      const duplicate = this.resultRows().find(row => {
        // Skip if same row (when editing existing record)
        if (currentRow.setNumber && row.setNumber === currentRow.setNumber) {
          return false;
        }

        // Skip deleted rows
        if (row.isDeleted) {
          return false;
        }

        // Check composite key: testId + testType + testIntp + all band values
        if (row.testId !== testId || row.testType !== testType) {
          return false;
        }

        if (row.testIntp !== currentRow.testIntp) {
          return false;
        }

        // Check all band values match
        const bandKeys = Object.keys(currentRow.results);
        const allBandsMatch = bandKeys.every(key => {
          const currentVal = currentRow.results[key] || '';
          const existingVal = row.results[key] || '';
          return currentVal.toUpperCase() === existingVal.toUpperCase();
        });

        return allBandsMatch;
      });

      if (duplicate) {
        return 'A record with this Test Interpretation and band values already exists.';
      }
    }

    return null;
  }

  onSave(): void {
    this.resultRows().forEach(row => {
      if (row.isNew && (row.testIntp || row.effDate || row.termDate || Object.values(row.results).some(v => v != null))) {
        if (!row.bandsTouched) row.bandsTouched = {};
        Object.keys(row.results).forEach(key => { row.bandsTouched![key] = true; });
        row.testIntpTouched = true;
        row.effDateTouched = true;
      }
    });
    this.resultRows.set([...this.resultRows()]);

    if (!this.canSave()) return;

    // Check for duplicates before API call
    const duplicateError = this.checkForDuplicates();
    if (duplicateError) {
      this.snackbarService.showError(duplicateError);
      return;
    }

    const testId = this.selectedTestId();
    const testType = this.selectedTestType();

    if (!testId || !testType) {
      this.snackbarService.showError('Test ID and Test Type are required');
      return;
    }

    const dirtyRows = this.resultRows().filter(row => row.isDirty && !row.isDeleted);

    // Convert dirty rows to save DTOs
    const matrixResults: SaveMatrixResultDto[] = dirtyRows.map(row => {
      // Pass null for blank bands (backend skips inserting/deletes the row for null bands)
      const results: Record<string, string | null> = {};
      Object.keys(row.results).forEach(key => {
        const val = row.results[key];
        results[key] = (val != null && val !== '') ? val : null;
      });

      return {
        testInterpretation: row.testIntp,
        setNo: row.setNumber ?? null,
        effDate: row.effDate ? row.effDate.toISOString() : null,
        termDate: row.termDate ? row.termDate.toISOString() : null,
        results
      };
    });

    const request: SaveMultipleObservationResultMatrixRequestDto = {
      testId,
      testType,
      matrixResults
    };

    this.saving.set(true);

    this.apiService.saveMatrix(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (response) => {
          const { insertedCount = 0, updatedCount = 0 } = response.data;

          // Mark all dirty rows as clean and not new
          const updatedRows = this.resultRows().map(row => ({
            ...row,
            isDirty: false,
            isNew: false
          }));

          this.resultRows.set(updatedRows);

          this.snackbarService.showSuccess(
            `Successfully saved: ${insertedCount} inserted, ${updatedCount} updated`
          );
        },
        error: (error) => {
          console.error('Error saving matrix data:', error);
          const errorMessage = error?.error?.message || 'Failed to save matrix data';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  private loadResultInterpretations(testId: string): void {
    this.apiService.getResultInterpretationsLov(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.resultInterpretations.set(data);
        },
        error: (error) => {
          console.error('Error loading result interpretations LOV:', error);
          this.resultInterpretations.set([]);
        }
      });
  }

  onTestIntpChange(row: MormRow, value: string): void {
    row.testIntp = value;
    row.testIntpTouched = true;
    row.isDirty = true;
    this.resultRows.set([...this.resultRows()]);
  }

  onTestIntpDropdownOpened(isOpen: boolean, row: MormRow): void {
    if (!isOpen) {
      row.testIntpTouched = true;
      this.resultRows.set([...this.resultRows()]);
    }
  }

  onBandValueChange(row: MormRow, bandKey: string, value: string | null): void {
    row.results[bandKey] = value ? value.toUpperCase() : '';
    if (!row.bandsTouched) row.bandsTouched = {};
    row.bandsTouched[bandKey] = true;
    row.isDirty = true;
    this.resultRows.set([...this.resultRows()]);
  }

  onBandBlur(row: MormRow, bandKey: string): void {
    if (!row.bandsTouched) row.bandsTouched = {};
    row.bandsTouched[bandKey] = true;
    this.resultRows.set([...this.resultRows()]);
  }

  protected readonly formatDate = (value: any): string => {
    return DateFieldValidationUtility.formatDateForUI(value) || '-';
  };

  // ── Date filters ──

  effDateFilter = DateFieldValidationUtility.createEffectiveDateFilter(
    this.headerService.chapterTimeZone()
  );

  private termDateFilters = new Map<MormRow, (date: moment.Moment | null) => boolean>();

  getTermDateFilter(row: MormRow): (date: moment.Moment | null) => boolean {
    if (!this.termDateFilters.has(row)) {
      this.termDateFilters.set(row, (date: moment.Moment | null): boolean => {
        if (!date) return true;
        try {
          const checkDate = moment(date).clone().startOf('day');
          const today = this.getChapterLocalDate();
          if (checkDate.isBefore(today)) return false;
          if (row.effDate) {
            const effMoment = moment.isMoment(row.effDate) ? (row.effDate as moment.Moment).clone() : moment(row.effDate);
            if (effMoment.isValid() && checkDate.isBefore(effMoment.clone().startOf('day'))) return false;
          }
          return true;
        } catch {
          return true;
        }
      });
    }
    return this.termDateFilters.get(row)!;
  }

  private getChapterLocalDate(): moment.Moment {
    const localDate = this.chapterTimezoneService.getChapterLocalDate();
    if (!localDate || !localDate.isValid()) {
      return moment().startOf('day');
    }
    return localDate.clone().startOf('day');
  }

  // ── Field error methods ──

  getBandError(row: MormRow, bandKey: string): string {
    if (!row.bandsTouched?.[bandKey]) return '';
    const value = row.results[bandKey];
    if (value == null || value === '') return '';
    if (!['P', 'N', 'I', '?'].includes(value.toUpperCase())) {
      return 'Must be: P, N, I, ?, or blank';
    }
    return '';
  }

  getTestIntpError(row: MormRow): string {
    if (!row.isNew) return '';
    if (!row.testIntpTouched) return '';
    if (!row.testIntp) return 'Result Interpretation is required';
    return '';
  }

  getEffDateError(row: MormRow): string {
    if (!row.effDateTouched) return '';

    if (row.effDateRawInput?.trim() && !row.effDate) {
      return 'Effective Date is invalid';
    }

    if (row.isNew && !row.effDate) {
      return 'Effective Date is required';
    }

    if (!row.isNew && !row.effDate) return '';

    try {
      const effMoment = moment(row.effDate);
      if (!effMoment.isValid()) {
        return 'Effective Date is invalid';
      }

      const todayStart = this.getChapterLocalDate();
      if (effMoment.clone().startOf('day').isBefore(todayStart)) {
        return 'Effective Date cannot be past date';
      }
    } catch {
      return 'Effective Date is invalid';
    }

    return '';
  }

  getTermDateError(row: MormRow): string {
    if (!row.termDateTouched) return '';

    if (row.termDateRawInput?.trim() && !row.termDate) {
      return 'Termination Date is invalid';
    }

    if (!row.termDate) return '';

    try {
      const termMoment = moment(row.termDate);
      if (!termMoment.isValid()) {
        return 'Termination Date is invalid';
      }

      const todayStart = this.getChapterLocalDate();
      if (termMoment.clone().startOf('day').isBefore(todayStart)) {
        return 'Termination Date cannot be past date';
      }

      if (row.effDate) {
        const effMoment = moment(row.effDate);
        if (effMoment.isValid() && termMoment.clone().startOf('day').isBefore(effMoment.clone().startOf('day'))) {
          return 'Termination Date must be >= Effective Date';
        }
      }
    } catch {
      return 'Termination Date is invalid';
    }

    return '';
  }

  // ── Error state matchers ──

  private bandMatchers = new Map<MormRow, Map<string, ErrorStateMatcher>>();
  private testIntpMatchers = new Map<MormRow, ErrorStateMatcher>();
  private effDateMatchers = new Map<MormRow, ErrorStateMatcher>();
  private termDateMatchers = new Map<MormRow, ErrorStateMatcher>();

  getBandMatcher(row: MormRow, bandKey: string): ErrorStateMatcher {
    if (!this.bandMatchers.has(row)) {
      this.bandMatchers.set(row, new Map());
    }
    const rowMatchers = this.bandMatchers.get(row)!;
    if (!rowMatchers.has(bandKey)) {
      rowMatchers.set(bandKey, {
        isErrorState: () => !!this.getBandError(row, bandKey)
      });
    }
    return rowMatchers.get(bandKey)!;
  }

  getTestIntpMatcher(row: MormRow): ErrorStateMatcher {
    if (!this.testIntpMatchers.has(row)) {
      this.testIntpMatchers.set(row, {
        isErrorState: () => !!this.getTestIntpError(row)
      });
    }
    return this.testIntpMatchers.get(row)!;
  }

  getEffDateMatcher(row: MormRow): ErrorStateMatcher {
    if (!this.effDateMatchers.has(row)) {
      this.effDateMatchers.set(row, {
        isErrorState: () => !!this.getEffDateError(row)
      });
    }
    return this.effDateMatchers.get(row)!;
  }

  getTermDateMatcher(row: MormRow): ErrorStateMatcher {
    if (!this.termDateMatchers.has(row)) {
      this.termDateMatchers.set(row, {
        isErrorState: () => !!this.getTermDateError(row)
      });
    }
    return this.termDateMatchers.get(row)!;
  }

  // ── Date event handlers ──

  onEffDateChange(row: MormRow, value: any): void {
    row.effDateTouched = true;
    if (value) {
      const momentValue = moment.isMoment(value) ? value : moment(value);
      row.effDate = momentValue.isValid() ? momentValue : null;
      if (row.effDate) row.effDateRawInput = undefined;
    } else {
      row.effDate = null;
    }
    row.isDirty = true;
    this.termDateFilters.delete(row);
    this.resultRows.set([...this.resultRows()]);
  }

  onTermDateChange(row: MormRow, value: any): void {
    row.termDateTouched = true;
    if (value) {
      const momentValue = moment.isMoment(value) ? value : moment(value);
      row.termDate = momentValue.isValid() ? momentValue : null;
      if (row.termDate) row.termDateRawInput = undefined;
    } else {
      row.termDate = null;
    }
    row.isDirty = true;
    this.resultRows.set([...this.resultRows()]);
  }

  onEffDateInput(event: Event, row: MormRow): void {
    const value = (event.target as HTMLInputElement).value;
    row.effDateTouched = true;
    row.effDateRawInput = value;
    row.isDirty = true;
    this.resultRows.set([...this.resultRows()]);
  }

  onEffDateBlur(row: MormRow): void {
    row.effDateTouched = true;
    this.resultRows.set([...this.resultRows()]);
  }

  /**
   * Determines if the effective date field should be editable for a given row.
   * Matches Oracle Forms PRE-TEXT-ITEM trigger on EFF_DATE that disables the field
   * if the effective date is in the past.
   */
  protected isEffDateEditable(row: MormRow): boolean {
    if (row.isNew) return true; // Always editable for new rows

    if (!row.effDate) return true; // No date yet, allow editing

    const chapterLocalDate = this.getChapterLocalDate();
    const effMoment = moment(row.effDate).clone().startOf('day');

    // Disable if effective date is in the past
    return !effMoment.isBefore(chapterLocalDate);
  }

  onTermDateInput(event: Event, row: MormRow): void {
    const value = (event.target as HTMLInputElement).value;
    row.termDateTouched = true;
    row.termDateRawInput = value;
    row.isDirty = true;
    this.resultRows.set([...this.resultRows()]);
  }

  onTermDateBlur(row: MormRow): void {
    row.termDateTouched = true;
    this.resultRows.set([...this.resultRows()]);
  }

  // Helper methods
  trackByRow(index: number, row: MormRow): string {
    return `${row.testId}-${row.testType}-${row.testIntp}-${row.setNumber || index}`;
  }

  trackByBand(index: number, band: TestBandDto): number {
    return band.bandSeq;
  }

  getBandKey(band: TestBandDto): string {
    return band.bandName;
  }

  getResultInterpretationDisplay(intp: ResultInterpretationLovDto): string {
    return intp.description ? `${intp.resultCode} - ${intp.description}` : intp.resultCode;
  }

  private isRowValid(row: MormRow): boolean {
    if (!row.testId || !row.testType) return false;
    for (const bandKey of Object.keys(row.results)) {
      if (this.getBandError(row, bandKey)) return false;
    }
    if (!row.testIntp) return false;
    if (this.getTestIntpError(row)) return false;
    if (!row.effDate) return false;
    if (this.getEffDateError(row)) return false;
    if (this.getTermDateError(row)) return false;
    return true;
  }

  private createEmptyRow(testId: string, testType: string, bands: TestBandDto[]): MormRow {
    const results: Record<string, string | null> = {};
    bands.forEach(band => { results[band.bandName] = null; });
    return {
      testId,
      testType,
      testIntp: '',
      results,
      effDate: null,
      termDate: null,
      isNew: true,
      isDirty: false,
      isDeleted: false,
      errors: {}
    };
  }

  private mapDtoToRow(dto: MatrixResultDto, testId: string, testType: string, bands?: TestBandDto[]): MormRow {
    const results: Record<string, string | null> = {};
    const bandList = bands || this.testBands();
    bandList.forEach(band => { results[band.bandName] = dto.results[band.bandName] ?? null; });
    return {
      testId,
      testType,
      testIntp: dto.testInterpretation || '',
      setNumber: dto.setNo ?? undefined,
      results,
      effDate: dto.effDate ? moment(dto.effDate) : null,
      termDate: dto.termDate ? moment(dto.termDate) : null,
      isNew: false,
      isDirty: false,
      isDeleted: false,
      errors: {},
      originalData: dto
    };
  }
}
