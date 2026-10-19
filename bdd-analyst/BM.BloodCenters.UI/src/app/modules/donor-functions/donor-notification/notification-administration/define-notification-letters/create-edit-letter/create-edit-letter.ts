import { Component, ElementRef, Inject, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

import { NotificationLettersService } from '../services/notification-letters.service';
import {
  LetterView,
  LetterCodeOption,
  TemplateVariable,
  CreateLetterDto,
  ReviseLetterDto
} from '../models/notification-letter.model';
import {
  letterCodeFormatValidator,
  titleLengthValidator,
  letterMessageLengthValidator,
  getValidationErrorMessage
} from '../validators/notification-letter.validator';

/**
 * Dialog data interface for CreateEditLetter
 */
export interface CreateEditLetterData {
  mode: 'add' | 'edit';
  letter?: LetterView;
  letterCodes?: LetterCodeOption[];
}

/**
 * Dialog component for creating new letters and revising existing ones
 * Dual-mode: Add (create new) or Edit (create new version)
 */
@Component({
  selector: 'app-create-edit-letter',
  standalone: true,
  templateUrl: './create-edit-letter.html',
  styleUrls: ['./create-edit-letter.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class CreateEditLetter implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @ViewChild('effDateInput') effDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput') termDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('currentTermDateInput') currentTermDateInput!: ElementRef<HTMLInputElement>;

  // Form
  letterForm!: FormGroup;

  // Mode
  mode: 'add' | 'edit' = 'add';
  title: string = '';

  // Options
  letterCodeOptions: LetterCodeOption[] = [];

  // Loading state
  isLoading = false;
  isSaving = false;

  // Min date for datepickers
  minDate!: moment.Moment;
  minTerminationDate: moment.Moment | null = null;

  // Date error matchers
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  currentTermDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getCurrentTerminationDateError());

  // Current version details (edit mode only)
  currentLetterCode = '';
  currentTitle = '';
  currentEffectiveDate = '';
  currentTerminationDate = '';
  currentVersionNo = 0;

  // New version details
  newVersionNo = 1;
  generatedFileName = '';

  // Template variables
  templateVariables: TemplateVariable[] = [];

  // Original current version termination date for edit mode validation
  private originalCurrentTerminationDate: string | null = null;

  // Track which date field was last changed for cross-field validation
  private lastChangedDateField: 'effective' | 'termination' | 'currentTermination' | null = null;

  // Cached error messages to prevent ExpressionChangedAfterItHasBeenCheckedError
  effectiveDateErrorMessage = '';
  terminationDateErrorMessage = '';
  currentTerminationDateErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditLetter>,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private service: NotificationLettersService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: CreateEditLetterData
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.mode = data?.mode || 'add';
    this.title = this.mode === 'add' ? 'New Letter' : 'Revise Letter';
    this.letterCodeOptions = data?.letterCodes || [];
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadTemplateVariables();

    if (this.mode === 'edit' && this.data.letter) {
      // Fetch full letter details including letterMessage from backend
      this.loadFullLetterDetails();
    }

    // Initialize error messages
    setTimeout(() => {
      this.updateDateErrorMessages();
      this.cdr.detectChanges();
    });
  }


  /**
   * Load available template variables
   */
  private loadTemplateVariables(): void {
    this.service
      .getTemplateVariables()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (variables) => {
          this.templateVariables = variables;
        },
        error: (err) => {
          console.error('Failed to load template variables:', err);
          this.templateVariables = [];
        }
      });
  }

  /**
   * Load full letter details for edit mode (including letterMessage)
   */
  private loadFullLetterDetails(): void {
    if (!this.data.letter) return;

    const letter = this.data.letter;
    const letterCode = letter.letterCode;

    if (!letterCode) {
      console.error('Missing letterCode for fetching details');
      this.populateEditMode(); // Fallback to existing data
      return;
    }

    this.isLoading = true;
    const versionNo = letter.currentVersion?.versionNo;

    this.service
      .getLetterDetail(letterCode, 'N', versionNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullLetter) => {
          // Update the data with full details
          this.data.letter = fullLetter;
          this.populateEditMode();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load full letter details:', err);
          // Fallback to existing data
          this.populateEditMode();
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form
   */
  private initializeForm(): void {
    // Letter code validators: in add mode validate format (text input)
    const letterCodeValidators = this.mode === 'add'
      ? [Validators.required, letterCodeFormatValidator()]
      : [Validators.required];

    this.letterForm = this.fb.group({
      letterCode: [
        { value: '', disabled: this.mode === 'edit' },
        letterCodeValidators
      ],
      title: [
        '',
        [Validators.required, titleLengthValidator(100)]
      ],
      currentTerminationDate: [null],
      effectiveDate: [null],
      terminationDate: [null],
      versionNo: [
        { value: this.newVersionNo, disabled: true }
      ],
      fileName: [
        { value: '', disabled: true }
      ],
      letterMessage: [
        '',
        [
          Validators.required,
          letterMessageLengthValidator(30000)
        ]
      ]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    // Apply shared date validators (effectiveDate: required + notPast + validDate + dateFormat,
    // terminationDate: notPast + validDate + dateFormat)
    DateFieldValidationUtility.setupAddModeValidators(this.letterForm, this.headerService.chapterTimeZone());

    // Subscribe to effective date changes to update termination date validation
    this.letterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((effectiveDate) => {
        // Don't set lastChangedDateField here - it's set in onEffectiveDateInput handler
        // This prevents valueChanges from overwriting the user's actual input field

        // Update minimum date for termination date picker
        if (effectiveDate) {
          this.minTerminationDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
        } else {
          this.minTerminationDate = null;
        }

        // In edit mode, auto-populate current version's termination date only if it's empty
        if (this.mode === 'edit' && effectiveDate) {
          const currentTermControl = this.letterForm.get('currentTerminationDate');
          if (currentTermControl && !currentTermControl.value) {
            const effectiveMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
            if (effectiveMoment.isValid()) {
              currentTermControl.setValue(effectiveMoment, { emitEvent: false });
              currentTermControl.updateValueAndValidity({ emitEvent: false });
            }
          }
        }

        // Re-validate termination date when effective date changes
        this.letterForm.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });

        // Update error messages
        setTimeout(() => {
          this.updateDateErrorMessages();
          this.cdr.detectChanges();
        });
      });

    // Initialize minTerminationDate if effectiveDate already has a value
    const initialEffectiveDate = this.letterForm.get('effectiveDate')?.value;
    if (initialEffectiveDate) {
      this.minTerminationDate = moment.isMoment(initialEffectiveDate) ? initialEffectiveDate : moment(initialEffectiveDate);
    }

    // Subscribe to termination date changes to update form-level validation
    this.letterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Don't set lastChangedDateField here - it's set in onTerminationDateInput handler
        // This prevents valueChanges from overwriting the user's actual input field

        // Update error messages
        setTimeout(() => {
          this.updateDateErrorMessages();
          this.cdr.detectChanges();
        });
      });

    // Subscribe to current termination date changes
    this.letterForm.get('currentTerminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.updateDateErrorMessages();
          this.cdr.detectChanges();
        });
      });

    // Subscribe to letter code changes to generate file name
    this.letterForm.get('letterCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        this.updateFileName(code);
      });

    // Update file name on title change (optional, for more descriptive names)
    this.letterForm.get('title')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFileName(this.letterForm.get('letterCode')?.value);
      });
  }

  /**
   * Populate form in edit mode
   */
  private populateEditMode(): void {
    const letter = this.data.letter!;
    const currentVersion = letter.currentVersion!;

    // Store current version details for display
    this.currentLetterCode = letter.letterCode;
    this.currentTitle = letter.title;
    this.currentEffectiveDate = currentVersion.effectiveDate;
    this.currentTerminationDate = currentVersion.terminationDate || '—';
    this.currentVersionNo = currentVersion.versionNo;

    // Store original termination date for editModeTerminationDateValidator
    this.originalCurrentTerminationDate = currentVersion.terminationDate
      ? moment(currentVersion.terminationDate, 'DD-MMM-YYYY', true).isValid()
        ? moment(currentVersion.terminationDate, 'DD-MMM-YYYY').format('YYYY-MM-DD')
        : moment(currentVersion.terminationDate).format('YYYY-MM-DD')
      : null;

    // Calculate new version number
    this.newVersionNo = this.currentVersionNo + 1;

    // Clean up letter message - remove if it's just a list of template variables
    const originalMessage = currentVersion.letterMessage || '';
    const cleanedMessage = this.cleanLetterMessage(originalMessage);

    const parsedCurrentTermDate = currentVersion.terminationDate
      ? this.parseDate(currentVersion.terminationDate)
      : null;

    // Pre-fill form with current values (for editing)
    this.letterForm.patchValue({
      letterCode: letter.letterCode,
      title: letter.title,
      currentTerminationDate: parsedCurrentTermDate,
      effectiveDate: null,
      terminationDate: null,
      versionNo: this.newVersionNo,
      letterMessage: cleanedMessage
    });

    // Apply editModeTerminationDateValidator to current version termination date
    const currentTermControl = this.letterForm.get('currentTerminationDate');
    if (currentTermControl) {
      currentTermControl.addValidators(
        DateFieldValidationUtility.editModeTerminationDateValidator(
          this.originalCurrentTerminationDate,
          this.headerService.chapterTimeZone()
        )
      );
      currentTermControl.updateValueAndValidity({ emitEvent: false });
      currentTermControl.markAsUntouched();
    }

    // Re-validate effectiveDate since it's editable in edit mode
    const effectiveDateControl = this.letterForm.get('effectiveDate');
    if (effectiveDateControl) {
      effectiveDateControl.updateValueAndValidity();
      effectiveDateControl.markAsUntouched();
    }

    // Generate file name
    this.updateFileName(letter.letterCode);
  }

  /**
   * Clean letter message - detect if it's just template variables and clear it
   */
  private cleanLetterMessage(message: string | null | undefined): string {
    if (!message || !message.trim()) {
      return '';
    }

    // Remove all whitespace and newlines for analysis
    const withoutSpaces = message.replace(/\s+/g, '');

    // Check if message contains ONLY template variables (&&VAR&& pattern)
    // Pattern: one or more occurrences of &&VARIABLE_NAME&&
    const onlyVariablesPattern = /^(&&[A-Za-z0-9_]+&&)+$/;

    // If message is ONLY concatenated variables with no actual content text, clear it
    if (onlyVariablesPattern.test(withoutSpaces)) {
      return '';
    }

    // Check if message looks like a list of all available variables (more than 10 unique variables)
    const variableMatches = message.match(/&&[A-Za-z0-9_]+&&/g);
    if (variableMatches && variableMatches.length > 10) {
      // Calculate the percentage of the message that is variables vs text
      const variableLength = variableMatches.join('').length;
      const totalLength = message.replace(/\s+/g, '').length;
      const variablePercentage = (variableLength / totalLength) * 100;

      // If more than 95% of content is just variables, it's likely garbage data
      if (variablePercentage > 95) {
        return '';
      }
    }

    return message.trim();
  }

  /**
   * Parse date string (DD-MMM-YYYY) to Date object
   */
  private parseDate(dateString: string): Date | null {
    const m = moment(dateString, 'DD-MMM-YYYY', true);
    return m.isValid() ? m.toDate() : null;
  }

  /**
   * Update generated file name
   */
  private updateFileName(letterCode: string): void {
    if (!letterCode) {
      this.generatedFileName = '';
      this.letterForm.patchValue({ fileName: '' }, { emitEvent: false });
      return;
    }

    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const fileName = `${letterCode}_v${this.newVersionNo}_${timestamp}.html`;
    this.generatedFileName = fileName;
    this.letterForm.patchValue({ fileName }, { emitEvent: false });
  }

  /**
   * Convert letter code input to uppercase as user types
   */
  onLetterCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const uppercaseValue = input.value.toUpperCase();

    // Only update if the value actually changed to avoid unnecessary events
    if (input.value !== uppercaseValue) {
      const cursorPosition = input.selectionStart;
      this.letterForm.patchValue({ letterCode: uppercaseValue }, { emitEvent: false });

      // Restore cursor position after value change
      requestAnimationFrame(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      });
    }
  }

  /**
   * Trim whitespace from letter code on blur
   * Ensures API receives clean values without leading/trailing spaces
   */
  trimLetterCode(): void {
    this.trimField('letterCode');
  }

  /**
   * Generic method to trim whitespace from any form field on blur
   * Ensures API receives clean values without leading/trailing spaces
   * @param fieldName - The name of the form control to trim
   */
  trimField(fieldName: string): void {
    const control = this.letterForm.get(fieldName);
    if (control && typeof control.value === 'string') {
      const trimmedValue = control.value.trim();
      if (control.value !== trimmedValue) {
        control.setValue(trimmedValue);
      }
    }
  }

  /**
   * Save letter (create new or create new version)
   */
  onSave(): void {
    if (this.letterForm.invalid) {
      this.letterForm.markAllAsTouched();
      this.updateDateErrorMessages();
      this.cdr.detectChanges();
      this.showError('Please correct the errors in the form');
      return;
    }

    this.isSaving = true;

    if (this.mode === 'add') {
      this.createNewLetter();
    } else {
      this.createNewVersion();
    }
  }

  /**
   * Create a new letter
   */
  private createNewLetter(): void {
    const formValue = this.letterForm.getRawValue();

    const fileName = formValue.fileName || `${formValue.letterCode}.html`;

    const dto: CreateLetterDto = {
      letterCode: formValue.letterCode,
      letterTitle: formValue.title,
      letterContent: formValue.letterMessage,
      documentType: 'N', // REQUIRED: Notification letter type
      effectiveDate: this.formatDateForApi(formValue.effectiveDate),
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : undefined,
      documentName: fileName,
      datafileName: fileName,
      programId: 'DONOR'
    };

    this.service
      .createLetter(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          // Don't show snackbar here - parent component will show it
          this.dialogRef.close({ success: true, data: result });
        },
        error: (err) => {
          this.isSaving = false;
          this.showError(err.message || 'Failed to create letter');
        }
      });
  }

  /**
   * Create a new version of existing letter
   */
  private createNewVersion(): void {
    const formValue = this.letterForm.getRawValue();
    const letter = this.data.letter!;
    const currentVersion = letter.currentVersion!;

    const dto: ReviseLetterDto = {
      letterId: currentVersion.letterId,
      letterTitle: formValue.title,
      effectiveDate: this.formatDateForApi(formValue.effectiveDate),
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : undefined,
      currentTerminationDate: formValue.currentTerminationDate
        ? this.formatDateForApi(formValue.currentTerminationDate)
        : undefined,
      letterContent: formValue.letterMessage,
      documentName: formValue.fileName,
      datafileName: formValue.fileName,
      programId: 'DEFLETTERS'
    };

    this.service
      .reviseLetter(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          // Don't show snackbar here - parent component will show it
          this.dialogRef.close({ success: true, data: result });
        },
        error: (err) => {
          this.isSaving = false;
          this.showError(err.message || 'Failed to revise letter');
        }
      });
  }

  /**
   * Format date for display (DD-MMM-YYYY with uppercase month)
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';
    // Format and convert month to uppercase to match Current Version display
    return m.format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date | string): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  /**
   * Update cached error messages for both date fields
   */
  private updateDateErrorMessages(): void {
    const effError = this.calculateEffectiveDateError();
    const termError = this.calculateTerminationDateError();
    const currentTermError = this.calculateCurrentTerminationDateError();

    if (this.effectiveDateErrorMessage !== effError) {
      this.effectiveDateErrorMessage = effError;
    }
    if (this.terminationDateErrorMessage !== termError) {
      this.terminationDateErrorMessage = termError;
    }
    if (this.currentTerminationDateErrorMessage !== currentTermError) {
      this.currentTerminationDateErrorMessage = currentTermError;
    }
  }

  /**
   * Calculate effective date error message using shared utility
   */
  private calculateEffectiveDateError(): string {
    const control = this.letterForm.get('effectiveDate');
    if (!control) return '';

    const sharedError = DateFieldValidationUtility.getEffectiveDateErrorMessage(
      control,
      this.lastChangedDateField === 'effective' ? this.letterForm.errors : null
    );
    if (sharedError) return sharedError;

    if (this.lastChangedDateField === 'effective') {
      return DateFieldValidationUtility.getStartDateCrossFieldError(
        control,
        'Effective Date',
        'Termination Date',
        this.letterForm.errors
      );
    }

    return '';
  }

  /**
   * Calculate termination date error message using shared utility
   */
  private calculateTerminationDateError(): string {
    const control = this.letterForm.get('terminationDate');
    if (!control) return '';

    const sharedError = DateFieldValidationUtility.getTerminationDateErrorMessage(
      control,
      this.lastChangedDateField === 'termination' ? this.letterForm.errors : null
    );
    if (sharedError) return sharedError;

    if (this.lastChangedDateField === 'termination') {
      return DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        this.letterForm.errors
      );
    }

    return '';
  }

  /**
   * Get effective date error message (public accessor for template)
   */
  getEffectiveDateError(): string {
    return this.effectiveDateErrorMessage;
  }

  /**
   * Get termination date error message (public accessor for template)
   */
  getTerminationDateError(): string {
    return this.terminationDateErrorMessage;
  }

  /**
   * Calculate current version termination date error (internal)
   */
  private calculateCurrentTerminationDateError(): string {
    const control = this.letterForm.get('currentTerminationDate');
    if (!control) return '';

    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be in the past';
    }

    if (control.hasError('invalidDate')) {
      return 'Invalid date format';
    }

    return '';
  }

  /**
   * Get current version termination date error (public accessor for template)
   */
  getCurrentTerminationDateError(): string {
    return this.currentTerminationDateErrorMessage;
  }

  /**
   * Handle current version termination date input (typing)
   */
  onCurrentTerminationDateInput(event: Event): void {
    this.lastChangedDateField = 'currentTermination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.letterForm.get('currentTerminationDate'),
      true
    );
  }

  /**
   * Handle current version termination date change (datepicker selection)
   */
  onCurrentTerminationDateChange(): void {
    this.lastChangedDateField = 'currentTermination';
  }

  /**
   * Handle effective date blur event (click away without entering value)
   */
  onEffectiveDateBlur(): void {
    const control = this.letterForm.get('effectiveDate');
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
      this.lastChangedDateField = 'effective';
      this.updateDateErrorMessages();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle effective date input event (typing)
   */
  onEffectiveDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.letterForm.get('effectiveDate')
    );
  }

  /**
   * Handle effective date change event (datepicker selection)
   */
  onEffectiveDateChange(): void {
    this.lastChangedDateField = 'effective';
  }

  /**
   * Handle effective date picker closed without selection
   */
  onEffectiveDatePickerClosed(): void {
    const control = this.letterForm.get('effectiveDate');
    if (control && !control.value) {
      control.markAsTouched();
      control.updateValueAndValidity();
      this.lastChangedDateField = 'effective';
      this.updateDateErrorMessages();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle termination date input event (typing)
   */
  onTerminationDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.letterForm.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  /**
   * Handle termination date change event (datepicker selection)
   */
  onTerminationDateChange(): void {
    this.lastChangedDateField = 'termination';
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const control = this.letterForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    return getValidationErrorMessage(control.errors);
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.letterForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // Error messages starting with "Error" should not auto-dismiss
    const config: any = {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    };

    // Only add duration if message does NOT start with "Error"
    if (!message.startsWith('Error')) {
      config.duration = 5000;
    }

    this.snackBar.open(message, 'DISMISS', config);
  }

  /**
   * TrackBy function for template variables
   */
  trackByPlaceholder(index: number, variable: TemplateVariable): string {
    return variable.placeholder;
  }

}
