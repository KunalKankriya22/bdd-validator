import { Component, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DefineOperatorsService } from '../services/define-operators.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  ValidOperator,
  CreateValidOperator,
  UpdateValidOperator,
  VALUE_STYLE_OPTIONS
} from '../models/define-operators.model';

@Component({
  selector: 'app-add-edit-operator',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
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
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-operator.html',
  styleUrls: ['./add-edit-operator.scss']
})
export class AddEditOperator implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidOperator | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @ViewChild('closeBtn', { read: ElementRef }) closeBtnRef!: ElementRef<HTMLButtonElement>;

  public focus(): void {
    setTimeout(() => this.closeBtnRef?.nativeElement?.focus(), 50);
  }

  form: FormGroup;
  panelTitle: string = '';

  valueStyleOptions = VALUE_STYLE_OPTIONS;
  filteredValueStyleOptions = [...VALUE_STYLE_OPTIONS];
  valueStyleSearchControl = new FormControl('');

  editModeValues: {
    operator: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
    operator: '',
    effectiveDate: '',
    terminationDate: ''
  };

  isSaving = false;
  minDate: moment.Moment = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private termDateBlurred = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();
  private dateSubscriptionsInitialized = false;

  constructor(
    private fb: FormBuilder,
    private defineOperatorsService: DefineOperatorsService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      operator: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Za-z0-9 ]+$/), noWhitespaceOnlyValidator()]],
      description: ['', [Validators.required, Validators.maxLength(100), noWhitespaceOnlyValidator()]],
      valueStyle: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupDateSubscriptions();
    this.valueStyleSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredValueStyleOptions = this.valueStyleOptions.filter(
          (o) => o.label.toLowerCase().includes(search) || o.value.toLowerCase().includes(search)
        );
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    this.termDateBlurred = false;
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Operator';
      this.resetFormForAddMode();
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.panelTitle = 'Edit Operator';
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    }
  }

  /**
   * Setup date field subscriptions for:
   * - Tracking which date field was last changed (for cross-field error display)
   * Only initializes once to prevent duplicate subscriptions
   */
  private setupDateSubscriptions(): void {
    if (this.dateSubscriptionsInitialized) return;
    this.dateSubscriptionsInitialized = true;

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      operator: '',
      effectiveDate: '',
      terminationDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('operator')?.enable();
    this.form.get('operator')?.setValidators([Validators.required, Validators.maxLength(10), noWhitespaceOnlyValidator(), codeFieldValidator()]);
    this.form.get('valueStyle')?.setValidators([Validators.required]);
    this.form.get('effectiveDate')?.setValidators([Validators.required]);
    this.form.get('description')?.setValidators([Validators.required, Validators.maxLength(100), noWhitespaceOnlyValidator()]);
    this.form.get('terminationDate')?.clearValidators();

    this.form.get('operator')?.updateValueAndValidity();
    this.form.get('valueStyle')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();
    this.form.get('description')?.updateValueAndValidity();
    this.form.get('terminationDate')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.editModeValues = {
        operator: this.data.operator || '',
        effectiveDate: this.data.effectiveDate ? this.formatDateForDisplay(this.data.effectiveDate) : '',
        terminationDate: this.data.terminationDate ? this.formatDateForDisplay(this.data.terminationDate) : ''
      };

      this.form.patchValue({
        operator: this.data.operator,
        description: this.data.description || '',
        valueStyle: this.data.valueStyle,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      }, { emitEvent: false });

      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.mode === 'add' && this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    if (this.mode === 'add') {
      const addPayload: CreateValidOperator = {
        operator: formValue.operator?.trim() || '',
        description: formValue.description?.trim() || undefined,
        valueStyle: formValue.valueStyle,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) ?? undefined
      };

      this.defineOperatorsService.addValidOperator(addPayload)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Operator added successfully';
            this.snackBar.open(message, 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            this.handleSaveError(error);
          }
        });
    } else {
      const updatePayload: UpdateValidOperator = {
        operator: formValue.operator?.trim(),
        description: formValue.description?.trim() || undefined,
        valueStyle: formValue.valueStyle,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) ?? undefined
      };

      this.defineOperatorsService.updateValidOperator(this.editModeValues.operator, updatePayload)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Operator updated successfully';
            this.snackBar.open(message, 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            this.handleSaveError(error);
          }
        });
    }
  }

  private handleSaveError(error: any): void {
    console.error('Error saving valid operator:', error);
  }

  getOperatorError(): string {
    const control = this.form.get('operator');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Operator is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Operator cannot contain only spaces';
    }
    if (control.hasError('pattern')) {
      return 'Only alphanumeric characters allowed';
    }
    if (control.hasError('maxlength')) {
      return 'Operator must not exceed 10 characters';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.form.get('description');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Description is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Description cannot contain only spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Description must not exceed 100 characters';
    }
    return '';
  }

  getValueStyleError(): string {
    const control = this.form.get('valueStyle');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Values is required';
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
    const error = DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
    if (error) return error;

    if (this.mode === 'edit') {
      const termControl = this.form.get('terminationDate');
      if (termControl && this.termDateBlurred && termControl.value) {
        const selectedDate = moment.isMoment(termControl.value) ? termControl.value : moment(termControl.value);
        if (selectedDate.isValid()) {
          const today = DateFieldValidationUtility.getMinDate();
          if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
            return 'Termination date cannot be past date';
          }
        }
      }
    }

    return '';
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

  onTerminationDateBlur(): void {
    this.termDateBlurred = true;
    const termControl = this.form.get('terminationDate');
    if (termControl) {
      termControl.markAsTouched();
    }
  }

  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' && !this.form.get(controlName)?.value?.trim()) {
      event.preventDefault();
    }
  }

  preventNonAlphanumeric(event: KeyboardEvent, controlName: string): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    // Block leading space
    if (event.key === ' ' && !this.form.get(controlName)?.value?.trim()) {
      event.preventDefault();
      return;
    }

    // Allow spaces (not leading) and alphanumeric
    if (event.key === ' ') return;

    if (!/^[A-Za-z0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  preventNonAlphanumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^[A-Za-z0-9 ]+$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  get isFormActionDisabled(): boolean {
    if (this.mode === 'edit') {
      if (this.isSaving || !this.form.dirty) return true;
      return this.termDateBlurred && this.getTerminationDateError() !== '';
    }
    return this.form.invalid || this.isSaving;
  }
}
