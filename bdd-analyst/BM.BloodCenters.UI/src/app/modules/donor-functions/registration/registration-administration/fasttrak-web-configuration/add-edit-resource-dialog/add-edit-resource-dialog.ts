import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

export interface ResourceDialogData {
  mode: 'add' | 'edit';
  code: string;
  locationLink?: string;
  description?: string;
  effectiveDate?: string | null;
  terminationDate?: string | null;
}

export interface ResourceDialogResult {
  mode: 'add' | 'edit';
  code: string;
  locationLink: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
  currentCode?: string;
  currentLocationLink?: string;
  currentEffectiveDate?: string;
}

@Component({
  selector: 'app-add-edit-resource-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-resource-dialog.html',
  styleUrls: ['./add-edit-resource-dialog.scss']
})
export class AddEditResourceDialog implements OnInit, OnDestroy {
  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  form!: FormGroup;
  minDate: moment.Moment;
  minTerminationDate: moment.Moment;

  editModeValues = {
    effectiveDate: '',
    locationLink: ''
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private originalFormValue: ReturnType<FormGroup['getRawValue']> | null = null;
  private destroy$ = new Subject<void>();

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    public dialogRef: MatDialogRef<AddEditResourceDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ResourceDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Resource' : 'Edit Resource';

    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.minTerminationDate = this.minDate;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateChangeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      locationLink: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(240)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        locationLink: this.data.locationLink || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      this.editModeValues.effectiveDate = this.data.effectiveDate
        ? moment(this.data.effectiveDate).format('DD-MMM-YYYY').toUpperCase()
        : '';

      this.editModeValues.locationLink = this.data.locationLink || '';

      this.updateTerminationMinDate();
      this.form.markAsPristine();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      this.originalFormValue = this.form.getRawValue();
    } else {
      this.minTerminationDate = this.minDate;
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
    let effectiveMoment: moment.Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.minTerminationDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.minTerminationDate = this.minDate;
    }
  }

  private setupDateChangeListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    const effectiveDate = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '';
    const terminationDate = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate);

    const result: ResourceDialogResult = {
      mode: this.mode,
      code: this.data.code,
      locationLink: formValue.locationLink,
      description: formValue.description,
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    };

    if (this.mode === 'edit') {
      result.currentCode = this.data.code;
      result.currentLocationLink = this.data.locationLink;
      result.currentEffectiveDate = this.data.effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(moment(this.data.effectiveDate)) || ''
        : '';
    }

    this.dialogRef.close(result);
  }

  isFormValid(): boolean {
    if (!this.form.valid) return false;

    if (this.form.hasError('dateRangeInvalid')) return false;

    if (this.mode === 'edit') {
      return this.hasFormChanged();
    }

    return true;
  }

  private hasFormChanged(): boolean {
    if (!this.originalFormValue) return true;

    const currentValue = this.form.getRawValue();

    return (
      currentValue.locationLink !== this.originalFormValue.locationLink ||
      currentValue.description !== this.originalFormValue.description ||
      !this.areDatesEqual(currentValue.terminationDate, this.originalFormValue.terminationDate)
    );
  }

  private areDatesEqual(date1: moment.Moment | null, date2: moment.Moment | null): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;

    const moment1 = moment.isMoment(date1) ? date1 : moment(date1);
    const moment2 = moment.isMoment(date2) ? date2 : moment(date2);

    return moment1.isSame(moment2, 'day');
  }

  getLocationLinkError(): string {
    const control = this.form.get('locationLink');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Error 0080: Location Link is required';
    }

    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Error 0080: Description is required';
    }

    if (control.hasError('maxlength')) {
      return 'Description cannot exceed 240 characters';
    }

    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  getEffectiveDateDisplay(): string {
    const effDate = this.form.getRawValue().effectiveDate;
    if (!effDate) return '-';
    const m = moment.isMoment(effDate) ? effDate : moment(effDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
}
