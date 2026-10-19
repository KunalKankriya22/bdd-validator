import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { positiveIntegerValidator } from '../validators/valid-scan-interface.validator';
import { ValidScanInterfaceService } from '../services/valid-scan-interface.service';
import moment from 'moment';
import { Observable, of, Subject, takeUntil, finalize, startWith, map } from 'rxjs';
import { ValidScanInterfaceDto, ValidScanInterfaceModel, ValidScanInterfaceUpdateDto } from '../models/valid-scan-interface.model';

export interface ValidScanInterfaceFormData {
  scanType: string;
  startCount: number;
  startCode: string;
  stopSize: number;
  stopCode: string;
  stringSize: number;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-valid-scan-interface',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-valid-scan-interface.html',
  styleUrls: ['./add-edit-valid-scan-interface.scss']
})
export class AddEditValidScanInterface implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidScanInterfaceModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ValidScanInterfaceFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    rowId: string;
    scanType: string;
    effectiveDate: string;
  } = {
      rowId: '',
      scanType: '',
      effectiveDate: ''
    };

  isSaving = false;

  scanTypeSuggestions: string[] = [];
  filteredScanTypes$: Observable<string[]> = of([]);

  // Min date for effective date picker (today)
  minDate = DateFieldValidationUtility.getMinDate();

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validScanInterfaceService: ValidScanInterfaceService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      scanType: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator()]],
      startCount: ['', [Validators.required, positiveIntegerValidator()]],
      startCode: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      stopSize: ['', [Validators.required, positiveIntegerValidator()]],
      stopCode: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      stringSize: ['', [Validators.required, positiveIntegerValidator()]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupDateValidationListeners();
    this.setupScanTypeAutocomplete();
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
      this.panelTitle = 'Add Scale Configuration';
      this.lastUpdated = '';
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    } else {
      this.panelTitle = 'Edit Scale Configuration';

      const dateToDisplay = this.data?.modificationDate || new Date();
      this.lastUpdated = `Last Updated: ${this.formatDateTime(dateToDisplay)}`;
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      rowId: '',
      scanType: '',
      effectiveDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('scanType')?.enable();
    this.form.get('effectiveDate')?.enable();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.editModeValues = {
        rowId: this.data.rowId || '',
        scanType: this.data.scanType || '',
        effectiveDate: this.data.effectiveDate ? this.formatDateForDisplay(this.data.effectiveDate) : ''
      };

      this.form.get('scanType')?.disable();
      this.form.get('effectiveDate')?.disable();

      this.form.patchValue({
        scanType: this.data.scanType || '',
        startCount: this.data.startCount || '',
        startCode: this.data.startCode || '',
        stopSize: this.data.stopSize || '',
        stopCode: this.data.stopCode || '',
        stringSize: this.data.stringSize || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });
    }
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  private setupScanTypeAutocomplete(): void {
    if (this.mode === 'add') {
      this.loadScanTypeSuggestions();
    }

    this.filteredScanTypes$ = this.form.get('scanType')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterScanTypes(value || ''))
    );

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.mode === 'add') {
          this.loadScanTypeSuggestions();
        }
      });
  }

  private loadScanTypeSuggestions(): void {
    const effDate = this.form.get('effectiveDate')?.value;
    const dateStr = effDate
      ? moment(effDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    this.validScanInterfaceService.getScanTypeLookup(dateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.scanTypeSuggestions = types;
        },
        error: () => {
          this.scanTypeSuggestions = [];
        }
      });
  }

  private filterScanTypes(value: string): string[] {
    const filterValue = value.toUpperCase();
    return this.scanTypeSuggestions.filter(type =>
      type.toUpperCase().includes(filterValue)
    );
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.performSave(() => {
      this.closePanel.emit();
    });
  }

  onSaveAndCreateAnother(): void {
    this.performSave(() => {
      if (this.mode === 'edit') {
        this.mode = 'add';
        this.modeChange.emit('add');
        this.resetFormForAddMode();
        this.setupPanel();
      } else {
        this.resetFormForAddMode();
      }
    });
  }

  private performSave(onSuccessCallback: () => void): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const dto: ValidScanInterfaceDto = {
        scanType: formValue.scanType || '',
        startCount: Number(formValue.startCount) || 0,
        startCode: formValue.startCode || '',
        stopSize: Number(formValue.stopSize) || 0,
        stopCode: formValue.stopCode || '',
        stringSize: Number(formValue.stringSize) || 0,
        effectiveDate: this.convertToUTCDate(formValue.effectiveDate) || new Date(),
        terminationDate: this.convertToUTCDate(formValue.terminationDate)
      };
      apiCall = this.validScanInterfaceService.addValidScanInterface(dto);
    } else {
      const updateDto: ValidScanInterfaceUpdateDto = {
        rowId: this.editModeValues.rowId,
        originalScanType: this.editModeValues.scanType,
        startCount: Number(formValue.startCount) || 0,
        startCode: formValue.startCode || '',
        stopSize: Number(formValue.stopSize) || 0,
        stopCode: formValue.stopCode || '',
        stringSize: Number(formValue.stringSize) || 0,
        terminationDate: this.convertToUTCDate(formValue.terminationDate)
      };
      apiCall = this.validScanInterfaceService.updateValidScanInterface(updateDto);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            const message = response.message || 'Operation completed successfully';

            this.snackbarService.showSuccess(message);

            const result: ValidScanInterfaceFormData = {
              scanType: formValue.scanType || '',
              startCount: Number(formValue.startCount) || 0,
              startCode: formValue.startCode || '',
              stopSize: Number(formValue.stopSize) || 0,
              stopCode: formValue.stopCode || '',
              stringSize: Number(formValue.stringSize) || 0,
              effectiveDate: this.convertToUTCDate(formValue.effectiveDate) || new Date(),
              terminationDate: this.convertToUTCDate(formValue.terminationDate) || null
            };

            this.saveSuccess.emit(result);
            onSuccessCallback();
          }
        },
        error: (err) => {
          const errorMessage = err?.error?.error || err?.error?.message || 'An error occurred while saving';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  get scanTypeControl() {
    return this.form.get('scanType');
  }

  get leadingCharCountControl() {
    return this.form.get('startCount');
  }

  get leadingCharactersControl() {
    return this.form.get('startCode');
  }

  get trailingCharCountControl() {
    return this.form.get('stopSize');
  }

  get trailingCharactersControl() {
    return this.form.get('stopCode');
  }

  get stringSizeControl() {
    return this.form.get('stringSize');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getScanTypeError(): string {
    const control = this.scanTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Scan Type is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Scan Type cannot contain only spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Scan Type cannot exceed 5 characters';
    }
    return '';
  }

  getLeadingCharCountError(): string {
    const control = this.leadingCharCountControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Leading Character Count is required';
    }
    if (control.hasError('positiveInteger')) {
      return 'Must be a positive integer';
    }
    return '';
  }

  getLeadingCharactersError(): string {
    const control = this.leadingCharactersControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Leading Characters is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Leading Characters cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Leading Characters must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Leading Characters cannot exceed 5 characters';
    }
    return '';
  }

  getTrailingCharCountError(): string {
    const control = this.trailingCharCountControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Trailing Character Count is required';
    }
    if (control.hasError('positiveInteger')) {
      return 'Must be a positive integer';
    }
    return '';
  }

  getTrailingCharactersError(): string {
    const control = this.trailingCharactersControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Trailing Characters is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Trailing Characters cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Trailing Characters must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Trailing Characters cannot exceed 5 characters';
    }
    return '';
  }

  getStringSizeError(): string {
    const control = this.stringSizeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'String Size is required';
    }
    if (control.hasError('positiveInteger')) {
      return 'Must be a positive integer';
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

  formatDate(date: Date | null): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY');
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return 'Today';
    } else {
      return momentDate.format('DD-MMM-YYYY');
    }
  }

  /**
   * Converts a moment date to a UTC Date object at midnight
   * This preserves the selected date regardless of timezone
   */
  private convertToUTCDate(momentDate: moment.Moment | null): Date | null {
    if (!momentDate) return null;

    return new Date(Date.UTC(
      momentDate.year(),
      momentDate.month(),
      momentDate.date(),
      0, 0, 0, 0
    ));
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get isFormDirty(): boolean {
    return this.form.dirty;
  }

  /**
   * Minimum date for Effective Date: today (cannot be before today)
   */
  get minEffectiveDate(): moment.Moment {
    return DateFieldValidationUtility.getMinDate();
  }

  /**
   * Maximum date for Effective Date: termination date (if set) - allows effective to equal termination
   */
  get maxEffectiveDate(): moment.Moment | null {
    const terminationDate = this.form.get('terminationDate')?.value;
    if (!terminationDate) return null;

    return moment(terminationDate).startOf('day');
  }

  /**
   * Minimum date for Termination Date: chapter's today or effective date (whichever is later) - allows termination to equal effective
   */
  get minTerminationDate(): moment.Moment {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date

    if (!effectiveDate) {
      return today;
    }

    const effective = moment(effectiveDate).startOf('day');

    return effective.isAfter(today) ? effective : today;
  }

  /**
   * Filter function for Effective Date datepicker
   * Prevents selecting before chapter's today or dates after termination date
   */
  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return false;

    const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date
    const selectedDate = moment(date).startOf('day');

    // Cannot select before chapter's today (but today is allowed)
    if (selectedDate.isBefore(today)) {
      return false;
    }

    // If termination date is set, cannot select after termination date (but equal is allowed)
    const terminationDate = this.form.get('terminationDate')?.value;
    if (terminationDate) {
      const termDate = moment(terminationDate).startOf('day');
      if (selectedDate.isAfter(termDate)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter function for Termination Date datepicker
   * Prevents selecting before chapter's today or before effective date
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return false;

    const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date
    const selectedDate = moment(date).startOf('day');

    // Cannot select before chapter's today
    if (selectedDate.isBefore(today)) {
      return false;
    }

    // If effective date is set, cannot select before effective date (but equal is allowed)
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDate = moment(effectiveDate).startOf('day');
      if (selectedDate.isBefore(effDate)) {
        return false;
      }
    }

    return true;
  }

  onScanTypeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
      this.form.get('scanType')?.setValue(upper, { emitEvent: false });
    }
  }

  /**
   * Handle input for Leading Characters field (VARCHAR2(5))
   * Enforces max 5 characters in real-time
   */
  onLeadingCharactersInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Limit to 5 characters max
    if (inputValue.length > 5) {
      inputValue = inputValue.substring(0, 5);
      input.value = inputValue;
      this.form.get('startCode')?.setValue(inputValue, { emitEvent: false });
    }
  }

  /**
   * Handle input for Trailing Characters field (VARCHAR2(5))
   * Enforces max 5 characters in real-time
   */
  onTrailingCharactersInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Limit to 5 characters max
    if (inputValue.length > 5) {
      inputValue = inputValue.substring(0, 5);
      input.value = inputValue;
      this.form.get('stopCode')?.setValue(inputValue, { emitEvent: false });
    }
  }

  /**
   * Handle input for Leading Character Count field (NUMBER(2,0))
   * Enforces max 2 digits, positive integers only
   */
  onLeadingCharCountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Parse and validate the value
    if (inputValue === '') {
      input.value = '';
      this.form.get('startCount')?.setValue(null, { emitEvent: false });
      return;
    }

    let value = parseInt(inputValue, 10);

    // Validate and clamp value (1-99)
    if (!isNaN(value)) {
      if (value < 1) {
        value = 1;
      } else if (value > 99) {
        value = 99;
      }

      // Update both input and form control with clamped value
      input.value = value.toString();
      this.form.get('startCount')?.setValue(value, { emitEvent: false });
    }
  }

  /**
   * Handle input for Trailing Character Count field (NUMBER(2,0))
   * Enforces max 2 digits, positive integers only
   */
  onTrailingCharCountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Parse and validate the value
    if (inputValue === '') {
      input.value = '';
      this.form.get('stopSize')?.setValue(null, { emitEvent: false });
      return;
    }

    let value = parseInt(inputValue, 10);

    // Validate and clamp value (1-99)
    if (!isNaN(value)) {
      if (value < 1) {
        value = 1;
      } else if (value > 99) {
        value = 99;
      }

      // Update both input and form control with clamped value
      input.value = value.toString();
      this.form.get('stopSize')?.setValue(value, { emitEvent: false });
    }
  }

  /**
   * Handle input for String Size field (NUMBER(2,0))
   * Enforces max 2 digits, positive integers only
   */
  onStringSizeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Parse and validate the value
    if (inputValue === '') {
      input.value = '';
      this.form.get('stringSize')?.setValue(null, { emitEvent: false });
      return;
    }

    let value = parseInt(inputValue, 10);

    // Validate and clamp value (1-99)
    if (!isNaN(value)) {
      if (value < 1) {
        value = 1;
      } else if (value > 99) {
        value = 99;
      }

      // Update both input and form control with clamped value
      input.value = value.toString();
      this.form.get('stringSize')?.setValue(value, { emitEvent: false });
    }
  }
}
