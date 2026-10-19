import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';

import {
  CustomerProfileDto,
  CreateCustomerProfileRequestDto,
  CustomerTypeDto,
  StateCodeDto,
  PayeeDto,
  PlasmaFileTypeDto,
  CUSTOMER_PROFILE_CONSTRAINTS
} from '../../models/customer-profile.model';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import {
  ynFlagValidator,
  returnAcceptedFlagValidator,
  numericOnlyValidator,
  stateRequiredWhenDomesticValidator,
  phoneNumberValidator,
  applyZipValidators,
  DOMESTIC_ZIP_MAX_LENGTH
} from '../../validators/customer-profile.validators';

@Component({
  selector: 'app-step-customer-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    LoadingSpinnerComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './step-customer-profile.html',
  styleUrls: ['./step-customer-profile.scss']
})
export class StepCustomerProfileComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `step-customer-profile-${StepCustomerProfileComponent.nextId++}`;

  @Input() savedData: CustomerProfileDto | null = null;
  @Output() saveSuccess = new EventEmitter<CustomerProfileDto>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AddCustomerWizardApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  // Form
  customerForm!: FormGroup;

  // State signals
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  // Dropdown options
  protected readonly customerTypes = signal<CustomerTypeDto[]>([]);
  protected readonly stateCodes = signal<StateCodeDto[]>([]);
  protected readonly payees = signal<PayeeDto[]>([]);
  protected readonly plasmaTypes = signal<PlasmaFileTypeDto[]>([]);

  // Filtered options for searchable dropdowns
  protected filteredCustomerTypes: CustomerTypeDto[] = [];
  protected filteredStateCodes: StateCodeDto[] = [];
  protected filteredPayees: PayeeDto[] = [];
  protected filteredPlasmaTypes: PlasmaFileTypeDto[] = [];

  // Search controls for dropdowns
  protected customerTypeSearchCtrl = new FormControl<string>('');
  protected stateSearchCtrl = new FormControl<string>('');
  protected payeeSearchCtrl = new FormControl<string>('');
  protected plasmaTypeSearchCtrl = new FormControl<string>('');

  // Date constraints
  protected minDate!: Moment;
  protected terminationMinDate!: Moment;
  protected today!: Moment;

  protected zipMaxLength = 5;

  protected get isInternational(): boolean {
    return this.customerForm?.get('intFlag')?.value === 'Y';
  }

  protected get f() {
    return this.customerForm.controls;
  }

  // Helper methods for unique IDs
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.terminationMinDate = this.minDate;

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const tz = this.headerService.chapterTimeZone();
        this.minDate = DateFieldValidationUtility.getMinDate(tz);
        this.updateTerminationMinDate();
        this.customerForm.get('effDate')?.setValidators([
          Validators.required,
          DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
        ]);
        this.customerForm.get('effDate')?.updateValueAndValidity();
        this.customerForm.get('termDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator(tz)]);
        this.customerForm.get('termDate')?.updateValueAndValidity();
      });

    this.loadDropdownData();
    this.setupFormListeners();
    this.setupSearchControls();

    // Populate form with savedData if available
    if (this.savedData) {
      this.customerForm.patchValue({
        name: this.savedData.name,
        customerType: this.savedData.customerType,
        shortName: this.savedData.shortName,
        alphaKey: this.savedData.alphaKey,
        intFlag: this.savedData.intFlag || 'N',
        address1: this.savedData.address1,
        address2: this.savedData.address2,
        address3: this.savedData.address3,
        city: this.savedData.city,
        state: this.savedData.state,
        zip: this.savedData.zip,
        country: this.savedData.country,
        phoneNo: this.savedData.phoneNo,
        faxNo: this.savedData.faxNo,
        intPhone: this.savedData.intPhone,
        telexNo: this.savedData.telexNo,
        codFlag: this.savedData.codFlag,
        returnAcceptedFlag: this.savedData.returnAcceptedFlag,
        arAccount: this.savedData.arAccount,
        fiPriceSchNo: this.savedData.fiPriceSchNo,
        priceChangeFlag: this.savedData.priceChangeFlag,
        ednGenFlag: this.savedData.ednGenFlag,
        plasmaFileType: this.savedData.plasmaFileType,
        phApprFlag: this.savedData.phApprFlag,
        insApprFlag: this.savedData.insApprFlag,
        payeeId: this.savedData.payeeId
      });
      // Handle dates with moment conversion
      if (this.savedData.effDate) {
        this.customerForm.get('effDate')?.setValue(moment(this.savedData.effDate));
      }
      if (this.savedData.termDate) {
        this.customerForm.get('termDate')?.setValue(moment(this.savedData.termDate));
      }
    } else {
      // Set defaults for new customer
      this.customerForm.patchValue({
        intFlag: 'N',
        country: 'USA'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.NAME.MAX_LENGTH)
      ]],
      customerType: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.CUSTOMER_TYPE.MAX_LENGTH)
      ]],
      shortName: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.SHORT_NAME.MAX_LENGTH)
      ]],
      alphaKey: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.ALPHA_KEY.MAX_LENGTH)
      ]],
      intFlag: ['N', [ynFlagValidator()]],
      address1: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.ADDRESS1.MAX_LENGTH)
      ]],
      address2: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.ADDRESS2.MAX_LENGTH)
      ]],
      address3: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.ADDRESS3.MAX_LENGTH)
      ]],
      city: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.CITY.MAX_LENGTH)
      ]],
      state: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)
      ]],
      zip: ['', [
        Validators.required,
        Validators.maxLength(DOMESTIC_ZIP_MAX_LENGTH),
        Validators.pattern(/^[0-9]*$/)
      ]],
      country: ['USA', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.COUNTRY.MAX_LENGTH)
      ]],
      phoneNo: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.PHONE_NO.MAX_LENGTH),
        phoneNumberValidator()
      ]],
      faxNo: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.FAX_NO.MAX_LENGTH),
        phoneNumberValidator()
      ]],
      intPhone: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.INT_PHONE.MAX_LENGTH)
      ]],
      telexNo: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.TELEX_NO.MAX_LENGTH)
      ]],
      codFlag: ['', [
        Validators.required,
        ynFlagValidator()
      ]],
      returnAcceptedFlag: ['', [
        Validators.required,
        returnAcceptedFlagValidator()
      ]],
      arAccount: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.AR_ACCOUNT.MAX_LENGTH)
      ]],
      fiPriceSchNo: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.FI_PRICE_SCH_NO.MAX_LENGTH),
        numericOnlyValidator()
      ]],
      ednGenFlag: ['', [ynFlagValidator()]],
      plasmaFileType: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.PLASMA_FILE_TYPE.MAX_LENGTH)
      ]],
      effDate: [null, [
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]],
      termDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())]],
      payeeId: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.PAYEE_ID.MAX_LENGTH)
      ]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private loadDropdownData(): void {
    this.loading.set(true); this.loadingChange.emit(true);

    // Load customer types
    this.apiService.getCustomerTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.customerTypes.set(types);
          this.filteredCustomerTypes = types;
        },
        error: (err) => {
          this.showErrorAndAutoDismiss('Failed to load customer types');
          console.error('Error loading customer types:', err);
        }
      });

    // Load state codes
    this.apiService.getStateCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.stateCodes.set(states);
          this.filteredStateCodes = states;
        },
        error: (err) => {
          this.showErrorAndAutoDismiss('Failed to load state codes');
          console.error('Error loading state codes:', err);
        }
      });

    // Load payees
    this.apiService.getPayees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payees) => {
          this.payees.set(payees);
          this.filteredPayees = payees;
        },
        error: (err) => {
          this.showErrorAndAutoDismiss('Failed to load payees');
          console.error('Error loading payees:', err);
        }
      });

    // Load plasma types
    this.apiService.getPlasmaFileTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.plasmaTypes.set(types);
          this.filteredPlasmaTypes = types;
          this.loading.set(false); this.loadingChange.emit(false);
        },
        error: (err) => {
          this.showErrorAndAutoDismiss('Failed to load plasma file types');
          console.error('Error loading plasma file types:', err);
          this.loading.set(false); this.loadingChange.emit(false);
        }
      });
  }

  private setupFormListeners(): void {
    // Re-validate termination date when effective date changes
    this.customerForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.customerForm.get('termDate')?.updateValueAndValidity();
      });

    // Toggle state required and zip format based on intFlag
    this.customerForm.get('intFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const isIntl = value === 'Y';
        this.zipMaxLength = isIntl ? 10 : 5;
        const stateCtrl = this.customerForm.get('state');
        if (isIntl) {
          stateCtrl?.clearValidators();
          stateCtrl?.setValidators([Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)]);
        } else {
          stateCtrl?.setValidators([Validators.required, Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)]);
        }
        stateCtrl?.updateValueAndValidity();
        applyZipValidators(this.customerForm.get('zip'), isIntl);
      });
  }

  private setupSearchControls(): void {
    // Customer Type search
    this.customerTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterCustomerTypes(searchTerm || '');
      });

    // State search
    this.stateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterStateCodes(searchTerm || '');
      });

    // Payee search
    this.payeeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterPayees(searchTerm || '');
      });

    // Plasma Type search
    this.plasmaTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterPlasmaTypes(searchTerm || '');
      });
  }

  private filterCustomerTypes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredCustomerTypes = this.customerTypes().filter(
      (type) =>
        type.code.toLowerCase().includes(search) ||
        type.description.toLowerCase().includes(search)
    );
  }

  private filterStateCodes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredStateCodes = this.stateCodes().filter(
      (state) =>
        state.code.toLowerCase().includes(search) ||
        state.description.toLowerCase().includes(search)
    );
  }

  private filterPayees(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredPayees = this.payees().filter(
      (payee) =>
        payee.customerId.toLowerCase().includes(search) ||
        payee.name.toLowerCase().includes(search)
    );
  }

  private filterPlasmaTypes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredPlasmaTypes = this.plasmaTypes().filter(
      (type) =>
        type.code.toLowerCase().includes(search) ||
        type.description.toLowerCase().includes(search)
    );
  }

  protected toUpperCase(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.toUpperCase();
    input.setSelectionRange(start, end);
  }

  protected onlyNumbers(event: KeyboardEvent): boolean {
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

  protected stripPhoneOnFocus(controlName: string): void {
    const ctrl = this.customerForm.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  protected formatPhoneOnBlur(controlName: string): void {
    const ctrl = this.customerForm.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    } else if (digits.length === 7) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3)}`, { emitEvent: false });
    }
  }

  private stripPhone(value: string | null): string | null {
    return value ? value.replace(/\D/g, '') : value;
  }

  protected getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.customerForm);
  }

  protected getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateError(this.customerForm);
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    this.customerForm.markAllAsTouched();

    if (this.customerForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.showErrorAndAutoDismiss('Please correct the errors in the form');
      return;
    }

    this.saving.set(true); this.savingChange.emit(true);

    const formValue = this.customerForm.getRawValue();
    const isUpdate = !!this.savedData?.customerId;

    const toUpper = (v: string | null) => v ? v.toUpperCase() : v;

    const payload: CreateCustomerProfileRequestDto = {
      customerId: isUpdate ? this.savedData!.customerId : '',
      name: formValue.name,
      customerType: formValue.customerType,
      shortName: toUpper(formValue.shortName)!,
      alphaKey: toUpper(formValue.alphaKey) || null,
      intFlag: formValue.intFlag || 'N',
      address1: formValue.address1,
      address2: formValue.address2 || null,
      address3: formValue.address3 || null,
      city: toUpper(formValue.city)!,
      state: formValue.state || null,
      zip: toUpper(formValue.zip)!,
      country: toUpper(formValue.country)!,
      phoneNo: this.stripPhone(formValue.phoneNo) || null,
      phoneExt: null,
      faxNo: this.stripPhone(formValue.faxNo) || null,
      intPhone: toUpper(formValue.intPhone) || null,
      telexNo: toUpper(formValue.telexNo) || null,
      codFlag: formValue.codFlag,
      returnAcceptedFlag: formValue.returnAcceptedFlag,
      arAccount: toUpper(formValue.arAccount)!,
      fiPriceSchNo: formValue.fiPriceSchNo || null,
      priceChangeFlag: null,
      ednGenFlag: formValue.ednGenFlag || null,
      plasmaFileType: formValue.plasmaFileType || null,
      phApprFlag: null,
      insApprFlag: null,
      effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : '',
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      payeeId: formValue.payeeId || null
    };

    const apiCall = isUpdate
      ? this.apiService.updateCustomerProfile(this.savedData!.customerId, payload)
      : this.apiService.createCustomerProfile(payload);

    apiCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.saving.set(false); this.savingChange.emit(false);
          this.snackbarService.showSuccess(
            isUpdate ? 'Customer profile updated successfully' : 'Customer profile created successfully'
          );
          this.saveSuccess.emit(result);
        },
        error: (err) => {
          this.saving.set(false); this.savingChange.emit(false);
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to save customer profile';
          this.showErrorAndAutoDismiss(errorMessage);
          console.error('Error saving customer profile:', err);
        }
      });
  }

  protected onEffectiveDateChange(): void {
    this.customerForm.get('termDate')?.updateValueAndValidity();
    this.customerForm.get('effDate')?.markAsTouched();
  }

  protected onTerminationDateChange(): void {
    this.customerForm.get('termDate')?.markAsTouched();
  }

  protected onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.customerForm.get('effDate')
    );
  }

  protected onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.customerForm.get('termDate')
    );
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.customerForm?.get('effDate')?.value;
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

  protected terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.customerForm?.get('effDate')?.value;

    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

}
