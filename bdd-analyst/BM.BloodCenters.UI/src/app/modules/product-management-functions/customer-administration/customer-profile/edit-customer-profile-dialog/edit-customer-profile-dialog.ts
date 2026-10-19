import {
  Component,
  Inject,
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
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, switchMap } from 'rxjs';

import {
  CustomerProfileDto,
  UpdateCustomerProfileRequestDto,
  CustomerTypeDto,
  StateCodeDto,
  PayeeDto,
  PlasmaFileTypeDto,
  CUSTOMER_PROFILE_CONSTRAINTS
} from '../models/customer-profile.model';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
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
  phoneNumberValidator,
  applyZipValidators,
  DOMESTIC_ZIP_MAX_LENGTH
} from '../validators/customer-profile.validators';

export interface EditCustomerProfileDialogData {
  customerProfile: CustomerProfileDto;
}

@Component({
  selector: 'app-edit-customer-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatCheckboxModule,
    NgxMatSelectSearchModule,
    LoadingSpinnerComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './edit-customer-profile-dialog.html',
  styleUrls: ['./edit-customer-profile-dialog.scss']
})
export class EditCustomerProfileDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `edit-customer-profile-dialog-${EditCustomerProfileDialog.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(CustomerProfileApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  customerForm!: FormGroup;

  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  protected readonly customerTypes = signal<CustomerTypeDto[]>([]);
  protected readonly stateCodes = signal<StateCodeDto[]>([]);
  protected readonly payees = signal<PayeeDto[]>([]);
  protected readonly plasmaTypes = signal<PlasmaFileTypeDto[]>([]);

  protected filteredCustomerTypes: CustomerTypeDto[] = [];
  protected filteredStateCodes: StateCodeDto[] = [];
  protected filteredPayees: PayeeDto[] = [];
  protected filteredPlasmaTypes: PlasmaFileTypeDto[] = [];

  protected customerTypeSearchCtrl = new FormControl<string>('');
  protected stateSearchCtrl = new FormControl<string>('');
  protected payeeSearchCtrl = new FormControl<string>('');
  protected plasmaTypeSearchCtrl = new FormControl<string>('');

  protected minDate!: Moment;
  protected terminationMinDate!: Moment;
  protected zipMaxLength = 15;
  protected lastModifiedDisplay = '';

  protected get isInternational(): boolean {
    return this.customerForm?.get('intFlag')?.value === 'Y';
  }

  protected get f() {
    return this.customerForm.controls;
  }

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  constructor(
    public dialogRef: MatDialogRef<EditCustomerProfileDialog>,
    @Inject(MAT_DIALOG_DATA) public data: EditCustomerProfileDialogData
  ) {
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
        this.customerForm.get('termDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator(tz)]);
        this.customerForm.get('termDate')?.updateValueAndValidity();
      });

    this.loadDropdownData();
    this.setupSearchControls();
    this.populateForm();
    this.setupFormListeners();
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
      effDate: [null, [Validators.required]],
      termDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())]],
      payeeId: ['', [
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.PAYEE_ID.MAX_LENGTH)
      ]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private populateForm(): void {
    const profile = this.data.customerProfile;

    this.customerForm.patchValue({
      name: profile.name,
      customerType: profile.customerType,
      shortName: profile.shortName,
      alphaKey: profile.alphaKey,
      intFlag: profile.intFlag || 'N',
      address1: profile.address1,
      address2: profile.address2,
      address3: profile.address3,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
      country: profile.country,
      phoneNo: profile.phoneNo,
      faxNo: profile.faxNo,
      intPhone: profile.intPhone,
      telexNo: profile.telexNo,
      codFlag: profile.codFlag,
      returnAcceptedFlag: profile.returnAcceptedFlag,
      arAccount: profile.arAccount,
      fiPriceSchNo: profile.fiPriceSchNo,
      ednGenFlag: profile.ednGenFlag,
      plasmaFileType: profile.plasmaFileType,
      payeeId: profile.payeeId
    });

    if (profile.effDate) {
      this.customerForm.get('effDate')?.setValue(moment(profile.effDate));
    }
    if (profile.termDate) {
      this.customerForm.get('termDate')?.setValue(moment(profile.termDate));
    }

    const isIntl = profile.intFlag === 'Y';
    this.zipMaxLength = isIntl ? 10 : 15;
    const stateCtrl = this.customerForm.get('state');
    if (isIntl) {
      stateCtrl?.clearValidators();
      stateCtrl?.setValidators([Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)]);
    }
    stateCtrl?.updateValueAndValidity();
    applyZipValidators(this.customerForm.get('zip'), isIntl);

    DateFieldValidationUtility.setupEditModeValidators(this.customerForm);
    // Re-enable effDate: API skips past-date check on update (isUpdate=true), so edits are allowed
    this.customerForm.get('effDate')?.enable();

    this.lastModifiedDisplay = profile.lastModifiedDate
      ? `Last Modified: ${this.formatLastModified(profile.lastModifiedDate)}`
      : '';

    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
  }

  private loadDropdownData(): void {
    this.loading.set(true);

    this.apiService.getCustomerTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.customerTypes.set(types);
          this.filteredCustomerTypes = types;
        },
        error: () => this.showErrorAndAutoDismiss('Failed to load customer types')
      });

    this.apiService.getStateCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.stateCodes.set(states);
          this.filteredStateCodes = states;
        },
        error: () => this.showErrorAndAutoDismiss('Failed to load state codes')
      });

    this.apiService.getPayees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payees) => {
          this.payees.set(payees);
          this.filteredPayees = payees;
        },
        error: () => this.showErrorAndAutoDismiss('Failed to load payees')
      });

    this.apiService.getPlasmaFileTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.plasmaTypes.set(types);
          this.filteredPlasmaTypes = types;
          this.loading.set(false);
        },
        error: () => {
          this.showErrorAndAutoDismiss('Failed to load plasma file types');
          this.loading.set(false);
        }
      });
  }

  private setupFormListeners(): void {
    this.customerForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.customerForm.get('termDate')?.updateValueAndValidity();
      });

    this.customerForm.get('intFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const isIntl = value === 'Y';
        this.zipMaxLength = isIntl ? 10 : 15;
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
    this.customerTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => this.filterCustomerTypes(searchTerm || ''));

    this.stateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => this.filterStateCodes(searchTerm || ''));

    this.payeeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => this.filterPayees(searchTerm || ''));

    this.plasmaTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => this.filterPlasmaTypes(searchTerm || ''));
  }

  private filterCustomerTypes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredCustomerTypes = this.customerTypes().filter(
      (type) => type.code.toLowerCase().includes(search) || type.description.toLowerCase().includes(search)
    );
  }

  private filterStateCodes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredStateCodes = this.stateCodes().filter(
      (state) => state.code.toLowerCase().includes(search) || state.description.toLowerCase().includes(search)
    );
  }

  private filterPayees(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredPayees = this.payees().filter(
      (payee) => payee.customerId.toLowerCase().includes(search) || payee.name.toLowerCase().includes(search)
    );
  }

  private filterPlasmaTypes(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredPlasmaTypes = this.plasmaTypes().filter(
      (type) => type.code.toLowerCase().includes(search) || type.description.toLowerCase().includes(search)
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

  protected onEffectiveDateChange(): void {
    this.customerForm.get('termDate')?.updateValueAndValidity();
    this.customerForm.get('effDate')?.markAsTouched();
  }

  protected onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.customerForm.get('effDate')
    );
  }

  protected onTerminationDateChange(): void {
    this.customerForm.get('termDate')?.markAsTouched();
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  protected onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.customerForm.get('termDate'), true
    );
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
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  private formatDate(dateString: string): string {
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  private formatLastModified(dateStr: string): string {
    const m = moment(dateStr);
    if (!m.isValid()) return dateStr;
    const datePart = m.format('DD-MMM-YYYY').toUpperCase();
    const timePart = m.format('hh:mm A');
    const tzAbbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || '';
    return `${datePart}, ${timePart} ${tzAbbr}`;
  }

  protected getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateError(this.customerForm);
  }

  onSave(): void {
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

    this.saving.set(true);
    const formValue = this.customerForm.getRawValue();
    const toUpper = (v: string | null) => v ? v.toUpperCase() : v;

    const payload: UpdateCustomerProfileRequestDto = {
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

    this.apiService.updateCustomerProfile(this.data.customerProfile.customerId, payload)
      .pipe(
        switchMap(() => this.apiService.getCustomerProfileById(this.data.customerProfile.customerId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (freshProfile) => {
          this.saving.set(false);
          this.snackbarService.showSuccess(`Changes for ${this.data.customerProfile.name} have been saved.`);
          this.dialogRef.close(freshProfile);
        },
        error: (err) => {
          this.saving.set(false);
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to update customer profile';
          this.showErrorAndAutoDismiss(errorMessage);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onClearAll(): void {
    const effDateValue = this.customerForm.get('effDate')?.value;
    this.customerForm.patchValue({
      name: '',
      customerType: '',
      shortName: '',
      alphaKey: '',
      intFlag: 'N',
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
      phoneNo: '',
      faxNo: '',
      intPhone: '',
      telexNo: '',
      codFlag: '',
      returnAcceptedFlag: '',
      arAccount: '',
      fiPriceSchNo: '',
      ednGenFlag: '',
      plasmaFileType: '',
      payeeId: '',
      termDate: null
    });
    this.customerForm.get('effDate')?.setValue(effDateValue);
    this.customerForm.markAsDirty();
    this.submitted.set(false);
  }
}
