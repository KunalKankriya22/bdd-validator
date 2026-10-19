import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';

import {
  PayeeCustomerDto,
  CreatePayeeCustomerRequestDto,
  UpdatePayeeCustomerRequestDto,
  PAYEE_CONSTRAINTS
} from '../models/customer-payee.model';
import { CustomerProfileDto } from '../../customer-profile/models/customer-profile.model';
import { CustomerPayeeApiService } from '../services/customer-payee-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  phoneNumberValidator,
  applyZipValidators,
  DOMESTIC_ZIP_MAX_LENGTH,
  DOMESTIC_ZIP_PATTERN
} from '../../customer-profile/validators/customer-profile.validators';

@Component({
  selector: 'app-add-edit-payee-panel',
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
    MatMomentDateModule,
    MatCheckboxModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-payee.component.html',
  styleUrls: ['./add-edit-payee.component.scss']
})
export class AddEditPayeeComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-payee-${AddEditPayeeComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() data: PayeeCustomerDto | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() customerName: string = '';
  @Input() customerProfile: CustomerProfileDto | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private service = inject(CustomerPayeeApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  payeeForm!: FormGroup;
  isSaving = false;
  lastModifiedDisplay = '';
  readonly constraints = PAYEE_CONSTRAINTS;

  states: { code: string; description: string }[] = [];
  filteredStates: { code: string; description: string }[] = [];
  stateSearchCtrl = new FormControl<string>('');

  zones: { code: string; description: string }[] = [];
  filteredZones: { code: string; description: string }[] = [];
  zoneSearchCtrl = new FormControl<string>('');

  outOfStateOptions = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];

  minDate!: Moment;
  terminationMinDate!: Moment;
  lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  private originalEffectiveDate: Moment | null = null;
  private originalTermDate: Moment | null = null;

  terminationDateFilter = (d: Moment | null): boolean => {
    if (!d) return true;
    const effDate = this.payeeForm?.get('effectiveDate')?.value;
    if (!effDate || !moment.isMoment(effDate) || !effDate.isValid()) return true;
    return d.isSameOrAfter(effDate, 'day');
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.initForm();
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.terminationMinDate = this.minDate;
    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();
    this.setupCheckboxListeners();
    this.loadStateCodes();
    this.setupStateSearch();
    this.loadZones();
    this.setupZoneSearch();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.payeeForm, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.payeeForm, this.chapterOffset);
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
    const name = this.customerName || '';
    if (this.mode === 'add') {
      return name ? `Add New Payee for ${name}` : 'Add New Payee';
    }
    return name ? `Edit Payee for ${name}` : 'Edit Payee';
  }

  get isSaveEnabled(): boolean {
    if (!this.payeeForm.valid) return false;
    if (this.mode === 'edit') return this.hasFormChanged;
    return true;
  }

  get hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.data) return true;
    const v = this.payeeForm.getRawValue();
    const changed =
      (v.name || '') !== (this.data.name || '') ||
      (v.shortName || '') !== (this.data.shortName || '') ||
      (v.address1 || '') !== (this.data.address1 || '') ||
      (v.address2 || '') !== (this.data.address2 || '') ||
      (v.address3 || '') !== (this.data.address3 || '') ||
      (v.city || '') !== (this.data.city || '') ||
      (v.state || '') !== (this.data.state || '') ||
      (v.zip || '') !== (this.data.zip || '') ||
      (v.country || '') !== (this.data.country || '') ||
      (v.zone || '') !== (this.data.zone || '') ||
      (v.outOfState || '') !== (this.data.outOfState || '') ||
      (v.phoneNo || '') !== (this.data.phoneNo || '') ||
      (v.faxNo || '') !== (this.data.faxNo || '') ||
      (v.intPhone || '') !== (this.data.intPhone || '') ||
      (v.telexNo || '') !== (this.data.telexNo || '') ||
      !!v.internationalAddress !== (this.data.intFlag === 'Y');

    const currentEff = v.effectiveDate ? moment(v.effectiveDate) : null;
    const effChanged = currentEff && this.originalEffectiveDate
      ? !currentEff.isSame(this.originalEffectiveDate, 'day')
      : currentEff !== this.originalEffectiveDate;

    const currentTerm = v.terminationDate ? moment(v.terminationDate) : null;
    const termChanged = currentTerm && this.originalTermDate
      ? !currentTerm.isSame(this.originalTermDate, 'day')
      : currentTerm !== this.originalTermDate;

    return changed || !!effChanged || !!termChanged;
  }

  private initForm(): void {
    this.payeeForm = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(PAYEE_CONSTRAINTS.NAME.MAX_LENGTH)]],
      shortName: [null, [Validators.required, Validators.maxLength(PAYEE_CONSTRAINTS.SHORT_NAME.MAX_LENGTH)]],
      sameAsCustomer: [false],
      internationalAddress: [false],
      address1: [null, [Validators.required, Validators.maxLength(PAYEE_CONSTRAINTS.ADDRESS_1.MAX_LENGTH)]],
      address2: [null, [Validators.maxLength(PAYEE_CONSTRAINTS.ADDRESS_2.MAX_LENGTH)]],
      address3: [null, [Validators.maxLength(PAYEE_CONSTRAINTS.ADDRESS_3.MAX_LENGTH)]],
      city: [null, [Validators.required, Validators.maxLength(PAYEE_CONSTRAINTS.CITY.MAX_LENGTH)]],
      state: [null, [Validators.required]],
      zip: [null, [Validators.required, Validators.maxLength(DOMESTIC_ZIP_MAX_LENGTH), Validators.pattern(DOMESTIC_ZIP_PATTERN)]],
      country: [PAYEE_CONSTRAINTS.COUNTRY.DEFAULT, [Validators.required, Validators.maxLength(PAYEE_CONSTRAINTS.COUNTRY.MAX_LENGTH)]],
      zone: [null],
      outOfState: [null],
      phoneNo: [null, [Validators.maxLength(PAYEE_CONSTRAINTS.PHONE_NO.MAX_LENGTH), phoneNumberValidator()]],
      faxNo: [null, [Validators.maxLength(PAYEE_CONSTRAINTS.FAX_NO.MAX_LENGTH), phoneNumberValidator()]],
      intPhone: [null, [Validators.maxLength(PAYEE_CONSTRAINTS.INT_PHONE.MAX_LENGTH)]],
      telexNo: [null, [Validators.maxLength(PAYEE_CONSTRAINTS.TELEX_NO.MAX_LENGTH)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });
  }

  private setupCheckboxListeners(): void {
    this.payeeForm.get('sameAsCustomer')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((checked: boolean) => {
        this.onSameAsCustomerChange(checked);
      });

    this.payeeForm.get('internationalAddress')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((checked: boolean) => {
        this.onInternationalAddressChange(checked);
      });
  }

  private onSameAsCustomerChange(checked: boolean): void {
    const addressFields = ['address1', 'address2', 'address3', 'city', 'state', 'zip', 'country', 'phoneNo', 'faxNo', 'intPhone', 'telexNo'];
    if (checked && this.customerProfile) {
      this.payeeForm.patchValue({
        name: this.customerProfile.name || '',
        shortName: this.customerProfile.shortName || '',
        address1: this.customerProfile.address1 || '',
        address2: this.customerProfile.address2 || '',
        address3: this.customerProfile.address3 || '',
        city: this.customerProfile.city || '',
        state: this.customerProfile.state || '',
        zip: this.customerProfile.zip || '',
        country: this.customerProfile.country || PAYEE_CONSTRAINTS.COUNTRY.DEFAULT,
        phoneNo: this.customerProfile.phoneNo || '',
        faxNo: this.customerProfile.faxNo || '',
        intPhone: this.customerProfile.intPhone || '',
        telexNo: this.customerProfile.telexNo || '',
        internationalAddress: this.customerProfile.intFlag === 'Y',
        effectiveDate: this.customerProfile.effDate ? moment(this.customerProfile.effDate) : null,
        terminationDate: this.customerProfile.termDate ? moment(this.customerProfile.termDate) : null
      });
    }
  }

  private onInternationalAddressChange(checked: boolean): void {
    const stateControl = this.payeeForm.get('state');
    if (checked) {
      stateControl?.clearValidators();
    } else {
      stateControl?.setValidators([Validators.required]);
    }
    stateControl?.updateValueAndValidity();
    applyZipValidators(this.payeeForm.get('zip'), checked);
  }

  private setupDateValidationListeners(): void {
    this.payeeForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.payeeForm.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.payeeForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private populateForm(): void {
    if (this.mode === 'edit' && this.data) {
      const effDate = this.data.effDate ? moment(this.data.effDate) : null;
      this.originalEffectiveDate = effDate;
      const termDate = this.data.termDate ? moment(this.data.termDate) : null;
      this.originalTermDate = termDate;

      const isInternational = this.data.intFlag === 'Y';

      this.payeeForm.patchValue({
        name: this.data.name || null,
        shortName: this.data.shortName || null,
        sameAsCustomer: false,
        internationalAddress: isInternational,
        address1: this.data.address1 || null,
        address2: this.data.address2 || null,
        address3: this.data.address3 || null,
        city: this.data.city || null,
        state: this.data.state || null,
        zip: this.data.zip || null,
        country: this.data.country || PAYEE_CONSTRAINTS.COUNTRY.DEFAULT,
        zone: this.data.zone || null,
        outOfState: this.data.outOfState || null,
        phoneNo: this.data.phoneNo || null,
        faxNo: this.data.faxNo || null,
        intPhone: this.data.intPhone || null,
        telexNo: this.data.telexNo || null,
        effectiveDate: effDate,
        terminationDate: termDate
      });

      if (isInternational) {
        this.onInternationalAddressChange(true);
      }

      DateFieldValidationUtility.setupEditModeValidators(this.payeeForm, this.chapterOffset);

      this.lastModifiedDisplay = this.data.lastModifiedDate
        ? `Last Modified: ${this.formatLastModified(this.data.lastModifiedDate)}`
        : '';
    } else {
      this.originalEffectiveDate = null;
      this.originalTermDate = null;
      this.lastModifiedDisplay = '';
      this.payeeForm.reset({ country: PAYEE_CONSTRAINTS.COUNTRY.DEFAULT });
      DateFieldValidationUtility.setupAddModeValidators(this.payeeForm, this.chapterOffset);
    }

    this.payeeForm.markAsPristine();
    this.payeeForm.markAsUntouched();
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
    const effectiveValue = this.payeeForm?.get('effectiveDate')?.value;
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

  private loadStateCodes(): void {
    this.service.getStateCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states;
          this.filteredStates = states;
        },
        error: (err) => console.error('Error loading state codes:', err)
      });
  }

  private setupStateSearch(): void {
    this.stateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredStates = this.states.filter(s =>
          s.code.toLowerCase().includes(search) || s.description.toLowerCase().includes(search)
        );
      });
  }

  private loadZones(): void {
    this.service.getZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zones) => {
          this.zones = zones;
          this.filteredZones = zones;
        },
        error: (err) => console.error('Error loading zones:', err)
      });
  }

  private setupZoneSearch(): void {
    this.zoneSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredZones = this.zones.filter(z =>
          z.code.toLowerCase().includes(search) || z.description.toLowerCase().includes(search)
        );
      });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.payeeForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.payeeForm.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.payeeForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.payeeForm.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.payeeForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.payeeForm.get('terminationDate'),
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

  private focusFirstInvalidField(): void {
    const firstInvalidKey = Object.keys(this.payeeForm.controls)
      .find(key => this.payeeForm.controls[key].invalid);
    if (firstInvalidKey) {
      const el = document.querySelector(`[formControlName="${firstInvalidKey}"]`) as HTMLElement;
      el?.focus();
    }
  }

  onSave(): void {
    this.payeeForm.markAllAsTouched();

    if (this.mode === 'edit') {
      const formErrors = this.payeeForm.errors;
      if (formErrors?.['dateRangeInvalid']) return;
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.payeeForm, 'terminationDate');

    if (!this.payeeForm.valid) {
      this.focusFirstInvalidField();
      return;
    }
    if (this.mode === 'edit' && !this.hasFormChanged) return;

    this.isSaving = true;
    const formValue = this.payeeForm.getRawValue();

    if (this.mode === 'add') {
      this.createPayee(formValue, false);
    } else {
      this.updatePayee(formValue);
    }
  }

  onAddAndCreateAnother(): void {
    this.payeeForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.payeeForm, 'terminationDate');

    if (this.mode !== 'add' || !this.payeeForm.valid) {
      if (!this.payeeForm.valid) this.focusFirstInvalidField();
      return;
    }

    this.isSaving = true;
    this.createPayee(this.payeeForm.getRawValue(), true);
  }

  private buildAlphaKey(name: string): string {
    return (name || '').substring(0, PAYEE_CONSTRAINTS.ALPHA_KEY.MAX_LENGTH).toUpperCase().trim();
  }

  private createPayee(formValue: any, keepOpen: boolean): void {
    const dto: CreatePayeeCustomerRequestDto = {
      name: formValue.name || '',
      shortName: (formValue.shortName || '').toUpperCase(),
      alphaKey: this.buildAlphaKey(formValue.name),
      address1: formValue.address1 || '',
      address2: formValue.address2 || null,
      address3: formValue.address3 || null,
      city: formValue.city || '',
      state: formValue.state || null,
      zip: formValue.zip || '',
      country: formValue.country || PAYEE_CONSTRAINTS.COUNTRY.DEFAULT,
      zone: formValue.zone || null,
      outOfState: formValue.outOfState || null,
      phoneNo: this.stripPhone(formValue.phoneNo) || null,
      faxNo: this.stripPhone(formValue.faxNo) || null,
      intPhone: formValue.intPhone || null,
      telexNo: formValue.telexNo || null,
      intFlag: formValue.internationalAddress ? 'Y' : 'N',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.createPayee(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const newId = response?.item?.customerId || '';
          const message = response?.message || `Payee ${newId} has been added.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit(newId);
          if (keepOpen) {
            this.payeeForm.reset({ country: PAYEE_CONSTRAINTS.COUNTRY.DEFAULT });
            this.payeeForm.markAsPristine();
            this.payeeForm.markAsUntouched();
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to add payee.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  private updatePayee(formValue: any): void {
    const dto: UpdatePayeeCustomerRequestDto = {
      name: formValue.name || '',
      shortName: (formValue.shortName || '').toUpperCase(),
      alphaKey: this.buildAlphaKey(formValue.name),
      address1: formValue.address1 || '',
      address2: formValue.address2 || null,
      address3: formValue.address3 || null,
      city: formValue.city || '',
      state: formValue.state || null,
      zip: formValue.zip || '',
      country: formValue.country || PAYEE_CONSTRAINTS.COUNTRY.DEFAULT,
      zone: formValue.zone || null,
      outOfState: formValue.outOfState || null,
      phoneNo: this.stripPhone(formValue.phoneNo) || null,
      faxNo: this.stripPhone(formValue.faxNo) || null,
      intPhone: formValue.intPhone || null,
      telexNo: formValue.telexNo || null,
      intFlag: formValue.internationalAddress ? 'Y' : 'N',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.updatePayee(this.data!.customerId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const message = response?.message || `Changes in Payee ${this.data!.customerId} have been saved.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit('');
          this.closePanel.emit();
        },
        error: (error) => {
          this.isSaving = false;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to update payee.';
          this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
        }
      });
  }

  onClearAll(): void {
    if (this.mode === 'edit') {
      this.populateForm();
    } else {
      this.payeeForm.reset({ country: PAYEE_CONSTRAINTS.COUNTRY.DEFAULT });
    }
    this.payeeForm.markAsDirty();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  stripPhoneOnFocus(controlName: string): void {
    const ctrl = this.payeeForm.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  formatPhoneOnBlur(controlName: string): void {
    const ctrl = this.payeeForm.get(controlName);
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

  private stripPhone(value: string | null): string | null {
    return value ? value.replace(/\D/g, '') : value;
  }
}
