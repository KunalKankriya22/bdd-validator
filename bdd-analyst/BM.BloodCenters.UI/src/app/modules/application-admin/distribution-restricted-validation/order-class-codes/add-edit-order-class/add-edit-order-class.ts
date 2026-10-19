import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { OrderClassCodesService } from '../services/order-class-codes.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  OrderClassCodesModel,
  OrderClassCodesDto,
  UpdateOrderClassCodesDto
} from '../models/order-class-codes.model';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';

export interface OrderClassFormData {
  orderClass: string;
  chapterId: string;
  description: string;
  priority: number;
  hours: number;
  displayFlag: string;
  effectiveDate: string | null;  // format: YYYY-MM-DD
  terminationDate?: string | null;  // format: YYYY-MM-DD
}

@Component({
  selector: 'app-add-edit-order-class',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useFactory: () => new UppercaseMomentDateAdapter(
        inject(MAT_DATE_LOCALE, { optional: true }) as string,
        inject(MAT_MOMENT_DATE_ADAPTER_OPTIONS, { optional: true }) ?? undefined
      )
    }
  ],
  templateUrl: './add-edit-order-class.html',
  styleUrls: ['./add-edit-order-class.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddEditOrderClass implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: OrderClassCodesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<OrderClassFormData>();

  form: FormGroup;
  panelTitle: string = '';
  minDate = moment();
  chapterCurrentDate = moment();

  editModeValues: {
    orderClass: string;
    effectiveDate: Date | null;
  } = {
      orderClass: '',
      effectiveDate: null
    };

  isSaving = false;

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    orderClass: string;
    chapterId: string;
    effectiveDate: Date | null;
  } = {
    orderClass: '',
    chapterId: '',
    effectiveDate: null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private orderClassCodesService: OrderClassCodesService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackBar: MatSnackBar
  ) {
    // Set chapter's current date for datepicker
    this.chapterCurrentDate = this.chapterTimezoneService.getChapterLocalDate();
    this.minDate = this.chapterCurrentDate.clone();

    this.form = this.fb.group({
      orderClass: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      description: ['', [noWhitespaceOnlyValidator()]],
      priority: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      hours: [null, [Validators.required, Validators.min(1), Validators.max(99999)]],
      displayInOrders: [false],
      effectiveDate: [null, this.getEffectiveDateValidators()],
      terminationDate: [null, [DateFieldValidationUtility.validDateValidator(), DateFieldValidationUtility.terminationDateNotPastValidator()]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  /**
   * Centralized validator definitions to ensure consistency across add/edit modes
   */
  private getOrderClassValidators() {
    return [Validators.required, Validators.maxLength(2)];
  }

  private getDescriptionValidators() {
    return [noWhitespaceOnlyValidator()];
  }

  private getPriorityValidators() {
    return [Validators.required, Validators.min(1), Validators.max(99)];
  }

  private getHoursValidators() {
    return [Validators.required, Validators.min(1), Validators.max(99999)];
  }

  private getEffectiveDateValidators() {
    return [Validators.required, DateFieldValidationUtility.validDateValidator(), DateFieldValidationUtility.effectiveDateNotPastValidator()];
  }

  private getEditModeEffectiveDateValidators(): ValidatorFn[] {
    return [Validators.required, DateFieldValidationUtility.validDateValidator(), this.effectiveDateEditValidator()];
  }

  private effectiveDateEditValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const currentValue = moment.isMoment(control.value) ? control.value : moment(control.value);
      if (!currentValue.isValid()) return null;

      const originalDate = this.originalValues.effectiveDate;
      if (originalDate && currentValue.isSame(moment(originalDate), 'day')) {
        return null;
      }

      if (currentValue.isBefore(this.chapterCurrentDate, 'day')) {
        return { effectiveDatePast: true };
      }

      return null;
    };
  }

  ngOnInit(): void {
    this.setupPanel();
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
      this.panelTitle = 'Add New Order Class';
    } else {
      this.panelTitle = 'Edit Order Class';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      orderClass: '',
      effectiveDate: null
    };

    this.form.reset({
      orderClass: '',
      description: '',
      priority: null,
      hours: null,
      displayInOrders: false,
      effectiveDate: null,
      terminationDate: null
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('orderClass')?.enable();

    // Restore required validators for add mode
    this.form.get('orderClass')?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(2), noWhitespaceOnlyValidator(), codeFieldValidator()]);
    this.form.get('description')?.setValidators([noWhitespaceOnlyValidator()]);
    this.form.get('priority')?.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
    this.form.get('hours')?.setValidators([Validators.required, Validators.min(1), Validators.max(99999)]);
    this.form.get('effectiveDate')?.setValidators([Validators.required, DateFieldValidationUtility.validDateValidator(), DateFieldValidationUtility.effectiveDateNotPastValidator()]);
    this.form.get('terminationDate')?.setValidators([DateFieldValidationUtility.validDateValidator(), DateFieldValidationUtility.terminationDateNotPastValidator()]);

    // Update validity
    this.form.get('orderClass')?.updateValueAndValidity();
    this.form.get('description')?.updateValueAndValidity();
    this.form.get('priority')?.updateValueAndValidity();
    this.form.get('hours')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();
    this.form.get('terminationDate')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const orderClass = this.data.orderClass || '';
      const description = this.data.description || '';
      const priority = this.data.priority ?? null;
      const hours = this.data.hours ?? null;
      const displayInOrders = this.data.displayFlag === 'Y';

      // Store original values for update API (chapterId needed for API)
      this.originalValues = {
        orderClass: orderClass,
        chapterId: this.data.chapterId || '',
        effectiveDate: this.data.effectiveDate || null
      };

      this.editModeValues = {
        orderClass,
        effectiveDate: this.data.effectiveDate || null
      };

      // Disable non-editable fields in edit mode (only orderClass)
      this.form.get('orderClass')?.disable();

      // In edit mode, orderClass is not editable
      // Clear validators for disabled fields
      this.form.get('orderClass')?.clearValidators();

      // Ensure validators are active for editable fields in edit mode
      this.form.get('description')?.setValidators(this.getDescriptionValidators());
      this.form.get('priority')?.setValidators(this.getPriorityValidators());
      this.form.get('hours')?.setValidators(this.getHoursValidators());
      this.form.get('effectiveDate')?.setValidators(this.getEditModeEffectiveDateValidators());
      this.form.get('terminationDate')?.setValidators([
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator()
      ]);

      // Update validity
      this.form.get('orderClass')?.updateValueAndValidity();
      this.form.get('description')?.updateValueAndValidity();
      this.form.get('priority')?.updateValueAndValidity();
      this.form.get('hours')?.updateValueAndValidity();
      this.form.get('effectiveDate')?.updateValueAndValidity();
      this.form.get('terminationDate')?.updateValueAndValidity();

      this.form.patchValue({
        orderClass,
        description,
        priority,
        hours,
        displayInOrders,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      this.form.markAsPristine();
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Format date for API - returns YYYY-MM-DD string without timezone
   */
  private formatDateForApi(date: moment.Moment | Date): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    return moment(date).format('YYYY-MM-DD');
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const chapterId = this.headerService.chapterId() ?? '';

      // Create DTO for adding new record
      const addPayload: OrderClassCodesDto = {
        orderClass: formValue.orderClass?.trim().toUpperCase() || '',
        chapterId: chapterId,
        description: formValue.description?.trim() || '',
        priority: formValue.priority ?? 0,
        hours: formValue.hours ?? 0,
        displayFlag: formValue.displayInOrders ? 'Y' : 'N',
        effectiveDate: formValue.effectiveDate ? this.formatDateForApi(formValue.effectiveDate) : null,
        terminationDate: formValue.terminationDate ? this.formatDateForApi(formValue.terminationDate) : null
      };
      apiCall = this.orderClassCodesService.addOrderClassCode(addPayload);
    } else {
      const chapterId = this.headerService.chapterId() ?? this.originalValues.chapterId ?? '';

      // Create DTO for updating existing record
      const updatePayload: UpdateOrderClassCodesDto = {
        orderClass: this.originalValues.orderClass,
        chapterId: chapterId,
        description: formValue.description?.trim() || '',
        priority: formValue.priority ?? 0,
        hours: formValue.hours ?? 0,
        displayFlag: formValue.displayInOrders ? 'Y' : 'N',
        effectiveDate: formValue.effectiveDate ? this.formatDateForApi(formValue.effectiveDate) : null,
        terminationDate: formValue.terminationDate ? this.formatDateForApi(formValue.terminationDate) : null
      };
      apiCall = this.orderClassCodesService.updateOrderClassCode(updatePayload);
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
          let message = response?.message;

          if (!message) {
            if (this.mode === 'add') {
              const orderClassName = formValue.orderClass?.trim().toUpperCase() || '';
              message = `Order Class ${orderClassName} added successfully`;
            } else {
              const orderClassName = this.originalValues.orderClass || '';
              message = `Order Class ${orderClassName} updated successfully`;
            }
          }

          this.snackBar.open(message, 'Dismiss', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: OrderClassFormData = {
            orderClass: formValue.orderClass?.trim().toUpperCase() || '',
            chapterId: this.mode === 'add'
              ? (this.headerService.chapterId() ?? '')
              : (this.originalValues.chapterId || ''),
            description: formValue.description?.trim() || '',
            priority: formValue.priority ?? 0,
            hours: formValue.hours ?? 0,
            displayFlag: formValue.displayInOrders ? 'Y' : 'N',
            effectiveDate: formValue.effectiveDate ? this.formatDateForApi(formValue.effectiveDate) : null,
            terminationDate: formValue.terminationDate ? this.formatDateForApi(formValue.terminationDate) : null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('Error saving order class:', error);

          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This order class already exists';
            } else if (error.status === 404) {
              errorMessage = 'Order class not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

        }
      });
  }

  get orderClassControl() {
    return this.form.get('orderClass');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get priorityControl() {
    return this.form.get('priority');
  }

  get hoursControl() {
    return this.form.get('hours');
  }

  get displayInOrdersControl() {
    return this.form.get('displayInOrders');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  getOrderClassError(): string {
    const control = this.orderClassControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Order Class is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Order Class cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Order Class must contain at least one letter or number';
    }
    if (control.hasError('minlength') || control.hasError('maxlength')) {
      return 'Order Class must be exactly 2 characters';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('whitespaceOnly')) {
      return 'Description cannot contain only spaces';
    }
    return '';
  }

  getPriorityError(): string {
    const control = this.priorityControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Priority is required';
    }
    if (control.hasError('min') || control.hasError('max')) {
      return 'Priority must be between 1 and 99';
    }
    return '';
  }

  getHoursError(): string {
    const control = this.hoursControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Hours is required';
    }
    if (control.hasError('min') || control.hasError('max')) {
      return 'Hours must be between 1 and 99999';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective Date cannot be past date';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Individual field validation first
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('terminationDatePast') || control.hasError('matDatepickerMin')) {
      // Determine whether this is a past date or a cross-field range issue
      const termValue = control.value;
      const termMoment = termValue ? (moment.isMoment(termValue) ? termValue : moment(termValue)) : null;

      if (!termMoment || !termMoment.isValid() || termMoment.isBefore(this.chapterCurrentDate, 'day')) {
        return 'Termination Date cannot be past date';
      }

      // Termination date is >= chapter date, check cross-field range
      const effControl = this.form.get('effectiveDate');
      const effValue = effControl?.value;
      const effMoment = effValue ? (moment.isMoment(effValue) ? effValue : moment(effValue)) : null;

      // Only show range error when effective date is also valid and >= chapter date
      if (effMoment && effMoment.isValid() && !effMoment.isBefore(this.chapterCurrentDate, 'day') && !effControl?.errors) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get effectiveDateMinDate(): moment.Moment | null {
    return this.mode === 'add' ? this.minDate : null;
  }

  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (this.mode === 'add' || !date) return true;
    const originalDate = this.originalValues.effectiveDate;
    if (originalDate && date.isSame(moment(originalDate), 'day')) {
      return true;
    }
    return !date.isBefore(this.chapterCurrentDate, 'day');
  };

  get terminationMinDate(): moment.Moment {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      if (effMoment.isValid() && effMoment.isAfter(this.chapterCurrentDate, 'day')) {
        return effMoment;
      }
    }
    return this.chapterCurrentDate;
  }

  get isSaveButtonEnabled(): boolean {
    if (this.mode === 'add') {
      // Add mode: enable when form is valid
      return this.form.valid;
    } else {
      // Edit mode: enable only when form is valid AND has been modified
      return this.form.valid && this.form.dirty;
    }
  }

  onNumberKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(event.key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow: Home, End, Arrow keys
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }

    // Prevent: e, E, +, -, .
    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
      event.preventDefault();
      return;
    }

    // Ensure it's a number (0-9)
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onHoursInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^0-9]/g, '');

    // Limit to 5 characters (max is 99999)
    if (inputValue.length > 5) {
      inputValue = inputValue.slice(0, 5);
    }

    const value = parseInt(inputValue, 10);

    // Enforce max value of 99999
    if (!isNaN(value) && value > 99999) {
      input.value = '99999';
      this.form.patchValue({ hours: 99999 });
    } else if (inputValue !== input.value) {
      input.value = inputValue;
      this.form.patchValue({ hours: value || null });
    }
  }

  onPriorityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^0-9]/g, '');

    // Limit to 2 characters (max is 99)
    if (inputValue.length > 2) {
      inputValue = inputValue.slice(0, 2);
    }

    const value = parseInt(inputValue, 10);

    // Enforce max value of 99
    if (!isNaN(value) && value > 99) {
      input.value = '99';
      this.form.patchValue({ priority: 99 });
    } else if (inputValue !== input.value) {
      input.value = inputValue;
      this.form.patchValue({ priority: value || null });
    }
  }

  onOrderClassInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Convert to uppercase
    inputValue = inputValue.toUpperCase();

    // Update input value and form control
    if (inputValue !== input.value) {
      input.value = inputValue;
      this.form.patchValue({ orderClass: inputValue }, { emitEvent: false });
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

  /**
   * Format date for display in DD-MMM-YYYY format (uppercase month)
   */
  formatDate(date: Date | moment.Moment | null): string {
    if (!date) return '-';
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.format('DD-MMM-YYYY').toUpperCase();
  }

}
