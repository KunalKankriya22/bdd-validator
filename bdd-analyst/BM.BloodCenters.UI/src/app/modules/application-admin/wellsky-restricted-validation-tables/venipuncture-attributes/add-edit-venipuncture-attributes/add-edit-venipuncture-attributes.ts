import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { noWhitespaceOnlyValidator, codeFieldValidator, noLeadingTrailingWhitespaceValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { VenipunctureAttributesService } from '../services/venipuncture-attributes.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  VenipunctureAttributesModel,
  VenipunctureAttributesDto,
  UpdateVenipunctureAttributesDto
} from '../models/venipuncture-attributes.model';

export interface VenipunctureAttributesFormData {
  group: string;
  code: string;
  description?: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

/**
 * Local validator: Validates that a field contains no spaces at all.
 * Used for Code field where spaces should never be allowed.
 */
function noSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string' && /\s/.test(value)) {
      return { noSpaces: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-add-edit-venipuncture-attributes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-venipuncture-attributes.html',
  styleUrls: ['./add-edit-venipuncture-attributes.scss']
})
export class AddEditVenipunctureAttributes implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: VenipunctureAttributesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<VenipunctureAttributesFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  // Custom error state matchers for date fields
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    group: string;
    code: string;
    description: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
      group: '',
      code: '',
      description: '',
      effectiveDate: '',
      terminationDate: ''
    };

  groupOptions: { groupName: string; groupDesc: string }[] = [];
  filteredGroupOptions: { groupName: string; groupDesc: string }[] = [];
  groupSearchControl = new FormControl<string>('');
  isSaving = false;

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    group: string;
    code: string;
  } = {
    group: '',
    code: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private venipunctureAttributesService: VenipunctureAttributesService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    // Initialize form - validators for date fields set separately after chapterOffset is available
    this.form = this.fb.group({
      group: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator(), noSpacesValidator()]],
      description: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator(), noLeadingTrailingWhitespaceValidator()]],
      effectiveDate: [null, [Validators.required]],  // Additional validators added in ngOnInit
      terminationDate: [null]  // Validators added in ngOnInit
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    // Re-validate termination date when effective date changes (for date range validation)
    this.form.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.form.get('terminationDate')?.updateValueAndValidity();
    });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  /**
   * Termination date filter: must be >= chapter's today AND >= effective date
   * Following qa-library pattern for consistent behavior
   */
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
    // Setup group dropdown search
    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredGroupOptions = this.groupOptions.filter((group) =>
          group.groupName.toLowerCase().includes(term)
        );
      });

    this.loadGroupOptions();
    this.setupPanel();
  }

  /**
   * Setup date validators for add mode
   * Uses shared DateFieldValidationUtility
   */
  private setupAddModeValidators(): void {
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  /**
   * Setup date validators for edit mode
   * Note: Can't use DateFieldValidationUtility.setupEditModeValidators() because:
   * - The API enforces past date validation even in edit mode
   * - The utility's setupEditModeValidators() intentionally skips past-date check
   * Following qa-library pattern: always validate termination date is not in past
   */
  private setupEditModeValidators(): void {
    const effDateCtrl = this.form.get('effectiveDate');
    const termDateCtrl = this.form.get('terminationDate');

    // Effective Date: editable in edit mode with format validation
    if (effDateCtrl) {
      effDateCtrl.enable({ emitEvent: false });
      effDateCtrl.setValidators([
        Validators.required,
        DateFieldValidationUtility.validDateValidator()
      ]);
      effDateCtrl.updateValueAndValidity({ emitEvent: false });
    }

    // Termination Date: validate not in past (API requirement)
    if (termDateCtrl) {
      termDateCtrl.setValidators([
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termDateCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private loadGroupOptions(): void {
    this.venipunctureAttributesService.getVenipunctureAttributesGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.groupOptions = groups;
          this.filteredGroupOptions = [...this.groupOptions];
          this.groupSearchControl.setValue('', { emitEvent: false });
        },
        error: (error) => {
          console.error('Error loading group options:', error);
          this.groupOptions = [];
          this.filteredGroupOptions = [];
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Code';
      this.lastUpdated = '';
      this.setupAddModeValidators();
    } else {
      this.panelTitle = 'Edit Code';
      // Use lastModifiedDate from data if available
      const lastModifiedDate = this.data?.lastModifiedDate || new Date();
      this.lastUpdated = `Last Updated: ${this.formatDateTime(lastModifiedDate)}`;
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      group: '',
      code: '',
      description: '',
      effectiveDate: '',
      terminationDate: ''
    };

    // Reset form without emitting events to prevent triggering validation errors
    this.form.reset({}, { emitEvent: false });
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Reset group search control
    this.groupSearchControl.setValue('', { emitEvent: false });

    // All fields are editable in add mode
    this.form.get('group')?.enable({ emitEvent: false });
    this.form.get('code')?.enable({ emitEvent: false });
    this.form.get('description')?.enable({ emitEvent: false });
    this.form.get('effectiveDate')?.enable({ emitEvent: false });
    this.form.get('terminationDate')?.enable({ emitEvent: false });

    // Restore required validators for non-date fields
    this.form.get('group')?.setValidators([Validators.required]);
    this.form.get('code')?.setValidators([Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator(), noSpacesValidator()]);
    this.form.get('description')?.setValidators([Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator(), noLeadingTrailingWhitespaceValidator()]);

    // Update validity without emitting events
    this.form.get('group')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('code')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('description')?.updateValueAndValidity({ emitEvent: false });

    // Setup date validators for add mode
    this.setupAddModeValidators();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const group = this.data.group || '';
      const code = this.data.code || '';
      const description = this.data.description || '';

      // Store original values for update API
      this.originalValues = {
        group,
        code
      };

      this.editModeValues = {
        group,
        code,
        description,
        effectiveDate: this.data.effectiveDate ? this.formatDateForDisplay(this.data.effectiveDate) : '',
        terminationDate: this.data.terminationDate ? this.formatDateForDisplay(this.data.terminationDate) : ''
      };

      // In edit mode: group and code are disabled, only description and dates are editable
      this.form.patchValue({
        group,
        code,
        description,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      // Disable group and code in edit mode (shown as read-only cards in UI)
      this.form.get('group')?.disable({ emitEvent: false });
      this.form.get('code')?.disable({ emitEvent: false });

      // Mark form as pristine and untouched so save button is disabled until user makes changes
      this.form.markAsPristine();
      this.form.markAsUntouched();

      // Setup date validators for edit mode
      // This disables effective date and validates termination date
      this.setupEditModeValidators();
    }
  }

  private formatDateForDisplay(date: Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private validateDatesBeforeSave(formValue: ReturnType<typeof this.form.getRawValue>): boolean {
    const effectiveDate = formValue.effectiveDate as moment.Moment;
    const terminationDate = formValue.terminationDate as moment.Moment;
    if (!effectiveDate || !effectiveDate.isValid()) return false;
    if (terminationDate && !terminationDate.isValid()) return false;
    return true;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    this.form.get('terminationDate')?.updateValueAndValidity();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    if (!this.validateDatesBeforeSave(formValue)) {
      return;
    }

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: VenipunctureAttributesDto = {
        group: formValue.group?.trim() || '',
        code: formValue.code?.trim() || '',
        description: formValue.description?.trim() || '',
        effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.venipunctureAttributesService.addVenipunctureAttribute(addPayload);
    } else {
      const updatePayload: UpdateVenipunctureAttributesDto = {
        // Current values (to identify the record)
        currentGroup: this.originalValues.group,
        currentCode: this.originalValues.code,
        // New values
        group: formValue.group?.trim() || '',
        code: formValue.code?.trim() || '',
        description: formValue.description?.trim() || '',
        effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.venipunctureAttributesService.updateVenipunctureAttribute(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Venipuncture Attribute added successfully'
            : 'Venipuncture Attribute updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: VenipunctureAttributesFormData = {
            group: formValue.group?.trim() || '',
            code: formValue.code?.trim() || '',
            description: formValue.description?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('Error saving venipuncture attribute:', error);
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    this.form.get('terminationDate')?.updateValueAndValidity();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    if (!this.validateDatesBeforeSave(formValue)) {
      return;
    }

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: VenipunctureAttributesDto = {
        group: formValue.group?.trim() || '',
        code: formValue.code?.trim() || '',
        description: formValue.description?.trim() || '',
        effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.venipunctureAttributesService.addVenipunctureAttribute(addPayload);
    } else {
      const updatePayload: UpdateVenipunctureAttributesDto = {
        // Current values (to identify the record)
        currentGroup: this.originalValues.group,
        currentCode: this.originalValues.code,
        // New values
        group: formValue.group?.trim() || '',
        code: formValue.code?.trim() || '',
        description: formValue.description?.trim() || '',
        effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.venipunctureAttributesService.updateVenipunctureAttribute(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Operation completed successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: VenipunctureAttributesFormData = {
            group: formValue.group?.trim() || '',
            code: formValue.code?.trim() || '',
            description: formValue.description?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
        },
        error: (error) => {
          console.error('Error saving venipuncture attribute:', error);
        }
      });
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

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], HH:mm');
    } else {
      return momentDate.format('DD-MMM-YYYY, HH:mm');
    }
  }

  /**
   * Prevents space input entirely (for Code field)
   */
  preventSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  /**
   * Prevents leading spaces and multiple consecutive spaces (for Description field)
   */
  preventLeadingAndMultipleSpaces(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      const control = this.form.get('description');
      const currentValue = control?.value || '';

      // Prevent space at the beginning
      if (currentValue.length === 0) {
        event.preventDefault();
        return;
      }

      // Prevent multiple consecutive spaces
      if (currentValue.endsWith(' ')) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Trims trailing spaces from Description field on blur
   */
  trimDescriptionSpaces(): void {
    const control = this.form.get('description');
    const value = control?.value;

    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control?.setValue(trimmed);
      }
    }
  }

  get groupControl() {
    return this.form.get('group');
  }

  get codeControl() {
    return this.form.get('code');
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

  get isFormValid(): boolean {
    if (this.mode === 'add') {
      return this.form?.valid;
    }
    if (!this.form?.dirty) {
      return false;
    }
    const hasVisibleErrors =
      this.getGroupError() !== '' ||
      this.getCodeError() !== '' ||
      this.getDescriptionError() !== '' ||
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '';
    return !hasVisibleErrors;
  }

  getGroupError(): string {
    const control = this.groupControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Group is required';
    }
    return '';
  }

  getCodeError(): string {
    const control = this.codeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Code is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Code cannot contain only spaces';
    }
    if (control.hasError('noSpaces')) {
      return 'Code cannot contain spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Code must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Code cannot exceed 5 characters';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Description is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Description cannot contain only spaces';
    }
    if (control.hasError('leadingTrailingWhitespace')) {
      return 'Description must not have leading or trailing spaces';
    }
    if (control.hasError('multipleSpaces')) {
      return 'Description must not have multiple consecutive spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Description cannot exceed 50 characters';
    }
    return '';
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      this.form.errors
    );
  }

}
