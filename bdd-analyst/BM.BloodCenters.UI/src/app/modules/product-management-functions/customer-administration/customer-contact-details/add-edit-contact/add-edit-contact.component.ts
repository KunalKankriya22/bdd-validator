import {
  Component, EventEmitter, Input, Output,
  OnInit, OnChanges, OnDestroy, SimpleChanges, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  CustomerContactDto,
  ContactTypeDto,
  CreateCustomerContactRequestDto,
  UpdateCustomerContactRequestDto
} from '../models/customer-contact.model';

interface ContactFormValue {
  contactType: string | null;
  firstName: string | null;
  lastName: string | null;
  salutation: string | null;
  title: string | null;
  dayPhoneNo: string | null;
  nightPhoneNo: string | null;
  faxNo: string | null;
  effectiveDate: Moment | null;
  terminationDate: Moment | null;
}
import { CustomerContactApiService } from '../services/customer-contact-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { phoneNumberValidator } from '../../customer-profile/validators/customer-profile.validators';

@Component({
  selector: 'app-add-edit-contact-panel',
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
  templateUrl: './add-edit-contact.component.html',
  styleUrls: ['./add-edit-contact.component.scss']
})
export class AddEditContactComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-contact-${AddEditContactComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() data: CustomerContactDto | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() customerName: string = '';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private service = inject(CustomerContactApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  contactForm!: FormGroup;
  isSaving = false;
  lastModifiedDisplay = '';
  formValidationMessage = '';
  private initialized = false;

  contactTypeOptions: ContactTypeDto[] = [];
  isLoadingContactTypes = false;

  minDate!: Moment;
  terminationMinDate!: Moment;
  lastChangedDateField: 'effective' | 'termination' | null = null;
  protected readonly effDateError = signal('');
  protected readonly termDateError = signal('');
  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  private originalEffectiveDate: Moment | null = null;
  private originalTermDate: Moment | null = null;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.initForm();
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.effDateError()
    );
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.termDateError()
    );
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.terminationMinDate = this.minDate;
    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();
    this.loadContactTypes();
    this.populateForm();
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && (changes['mode'] || changes['data'])) {
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
      return name ? `Add New Contact for ${name}` : 'Add New Contact';
    }
    return name ? `Edit Contact for ${name}` : 'Edit Contact';
  }

  get effectiveDateDisplay(): string {
    if (!this.data?.effDate) return '--';
    return DateFieldValidationUtility.formatDateForUI(moment(this.data.effDate));
  }

  get isSaveEnabled(): boolean {
    if (!this.contactForm.valid) return false;
    if (this.mode === 'edit') return this.isFormChanged;
    return true;
  }

  get isFormChanged(): boolean {
    if (!this.contactForm.valid) return false;
    const v = this.contactForm.getRawValue();
    const currentEff = v.effectiveDate ? moment(v.effectiveDate) : null;
    const effChanged = currentEff && this.originalEffectiveDate
      ? !currentEff.isSame(this.originalEffectiveDate, 'day')
      : currentEff !== this.originalEffectiveDate;
    const currentTerm = v.terminationDate ? moment(v.terminationDate) : null;
    const termChanged = currentTerm && this.originalTermDate
      ? !currentTerm.isSame(this.originalTermDate, 'day')
      : currentTerm !== this.originalTermDate;

    return (v.contactType || null) !== (this.data?.contactType || null)
      || (v.firstName || null) !== (this.data?.firstName || null)
      || (v.lastName || null) !== (this.data?.lastName || null)
      || (v.salutation || null) !== (this.data?.salutation || null)
      || (v.title || null) !== (this.data?.title || null)
      || (v.dayPhoneNo || null) !== (this.data?.dayPhoneNo || null)
      || (v.nightPhoneNo || null) !== (this.data?.nightPhoneNo || null)
      || (v.faxNo || null) !== (this.data?.faxNo || null)
      || effChanged
      || termChanged;
  }

  private static readonly namePattern = /^[A-Za-zÀ-ÿ'\-. ]+$/;

  private initForm(): void {
    this.contactForm = this.fb.group({
      contactType: [null, [Validators.required]],
      firstName: [null, [Validators.required, Validators.maxLength(50), Validators.pattern(AddEditContactComponent.namePattern)]],
      lastName: [null, [Validators.required, Validators.maxLength(50), Validators.pattern(AddEditContactComponent.namePattern)]],
      salutation: [null, [Validators.maxLength(10), Validators.pattern(AddEditContactComponent.namePattern)]],
      title: [null, [Validators.maxLength(10), Validators.pattern(AddEditContactComponent.namePattern)]],
      dayPhoneNo: [null, [Validators.required, Validators.maxLength(20), phoneNumberValidator()]],
      nightPhoneNo: [null, [Validators.maxLength(20), phoneNumberValidator()]],
      faxNo: [null, [Validators.maxLength(20), phoneNumberValidator()]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });
  }

  private loadContactTypes(): void {
    this.isLoadingContactTypes = true;
    this.service.getContactTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.contactTypeOptions = types;
          this.isLoadingContactTypes = false;
        },
        error: () => {
          this.isLoadingContactTypes = false;
        }
      });
  }

  private setupDateValidationListeners(): void {
    this.contactForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.contactForm.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        this.updateDateErrors();
      });

    this.contactForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.updateDateErrors();
      });
  }

  private updateDateErrors(): void {
    const effFormErrors = this.lastChangedDateField === 'effective' ? this.contactForm.errors : null;
    this.effDateError.set(
      DateFieldValidationUtility.getStartDateCrossFieldError(
        this.contactForm.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        effFormErrors
      )
    );

    const termFormErrors = this.lastChangedDateField === 'termination' ? this.contactForm.errors : null;
    this.termDateError.set(
      DateFieldValidationUtility.getEndDateCrossFieldError(
        this.contactForm.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        termFormErrors
      )
    );
  }

  private populateForm(): void {
    if (this.mode === 'edit' && this.data) {
      const effDate = this.data.effDate ? moment(this.data.effDate) : null;
      this.originalEffectiveDate = effDate;
      const termDate = this.data.termDate ? moment(this.data.termDate) : null;
      this.originalTermDate = termDate;

      this.contactForm.patchValue({
        contactType: this.data.contactType || null,
        firstName: this.data.firstName || null,
        lastName: this.data.lastName || null,
        salutation: this.data.salutation || null,
        title: this.data.title || null,
        dayPhoneNo: this.data.dayPhoneNo || null,
        nightPhoneNo: this.data.nightPhoneNo || null,
        faxNo: this.data.faxNo || null,
        effectiveDate: effDate,
        terminationDate: termDate
      });

      DateFieldValidationUtility.setupEditModeValidators(this.contactForm, this.chapterOffset);
      const effControl = this.contactForm.get('effectiveDate');
      if (effControl) {
        effControl.enable({ emitEvent: false });
        effControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        effControl.updateValueAndValidity({ emitEvent: false });
      }

      this.lastModifiedDisplay = this.data.lastModifiedDate
        ? `Last Modified: ${this.formatLastModified(this.data.lastModifiedDate)}`
        : '';
    } else {
      this.originalEffectiveDate = null;
      this.originalTermDate = null;
      this.lastModifiedDisplay = '';
      this.contactForm.reset();
      DateFieldValidationUtility.setupAddModeValidators(this.contactForm, this.chapterOffset);
    }

    this.contactForm.markAsPristine();
    this.contactForm.markAsUntouched();
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
    const effectiveValue = this.contactForm?.get('effectiveDate')?.value;
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
    const formErrors = this.lastChangedDateField === 'effective' ? this.contactForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.contactForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.contactForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.contactForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.contactForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.contactForm.get('terminationDate'),
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
    if (!/[0-9a-zA-Z\-]/.test(key)) {
      event.preventDefault();
    }
  }

  stripPhoneOnFocus(controlName: string): void {
    const ctrl = this.contactForm.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  formatPhoneOnBlur(controlName: string): void {
    const ctrl = this.contactForm.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    } else if (digits.length === 7) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3)}`, { emitEvent: false });
    }
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const char = event.key;
    if (char === 'Backspace' || char === 'Tab' || char === 'Delete' ||
        char === 'ArrowLeft' || char === 'ArrowRight' || char === 'Home' || char === 'End') {
      return true;
    }
    if (event.ctrlKey || event.metaKey) return true;
    if (char < '0' || char > '9') {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onSave(): void {
    this.formValidationMessage = '';
    this.contactForm.markAllAsTouched();

    if (this.mode === 'edit') {
      const formErrors = this.contactForm.errors;
      if (formErrors?.['dateRangeInvalid']) {
        this.formValidationMessage = 'Please correct the errors in the form before saving.';
        return;
      }
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.contactForm, 'terminationDate');

    if (!this.contactForm.valid) {
      const invalidCount = Object.keys(this.contactForm.controls)
        .filter(k => this.contactForm.get(k)?.invalid).length;
      this.formValidationMessage = `Please correct ${invalidCount} error${invalidCount > 1 ? 's' : ''} in the form before saving.`;
      return;
    }
    if (!this.data) return;

    this.isSaving = true;
    const formValue = (this.mode === 'edit'
      ? this.contactForm.getRawValue()
      : this.contactForm.value) as ContactFormValue;

    if (this.mode === 'add') {
      this.createContact(formValue, false);
    } else {
      this.updateContact(formValue);
    }
  }

  onAddAndCreateAnother(): void {
    this.formValidationMessage = '';
    this.contactForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.contactForm, 'terminationDate');

    if (this.mode !== 'add' || !this.contactForm.valid || !this.data) {
      if (!this.contactForm.valid) {
        const invalidCount = Object.keys(this.contactForm.controls)
          .filter(k => this.contactForm.get(k)?.invalid).length;
        this.formValidationMessage = `Please correct ${invalidCount} error${invalidCount > 1 ? 's' : ''} in the form before saving.`;
      }
      return;
    }

    this.isSaving = true;
    this.createContact(this.contactForm.value as ContactFormValue, true);
  }

  private createContact(formValue: ContactFormValue, keepOpen: boolean): void {
    const dto: CreateCustomerContactRequestDto = {
      customerId: this.data!.customerId,
      contactType: formValue.contactType!,
      firstName: formValue.firstName!,
      lastName: formValue.lastName!,
      dayPhoneNo: this.stripPhone(formValue.dayPhoneNo) || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      salutation: formValue.salutation || null,
      title: formValue.title || null,
      nightPhoneNo: this.stripPhone(formValue.nightPhoneNo) || null,
      faxNo: this.stripPhone(formValue.faxNo) || null,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.createCustomerContact(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `New contact added to Customer ID ${this.data!.customerId}.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          if (keepOpen) {
            this.contactForm.reset();
            this.contactForm.markAsPristine();
            this.contactForm.markAsUntouched();
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to add contact.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  private updateContact(formValue: ContactFormValue): void {
    const dto: UpdateCustomerContactRequestDto = {
      instId: this.data!.instId || '',
      newContactType: formValue.contactType !== this.data?.contactType
        ? (formValue.contactType || null)
        : null,
      firstName: formValue.firstName || null,
      lastName: formValue.lastName || null,
      salutation: formValue.salutation || null,
      title: formValue.title || null,
      dayPhoneNo: this.stripPhone(formValue.dayPhoneNo) || null,
      nightPhoneNo: this.stripPhone(formValue.nightPhoneNo) || null,
      faxNo: this.stripPhone(formValue.faxNo) || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.updateCustomerContact(
      this.data!.customerId,
      this.data!.contactType || '',
      dto
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `Contact for Customer ID ${this.data!.customerId} is saved.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to update contact.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  onClearAll(): void {
    if (this.mode === 'edit') {
      this.contactForm.patchValue({
        contactType: this.data?.contactType || null,
        firstName: this.data?.firstName || null,
        lastName: this.data?.lastName || null,
        salutation: this.data?.salutation || null,
        title: this.data?.title || null,
        dayPhoneNo: this.data?.dayPhoneNo || null,
        nightPhoneNo: this.data?.nightPhoneNo || null,
        faxNo: this.data?.faxNo || null,
        effectiveDate: this.originalEffectiveDate,
        terminationDate: this.originalTermDate
      });
    } else {
      this.contactForm.reset();
    }
    this.contactForm.markAsDirty();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private stripPhone(value: string | null): string | null {
    return value ? value.replace(/\D/g, '') : value;
  }
}
