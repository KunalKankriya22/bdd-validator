import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize, forkJoin, distinctUntilChanged } from 'rxjs';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';

import {
  phoneNumberValidator,
  applyZipValidators,
  DOMESTIC_ZIP_MAX_LENGTH,
  INTERNATIONAL_ZIP_MAX_LENGTH
} from '../../customer-profile/validators/customer-profile.validators';
import { ConsigneeApiService } from '../services/consignee-api.service';
import {
  ConsigneeDto,
  CreateConsigneeDto,
  UpdateConsigneeDto,
  ZoneLookup,
  StateLookup,
  CustomerDataForConsignee,
  CONSIGNEE_FIELD_LENGTHS
} from '../models/consignee.model';
import { Chapters } from '../../../../application-admin/chapter/services/chapters';

@Component({
  selector: 'app-add-edit-consignee',
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
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    UppercaseInputDirective
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-consignee.html',
  styleUrls: ['./add-edit-consignee.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditConsigneeComponent implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ConsigneeDto | null = null;
  @Input({ required: true }) customerId!: string;
  @Input() customerData: CustomerDataForConsignee | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  readonly fieldLengths = CONSIGNEE_FIELD_LENGTHS;

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;
  savingAction: 'add' | 'addAnother' | null = null;
  lastModifiedDisplay = '';

  // Dropdown data
  zones: ZoneLookup[] = [];
  filteredZones: ZoneLookup[] = [];
  zoneSearchControl = new FormControl('');

  states: StateLookup[] = [];
  filteredStates: StateLookup[] = [];
  stateSearchControl = new FormControl('');

  outOfStateOptions = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];

  // Date handling
  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  // Edit mode display values
  editModeValues = {
    consigneeId: '',
    effectiveDate: ''
  };

  private initialFormSnapshot = '';
  private readonly destroy$ = new Subject<void>();

  private readonly fb = inject(FormBuilder);
  private readonly consigneeApiService = inject(ConsigneeApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chaptersService = inject(Chapters);

  private chapterState: string | null = null;

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;
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

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupDropdownSearch();
    this.loadDropdownData();
    this.loadChapterState();
    this.updatePanelTitle();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      if (this.data) {
        this.populateFormForEdit();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
      // Auto-populate effective date to chapter date in add mode
      this.form.get('effDate')?.setValue(this.minDate.clone());
    }

    this.setupCheckboxListeners();
    this.setupStateListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(this.fieldLengths.name)]],
      shortName: ['', [Validators.required, Validators.maxLength(this.fieldLengths.shortName)]],
      sameAsCustomer: [false],
      internationalAddress: [false],
      address1: ['', [Validators.required, Validators.maxLength(this.fieldLengths.address1)]],
      address2: ['', [Validators.maxLength(this.fieldLengths.address2)]],
      address3: ['', [Validators.maxLength(this.fieldLengths.address3)]],
      city: ['', [Validators.required, Validators.maxLength(this.fieldLengths.city)]],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required, Validators.maxLength(DOMESTIC_ZIP_MAX_LENGTH), Validators.pattern(/^[0-9]*$/)]],
      country: ['', [Validators.required, Validators.maxLength(this.fieldLengths.country)]],
      zone: [''],
      outOfState: [''],
      phoneNo: ['', [Validators.maxLength(this.fieldLengths.phoneNo), phoneNumberValidator()]],
      faxNo: ['', [Validators.maxLength(this.fieldLengths.faxNo), phoneNumberValidator()]],
      intPhone: ['', [Validators.maxLength(this.fieldLengths.intPhone)]],
      telexNo: ['', [Validators.maxLength(this.fieldLengths.telexNo)]],
      effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      termDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')] });
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.form.get('effDate')?.valueChanges
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

    this.form.get('termDate')?.valueChanges
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

  private setupDropdownSearch(): void {
    this.zoneSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredZones = this.zones.filter(z =>
          z.code.toLowerCase().includes(term) || z.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    this.stateSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredStates = this.states.filter(s =>
          s.code.toLowerCase().includes(term) || s.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private setupCheckboxListeners(): void {
    this.form.get('sameAsCustomer')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked && this.customerData) {
          this.copyCustomerData();
        }
      });

    this.form.get('internationalAddress')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInternational => {
        const stateControl = this.form.get('state');
        const zipControl = this.form.get('zip');

        if (isInternational) {
          stateControl?.clearValidators();
        } else {
          stateControl?.setValidators([Validators.required]);
        }
        stateControl?.updateValueAndValidity();
        applyZipValidators(zipControl, isInternational);
        this.cdr.markForCheck();
      });
  }

  private copyCustomerData(): void {
    if (!this.customerData) return;

    this.form.patchValue({
      name: this.customerData.name || '',
      shortName: this.customerData.shortName || '',
      internationalAddress: this.customerData.intFlag === 'Y',
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
      telexNo: this.customerData.telexNo || ''
    });

    this.cdr.markForCheck();
  }

  private loadDropdownData(): void {
    forkJoin({
      zones: this.consigneeApiService.getZones(),
      states: this.consigneeApiService.getStates()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.zones = results.zones || [];
          this.filteredZones = [...this.zones];
          this.states = results.states || [];
          this.filteredStates = [...this.states];
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

  private loadChapterState(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    if (!chapterId) return;

    this.chaptersService.getChapterById(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapter) => {
          this.chapterState = chapter.state || null;
          // Trigger initial out of state evaluation if state is already set
          const currentState = this.form.get('state')?.value;
          if (currentState) {
            this.updateOutOfState(currentState);
          }
        },
        error: () => {
          // Silently fail - out of state auto-population won't work but form is still usable
        }
      });
  }

  private setupStateListener(): void {
    this.form.get('state')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedState => {
        this.updateOutOfState(selectedState);
      });
  }

  private updateOutOfState(selectedState: string | null): void {
    if (!this.chapterState || !selectedState) {
      return;
    }

    const outOfStateControl = this.form.get('outOfState');
    if (selectedState === this.chapterState) {
      outOfStateControl?.setValue('N');
    } else {
      outOfStateControl?.setValue('Y');
    }
    this.cdr.markForCheck();
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add'
      ? `Add New Consignee for ${this.customerData?.name || 'Customer'}`
      : `Edit Consignee for ${this.customerData?.name || 'Customer'}`;
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.editModeValues.consigneeId = this.data.consigneeId || '';
    this.editModeValues.effectiveDate = this.data.effDate ? this.formatDateForDisplay(this.data.effDate) : '';

    if (this.data.lastModifiedDate) {
      this.lastModifiedDisplay = `Last Modified: ${this.formatDateForDisplay(this.data.lastModifiedDate)}`;
    }

    const isInternational = this.data.intFlag === 'Y';

    this.form.patchValue({
      name: this.data.name || '',
      shortName: this.data.shortName || '',
      sameAsCustomer: false,
      internationalAddress: isInternational,
      address1: this.data.address1 || '',
      address2: this.data.address2 || '',
      address3: this.data.address3 || '',
      city: this.data.city || '',
      state: this.data.state || '',
      zip: this.data.zip || '',
      country: this.data.country || '',
      zone: this.data.zone || '',
      outOfState: this.data.outOfState || '',
      phoneNo: this.data.phoneNo || '',
      faxNo: this.data.faxNo || '',
      intPhone: this.data.intPhone || '',
      telexNo: this.data.telexNo || '',
      effDate: this.data.effDate ? new Date(this.data.effDate) : null,
      termDate: this.data.termDate ? new Date(this.data.termDate) : null
    });

    if (isInternational) {
      this.form.get('state')?.clearValidators();
      this.form.get('state')?.updateValueAndValidity();
      applyZipValidators(this.form.get('zip'), true);
    }

    this.updateTerminationMinDate();
    this.initialFormSnapshot = this.getFormSnapshot();
    this.cdr.markForCheck();
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onClearAll(): void {
    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    } else {
      this.form.reset({
        sameAsCustomer: false,
        internationalAddress: false,
        country: 'USA',
        effDate: this.minDate.clone()  // Re-populate effective date to chapter date
      });
    }
    this.cdr.markForCheck();
  }

  onSave(addAnother = false): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;
    this.savingAction = addAnother ? 'addAnother' : 'add';

    if (this.mode === 'add') {
      const createDto: CreateConsigneeDto = {
        customerId: this.customerId,
        name: formValue.name?.trim() || '',
        shortName: formValue.shortName?.trim() || '',
        intFlag: formValue.internationalAddress ? 'Y' : 'N',
        address1: formValue.address1?.trim() || '',
        address2: formValue.address2?.trim() || null,
        address3: formValue.address3?.trim() || null,
        city: formValue.city?.trim() || '',
        state: formValue.state || null,
        zip: formValue.zip?.trim() || '',
        country: formValue.country?.trim() || 'USA',
        zone: formValue.zone || null,
        outOfState: formValue.outOfState || null,
        phoneNo: this.stripPhone(formValue.phoneNo?.trim()) || null,
        faxNo: this.stripPhone(formValue.faxNo?.trim()) || null,
        intPhone: formValue.intPhone?.trim() || null,
        telexNo: formValue.telexNo?.trim() || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null
      };

      this.consigneeApiService.createConsignee(createDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
            this.savingAction = null;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Consignee has been added successfully.';
            this.snackBar.open(message, 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            if (addAnother) {
              this.form.reset({
                sameAsCustomer: false,
                internationalAddress: false,
                country: 'USA',
                effDate: this.minDate.clone()  // Re-populate effective date to chapter date
              });
              this.saveSuccess.emit();
            } else {
              this.saveSuccess.emit();
              this.closePanel.emit();
            }
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Failed to create consignee';
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      const updateDto: UpdateConsigneeDto = {
        name: formValue.name?.trim() || '',
        shortName: formValue.shortName?.trim() || '',
        intFlag: formValue.internationalAddress ? 'Y' : 'N',
        address1: formValue.address1?.trim() || '',
        address2: formValue.address2?.trim() || null,
        address3: formValue.address3?.trim() || null,
        city: formValue.city?.trim() || '',
        state: formValue.state || null,
        zip: formValue.zip?.trim() || '',
        country: formValue.country?.trim() || 'USA',
        zone: formValue.zone || null,
        outOfState: formValue.outOfState || null,
        phoneNo: this.stripPhone(formValue.phoneNo?.trim()) || null,
        faxNo: this.stripPhone(formValue.faxNo?.trim()) || null,
        intPhone: formValue.intPhone?.trim() || null,
        telexNo: formValue.telexNo?.trim() || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || this.data?.effDate || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null
      };

      this.consigneeApiService.updateConsignee(this.customerId, this.data!.consigneeId, updateDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
            this.savingAction = null;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Consignee has been updated successfully.';
            this.snackBar.open(message, 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Failed to update consignee';
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  // Date input handlers
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effDate')?.markAsTouched();
    this.form.get('effDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  // Error getters
  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  getFieldError(fieldName: string, displayName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return `${displayName} is required`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `${displayName} must not exceed ${maxLength} characters`;
    }
    if (control.hasError('invalidPhoneNumber')) {
      return control.getError('invalidPhoneNumber').message;
    }
    if (control.hasError('pattern')) {
      return `${displayName} has invalid format`;
    }
    return '';
  }

  getZipError(): string {
    const control = this.form.get('zip');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Postal/ZIP is required';
    }
    if (control.hasError('pattern')) {
      const isInternational = this.form.get('internationalAddress')?.value;
      return isInternational
        ? 'Postal/ZIP must contain only alphanumeric characters'
        : 'Postal/ZIP must contain only numbers';
    }
    if (control.hasError('maxlength')) {
      const max = control.getError('maxlength').requiredLength;
      return `Postal/ZIP must not exceed ${max} characters`;
    }
    return '';
  }

  private getFormSnapshot(): string {
    const val = this.form.getRawValue();
    return JSON.stringify({
      name: val.name ?? '',
      shortName: val.shortName ?? '',
      address1: val.address1 ?? '',
      address2: val.address2 ?? '',
      address3: val.address3 ?? '',
      city: val.city ?? '',
      state: val.state ?? '',
      zip: val.zip ?? '',
      country: val.country ?? '',
      zone: val.zone ?? '',
      outOfState: val.outOfState ?? '',
      phoneNo: val.phoneNo ?? '',
      faxNo: val.faxNo ?? '',
      intPhone: val.intPhone ?? '',
      telexNo: val.telexNo ?? '',
      effDate: val.effDate ? moment(val.effDate).format('YYYY-MM-DD') : '',
      termDate: val.termDate ? moment(val.termDate).format('YYYY-MM-DD') : ''
    });
  }

  get isFormChanged(): boolean {
    if (this.mode === 'add') return true;
    return this.getFormSnapshot() !== this.initialFormSnapshot;
  }

  get isFormValid(): boolean {
    return this.form.valid && this.isFormChanged;
  }

  stripPhoneOnFocus(controlName: string): void {
    const ctrl = this.form.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  formatPhoneOnBlur(controlName: string): void {
    const ctrl = this.form.get(controlName);
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

  private focusFirstInvalidField(): void {
    const firstInvalidKey = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidKey) {
      const el = document.querySelector<HTMLElement>(`[formControlName="${firstInvalidKey}"]`);
      if (el) el.focus();
    }
  }

  private stripPhone(value: string | null): string | null {
    return value ? value.replace(/\D/g, '') : value;
  }
}
