import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  TemplateRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import {
  DateAdapter,
  ErrorStateMatcher,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from '@core/utils/date-adapter.util';

import moment from 'moment';

import { SampleType, TestIdOption, TestLinkageRow } from './sample-test-linkage.model';
import { SampleTestLinkageService } from './sample-test-linkage.service';

let _nextId = 100;

/** Fallback control returned when a row's form hasn't been built yet — same instance always */
const _DUMMY_CONTROL = new FormControl({ value: null, disabled: false });

@Component({
  selector: 'app-sample-test-linkage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './sample-test-linkage.html',
  styleUrl: './sample-test-linkage.scss',
})
export class SampleTestLinkageComponent implements OnInit, OnDestroy {
  @ViewChild('testIdCellTpl', { static: true }) testIdCellTpl!: TemplateRef<unknown>;
  @ViewChild('effDateCellTpl', { static: true }) effDateCellTpl!: TemplateRef<unknown>;
  @ViewChild('termDateCellTpl', { static: true }) termDateCellTpl!: TemplateRef<unknown>;
  @ViewChild('actionsCellTpl', { static: true }) actionsCellTpl!: TemplateRef<unknown>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly stlService = inject(SampleTestLinkageService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  /** Highlights the chapter's current date in the calendar panel */
  readonly chapterDateClass = (date: moment.Moment): string => {
    const chapterDateStr = this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD');
    return moment(date).format('YYYY-MM-DD') === chapterDateStr ? 'stl-chapter-today' : '';
  };

  // ── View mode ──────────────────────────────────────────────────
  isLanding = true;

  // ── Page header — dynamically resolved from menu API ──
  readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      title: data?.title || '',
      subtitle: data?.subtitle || '',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Sample Test Linkage', link: null },
      ],
    };
  });

  // ── Table config ───────────────────────────────────────────────
  tableConfig!: DataTableConfig<TestLinkageRow>;

  // ── Valid test options (dropdown + search) ────────────────────
  validTests: TestIdOption[] = [];
  filteredValidTests: TestIdOption[] = [];
  readonly testIdSearchCtrl = new FormControl('');

  // ── Landing page state ─────────────────────────────────────────
  allSampleTypes: SampleType[] = [];
  landingSelection: SampleType | null = null;
  isLoadingTypes = false;

  // ── Details page (left panel) ──────────────────────────────────
  filteredSampleTypes: SampleType[] = [];
  searchText = '';
  selectedSampleType: SampleType | null = null;

  // ── Date picker minimum date (today, chapter-aware) ──────────
  minDate = DateFieldValidationUtility.getMinDate();

  // ── Details page (right panel) ────────────────────────────────
  rows: TestLinkageRow[] = [];
  originalRows: TestLinkageRow[] = [];
  isDirty = false;
  isSaving = false;
  isLoadingRows = false;

  // ── Per-row reactive form state ───────────────────────────────
  /** Each row has its own FormGroup with effectiveDate + terminationDate controls */
  private readonly rowForms = new Map<string, FormGroup>();
  /** Tracks which date field was last interacted with per row (for cross-field error display) */
  private readonly lastChangedField = new Map<string, 'effective' | 'termination' | null>();
  /** Cached error strings — updated via statusChanges to avoid ExpressionChangedAfterChecked */
  private readonly effDateErrors = new Map<string, string>();
  private readonly termDateErrors = new Map<string, string>();
  /** Cached ErrorStateMatcher instances keyed by rowId */
  private readonly effDateMatchers = new Map<string, ErrorStateMatcher>();
  private readonly termDateMatchers = new Map<string, ErrorStateMatcher>();

  // ── Public accessors for template (stable — read from cached Maps) ────

  getEffDateControl(rowId: string): FormControl {
    return (this.rowForms.get(rowId)?.get('effectiveDate') as FormControl) ?? _DUMMY_CONTROL;
  }

  getTermDateControl(rowId: string): FormControl {
    return (this.rowForms.get(rowId)?.get('terminationDate') as FormControl) ?? _DUMMY_CONTROL;
  }

  getEffDateMatcher(rowId: string): ErrorStateMatcher {
    return this.effDateMatchers.get(rowId) ?? { isErrorState: () => false };
  }

  getTermDateMatcher(rowId: string): ErrorStateMatcher {
    return this.termDateMatchers.get(rowId) ?? { isErrorState: () => false };
  }

  /** Returns cached error — stable during a single change-detection pass */
  getEffDateError(rowId: string): string {
    return this.effDateErrors.get(rowId) ?? '';
  }

  /** Returns cached error — stable during a single change-detection pass */
  getTermDateError(rowId: string): string {
    return this.termDateErrors.get(rowId) ?? '';
  }

  /** Updates the cached error strings for a row by reading current form state */
  private updateRowErrors(rowId: string): void {
    const form = this.rowForms.get(rowId);
    if (!form) return;
    const lastChanged = this.lastChangedField.get(rowId);

    this.effDateErrors.set(
      rowId,
      DateFieldValidationUtility.getStartDateCrossFieldError(
        form.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        lastChanged === 'effective' ? form.errors : null
      )
    );
    this.termDateErrors.set(
      rowId,
      DateFieldValidationUtility.getEndDateCrossFieldError(
        form.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        lastChanged === 'termination' ? form.errors : null
      )
    );
  }

  onEffDateInput(event: Event, rowId: string): void {
    const form = this.rowForms.get(rowId);
    if (!form) return;
    this.lastChangedField.set(rowId, 'effective');
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      form.get('effectiveDate')
    );
    // setErrors is synchronous; statusChanges won't fire, so update cache manually
    this.updateRowErrors(rowId);
  }

  onTermDateInput(event: Event, rowId: string): void {
    const form = this.rowForms.get(rowId);
    if (!form) return;
    this.lastChangedField.set(rowId, 'termination');
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      form.get('terminationDate'),
      false
    );
    this.updateRowErrors(rowId);
  }

  get canSave(): boolean {
    if (this.isSaving || !this.isDirty) return false;
    return this.rows.every(r => {
      if (!r.testId) return false;
      const form = this.rowForms.get(r._rowId);
      return form ? form.valid : false;
    });
  }

  ngOnInit(): void {
    this.initTableConfig();
    this.initTestIdSearch();
    this.loadValidTests();
    this.loadSampleTypes();
    this.subscribeToChapterChanges();
  }

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'testId',
          header: 'Test ID',
          headerClass: 'stl-required-header',
          minWidth: '200px',
          cellTemplate: this.testIdCellTpl,
        },
        {
          key: 'effectiveDate',
          header: 'Effective Date',
          headerClass: 'stl-required-header',
          minWidth: '200px',
          cellTemplate: this.effDateCellTpl,
        },
        {
          key: 'terminationDate',
          header: 'Termination Date',
          minWidth: '200px',
          cellTemplate: this.termDateCellTpl,
        },
        {
          key: 'actions',
          header: '',
          width: '56px',
          cellTemplate: this.actionsCellTpl,
        },
      ],
      stickyHeader: true,
      showPagination: false,
      showTableOnEmpty: true,
      enableRowHighlight: false,
      emptyMessage: 'No results added. Click "+ ADD NEW RESULT" to begin.',
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToLanding();
        this.loadSampleTypes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Per-row form management ────────────────────────────────────

  private buildRowForm(row: TestLinkageRow, isNew = false): void {
    // New rows (added via "+ ADD NEW RESULT") enforce no-past-date rule.
    // Existing rows loaded from the API may already have past dates — only format/validity is checked.
    const effValidators = isNew
      ? [
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.effectiveDateNotPastValidator(),
        ]
      : [
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
        ];

    const termValidators = isNew
      ? [
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator(),
        ]
      : [
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
        ];

    const form = this.fb.group(
      {
        effectiveDate: [row.effectiveDate, effValidators],
        terminationDate: [row.terminationDate, termValidators],
      },
      {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        ],
      }
    );

    // Track which date was last changed (for cross-field error routing)
    form.get('effectiveDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedField.set(row._rowId, 'effective');
      this.isDirty = true;
    });
    form.get('terminationDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedField.set(row._rowId, 'termination');
      this.isDirty = true;
    });

    // Update cached error strings AFTER validators have run (statusChanges fires post-validation)
    // This prevents ExpressionChangedAfterItHasBeenCheckedError — template reads stable cached values
    form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateRowErrors(row._rowId);
      this.cdr.markForCheck();
    });

    this.rowForms.set(row._rowId, form);
    this.lastChangedField.set(row._rowId, null);

    // Initialise caches to empty (no errors shown until user interacts)
    this.effDateErrors.set(row._rowId, '');
    this.termDateErrors.set(row._rowId, '');

    // Create stable matcher instances (one per row, cached)
    this.effDateMatchers.set(
      row._rowId,
      DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError(row._rowId))
    );
    this.termDateMatchers.set(
      row._rowId,
      DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError(row._rowId))
    );
  }

  private removeRowForm(rowId: string): void {
    this.rowForms.delete(rowId);
    this.lastChangedField.delete(rowId);
    this.effDateErrors.delete(rowId);
    this.termDateErrors.delete(rowId);
    this.effDateMatchers.delete(rowId);
    this.termDateMatchers.delete(rowId);
  }

  private clearAllRowForms(): void {
    this.rowForms.clear();
    this.lastChangedField.clear();
    this.effDateErrors.clear();
    this.termDateErrors.clear();
    this.effDateMatchers.clear();
    this.termDateMatchers.clear();
  }

  // ── Landing page actions ───────────────────────────────────────

  private initTestIdSearch(): void {
    this.testIdSearchCtrl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(search => this.applyTestIdFilter(search ?? ''));
  }

  private applyTestIdFilter(search: string): void {
    const q = search.toLowerCase().trim();
    this.filteredValidTests = q
      ? this.validTests.filter(
          t => t.value.toLowerCase().includes(q) || t.label.toLowerCase().includes(q)
        )
      : [...this.validTests];
  }

  resetTestIdSearch(): void {
    this.testIdSearchCtrl.setValue('');
  }

  private loadValidTests(): void {
    this.stlService
      .getValidTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tests => {
          this.validTests = tests;
          this.applyTestIdFilter(this.testIdSearchCtrl.value ?? '');
        },
        error: () => this.snackbarService.showError('Failed to load valid tests.'),
      });
  }

  private loadSampleTypes(): void {
    this.isLoadingTypes = true;
    this.stlService
      .getSampleTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: types => {
          this.allSampleTypes = types;
          this.filteredSampleTypes = [...types];
          this.isLoadingTypes = false;
        },
        error: () => {
          this.snackbarService.showError('Failed to load sample types.');
          this.isLoadingTypes = false;
        },
      });
  }

  onLandingSelect(type: SampleType): void {
    if (!type) return;
    this.selectedSampleType = type;
    this.searchText = '';
    this.filteredSampleTypes = [...this.allSampleTypes];
    this.isDirty = false;
    this.loadRows(type.code);
    this.isLanding = false;
  }

  clearLandingFilter(): void {
    this.landingSelection = null;
  }

  // ── Details page actions ───────────────────────────────────────

  onSearch(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredSampleTypes = q
      ? this.allSampleTypes.filter(
          t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
        )
      : [...this.allSampleTypes];
  }

  selectSampleType(type: SampleType): void {
    if (this.selectedSampleType?.code === type.code) return;
    this.selectedSampleType = type;
    this.isDirty = false;
    this.loadRows(type.code);
  }

  handleListKeydown(event: KeyboardEvent, type: SampleType): void {
    const currentIndex = this.filteredSampleTypes.findIndex(t => t.code === type.code);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectSampleType(type);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, this.filteredSampleTypes.length - 1);
        if (newIndex !== currentIndex) {
          this.selectSampleType(this.filteredSampleTypes[newIndex]);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        if (newIndex !== currentIndex) {
          this.selectSampleType(this.filteredSampleTypes[newIndex]);
        }
        break;
      case 'Home':
        event.preventDefault();
        if (this.filteredSampleTypes.length > 0) {
          this.selectSampleType(this.filteredSampleTypes[0]);
        }
        break;
      case 'End':
        event.preventDefault();
        if (this.filteredSampleTypes.length > 0) {
          this.selectSampleType(this.filteredSampleTypes[this.filteredSampleTypes.length - 1]);
        }
        break;
    }
  }

  private loadRows(code: string): void {
    this.isLoadingRows = true;
    this.clearAllRowForms();
    this.rows = [];
    this.stlService
      .getTestLinkages(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          const copied = rows.map(r => ({ ...r }));
          this.originalRows = copied.map(r => ({ ...r }));
          // Build forms BEFORE assigning to rows so template never sees a row without a form
          copied.forEach(r => this.buildRowForm(r));
          this.rows = copied;
          this.isLoadingRows = false;
        },
        error: () => {
          this.snackbarService.showError('Failed to load test linkages.');
          this.isLoadingRows = false;
        },
      });
  }

  addNewResult(): void {
    const newRow: TestLinkageRow = {
      _rowId: String(++_nextId),
      testId: '',
      effectiveDate: null,
      terminationDate: null,
    };
    // Build form BEFORE pushing to rows array (isNew=true → enforce no-past-date validators)
    this.buildRowForm(newRow, true);
    this.rows = [...this.rows, newRow];
    this.isDirty = true;
  }

  onTestIdChange(row: TestLinkageRow): void {
    const form = this.rowForms.get(row._rowId);
    if (form && !form.get('effectiveDate')?.value && row.testId) {
      // Auto-set effective date to chapter local date when user selects a test ID
      // (matches Oracle Forms KEY-NEXT-ITEM trigger behavior on TEST_ID field)
      form.get('effectiveDate')?.setValue(this.chapterTimezoneService.getChapterLocalDate());
    }
    this.isDirty = true;
  }

  deleteRow(row: TestLinkageRow): void {
    this.removeRowForm(row._rowId);
    this.rows = this.rows.filter(r => r._rowId !== row._rowId);
    this.isDirty = true;
  }

  onRowChange(): void {
    this.isDirty = true;
  }

  clearAll(): void {
    this.clearAllRowForms();
    this.rows = [];
    this.isDirty = true;
  }

  cancel(): void {
    this.resetToLanding();
  }

  save(): void {
    if (!this.canSave) return;

    // Clear false-positive errors on empty optional termination date fields before saving
    this.rows.forEach(r => {
      const form = this.rowForms.get(r._rowId);
      if (form) {
        DateFieldValidationUtility.clearOptionalDateErrors(form, 'terminationDate');
      }
    });

    // Collect current values from forms (source of truth for dates)
    const rowsToSave: TestLinkageRow[] = this.rows.map(r => {
      const form = this.rowForms.get(r._rowId);
      return {
        ...r,
        effectiveDate: form?.get('effectiveDate')?.value ?? null,
        terminationDate: form?.get('terminationDate')?.value ?? null,
      };
    });

    this.isSaving = true;
    this.stlService
      .saveTestLinkages(this.selectedSampleType!.code, rowsToSave)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.originalRows = rowsToSave.map(r => ({ ...r }));
          this.isDirty = false;
          this.isSaving = false;
          this.snackbarService.showSuccess(
            `Sample test linkage saved successfully for ${this.selectedSampleType!.name}.`
          );
        },
        error: () => {
          this.snackbarService.showError('Failed to save test linkages. Please try again.');
          this.isSaving = false;
        },
      });
  }

  private resetToLanding(): void {
    this.isLanding = true;
    this.landingSelection = null;
    this.searchText = '';
    this.selectedSampleType = null;
    this.clearAllRowForms();
    this.rows = [];
    this.originalRows = [];
    this.isDirty = false;
  }
}
