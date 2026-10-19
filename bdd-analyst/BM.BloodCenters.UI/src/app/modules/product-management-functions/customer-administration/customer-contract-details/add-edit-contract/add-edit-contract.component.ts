import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';

import {
  CustomerContractDto,
  CreateCustomerContractRequestDto,
  UpdateCustomerContractRequestDto
} from '../models/customer-contract.model';
import { CustomerContractApiService } from '../services/customer-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-add-edit-contract-panel',
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
    MatMomentDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-contract.component.html',
  styleUrls: ['./add-edit-contract.component.scss']
})
export class AddEditContractComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-contract-${AddEditContractComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() data: CustomerContractDto | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() customerName: string = '';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private service = inject(CustomerContractApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  contractForm!: FormGroup;
  isSaving = false;
  lastModifiedDisplay = '';

  rotationOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];

  minDate!: Moment;
  terminationMinDate!: Moment;
  lastChangedDateField: 'effective' | 'start' | 'end' | 'termination' | null = null;
  effDateErrorMatcher!: ErrorStateMatcher;
  startTermErrorMatcher!: ErrorStateMatcher;
  endTermErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  private originalEffectiveDate: Moment | null = null;
  private originalTermDate: Moment | null = null;

  terminationDateFilter = (d: Moment | null): boolean => {
    if (!d) return true;
    const effDate = this.contractForm?.get('effectiveDate')?.value;
    if (!effDate || !moment.isMoment(effDate) || !effDate.isValid()) return true;
    return d.isSameOrAfter(effDate, 'day');
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.initForm();
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
    this.startTermErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getStartTermError());
    this.endTermErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEndTermError());
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.terminationMinDate = this.minDate;
    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.contractForm, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.contractForm, this.chapterOffset);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get panelTitle(): string {
    const name = this.customerName || this.data?.customerName || '';
    if (this.mode === 'add') {
      return name ? `Add Contract for ${name}` : 'Add New Contract';
    }
    return name ? `Edit Contract for ${name}` : 'Edit Contract';
  }

  get effectiveDateDisplay(): string {
    if (!this.data?.effDate) return '--';
    return DateFieldValidationUtility.formatDateForUI(moment(this.data.effDate));
  }

  get isSaveEnabled(): boolean {
    if (!this.contractForm.valid) return false;
    if (this.mode === 'edit') return this.isFormValid;
    return true;
  }

  get isFormValid(): boolean {
    if (!this.contractForm.valid) return false;
    if (this.mode === 'edit') {
      const formValue = this.contractForm.getRawValue();
      const currentEff = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
      const effDateChanged = currentEff && this.originalEffectiveDate
        ? !currentEff.isSame(this.originalEffectiveDate, 'day')
        : currentEff !== this.originalEffectiveDate;
      const currentTerm = formValue.terminationDate ? moment(formValue.terminationDate) : null;
      const termDateChanged = currentTerm && this.originalTermDate
        ? !currentTerm.isSame(this.originalTermDate, 'day')
        : currentTerm !== this.originalTermDate;

      const originalRotation = this.data?.rotationFlag === 'Y' ? 'Yes' : this.data?.rotationFlag === 'N' ? 'No' : null;
      const rotationChanged = (formValue.rotation || null) !== originalRotation;
      const poNumberChanged = (formValue.poNumber || null) !== (this.data?.poNumber || null);
      const creditLimitChanged = (formValue.creditLimit || null) !== (this.data?.creditLimit || null);
      const startTermChanged = (formValue.startTerm ? moment(formValue.startTerm).format('YYYY-MM-DD') : null) !== (this.data?.startTerm || null);
      const endTermChanged = (formValue.endTerm ? moment(formValue.endTerm).format('YYYY-MM-DD') : null) !== (this.data?.endTerm || null);

      return effDateChanged || termDateChanged || rotationChanged || poNumberChanged ||
             creditLimitChanged || startTermChanged || endTermChanged;
    }
    return true;
  }

  private initForm(): void {
    this.contractForm = this.fb.group({
      rotation: [null],
      poNumber: [null, [Validators.maxLength(12)]],
      creditLimit: [null, [Validators.required, Validators.min(0), Validators.max(9999999.99)]],
      startTerm: [null],
      endTerm: [null],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        this.startEndTermValidator
      ]
    });
  }

  private startEndTermValidator(group: AbstractControl): ValidationErrors | null {
    const startTerm = group.get('startTerm')?.value;
    const endTerm = group.get('endTerm')?.value;

    if (startTerm && endTerm) {
      const start = moment(startTerm);
      const end = moment(endTerm);

      if (start.isValid() && end.isValid() && end.isBefore(start)) {
        return { endTermBeforeStartTerm: true };
      }
    }

    return null;
  }

  private setupDateValidationListeners(): void {
    this.contractForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.contractForm.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.contractForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    this.contractForm.get('startTerm')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        this.contractForm.get('endTerm')?.updateValueAndValidity({ emitEvent: false });
      });

    this.contractForm.get('endTerm')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
      });
  }

  private populateForm(): void {
    if (this.mode === 'edit' && this.data) {
      const effDate = this.data.effDate ? moment(this.data.effDate) : null;
      this.originalEffectiveDate = effDate;
      const termDate = this.data.termDate ? moment(this.data.termDate) : null;
      this.originalTermDate = termDate;

      this.contractForm.patchValue({
        rotation: this.data.rotationFlag === 'Y' ? 'Yes' : this.data.rotationFlag === 'N' ? 'No' : null,
        poNumber: this.data.poNumber || null,
        creditLimit: this.data.creditLimit || null,
        startTerm: this.data.startTerm ? moment(this.data.startTerm) : null,
        endTerm: this.data.endTerm ? moment(this.data.endTerm) : null,
        effectiveDate: effDate,
        terminationDate: termDate
      });

      DateFieldValidationUtility.setupEditModeValidators(this.contractForm, this.chapterOffset);

      this.lastModifiedDisplay = this.data.lastModifiedDate
        ? `Last Modified: ${this.formatLastModified(this.data.lastModifiedDate)}`
        : '';
    } else {
      this.originalEffectiveDate = null;
      this.originalTermDate = null;
      this.lastModifiedDisplay = '';
      this.contractForm.reset();

      DateFieldValidationUtility.setupAddModeValidators(this.contractForm, this.chapterOffset);
    }

    this.contractForm.markAsPristine();
    this.contractForm.markAsUntouched();
  }

  private formatLastModified(dateStr: string): string {
    const m = moment(dateStr);
    if (!m.isValid()) return dateStr;
    const datePart = m.format('DD-MMM-YYYY').toUpperCase();
    const timePart = m.format('hh:mm A');
    const tzAbbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || '';
    return `${datePart}, ${timePart} ${tzAbbr}`;
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        this.updateTerminationMinDate();
      });
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.contractForm?.get('effectiveDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.contractForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.contractForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.contractForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.contractForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  getStartTermError(): string {
    const formErrors = this.lastChangedDateField === 'start' ? this.contractForm.errors : null;
    const control = this.contractForm.get('startTerm');
    if (!control) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate') || control.hasError('invalidDateFormat')) {
      return 'Invalid date format. Use DD-MMM-YYYY';
    }

    if (formErrors?.['endTermBeforeStartTerm']) {
      return 'Start Term must be on or before End Term';
    }

    return '';
  }

  getEndTermError(): string {
    const formErrors = this.lastChangedDateField === 'end' ? this.contractForm.errors : null;
    const control = this.contractForm.get('endTerm');
    if (!control) return '';

    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate') || control.hasError('invalidDateFormat')) {
      return 'Invalid date format. Use DD-MMM-YYYY';
    }

    if (control.hasError('matDatepickerMin')) {
      return 'End Term must be on or after Start Term';
    }

    if (formErrors?.['endTermBeforeStartTerm']) {
      return 'End Term must be on or after Start Term';
    }

    return '';
  }

  private hasStartEndTermErrors(): boolean {
    const startTerm = this.contractForm.get('startTerm');
    const endTerm = this.contractForm.get('endTerm');
    const hasStartError = startTerm?.hasError('matDatepickerParse') || startTerm?.hasError('invalidDate') || startTerm?.hasError('invalidDateFormat');
    const hasEndError = endTerm?.hasError('matDatepickerParse') || endTerm?.hasError('invalidDate') || endTerm?.hasError('invalidDateFormat') || endTerm?.hasError('matDatepickerMin');
    const hasFormError = this.contractForm.hasError('endTermBeforeStartTerm');
    return !!(hasStartError || hasEndError || hasFormError);
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.contractForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.contractForm.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  onStartTermChange(): void {
    this.contractForm.get('endTerm')?.updateValueAndValidity();
    this.contractForm.get('startTerm')?.markAsTouched();
  }

  onEndTermChange(): void {
    this.contractForm.get('endTerm')?.markAsTouched();
  }

  endTermDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const startTerm = this.contractForm?.get('startTerm')?.value;
    if (startTerm) {
      const startDay = moment(startTerm).startOf('day');
      if (checkDate.isBefore(startDay)) {
        return false;
      }
    }
    return true;
  };

  onStartTermInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.contractForm.get('startTerm'),
      this.mode === 'edit'
    );
  }

  onEndTermInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.contractForm.get('endTerm'),
      this.mode === 'edit'
    );
  }

  onDateFieldKeyPress(event: KeyboardEvent): void {
    const key = event.key;
    if (
      key === 'Backspace' || key === 'Delete' || key === 'Tab' ||
      key === 'Escape' || key === 'Enter' ||
      key === 'ArrowLeft' || key === 'ArrowRight' ||
      key === 'ArrowUp' || key === 'ArrowDown' ||
      key === 'Home' || key === 'End' ||
      event.ctrlKey || event.metaKey
    ) {
      return;
    }
    if (!/[0-9\-]/.test(key)) {
      event.preventDefault();
    }
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    document.execCommand('insertText', false, numericOnly);
  }

  onSave(): void {
    this.contractForm.markAllAsTouched();

    if (this.contractForm.errors?.['dateRangeInvalid']) return;
    if (this.hasStartEndTermErrors()) return;

    DateFieldValidationUtility.clearOptionalDateErrors(this.contractForm, 'terminationDate');

    if (!this.contractForm.valid) return;
    if (!this.data) return;

    this.isSaving = true;
    const formValue = this.mode === 'edit' ? this.contractForm.getRawValue() : this.contractForm.value;

    if (this.mode === 'add') {
      this.createContract(formValue, false);
    } else {
      this.updateContract(formValue);
    }
  }

  onAddAndCreateAnother(): void {
    this.contractForm.markAllAsTouched();

    if (this.contractForm.errors?.['dateRangeInvalid']) return;
    if (this.hasStartEndTermErrors()) return;

    DateFieldValidationUtility.clearOptionalDateErrors(this.contractForm, 'terminationDate');

    if (this.mode !== 'add' || !this.contractForm.valid || !this.data) return;

    this.isSaving = true;
    this.createContract(this.contractForm.value, true);
  }

  private createContract(formValue: any, keepOpen: boolean): void {
    const dto: CreateCustomerContractRequestDto = {
      creditLimit: formValue.creditLimit ?? 0,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      rotationFlag: formValue.rotation === 'Yes' ? 'Y' : formValue.rotation === 'No' ? 'N' : null,
      poNumber: formValue.poNumber || null,
      startTerm: DateFieldValidationUtility.serializeDateForApi(formValue.startTerm),
      endTerm: DateFieldValidationUtility.serializeDateForApi(formValue.endTerm),
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.createCustomerContract(this.data!.customerId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `New contract added to Customer ID ${this.data!.customerId}.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          if (keepOpen) {
            this.contractForm.reset();
            this.contractForm.markAsPristine();
            this.contractForm.markAsUntouched();
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to add contract.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  private updateContract(formValue: any): void {
    const dto: UpdateCustomerContractRequestDto = {
      contractId: this.data!.contractId || '',
      creditLimit: formValue.creditLimit ?? 0,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      rotationFlag: formValue.rotation === 'Yes' ? 'Y' : formValue.rotation === 'No' ? 'N' : null,
      poNumber: formValue.poNumber || null,
      startTerm: DateFieldValidationUtility.serializeDateForApi(formValue.startTerm),
      endTerm: DateFieldValidationUtility.serializeDateForApi(formValue.endTerm),
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.updateCustomerContract(
      this.data!.customerId,
      this.data!.contractId || '',
      dto
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `Contract for Customer ID ${this.data!.customerId} is saved.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to update contract.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  onClearAll(): void {
    if (this.mode === 'edit') {
      this.contractForm.patchValue({
        rotation: this.data?.rotationFlag === 'Y' ? 'Yes' : this.data?.rotationFlag === 'N' ? 'No' : null,
        poNumber: this.data?.poNumber || null,
        creditLimit: this.data?.creditLimit || null,
        startTerm: this.data?.startTerm ? moment(this.data.startTerm) : null,
        endTerm: this.data?.endTerm ? moment(this.data.endTerm) : null,
        effectiveDate: this.originalEffectiveDate,
        terminationDate: this.originalTermDate
      });
    } else {
      this.contractForm.reset();
    }
    this.contractForm.markAsDirty();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

}
