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
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { CustomerProfileDto, StateCodeDto, CUSTOMER_PROFILE_CONSTRAINTS } from '../../models/customer-profile.model';
import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import {
  phoneNumberValidator,
  applyZipValidators,
  DOMESTIC_ZIP_MAX_LENGTH
} from '../../validators/customer-profile.validators';

@Component({
  selector: 'app-step-payee-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    LoadingSpinnerComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './step-payee-details.html',
  styleUrls: ['./step-payee-details.scss']
})
export class StepPayeeDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `payee-details-${StepPayeeDetailsComponent.nextId++}`;

  @Input() customerData: CustomerProfileDto | null = null;
  @Input() savedData: any = null;
  @Output() saveSuccess = new EventEmitter<CustomerProfileDto>();
  @Output() savingChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AddCustomerWizardApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  payeeForm!: FormGroup;

  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  // Dropdown options
  protected readonly stateCodes = signal<StateCodeDto[]>([]);
  protected readonly zones = signal<{ code: string; description: string }[]>([]);

  // Filtered options for searchable dropdowns
  protected filteredStateCodes: StateCodeDto[] = [];
  protected filteredZones: { code: string; description: string }[] = [];

  // Search controls for dropdowns
  protected stateSearchCtrl = new FormControl<string>('');
  protected zoneSearchCtrl = new FormControl<string>('');

  protected today!: Moment;
  protected minDate!: Moment;
  protected terminationMinDate!: Moment;

  protected zipMaxLength = 5;

  protected get isInternational(): boolean {
    return this.payeeForm?.get('intFlag')?.value === 'Y';
  }

  protected get f() {
    return this.payeeForm.controls;
  }

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
        this.payeeForm.get('effDate')?.setValidators([
          Validators.required,
          DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
        ]);
        this.payeeForm.get('effDate')?.updateValueAndValidity();
        this.payeeForm.get('termDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator(tz)]);
        this.payeeForm.get('termDate')?.updateValueAndValidity();
      });

    this.loadStateCodes();
    this.loadZones();
    this.setupFormListeners();
    this.setupSearchControls();

    // Populate form with savedData if available
    if (this.savedData) {
      this.payeeForm.patchValue({
        payeeName: this.savedData.name,
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
        intFax: this.savedData.telexNo,
        zone: this.savedData.zone,
        outOfState: this.savedData.outOfState
      });
      // Handle dates with moment conversion
      if (this.savedData.effDate) {
        this.payeeForm.get('effDate')?.setValue(moment(this.savedData.effDate));
      }
      if (this.savedData.termDate) {
        this.payeeForm.get('termDate')?.setValue(moment(this.savedData.termDate));
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.payeeForm = this.fb.group({
      payeeName: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.NAME.MAX_LENGTH)
      ]],
      shortName: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.SHORT_NAME.MAX_LENGTH)
      ]],
      alphaKey: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.ALPHA_KEY.MAX_LENGTH)
      ]],
      sameAsCustomer: [false],
      intFlag: ['N'],
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
      intFax: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.FAX_NO.MAX_LENGTH)
      ]],
      zone: [''],
      outOfState: [''],
      effDate: [null, [
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]],
      termDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private loadStateCodes(): void {
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
  }

  private loadZones(): void {
    this.apiService.getZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zones) => { this.zones.set(zones); this.filteredZones = zones; },
        error: (err) => console.error('Error loading zones:', err)
      });
  }

  private setupSearchControls(): void {
    this.stateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => this.filterStateCodes(searchTerm || ''));

    this.zoneSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredZones = this.zones().filter(z =>
          z.code.toLowerCase().includes(search) || z.description.toLowerCase().includes(search));
      });
  }

  private filterStateCodes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredStateCodes = this.stateCodes().filter(
      (state) =>
        state.code.toLowerCase().includes(search) ||
        state.description.toLowerCase().includes(search)
    );
  }

  private setupFormListeners(): void {
    // Copy customer data when "Same as customer?" is checked
    this.payeeForm.get('sameAsCustomer')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((checked) => {
        if (checked && this.customerData) {
          this.payeeForm.patchValue({
            payeeName: this.customerData.name || '',
            shortName: this.customerData.shortName || '',
            alphaKey: this.customerData.alphaKey || '',
            intFlag: this.customerData.intFlag || 'N',
            address1: this.customerData.address1 || '',
            address2: this.customerData.address2 || '',
            address3: this.customerData.address3 || '',
            city: this.customerData.city || '',
            state: this.customerData.state || '',
            zip: this.customerData.zip || '',
            country: this.customerData.country || 'USA',
            phoneNo: this.customerData.phoneNo || '',
            faxNo: this.customerData.faxNo || '',
            intPhone: this.customerData.intPhone || '',
            intFax: this.customerData.telexNo || '',
            effDate: this.customerData.effDate ? moment(this.customerData.effDate) : null,
            termDate: this.customerData.termDate ? moment(this.customerData.termDate) : null
          });
        }
      });

    // Re-validate termination date when effective date changes
    this.payeeForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.payeeForm.get('termDate')?.updateValueAndValidity();
      });

    // Handle international flag changes - update state and zip validators
    this.payeeForm.get('intFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const isIntl = value === 'Y';
        this.zipMaxLength = isIntl ? 10 : 5;
        const stateCtrl = this.payeeForm.get('state');
        if (isIntl) {
          stateCtrl?.clearValidators();
          stateCtrl?.setValidators([Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)]);
        } else {
          stateCtrl?.setValidators([
            Validators.required,
            Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)
          ]);
        }
        stateCtrl?.updateValueAndValidity();
        applyZipValidators(this.payeeForm.get('zip'), isIntl);
      });
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
    const ctrl = this.payeeForm.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  protected formatPhoneOnBlur(controlName: string): void {
    const ctrl = this.payeeForm.get(controlName);
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

  protected toUpperCase(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.toUpperCase();
    input.setSelectionRange(start, end);
  }

  protected getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.payeeForm);
  }

  protected getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateError(this.payeeForm);
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.payeeForm?.get('effDate')?.value;
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

  protected onSubmit(): void {
    this.submitted.set(true);
    this.payeeForm.markAllAsTouched();

    if (this.payeeForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.showErrorAndAutoDismiss('Please correct the errors in the form');
      return;
    }

    this.saving.set(true); this.savingChange.emit(true);

    const formValue = this.payeeForm.getRawValue();
    const isUpdate = !!this.savedData?.customerId;
    const toUpper = (v: string | null) => v ? v.toUpperCase() : v;

    // Create payload for payee customer (type 'PA')
    const payload = {
      customerId: isUpdate ? this.savedData.customerId : '',
      name: formValue.payeeName,
      customerType: 'PA',
      shortName: toUpper(formValue.shortName) || formValue.payeeName.substring(0, 15).toUpperCase(),
      alphaKey: toUpper(formValue.alphaKey),
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
      telexNo: toUpper(formValue.intFax) || null,
      codFlag: 'N',
      returnAcceptedFlag: 'Y',
      arAccount: 'N/A',
      fiPriceSchNo: null,
      priceChangeFlag: null,
      ednGenFlag: null,
      plasmaFileType: null,
      phApprFlag: null,
      insApprFlag: null,
      effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : '',
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      payeeId: null
    };

    const apiCall = isUpdate
      ? this.apiService.updateCustomerProfile(this.savedData.customerId, payload)
      : this.apiService.createCustomerProfile(payload);

    apiCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.saving.set(false); this.savingChange.emit(false);
          this.saveSuccess.emit(result);
        },
        error: (err) => {
          this.saving.set(false); this.savingChange.emit(false);
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to save payee details';
          this.showErrorAndAutoDismiss(errorMessage);
          console.error('Error saving payee details:', err);
        }
      });
  }

  protected onEffectiveDateChange(): void {
    this.payeeForm.get('termDate')?.updateValueAndValidity();
    this.payeeForm.get('effDate')?.markAsTouched();
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  protected onTerminationDateChange(): void {
    this.payeeForm.get('termDate')?.markAsTouched();
  }

  protected onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.payeeForm.get('effDate')
    );
  }

  protected onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.payeeForm.get('termDate')
    );
  }

  protected terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.payeeForm?.get('effDate')?.value;

    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

}
