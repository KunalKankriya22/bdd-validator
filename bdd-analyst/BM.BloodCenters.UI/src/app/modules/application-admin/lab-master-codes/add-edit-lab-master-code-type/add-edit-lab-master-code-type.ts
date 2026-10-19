import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';


export interface MasterCodeDialogData {
  mode: 'add' | 'edit';
  code?: string;
  description?: string;
  effectiveDate?: Date;
  termDate?: Date | null;
  modificationDate?: Date;
}

export interface CodeDialogResult {
  code: string;
  description: string;
  effectiveDate: Date;
  termDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-lab-master-code-type',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-lab-master-code-type.html',
  styleUrls: ['./add-edit-lab-master-code-type.scss']
})
export class AddEditLabMasterCodeType implements OnInit, OnDestroy {
  mode: 'add' | 'edit' = 'add';
  data: MasterCodeDialogData | null = null;

  dialogTitle: string = '';
  isSaving = false;
  form!: FormGroup;
  modificationDate: Date | null = null;

  // Character limits
  readonly CODE_TYPE_MAX_LENGTH = 5;
  readonly DESCRIPTION_MAX_LENGTH = 500;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  saveRequest = new Subject<CodeDialogResult>();

  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private headerService = inject(HeaderService);
  private dialogRef = inject(MatDialogRef<AddEditLabMasterCodeType>);
  private dialogData = inject<MasterCodeDialogData>(MAT_DIALOG_DATA);

  // Date restrictions — computed after HeaderService is available
  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  ngOnInit(): void {
    this.mode = this.dialogData?.mode ?? 'add';
    this.data = this.dialogData ?? null;
    this.dialogTitle = this.mode === 'add' ? 'Add New Code Type' : 'Edit Code Type';
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Initialize form - date field validators will be added by setupAddModeValidators/setupEditModeValidators
    this.form = this.fb.group({
      codeType: [
        { value: '', disabled: this.mode === 'edit' },
        [
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(this.CODE_TYPE_MAX_LENGTH),
          Validators.pattern(/^[a-zA-Z0-9]+$/)
        ]
      ],
      description: [
        '',
        [
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(this.DESCRIPTION_MAX_LENGTH)
        ]
      ],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
    });

    // Setup mode-specific validators BEFORE populating form
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Populate form in edit mode AFTER validators are set
    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        codeType: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });
      this.modificationDate = this.data.modificationDate || null;
    }

    this.form.markAsPristine();
    this.setupDateValidationListeners();
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.mode === 'add') {
      this.form.markAllAsTouched();
      DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
      if (this.form.invalid) {
        return;
      }
    }

    const formValue = this.form.getRawValue();

    const result: CodeDialogResult = {
      code: formValue.codeType.trim(),
      description: formValue.description.trim(),
      effectiveDate: formValue.effectiveDate ?
        (DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) as any) : new Date(),
      termDate: formValue.terminationDate ?
        (DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) as any) : null
    };

    this.isSaving = true;
    this.saveRequest.next(result);
  }

  get codeTypeControl() {
    return this.form.get('codeType');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  // Error message methods
  getCodeTypeError(): string {
    const control = this.codeTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Code Type is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return `Code cannot exceed ${this.CODE_TYPE_MAX_LENGTH} characters`;
    }
    if (control.hasError('pattern')) {
      return 'Code Type must be alphanumeric (special characters are not allowed)';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Description is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return `Description cannot exceed ${this.DESCRIPTION_MAX_LENGTH} characters`;
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

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  // Prevent spaces in code type field and convert to uppercase
  onCodeTypeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.replace(/\s/g, '').trim().toUpperCase();

    if (value !== newValue) {
      this.form.patchValue({ codeType: newValue }, { emitEvent: false });
      input.value = newValue;
    }
  }

  getCodeTypeRemainingCharacters(): string {
    const length = this.codeTypeControl?.value?.length || 0;
    const remaining = this.CODE_TYPE_MAX_LENGTH - length;
    return `Characters remaining: ${remaining}/${this.CODE_TYPE_MAX_LENGTH}`;
  }

  getDescriptionRemainingCharacters(): string {
    const length = this.descriptionControl?.value?.length || 0;
    const remaining = this.DESCRIPTION_MAX_LENGTH - length;
    return `Characters Remaining: ${remaining}/${this.DESCRIPTION_MAX_LENGTH}`;
  }

  // Format date for display (DD-MMM-YYYY)
  formatDate(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY');
  }

  isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;
      const hasVisibleErrors =
        this.getCodeTypeError() !== '' ||
        this.getDescriptionError() !== '' ||
        this.getEffectiveDateError() !== '' ||
        this.getTerminationDateError() !== '';
      return !hasVisibleErrors;
    }
    return !this.form.invalid;
  }
}
