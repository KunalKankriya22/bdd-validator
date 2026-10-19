import { Component, ElementRef, Inject, OnInit, OnDestroy, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import moment from 'moment';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { normalizeDeferralId } from '@shared/utils/deferral-id.util';
import { SearchForDonorService } from './search-for-donor.service';
import {
  SearchForDonorDialogData,
  SearchForDonorDialogResult,
  DonorSearchResult,
  SearchForDonorCriteria
} from './search-for-donor.model';

@Component({
  selector: 'app-search-for-donor',
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
    MatTableModule,
    MatProgressSpinnerModule,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './search-for-donor.html',
  styleUrls: ['./search-for-donor.scss']
})
export class SearchForDonorDialog implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly searchService = inject(SearchForDonorService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();
  private readonly clearDeferralValidation$ = new Subject<void>();

  maxDob = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('lastNameInput') lastNameInput!: ElementRef<HTMLInputElement>;

  searchForm!: FormGroup;
  results: DonorSearchResult[] = [];
  selectedDonor: DonorSearchResult | null = null;
  loading = false;
  hasSearched = false;
  tooManyResults = false;
  errorCode: string | null = null;
  errorMessage: string | null = null;
  deferralIdValidating = false;
  donorIdLookingUp = false;
  private parsedDonationId: string | null = null;
  private validatedDeferralId: string | null = null;
  private donorIdLookupCancel$ = new Subject<void>();
  private lastLookedUpDonorId: string | null = null;
  private searchedCriteria: Record<string, string> = {};

  sexOptions = [
    { value: 'M', label: 'MALE' },
    { value: 'F', label: 'FEMALE' }
  ];

  displayedColumns: string[] = [
    'donorId',
    'lastName',
    'firstName',
    'middleName',
    'dateOfBirth',
    'sex',
    'aboRh',
    'alternateId'
  ];

  constructor(
    public dialogRef: MatDialogRef<SearchForDonorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SearchForDonorDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data?.prefilledCriteria) {
      this.searchForm.patchValue(this.data.prefilledCriteria);
    }
  }

  ngAfterViewInit(): void {
    if (this.data?.prefilledCriteria?.unitId) {
      this.unitIdField.prefill(this.data.prefilledCriteria.unitId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      lastName: ['', [Validators.maxLength(50)]],
      firstName: ['', [Validators.maxLength(50)]],
      dob: [''],
      sex: [''],
      areaCode: ['', [Validators.maxLength(3), Validators.pattern(/^\d*$/)]],
      phoneNumber: ['', [Validators.maxLength(7), Validators.pattern(/^\d*$/)]],
      address: ['', [Validators.maxLength(30)]],
      donorId: ['', [Validators.maxLength(10)]],
      deferralId: ['', [Validators.maxLength(10)]]
    });
  }

  hasAnySearchCriteria(): boolean {
    if (this.parsedDonationId) return true;
    if (this.validatedDeferralId) return true;
    const values = this.searchForm.value;
    return Object.keys(values).some(key => {
      const v = values[key];
      return v !== '' && v !== null && v !== undefined;
    });
  }

  onRetrieve(): void {
    if (!this.hasAnySearchCriteria()) {
      return;
    }

    this.loading = true;
    this.hasSearched = true;
    this.tooManyResults = false;
    this.selectedDonor = null;
    this.errorCode = null;
    this.errorMessage = null;

    const formValue = this.searchForm.value;
    const criteria: SearchForDonorCriteria = {};

    if (formValue.lastName) criteria.lastName = formValue.lastName.trim();
    if (formValue.firstName) criteria.firstName = formValue.firstName.trim();
    if (formValue.dob) criteria.dob = this.formatDobForApi(formValue.dob);
    if (formValue.sex) criteria.gender = formValue.sex;
    if (formValue.phoneNumber) criteria.phoneNo = formValue.phoneNumber.trim();
    if (formValue.areaCode) criteria.areaCode = formValue.areaCode.trim();
    if (formValue.address) criteria.address = formValue.address.trim();
    if (formValue.donorId) criteria.donorId = formValue.donorId.trim();
    if (!this.unitIdField?.unitIdControl?.value?.trim()) {
      this.parsedDonationId = null;
    }
    if (this.parsedDonationId) criteria.unitId = this.parsedDonationId;
    if (this.validatedDeferralId) criteria.deferralId = this.validatedDeferralId;

    this.searchedCriteria = { ...criteria } as Record<string, string>;

    this.searchService.searchDonors(criteria)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.loading = false;
          this.results = [];

          // 404 = no donors matched — not an error, empty state handles display
          if (error?.status === 404) {
            return of({ data: [], total: 0 });
          }

          // 400 = too many results — expected condition, not a system error
          if (error?.status === 400) {
            this.tooManyResults = true;
            return of({ data: [], total: 0 });
          }

          if (error?.error?.errorResponse) {
            const { errorCode, error: msg } = error.error.errorResponse;
            this.errorCode = errorCode ?? null;
            this.errorMessage = msg ?? null;
          } else {
            this.errorMessage = 'An error occurred while searching for donors';
          }

          return of({ data: [], total: 0 });
        })
      )
      .subscribe({
        next: (response) => {
          this.results = response.data;
          this.loading = false;
        }
      });
  }

  isNameMismatch(row: DonorSearchResult, field: 'lastName' | 'firstName'): boolean {
    const searchValue = this.searchedCriteria[field]?.trim()?.toLowerCase();
    if (!searchValue) return false;
    const resultValue = row[field]?.trim()?.toLowerCase() || '';
    return !resultValue.startsWith(searchValue);
  }

  isDobMismatch(row: DonorSearchResult): boolean {
    const searchDob = this.searchedCriteria['dob'];
    if (!searchDob) return false;
    const parts = searchDob.split('/');
    if (parts.length !== 3) return false;
    const [month, day, year] = parts;
    const searchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const resultDate = row.dateOfBirth?.split('T')[0] ?? '';
    return resultDate !== searchDate;
  }

  onRowSelect(donor: DonorSearchResult): void {
    this.selectedDonor = donor;
  }

  isRowSelected(donor: DonorSearchResult): boolean {
    return this.selectedDonor?.donorId === donor.donorId;
  }

  onSelect(): void {
    if (!this.selectedDonor) return;
    this.dialogRef.close({
      action: 'select',
      donor: this.selectedDonor
    } as SearchForDonorDialogResult);
  }

  onClear(): void {
    this.clearDeferralValidation$.next();
    this.deferralIdValidating = false;
    this.searchForm.reset();
    this.unitIdField?.clear();
    this.parsedDonationId = null;
    this.validatedDeferralId = null;
    this.lastLookedUpDonorId = null;
    this.donorIdLookupCancel$.next();
    this.results = [];
    this.selectedDonor = null;
    this.hasSearched = false;
    this.tooManyResults = false;
    this.errorCode = null;
    this.errorMessage = null;
    this.searchedCriteria = {};
    this.lastNameInput?.nativeElement?.focus();
  }

  onUnitIdValidated(data: UnitValidationResponse): void {
    this.parsedDonationId = data.parsedUnitId;
  }

  onUnitIdCleared(): void {
    this.parsedDonationId = null;
  }

  onDobInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    const dob = this.searchForm.get('dob');
    if (!dob) return;
    if (!input?.trim()) {
      dob.setValue(null, { emitEvent: false });
      dob.setErrors(null);
    } else if (!dob.value) {
      dob.markAsTouched();
      dob.setErrors({ invalidDate: true });
    }
  }

  validateDob(): void {
    const dob = this.searchForm.get('dob');
    if (!dob?.value) return;
    const dobMoment = moment(dob.value);
    if (dobMoment.isValid() && dobMoment.isAfter(this.maxDob)) {
      dob.setErrors({ ...dob.errors, futureDob: true });
    } else if (dob.hasError('futureDob')) {
      const { futureDob, ...remaining } = dob.errors || {};
      dob.setErrors(Object.keys(remaining).length ? remaining : null);
    }
  }

  onDonorIdInput(): void {
    const ctrl = this.searchForm.get('donorId');
    if (ctrl?.value) {
      ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
    }
  }

  onDonorIdBlur(): void {
    const donorId = this.searchForm.get('donorId')?.value?.trim();
    if (!donorId || donorId === this.lastLookedUpDonorId) return;

    this.donorIdLookupCancel$.next();
    this.donorIdLookingUp = true;

    this.searchService.lookupDonorId(donorId)
      .pipe(takeUntil(this.destroy$), takeUntil(this.donorIdLookupCancel$))
      .subscribe({
        next: (response: any) => {
          this.donorIdLookingUp = false;
          this.lastLookedUpDonorId = donorId;
          if (response.success && response.item) {
            this.searchForm.patchValue({
              lastName: response.item.lastName ?? '',
              firstName: response.item.firstName ?? '',
              dob: response.item.dateOfBirth ? moment(response.item.dateOfBirth) : null,
              sex: response.item.gender ?? '',
            });
          }
        },
        error: (err) => {
          this.donorIdLookingUp = false;
          this.lastLookedUpDonorId = null;
          const errorCode = err?.error?.errorCode;
          if (errorCode === '16066') {
            this.searchForm.get('donorId')?.setErrors({ serverError: 'Donor does not exist' });
            this.searchForm.get('donorId')?.markAsTouched();
          }
        }
      });
  }

  onDeferralIdBlur(): void {
    const ctrl = this.searchForm.get('deferralId');
    const deferralId = ctrl?.value?.trim();
    if (!deferralId) {
      this.clearDeferralValidation$.next();
      this.deferralIdValidating = false;
      this.validatedDeferralId = null;
      ctrl?.setErrors(null);
      return;
    }

    const normalized = normalizeDeferralId(deferralId);
    if (!normalized) {
      this.validatedDeferralId = null;
      ctrl?.setErrors({ serverError: 'Invalid deferral ID' });
      ctrl?.markAsTouched();
      return;
    }

    if (normalized === this.validatedDeferralId) return;

    this.deferralIdValidating = true;
    this.searchService.validateDeferralId(normalized)
      .pipe(takeUntil(this.destroy$), takeUntil(this.clearDeferralValidation$))
      .subscribe({
        next: () => {
          this.deferralIdValidating = false;
          this.validatedDeferralId = normalized;
          ctrl?.setValue(normalized, { emitEvent: false });
          ctrl?.setErrors(null);
        },
        error: (err) => {
          this.deferralIdValidating = false;
          this.validatedDeferralId = null;
          const msg = err?.error?.errorResponse?.error ?? 'Deferral ID not found';
          ctrl?.setErrors({ serverError: msg });
          ctrl?.markAsTouched();
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as SearchForDonorDialogResult);
  }

  closeError(): void {
    this.errorCode = null;
    this.errorMessage = null;
  }

  getFullAddress(donor: DonorSearchResult): string {
    const suiteApt = donor.suiteApt?.trim();
    const street = [
      donor.address?.trim(),
      suiteApt ? `#${suiteApt}` : null
    ].filter(Boolean).join(' ');

    const stateZip = [donor.state?.trim(), donor.zip?.trim()].filter(Boolean).join(' ');
    const cityStateZip = [donor.city?.trim(), stateZip].filter(Boolean).join(', ');

    const parts = [street, cityStateZip, donor.country?.trim()].filter(Boolean);
    return parts.length ? parts.join(', ') : '-';
  }

  getPhoneNumber(donor: DonorSearchResult): string {
    const pref = donor.preferredContactFlag;

    if (donor.intlAddrFlag === 'Y' && (donor.intlHomePhone || donor.intlWorkPhone)) {
      const phones: string[] = [];
      if (donor.intlHomePhone) {
        phones.push(`(H${pref === 'H' ? 'P' : ''}) ${donor.intlHomePhone}`);
      }
      if (donor.intlWorkPhone) {
        phones.push(`(W${pref === 'W' ? 'P' : ''}) ${donor.intlWorkPhone}`);
      }
      return phones.join(' ');
    }

    const phones: string[] = [];
    if (donor.homePhone) {
      const label = `H${pref === 'H' ? 'P' : ''}`;
      phones.push([`(${label})`, donor.homeAreaCode || null, this.formatPhoneDash(donor.homePhone)].filter(Boolean).join(' '));
    }
    if (donor.dayPhone) {
      const label = `W${pref === 'W' ? 'P' : ''}`;
      phones.push([`(${label})`, donor.dayAreaCode || null, this.formatPhoneDash(donor.dayPhone)].filter(Boolean).join(' '));
    }
    if (donor.mobilePhone) {
      const label = `M${pref === 'M' ? 'P' : ''}`;
      phones.push([`(${label})`, donor.mobileAreaCode || null, this.formatPhoneDash(donor.mobilePhone)].filter(Boolean).join(' '));
    }
    return phones.join(' ') || '-';
  }

  private formatPhoneDash(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 4) {
      return digits.substring(0, 3) + '-' + digits.substring(3);
    }
    return phone;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      // Parse the date part directly from ISO string to avoid browser timezone offset issues.
      // e.g. "1985-03-15T00:00:00" parsed as a Date and read with getDate() would return
      // March 14 in UTC+ timezones.
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      if (!year || !month || !day) return dateStr;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${String(day).padStart(2, '0')}-${months[month - 1]}-${year}`;
    } catch {
      return dateStr || '-';
    }
  }

  private formatDobForApi(date: string | Date | { toDate: () => Date }): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    if ('toDate' in date) {
      const d = date.toDate();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    }
    return '';
  }

  onAlphaKeyPress(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key;
    if (key.length === 1 && !/^[a-zA-Z\s'\-]$/.test(key)) {
      event.preventDefault();
    }
  }

  stripNonAlpha(controlName: string): void {
    const control = this.searchForm.get(controlName);
    if (control) {
      const stripped = (control.value || '').replace(/[^a-zA-Z\s'\-]/g, '').toUpperCase();
      if (stripped !== control.value) {
        control.setValue(stripped, { emitEvent: false });
      }
    }
  }

  onNumericKeyPress(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key;
    if (key.length === 1 && !/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  stripNonNumeric(controlName: string): void {
    const control = this.searchForm.get(controlName);
    if (control) {
      const stripped = (control.value || '').replace(/\D/g, '');
      if (stripped !== control.value) {
        control.setValue(stripped, { emitEvent: false });
      }
    }
  }

  get isRetrieveDisabled(): boolean {
    if (this.loading) return true;
    if (!this.hasAnySearchCriteria()) return true;
    if (this.searchForm.invalid) return true;

    // Oracle error 18065: "Phone number requires area code" — phone and area code must be entered together.
    const areaCode = this.searchForm.get('areaCode')?.value?.trim();
    const phoneNo = this.searchForm.get('phoneNumber')?.value?.trim();
    if ((phoneNo && !areaCode) || (areaCode && !phoneNo)) return true;

    const deferralCtrl = this.searchForm.get('deferralId');
    if (deferralCtrl?.value?.trim() && !this.validatedDeferralId) return true;

    if (this.unitIdField?.unitIdControl?.value?.trim() && !this.unitIdField.isValid) return true;

    return false;
  }

  get isSelectDisabled(): boolean {
    return !this.selectedDonor;
  }

}
