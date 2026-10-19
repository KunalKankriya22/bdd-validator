import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { TerritoryModel, TerritoryDto, TerritoryUpdateDto, LookupItem } from '../models/territory.model';
import { TerritoryService } from '../services/territory.service';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-territory',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-territory.html',
  styleUrls: ['./add-edit-territory.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditTerritory implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: TerritoryModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form!: FormGroup;
  panelTitle = '';
  lastUpdated = '';
  isSaving = false;
  isLoadingLookups = false;
  isFormDirty = false;
  private periodKeyPressed = false;
  private valueBeforeInput: Record<string, string> = {};
  private initialFormSnapshot = '';
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  // Lookup data loaded from API
  groups: LookupItem[] = [];
  types: LookupItem[] = [];

  // Search controls and filtered options
  groupSearchControl = new FormControl('');
  filteredGroups: LookupItem[] = [];

  typeSearchControl = new FormControl('');
  filteredTypes: LookupItem[] = [];

  editModeValues = {
    territoryId: '',
    territoryShortName: '',
    effectiveDate: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private territoryService: TerritoryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService,
    private dateAdapter: DateAdapter<any>
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= effective date if set
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  ngOnInit(): void {
    this.initForm();
    this.loadLookups();
    this.setupPanel();
    this.setupSearchControls();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && this.form) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isFormValid(): boolean {
    return this.form?.valid ?? false;
  }

  private initForm(): void {
    this.form = this.fb.group({
      territoryShortName: ['', [Validators.required, Validators.maxLength(10), noWhitespaceOnlyValidator()]],
      territoryName: ['', [Validators.required, Validators.maxLength(150), noWhitespaceOnlyValidator()]],
      territoryGroup: [null, [Validators.required]],
      territoryType: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      comments: ['', [Validators.maxLength(240)]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    // Re-validate termination date when effective date changes
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    // Track form changes by comparing current value with initial snapshot
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isFormDirty = this.normalizeFormValue() !== this.initialFormSnapshot;
        this.cdr.markForCheck();
      });
  }

  private loadLookups(): void {
    this.isLoadingLookups = true;
    this.territoryService.getFilterOptions()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingLookups = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (lookups) => {
          this.groups = lookups.groups;
          this.types = lookups.types;
          this.filteredGroups = [...this.groups];
          this.filteredTypes = [...this.types];
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Failed to load lookup options.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private setupSearchControls(): void {
    // Group search
    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredGroups = this.groups.filter(group =>
          group.code.toLowerCase().includes(term) ||
          group.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Type search
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredTypes = this.types.filter(type =>
          type.code.toLowerCase().includes(term) ||
          type.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private setupPanel(): void {
    // Clear raw input when setting up panel
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    if (this.mode === 'add') {
      this.panelTitle = 'Add New Territory';
      this.lastUpdated = '';
      this.editModeValues = { territoryId: '', territoryShortName: '', effectiveDate: '' };
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      // Override termination date validators to remove dateFormatValidator which doesn't handle Moment objects
      // The component's own validateDateInput handles format validation for manual input
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.clearValidators();
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
        ]);
        termDateControl.updateValueAndValidity();
      }
      this.initialFormSnapshot = this.normalizeFormValue();
      this.isFormDirty = false;
    } else {
      this.panelTitle = 'Edit Territory';
      if (this.data?.modificationDate) {
        this.lastUpdated = `Last Modified: ${DateFieldValidationUtility.formatDateForUI(this.data.modificationDate as Date)}`;
      } else {
        this.lastUpdated = '';
      }
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      // Override termination date validators to remove dateFormatValidator which doesn't handle Moment objects
      // The datepicker ensures valid date selection, we only need to check if it's not a past date
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.clearValidators();
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
        ]);
        termDateControl.updateValueAndValidity();
      }
    }
    this.cdr.markForCheck();
  }

  private normalizeFormValue(): string {
    // Use getRawValue() to include disabled controls (like effectiveDate in edit mode)
    const formValue = this.form.getRawValue();
    return JSON.stringify({
      territoryShortName: formValue.territoryShortName?.trim() || '',
      territoryName: formValue.territoryName?.trim() || '',
      territoryGroup: formValue.territoryGroup || null,
      territoryType: formValue.territoryType || '',
      effectiveDate: formValue.effectiveDate ? String(formValue.effectiveDate) : null,
      terminationDate: formValue.terminationDate ? String(formValue.terminationDate) : null,
      comments: formValue.comments?.trim() || ''
    });
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.editModeValues = {
      territoryId: this.data.territoryId,
      territoryShortName: this.data.territoryShortName,
      effectiveDate: DateFieldValidationUtility.formatDateForUI(this.data.effDate as Date) || '-'
    };

    this.form.patchValue({
      territoryShortName: this.data.territoryShortName,
      territoryName: this.data.territoryName,
      territoryGroup: this.data.territoryGroup || null,
      territoryType: this.data.territoryType,
      effectiveDate: this.data.effDate,
      terminationDate: this.data.termDate || null,
      comments: this.data.comments || ''
    });

    // Mark form as pristine after populating to ensure dirty detection works
    this.form.markAsPristine();
    this.initialFormSnapshot = this.normalizeFormValue();
    this.isFormDirty = false;
    this.cdr.markForCheck();
  }

  onSave(): void {
    this.performSave(() => {
      this.closePanel.emit();
    });
  }

  onSaveAndCreateAnother(): void {
    this.performSave(() => {
      if (this.mode === 'edit') {
        this.modeChange.emit('add');
      }
      this.resetFormForAddMode();
      this.setupPanel();
    });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private performSave(onSuccessCallback: () => void): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;
    if (this.mode === 'add') {
      const dto: TerritoryDto = {
        territoryShortName: formValue.territoryShortName?.trim(),
        territoryName: formValue.territoryName?.trim(),
        territoryGroup: formValue.territoryGroup || null,
        territoryType: formValue.territoryType,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        termDate: formValue.terminationDate
          ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
          : null,
        comments: formValue.comments?.trim() || null
      };
      apiCall = this.territoryService.addTerritory(dto);
    } else {
      const updateDto: TerritoryUpdateDto = {
        territoryId: this.data!.territoryId,
        originalTerritoryShortName: this.editModeValues.territoryShortName,
        territoryShortName: formValue.territoryShortName?.trim(),
        territoryName: formValue.territoryName?.trim(),
        territoryGroup: formValue.territoryGroup || null,
        territoryType: formValue.territoryType,
        // Use original value as-is to avoid backend validation error when only termination date changes
        effDate: typeof this.data!.effDate === 'string'
          ? this.data!.effDate
          : DateFieldValidationUtility.serializeDateForApi(this.data!.effDate),
        termDate: formValue.terminationDate
          ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
          : null,
        comments: formValue.comments?.trim() || null
      };
      apiCall = this.territoryService.updateTerritory(updateDto);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || `Territory ${this.mode === 'add' ? 'added' : 'updated'} successfully`;
          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();
          onSuccessCallback();
        },
        error: (error: any) => {
          // Check multiple possible error message paths in the response
          let message = error?.error?.errorResponse?.error
                     || error?.error?.message
                     || error?.message;

          // If no error message found, provide specific messages based on status code
          if (!message) {
            if (error?.status === 400 || error?.error?.statusCode === 400) {
              message = 'Invalid request. Please check your input.';
            } else if (error?.status === 409 || error?.error?.statusCode === 409) {
              message = 'Duplicate record already exists.';
            } else {
              message = `Failed to ${this.mode} territory. Please try again.`;
            }
          }

          // Extract error code and prepend to message if available
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          if (errorCode) {
            message = `Error ${errorCode}: ${message}`;
          }

          this.snackBar.open(message, 'Close', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private resetFormForAddMode(): void {
    this.form.reset({
      territoryShortName: '',
      territoryName: '',
      territoryGroup: null,
      territoryType: '',
      effectiveDate: null,
      terminationDate: null,
      comments: ''
    });
    this.data = null;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.initialFormSnapshot = this.normalizeFormValue();
    this.isFormDirty = false;
    this.cdr.markForCheck();
  }

  // Error message helpers
  getShortNameError(): string {
    const control = this.form.get('territoryShortName');
    if (control?.hasError('required')) return 'Short Name is required';
    if (control?.hasError('maxlength')) return 'Short Name cannot exceed 10 characters';
    if (control?.hasError('whitespaceOnly')) return 'Short Name cannot be blank';
    return '';
  }

  getFullNameError(): string {
    const control = this.form.get('territoryName');
    if (control?.hasError('required')) return 'Full Name is required';
    if (control?.hasError('maxlength')) return 'Full Name cannot exceed 150 characters';
    if (control?.hasError('whitespaceOnly')) return 'Full Name cannot be blank';
    return '';
  }

  getGroupError(): string {
    const control = this.form.get('territoryGroup');
    if (control?.hasError('required')) return 'Group is required';
    return '';
  }

  getTypeError(): string {
    const control = this.form.get('territoryType');
    if (control?.hasError('required')) return 'Type is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control) return '';

    // If there's raw input but no value (adapter rejected it), show invalid date error instead of required
    if (this.effectiveDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Effective date is invalid';
    }

    return DateFieldValidationUtility.getEffectiveDateErrorMessage(
      control,
      this.form.errors
    );
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) return '';

    // If there's raw input but no value (adapter rejected it), show invalid date error instead of required
    if (this.terminationDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    // Check form-level date range error first (should show even if field not touched)
    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be on or after Effective Date';
    }

    return DateFieldValidationUtility.getTerminationDateErrorMessage(
      control,
      this.form.errors
    );
  }

  /**
   * Captures the control value BEFORE the keystroke modifies it,
   * and tracks whether the period key was physically pressed.
   * Must be bound as (keydown) on every text input that calls sanitizeInput.
   */
  onTextKeyDown(event: KeyboardEvent, controlName: string): void {
    if (event.key === '.') {
      this.periodKeyPressed = true;
    }
    const control = this.form.get(controlName);
    if (control && typeof control.value === 'string') {
      this.valueBeforeInput[controlName] = control.value;
    }
  }

  sanitizeInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    let sanitized = value;

    // Detect macOS double-space period: a new period appeared without the user pressing '.'
    const prev = this.valueBeforeInput[controlName];
    if (prev !== undefined && !this.periodKeyPressed) {
      const prevPeriodCount = (prev.match(/\./g) || []).length;
      const currPeriodCount = (value.match(/\./g) || []).length;

      if (currPeriodCount > prevPeriodCount) {
        // Remove only the newly inserted period (the last one)
        const lastDotIndex = sanitized.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          sanitized = sanitized.substring(0, lastDotIndex) + sanitized.substring(lastDotIndex + 1);
        }
      }
    }
    this.periodKeyPressed = false;

    // Remove leading spaces and collapse multiple spaces
    sanitized = sanitized.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  toUpperCase(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const upper = value.toUpperCase();
    if (upper !== value) {
      control.setValue(upper, { emitEvent: false });
    }
  }

  trimInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const trimmed = value.trimEnd();
    if (trimmed !== value) {
      control.setValue(trimmed, { emitEvent: false });
    }
  }

  onDateInputChange(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() || '';

    // Store raw input for each field
    if (controlName === 'effectiveDate') {
      this.effectiveDateRawInput = inputValue;
    } else if (controlName === 'terminationDate') {
      this.terminationDateRawInput = inputValue;
    }

    // Validate in real-time but DON'T set the value (only show errors)
    this.validateDateInput(inputValue, controlName);
  }

  onDateBlur(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() || '';

    // Clear raw input if field is empty
    if (!inputValue) {
      if (controlName === 'effectiveDate') {
        this.effectiveDateRawInput = '';
      } else if (controlName === 'terminationDate') {
        this.terminationDateRawInput = '';
      }
    }

    // Validate when user leaves the field
    this.validateDateInput(inputValue, controlName);
  }

  private validateDateInput(inputValue: string, controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;

    if (!inputValue) {
      // Clear manual validation errors if input is empty
      if (control.hasError('invalidDateFormat')) {
        const errors = { ...control.errors };
        delete errors['invalidDateFormat'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return;
    }

    const trimmedInput = inputValue.trim();

    // Use the date adapter's parse method which supports all configured formats from DD_MON_YYYY_FORMATS
    const parsedDate = this.dateAdapter.parse(trimmedInput, DD_MON_YYYY_FORMATS.parse.dateInput);

    if (!parsedDate || !parsedDate.isValid()) {
      // Date is invalid (e.g., 31-APR-2026, invalid format, etc.)
      control.setErrors({ ...control.errors, invalidDateFormat: true });
      control.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    // If we reach here, date is valid - clear the invalidDateFormat error
    if (control.hasError('invalidDateFormat')) {
      const errors = { ...control.errors };
      delete errors['invalidDateFormat'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      this.cdr.markForCheck();
    }
  }
}
