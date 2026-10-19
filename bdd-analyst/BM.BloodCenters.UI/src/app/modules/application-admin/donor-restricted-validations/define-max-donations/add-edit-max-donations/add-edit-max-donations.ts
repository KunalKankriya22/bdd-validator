import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize, forkJoin, distinctUntilChanged } from 'rxjs';
import moment, { Moment } from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';

import { DefineMaxDonationsService } from '../services/define-max-donations.service';
import {
  DefineMaxDonationsModel,
  DefineMaxDonationsDto,
  UpdateDefineMaxDonationsDto,
  DonationTypeDropdown,
  ProcedureGroupDropdown
} from '../models/define-max-donations.model';

export interface MaxDonationFormData {
  donationType: string;
  procedureGroup: string;
  maximums: number;
  interval: number;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-max-donations',
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
    MatSnackBarModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-max-donations.html',
  styleUrls: ['./add-edit-max-donations.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditMaxDonations implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineMaxDonationsModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<MaxDonationFormData>();

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;

  donationTypes: DonationTypeDropdown[] = [];
  filteredDonationTypes: DonationTypeDropdown[] = [];
  donationTypeSearchControl = new FormControl('');
  procedureGroups: ProcedureGroupDropdown[] = [];

  minDate: Moment;
  terminationMinDate: Moment;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  editModeValues = {
    donationType: '',
    donationTypeDescription: '',
    procedureGroup: '',
    effectiveDate: ''
  };

  private originalValues = {
    donationType: '',
    procedureGroup: '',
    interval: 0
  };

  private initialFormSnapshot: string = '';
  private destroy$ = new Subject<void>();

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
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

  // Temporary error message for max donation overflow
  showMaxDonationOverflowError = false;
  private maxDonationErrorTimeout: ReturnType<typeof setTimeout> | null = null;

  // Temporary error message for interval overflow
  showIntervalOverflowError = false;
  private intervalErrorTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private defineMaxDonationsService: DefineMaxDonationsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupDonationTypeSearch();
    this.loadDropdownData();
    this.updatePanelTitle();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    }
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.maxDonationErrorTimeout) {
      clearTimeout(this.maxDonationErrorTimeout);
    }
    if (this.intervalErrorTimeout) {
      clearTimeout(this.intervalErrorTimeout);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      donationType: ['', [Validators.required]],
      procedureGroup: ['', [Validators.required]],
      maximums: [null, [Validators.required, Validators.min(1), Validators.max(999)]],
      interval: [null, [Validators.required, Validators.min(1), Validators.max(999)]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  private loadDropdownData(): void {
    forkJoin({
      donationTypes: this.defineMaxDonationsService.getDonationTypes(),
      procedureGroups: this.defineMaxDonationsService.getProcedureGroups()
    })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.donationTypes = results.donationTypes || [];
          this.filteredDonationTypes = this.donationTypes;
          this.procedureGroups = results.procedureGroups || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Failed to load dropdown options', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private setupDonationTypeSearch(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredDonationTypes = this.donationTypes;
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredDonationTypes = this.donationTypes.filter(type =>
          type.donationType.toLowerCase().includes(lowerSearch) ||
          type.donationTypeDescription?.toLowerCase().includes(lowerSearch)
        );
        this.cdr.markForCheck();
      });
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add Max Donation Configuration' : 'Edit Max Donation Configuration';
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    // Store original composite key values for API update call
    // NOTE: The composite key includes (donationType, procedureGroup, originalInterval)
    this.originalValues.donationType = this.data.donationType || '';
    this.originalValues.procedureGroup = this.data.procedureGroup || '';
    this.originalValues.interval = this.data.interval || 0;

    // Store display values for read-only cards
    this.editModeValues.donationType = this.data.donationType || '';
    this.editModeValues.donationTypeDescription = this.data.donationDescription || '';
    this.editModeValues.procedureGroup = this.data.procedureGroup || '';
    this.editModeValues.effectiveDate = this.data.effDate ? this.formatDateForDisplay(this.data.effDate) : '';

    // Disable composite key fields in edit mode
    this.form.get('donationType')?.disable();
    this.form.get('procedureGroup')?.disable();

    // In edit mode, these fields are not required (they're disabled)
    this.form.get('donationType')?.clearValidators();
    this.form.get('procedureGroup')?.clearValidators();

    // Update validity
    this.form.get('donationType')?.updateValueAndValidity();
    this.form.get('procedureGroup')?.updateValueAndValidity();

    // Populate form with data
    this.form.patchValue({
      donationType: this.data.donationType || '',
      procedureGroup: this.data.procedureGroup || '',
      maximums: this.data.maxDonations || null,
      interval: this.data.interval || null,
      effectiveDate: this.data.effDate ? new Date(this.data.effDate) : null,
      terminationDate: this.data.termDate ? new Date(this.data.termDate) : null
    });

    this.updateTerminationMinDate();
    this.initialFormSnapshot = this.getFormSnapshot();
    this.cdr.markForCheck();
  }

  blockInvalidKeys(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onMaximumsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Limit to 4 digits max and show temporary error if exceeded
    if (inputValue.length > 3) {
      inputValue = inputValue.substring(0, 3);
      input.value = inputValue;
      // Update form control value to prevent max validator from triggering
      const truncatedValue = parseInt(inputValue, 10);
      this.form.get('maximums')?.setValue(truncatedValue || null, { emitEvent: false });
      this.form.get('maximums')?.updateValueAndValidity({ emitEvent: false });
      this.showTemporaryMaxDonationError();
      return;
    }
  }

  private showTemporaryMaxDonationError(): void {
    // Clear any existing timeout
    if (this.maxDonationErrorTimeout) {
      clearTimeout(this.maxDonationErrorTimeout);
    }

    // Show error by setting custom error on form control
    this.showMaxDonationOverflowError = true;
    this.form.get('maximums')?.setErrors({ overflow: true });
    this.form.get('maximums')?.markAsTouched();
    this.cdr.markForCheck();

    // Hide error after 2 seconds
    this.maxDonationErrorTimeout = setTimeout(() => {
      this.showMaxDonationOverflowError = false;
      // Clear the overflow error
      const control = this.form.get('maximums');
      if (control?.hasError('overflow')) {
        control.setErrors(null);
        control.updateValueAndValidity({ emitEvent: false });
      }
      this.cdr.markForCheck();
    }, 2000);
  }

  onIntervalInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Limit to 4 digits max and show temporary error if exceeded
    if (inputValue.length > 3) {
      inputValue = inputValue.substring(0, 3);
      input.value = inputValue;
      // Update form control value to prevent max validator from triggering
      const truncatedValue = parseInt(inputValue, 10);
      this.form.get('interval')?.setValue(truncatedValue || null, { emitEvent: false });
      this.form.get('interval')?.updateValueAndValidity({ emitEvent: false });
      this.showTemporaryIntervalError();
      return;
    }
  }

  private showTemporaryIntervalError(): void {
    // Clear any existing timeout
    if (this.intervalErrorTimeout) {
      clearTimeout(this.intervalErrorTimeout);
    }

    // Show error by setting custom error on form control
    this.showIntervalOverflowError = true;
    this.form.get('interval')?.setErrors({ overflow: true });
    this.form.get('interval')?.markAsTouched();
    this.cdr.markForCheck();

    // Hide error after 2 seconds
    this.intervalErrorTimeout = setTimeout(() => {
      this.showIntervalOverflowError = false;
      // Clear the overflow error
      const control = this.form.get('interval');
      if (control?.hasError('overflow')) {
        control.setErrors(null);
        control.updateValueAndValidity({ emitEvent: false });
      }
      this.cdr.markForCheck();
    }, 2000);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Convert date value to native Date object
   * Handles both moment objects and native Date objects
   */
  private toNativeDate(value: Moment | Date | string | null | undefined): Date | null {
    if (!value) return null;

    // Check if it's a moment object
    if (moment.isMoment(value)) {
      return value.toDate();
    }

    // Check if it's already a Date object
    if (value instanceof Date) {
      return value;
    }

    // Try to parse as date string
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DefineMaxDonationsDto = {
        donationType: formValue.donationType?.trim() || '',
        procedureGroup: formValue.procedureGroup?.trim() || '',
        maxDonations: formValue.maximums || 0,
        interval: formValue.interval || 0,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || undefined
      };
      apiCall = this.defineMaxDonationsService.addMaxDonation(addPayload);
    } else {
      const updatePayload: UpdateDefineMaxDonationsDto = {
        donationType: this.originalValues.donationType,
        procedureGroup: this.originalValues.procedureGroup,
        maxDonations: formValue.maximums || 0,
        originalInterval: this.originalValues.interval,
        interval: formValue.interval || 0,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || undefined
      };
      apiCall = this.defineMaxDonationsService.updateMaxDonation(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Record has been added successfully.'
            : 'Record has been updated successfully.');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const formValue = this.form.getRawValue();
          const result: MaxDonationFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedureGroup: formValue.procedureGroup?.trim() || '',
            maximums: formValue.maximums,
            interval: formValue.interval,
            effectiveDate: this.toNativeDate(formValue.effectiveDate) || new Date(),
            terminationDate: this.toNativeDate(formValue.terminationDate)
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
  }

  // Form control getters
  get donationTypeControl() {
    return this.form.get('donationType');
  }

  get procedureGroupControl() {
    return this.form.get('procedureGroup');
  }

  get maximumsControl() {
    return this.form.get('maximums');
  }

  get intervalControl() {
    return this.form.get('interval');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  // Validation error methods
  getDonationTypeError(): string {
    const control = this.donationTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Donation Type is required';
    }
    return '';
  }

  getProcedureGroupError(): string {
    const control = this.procedureGroupControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Procedure Group is required';
    }
    return '';
  }

  getMaximumsError(): string {
    // Show temporary overflow error first
    if (this.showMaxDonationOverflowError) {
      return 'Max Donation must be 999 or less';
    }

    const control = this.maximumsControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Max Donation is required';
    }
    if (control.hasError('min')) {
      return 'Max Donation must be at least 1';
    }
    if (control.hasError('max')) {
      return 'Max Donation must be 999 or less';
    }
    return '';
  }

  getIntervalError(): string {
    // Show temporary overflow error first
    if (this.showIntervalOverflowError) {
      return 'Interval Days must be 999 or less';
    }

    const control = this.intervalControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Interval Days is required';
    }
    if (control.hasError('min')) {
      return 'Interval Days must be at least 1';
    }
    if (control.hasError('max')) {
      return 'Interval Days must be 999 or less';
    }
    return '';
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  private getFormSnapshot(): string {
    const val = this.form.getRawValue();
    return JSON.stringify({
      maximums: val.maximums ?? null,
      interval: val.interval ?? null,
      terminationDate: val.terminationDate ? (moment.isMoment(val.terminationDate) ? val.terminationDate.format('YYYY-MM-DD') : moment(val.terminationDate).format('YYYY-MM-DD')) : ''
    });
  }

  get isFormChanged(): boolean {
    if (this.mode === 'add') return true;
    return this.getFormSnapshot() !== this.initialFormSnapshot;
  }

  get isFormValid(): boolean {
    return this.form.valid && this.isFormChanged && !this.hasDateValidationError();
  }

}
