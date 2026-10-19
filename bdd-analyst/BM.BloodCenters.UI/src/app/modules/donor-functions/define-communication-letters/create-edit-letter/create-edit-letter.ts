import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';

import { CommunicationLettersService } from '../services/communication-letters.service';
import {
  CommLetterView,
  CommLetterCodeOption,
  CreateCommLetterDto,
  ReviseCommLetterDto,
} from '../models/communication-letter.model';

export interface CreateEditCommLetterData {
  mode: 'add' | 'edit';
  letter?: CommLetterView;
  letterCodes?: CommLetterCodeOption[];
}

@Component({
  selector: 'app-create-edit-comm-letter',
  standalone: true,
  templateUrl: './create-edit-letter.html',
  styleUrls: ['./create-edit-letter.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
})
export class CreateEditCommLetter implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  letterForm!: FormGroup;
  mode: 'add' | 'edit' = 'add';
  dialogTitle = 'New Letter';
  letterCodeOptions: CommLetterCodeOption[] = [];
  isSaving = false;
  get minDate() { return DateFieldValidationUtility.getMinDate(); }

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.letterForm?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  // Current version readonly values (edit mode)
  currentLetterCode = '';
  currentLetterTitle = '';
  currentEffectiveDate = '';
  currentVersionNo = 0;
  newVersionNo = 1;
  generatedFileName = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditCommLetter>,
    private service: CommunicationLettersService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: CreateEditCommLetterData,
  ) {
    this.mode = data?.mode || 'add';
    this.dialogTitle = this.mode === 'add' ? 'New Letter' : 'Revise Letter';
    this.letterCodeOptions = data?.letterCodes || [];
  }

  ngOnInit(): void {
    this.initForm();
    if (this.mode === 'edit' && this.data.letter) {
      this.populateEditMode();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.letterForm = this.fb.group({
      letterCode: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(10)]],
      letterTitle: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(100)]],
      oldTermDate: [null],
      effDate: [null],
      termDate: [null],
      versionNo: [{ value: this.newVersionNo, disabled: true }],
      fileName: [{ value: '', disabled: true }],
      letterContent: ['', [requiredTrimmedValidator(), trimmedMaxLengthValidator(4000)]],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    // setupAddModeValidators applies effDate-required + no-past constraints.
    // These are correct for both add and revise modes: a new revision always
    // needs a future effective date.
    DateFieldValidationUtility.setupAddModeValidators(this.letterForm, this.headerService.chapterTimeZone());

    this.letterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.letterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    this.letterForm.get('letterCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => this.updateFileName(code));
  }

  private populateEditMode(): void {
    const letter = this.data.letter!;

    this.currentLetterCode = letter.letterCode;
    this.currentLetterTitle = letter.letterTitle;
    this.currentEffectiveDate = this.formatDateForDisplay(letter.effDate);
    this.currentVersionNo = letter.versionNo;
    this.newVersionNo = this.currentVersionNo + 1;

    const oldTermDate = letter.termDate ? this.parseDate(letter.termDate) : null;

    this.letterForm.patchValue({
      letterCode: letter.letterCode,
      letterTitle: letter.letterTitle,
      oldTermDate,
      effDate: null,
      termDate: null,
      versionNo: this.newVersionNo,
      letterContent: letter.letterContent || '',
    });

    this.letterForm.get('letterCode')?.disable();
    this.letterForm.get('oldTermDate')?.disable();
    this.updateFileName(letter.letterCode);

    // Auto-sync oldTermDate to the new effDate so the current version terminates
    // exactly when the new version starts. Kept disabled so users cannot override it.
    this.letterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.letterForm.get('oldTermDate')?.setValue(val, { emitEvent: false });
      });
  }

  private parseDate(dateString: string | null | undefined): moment.Moment | null {
    if (!dateString) return null;
    const iso = moment(dateString);
    if (iso.isValid()) return iso;
    const strict = moment(dateString, 'DD-MMM-YYYY', true);
    return strict.isValid() ? strict : null;
  }

  private formatDateForDisplay(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY') : dateString;
  }

  get oldTermDateDisplay(): string {
    const val = this.letterForm?.get('oldTermDate')?.value;
    if (!val) return '—';
    const m = moment(val);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '—';
  }

  private updateFileName(letterCode: string): void {
    if (!letterCode) {
      this.generatedFileName = '';
      this.letterForm.patchValue({ fileName: '' }, { emitEvent: false });
      return;
    }
    const fileName = `${letterCode}.${this.newVersionNo.toString().padStart(2, '0')}.Doc`;
    this.generatedFileName = fileName;
    this.letterForm.patchValue({ fileName }, { emitEvent: false });
  }

  onSave(): void {
    this.letterForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.letterForm, 'termDate');

    if (this.letterForm.invalid) {
      return;
    }

    if (this.letterForm.hasError('dateRangeInvalid')) {
      this.letterForm.get('termDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.letterForm.getRawValue();

    if (this.mode === 'add') {
      const dto: CreateCommLetterDto = {
        letterCode: formValue.letterCode,
        letterTitle: formValue.letterTitle,
        documentType: 'N',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        letterContent: formValue.letterContent || null,
      };

      this.service
        .createLetter(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSaving = false;
            this.dialogRef.close({ success: true, data: result });
          },
          error: (err) => {
            this.isSaving = false;
            const msg = err?.error?.message || err?.error?.errors?.[0] || 'Failed to create letter';
            this.snackBar.open(msg, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          },
        });
    } else {
      const letter = this.data.letter!;
      const dto: ReviseCommLetterDto = {
        letterTitle: formValue.letterTitle,
        documentType: letter.documentType || 'N',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        oldTermDate: DateFieldValidationUtility.serializeDateForApi(formValue.oldTermDate),
        letterContent: formValue.letterContent || null,
      };

      this.service
        .reviseLetter(letter.letterId, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSaving = false;
            this.dialogRef.close({ success: true, data: result });
          },
          error: (err) => {
            this.isSaving = false;
            const msg = err?.error?.message || err?.error?.errors?.[0] || 'Failed to revise letter';
            this.snackBar.open(msg, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          },
        });
    }
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.letterForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.letterForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.letterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.letterForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.letterForm.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.letterForm.get('termDate'), false
    );
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  hasError(field: string): boolean {
    const ctrl = this.letterForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getError(field: string): string {
    const ctrl = this.letterForm.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required']) return 'This field is required';
    if (ctrl.errors['whitespaceOnly']) return 'This field cannot contain only spaces';
    if (ctrl.errors['trimmedMaxLength']) return `Maximum ${ctrl.errors['trimmedMaxLength'].maxLength} characters`;
    if (ctrl.errors['maxlength']) return `Maximum ${ctrl.errors['maxlength'].requiredLength} characters`;
    return '';
  }
}
