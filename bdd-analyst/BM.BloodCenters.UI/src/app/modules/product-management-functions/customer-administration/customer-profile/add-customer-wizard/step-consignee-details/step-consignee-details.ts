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
  FormArray,
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
import { Subject, takeUntil, forkJoin, concatMap, from, toArray, switchMap } from 'rxjs';

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

interface ZoneDto {
  code: string;
  description: string;
}

@Component({
  selector: 'app-step-consignee-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
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
  templateUrl: './step-consignee-details.html',
  styleUrls: ['./step-consignee-details.scss']
})
export class StepConsigneeDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `consignee-details-${StepConsigneeDetailsComponent.nextId++}`;

  @Input() customerId: string = '';
  @Input() customerData: CustomerProfileDto | null = null;
  @Input() savedData: any[] = [];
  @Output() saveSuccess = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AddCustomerWizardApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  consigneeForm!: FormGroup;

  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly zones = signal<ZoneDto[]>([]);
  protected readonly stateCodes = signal<StateCodeDto[]>([]);

  // Filtered options for searchable dropdowns
  protected filteredStateCodes: StateCodeDto[] = [];
  protected filteredZones: { code: string; description: string }[] = [];

  // Search controls for dropdowns
  protected stateSearchCtrl = new FormControl<string>('');
  protected zoneSearchCtrl = new FormControl<string>('');

  protected today!: Moment;
  protected minDate!: Moment;

  protected get consignees(): FormArray {
    return this.consigneeForm.get('consignees') as FormArray;
  }

  protected readonly elementId = (name: string, index?: number) =>
    index !== undefined
      ? `${this.componentId}-${index}-${name}`
      : `${this.componentId}-${name}`;
  protected readonly errorId = (name: string, index?: number) =>
    index !== undefined
      ? `${this.componentId}-${index}-${name}-error`
      : `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string, index?: number) =>
    index !== undefined
      ? `${this.componentId}-${index}-${name}-label`
      : `${this.componentId}-${name}-label`;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const tz = this.headerService.chapterTimeZone();
        this.minDate = DateFieldValidationUtility.getMinDate(tz);
        this.consignees.controls.forEach((group) => {
          group.get('effDate')?.setValidators([
            Validators.required,
            DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
          ]);
          group.get('effDate')?.updateValueAndValidity();
          group.get('termDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator(tz)]);
          group.get('termDate')?.updateValueAndValidity();
        });
      });

    this.loadZones();
    this.loadStateCodes();
    this.setupSearchControls();

    // Populate form with savedData if available
    if (this.savedData && this.savedData.length > 0) {
      // Create a FormGroup for each saved consignee
      this.savedData.forEach((consignee) => {
        const consigneeGroup = this.createConsigneeFormGroup();
        consigneeGroup.patchValue({
          consigneeName: consignee.name || consignee.consigneeName,
          shortName: consignee.shortName,
          intFlag: consignee.intFlag || 'N',
          address1: consignee.address1,
          address2: consignee.address2,
          address3: consignee.address3,
          city: consignee.city,
          state: consignee.state,
          zip: consignee.zip,
          country: consignee.country,
          zone: consignee.zone,
          outOfState: consignee.outOfState,
          phoneNo: consignee.phoneNo,
          faxNo: consignee.faxNo,
          intPhone: consignee.intPhone,
          intFax: consignee.telexNo || consignee.intFax
        });
        // Handle dates with moment conversion
        if (consignee.effDate) {
          consigneeGroup.get('effDate')?.setValue(moment(consignee.effDate));
        }
        if (consignee.termDate) {
          consigneeGroup.get('termDate')?.setValue(moment(consignee.termDate));
        }
        this.consignees.push(consigneeGroup);
        this.setupConsigneeListeners(this.consignees.length - 1);
      });
    } else {
      // Add first consignee by default if no savedData
      if (this.consignees.length === 0) {
        this.addConsignee();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.consigneeForm = this.fb.group({
      consignees: this.fb.array([])
    });
  }

  private loadZones(): void {
    this.loading.set(true); this.loadingChange.emit(true);
    this.apiService.getZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones);
          this.filteredZones = zones;
          this.loading.set(false); this.loadingChange.emit(false);
        },
        error: (err) => {
          this.showErrorAndAutoDismiss('Failed to load zones');
          console.error('Error loading zones:', err);
          this.loading.set(false); this.loadingChange.emit(false);
        }
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

  private createConsigneeFormGroup(): FormGroup {
    return this.fb.group({
      consigneeName: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.NAME.MAX_LENGTH)
      ]],
      shortName: ['', [
        Validators.required,
        Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.SHORT_NAME.MAX_LENGTH)
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
      zone: ['', [Validators.required]],
      outOfState: [''],
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
      effDate: [DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()), [
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]],
      termDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  protected addConsignee(): void {
    const consigneeGroup = this.createConsigneeFormGroup();
    this.consignees.push(consigneeGroup);

    // Setup listeners for this consignee
    this.setupConsigneeListeners(this.consignees.length - 1);
  }

  protected removeConsignee(index: number): void {
    if (this.consignees.length > 1) {
      this.consignees.removeAt(index);
    } else {
      this.showErrorAndAutoDismiss('At least one consignee is required');
    }
  }

  private setupConsigneeListeners(index: number): void {
    const consigneeGroup = this.consignees.at(index) as FormGroup;

    // Copy customer data when "Same as customer?" is checked
    consigneeGroup.get('sameAsCustomer')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((checked) => {
        if (checked && this.customerData) {
          consigneeGroup.patchValue({
            consigneeName: this.customerData.name || '',
            shortName: this.customerData.shortName || '',
            intFlag: this.customerData.intFlag || 'N',
            address1: this.customerData.address1 || '',
            address2: this.customerData.address2 || '',
            address3: this.customerData.address3 || '',
            city: this.customerData.city || '',
            state: this.customerData.state || '',
            country: this.customerData.country || 'USA',
            zip: this.customerData.zip || '',
            phoneNo: this.customerData.phoneNo || '',
            phoneExt: this.customerData.phoneExt || '',
            faxNo: this.customerData.faxNo || '',
            intFax: this.customerData.telexNo || '',
            intPhone: this.customerData.intPhone || ''
          });
        }
      });

    // Re-validate termination date when effective date changes
    consigneeGroup.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        consigneeGroup.get('termDate')?.updateValueAndValidity();
      });

    // Handle international flag changes - update state and zip validators
    consigneeGroup.get('intFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const stateCtrl = consigneeGroup.get('state');
        if (value === 'Y') {
          stateCtrl?.clearValidators();
          stateCtrl?.setValidators([Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)]);
        } else {
          stateCtrl?.setValidators([
            Validators.required,
            Validators.maxLength(CUSTOMER_PROFILE_CONSTRAINTS.STATE.MAX_LENGTH)
          ]);
        }
        stateCtrl?.updateValueAndValidity();
        applyZipValidators(consigneeGroup.get('zip'), value === 'Y');
      });
  }

  protected isInternational(index: number): boolean {
    return this.consignees.at(index)?.get('intFlag')?.value === 'Y';
  }

  protected getZipMaxLength(index: number): number {
    return this.isInternational(index) ? 10 : 5;
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

  protected stripPhoneOnFocus(index: number, controlName: string): void {
    const ctrl = this.consignees.at(index)?.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  protected formatPhoneOnBlur(index: number, controlName: string): void {
    const ctrl = this.consignees.at(index)?.get(controlName);
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

  protected getEffectiveDateError(index: number): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.consignees.at(index) as FormGroup);
  }

  protected getTerminationMinDate(index: number): Moment {
    const effValue = this.consignees.at(index)?.get('effDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }

  protected getTerminationDateError(index: number): string {
    return DateFieldValidationUtility.getTerminationDateError(this.consignees.at(index) as FormGroup);
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    this.consigneeForm.markAllAsTouched();

    // If savedData exists and form is not dirty, just move to next step
    if (this.savedData?.length > 0 && !this.consigneeForm.dirty) {
      this.saveSuccess.emit(this.savedData);
      return;
    }

    if (this.consigneeForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.showErrorAndAutoDismiss('Please correct the errors in the form');
      return;
    }

    this.saving.set(true); this.savingChange.emit(true);

    const toUpper = (v: string | null) => v ? v.toUpperCase() : v;

    const items = this.consignees.controls.map((consigneeGroup, index) => {
      const formValue = (consigneeGroup as FormGroup).getRawValue();
      return {
        consigneeId: this.savedData?.[index]?.consigneeId || null,
        payload: {
          name: formValue.consigneeName,
          shortName: toUpper(formValue.shortName) || formValue.consigneeName.substring(0, 15).toUpperCase(),
          intFlag: formValue.intFlag || 'N',
          address1: formValue.address1,
          address2: formValue.address2 || null,
          address3: formValue.address3 || null,
          city: toUpper(formValue.city)!,
          state: formValue.state || null,
          zip: toUpper(formValue.zip)!,
          country: toUpper(formValue.country)!,
          zone: formValue.zone,
          outOfState: formValue.outOfState || null,
          phoneNo: this.stripPhone(formValue.phoneNo) || null,
          faxNo: this.stripPhone(formValue.faxNo) || null,
          intPhone: toUpper(formValue.intPhone) || null,
          telexNo: toUpper(formValue.intFax) || null,
          effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : '',
          termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null
        }
      };
    });

    from(items)
      .pipe(
        concatMap((item) => {
          if (item.consigneeId) {
            return this.apiService.updateConsignee(this.customerId, item.consigneeId, item.payload);
          } else {
            return this.apiService.createConsignee(this.customerId, item.payload);
          }
        }),
        toArray(),
        switchMap(() => this.apiService.getConsignees(this.customerId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (savedConsignees) => {
          this.saving.set(false); this.savingChange.emit(false);
          this.snackbarService.showSuccess(
            `${items.length} consignee${items.length > 1 ? 's' : ''} saved successfully`
          );
          this.saveSuccess.emit(savedConsignees);
        },
        error: (err) => {
          this.saving.set(false); this.savingChange.emit(false);
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to save consignee details';
          this.showErrorAndAutoDismiss(errorMessage);
          console.error('Error saving consignee details:', err);
          // Refresh savedData so retry knows which items were already saved
          this.apiService.getConsignees(this.customerId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(saved => { if (saved?.length) this.savedData = saved; });
        }
      });
  }

  protected onEffectiveDateChange(index: number): void {
    const consigneeGroup = this.consignees.at(index) as FormGroup;
    consigneeGroup.get('termDate')?.updateValueAndValidity();
    consigneeGroup.get('effDate')?.markAsTouched();
  }

  protected onTerminationDateChange(index: number): void {
    const consigneeGroup = this.consignees.at(index) as FormGroup;
    consigneeGroup.get('termDate')?.markAsTouched();
  }

  protected onEffectiveDateInput(event: Event, index: number): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.consignees.at(index).get('effDate')
    );
  }

  protected onTerminationDateInput(event: Event, index: number): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.consignees.at(index).get('termDate')
    );
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  protected getTerminationDateFilter(index: number) {
    return (date: Moment | null): boolean => {
      if (!date) return true;

      const checkDate = moment(date).startOf('day');
      const consigneeGroup = this.consignees.at(index) as FormGroup;
      const effectiveDate = consigneeGroup?.get('effDate')?.value;

      if (effectiveDate) {
        const effDay = moment(effectiveDate).startOf('day');
        if (checkDate.isBefore(effDay)) {
          return false;
        }
      }

      return true;
    };
  }

}
