import {
  Component, OnInit, OnDestroy, HostListener, ViewChild, TemplateRef,
  computed, effect, inject, ChangeDetectorRef, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormControl, FormGroup, FormArray, FormBuilder, Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';

import { EnterTestsMappingService } from './services/enter-tests-mapping.service';
import {
  ContractDropdownItem, TestDropdownItem, TestMappingRow,
  TestMappingSaveRequest, TestMappingRowPayload, WarningItem,
} from './models/enter-tests-mapping.model';

@Component({
  selector: 'app-enter-tests-mapping',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatDialogModule, MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-tests-mapping.html',
  styleUrls: ['./enter-tests-mapping.scss'],
})
export class EnterTestsMappingComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(EnterTestsMappingService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService = inject(SnackbarService);

  private destroy$ = new Subject<void>();

  // ── Page header (computed pattern from KB) ──
  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
    return { breadcrumbs: [{ label: 'Home', link: '/home' }], title: '', subtitle: '' };
  });

  // ── Contract dropdown (FE-DROP-005 adaptive) ──
  contractControl = new FormControl<ContractDropdownItem | null>(null, Validators.required);
  contractOptions = signal<ContractDropdownItem[]>([]);
  contractSearchControl = new FormControl('');
  private contractSearchValue = toSignal(
    this.contractSearchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );
  filteredContracts = computed(() => {
    const q = (this.contractSearchValue() || '').toLowerCase();
    const all = this.contractOptions();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.contractId.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
    );
  });
  isLoadingContracts = false;
  selectedContract: ContractDropdownItem | null = null;
  selectedContractDescription = '';

  // ── Test dropdown options (FE-DROP-005 adaptive) ──
  testOptions = signal<TestDropdownItem[]>([]);
  isLoadingTests = false;
  testSearchControl = new FormControl('');
  private testSearchValue = toSignal(
    this.testSearchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );
  filteredTestOptions = computed(() => {
    const q = (this.testSearchValue() || '').toLowerCase();
    const all = this.testOptions();
    if (!q) return all;
    return all.filter(
      (t) =>
        t.testId.toLowerCase().includes(q) ||
        t.testDesc?.toLowerCase().includes(q)
    );
  });

  // ── Inline table FormArray ──
  rows = new FormArray<FormGroup>([]);
  originalTestIds = new Set<string>();
  isLoadingMatrix = false;
  formDirty = false;

  // ── Sort ──
  sortColumn = 'testId';
  sortDirection: 'asc' | 'desc' = 'asc';

  // ── Date ──
  minEffDate = DateFieldValidationUtility.getMinDate();
  private lastChangedDateFieldMap = new WeakMap<FormGroup, 'effDate' | 'termDate'>();
  private termDateFilters = new Map<number, (date: moment.Moment | null) => boolean>();
  private originalTermDates = new WeakMap<FormGroup, moment.Moment | null>();

  // ── Save ──
  isSaving = false;

  // ── Warning dialog ──
  @ViewChild('warningDialogTpl') warningDialogTpl!: TemplateRef<unknown>;
  pendingWarnings: WarningItem[] = [];

  constructor() {
    effect(() => {
      const tz = this.headerService.chapterTimeZone();
      this.minEffDate = DateFieldValidationUtility.getMinDate(tz);
    });
  }

  // ────────────────────────── Lifecycle ──────────────────────────

  ngOnInit(): void {
    this.loadContracts();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────── Chapter change ──────────────────────────

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.minEffDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
        this.clearContract();
        this.contractOptions.set([]);
        this.loadContracts();
      });
  }

  // ────────────────────────── Contract dropdown (FE-DROP-005) ──────────────────────────

  compareContract = (a: ContractDropdownItem, b: ContractDropdownItem): boolean => {
    return !!a && !!b && a.contractId === b.contractId;
  };

  private loadContracts(): void {
    this.isLoadingContracts = true;
    this.service
      .getContractsDropdown()
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoadingContracts = false)))
      .subscribe((data) => {
        this.contractOptions.set(data);
      });
  }

  onContractSelectOpened(opened: boolean): void {
    if (opened) {
      this.contractSearchControl.setValue('');
    }
  }

  onContractChanged(): void {
    const contract = this.contractControl.value;
    if (contract) {
      this.selectedContract = contract;
      this.selectedContractDescription = contract.company;
      this.loadTestOptionsThenMatrix(contract.contractId);
    }
  }

  clearContract(): void {
    this.contractControl.setValue(null, { emitEvent: false });
    this.contractControl.markAsPristine();
    this.contractControl.markAsUntouched();
    this.selectedContract = null;
    this.selectedContractDescription = '';
    this.testOptions.set([]);
    this.rows.clear();
    this.originalTestIds.clear();
    this.formDirty = false;
  }

  // ────────────────────────── Test options ──────────────────────────

  private loadTestOptionsThenMatrix(contractId: string): void {
    this.isLoadingTests = true;
    this.isLoadingMatrix = true;
    this.service
      .getTestsDropdown(contractId)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoadingTests = false)))
      .subscribe((data) => {
        this.testOptions.set(data);
        this.loadTestMatrix(contractId);
      });
  }

  getAvailableTests(rowIndex: number): TestDropdownItem[] {
    const usedTestIds = new Set<string>();
    this.rows.controls.forEach((row, i) => {
      if (i !== rowIndex) {
        const testVal = row.get('testId')?.value;
        if (testVal) {
          const id = typeof testVal === 'object' ? testVal.testId : testVal;
          if (id) usedTestIds.add(id.toUpperCase());
        }
      }
    });
    const filtered = this.filteredTestOptions();
    return filtered.filter(
      (t) => !usedTestIds.has(t.testId.toUpperCase())
    );
  }

  onTestSelectOpened(opened: boolean): void {
    if (opened) {
      this.testSearchControl.setValue('');
    }
  }

  // ────────────────────────── Test matrix load ──────────────────────────

  private loadTestMatrix(contractId: string): void {
    this.isLoadingMatrix = true;
    this.service
      .getTestMatrix(contractId)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoadingMatrix = false)))
      .subscribe((data) => {
        this.buildFormArray(data);
        this.formDirty = false;
        this.cdr.detectChanges();
      });
  }

  private buildFormArray(data: TestMappingRow[]): void {
    this.rows.clear();
    this.originalTestIds.clear();
    this.termDateFilters.clear();

    // Template row at index 0
    this.rows.push(this.createTemplateRow());

    // Existing rows
    data.forEach((row) => {
      this.originalTestIds.add(row.testId.toUpperCase());
      this.rows.push(this.createExistingRow(row));
    });

    this.applySortToRows();
  }

  private createTemplateRow(): FormGroup {
    const row = this.fb.group({
      testId: [null],
      testDesc: [{ value: '', disabled: true }],
      cbcTestId: [''],
      effDate: [null],
      termDate: [null],
      modifiedDate: [{ value: null, disabled: true }],
      isNew: [true],
    });
    return row;
  }

  private promoteTemplateRow(row: FormGroup): void {
    row.get('testId')?.addValidators(Validators.required);
    row.get('cbcTestId')?.addValidators([Validators.required, Validators.maxLength(10), noWhitespaceOnlyValidator]);
    row.get('effDate')?.addValidators([
      Validators.required,
      DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone()),
    ]);
    row.addValidators(DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'));
    row.get('testId')?.updateValueAndValidity({ emitEvent: false });
    row.get('cbcTestId')?.updateValueAndValidity({ emitEvent: false });
    row.get('effDate')?.updateValueAndValidity({ emitEvent: false });
    row.updateValueAndValidity({ emitEvent: false });
  }

  private createExistingRow(row: TestMappingRow): FormGroup {
    const testOption = this.testOptions().find(
      (t: TestDropdownItem) => t.testId.toUpperCase() === row.testId.toUpperCase()
    );
    const origTerm = row.termDate ? moment(row.termDate) : null;
    const group = this.fb.group({
      testId: [testOption || row.testId, Validators.required],
      testDesc: [{ value: row.testDesc || '', disabled: true }],
      cbcTestId: [row.cbcTestId || '', [Validators.required, Validators.maxLength(10), noWhitespaceOnlyValidator]],
      effDate: [row.effDate ? moment(row.effDate) : null, [
        Validators.required,
      ]],
      termDate: [row.termDate ? moment(row.termDate) : null],
      modifiedDate: [{ value: row.modifiedDate, disabled: true }],
      isNew: [false],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
    });
    this.originalTermDates.set(group, origTerm);
    return group;
  }

  // ────────────────────────── Row operations ──────────────────────────

  compareTest = (a: TestDropdownItem | string, b: TestDropdownItem | string): boolean => {
    const aId = typeof a === 'object' ? a?.testId : a;
    const bId = typeof b === 'object' ? b?.testId : b;
    return !!aId && !!bId && aId.toUpperCase() === bId.toUpperCase();
  };

  isTemplateRow(index: number): boolean {
    return index === 0 && this.rows.at(0)?.get('isNew')?.value === true
      && !this.rows.at(0)?.get('testId')?.value;
  }

  onTestSelected(rowIndex: number): void {
    const row = this.rows.at(rowIndex);
    const testVal = row.get('testId')?.value as TestDropdownItem;
    if (testVal) {
      row.get('testDesc')?.setValue(testVal.testDesc);
      this.markDirty();

      // If this was the template row (index 0), promote it and add a new template above
      if (rowIndex === 0 && row.get('isNew')?.value === true) {
        this.promoteTemplateRow(row);
        this.rows.insert(0, this.createTemplateRow());
        this.termDateFilters.clear();
        this.applySortToRows();
      }
    }
  }

  getTestDescription(index: number): string {
    const row = this.rows.at(index);
    const testVal = row.get('testId')?.value;
    if (!testVal) return '';
    if (typeof testVal === 'object' && testVal.testDesc) return testVal.testDesc;
    const desc = row.get('testDesc')?.value;
    return desc || '';
  }

  getTestIdDisplay(index: number): string {
    const testVal = this.rows.at(index).get('testId')?.value;
    if (!testVal) return '';
    return typeof testVal === 'object' ? testVal.testId : testVal;
  }

  deleteRow(index: number): void {
    this.rows.removeAt(index);
    this.termDateFilters.clear();
    this.markDirty();
  }

  clearAllRows(): void {
    if (!this.formDirty || !this.selectedContract) return;
    this.loadTestOptionsThenMatrix(this.selectedContract.contractId);
  }

  markDirty(): void {
    this.formDirty = true;
  }

  // ────────────────────────── Sort ──────────────────────────

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applySortToRows();
  }

  private applySortToRows(): void {
    if (this.rows.length <= 1) return;
    const templateRow = this.rows.at(0);
    const isTemplate = templateRow.get('isNew')?.value === true
      && !templateRow.get('testId')?.value;

    const startIndex = isTemplate ? 1 : 0;
    const dataRows = this.rows.controls.slice(startIndex);

    dataRows.sort((a, b) => {
      const aId = this.getRowTestId(a);
      const bId = this.getRowTestId(b);
      const cmp = aId.localeCompare(bId, undefined, { sensitivity: 'base' });
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    const sorted = isTemplate ? [templateRow, ...dataRows] : dataRows;
    this.rows.clear();
    sorted.forEach((r) => this.rows.push(r));
  }

  private getRowTestId(row: FormGroup): string {
    const val = row.get('testId')?.value;
    if (!val) return '';
    return typeof val === 'object' ? val.testId : val;
  }

  // ────────────────────────── Date helpers ──────────────────────────

  getTermDateFilter(index: number): (date: moment.Moment | null) => boolean {
    if (!this.termDateFilters.has(index)) {
      this.termDateFilters.set(index, (date: moment.Moment | null): boolean => {
        if (!date) return true;
        try {
          const checkDate = moment(date).clone().startOf('day');
          const today = this.chapterTimezoneService.getChapterLocalDate();
          if (checkDate.isBefore(today)) return false;
          const row = this.rows.at(index);
          const eff = row?.get('effDate')?.value;
          if (eff) {
            const effMoment = moment.isMoment(eff) ? eff.clone() : moment(eff);
            if (effMoment.isValid() && checkDate.isBefore(effMoment.clone().startOf('day'))) return false;
          }
          return true;
        } catch {
          return true;
        }
      });
    }
    return this.termDateFilters.get(index)!;
  }

  onEffDateChange(row: FormGroup): void {
    this.lastChangedDateFieldMap.set(row, 'effDate');
    row.updateValueAndValidity();
    this.markDirty();
  }

  onTermDateChange(row: FormGroup): void {
    this.lastChangedDateFieldMap.set(row, 'termDate');
    row.updateValueAndValidity();
    this.markDirty();
  }

  onEffDateInput(event: Event, row: FormGroup): void {
    const value = (event.target as HTMLInputElement).value;
    this.lastChangedDateFieldMap.set(row, 'effDate');
    const effControl = row.get('effDate')!;
    DateFieldValidationUtility.handleStartDateInput(value, effControl);
    if (value?.trim() && !effControl.value) {
      effControl.setErrors({ ...(effControl.errors || {}), invalidDateFormat: true });
    }
    row.updateValueAndValidity();
    this.markDirty();
  }

  onTermDateInput(event: Event, row: FormGroup): void {
    const value = (event.target as HTMLInputElement).value;
    this.lastChangedDateFieldMap.set(row, 'termDate');
    const isExisting = row.get('isNew')?.value === false;
    const termControl = row.get('termDate')!;
    DateFieldValidationUtility.handleEndDateInput(value, termControl, isExisting);
    if (value?.trim() && !termControl.value) {
      termControl.setErrors({ ...(termControl.errors || {}), invalidDateFormat: true });
    }
    row.updateValueAndValidity();
    this.markDirty();
  }

  private effDateMatchers = new WeakMap<FormGroup, ErrorStateMatcher>();
  private termDateMatchers = new WeakMap<FormGroup, ErrorStateMatcher>();

  getEffDateMatcher(row: FormGroup): ErrorStateMatcher {
    if (!this.effDateMatchers.has(row)) {
      this.effDateMatchers.set(row, {
        isErrorState: (control): boolean => {
          if (!control) return false;
          const isExisting = row.get('isNew')?.value === false;
          const interacted = control.touched || control.dirty || isExisting;
          if (!interacted) return false;
          const lastChanged = this.lastChangedDateFieldMap.get(row);
          // If cross-field error exists and term was last changed, suppress eff errors entirely
          if (row.hasError('dateRangeInvalid') && lastChanged === 'termDate') return false;
          if (control.invalid) return true;
          if (row.hasError('dateRangeInvalid') && row.get('termDate')?.value
              && lastChanged === 'effDate') return true;
          return false;
        }
      });
    }
    return this.effDateMatchers.get(row)!;
  }

  getTermDateMatcher(row: FormGroup): ErrorStateMatcher {
    if (!this.termDateMatchers.has(row)) {
      this.termDateMatchers.set(row, {
        isErrorState: (control): boolean => {
          if (!control) return false;
          const isExisting = row.get('isNew')?.value === false;
          const interacted = control.touched || control.dirty || isExisting;
          if (!interacted) return false;
          if (control.hasError('invalidDateFormat') || control.hasError('matDatepickerParse')) return true;
          if (!this.isTermDateActuallyChanged(row)) return false;
          const lastChanged = this.lastChangedDateFieldMap.get(row);
          if (row.hasError('dateRangeInvalid') && lastChanged === 'effDate') return false;
          if (control.invalid) return true;
          if (row.hasError('dateRangeInvalid') && row.get('effDate')?.value && control.value
              && lastChanged === 'termDate') return true;
          return false;
        }
      });
    }
    return this.termDateMatchers.get(row)!;
  }

  private shouldShowError(row: FormGroup, field: string): boolean {
    const c = row.get(field);
    if (!c) return false;
    const isExisting = row.get('isNew')?.value === false;
    return c.touched || c.dirty || isExisting;
  }

  getEffDateError(row: FormGroup): string {
    const c = row.get('effDate');
    if (!c || !this.shouldShowError(row, 'effDate')) return '';
    const lastChanged = this.lastChangedDateFieldMap.get(row);
    // Suppress all eff errors when cross-field error is active and term was last changed
    if (row.hasError('dateRangeInvalid') && lastChanged === 'termDate') return '';
    if (c.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (c.hasError('invalidDateFormat') || c.hasError('invalidDate')) return 'Effective Date is invalid';
    if (c.hasError('required')) return 'Effective Date is required';
    if (c.hasError('matDatepickerMin')) return 'Effective Date cannot be a past date';
    if (c.hasError('effectiveDatePast')) return 'Effective Date cannot be a past date';
    if (row.hasError('dateRangeInvalid') && row.get('termDate')?.value
        && lastChanged === 'effDate') {
      return 'Effective Date must be on or before Termination Date';
    }
    return '';
  }

  getTermDateError(row: FormGroup): string {
    const c = row.get('termDate');
    if (!c || !this.shouldShowError(row, 'termDate')) return '';
    const isExisting = row.get('isNew')?.value === false;
    const lastChanged = this.lastChangedDateFieldMap.get(row);
    if (row.hasError('dateRangeInvalid') && lastChanged === 'effDate') return '';
    if (c.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (c.hasError('invalidDateFormat') || c.hasError('invalidDate')) return 'Termination Date is invalid';
    if (!this.isTermDateActuallyChanged(row)) return '';
    if (c.hasError('matDatepickerFilter')) return 'Termination Date must be on or after current date';
    if (c.hasError('terminationDatePast')) return 'Termination Date cannot be a past date';
    if (row.hasError('dateRangeInvalid') && row.get('effDate')?.value && c.value
        && lastChanged === 'termDate') {
      return 'Termination Date must be on or after Effective Date';
    }
    return '';
  }

  formatDate(value: any): string {
    return DateFieldValidationUtility.formatDateForUI(value) || '-';
  }

  private isTermDateActuallyChanged(row: FormGroup): boolean {
    if (row.get('isNew')?.value === true) return true;
    const orig = this.originalTermDates.get(row);
    const current = row.get('termDate')?.value;
    if (!orig && !current) return false;
    if (!orig || !current) return true;
    return !moment.isMoment(current) || !orig.isSame(current, 'day');
  }

  // ────────────────────────── Input helpers ──────────────────────────

  blockLeadingSpace(event: KeyboardEvent): void {
    if (event.key === ' ' && (event.target as HTMLInputElement).selectionStart === 0) {
      event.preventDefault();
    }
  }

  // ────────────────────────── Save ──────────────────────────

  get canSave(): boolean {
    if (this.isSaving || !this.selectedContract) return false;
    if (!this.formDirty) return false;
    const dataRows = this.getDataRows();
    if (dataRows.length === 0) return true;
    return dataRows.every((r) => this.isRowValid(r));
  }

  private getDataRows(): FormGroup[] {
    return this.rows.controls.filter((row) => {
      const testVal = row.get('testId')?.value;
      return !!testVal;
    });
  }

  private isRowValid(row: FormGroup): boolean {
    const testVal = row.get('testId')?.value;
    if (!testVal) return false;
    const cbcTestId = row.get('cbcTestId')?.value?.trim();
    if (!cbcTestId) return false;
    const effDate = row.get('effDate');
    if (!effDate?.value || effDate.invalid) return false;
    const termDate = row.get('termDate');
    if (termDate?.hasError('invalidDateFormat') || termDate?.hasError('matDatepickerParse')) return false;
    if (termDate?.value && termDate.invalid && this.isTermDateActuallyChanged(row)) return false;
    if (row.hasError('dateRangeInvalid')) return false;
    return true;
  }

  isFieldInvalid(row: FormGroup, field: string): boolean {
    const control = row.get(field);
    if (!control) return false;
    return control.invalid && (control.dirty || control.touched);
  }

  onSave(): void {
    if (!this.selectedContract || !this.formDirty) return;
    this.markDataRowsTouched();
    if (!this.canSave) return;
    this.executeSave();
  }

  private markDataRowsTouched(): void {
    this.getDataRows().forEach((row) => {
      Object.keys(row.controls).forEach((key) => {
        row.get(key)?.markAsTouched();
        row.get(key)?.markAsDirty();
      });
    });
  }

  private executeSave(): void {
    this.isSaving = true;
    const dataRows = this.getDataRows();

    const request: TestMappingSaveRequest = {
      contractId: this.selectedContract!.contractId,
      rows: dataRows.map((row) => {
        const testVal = row.get('testId')?.value;
        const testId = typeof testVal === 'object' ? testVal.testId : testVal;
        return {
          testId,
          cbcTestId: row.get('cbcTestId')?.value?.trim() || null,
          effDate: DateFieldValidationUtility.serializeDateForApi(row.get('effDate')?.value),
          termDate: DateFieldValidationUtility.serializeDateForApi(row.get('termDate')?.value),
        } as TestMappingRowPayload;
      }),
    };

    this.service
      .saveTestMatrix(request)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (response) => {
          if (response.status === 'WARNING' && response.warnings?.length) {
            this.snackbarService.showSuccess(response.message);
            this.pendingWarnings = response.warnings;
            this.dialog.open(this.warningDialogTpl, { width: '480px', ariaLabelledBy: 'warning-dialog-title', ariaDescribedBy: 'warning-dialog-content' });
          } else {
            this.snackbarService.showSuccess(response.message);
          }
          this.loadTestOptionsThenMatrix(this.selectedContract!.contractId);
        },
        error: () => {
          this.isLoadingMatrix = false;
        },
      });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
