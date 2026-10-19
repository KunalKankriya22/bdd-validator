import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { AntigenConfigRulesService } from '../services/antigen-config-rules.service';
import {
  AntigenConfigRule,
  AntigenConfigRuleCreateRequest,
  AntigenConfigRuleUpdateRequest,
  TestIdOption,
  SER_LIC_OPTIONS,
  MOL_LIC_OPTIONS,
} from '../models/antigen-config-rules.model';

function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (!Number.isInteger(n) || n < 1) return { positiveInteger: true };
  return null;
}

function ruleIdFormatValidator(control: AbstractControl): ValidationErrors | null {
  const val = String(control.value ?? '').trim();
  if (!val) return null;
  if (!val.includes('.')) return { noDecimal: true };
  return null;
}

function licFlagMatchesTypeValidator(group: AbstractControl): ValidationErrors | null {
  const testType = group.get('testType')?.value;
  const licFlag = group.get('licApproveFlag')?.value;
  if (!testType || !licFlag) return null;
  if (testType === 'SER' && !['U', 'L'].includes(licFlag)) return { licFlagInvalidForSer: true };
  if (testType === 'MOL' && !['U', 'A'].includes(licFlag)) return { licFlagInvalidForMol: true };
  return null;
}


@Component({
  selector: 'app-add-edit-rule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-rule.html',
  styleUrls: ['./add-edit-rule.scss'],
})
export class AddEditRuleComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AntigenConfigRule | null = null;
  @Input() antigenGroup = '';
  @Input() antigenCode = '';
  @Input() antigenGroups: string[] = [];
  @Input() labelingAntigens: string[] = [];
  @Input() serTestIds: TestIdOption[] = [];
  @Input() molTestIds: TestIdOption[] = [];

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();

  readonly serLicOptions = SER_LIC_OPTIONS;
  readonly molLicOptions = MOL_LIC_OPTIONS;
  readonly testTypeOptions = ['SER', 'MOL'];

  form!: FormGroup;
  isSaving = false;
  errorMessage = '';

  readonly minDate = DateFieldValidationUtility.getMinDate();
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  get isAdd(): boolean { return this.mode === 'add'; }
  get isEdit(): boolean { return this.mode === 'edit'; }

  get panelTitle(): string {
    return this.isAdd ? 'Add New Primary Rule and Details' : 'Edit Primary Rule and Details';
  }

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: AntigenConfigRulesService,
    private readonly headerService: HeaderService,
    private readonly chapterTimezoneService: ChapterTimezoneService,
  ) {
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError() ?? '');
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError() ?? '');
  }

  ngOnInit(): void {
    this.buildForm();
    if (this.isAdd) {
      this.listenToNoOfUnits();
      this.listenToPrimaryRuleId();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && this.form) {
      this.buildForm();
      if (this.isAdd) {
        this.listenToNoOfUnits();
        this.listenToPrimaryRuleId();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.errorMessage = '';
    this.lastChangedDateField = null;
    const chapterTz = this.headerService.chapterTimeZone();

    if (this.isAdd) {
      this.form = this.fb.group({
        primaryRuleId: [null, [Validators.required, positiveIntegerValidator, Validators.max(99999)]],
        noOfUnits: [2, [Validators.required, Validators.min(1), Validators.max(3)]],
        effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTz)]],
        termDate: [null],
        labelingAntigenCode: [null, Validators.required],
        details: this.fb.array([this.createDetailGroup(0, 'SER'), this.createDetailGroup(1, 'MOL')]),
      }, { validators: DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate') });
    } else {
      const rule = this.data!;
      this.form = this.fb.group({
        primaryRuleId: [{ value: rule.primaryRuleId, disabled: true }],
        noOfUnits: [{ value: rule.noOfUnits, disabled: true }],
        effDate: [{ value: rule.effDate ? moment(rule.effDate) : null, disabled: true }],
        termDate: [rule.termDate ? moment(rule.termDate) : null],
        details: this.fb.array(
          rule.details.map(d =>
            this.fb.group({
              ruleId: [{ value: d.ruleId, disabled: true }],
              testType: [{ value: d.testType, disabled: true }],
              testId: [{ value: d.testId, disabled: true }],
              licApproveFlag: [{ value: d.licApproveFlag, disabled: true }],
              noOfTests: [{ value: d.noOfTests, disabled: true }],
            })
          )
        ),
      }, { validators: DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate') });
    }
  }

  private createDetailGroup(index: number, testType: 'SER' | 'MOL' = 'SER'): FormGroup {
    return this.fb.group(
      {
        ruleId: [null, [Validators.required, ruleIdFormatValidator]],
        testType: [testType, Validators.required],
        testId: [null, Validators.required],
        licApproveFlag: [null, Validators.required],
        noOfTests: [1, [Validators.required, Validators.min(1)]],
      },
      { validators: licFlagMatchesTypeValidator },
    );
  }

  private listenToNoOfUnits(): void {
    this.form.get('noOfUnits')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const target = Math.min(Math.max(Number(val) || 1, 1), 3);
        while (this.details.length < target) {
          const idx = this.details.length;
          const group = this.createDetailGroup(idx);
          const primaryRuleId = this.form.get('primaryRuleId')?.value;
          if (primaryRuleId) {
            group.get('ruleId')?.setValue(`${primaryRuleId}.${idx + 1}`, { emitEvent: false });
          }
          this.details.push(group);
        }
        while (this.details.length > target) {
          this.details.removeAt(this.details.length - 1);
        }
      });
  }

  private listenToPrimaryRuleId(): void {
    this.form.get('primaryRuleId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.details.controls.forEach((ctrl, i) => {
          ctrl.get('ruleId')?.setValue(val ? `${val}.${i + 1}` : null, { emitEvent: false });
        });
      });
  }

  getTestIdOptions(i: number): TestIdOption[] {
    return this.details.at(i).get('testType')?.value === 'MOL'
      ? this.molTestIds
      : this.serTestIds;
  }

  getTestIdLabel(testId: string, i: number): string {
    const opt = this.getTestIdOptions(i).find(o => o.value === testId);
    return opt?.description ? `${opt.value} - ${opt.description}` : testId;
  }

  getLicOptions(i: number): typeof SER_LIC_OPTIONS {
    return this.details.at(i).get('testType')?.value === 'MOL'
      ? this.molLicOptions
      : this.serLicOptions;
  }

  onTestTypeChange(i: number): void {
    this.details.at(i).patchValue({ testId: null, licApproveFlag: null });
  }

  onPrimaryRuleIdKeyDown(event: KeyboardEvent): void {
    if (['.', 'e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
      return;
    }
    const isDigit = event.key >= '0' && event.key <= '9';
    if (isDigit) {
      const input = event.target as HTMLInputElement;
      const hasSelection = input.selectionStart !== input.selectionEnd;
      if (input.value.length >= 5 && !hasSelection) {
        event.preventDefault();
      }
    }
  }

  onRuleIdInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    // Allow only digits and one decimal point
    let val = input.value.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      val = val.slice(0, dotIndex + 1) + val.slice(dotIndex + 1).replace(/\./g, '');
    }
    if (val.length > 8) val = val.slice(0, 8);
    if (input.value !== val) {
      input.value = val;
      this.details.at(index).get('ruleId')?.setValue(val || null, { emitEvent: true });
    }
  }

  getEffectiveDateError(): string | null {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      this.lastChangedDateField === 'effective' ? this.form.errors : null,
    );
  }

  getTerminationDateError(): string | null {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      this.lastChangedDateField === 'termination' ? this.form.errors : null,
    );
  }

  onEffectiveDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    const value = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(value, this.form.get('effDate'));
  }

  onEffectiveDateChange(): void {
    this.lastChangedDateField = 'effective';
  }

  onTerminationDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    const value = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(value, this.form.get('termDate'), this.isEdit);
  }

  onTerminationDateChange(): void {
    this.lastChangedDateField = 'termination';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.isAdd ? this.saveAdd() : this.saveEdit();
  }

  onSaveAndAddAnother(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saveAdd(true);
  }

  private saveAdd(andAnother = false): void {
    const val = this.form.getRawValue();
    const effDateStr = DateFieldValidationUtility.serializeDateForApi(val.effDate) ?? null;
    const termDateStr = DateFieldValidationUtility.serializeDateForApi(val.termDate) ?? null;

    // Validate that all detail ruleIds start with primaryRuleId
    const prefix = String(val.primaryRuleId) + '.';
    const badPrefix = val.details.some((d: any) => !String(d.ruleId ?? '').startsWith(prefix));
    if (badPrefix) {
      this.errorMessage = `Rule ID must start with ${val.primaryRuleId} (e.g. ${val.primaryRuleId}.1)`;
      return;
    }

    const payload: AntigenConfigRuleCreateRequest = {
      primaryRuleId: Number(val.primaryRuleId),
      antigenCode: this.antigenCode,
      antigenGroup: this.antigenGroup,
      labelingAntigenCode: val.labelingAntigenCode ?? this.antigenCode,
      noOfUnits: Number(val.noOfUnits),
      effDate: effDateStr!,
      termDate: termDateStr,
      details: val.details.map((d: any) => ({
        ruleId: parseFloat(d.ruleId),
        testType: d.testType,
        testId: d.testId,
        licApproveFlag: d.licApproveFlag,
        noOfTests: Number(d.noOfTests),
        effDate: effDateStr!,
        termDate: termDateStr,
      })),
    };

    this.isSaving = true;
    this.errorMessage = '';

    this.service
      .create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saveSuccess.emit();
          if (andAnother) {
            this.buildForm();
            this.listenToNoOfUnits();
          } else {
            this.closePanel.emit();
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || err?.message || 'Failed to save. Please try again.';
        },
      });
  }

  private saveEdit(): void {
    const val = this.form.getRawValue();
    const termDateStr = DateFieldValidationUtility.serializeDateForApi(val.termDate) ?? null;

    const payload: AntigenConfigRuleUpdateRequest = {
      primaryRuleId: this.data!.primaryRuleId,
      termDate: termDateStr,
      details: null,
    };

    this.isSaving = true;
    this.errorMessage = '';

    this.service
      .update(this.data!.primaryRuleId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || err?.message || 'Failed to update. Please try again.';
        },
      });
  }

  formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const m = moment.utc(dateStr);
    if (!m.isValid()) return '-';
    const localM = this.chapterTimezoneService.convertGmtToLocal(m);
    const day = String(localM.date()).padStart(2, '0');
    const monthStr = localM.format('MMM').toUpperCase();
    return `${day}-${monthStr}-${localM.year()}`;
  }

  getTestTypeLabel(type: string): string {
    return type === 'SER' ? 'Serological' : type === 'MOL' ? 'Molecular' : type;
  }

  getLicLabel(flag: string): string {
    const map: Record<string, string> = { L: 'Licensed', U: 'Unlicensed', A: 'Approved' };
    return map[flag] ?? flag;
  }
}
