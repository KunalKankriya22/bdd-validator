import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  effect,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { Subject, takeUntil, finalize } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';

import { TestByMachineIdApiService } from './services/test-by-machine-id-api.service';
import {
  InstrumentIdOption,
  InstrumentTestIdOption,
  LifeTrackTestOption,
  InstrumentTestModel,
  ApplicationSchedulingTestModel,
  InstrumentTestEditModel,
  ApplicationSchedulingTestEditModel,
  TestByMachineIdBulkUpsertDto,
  InstrumentTestUpsertDto,
  ApplicationSchedulingTestUpsertDto
} from './models/test-by-machine-id.model';
import { formatTableDate } from '@shared/utils/date-format.util';

// Custom DateAdapter to use chapter timezone for "today"
class ChapterTimezoneDateAdapter extends UppercaseMomentDateAdapter {
  private chapterMinDate: Moment | null = null;

  setChapterMinDate(date: Moment): void {
    this.chapterMinDate = date;
  }

  override today(): Moment {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? this.chapterMinDate.clone() : moment();
  }
}

@Component({
  selector: 'app-test-by-machine-id',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatInputModule,
    MatTooltipModule,
    MatDatepickerModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './test-by-machine-id.html',
  styleUrls: ['./test-by-machine-id.scss']
})
export class TestByMachineIdComponent implements OnInit, OnDestroy {
  // Header Configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  // Form Controls
  instrumentIdControl = new FormControl('', [Validators.required]);
  testIdControl = new FormControl(''); // Optional: can retrieve with just instrument ID

  // Dropdown Options
  instrumentIdOptions = signal<InstrumentIdOption[]>([]);
  testIdOptions = signal<InstrumentTestIdOption[]>([]);
  testOptions = signal<LifeTrackTestOption[]>([]);

  // Per-test result options for Instrument Tests (cascading)
  instrumentResult1Options = signal<string[]>([]);
  instrumentResult2Options = signal<string[]>([]);
  instrumentResult3Options = signal<string[]>([]);
  instrumentResult4Options = signal<string[]>([]);
  instrumentResult5Options = signal<string[]>([]);

  // Per-test result options for Application Tests (cascading)
  appResult1Options = signal<string[]>([]);
  appResult2Options = signal<string[]>([]);
  appResult3Options = signal<string[]>([]);
  appResult4Options = signal<string[]>([]);
  appResult5Options = signal<string[]>([]);
  appResult6Options = signal<string[]>([]);

  // Search form controls for dropdowns
  readonly instrumentIdSearchControl = new FormControl('');
  readonly testIdSearchControl = new FormControl('');
  readonly testOptionsSearchControl = new FormControl('');

  // Separate search controls for inline instrument test dropdowns (Fix #9)
  readonly instrTest1SearchControl = new FormControl('');
  readonly instrTest2SearchControl = new FormControl('');
  readonly instrTest3SearchControl = new FormControl('');
  readonly instrTest4SearchControl = new FormControl('');
  readonly instrTest5SearchControl = new FormControl('');

  // Separate search controls for inline application test dropdowns
  readonly appTest1SearchControl = new FormControl('');
  readonly appTest2SearchControl = new FormControl('');
  readonly appTest3SearchControl = new FormControl('');
  readonly appTest4SearchControl = new FormControl('');
  readonly appTest5SearchControl = new FormControl('');
  readonly appTest6SearchControl = new FormControl('');

  // Convert search FormControl values to signals for reactivity
  readonly instrumentIdSearch = signal('');
  readonly testIdSearch = signal('');
  readonly testOptionsSearch = signal('');
  readonly instrTest1Search = signal('');
  readonly instrTest2Search = signal('');
  readonly instrTest3Search = signal('');
  readonly instrTest4Search = signal('');
  readonly instrTest5Search = signal('');
  readonly appTest1Search = signal('');
  readonly appTest2Search = signal('');
  readonly appTest3Search = signal('');
  readonly appTest4Search = signal('');
  readonly appTest5Search = signal('');
  readonly appTest6Search = signal('');

  // Filtered options based on search
  readonly filteredInstrumentIds = computed(() => {
    const search = this.instrumentIdSearch().toLowerCase();
    const options = this.instrumentIdOptions();

    if (!search) return options;
    return options.filter(opt =>
      opt.instrumentId.toLowerCase().includes(search) ||
      (opt.description && opt.description.toLowerCase().includes(search))
    );
  });

  readonly filteredTestIds = computed(() => {
    const search = this.testIdSearch().toLowerCase();
    const options = this.testIdOptions();

    if (!search) return options;
    return options.filter(opt =>
      opt.testId.toLowerCase().includes(search) ||
      (opt.description && opt.description.toLowerCase().includes(search))
    );
  });

  readonly filteredTestOptions = computed(() => {
    const search = this.testOptionsSearch().toLowerCase();
    const options = this.testOptions();

    if (!search) return options;
    return options.filter(opt =>
      opt.testId.toLowerCase().includes(search) ||
      (opt.description && opt.description.toLowerCase().includes(search))
    );
  });

  // Per-column filtered instrument test IDs for inline dropdowns
  private filterTestIds(search: string) {
    const s = search.toLowerCase();
    const options = this.testOptions();
    if (!s) return options;
    return options.filter(opt =>
      opt.testId.toLowerCase().includes(s) ||
      (opt.description && opt.description.toLowerCase().includes(s))
    );
  }
  readonly filteredInstrTest1 = computed(() => this.filterTestIds(this.instrTest1Search()));
  readonly filteredInstrTest2 = computed(() => this.filterTestIds(this.instrTest2Search()));
  readonly filteredInstrTest3 = computed(() => this.filterTestIds(this.instrTest3Search()));
  readonly filteredInstrTest4 = computed(() => this.filterTestIds(this.instrTest4Search()));
  readonly filteredInstrTest5 = computed(() => this.filterTestIds(this.instrTest5Search()));

  // Per-column filtered application test options for inline dropdowns
  private filterAppTests(search: string) {
    const s = search.toLowerCase();
    const options = this.testOptions();
    if (!s) return options;
    return options.filter(opt =>
      opt.testId.toLowerCase().includes(s) ||
      (opt.description && opt.description.toLowerCase().includes(s))
    );
  }
  readonly filteredAppTest1 = computed(() => this.filterAppTests(this.appTest1Search()));
  readonly filteredAppTest2 = computed(() => this.filterAppTests(this.appTest2Search()));
  readonly filteredAppTest3 = computed(() => this.filterAppTests(this.appTest3Search()));
  readonly filteredAppTest4 = computed(() => this.filterAppTests(this.appTest4Search()));
  readonly filteredAppTest5 = computed(() => this.filterAppTests(this.appTest5Search()));
  readonly filteredAppTest6 = computed(() => this.filterAppTests(this.appTest6Search()));

  // Data Sources
  instrumentTestsData: InstrumentTestModel[] = [];
  applicationSchedulingTestsData: ApplicationSchedulingTestModel[] = [];

  // Inline Edit Mode State
  editingRowIndex: number | null = null;
  editableInstrumentRow: InstrumentTestEditModel | null = null;
  editableApplicationRow: ApplicationSchedulingTestEditModel | null = null;
  originalInstrumentRow: InstrumentTestModel | null = null;
  originalApplicationRow: ApplicationSchedulingTestModel | null = null;
  isAddingNewCombination = false; // Track if user clicked "Add New Combination" vs "Edit Combination"
  effDateTouched = false; // Track if user modified effective date during edit

  // Loading States
  isLoading = false;
  isRetrieving = false;

  // Error States (from API)
  duplicateCombinationError = false;

  // Minimum date for effective date (chapter's today)
  minDate!: moment.Moment;

  get isEditMode(): boolean {
    return this.editingRowIndex !== null;
  }

  // Row selection state
  selectedInstrumentRowIndex: number | null = null;
  selectedApplicationRowIndex: number | null = null;

  // Sort state
  instrumentTestsSortDirection: 'asc' | 'desc' = 'asc';
  applicationTestsSortDirection: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();

  constructor(
    private service: TestByMachineIdApiService,
    private snackbarService: SnackbarService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private dateAdapter: DateAdapter<Moment>
  ) {
    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneDateAdapter) {
      this.dateAdapter.setChapterMinDate(this.minDate);
    }

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });

    // Subscribe to search control changes and update signals
    this.instrumentIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.instrumentIdSearch.set(value || '');
      });

    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.testIdSearch.set(value || '');
      });

    this.testOptionsSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.testOptionsSearch.set(value || '');
      });

    // Subscribe to inline instrument test search controls
    const instrSearchPairs = [
      [this.instrTest1SearchControl, this.instrTest1Search],
      [this.instrTest2SearchControl, this.instrTest2Search],
      [this.instrTest3SearchControl, this.instrTest3Search],
      [this.instrTest4SearchControl, this.instrTest4Search],
      [this.instrTest5SearchControl, this.instrTest5Search],
    ] as const;
    for (const [control, sig] of instrSearchPairs) {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => sig.set(v || ''));
    }

    // Subscribe to inline application test search controls
    const appSearchPairs = [
      [this.appTest1SearchControl, this.appTest1Search],
      [this.appTest2SearchControl, this.appTest2Search],
      [this.appTest3SearchControl, this.appTest3Search],
      [this.appTest4SearchControl, this.appTest4Search],
      [this.appTest5SearchControl, this.appTest5Search],
      [this.appTest6SearchControl, this.appTest6Search],
    ] as const;
    for (const [control, sig] of appSearchPairs) {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => sig.set(v || ''));
    }
  }

  ngOnInit(): void {
    this.loadInstrumentIds();
    // loadTestIds will be called when instrument is selected
    this.loadTestOptions();

    // Subscribe to chapter changes from header
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update minDate and date adapter for new chapter timezone
        const chapterTimezone = this.headerService.chapterTimeZone();
        this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
        if (this.dateAdapter instanceof ChapterTimezoneDateAdapter) {
          this.dateAdapter.setChapterMinDate(this.minDate);
        }

        this.reloadPageData();
      });

    // Auto-query disabled: User must click "Retrieve" button to load data
    // Oracle Forms Pattern was: Auto-query when Machine Test ID changes
    // Commented out to require explicit user action via Retrieve button
    /*
    this.testIdControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500)
      )
      .subscribe(machineTestId => {
        if (this.instrumentIdControl.value && machineTestId) {
          this.autoQueryOnTestIdEntry();
        }
      });
    */
  }

  /**
   * DISABLED: Auto-query functionality removed - users must click "Retrieve" button
   *
   * Previous Oracle Forms Pattern: Auto-query when test ID is entered
   * Matches FMB: CTRL_BLK_1.MACHINE_TEST_ID KEY-NEXT-ITEM trigger
   * - If records exist: Queries and displays (UPDATE mode)
   * - If no records: Creates blank form (INSERT mode)
   *
   * This method is kept for reference but is no longer called.
   * Use onRetrieve() method instead (triggered by Retrieve button).
   */
  /*
  private autoQueryOnTestIdEntry(): void {
    if (!this.instrumentIdControl.value) {
      return;
    }

    this.isRetrieving = true;

    const params = {
      instrumentId: this.instrumentIdControl.value!,
      testId: this.testIdControl.value || undefined
    };

    this.service.getTestData(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isRetrieving = false)
      )
      .subscribe({
        next: (response) => {
          const hasData = response.instrumentTests && response.instrumentTests.length > 0;

          if (hasData) {
            // Records exist - show for editing (Oracle Forms QUERY mode)
            this.instrumentTestsData = response.instrumentTests || [];
            this.applicationSchedulingTestsData = response.applicationSchedulingTests || [];
            this.selectedInstrumentRowIndex = 0;
            this.selectedApplicationRowIndex = 0;
            this.isAddingNewCombination = false;
          } else {
            // No records - create blank form (Oracle Forms INSERT mode)
            this.onAddNewCombination();
          }
        },
        error: (error) => {
          console.error('Error auto-querying test data:', error);
        }
      });
  }
  */

  /**
   * Reload all page data when chapter changes
   * Clears existing data and re-executes all API calls with new chapterId
   */
  private reloadPageData(): void {
    // Clear all existing data to avoid stale data
    this.clearAllData();

    // Reload dropdown options with new chapterId
    this.loadInstrumentIds();
    this.loadTestOptions();
  }

  /**
   * Clear all data and reset form state
   */
  private clearAllData(): void {
    // Clear form controls
    this.instrumentIdControl.reset();
    this.testIdControl.reset();

    // Clear dropdown options
    this.instrumentIdOptions.set([]);
    this.testIdOptions.set([]);
    this.testOptions.set([]);

    // Clear table data
    this.instrumentTestsData = [];
    this.applicationSchedulingTestsData = [];

    // Clear selection state
    this.selectedInstrumentRowIndex = null;
    this.selectedApplicationRowIndex = null;

    // Clear edit state
    this.editingRowIndex = null;
    this.editableInstrumentRow = null;
    this.editableApplicationRow = null;
    this.originalInstrumentRow = null;
    this.originalApplicationRow = null;
    this.isAddingNewCombination = false;

    // Clear error states
    this.duplicateCombinationError = false;

    // Clear loading states
    this.isLoading = false;
    this.isRetrieving = false;
  }

  private clearAllResultOptions(): void {
    this.instrumentResult1Options.set([]);
    this.instrumentResult2Options.set([]);
    this.instrumentResult3Options.set([]);
    this.instrumentResult4Options.set([]);
    this.instrumentResult5Options.set([]);
    this.appResult1Options.set([]);
    this.appResult2Options.set([]);
    this.appResult3Options.set([]);
    this.appResult4Options.set([]);
    this.appResult5Options.set([]);
    this.appResult6Options.set([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ================================ DATA LOADING ================================ */

  private loadInstrumentIds(): void {
    this.service.getInstrumentIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.instrumentIdOptions.set(options);
        },
        error: (error) => console.error('Error loading instrument IDs:', error)
      });
  }

  /**
   * Load test IDs for the selected instrument
   * Called when instrument ID is selected
   */
  private loadTestIds(instrumentId: string): void {
    this.service.getInstrumentTestIds(instrumentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.testIdOptions.set(options);
        },
        error: (error) => console.error('Error loading test IDs:', error)
      });
  }

  /**
   * Handle instrument ID change
   * Reload test IDs when instrument changes
   */
  onInstrumentIdChange(instrumentId: string): void {
    // Clear test ID selection
    this.testIdControl.reset();
    this.testIdOptions.set([]);

    // Reload test IDs for selected instrument
    if (instrumentId) {
      this.loadTestIds(instrumentId);
    }
  }

  private loadTestOptions(): void {
    this.service.getTestOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.testOptions.set(response.tests);
        },
        error: (error) => console.error('Error loading test options:', error)
      });
  }

  /**
   * Load result options for a specific test (cascading dropdown)
   */
  private loadResultOptionsForTest(testId: string, resultSignal: any): void {
    if (!testId) {
      resultSignal.set([]);
      return;
    }

    this.service.getTestResults(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          resultSignal.set(results);
        },
        error: (error) => {
          console.error(`Error loading results for test ${testId}:`, error);
          resultSignal.set([]);
        }
      });
  }

  onRetrieve(): void {
    // Mark instrument control as touched to show validation errors
    this.instrumentIdControl.markAsTouched();

    // Validate required field (only instrument ID is required)
    if (this.instrumentIdControl.invalid) {
      return;
    }

    this.isRetrieving = true;

    const params = {
      instrumentId: this.instrumentIdControl.value!,
      testId: this.testIdControl.value || undefined // Optional: pass only if selected
    };

    this.service.getTestData(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isRetrieving = false)
      )
      .subscribe({
        next: (response) => {
          this.instrumentTestsData = response.instrumentTests || [];
          this.applicationSchedulingTestsData = response.applicationSchedulingTests || [];
          // Auto-select first row in both tables (synchronized)
          const hasData = this.instrumentTestsData.length > 0 && this.applicationSchedulingTestsData.length > 0;
          this.selectedInstrumentRowIndex = hasData ? 0 : null;
          this.selectedApplicationRowIndex = hasData ? 0 : null;
        },
        error: (error) => {
          console.error('Error retrieving test data:', error);
        }
      });
  }

  /* ================================ SORTING ================================ */

  sortInstrumentTests(): void {
    // Toggle sort direction
    this.instrumentTestsSortDirection = this.instrumentTestsSortDirection === 'asc' ? 'desc' : 'asc';

    // Sort the data
    this.instrumentTestsData.sort((a, b) => {
      const valueA = (a.test1 || '').toLowerCase();
      const valueB = (b.test1 || '').toLowerCase();

      if (this.instrumentTestsSortDirection === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  }

  sortApplicationTests(): void {
    // Toggle sort direction
    this.applicationTestsSortDirection = this.applicationTestsSortDirection === 'asc' ? 'desc' : 'asc';

    // Sort the data
    this.applicationSchedulingTestsData.sort((a, b) => {
      const valueA = (a.test1 || '').toLowerCase();
      const valueB = (b.test1 || '').toLowerCase();

      if (this.applicationTestsSortDirection === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  }

  /* ================================ EDIT MODE ================================ */

  onEditCombination(): void {
    if (!this.instrumentIdControl.value) {
      this.snackbarService.showError('Please select an Instrument ID');
      return;
    }

    // Must have a selected row to edit
    if (this.selectedInstrumentRowIndex === null || this.selectedApplicationRowIndex === null) {
      this.snackbarService.showError('Please select a row to edit');
      return;
    }

    const rowIndex = this.selectedInstrumentRowIndex;
    const selectedRow = this.instrumentTestsData[rowIndex];

    // Sync the testIdControl with the selected row's testId for consistency
    if (selectedRow.testId && this.testIdControl.value !== selectedRow.testId) {
      this.testIdControl.setValue(selectedRow.testId, { emitEvent: false });
    }

    this.editingRowIndex = rowIndex;
    this.duplicateCombinationError = false;
    this.isAddingNewCombination = false; // Set flag for PUT API
    this.effDateTouched = false;

    // Clear all result option signals to avoid stale data from previous edit
    this.clearAllResultOptions();

    // Store originals for this row only
    this.originalInstrumentRow = JSON.parse(JSON.stringify(this.instrumentTestsData[rowIndex]));
    this.originalApplicationRow = JSON.parse(JSON.stringify(this.applicationSchedulingTestsData[rowIndex]));

    // Create editable version of selected row only
    this.editableInstrumentRow = {
      ...this.instrumentTestsData[rowIndex],
      isDirty: false,
      errors: {}
    };

    this.editableApplicationRow = {
      ...this.applicationSchedulingTestsData[rowIndex],
      effectiveDate: this.applicationSchedulingTestsData[rowIndex].effectiveDate
        ? moment(this.applicationSchedulingTestsData[rowIndex].effectiveDate)
        : null,
      terminationDate: this.applicationSchedulingTestsData[rowIndex].terminationDate
        ? moment(this.applicationSchedulingTestsData[rowIndex].terminationDate)
        : null,
      isDirty: false,
      errors: {}
    };

    // Load result options for existing test values in Instrument Tests
    this.loadResultOptionsForTest(this.editableInstrumentRow.test1 || '', this.instrumentResult1Options);
    this.loadResultOptionsForTest(this.editableInstrumentRow.test2 || '', this.instrumentResult2Options);
    this.loadResultOptionsForTest(this.editableInstrumentRow.test3 || '', this.instrumentResult3Options);
    this.loadResultOptionsForTest(this.editableInstrumentRow.test4 || '', this.instrumentResult4Options);
    this.loadResultOptionsForTest(this.editableInstrumentRow.test5 || '', this.instrumentResult5Options);

    // Load result options for existing test values in Application Scheduling Tests
    this.loadResultOptionsForTest(this.editableApplicationRow.test1 || '', this.appResult1Options);
    this.loadResultOptionsForTest(this.editableApplicationRow.test2 || '', this.appResult2Options);
    this.loadResultOptionsForTest(this.editableApplicationRow.test3 || '', this.appResult3Options);
    this.loadResultOptionsForTest(this.editableApplicationRow.defTest4 || '', this.appResult4Options);
    this.loadResultOptionsForTest(this.editableApplicationRow.defTest5 || '', this.appResult5Options);
    this.loadResultOptionsForTest(this.editableApplicationRow.defTest6 || '', this.appResult6Options);
  }

  onCancelEdit(): void {
    // If adding a new combination, remove the newly added row from the data arrays
    if (this.isAddingNewCombination && this.editingRowIndex !== null) {
      this.instrumentTestsData.splice(this.editingRowIndex, 1);
      this.applicationSchedulingTestsData.splice(this.editingRowIndex, 1);

      // Update selection after removing the row
      if (this.instrumentTestsData.length > 0) {
        this.selectedInstrumentRowIndex = 0;
        this.selectedApplicationRowIndex = 0;
      } else {
        this.selectedInstrumentRowIndex = null;
        this.selectedApplicationRowIndex = null;
      }
    }
    // If editing an existing row, restore the original values
    else if (!this.isAddingNewCombination && this.editingRowIndex !== null && this.originalInstrumentRow && this.originalApplicationRow) {
      this.instrumentTestsData[this.editingRowIndex] = JSON.parse(JSON.stringify(this.originalInstrumentRow));
      this.applicationSchedulingTestsData[this.editingRowIndex] = JSON.parse(JSON.stringify(this.originalApplicationRow));
    }

    // Clear edit state
    this.editingRowIndex = null;
    this.duplicateCombinationError = false;
    this.editableInstrumentRow = null;
    this.editableApplicationRow = null;
    this.originalInstrumentRow = null;
    this.originalApplicationRow = null;
    this.isAddingNewCombination = false;
    this.effDateTouched = false;
  }

  onAddNewCombination(): void {
    if (!this.instrumentIdControl.value) {
      this.snackbarService.showError('Please select an Instrument ID');
      return;
    }

    // Determine testId: use control value if selected, otherwise use from selected row
    let testIdForNewRow = this.testIdControl.value;

    if (!testIdForNewRow && this.selectedInstrumentRowIndex !== null) {
      // Use testId from currently selected row
      const selectedRow = this.instrumentTestsData[this.selectedInstrumentRowIndex];
      testIdForNewRow = selectedRow.testId;
      // Sync the control for consistency
      this.testIdControl.setValue(testIdForNewRow, { emitEvent: false });
    }

    if (!testIdForNewRow) {
      this.snackbarService.showError('Please select an Instrument Test ID or select a row to use its Test ID');
      return;
    }

    this.duplicateCombinationError = false;
    this.isAddingNewCombination = true; // Set flag for POST API

    // Create new empty rows
    const newInstrumentRow: InstrumentTestModel = {
      instrumentId: this.instrumentIdControl.value,
      testId: testIdForNewRow,
      test1: '',
      result1: '',
      test2: '',
      result2: '',
      test3: '',
      result3: '',
      test4: '',
      result4: '',
      test5: '',
      result5: '',
      poolSize: undefined,
      auditKey: 0
    };

    const newApplicationRow: ApplicationSchedulingTestModel = {
      instrumentId: this.instrumentIdControl.value,
      testId: testIdForNewRow,
      test1: '',
      result1: '',
      test2: '',
      result2: '',
      test3: '',
      result3: '',
      defTest4: '',
      result4: '',
      defTest5: '',
      result5: '',
      defTest6: '',
      result6: '',
      effectiveDate: null,
      terminationDate: null,
      auditKey: 0
    };

    // Add to beginning of data arrays
    this.instrumentTestsData.unshift(newInstrumentRow);
    this.applicationSchedulingTestsData.unshift(newApplicationRow);

    // Auto-select the new row and enter edit mode
    this.selectedInstrumentRowIndex = 0;
    this.selectedApplicationRowIndex = 0;
    this.editingRowIndex = 0;

    // Create editable versions
    this.editableInstrumentRow = {
      ...newInstrumentRow,
      isDirty: true,
      errors: {}
    };

    this.editableApplicationRow = {
      ...newApplicationRow,
      effectiveDate: null,
      terminationDate: null,
      isDirty: true,
      errors: {}
    };

    this.originalInstrumentRow = null;
    this.originalApplicationRow = null;
  }

  /* ================================ FIELD CHANGES ================================ */

  onInstrumentRowFieldChange(field: string, value: any): void {
    if (!this.editableInstrumentRow) return;

    (this.editableInstrumentRow as any)[field] = value;
    this.editableInstrumentRow.isDirty = true;

    if (this.editableInstrumentRow.errors && this.editableInstrumentRow.errors[field]) {
      delete this.editableInstrumentRow.errors[field];
    }

    // Clear duplicate error when user makes changes
    this.duplicateCombinationError = false;

    // Cascading dropdowns: Load result options and clear stale result when test changes
    if (field === 'test1') {
      this.editableInstrumentRow.result1 = '';
      this.loadResultOptionsForTest(value, this.instrumentResult1Options);
    } else if (field === 'test2') {
      this.editableInstrumentRow.result2 = '';
      this.loadResultOptionsForTest(value, this.instrumentResult2Options);
    } else if (field === 'test3') {
      this.editableInstrumentRow.result3 = '';
      this.loadResultOptionsForTest(value, this.instrumentResult3Options);
    } else if (field === 'test4') {
      this.editableInstrumentRow.result4 = '';
      this.loadResultOptionsForTest(value, this.instrumentResult4Options);
    } else if (field === 'test5') {
      this.editableInstrumentRow.result5 = '';
      this.loadResultOptionsForTest(value, this.instrumentResult5Options);
    }

    this.validateAllFields();
  }

  onApplicationRowFieldChange(field: string, value: any): void {
    if (!this.editableApplicationRow) return;

    (this.editableApplicationRow as any)[field] = value;
    this.editableApplicationRow.isDirty = true;

    if (this.editableApplicationRow.errors && this.editableApplicationRow.errors[field]) {
      delete this.editableApplicationRow.errors[field];
    }

    // Clear duplicate error when user makes changes
    this.duplicateCombinationError = false;

    // Cascading dropdowns: Load result options and clear stale result when test changes
    if (field === 'test1') {
      this.editableApplicationRow.result1 = '';
      this.loadResultOptionsForTest(value, this.appResult1Options);
    } else if (field === 'test2') {
      this.editableApplicationRow.result2 = '';
      this.loadResultOptionsForTest(value, this.appResult2Options);
    } else if (field === 'test3') {
      this.editableApplicationRow.result3 = '';
      this.loadResultOptionsForTest(value, this.appResult3Options);
    } else if (field === 'defTest4') {
      this.editableApplicationRow.result4 = '';
      this.loadResultOptionsForTest(value, this.appResult4Options);
    } else if (field === 'defTest5') {
      this.editableApplicationRow.result5 = '';
      this.loadResultOptionsForTest(value, this.appResult5Options);
    } else if (field === 'defTest6') {
      this.editableApplicationRow.result6 = '';
      this.loadResultOptionsForTest(value, this.appResult6Options);
    }

    this.validateAllFields();
  }

  /**
   * Validate effective date on change
   * Auto-converts dd-mm-yyyy to dd-MON-YYYY format
   */
  onEffectiveDateChange(event: MatDatepickerInputEvent<any>): void {
    if (!this.editableApplicationRow) return;

    // Clear previous error
    if (this.editableApplicationRow.errors) {
      delete this.editableApplicationRow.errors['effectiveDate'];
    }

    const inputValue = (event.targetElement as HTMLInputElement)?.value;

    // Check if the input is empty - REQUIRED FIELD
    if (!inputValue || inputValue.trim() === '') {
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      this.editableApplicationRow.errors['effectiveDate'] = 'Effective date is required';
      return;
    }

    // Try to parse manual input (dd-mm-yyyy or dd/mm/yyyy format)
    let parsedDate = null;
    if (!event.value && inputValue) {
      // Try parsing dd-mm-yyyy or dd/mm/yyyy format
      const dateFormats = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD-MMM-YYYY'];
      parsedDate = moment(inputValue, dateFormats, true);

      if (parsedDate.isValid()) {
        // Auto-convert to proper format and update the model
        this.editableApplicationRow.effectiveDate = parsedDate;
        // Update the input display to dd-MON-YYYY format
        const formattedDate = parsedDate.format('DD-MMM-YYYY');
        (event.targetElement as HTMLInputElement).value = formattedDate;
      }
    }

    // Check if the date is invalid after parsing attempts
    if (!event.value && (!parsedDate || !parsedDate.isValid())) {
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      this.editableApplicationRow.errors['effectiveDate'] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
      return;
    }

    // Mark effective date as touched so past-date validation applies
    this.effDateTouched = true;

    // FMB: Validate past dates for NEW/INSERT records AND when eff date is changed on existing records
    if (this.isAddingNewCombination || this.effDateTouched) {
      const selectedDate = parsedDate && parsedDate.isValid() ? parsedDate : moment(event.value);
      if (selectedDate.isBefore(this.minDate, 'day')) {
        if (!this.editableApplicationRow.errors) {
          this.editableApplicationRow.errors = {};
        }
        this.editableApplicationRow.errors['effectiveDate'] = `Date cannot be before ${this.minDate.format('DD-MMM-YYYY')}`;
      }
    }
  }

  /**
   * Validate termination date on change
   * Auto-converts dd-mm-yyyy to dd-MON-YYYY format
   */
  onTerminationDateChange(event: MatDatepickerInputEvent<any>): void {
    if (!this.editableApplicationRow) return;

    // Clear previous error
    if (this.editableApplicationRow.errors) {
      delete this.editableApplicationRow.errors['terminationDate'];
    }

    const inputValue = (event.targetElement as HTMLInputElement)?.value;

    // Check if the input is empty
    if (!inputValue || inputValue.trim() === '') {
      return; // Empty is valid (optional field)
    }

    // Try to parse manual input (dd-mm-yyyy or dd/mm/yyyy format)
    let parsedDate = null;
    if (!event.value && inputValue) {
      // Try parsing dd-mm-yyyy or dd/mm/yyyy format
      const dateFormats = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD-MMM-YYYY'];
      parsedDate = moment(inputValue, dateFormats, true);

      if (parsedDate.isValid()) {
        // Auto-convert to proper format and update the model
        this.editableApplicationRow.terminationDate = parsedDate;
        // Update the input display to dd-MON-YYYY format
        const formattedDate = parsedDate.format('DD-MMM-YYYY');
        (event.targetElement as HTMLInputElement).value = formattedDate;
      }
    }

    // Check if the date is invalid after parsing attempts
    if (!event.value && (!parsedDate || !parsedDate.isValid())) {
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      this.editableApplicationRow.errors['terminationDate'] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
      return;
    }

    const selectedDate = parsedDate && parsedDate.isValid() ? parsedDate : moment(event.value);
    const minTermDate = this.editableApplicationRow.effectiveDate
      ? moment(this.editableApplicationRow.effectiveDate)
      : this.minDate;

    // Check if termination date is before effective date or minimum date
    if (selectedDate.isBefore(minTermDate, 'day')) {
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      const minDateFormatted = minTermDate.format('DD-MMM-YYYY');
      this.editableApplicationRow.errors['terminationDate'] =
        this.editableApplicationRow.effectiveDate
          ? `Termination date cannot be before effective date (${minDateFormatted})`
          : `Date cannot be before ${minDateFormatted}`;
    }
  }

  /**
   * Handle blur event on effective date input for manual date entry
   */
  onEffectiveDateBlur(event: FocusEvent): void {
    if (!this.editableApplicationRow) return;

    const input = event.target as HTMLInputElement;
    const inputValue = input?.value?.trim();

    // Check for required field
    if (!inputValue || inputValue === '') {
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      this.editableApplicationRow.errors['effectiveDate'] = 'Effective date is required';
      return;
    }

    // Try to parse manual input (dd-mm-yyyy or dd/mm/yyyy format)
    const dateFormats = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD-MMM-YYYY'];
    const parsedDate = moment(inputValue, dateFormats, true);

    if (parsedDate.isValid()) {
      // Auto-convert to proper format and update the model
      this.editableApplicationRow.effectiveDate = parsedDate;
      // Update the input display to dd-MON-YYYY format
      const formattedDate = parsedDate.format('DD-MMM-YYYY');
      input.value = formattedDate;

      // Clear error if valid
      if (this.editableApplicationRow.errors) {
        delete this.editableApplicationRow.errors['effectiveDate'];
      }

      // FMB: Validate past dates for NEW/INSERT records AND when eff date is changed on existing records
      if ((this.isAddingNewCombination || this.effDateTouched) && parsedDate.isBefore(this.minDate, 'day')) {
        if (!this.editableApplicationRow.errors) {
          this.editableApplicationRow.errors = {};
        }
        this.editableApplicationRow.errors['effectiveDate'] = `Date cannot be before ${this.minDate.format('DD-MMM-YYYY')}`;
      }
    } else if (inputValue) {
      // Invalid format
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      this.editableApplicationRow.errors['effectiveDate'] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
    }
  }

  /**
   * Handle blur event on termination date input for manual date entry
   */
  onTerminationDateBlur(event: FocusEvent): void {
    if (!this.editableApplicationRow) return;

    const input = event.target as HTMLInputElement;
    const inputValue = input?.value?.trim();

    // Empty is valid (optional field)
    if (!inputValue || inputValue === '') {
      if (this.editableApplicationRow.errors) {
        delete this.editableApplicationRow.errors['terminationDate'];
      }
      return;
    }

    // Try to parse manual input (dd-mm-yyyy or dd/mm/yyyy format)
    const dateFormats = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD-MMM-YYYY'];
    const parsedDate = moment(inputValue, dateFormats, true);

    if (parsedDate.isValid()) {
      // Auto-convert to proper format and update the model
      this.editableApplicationRow.terminationDate = parsedDate;
      // Update the input display to dd-MON-YYYY format
      const formattedDate = parsedDate.format('DD-MMM-YYYY');
      input.value = formattedDate;

      // Clear error if valid
      if (this.editableApplicationRow.errors) {
        delete this.editableApplicationRow.errors['terminationDate'];
      }

      // Validate against effective date or minimum date
      const minTermDate = this.editableApplicationRow.effectiveDate
        ? moment(this.editableApplicationRow.effectiveDate)
        : this.minDate;

      if (parsedDate.isBefore(minTermDate, 'day')) {
        if (!this.editableApplicationRow.errors) {
          this.editableApplicationRow.errors = {};
        }
        const minDateFormatted = minTermDate.format('DD-MMM-YYYY');
        this.editableApplicationRow.errors['terminationDate'] =
          this.editableApplicationRow.effectiveDate
            ? `Termination date cannot be before effective date (${minDateFormatted})`
            : `Date cannot be before ${minDateFormatted}`;
      }
    } else if (inputValue) {
      // Invalid format
      if (!this.editableApplicationRow.errors) {
        this.editableApplicationRow.errors = {};
      }
      this.editableApplicationRow.errors['terminationDate'] = 'Invalid date format. Use DD-MM-YYYY or DD-MMM-YYYY';
    }
  }

  /**
   * Filter pool size input characters.
   * FMB: 4-char text field accepting blank, '>1', or numeric >= 1.
   * Only filters disallowed characters — validation is in validateAllFields.
   */
  onPoolSizeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.editableInstrumentRow) return;

    // Allow digits and '>' character (FMB accepts '>1' as special value)
    const filtered = input.value.replace(/[^\d>]/g, '').slice(0, 4);
    if (filtered !== input.value) {
      input.value = filtered;
    }

    this.editableInstrumentRow.poolSize = filtered || undefined;
  }

  isNewRow(): boolean {
    return this.editableInstrumentRow?.auditKey === 0 || false;
  }

  onDeleteEditingRow(): void {
    if (this.editingRowIndex === null || !this.isNewRow()) return;

    // Remove the new row from data arrays
    this.instrumentTestsData.splice(this.editingRowIndex, 1);
    this.applicationSchedulingTestsData.splice(this.editingRowIndex, 1);

    // Clear edit state (don't call onCancelEdit to avoid double-deletion)
    this.editingRowIndex = null;
    this.duplicateCombinationError = false;
    this.editableInstrumentRow = null;
    this.editableApplicationRow = null;
    this.originalInstrumentRow = null;
    this.originalApplicationRow = null;
    this.isAddingNewCombination = false;

    // Update selection
    if (this.instrumentTestsData.length > 0) {
      this.selectedInstrumentRowIndex = 0;
      this.selectedApplicationRowIndex = 0;
    } else {
      this.selectedInstrumentRowIndex = null;
      this.selectedApplicationRowIndex = null;
    }
  }

  /* ================================ SAVE ================================ */

  /**
   * Check if there are any validation errors
   */
  hasValidationErrors(): boolean {
    if (this.editableApplicationRow?.errors && Object.keys(this.editableApplicationRow.errors).length > 0) {
      return true;
    }
    if (this.editableInstrumentRow?.errors && Object.keys(this.editableInstrumentRow.errors).length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Run all field validations and populate errors on editable rows.
   * Called on every field change for live feedback and before save.
   */
  validateAllFields(): void {
    // --- Instrument row validations ---
    if (this.editableInstrumentRow) {
      // Clear pair and pool size errors for re-evaluation; preserve other errors
      const preserved: Record<string, string> = {};
      if (this.editableInstrumentRow.errors) {
        for (const key of Object.keys(this.editableInstrumentRow.errors)) {
          if (key === 'poolSize') continue;
          if (['test1','result1','test2','result2','test3','result3','test4','result4','test5','result5'].includes(key)) continue;
          preserved[key] = this.editableInstrumentRow.errors[key];
        }
      }
      this.editableInstrumentRow.errors = { ...preserved };

      const instRow = this.editableInstrumentRow;
      const instPairs = [
        { test: instRow.test1, result: instRow.result1, testField: 'test1', resField: 'result1' },
        { test: instRow.test2, result: instRow.result2, testField: 'test2', resField: 'result2' },
        { test: instRow.test3, result: instRow.result3, testField: 'test3', resField: 'result3' },
        { test: instRow.test4, result: instRow.result4, testField: 'test4', resField: 'result4' },
        { test: instRow.test5, result: instRow.result5, testField: 'test5', resField: 'result5' },
      ];

      // Test 1 and Result 1 are required (Oracle Forms: TEST_ID_1 null check mandatory)
      if (!instRow.test1) {
        instRow.errors!['test1'] = 'Test 1 is required';
      }
      if (!instRow.result1) {
        instRow.errors!['result1'] = 'Result 1 is required';
      }

      // Cross-field validation for optional pairs (test2-5)
      for (const pair of instPairs.slice(1)) {
        if (pair.result && !pair.test) {
          instRow.errors![pair.resField] = 'Result entered without test ID';
        } else if (pair.test && !pair.result) {
          instRow.errors![pair.resField] = 'Test ID entered without result';
        }
      }

      // Pool size validation (FMB: blank OK, '>1' OK, numeric >= 1 OK)
      const ps = instRow.poolSize;
      if (ps !== undefined && ps !== null && ps !== '') {
        if (ps !== '>1') {
          const numStr = String(ps);
          if (!/^\d+$/.test(numStr)) {
            instRow.errors!['poolSize'] = 'Invalid number format';
          } else if (parseInt(numStr, 10) < 1) {
            instRow.errors!['poolSize'] = 'Pool size must be at least 1';
          }
        }
      }
    }

    // --- Application row validations ---
    if (this.editableApplicationRow) {
      // Preserve date errors set by date change/blur handlers, clear pair errors
      const preserved: Record<string, string> = {};
      if (this.editableApplicationRow.errors) {
        if (this.editableApplicationRow.errors['effectiveDate']) {
          preserved['effectiveDate'] = this.editableApplicationRow.errors['effectiveDate'];
        }
        if (this.editableApplicationRow.errors['terminationDate']) {
          preserved['terminationDate'] = this.editableApplicationRow.errors['terminationDate'];
        }
      }
      this.editableApplicationRow.errors = { ...preserved };

      const appRow = this.editableApplicationRow;
      const appPairs = [
        { test: appRow.test1, result: appRow.result1, resField: 'result1' },
        { test: appRow.test2, result: appRow.result2, resField: 'result2' },
        { test: appRow.test3, result: appRow.result3, resField: 'result3' },
        { test: appRow.defTest4, result: appRow.result4, resField: 'result4' },
        { test: appRow.defTest5, result: appRow.result5, resField: 'result5' },
        { test: appRow.defTest6, result: appRow.result6, resField: 'result6' },
      ];

      for (const pair of appPairs) {
        if (pair.result && !pair.test) {
          appRow.errors![pair.resField] = 'Result entered without test ID';
        }
      }

      // Effective date is always required
      if (!appRow.effectiveDate) {
        appRow.errors!['effectiveDate'] = 'Effective date is required';
      }
    }
  }

  onSave(): void {
    if (!this.editableInstrumentRow || !this.editableApplicationRow) {
      return;
    }

    // Run full validation
    this.validateAllFields();

    if (this.hasValidationErrors()) {
      this.snackbarService.showError('Please fix all validation errors before saving');
      return;
    }

    this.isLoading = true;

    const instrumentTestDto: InstrumentTestUpsertDto = {
      Test1: this.editableInstrumentRow.test1 || undefined,
      Result1: this.editableInstrumentRow.result1 || undefined,
      Test2: this.editableInstrumentRow.test2 || undefined,
      Result2: this.editableInstrumentRow.result2 || undefined,
      Test3: this.editableInstrumentRow.test3 || undefined,
      Result3: this.editableInstrumentRow.result3 || undefined,
      Test4: this.editableInstrumentRow.test4 || undefined,
      Result4: this.editableInstrumentRow.result4 || undefined,
      Test5: this.editableInstrumentRow.test5 || undefined,
      Result5: this.editableInstrumentRow.result5 || undefined,
      PoolSize: this.editableInstrumentRow.poolSize
    };

    const applicationTestDto: ApplicationSchedulingTestUpsertDto = {
      Test1: this.editableApplicationRow.test1 || undefined,
      Result1: this.editableApplicationRow.result1 || undefined,
      Test2: this.editableApplicationRow.test2 || undefined,
      Result2: this.editableApplicationRow.result2 || undefined,
      Test3: this.editableApplicationRow.test3 || undefined,
      Result3: this.editableApplicationRow.result3 || undefined,
      DefTest4: this.editableApplicationRow.defTest4 || undefined,
      Result4: this.editableApplicationRow.result4 || undefined,
      DefTest5: this.editableApplicationRow.defTest5 || undefined,
      Result5: this.editableApplicationRow.result5 || undefined,
      DefTest6: this.editableApplicationRow.defTest6 || undefined,
      Result6: this.editableApplicationRow.result6 || undefined,
      EffectiveDate: this.editableApplicationRow.effectiveDate
        ? this.formatDateForApi(this.editableApplicationRow.effectiveDate)
        : undefined,
      TerminationDate: this.editableApplicationRow.terminationDate
        ? this.formatDateForApi(this.editableApplicationRow.terminationDate)
        : undefined
    };

    // Oracle Forms Pattern: Backend /save endpoint auto-detects INSERT vs UPDATE
    // Pass original effective date so API can find the existing row when eff date changes
    const dto: TestByMachineIdBulkUpsertDto = {
      InstrumentId: this.instrumentIdControl.value!,
      TestId: this.testIdControl.value!,
      InstrumentTests: [instrumentTestDto],
      ApplicationSchedulingTests: [applicationTestDto]
    };

    const originalEffDate = !this.isAddingNewCombination && this.originalApplicationRow
      ? this.originalApplicationRow.effectiveDate
      : null;

    this.service.saveBulkTestData(dto, originalEffDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          const message = response.message || 'Test data saved successfully';
          this.snackbarService.showSuccess(message);

          // Clear edit state
          this.editingRowIndex = null;
          this.duplicateCombinationError = false;
          this.editableInstrumentRow = null;
          this.editableApplicationRow = null;
          this.originalInstrumentRow = null;
          this.originalApplicationRow = null;
          this.isAddingNewCombination = false;
          this.effDateTouched = false;

          // Reload data
          this.onRetrieve();
        },
       
      });
  }


  /* ================================ ROW SELECTION ================================ */

  onInstrumentRowClick(index: number): void {
    if (!this.isEditMode) {
      // Toggle selection if clicking the same row, otherwise select the new row
      if (this.selectedInstrumentRowIndex === index) {
        this.selectedInstrumentRowIndex = null;
        this.selectedApplicationRowIndex = null;
      } else {
        this.selectedInstrumentRowIndex = index;
        // Synchronize with Application Scheduling Tests table
        this.selectedApplicationRowIndex = index;
      }
    }
  }

  onApplicationRowClick(index: number): void {
    if (!this.isEditMode) {
      // Toggle selection if clicking the same row, otherwise select the new row
      if (this.selectedApplicationRowIndex === index) {
        this.selectedApplicationRowIndex = null;
        this.selectedInstrumentRowIndex = null;
      } else {
        this.selectedApplicationRowIndex = index;
        // Synchronize with Instrument Tests table
        this.selectedInstrumentRowIndex = index;
      }
    }
  }

  /* ================================ UTILITIES ================================ */

  private formatDateForApi(date: any): string {
    const m = moment.isMoment(date) ? date : moment(date);
    // Create a UTC date using the local date's year, month, and day to prevent timezone shift
    return moment.utc([m.year(), m.month(), m.date()]).toISOString();
  }

  formatDate(date: Moment | Date | string | null | undefined): string {
    if (!date) return '-';

    if (moment.isMoment(date)) {
      return formatTableDate(date.toISOString());
    }

    const dateStr = date instanceof Date ? date.toISOString() : String(date);
    return formatTableDate(dateStr);
  }
}
