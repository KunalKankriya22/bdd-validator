import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
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
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  SPMasterCodeDto,
  CreateSPMasterCodeRequest,
  UpdateSPMasterCodeRequest,
} from '../models/special-processing-master-codes.model';

@Component({
  selector: 'app-add-edit-special-processing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-special-processing.html',
  styleUrls: ['./add-edit-special-processing.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditSpecialProcessingComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: SPMasterCodeDto | null = null;
  @Input() codeType = '';
  @Input() codeTypeDescription = '';

  @Output() save = new EventEmitter<CreateSPMasterCodeRequest | UpdateSPMasterCodeRequest>();
  @Output() saveAndCreateAnother = new EventEmitter<CreateSPMasterCodeRequest>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  readonly CODE_MAX_LENGTH = 5;
  readonly DESCRIPTION_MAX_LENGTH = 50;

  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

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

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.initializeForm();
        this.setupDateValidationListeners();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get codeRemainingChars(): number {
    return this.CODE_MAX_LENGTH - (this.form?.get('code')?.value?.length || 0);
  }

  get descriptionRemainingChars(): number {
    return this.DESCRIPTION_MAX_LENGTH - (this.form?.get('codeDesc')?.value?.length || 0);
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate)
        ? effectiveMoment
        : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private initializeForm(): void {
    if (this.mode === 'add') {
      this.form = this.fb.group(
        {
          code: ['', [Validators.required, Validators.maxLength(this.CODE_MAX_LENGTH)]],
          codeDesc: ['', [Validators.required, Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)]],
          effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
          termDate: [null],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
        },
      );
    } else {
      this.form = this.fb.group(
        {
          code: [{ value: this.data?.code || '', disabled: true }],
          codeDesc: [this.data?.codeDesc || '', [Validators.required, Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)]],
          effDate: [this.data?.effDate ? moment(this.data.effDate) : null, [Validators.required]],
          termDate: [this.data?.termDate ? moment(this.data.termDate) : null],
        },
        {
          validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
        },
      );
    }

    this.errorMessage = null;
    this.isSubmitting = false;
    this.lastChangedDateField = null;
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });

    this.form
      .get('effDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form
      .get('termDate')
      ?.valueChanges.pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate'),
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effDate')?.markAsTouched();
    this.form.get('effDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit',
    );
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors,
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors,
    );
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  get isFormInvalid(): boolean {
    if (!this.form) return true;

    if (this.mode === 'edit') {
      if (!this.form.dirty) return true;

      const codeDescControl = this.form.get('codeDesc');
      if (codeDescControl?.invalid) return true;

      const termControl = this.form.get('termDate');
      if (termControl?.dirty && termControl?.invalid) return true;

      if (this.form.hasError('dateRangeInvalid')) return true;

      return false;
    }

    return this.form.invalid;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.isFormInvalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateSPMasterCodeRequest = {
        codeType: this.codeType,
        code: formValue.code,
        codeDesc: formValue.codeDesc,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
      };
      this.save.emit(dto);
    } else {
      const dto: UpdateSPMasterCodeRequest = {
        codeDesc: formValue.codeDesc,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
      };
      this.save.emit(dto);
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.isSubmitting) return;

    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.form.getRawValue();
    const dto: CreateSPMasterCodeRequest = {
      codeType: this.codeType,
      code: formValue.code,
      codeDesc: formValue.codeDesc,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || null,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
    };
    this.saveAndCreateAnother.emit(dto);
  }

  onClearAll(): void {
    if (this.mode === 'edit') {
      this.form.patchValue({
        codeDesc: '',
        termDate: null,
      });
      this.form.get('codeDesc')?.markAsDirty();
      this.form.get('termDate')?.markAsDirty();
      this.lastChangedDateField = null;
      this.errorMessage = null;
      this.cdr.markForCheck();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  resetForm(): void {
    this.form.reset({
      code: '',
      codeDesc: '',
      effDate: null,
      termDate: null,
    });
    this.isSubmitting = false;
    this.errorMessage = null;
    this.lastChangedDateField = null;

    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsUntouched();
      this.form.get(key)?.markAsPristine();
    });

    this.cdr.markForCheck();
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }
}
