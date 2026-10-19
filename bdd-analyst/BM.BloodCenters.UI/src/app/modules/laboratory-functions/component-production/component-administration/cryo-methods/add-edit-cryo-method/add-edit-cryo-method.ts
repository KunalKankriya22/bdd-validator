import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { FormGroupChildErrorStateMatcher } from '@shared/error-state-matchers/form-group-child-error-state.matcher';
import { CryoMethodModel, CryoMethodFormValue } from '../models/cryo-methods.model';
import {
  timeFormatValidator,
  temperatureRangeValidator,
  worksheetFreezeTimeRangeValidator,
  separationFreezeTimeRangeValidator
} from '../validators/cryo-method.validators';

@Component({
  selector: 'app-add-edit-cryo-method',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-cryo-method.html',
  styleUrls: ['./add-edit-cryo-method.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditCryoMethodComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: CryoMethodModel | null = null;

  @Output() save = new EventEmitter<CryoMethodFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<CryoMethodFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  minDate: Moment;
  terminationMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );
  tempErrorMatcher = new FormGroupChildErrorStateMatcher(() => this.form, 'tempRangeInvalid');
  wsTimeErrorMatcher = new FormGroupChildErrorStateMatcher(() => this.form, 'worksheetTimeRangeInvalid');
  sepTimeErrorMatcher = new FormGroupChildErrorStateMatcher(() => this.form, 'separationTimeRangeInvalid');

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && this.form) {
      this.initializeForm();
      this.setupModeValidators();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      const effControl = this.form.get('effDate');
      if (effControl) {
        effControl.enable();
        effControl.setValidators([Validators.required]);
        effControl.updateValueAndValidity();
      }

      const termControl = this.form.get('termDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
        termControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      thawMethod: [
        this.data?.thawMethod || null,
        [Validators.required, Validators.maxLength(4)]
      ],
      methodDesc: [
        this.data?.methodDesc || null,
        [Validators.required, Validators.maxLength(50)]
      ],
      minTemp: [
        this.data?.minTemp != null ? this.data.minTemp.toFixed(2) : null,
        [Validators.required, Validators.min(0), Validators.max(999.99)]
      ],
      maxTemp: [
        this.data?.maxTemp != null ? this.data.maxTemp.toFixed(2) : null,
        [Validators.required, Validators.min(0), Validators.max(999.99)]
      ],
      minWsFreezeTime: [
        this.data?.minWsFreezeTime != null ? this.data.minWsFreezeTime.toFixed(2) : null,
        [Validators.required, Validators.min(0), Validators.max(999.99), timeFormatValidator()]
      ],
      maxWsFreezeTime: [
        this.data?.maxWsFreezeTime != null ? this.data.maxWsFreezeTime.toFixed(2) : null,
        [Validators.required, Validators.min(0), Validators.max(999.99), timeFormatValidator()]
      ],
      minSepFreezeTime: [
        this.data?.minSepFreezeTime != null ? this.data.minSepFreezeTime.toFixed(2) : null,
        [Validators.required, Validators.min(0), Validators.max(999.99), timeFormatValidator()]
      ],
      maxSepFreezeTime: [
        this.data?.maxSepFreezeTime != null ? this.data.maxSepFreezeTime.toFixed(2) : null,
        [Validators.required, Validators.min(0), Validators.max(999.99), timeFormatValidator()]
      ],
      effDate: [
        this.data?.effDate ? moment(this.data.effDate) : null,
        [Validators.required]
      ],
      termDate: [
        this.data?.termDate ? moment(this.data.termDate) : null
      ],
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
        temperatureRangeValidator(),
        worksheetFreezeTimeRangeValidator(),
        separationFreezeTimeRangeValidator()
      ]
    });

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    const numericFields = ['minTemp', 'maxTemp', 'minWsFreezeTime', 'maxWsFreezeTime', 'minSepFreezeTime', 'maxSepFreezeTime'];
    numericFields.forEach(field => {
      this.form.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.form.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        });
    });

    if (this.mode === 'edit') {
      this.form.get('thawMethod')?.disable();
    }

    this.errorMessage = null;
    this.isSubmitting = false;
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.cdr.markForCheck();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isAfter(this.minDate)) {
      this.terminationMinDate = effDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get lastModifiedDisplay(): string {
    if (!this.data?.lastModifiedDate) return '';
    const pst = moment.utc(this.data.lastModifiedDate).utcOffset(-8);
    if (!pst.isValid()) return '';
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(pst.date()).padStart(2, '0');
    const month = MONTHS[pst.month()];
    const year = pst.year();
    const hours = String(pst.hours()).padStart(2, '0');
    const minutes = String(pst.minutes()).padStart(2, '0');
    return `Last Modified: ${day}-${month}-${year}, ${hours}:${minutes} PST`;
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  getTimeFormatError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('invalidTimeFormat')) {
      return control.getError('invalidTimeFormat').message;
    }
    return '';
  }

  getTemperatureRangeError(): string {
    if (this.form.hasError('tempRangeInvalid')) {
      return 'Minimum temperature must be less than or equal to maximum temperature';
    }
    return '';
  }

  getWorksheetTimeRangeError(): string {
    if (this.form.hasError('worksheetTimeRangeInvalid')) {
      return 'Minimum worksheet freeze time must be less than or equal to maximum';
    }
    return '';
  }

  getSeparationTimeRangeError(): string {
    if (this.form.hasError('separationTimeRangeInvalid')) {
      return 'Minimum separation freeze time must be less than or equal to maximum';
    }
    return '';
  }

  onSave(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.save.emit(this.getFormValue());
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.saveAndCreateAnother.emit(this.getFormValue());
    }
  }

  private validateForm(): boolean {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      return false;
    }

    if (this.hasDateValidationError()) {
      this.form.get('termDate')?.markAsTouched();
      return false;
    }

    return true;
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') ||
      this.form.hasError('tempRangeInvalid') ||
      this.form.hasError('worksheetTimeRangeInvalid') ||
      this.form.hasError('separationTimeRangeInvalid') ||
      !!this.getEffectiveDateError() ||
      !!this.getTerminationDateError();
  }

  onCancel(): void {
    this.close.emit();
  }

  formatDecimalField(controlName: string): void {
    const control = this.form.get(controlName);
    const value = control?.value;
    if (value != null && value !== '') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        control?.setValue(num.toFixed(2), { emitEvent: false });
      }
    }
    this.cdr.markForCheck();
  }

  onClearAll(): void {
    this.form.patchValue({
      minTemp: null,
      maxTemp: null,
      minWsFreezeTime: null,
      maxWsFreezeTime: null,
      minSepFreezeTime: null,
      maxSepFreezeTime: null,
      termDate: null,
    });
    this.form.markAsDirty();
  }

  onNumericKeyDown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(event.key) || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }
    if (event.key === '.') {
      const input = event.target as HTMLInputElement;
      if (input.value.includes('.')) {
        event.preventDefault();
      }
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  private getFormValue(): CryoMethodFormValue {
    const raw = this.form.getRawValue();
    return {
      thawMethod: raw.thawMethod,
      methodDesc: raw.methodDesc,
      minTemp: raw.minTemp != null && raw.minTemp !== '' ? parseFloat(raw.minTemp) : null,
      maxTemp: raw.maxTemp != null && raw.maxTemp !== '' ? parseFloat(raw.maxTemp) : null,
      minWsFreezeTime: raw.minWsFreezeTime != null && raw.minWsFreezeTime !== '' ? parseFloat(raw.minWsFreezeTime) : null,
      maxWsFreezeTime: raw.maxWsFreezeTime != null && raw.maxWsFreezeTime !== '' ? parseFloat(raw.maxWsFreezeTime) : null,
      minSepFreezeTime: raw.minSepFreezeTime != null && raw.minSepFreezeTime !== '' ? parseFloat(raw.minSepFreezeTime) : null,
      maxSepFreezeTime: raw.maxSepFreezeTime != null && raw.maxSepFreezeTime !== '' ? parseFloat(raw.maxSepFreezeTime) : null,
      effDate: raw.effDate,
      termDate: raw.termDate,
    };
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;
      return this.form.valid && !this.hasDateValidationError();
    }
    return this.form.valid && !this.hasDateValidationError();
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Cryo Method' : 'Edit Cryo Method';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get showCreateAnotherButton(): boolean {
    return this.mode === 'add';
  }
}
