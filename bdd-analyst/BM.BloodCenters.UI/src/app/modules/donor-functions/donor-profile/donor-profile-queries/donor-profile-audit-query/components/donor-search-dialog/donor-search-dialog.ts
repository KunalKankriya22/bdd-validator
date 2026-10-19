import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import moment, { Moment } from 'moment';

import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { DonorProfileAuditQueryService } from '../../services/donor-profile-audit-query.service';
import {
  DonorSearchRequest,
  DonorSearchResultDto,
  DonorInfo,
  DPAQ_VALIDATION,
  DPAQ_ERROR_MESSAGES
} from '../../models/donor-profile-audit-query.model';

@Component({
  selector: 'app-donor-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './donor-search-dialog.html',
  styleUrls: ['./donor-search-dialog.scss']
})
export class DonorSearchDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DonorSearchDialog>);
  private readonly service = inject(DonorProfileAuditQueryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  private destroy$ = new Subject<void>();

  @ViewChild('dobInput', { read: ElementRef }) dobInput!: ElementRef<HTMLInputElement>;

  searchForm!: FormGroup;

  matchingDonors = signal<DonorSearchResultDto[]>([]);
  selectedDonor = signal<DonorSearchResultDto | null>(null);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  searchedFields = signal<Set<string>>(new Set());

  maxDate!: Moment;

  displayedColumns: string[] = [
    'donorId',
    'lastName',
    'firstName',
    'middleName',
    'dateOfBirth',
    'alternateId',
    'sex',
    'aboRh'
  ];

  sexOptions = [
    { value: '', label: 'All' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  dobErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.dobInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.maxDate = this.chapterTimezoneService.getChapterLocalDate();
    this.setupDateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      lastName: [''],
      firstName: [''],
      dob: [null, [DateFieldValidationUtility.validDateValidator()]],
      sex: [''],
      phoneNumber: [''],
      address: [''],
      donorId: [''],
      unitId: [''],
      deferralId: ['']
    });
  }

  private setupDateValidation(): void {
    this.searchForm.get('dob')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDateInput());
  }

  onDobBlur(): void {
    setTimeout(() => {
      const control = this.searchForm.get('dob');
      control?.markAsTouched();
      this.validateDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  getDobError(): string {
    const control = this.searchForm.get('dob');
    if (!control) return '';

    if (control.hasError('matDatepickerMax')) {
      return 'Date of Birth cannot be a future date';
    }
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Date of Birth is invalid';
    }
    const inputValue = this.dobInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Date of Birth is invalid';
    }
    return '';
  }

  private validateDateInput(): void {
    const control = this.searchForm.get('dob');
    const inputValue = this.dobInput?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.searchForm.get('phoneNumber')?.setValue(input.value, { emitEvent: false });
    this.searchForm.get('phoneNumber')?.markAsTouched();
    this.validatePhoneInput();
  }

  getPhoneError(): string {
    const control = this.searchForm.get('phoneNumber');
    if (!control) return '';
    if (control.hasError('phoneNumeric')) return DPAQ_ERROR_MESSAGES.PHONE_NUMERIC;
    if (control.hasError('phoneMin')) return DPAQ_ERROR_MESSAGES.PHONE_MIN;
    if (control.hasError('phoneMax')) return DPAQ_ERROR_MESSAGES.PHONE_MAX;
    return '';
  }

  validatePhoneInput(): void {
    const control = this.searchForm.get('phoneNumber');
    if (!control) return;
    const value = control.value?.trim() || '';

    if (!value) {
      control.setErrors(null);
      return;
    }

    const phone = value.replace(/-/g, '');
    if (!/^\d*$/.test(phone)) {
      control.setErrors({ phoneNumeric: true });
    } else if (phone.length > 0 && phone.length < DPAQ_VALIDATION.MIN_PHONE) {
      control.setErrors({ phoneMin: true });
    } else if (phone.length > DPAQ_VALIDATION.MAX_PHONE) {
      control.setErrors({ phoneMax: true });
    } else {
      control.setErrors(null);
    }
  }

  onRetrieve(): void {
    if (this.getDobError() || this.getPhoneError()) {
      this.focusFirstInvalidField();
      return;
    }

    const error = this.validateForm();
    if (error) {
      this.snackbarService.showError(error);
      return;
    }

    this.executeSearch();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  private executeSearch(): void {
    const form = this.searchForm.getRawValue();

    const request: DonorSearchRequest = {};
    const fieldsUsed = new Set<string>();

    if (form.lastName) {
      request.lastName = form.lastName.trim();
      fieldsUsed.add('lastName');
    }
    if (form.firstName) {
      request.firstName = form.firstName.trim();
      fieldsUsed.add('firstName');
    }
    if (form.dob) {
      request.dob = this.formatDobForApi(form.dob);
      fieldsUsed.add('dateOfBirth');
    }
    if (form.sex) {
      request.gender = form.sex;
      fieldsUsed.add('sex');
    }
    if (form.phoneNumber) {
      request.phoneNumber = form.phoneNumber.trim();
      fieldsUsed.add('phoneNumber');
    }
    if (form.address) {
      request.address = form.address.trim();
      fieldsUsed.add('address');
    }
    if (form.donorId) {
      request.donorId = form.donorId.trim();
      fieldsUsed.add('donorId');
    }
    if (form.unitId) {
      request.unitId = form.unitId.trim();
      fieldsUsed.add('unitId');
    }
    if (form.deferralId) {
      request.deferralId = form.deferralId.trim();
      fieldsUsed.add('deferralId');
    }

    this.searchedFields.set(fieldsUsed);
    this.isLoading.set(true);
    this.hasSearched.set(true);

    this.service.searchDonors(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.matchingDonors.set(results);
          this.isLoading.set(false);

          if (results.length === 0) {
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.NO_DONOR_SEARCH_RESULTS);
          }
        },
        error: (err) => {
          this.matchingDonors.set([]);
          this.isLoading.set(false);

          const msg = err?.error?.displayMessage || err?.displayMessage || err?.error?.message || err?.message || '';
          if (msg) {
            this.snackbarService.showError(msg);
          } else {
            this.snackbarService.showError(DPAQ_ERROR_MESSAGES.DONOR_SEARCH_ERROR);
          }
        }
      });
  }

  private validateForm(): string | null {
    const form = this.searchForm.getRawValue();

    const hasAnyCriteria = form.lastName?.trim() || form.firstName?.trim() ||
      form.dob || form.phoneNumber?.trim() || form.address?.trim() ||
      form.donorId?.trim() || form.unitId?.trim() || form.deferralId?.trim();

    if (!hasAnyCriteria) {
      return 'Please enter at least one search criteria';
    }

    if (form.donorId?.trim() && form.donorId.trim().length > DPAQ_VALIDATION.MAX_DONOR_ID) {
      return DPAQ_ERROR_MESSAGES.DONOR_ID_MAX;
    }

    if (form.unitId?.trim() && form.unitId.trim().length > DPAQ_VALIDATION.MAX_UNIT_ID) {
      return DPAQ_ERROR_MESSAGES.UNIT_ID_MAX;
    }

    if (form.deferralId?.trim() && form.deferralId.trim().length > DPAQ_VALIDATION.MAX_DEFERRAL_ID) {
      return DPAQ_ERROR_MESSAGES.DEFERRAL_ID_MAX;
    }

    return null;
  }

  onRowClick(donor: DonorSearchResultDto): void {
    this.selectedDonor.set(donor);
  }

  isRowSelected(donor: DonorSearchResultDto): boolean {
    return this.selectedDonor()?.donorId === donor.donorId;
  }

  isExactMatch(donor: DonorSearchResultDto): boolean {
    const form = this.searchForm.getRawValue();

    // Check each searched field for exact match (case-insensitive)
    if (form.lastName && donor.lastName?.toLowerCase() !== form.lastName.trim().toLowerCase()) {
      return false;
    }
    if (form.firstName && donor.firstName?.toLowerCase() !== form.firstName.trim().toLowerCase()) {
      return false;
    }
    if (form.donorId && donor.donorId !== form.donorId.trim()) {
      return false;
    }
    if (form.sex && donor.sex !== form.sex) {
      return false;
    }
    if (form.dob) {
      const searchDob = this.formatDobForApi(form.dob);
      const donorDob = moment(donor.dateOfBirth).format('MM/DD/YYYY');
      if (searchDob !== donorDob) {
        return false;
      }
    }

    // If we searched by any field and all searched fields match exactly, this is an exact match
    return this.searchedFields().size > 0;
  }

  isNonExactMatch(donor: DonorSearchResultDto): boolean {
    return !this.isExactMatch(donor);
  }

  shouldHighlightField(donor: DonorSearchResultDto, fieldName: string): boolean {
    // Only highlight if this is a non-exact match AND the field was searched
    return this.isNonExactMatch(donor) && this.searchedFields().has(fieldName);
  }

  onSelect(): void {
    const selected = this.selectedDonor();
    if (!selected) {
      this.snackbarService.showError('Please select a donor from the table');
      return;
    }

    // API returns 'gender' field in the search results, but DonorInfo expects 'sex'
    // Try multiple ways to access the gender/sex field from the API response
    let sexValue = '';

    // First try the 'gender' field (what the search API typically returns)
    if ((selected as any).gender) {
      sexValue = (selected as any).gender;
    }
    // Then try the 'sex' field (fallback)
    else if (selected.sex) {
      sexValue = selected.sex;
    }

    const donorInfo: DonorInfo = {
      donorId: selected.donorId,
      lastName: selected.lastName,
      firstName: selected.firstName,
      dateOfBirth: selected.dateOfBirth ? moment(selected.dateOfBirth).format('YYYY-MM-DD') : '',
      sex: sexValue
    };

    this.dialogRef.close(donorInfo);
  }

  onClear(): void {
    this.searchForm.reset({
      lastName: '',
      firstName: '',
      dob: null,
      sex: '',
      phoneNumber: '',
      address: '',
      donorId: '',
      unitId: '',
      deferralId: ''
    });
    this.matchingDonors.set([]);
    this.selectedDonor.set(null);
    this.hasSearched.set(false);
    this.searchedFields.set(new Set());
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  formatDate(value: string): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  displayValue(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  private formatDobForApi(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date || date.toDate || moment.isMoment(date)) {
      const m = moment.isMoment(date) ? date : moment(date);
      return m.format('MM/DD/YYYY');
    }
    return '';
  }

  get contactAddress(): string {
    const selected = this.selectedDonor();
    return selected?.address || '--';
  }

  get contactPhone(): string {
    const selected = this.selectedDonor();
    return selected?.phoneNumber || '--';
  }

  get isRetrieveDisabled(): boolean {
    if (this.isLoading() || !!this.getDobError() || !!this.getPhoneError()) {
      return true;
    }
    const form = this.searchForm.getRawValue();
    const hasAnyCriteria = form.lastName?.trim() || form.firstName?.trim() ||
      form.dob || form.phoneNumber?.trim() || form.address?.trim() ||
      form.donorId?.trim() || form.unitId?.trim() || form.deferralId?.trim();
    return !hasAnyCriteria;
  }

  get f() {
    return this.searchForm.controls;
  }
}
