import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { DD_MON_YYYY_FORMATS } from '../../../../shared/date/date-formats';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  DistributionMasterCodesService,
  CreateMasterCodeTypeRequest,
  UpdateMasterCodeTypeRequest
} from '../services/distribution-master-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

export interface DistributionMasterCodeDialogData {
  mode: 'add' | 'edit';
  codeType?: string;
  description?: string;
  effDate?: Date;
  termDate?: Date | null;
  lastModifiedDate?: Date;
  numericalValue?: number;
  changeControlFlag?: string;
}

export interface DistributionCodeDialogResult {
  codeType: string;
  description: string;
  effDate: string;
  terminationDate?: string | null;
  changeControlFlag?: string;
  numericalValue?: number;
  codeBehavior?: string;
}

@Component({
  selector: 'app-add-update-distribution-master-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-update-distribution-master-codes.html',
  styleUrls: ['./add-update-distribution-master-codes.scss']
})
export class AddUpdateDistributionMasterCodes implements OnInit, OnDestroy {
  mode: 'add' | 'edit' = 'add';
  data: DistributionMasterCodeDialogData | null = null;

  saveSuccess = new Subject<void>();

  panelTitle: string = '';
  isSaving = false;
  form!: FormGroup;
  modificationDate: Date | null = null;

  minDate = DateFieldValidationUtility.getMinDate();
  terminationMinDate = DateFieldValidationUtility.getMinDate();

  editModeValues = {
    effectiveDate: ''
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;

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

  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private distributionMasterCodesService = inject(DistributionMasterCodesService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<AddUpdateDistributionMasterCodes>);
  private dialogData: DistributionMasterCodeDialogData = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.mode = this.dialogData.mode;
    this.data = this.dialogData;
    this.setupPanel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Code Type' : 'Edit Code Type';
    this.isSaving = false;
    this.initializeForm();
  }

  private initializeForm(): void {
    if (this.mode === 'edit') {
      this.form = this.fb.group({
        codeType: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(5), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
        description: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(50)]],
        effectiveDate: [null, Validators.required],
        terminationDate: [null],
        numericalValue: [0],
        changeControlFlag: ['']
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
      // Setup edit mode validators (allows past dates for effective date)
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      this.form = this.fb.group({
        codeType: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(5), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
        description: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(50)]],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null],
        numericalValue: [0],
        changeControlFlag: ['']
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
      // Setup add mode validators (effective date cannot be in the past)
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    // Populate fields if editing
    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        codeType: this.data.codeType || '',
        description: this.data.description || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null,
        numericalValue: this.data.numericalValue || 0,
        changeControlFlag: this.data.changeControlFlag || ''
      }, { emitEvent: false });

      this.modificationDate = this.data.lastModifiedDate ? new Date(this.data.lastModifiedDate) : new Date();

      this.editModeValues.effectiveDate = this.formatDateForDisplay(this.data.effDate);

      this.terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

      this.form.get('effectiveDate')?.disable({ emitEvent: false });

      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
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

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    const result: DistributionCodeDialogResult = {
      codeType: formValue.codeType,
      description: formValue.description,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      changeControlFlag: formValue.changeControlFlag || 'D',
      numericalValue: formValue.numericalValue,
      codeBehavior: ''
    };

    const chapterId = this.headerService.getCurrentChapterId();

    if (this.mode === 'add') {
      const newMasterCodeType: CreateMasterCodeTypeRequest = {
        codeType: result.codeType,
        description: result.description,
        effectiveDate: result.effDate,
        terminationDate: result.terminationDate || null,
        changeControlFlag: result.changeControlFlag || 'D'
      };

      this.distributionMasterCodesService.createMasterCodeType(chapterId, newMasterCodeType).subscribe({
        next: () => {
          this.snackBar.open(`New Code Type ${result.codeType} has been successfully added.`, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.isSaving = false;
          this.saveSuccess.next();
          this.dialogRef.close();
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      const updateData: UpdateMasterCodeTypeRequest = {
        description: result.description,
        effectiveDate: result.effDate,
        terminationDate: result.terminationDate || null,
        numericalValue: result.numericalValue || 0,
        codeBehavior: result.codeBehavior || '',
        modificationDate: new Date()
      };

      this.distributionMasterCodesService.updateMasterCodeType(chapterId, this.data?.codeType || '', updateData).subscribe({
        next: () => {
          this.snackBar.open(`Code Type ${this.data?.codeType} has been successfully updated.`, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.isSaving = false;
          this.saveSuccess.next();
          this.dialogRef.close();
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
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

  convertToUppercase(controlName: string): void {
    const control = this.form.get(controlName);
    if (control?.value) {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
    }
  }

  getCodeTypeError(): string {
    const control = this.form.get('codeType');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Code Type is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return 'Code Type cannot exceed 5 characters';
    }
    if (control.hasError('pattern')) {
      return 'Code Type must be alphanumeric (special characters are not allowed)';
    }

    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Description is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return 'Description cannot exceed 50 characters';
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

  get codeTypeRemainingChars(): number {
    const codeType = this.form.get('codeType')?.value || '';
    return 5 - codeType.length;
  }

  get descriptionRemainingChars(): number {
    const description = this.form.get('description')?.value || '';
    return 50 - description.length;
  }

  // Format date to DD-MMM-YYYY
  formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY');
  }
}
