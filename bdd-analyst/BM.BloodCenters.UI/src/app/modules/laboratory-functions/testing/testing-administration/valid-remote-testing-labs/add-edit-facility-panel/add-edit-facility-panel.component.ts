import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';
import { ValidRemoteTestingLabDto, TestingLabLookupDto } from '../models/valid-remote-testing-labs.model';
import { ValidRemoteTestingLabsApiService } from '../services/valid-remote-testing-labs-api.service';

@Component({
  selector: 'app-add-edit-facility-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    UppercaseInputDirective,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-facility-panel.component.html',
  styleUrls: ['./add-edit-facility-panel.component.scss'],
})
export class AddEditFacilityPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ValidRemoteTestingLabsApiService);
  private readonly snackbarService = inject(SnackbarService);
  readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  facility?: ValidRemoteTestingLabDto;
  isEdit = false;
  facilityId?: string;
  facilityForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  testingLabsList: TestingLabLookupDto[] = [];
  filteredTestingLabsList: TestingLabLookupDto[] = [];
  currentChapterId: string = '';

  // Track overflow state for tooltip
  cityOverflowing = false;
  medicalDirectorOverflowing = false;

  // Stores original eff date for edit-mode validation
  private originalEffDate: moment.Moment | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  // Custom error state matchers for date fields
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  headerConfig: PageHeaderConfig = {
    title: 'Add New Facility',
    subtitle: '',
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Valid Remote Testing Labs', link: '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs' },
      { label: 'Add New Facility' },
    ],
    showBackButton: true,
    onBackClick: () => this.onCancel(),
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= effective date if set
    const effDate = this.facilityForm?.get('effDate')?.value;
    if (effDate) {
      const effDay = moment(effDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  ngOnInit(): void {
    // Check if edit mode
    this.facilityId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.facilityId;

    // Get current chapter ID
    this.currentChapterId = this.headerService.chapterId();

    // Update header config for edit mode
    if (this.isEdit) {
      this.headerConfig.title = 'Edit Facility'; // Temporary until data loads
      this.headerConfig.breadcrumbs[2].label = 'Edit Facility';
    }

    this.buildForm();
    this.setupLabIdAutocomplete();  // Setup filter BEFORE loading data
    this.loadTestingLabs();
    this.subscribeToChapterChanges();

    if (this.isEdit && this.facilityId) {
      this.loadFacility(this.facilityId);
    }
  }

  private subscribeToChapterChanges(): void {
    // Redirect to main screen when chapter changes
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigate(['/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs']);
      });
  }

  private loadTestingLabs(): void {
    // Only load in add mode
    if (!this.isEdit) {
      this.service.getLookup()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (labs) => {
            this.testingLabsList = labs;
            this.filteredTestingLabsList = [...labs];
          },
        });
    }
  }

  private setupLabIdAutocomplete(): void {
    const labIdCtrl = this.facilityForm.get('testingLabId');
    if (!labIdCtrl) return;

    labIdCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        const term = (value ?? '').toLowerCase().trim();

        if (!term) {
          this.filteredTestingLabsList = [...this.testingLabsList];
        } else {
          this.filteredTestingLabsList = this.testingLabsList
            .filter(lab =>
              (lab.testingLabId ?? '').toLowerCase().includes(term) ||
              (lab.testingLabName ?? '').toLowerCase().includes(term)
            )
            .sort((a, b) => {
              const aIdStarts = (a.testingLabId ?? '').toLowerCase().startsWith(term);
              const bIdStarts = (b.testingLabId ?? '').toLowerCase().startsWith(term);
              if (aIdStarts && !bIdStarts) return -1;
              if (!aIdStarts && bIdStarts) return 1;
              return 0;
            });
        }

        // Check for duplicate lab ID
        const existingLab = this.testingLabsList.find(
          lab => (lab.testingLabId ?? '').toUpperCase() === (value ?? '').toUpperCase().trim()
        );
        if (existingLab) {
          labIdCtrl.setErrors({ ...labIdCtrl.errors, labIdExists: true });
        } else {
          // Clear only the labIdExists error, preserve others
          if (labIdCtrl.errors?.['labIdExists']) {
            const { labIdExists, ...rest } = labIdCtrl.errors;
            labIdCtrl.setErrors(Object.keys(rest).length ? rest : null);
          }
        }

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFacility(id: string): void {
    this.isLoading = true;
    this.service.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facility) => {
          this.facility = facility;
          this.patchFormWithFacility(facility);
          this.isLoading = false;

          // Update page title and breadcrumb with facility name
          if (facility.testingLabName) {
            this.headerConfig = {
              ...this.headerConfig,
              title: facility.testingLabName,
              subtitle: facility.chapterId || '',
              breadcrumbs: [
                { label: 'Home', link: '/' },
                { label: 'Valid Remote Testing Labs', link: '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs' },
                { label: facility.testingLabName },
              ],
            };
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private buildForm(): void {
    this.facilityForm = this.fb.group({
      testingLabId: [
        { value: '', disabled: this.isEdit },
        Validators.required,
      ],
      testingLabName: ['', Validators.required],
      contractId: ['', Validators.required],
      cliaNumber: [''],
      medicalDirector: [''],
      effDate: [null, [Validators.required]],  // Additional validators added after form creation
      termDate: [null],  // Validators added after form creation
      intFlag: [false],
      addr1: ['', Validators.required],
      addr2: [''],
      addr3: [''],
      city: ['', Validators.required],
      stateCode: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],
      phoneNumber: [''],
      faxNumber: [''],
      intPhoneNumber: [''],
      telexNumber: [''],
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()],
    });

    // Setup date validators based on mode
    if (this.isEdit) {
      const effDateCtrl = this.facilityForm.get('effDate');
      if (effDateCtrl) {
        effDateCtrl.setValidators([
          Validators.required,
          DateFieldValidationUtility.validDateValidator(),
          this.editModeEffDateValidator(),
        ]);
        effDateCtrl.updateValueAndValidity({ emitEvent: false });
      }

      const termDateCtrl = this.facilityForm.get('termDate');
      if (termDateCtrl) {
        termDateCtrl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
        ]);
        termDateCtrl.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      // In add mode, both dates are editable
      DateFieldValidationUtility.setupAddModeValidators(this.facilityForm, this.chapterOffset);
    }

    this.facilityForm.get('intFlag')?.valueChanges.subscribe((isInternational: boolean) => {
      const stateControl = this.facilityForm.get('stateCode');
      if (isInternational) {
        stateControl?.clearValidators();
        stateControl?.setValue(null);
      } else {
        stateControl?.setValidators(Validators.required);
      }
      stateControl?.updateValueAndValidity({ emitEvent: false });
    });

    this.facilityForm.get('effDate')?.valueChanges.subscribe(() => {
      const termDateCtrl = this.facilityForm.get('termDate');
      if (termDateCtrl?.value) {
        termDateCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  private editModeEffDateValidator() {
    return (control: any) => {
      if (!control.value) return null;
      const value = moment(control.value).startOf('day');

      // Allow the original date to remain unchanged
      if (this.originalEffDate && value.isSame(this.originalEffDate, 'day')) {
        return null;
      }

      // Block new past dates
      const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
      const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');
      if (value.isBefore(today)) {
        return { effectiveDatePast: true };
      }

      return null;
    };
  }

  private patchFormWithFacility(facility: ValidRemoteTestingLabDto): void {
    this.originalEffDate = facility.effDate ? moment(facility.effDate).startOf('day') : null;

    this.facilityForm.patchValue({
      testingLabId: facility.testingLabId,
      testingLabName: facility.testingLabName,
      contractId: facility.contractId,
      cliaNumber: facility.cliaNumber || '',
      medicalDirector: facility.medicalDirector || '',
      effDate: facility.effDate ? moment(facility.effDate) : null,
      termDate: facility.termDate ? moment(facility.termDate) : null,
      intFlag: facility.intFlag === 'Y',
      addr1: facility.addr1 || '',
      addr2: facility.addr2 || '',
      addr3: facility.addr3 || '',
      city: facility.city || '',
      stateCode: facility.stateCode || '',
      zip: facility.zip || '',
      country: facility.country || '',
      phoneNumber: this.formatPhoneForDisplay(facility.phoneNumber),
      faxNumber: this.formatPhoneForDisplay(facility.faxNumber),
      intPhoneNumber: facility.intPhoneNumber || '',
      telexNumber: facility.telexNumber || '',
    });
  }

  /**
   * Format phone number for display
   * Converts 1234567890 to 123-456-7890
   */
  private formatPhoneForDisplay(phoneNumber: string | null | undefined): string {
    if (!phoneNumber) return '';
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
    }
    return phoneNumber;
  }

  /**
   * Check if text is overflowing in input field
   * Only show tooltip if text is not fully visible
   */
  checkOverflow(event: Event, field: 'city' | 'medicalDirector'): void {
    const input = event.target as HTMLInputElement;
    // Check if scrollWidth is greater than clientWidth (indicates overflow)
    const isOverflowing = input.scrollWidth > input.clientWidth;

    if (field === 'city') {
      this.cityOverflowing = isOverflowing;
    } else if (field === 'medicalDirector') {
      this.medicalDirectorOverflowing = isOverflowing;
    }
  }

  onCancel(): void {
    this.router.navigate(['/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs']);
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.facilityForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.facilityForm.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    if (this.lastChangedDateField === 'effective' && this.facilityForm.get('termDate')?.hasError('matDatepickerMin')) {
      return '';
    }
    const formErrors = this.lastChangedDateField === 'termination' ? this.facilityForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.facilityForm.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onSave(): void {
    if (this.facilityForm.invalid) {
      this.facilityForm.markAllAsTouched();
      return;
    }

    const formValue = this.facilityForm.getRawValue();
    const payload = {
      testingLabId: formValue.testingLabId,
      testingLabName: formValue.testingLabName,
      contractId: formValue.contractId,
      cliaNumber: formValue.cliaNumber || null,
      medicalDirector: formValue.medicalDirector || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || null,
      address: {
        intFlag: formValue.intFlag ? 'Y' : 'N',
        addr1: formValue.addr1,
        addr2: formValue.addr2 || null,
        addr3: formValue.addr3 || null,
        city: formValue.city,
        stateCode: formValue.stateCode || null,
        zip: formValue.zip,
        country: formValue.country,
        phoneNumber: formValue.phoneNumber || null,
        intPhoneNumber: formValue.intPhoneNumber || null,
        telexNumber: formValue.telexNumber || null,
        faxNumber: formValue.faxNumber || null,
      },
    };

    this.isSaving = true;
    const request$ = this.isEdit
      ? this.service.update(this.facilityId!, payload)
      : this.service.create(payload);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(
            this.isEdit ? 'Facility updated successfully' : 'Facility created successfully'
          );
          this.router.navigate(['/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs']);
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '';
    const date = moment(dateString);
    return date.isValid() ? date.format('DD-MMM-YYYY') : '';
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.facilityForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.facilityForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        testingLabId: 'Test Lab ID',
        testingLabName: 'Name',
        contractId: 'Contact Code',
        effDate: 'Effective Date',
        addr1: 'Address Line 1',
        city: 'City',
        stateCode: 'State',
        zip: 'Postal/ZIP',
        country: 'Country',
      };
      return `${labels[controlName] || controlName} is required`;
    }

    if (control.hasError('labIdExists')) return 'Lab ID already exists';
    if (control.hasError('matDatepickerParse')) return 'Invalid date format';
    if (control.hasError('invalidDate')) return 'Invalid date';
    if (control.hasError('effectiveDatePast')) return 'Date cannot be in the past';
    if (control.hasError('terminationDatePast')) return 'Date cannot be in the past';

    const formErrors = this.facilityForm.errors;
    if (formErrors?.['dateRangeInvalid'] && controlName === 'termDate') {
      return 'Must be on or after Effective Date';
    }

    return '';
  }

  onEffDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.facilityForm.get('effDate')
    );
  }

  onEffDateChanged(): void {
    this.lastChangedDateField = 'effective';
  }

  onTermDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.facilityForm.get('termDate'),
      this.isEdit
    );
  }

  onTermDateChanged(): void {
    this.lastChangedDateField = 'termination';
  }

  /**
   * Format phone number input to 123-456-7890 pattern
   * Only allows numbers and auto-formats as user types
   */
  onPhoneInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.facilityForm.get(controlName);
    if (!control) return;

    // Remove all non-numeric characters
    let value = input.value.replace(/\D/g, '');

    // Limit to 10 digits
    value = value.substring(0, 10);

    // Format as 123-456-7890
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 3);
      if (value.length >= 4) {
        formatted += '-' + value.substring(3, 6);
      }
      if (value.length >= 7) {
        formatted += '-' + value.substring(6, 10);
      }
    }

    // Update the form control and input value
    control.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  onTestingLabSelected(event: any): void {
    const testingLabId = event.option.value;
    const selectedLab = this.testingLabsList.find(lab => lab.testingLabId === testingLabId);
    if (selectedLab) {
      this.facilityForm.patchValue({
        testingLabName: selectedLab.testingLabName
      });
    }
  }

  displayLabId(value: string): string {
    return value || '';
  }
}
