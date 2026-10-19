import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule, MomentDateAdapter, provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment, { Moment } from 'moment';

import { ResourceAvailabilityRulesService } from '../services/resource-availability-rules.service';
import {
  ResourceAvailabilityRuleModel,
  CreateResourceAvailabilityRuleDto,
  UpdateResourceAvailabilityRuleDto,
  WeekDayModel
} from '../models/resource-availability-rules.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';

// Custom DateAdapter to use chapter timezone for "today"
class ChapterTimezoneDateAdapter extends MomentDateAdapter {
  private chapterMinDate: Moment | null = null;

  setChapterMinDate(date: Moment): void {
    this.chapterMinDate = date;
  }

  override today(): Moment {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? this.chapterMinDate.clone() : moment();
  }

  override format(date: Moment, displayFormat: string): string {
    // Get the default formatted date from parent
    const formatted = super.format(date, displayFormat);
    // Convert month abbreviation to uppercase (e.g., "Apr" -> "APR")
    return formatted.toUpperCase();
  }

  override parse(value: any, parseFormat: string | string[]): Moment | null {
    if (!value) {
      return null;
    }

    // If already a Moment object, return it
    if (moment.isMoment(value)) {
      return value.clone();
    }

    const inputStr = String(value).trim().toUpperCase();

    // Check if input matches DD-MMM-YYYY format
    const ddMmmYyyyRegex = /^(\d{1,2})[\/\-]([A-Z]{3})[\/\-](\d{4})$/i;
    const match = inputStr.match(ddMmmYyyyRegex);

    if (match) {
      const inputDay = parseInt(match[1], 10);
      const inputMonth = match[2].toUpperCase();
      const inputYear = parseInt(match[3], 10);

      // Validate month is valid
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthIndex = monthNames.indexOf(inputMonth);

      if (monthIndex === -1) {
        return null; // Invalid month
      }

      // Validate day is in valid range (1-31)
      if (inputDay < 1 || inputDay > 31) {
        return null; // Day out of range
      }

      // Create a date and verify it matches what was input
      // This catches cases like "31-FEB-2026" or "91-APR-2026"
      const testDate = moment([inputYear, monthIndex, inputDay]);

      if (!testDate.isValid()) {
        return null;
      }

      // Verify the date components match exactly
      // This prevents overflow (e.g., 31-FEB becomes 3-MAR, 91-APR becomes 1-JUN)
      if (testDate.date() !== inputDay || testDate.month() !== monthIndex || testDate.year() !== inputYear) {
        return null;
      }

      return testDate;
    }

    // Try parsing with strict mode as fallback
    const parsed = moment(value, parseFormat, true);
    return parsed.isValid() ? parsed : null;
  }
}

@Component({
  selector: 'app-add-edit-resource-rule',
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
    MatSnackBarModule,
    MatMomentDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-resource-rule.html',
  styleUrls: ['./add-edit-resource-rule.scss']
})
export class AddEditResourceRule implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ResourceAvailabilityRuleModel | null = null;
  @Input() resourceCode = '';
  @Input() resourceDescription = '';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;

  weekDays = signal<WeekDayModel[]>([]);

  // Minimum date for datepicker restrictions (based on chapter timezone)
  minDate!: Moment;
  minTerminationDate: Moment | null = null;

  // Chapter info
  chapterId = '';

  // Edit mode values for display
  editModeValues = {
    effectiveDate: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private resourceAvailabilityService: ResourceAvailabilityRulesService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private loginService: LoginService,
    private dateAdapter: DateAdapter<Moment>
  ) {
    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.chapterId = this.headerService.chapterId();

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneDateAdapter) {
      this.dateAdapter.setChapterMinDate(this.minDate);
    }

    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadWeekDays();
    this.setupDateValidationListeners();
    this.setupPanel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------------- FORM INITIALIZATION ---------------- */

  private validDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values - let required validator handle it
      }

      // Check if it's a valid moment object
      if (moment.isMoment(control.value)) {
        return control.value.isValid() ? null : { invalidDate: true };
      }

      // If it's not a moment object, try to parse it
      const parsed = moment(control.value);
      return parsed.isValid() ? null : { invalidDate: true };
    };
  }

  private initializeForm(): void {
    // Get chapter timezone for date validation
    const chapterTimezone = this.headerService.chapterTimeZone();

    this.form = this.fb.group({
      weekDay: ['', Validators.required],
      maxAvailable: [null, [Validators.min(0), Validators.max(999), Validators.pattern(/^\d{0,3}$/)]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone)]],
      terminationDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(chapterTimezone)]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private loadWeekDays(): void {
    this.resourceAvailabilityService.getWeekDayObjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (days) => {
          // If we got valid data, use it
          if (days && days.length > 0) {
            this.weekDays.set(days);
          } else {
            // Fallback to default values
            this.weekDays.set([
              { code: 'MON', description: 'Monday' },
              { code: 'TUE', description: 'Tuesday' },
              { code: 'WED', description: 'Wednesday' },
              { code: 'THU', description: 'Thursday' },
              { code: 'FRI', description: 'Friday' },
              { code: 'SAT', description: 'Saturday' },
              { code: 'SUN', description: 'Sunday' }
            ]);
          }
        },
        error: () => {
          // Fallback to default values with both code and description
          this.weekDays.set([
            { code: 'MON', description: 'Monday' },
            { code: 'TUE', description: 'Tuesday' },
            { code: 'WED', description: 'Wednesday' },
            { code: 'THU', description: 'Thursday' },
            { code: 'FRI', description: 'Friday' },
            { code: 'SAT', description: 'Saturday' },
            { code: 'SUN', description: 'Sunday' }
          ]);
        }
      });
  }

  /* ---------------- PANEL SETUP ---------------- */

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add a New Resource Rule';
      this.form.enable();
      this.form.reset();

      // Set minimum dates
      this.minTerminationDate = this.minDate;
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit Resource Rule';
      this.populateFormForEdit();
    }
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.form.enable();

    // Support both old (effDate/termDate) and new (effectiveDate/terminationDate) field names
    const effectiveDateValue = this.data.effectiveDate || this.data.effDate;
    const terminationDateValue = this.data.terminationDate || this.data.termDate;

    const effDate = effectiveDateValue ? moment(effectiveDateValue) : null;
    const termDate = terminationDateValue ? moment(terminationDateValue) : null;

    this.form.patchValue({
      weekDay: this.data.weekDay ?? '',
      maxAvailable: this.data.maxAvailable ?? null,
      effectiveDate: effDate,
      terminationDate: termDate
    });

    // Disable week day and effective date in edit mode (part of PK, readonly)
    this.form.get('weekDay')?.disable();
    this.form.get('effectiveDate')?.disable();

    // Format effective date for display in edit mode
    this.editModeValues.effectiveDate = this.formatDateForDisplay(effectiveDateValue);

    // Update min termination date based on effective date
    this.updateDateConstraints();
  }

  /* ---------------- DATE VALIDATION LISTENERS ---------------- */

  private setupDateValidationListeners(): void {
    // When effective date changes, update min termination date
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        // Update min termination date - must be the GREATER of chapter's today or effective date
        const chapterToday = this.minDate;

        if (value && moment.isMoment(value) && value.isValid()) {
          const effectiveDay = value.clone().startOf('day');
          // Use whichever is later: chapter's today or effective date
          this.minTerminationDate = effectiveDay.isAfter(chapterToday) ? effectiveDay : chapterToday;
        } else {
          // No effective date set, minimum is chapter's today
          this.minTerminationDate = chapterToday;
        }

        // Auto-clear termination date if it's now invalid
        const terminationDate = this.form.get('terminationDate')?.value;
        if (terminationDate && moment.isMoment(terminationDate)) {
          const terminationDay = terminationDate.clone().startOf('day');

          // Clear if termination is before the new minimum
          if (terminationDay.isBefore(this.minTerminationDate)) {
            this.form.patchValue({ terminationDate: null }, { emitEvent: false });
          }
        }

        // Re-validate termination date when effective date changes
        this.form.get('terminationDate')?.updateValueAndValidity();
        // Re-validate the form
        this.form.updateValueAndValidity({ emitEvent: false });
      });

    // When termination date changes, revalidate the form
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.updateValueAndValidity({ emitEvent: false });
      });
  }

  private updateDateConstraints(): void {
    // Set initial minTerminationDate - must be the GREATER of chapter's today or effective date
    const chapterToday = this.minDate;
    const effectiveDate = this.form.get('effectiveDate')?.value;

    if (effectiveDate && moment.isMoment(effectiveDate) && effectiveDate.isValid()) {
      const effectiveDay = effectiveDate.clone().startOf('day');
      // Use whichever is later: chapter's today or effective date
      this.minTerminationDate = effectiveDay.isAfter(chapterToday) ? effectiveDay : chapterToday;
    } else {
      // No effective date set, minimum is chapter's today
      this.minTerminationDate = chapterToday;
    }
  }

  /* ---------------- ERROR GETTERS ---------------- */

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');

    if (control?.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }

    if (control?.hasError('effectiveDatePast')) {
      return 'Err:11014: Effective date cannot be prior to system date';
    }

    return DateFieldValidationUtility.getEffectiveDateError(this.form);
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');

    if (control?.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }

    return DateFieldValidationUtility.getTerminationDateError(this.form);
  }

  /* ---------------- DATE FIELD INPUT/BLUR HANDLERS ---------------- */

  onDateFieldInput(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (control) {
      if (!control.dirty) {
        control.markAsDirty();
      }

      setTimeout(() => {
        const inputElement = document.querySelector(`input[formControlName="${fieldName}"]`) as HTMLInputElement;
        if (inputElement && inputElement.value && inputElement.value.trim() !== '' && !control.value) {
          control.setErrors({ matDatepickerParse: { text: inputElement.value } });
          control.markAsTouched();
        } else if (!inputElement?.value || inputElement.value.trim() === '') {
          if (control.hasError('matDatepickerParse')) {
            const errors = { ...control.errors };
            delete errors['matDatepickerParse'];
            control.setErrors(Object.keys(errors).length > 0 ? errors : null);
          }
        }
      }, 50);
    }
  }

  onDateFieldBlur(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (control) {
      control.markAsTouched();

      setTimeout(() => {
        const inputElement = document.querySelector(`input[formControlName="${fieldName}"]`) as HTMLInputElement;
        if (inputElement && inputElement.value && inputElement.value.trim() !== '' && !control.value) {
          control.setErrors({ matDatepickerParse: { text: inputElement.value } });
        }
      }, 100);
    }
  }

  getMaxAvailableError(): string {
    const control = this.form.get('maxAvailable');
    if (control?.hasError('min')) {
      return 'Err:11239: Max available must be 0 or greater';
    }
    if (control?.hasError('max')) {
      return 'Availability must be 3 digits or less';
    }
    if (control?.hasError('pattern')) {
      return 'Only numeric values allowed';
    }
    return '';
  }

  /* ---------------- AVAILABILITY INPUT HANDLERS ---------------- */

  onAvailabilityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove any non-digit characters
    const sanitized = input.value.replace(/\D/g, '').slice(0, 3);
    if (input.value !== sanitized) {
      const control = this.form.get('maxAvailable');
      control?.setValue(sanitized || null, { emitEvent: false });
      input.value = sanitized;
    }
  }

  onAvailabilityKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Allow navigation keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Prevent if not a digit or if already 3 digits
    if (!/^\d$/.test(event.key) || (input.value.length >= 3 && input.selectionStart === input.selectionEnd)) {
      event.preventDefault();
    }
  }

  onAvailabilityPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Extract only digits and limit to 3
    const sanitized = pastedText.replace(/\D/g, '').slice(0, 3);
    if (sanitized) {
      const control = this.form.get('maxAvailable');
      control?.setValue(sanitized);
    }
  }

  getWeekDayError(): string {
    const control = this.form.get('weekDay');
    if (control?.hasError('required')) {
      return 'Week day is required';
    }
    return '';
  }

  /* ---------------- GETTERS ---------------- */

  get terminationMinDate(): Moment {
    if (this.minTerminationDate) {
      return this.minTerminationDate;
    }
    return this.minDate;
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  canSave(): boolean {
    return this.form.valid && this.form.dirty && !this.isSaving;
  }

  /* ---------------- SAVE HANDLERS ---------------- */

  onSave(closeAfterSave = true): void {
    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();

    if (!this.isFormValid()) {
      this.snackBar.open(
        'Please fill all required fields before saving.',
        'DISMISS',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    if (this.mode === 'edit') {
      this.callEditApi(closeAfterSave);
    } else {
      this.callAddApi(closeAfterSave);
    }
  }

  onSaveAndCreateAnother(): void {
    this.onSave(false);
  }

  /* ---------------- API CALLS ---------------- */

  private callAddApi(closeAfterSave: boolean): void {
    const formValue = this.form.getRawValue();

    // Build base payload
    const payload: CreateResourceAvailabilityRuleDto = {
      chapterId: this.chapterId,
      loggedInUserName: this.loginService.getStoredUsername(),
      resourceCode: this.resourceCode,
      weekDay: formValue.weekDay,
      maxAvailable: formValue.maxAvailable ?? null,
      effectiveDate: this.formatDateToBackend(formValue.effectiveDate)!,
      terminationDate: formValue.terminationDate
        ? this.formatDateToBackend(formValue.terminationDate)
        : undefined
    };

    this.isSaving = true;

    this.resourceAvailabilityService
      .createResourceAvailabilityRule(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            `'${this.resourceCode}' added successfully`,
            'DISMISS',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            }
          );

          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.closePanel.emit();
          } else {
            this.form.reset();
          }
        },
        error: () => {
          // Error handling is managed globally via Auth Interceptor
        }
      });
  }

  private callEditApi(closeAfterSave: boolean): void {
    const formValue = this.form.getRawValue();

    // Build payload
    const payload: UpdateResourceAvailabilityRuleDto = {
      chapterId: this.chapterId,
      loggedInUserName: this.loginService.getStoredUsername(),
      resourceCode: this.resourceCode,
      weekDay: formValue.weekDay,
      maxAvailable: formValue.maxAvailable ?? null,
      effectiveDate: this.formatDateToBackend(formValue.effectiveDate)!,
      terminationDate: formValue.terminationDate
        ? this.formatDateToBackend(formValue.terminationDate)
        : undefined
    };

    this.isSaving = true;

    this.resourceAvailabilityService
      .updateResourceAvailabilityRule(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            `'${this.resourceCode}' updated successfully`,
            'DISMISS',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            }
          );

          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.closePanel.emit();
          }
        },
        error: () => {
          // Error handling is managed globally via Auth Interceptor
        }
      });
  }

  /* ---------------- UTILITIES ---------------- */

  onCancel(): void {
    this.closePanel.emit();
  }

  /** UI → Backend date formatter */
  private formatDateToBackend(date: any): string | undefined {
    if (!date) return undefined;

    let jsDate: Date;

    if (date instanceof Date) {
      jsDate = date;
    } else if (moment.isMoment(date)) {
      // If using moment
      jsDate = date.toDate();
    } else {
      // Try parse string
      jsDate = new Date(date);
    }

    if (isNaN(jsDate.getTime())) {
      return undefined;
    }

    const y = jsDate.getFullYear();
    const m = ('0' + (jsDate.getMonth() + 1)).slice(-2);
    const d = ('0' + jsDate.getDate()).slice(-2);

    return `${y}-${m}-${d}T00:00:00.000Z`;
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY');
  }

  /** Get day code from WeekDayModel */
  getDayCode(day: WeekDayModel): string {
    if (!day) {
      return '';
    }
    const code = day.weekDayCode || day.code || day.Code || day.value || day.Value || '';
    return code;
  }

  /** Get day description from WeekDayModel */
  getDayDescription(day: WeekDayModel): string {
    if (!day) {
      return '';
    }
    const description = day.weekDayName || day.description || day.Description || day.weekDayCode || day.code || day.Code || day.value || day.Value || '';
    return description;
  }
}
