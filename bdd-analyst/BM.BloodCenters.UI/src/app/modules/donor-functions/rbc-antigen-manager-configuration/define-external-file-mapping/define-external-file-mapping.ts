import {
  Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { ExtAntApprovalService } from './services/ext-ant-approval.service';
import {
  ExtAntApprovalRecord,
  ExtAntApprovalLookup,
  ExtAntApprovalCreateDto,
  ExtAntApprovalUpdateDto,
  APPROVED_FLAG_LABELS,
} from './models/ext-ant-approval.model';

interface EditableRow extends ExtAntApprovalRecord {
  isNew: boolean;
}

@Component({
  selector: 'app-define-external-file-mapping',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSortModule,
    NgxMatSelectSearchModule,
    OverlayModule,
    MatDialogModule,
    SearchBar,
    FilterChips,
  ],
  templateUrl: './define-external-file-mapping.html',
  styleUrls: ['./define-external-file-mapping.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class DefineExternalFileMappingComponent implements OnInit, OnDestroy {
  private readonly service = inject(ExtAntApprovalService);
  private readonly snackbar = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('effFilterNativeInput') effFilterNativeInput?: ElementRef;
  @ViewChild('termFilterNativeInput') termFilterNativeInput?: ElementRef;
  @ViewChild('viewSort') set viewSortSetter(sort: MatSort) { if (sort) this.viewDataSource.sort = sort; }

  viewDataSource = new MatTableDataSource<ExtAntApprovalRecord>([]);

  // Filter
  prefixOptions = signal<ExtAntApprovalLookup[]>([]);
  prefixControl = new FormControl<string | null>(null);
  prefixSearchControl = new FormControl('');
  filteredPrefixes = computed(() => {
    const search = this.prefixSearchControl.value?.toLowerCase() || '';
    return search
      ? this.prefixOptions().filter(p => p.value.toLowerCase().includes(search))
      : this.prefixOptions();
  });

  // Lookup data
  antigenTestOptions = signal<ExtAntApprovalLookup[]>([]);
  antigenSearchControl = new FormControl('');
  filteredAntigens = computed(() => {
    const search = this.antigenSearchControl.value?.toLowerCase() || '';
    return search
      ? this.antigenTestOptions().filter(a =>
          a.value.toLowerCase().includes(search) || (a.label || '').toLowerCase().includes(search))
      : this.antigenTestOptions();
  });

  // State
  allData = signal<ExtAntApprovalRecord[]>([]);
  loading = signal(false);
  hasSearched = signal(false);
  isEditMode = signal(false);
  searchText = signal('');

  // Filter panel
  isFilterOpen = signal(false);
  filterForm!: FormGroup;
  appliedFilters = signal<Record<string, any> | null>(null);
  filterChips = signal<FilterChip[]>([]);

  filterAntigenOptions = computed(() => {
    const unique = new Set(this.allData().map(r => r.testAntigen));
    return [...unique].sort();
  });

  hasActiveFilters = computed(() => this.filterChips().length > 0);

  filterOverlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  ];

  // Client-side filtered + sorted view
  displayedData = computed(() => {
    let records = this.allData();

    // Apply text search
    const search = this.searchText().toLowerCase();
    if (search) {
      records = records.filter(r =>
        r.testBatchPrefix.toLowerCase().includes(search) ||
        r.testAntigen.toLowerCase().includes(search),
      );
    }

    // Apply filter panel
    const filters = this.appliedFilters();
    if (filters) {
      if (filters['testAntigen']) {
        records = records.filter(r => r.testAntigen === filters['testAntigen']);
      }
      if (filters['approvedFlag']) {
        records = records.filter(r => r.approvedFlag === filters['approvedFlag']);
      }
      if (filters['effectiveDatePeriod'] && filters['effectiveDate']) {
        const filterMoment = moment(filters['effectiveDate']).startOf('day');
        records = records.filter(r => {
          if (!r.effDate) return false;
          const rowDate = moment(r.effDate).startOf('day');
          return filters['effectiveDatePeriod'] === 'BEFORE' ? rowDate.isBefore(filterMoment) : rowDate.isAfter(filterMoment);
        });
      }
      if (filters['terminationDatePeriod'] && filters['terminationDate']) {
        const filterMoment = moment(filters['terminationDate']).startOf('day');
        records = records.filter(r => {
          if (!r.termDate) return false;
          const rowDate = moment(r.termDate).startOf('day');
          return filters['terminationDatePeriod'] === 'BEFORE' ? rowDate.isBefore(filterMoment) : rowDate.isAfter(filterMoment);
        });
      }
    }

    return records;
  });

  // View mode columns
  viewColumns = ['testBatchPrefix', 'testAntigen', 'approvedFlag', 'effDate', 'termDate', 'modifiedDate'];

  // Edit mode
  editableData = signal<EditableRow[]>([]);
  rowForms = new Map<number, FormGroup>();
  editColumns = ['testBatchPrefix', 'testAntigen', 'approvedFlag', 'effDate', 'termDate', 'modifiedDate', 'actions'];

  // Per-row date validation state
  termDateFilters: ((date: moment.Moment | null) => boolean)[] = [];
  effDateErrorMatchers: ErrorStateMatcher[] = [];
  termDateErrorMatchers: ErrorStateMatcher[] = [];
  lastChangedDateField: ('effective' | 'termination' | null)[] = [];

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Batch Prefix or Test Antigen',
    minLength: 1,
    ariaLabel: 'Search antigen tests',
    searchOnEnterOnly: true,
  };

  today = new Date();
  readonly flagLabels = APPROVED_FLAG_LABELS;
  private cachedMinDate: moment.Moment | null = null;

  constructor() {
    effect(() => {
      this.viewDataSource.data = this.displayedData();
    });
  }

  ngOnInit(): void {
    this.initFilterForm();
    this.loadPrefixes();
    this.loadAntigenTests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filter Actions ──

  onRetrieve(): void {
    this.searchText.set('');
    this.loadData();
  }

  onClearAll(): void {
    this.prefixControl.reset();
    this.allData.set([]);
    this.hasSearched.set(false);
    this.isEditMode.set(false);
    this.searchText.set('');
  }

  onSearch(text: string): void {
    this.searchText.set(text);
  }


  isRetrieveDisabled(): boolean {
    return !this.prefixControl.value;
  }

  // ── Filter Panel ──

  private initFilterForm(): void {
    this.filterForm = new FormGroup({
      testAntigen: new FormControl(null),
      approvedFlag: new FormControl(null),
      effectiveDatePeriod: new FormControl(null),
      effectiveDate: new FormControl(null),
      terminationDatePeriod: new FormControl(null),
      terminationDate: new FormControl(null),
    });

    this.filterForm.get('effectiveDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validatePeriodRequired('effectiveDate', 'effectiveDatePeriod'));

    this.filterForm.get('effectiveDatePeriod')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validatePeriodRequired('effectiveDate', 'effectiveDatePeriod'));

    this.filterForm.get('terminationDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validatePeriodRequired('terminationDate', 'terminationDatePeriod'));

    this.filterForm.get('terminationDatePeriod')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validatePeriodRequired('terminationDate', 'terminationDatePeriod'));
  }

  private validatePeriodRequired(dateKey: string, periodKey: string): void {
    const dateCtrl = this.filterForm.get(dateKey);
    const periodCtrl = this.filterForm.get(periodKey);
    const hasValidDate = dateCtrl?.value && !dateCtrl?.hasError('matDatepickerParse');
    if (hasValidDate && !periodCtrl?.value) {
      periodCtrl?.setErrors({ required: true });
      periodCtrl?.markAsTouched();
    } else {
      periodCtrl?.setErrors(null);
    }
  }

  get isApplyDisabled(): boolean {
    const fv = this.filterForm?.value;
    if (!fv) return true;

    const effPeriodCtrl = this.filterForm.get('effectiveDatePeriod');
    const termPeriodCtrl = this.filterForm.get('terminationDatePeriod');
    if (effPeriodCtrl?.invalid || termPeriodCtrl?.invalid) return true;

    const effDateCtrl = this.filterForm.get('effectiveDate');
    const termDateCtrl = this.filterForm.get('terminationDate');
    if (effDateCtrl?.hasError('matDatepickerParse') || effDateCtrl?.hasError('invalidDate')) return true;
    if (termDateCtrl?.hasError('matDatepickerParse') || termDateCtrl?.hasError('invalidDate')) return true;

    if (!effDateCtrl?.value && this.getNativeInputText(this.effFilterNativeInput)) return true;
    if (!termDateCtrl?.value && this.getNativeInputText(this.termFilterNativeInput)) return true;

    if (fv.effectiveDatePeriod && !fv.effectiveDate) return true;
    if (fv.terminationDatePeriod && !fv.terminationDate) return true;

    const hasAny = fv.testAntigen ||
      fv.approvedFlag ||
      (fv.effectiveDate && fv.effectiveDatePeriod) ||
      (fv.terminationDate && fv.terminationDatePeriod);
    return !hasAny;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getFilterEffDateError(): string {
    const ctrl = this.filterForm?.get('effectiveDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (ctrl.hasError('invalidDate')) return 'Effective Date is invalid';
    if (!ctrl.value && this.getNativeInputText(this.effFilterNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getFilterTermDateError(): string {
    const ctrl = this.filterForm?.get('terminationDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (ctrl.hasError('invalidDate')) return 'Termination Date is invalid';
    if (!ctrl.value && this.getNativeInputText(this.termFilterNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  onFilterEffDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.filterForm.get('effectiveDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    if (inputValue?.trim() && !ctrl.value) {
      ctrl.setErrors({ invalidDate: true });
    }
  }

  onFilterTermDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.filterForm.get('terminationDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    if (inputValue?.trim() && !ctrl.value) {
      ctrl.setErrors({ invalidDate: true });
    }
  }

  toggleFilterPanel(): void {
    this.isFilterOpen.set(!this.isFilterOpen());
  }

  closeFilterPanel(): void {
    this.isFilterOpen.set(false);
  }

  onApplyFilters(): void {
    this.validatePeriodRequired('effectiveDate', 'effectiveDatePeriod');
    this.validatePeriodRequired('terminationDate', 'terminationDatePeriod');
    if (this.isApplyDisabled) return;

    const fv = this.filterForm.value;
    const filters: Record<string, any> = {};
    if (fv.testAntigen) filters['testAntigen'] = fv.testAntigen;
    if (fv.approvedFlag) filters['approvedFlag'] = fv.approvedFlag;
    if (fv.effectiveDate && fv.effectiveDatePeriod) {
      filters['effectiveDate'] = fv.effectiveDate;
      filters['effectiveDatePeriod'] = fv.effectiveDatePeriod;
    }
    if (fv.terminationDate && fv.terminationDatePeriod) {
      filters['terminationDate'] = fv.terminationDate;
      filters['terminationDatePeriod'] = fv.terminationDatePeriod;
    }

    this.appliedFilters.set(Object.keys(filters).length ? filters : null);
    this.filterChips.set(this.buildFilterChips(filters));
    this.closeFilterPanel();
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);
    this.appliedFilters.set(null);
    this.filterChips.set([]);
  }

  onRemoveFilterChip(key: string): void {
    const current = { ...this.appliedFilters() };
    if (key === 'testAntigen') delete current['testAntigen'];
    if (key === 'approvedFlag') delete current['approvedFlag'];
    if (key === 'effectiveDate') { delete current['effectiveDate']; delete current['effectiveDatePeriod']; }
    if (key === 'terminationDate') { delete current['terminationDate']; delete current['terminationDatePeriod']; }

    const hasAny = Object.keys(current).length > 0;
    this.appliedFilters.set(hasAny ? current : null);
    this.filterChips.set(this.buildFilterChips(hasAny ? current : {}));

    // Sync form
    if (key === 'testAntigen') this.filterForm.get('testAntigen')?.reset();
    if (key === 'approvedFlag') this.filterForm.get('approvedFlag')?.reset();
    if (key === 'effectiveDate') { this.filterForm.get('effectiveDate')?.reset(); this.filterForm.get('effectiveDatePeriod')?.reset(); }
    if (key === 'terminationDate') { this.filterForm.get('terminationDate')?.reset(); this.filterForm.get('terminationDatePeriod')?.reset(); }
  }

  onClearAllChips(): void {
    this.onClearFilters();
  }

  private buildFilterChips(filters: Record<string, any>): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters['testAntigen']) {
      chips.push({ key: 'testAntigen', label: `Test Antigen: ${filters['testAntigen']}`, value: filters['testAntigen'] });
    }
    if (filters['approvedFlag']) {
      chips.push({ key: 'approvedFlag', label: `Approval Flag: ${this.flagLabels[filters['approvedFlag']] || filters['approvedFlag']}`, value: filters['approvedFlag'] });
    }
    if (filters['effectiveDate'] && filters['effectiveDatePeriod']) {
      const period = filters['effectiveDatePeriod'] === 'BEFORE' ? '≤' : '≥';
      chips.push({ key: 'effectiveDate', label: `Effective Date ${period} ${this.formatDate(filters['effectiveDate'])}`, value: filters['effectiveDate'] });
    }
    if (filters['terminationDate'] && filters['terminationDatePeriod']) {
      const period = filters['terminationDatePeriod'] === 'BEFORE' ? '≤' : '≥';
      chips.push({ key: 'terminationDate', label: `Termination Date ${period} ${this.formatDate(filters['terminationDate'])}`, value: filters['terminationDate'] });
    }
    return chips;
  }

  // ── Edit Mode Toggle ──

  onToggleEditMode(): void {
    if (this.isEditMode()) {
      this.onCancelEdit();
      return;
    }
    const rows: EditableRow[] = this.displayedData().map(r => ({ ...r, isNew: false }));
    this.editableData.set(rows);
    this.buildAllRowState(rows);
    this.isEditMode.set(true);
  }

  onCancelEdit(): void {
    this.isEditMode.set(false);
    this.editableData.set([]);
    this.rowForms.clear();
    this.termDateFilters = [];
    this.effDateErrorMatchers = [];
    this.termDateErrorMatchers = [];
    this.lastChangedDateField = [];
  }

  // ── Add / Delete Rows ──

  onAddRow(): void {
    const prefix = this.prefixControl.value || '';
    const newRow: EditableRow = {
      testBatchPrefix: prefix,
      testAntigen: '',
      extFacCode: '0000',
      approvedFlag: 'L',
      effDate: new Date().toISOString(),
      termDate: null,
      insertDate: '',
      insertUser: '',
      programId: '',
      chapterId: '',
      modifiedUser: null,
      modifiedDate: null,
      auditKey: 0,
      isNew: true,
    };
    const current = [newRow, ...this.editableData()];
    this.editableData.set(current);
    this.buildAllRowState(current);
  }

  onDeleteRow(index: number): void {
    const rows = [...this.editableData()];
    rows.splice(index, 1);
    this.editableData.set(rows);
    this.buildAllRowState(rows);
  }

  // ── Save ──

  onSave(): void {
    let hasError = false;
    this.rowForms.forEach((form) => {
      form.markAllAsTouched();
      if (form.invalid) hasError = true;
    });
    if (hasError) {
      this.snackbar.showError('Please fix validation errors before saving.');
      return;
    }

    const rows = this.editableData();
    const seen = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      const form = this.rowForms.get(i);
      if (!form) continue;
      const raw = form.getRawValue();
      const prefix = (raw.testBatchPrefix || '').toUpperCase();
      const antigen = raw.testAntigen || '';
      if (!antigen) continue;
      const key = `${prefix}|${antigen}`;
      if (seen.has(key)) {
        this.snackbar.showError('Duplicate record found: same Test Batch Prefix and Test Antigen.');
        return;
      }
      seen.add(key);
    }

    const creates: ExtAntApprovalCreateDto[] = [];
    const updates: ExtAntApprovalUpdateDto[] = [];

    rows.forEach((row, i) => {
      const form = this.rowForms.get(i)!;
      const val = form.getRawValue();
      if (row.isNew) {
        creates.push({
          testBatchPrefix: val.testBatchPrefix,
          testAntigen: val.testAntigen,
          extFacCode: '0000',
          approvedFlag: val.approvedFlag,
          effDate: this.formatDateForApi(val.effDate),
          termDate: val.termDate ? this.formatDateForApi(val.termDate) : null,
        });
      } else {
        updates.push({
          auditKey: row.auditKey,
          approvedFlag: val.approvedFlag,
          effDate: this.formatDateForApi(val.effDate),
          termDate: val.termDate ? this.formatDateForApi(val.termDate) : null,
        });
      }
    });

    if (creates.length === 0 && updates.length === 0) {
      this.onCancelEdit();
      return;
    }

    this.loading.set(true);

    const ops: ReturnType<typeof this.service.create>[] = [];
    if (creates.length > 0) ops.push(this.service.create(creates));
    if (updates.length > 0) ops.push(this.service.update(updates));

    forkJoin(ops)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const failed = results.find(r => !r.success);
          if (failed) {
            this.snackbar.showError(failed.errorResponse?.error || failed.message || 'Save failed');
            this.loading.set(false);
          } else {
            this.snackbar.showSuccess('Records saved successfully.');
            this.isEditMode.set(false);
            this.rowForms.clear();
            this.loadData();
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  // ── Form Building ──

  private buildAllRowState(rows: EditableRow[]): void {
    this.rowForms.clear();
    this.termDateFilters = [];
    this.effDateErrorMatchers = [];
    this.termDateErrorMatchers = [];
    this.lastChangedDateField = [];

    rows.forEach((row, i) => {
      const form = this.createRowForm(row);
      this.rowForms.set(i, form);
      this.termDateFilters.push(this.createTermFilterForRow(i));
      this.effDateErrorMatchers.push(this.createEffErrorMatcher(i));
      this.termDateErrorMatchers.push(this.createTermErrorMatcher(i));
      this.lastChangedDateField.push(null);

      form.get('effDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.lastChangedDateField[i] = 'effective';
        this.termDateFilters[i] = this.createTermFilterForRow(i);
        form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
        form.updateValueAndValidity({ emitEvent: false });
      });

      form.get('termDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.lastChangedDateField[i] = 'termination';
        form.updateValueAndValidity({ emitEvent: false });
      });
    });
  }

  private createRowForm(row: EditableRow): FormGroup {
    const chapterTz = this.headerService.chapterTimeZone();
    const effValidators: any[] = [Validators.required, DateFieldValidationUtility.validDateValidator()];
    const termValidators: any[] = [DateFieldValidationUtility.validDateValidator()];

    if (row.isNew) {
      effValidators.push(DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTz));
      termValidators.push(DateFieldValidationUtility.terminationDateNotPastValidator(chapterTz));
    }

    return new FormGroup({
      testBatchPrefix: new FormControl({ value: row.testBatchPrefix, disabled: true }),
      testAntigen: new FormControl(
        { value: row.testAntigen, disabled: !row.isNew },
        [Validators.required],
      ),
      approvedFlag: new FormControl(row.approvedFlag, [Validators.required]),
      effDate: new FormControl(
        row.effDate ? moment(row.effDate) : moment(),
        effValidators,
      ),
      termDate: new FormControl(
        row.termDate ? moment(row.termDate) : null,
        termValidators,
      ),
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
    });
  }

  private createTermFilterForRow(index: number): (date: moment.Moment | null) => boolean {
    return (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const form = this.rowForms.get(index);
      const effValue = form?.get('effDate')?.value;
      if (!effValue) return true;
      const effDay = moment(effValue).startOf('day');
      return moment(date).startOf('day').isSameOrAfter(effDay);
    };
  }

  private createEffErrorMatcher(index: number): ErrorStateMatcher {
    return {
      isErrorState: (control: FormControl | null): boolean => {
        if (!control) return false;
        // For new rows, show errors immediately (don't wait for touched)
        const row = this.editableData()[index];
        const showImmediately = row?.isNew;
        if (!showImmediately && !(control.dirty || control.touched)) return false;
        if (control.invalid) return true;
        if (!!this.getEffDateError(index)) return true;
        const form = this.rowForms.get(index);
        return form?.hasError('dateRangeInvalid') ?? false;
      },
    };
  }

  private createTermErrorMatcher(index: number): ErrorStateMatcher {
    return {
      isErrorState: (control: FormControl | null): boolean => {
        if (!control) return false;
        const row = this.editableData()[index];
        const showImmediately = row?.isNew;
        if (!showImmediately && !(control.dirty || control.touched)) return false;
        if (control.invalid) return true;
        if (!!this.getTermDateError(index)) return true;
        const form = this.rowForms.get(index);
        return form?.hasError('dateRangeInvalid') ?? false;
      },
    };
  }

  onEffDatePickerChange(index: number): void {
    const form = this.rowForms.get(index);
    if (!form) return;
    this.termDateFilters[index] = this.createTermFilterForRow(index);
    form.get('effDate')?.markAsTouched();
    form.get('effDate')?.markAsDirty();
    form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
    form.updateValueAndValidity({ emitEvent: false });
  }

  onTermDatePickerChange(index: number): void {
    const form = this.rowForms.get(index);
    if (!form) return;
    form.get('termDate')?.markAsTouched();
    form.get('termDate')?.markAsDirty();
    form.updateValueAndValidity({ emitEvent: false });
  }

  getMinDate(): moment.Moment {
    if (!this.cachedMinDate) {
      this.cachedMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    }
    return this.cachedMinDate;
  }

  onEffDateInput(event: Event, index: number): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.rowForms.get(index)?.get('effDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    if (!inputValue?.trim()) {
      ctrl.updateValueAndValidity();
    } else if (!ctrl.value) {
      ctrl.setErrors({ ...(ctrl.errors || {}), invalidDate: true });
    }
  }

  onTermDateInput(event: Event, index: number): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.rowForms.get(index)?.get('termDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    if (!inputValue?.trim()) {
      ctrl.setErrors(null);
      ctrl.updateValueAndValidity();
    } else if (!ctrl.value) {
      ctrl.setErrors({ ...(ctrl.errors || {}), invalidDate: true });
    }
  }

  getEffDateError(index: number): string {
    const form = this.rowForms.get(index);
    if (!form) return '';
    const control = form.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('invalidDate')) return 'Effective Date is invalid';
    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';
    if (this.lastChangedDateField[index] === 'effective' && form.hasError('dateRangeInvalid')) {
      return 'Effective Date must be less than or equal to Termination Date';
    }
    return '';
  }

  getTermDateError(index: number): string {
    const form = this.rowForms.get(index);
    if (!form) return '';
    const control = form.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('invalidDate')) return 'Termination Date is invalid';
    if (control.hasError('terminationDatePast')) return 'Termination Date cannot be past date';
    if (this.lastChangedDateField[index] === 'termination' && form.hasError('dateRangeInvalid')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }
    return '';
  }

  getRowControl(index: number, field: string): FormControl {
    return this.rowForms.get(index)?.get(field) as FormControl;
  }

  getApprovalFlagOptions(): { value: string; label: string }[] {
    return [
      { value: 'L', label: 'Licensed' },
      { value: 'U', label: 'Unapproved' },
      { value: 'A', label: 'Approved' },
    ];
  }

  // ── Data Loading ──

  private loadData(): void {
    this.loading.set(true);
    this.hasSearched.set(true);

    const params = {
      testBatchPrefix: this.prefixControl.value || '',
      testAntigen: '',
      approvedFlag: '',
      searchText: '',
      showTerminated: true,
    };

    this.service
      .search(9999, 0, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            const records = res.data || [];
            this.allData.set(records);

            if (records.length === 0 && this.prefixControl.value) {
              this.showNoRecordsDialog();
            }
          } else {
            this.snackbar.showError(res.message || 'Failed to retrieve data');
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private showNoRecordsDialog(): void {
    const prefix = this.prefixControl.value;
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'No Records Found',
        message: `No records exist for Test Batch Prefix "${prefix}". Would you like to add new records?`,
        confirmText: 'Yes',
        cancelText: 'No',
      } as ConfirmActionDialogData,
      autoFocus: false,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result === true) {
        this.onToggleEditMode();
        this.onAddRow();
      }
    });
  }

  private loadPrefixes(): void {
    this.service.getLookupPrefixes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) this.prefixOptions.set(res.data || []);
        else this.snackbar.showError(res.message || 'Failed to load prefix options');
      },
      error: () => this.snackbar.showError('Failed to load prefix options'),
    });
  }

  private loadAntigenTests(): void {
    this.service.getLookupAntigenTests().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) this.antigenTestOptions.set(res.data || []);
        else this.snackbar.showError(res.message || 'Failed to load antigen test options');
      },
      error: () => this.snackbar.showError('Failed to load antigen test options'),
    });
  }

  // ── Formatting ──

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') + 'T00:00:00' : '';
  }
}
