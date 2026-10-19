import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  NotationCodeTableModel,
  NotationCodeFormValue,
  NOTATION_TYPE_LOOKUP,
  ValidTestLookup
} from '../models/notation-code.model';

import { notationCodeValidator } from '@shared/validators/input.validators';
import { NotationCodeApiService } from '../services/notation-code-api.service';

@Component({
  selector: 'app-add-edit-notation-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-notation-code.html',
  styleUrls: ['./add-edit-notation-code.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditNotationCodeComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly apiService = inject(NotationCodeApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: NotationCodeTableModel | null = null;

  @Output() save = new EventEmitter<NotationCodeFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<NotationCodeFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  notationTypeOptions = NOTATION_TYPE_LOOKUP;
  filteredNotationTypes = [...NOTATION_TYPE_LOOKUP];
  notationTypeSearchCtrl = new FormControl('');

  validTests: ValidTestLookup[] = [];
  filteredValidTests: ValidTestLookup[] = [];
  testIdSearchCtrl = new FormControl('');

  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = moment(this.minDate).startOf('day');

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.form?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

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
    this.setupModeValidators();
    this.setupConditionalValidation();
    this.setupDateValidationListeners();
    this.setupSearchListeners();
    this.loadValidTests();
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadValidTests());

    // Reset dirty state after all initialization (conditional validators may call
    // setValue which marks controls dirty before any user interaction).
    if (this.mode === 'edit') {
      this.form.markAsPristine();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getChapterMinDate(): Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  private initializeForm(): void {
    const formValue = this.mode === 'edit' && this.data ? this.data : null;

    this.form = this.fb.group({
      notationCode: [
        { value: formValue?.notationCodeValue || '', disabled: this.mode === 'edit' },
        [Validators.required, Validators.maxLength(10), notationCodeValidator()]
      ],
      notationType: [formValue?.notationType || '', [Validators.required]],
      testId: [formValue?.testId || '', [Validators.maxLength(10)]],
      shortDesc: [formValue?.shortDesc || '', [Validators.maxLength(30)]],
      notationDesc: [formValue?.notationDesc || '', [Validators.required, Validators.maxLength(240)]],
      effDate: [formValue?.effDate ? moment(formValue.effDate, 'DD-MMM-YYYY') : null, [Validators.required]],
      termDate: [formValue?.termDate ? moment(formValue.termDate, 'DD-MMM-YYYY') : null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      const termControl = this.form.get('termDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
        termControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private setupConditionalValidation(): void {
    this.form.get('notationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: string) => this.applyTypeConditionalValidation(type));

    // Apply immediately for initial value (handles edit mode and initial render)
    this.applyTypeConditionalValidation(this.form.get('notationType')?.value ?? '');
  }

  private applyTypeConditionalValidation(type: string): void {
    const testIdControl = this.form.get('testId');
    const shortDescControl = this.form.get('shortDesc');

    if (type === 'R') {
      testIdControl?.setValidators([Validators.required, Validators.maxLength(10)]);
      shortDescControl?.setValidators([Validators.required, Validators.maxLength(30)]);
    } else {
      testIdControl?.clearValidators();
      shortDescControl?.clearValidators();
      if (type === 'S') {
        testIdControl?.setValue(null);
        shortDescControl?.setValue(null);
      }
    }

    testIdControl?.updateValueAndValidity({ emitEvent: false });
    shortDescControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  private setupSearchListeners(): void {
    this.notationTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredNotationTypes = t
          ? this.notationTypeOptions.filter(o => o.value.toLowerCase().includes(t))
          : [...this.notationTypeOptions];
        this.cdr.markForCheck();
      });

    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredValidTests = t
          ? this.validTests.filter(v =>
              v.testId.toLowerCase().includes(t) ||
              (v.testDesc || '').toLowerCase().includes(t)
            )
          : [...this.validTests];
        this.cdr.markForCheck();
      });
  }

  private loadValidTests(): void {
    this.apiService.getValidTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.validTests = tests;
          this.filteredValidTests = [...tests];
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackbarService.showError('Failed to load valid tests');
          this.validTests = [];
          this.filteredValidTests = [];
        }
      });
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false, onlySelf: true });
        this.cdr.markForCheck();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate)) {
      this.terminationMinDate = moment.max(this.minDate, effDate);
    } else {
      this.terminationMinDate = this.minDate;
    }
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  get f() {
    return this.form.controls;
  }

  isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) {
      return false;
    }

    const termControl = this.form.get('termDate');
    const hasTermDateError = termControl?.touched && termControl?.hasError('terminationDatePast');
    const termHasFormatError = termControl &&
      (termControl.hasError('invalidDate') || termControl.hasError('invalidDateFormat') || termControl.hasError('matDatepickerParse'));
    const hasDateRangeError = this.form.hasError('dateRangeInvalid');

    if (hasTermDateError || termHasFormatError) {
      return false;
    }

    const otherControlsValid = Object.keys(this.form.controls)
      .filter(key => key !== 'termDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });

    return otherControlsValid && !hasDateRangeError;
  }

  onSave(): void {
    const termControl = this.form.get('termDate');
    const wasTermDateTouched = termControl?.touched || false;

    this.form.markAllAsTouched();

    if (termControl && !termControl.value) {
      termControl.setErrors(null);
    }
    if (!wasTermDateTouched && termControl) {
      termControl.markAsUntouched();
    }

    if (!this.isFormValid()) {
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const raw = this.form.getRawValue();
    const isStandard = raw.notationType === 'S';
    const formValue: NotationCodeFormValue = {
      notationCode: this.mode === 'add' ? raw.notationCode : this.data?.notationCodeValue || null,
      notationType: raw.notationType,
      testId: isStandard ? null : raw.testId || null,
      shortDesc: isStandard ? null : raw.shortDesc || null,
      notationDesc: raw.notationDesc,
      effDate: raw.effDate,
      termDate: raw.termDate
    };

    this.save.emit(formValue);
    this.isSubmitting = false;
  }

  onSaveAndCreateAnother(): void {
    const termControl = this.form.get('termDate');
    const wasTermDateTouched = termControl?.touched || false;

    this.form.markAllAsTouched();

    if (termControl && !termControl.value) {
      termControl.setErrors(null);
    }
    if (!wasTermDateTouched && termControl) {
      termControl.markAsUntouched();
    }

    if (!this.isFormValid()) {
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const raw = this.form.getRawValue();
    const isStandard = raw.notationType === 'S';
    const formValue: NotationCodeFormValue = {
      notationCode: raw.notationCode,
      notationType: raw.notationType,
      testId: isStandard ? null : raw.testId || null,
      shortDesc: isStandard ? null : raw.shortDesc || null,
      notationDesc: raw.notationDesc,
      effDate: raw.effDate,
      termDate: raw.termDate
    };

    this.saveAndCreateAnother.emit(formValue);
    this.isSubmitting = false;
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  onClose(): void {
    this.close.emit();
  }
}
