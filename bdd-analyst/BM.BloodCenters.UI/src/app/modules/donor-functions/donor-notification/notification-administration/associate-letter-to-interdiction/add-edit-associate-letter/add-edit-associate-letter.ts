import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment, { Moment } from 'moment';

import { AssociateLetterToInterdictionService } from '../services/associate-letter-to-interdiction.service';
import {
  AssociateLetterToInterdictionModel,
  CreateAssociateLetterToInterdictionDto,
  UpdateAssociateLetterToInterdictionDto,
  InterdictionDropdown,
  DonationTypeDropdown,
  LetterDropdown
} from '../models/associate-letter-to-interdiction.model';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-add-edit-associate-letter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-associate-letter.html',
  styleUrls: ['./add-edit-associate-letter.scss']
})
export class AddEditAssociateLetter implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AssociateLetterToInterdictionModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isSaving = false;

  interdictionOptions: InterdictionDropdown[] = [];
  filteredInterdictionOptions: InterdictionDropdown[] = [];
  interdictionSearchControl = new FormControl('');

  donationTypeOptions: DonationTypeDropdown[] = [];
  filteredDonationTypeOptions: DonationTypeDropdown[] = [];
  donationTypeSearchControl = new FormControl('');

  letterOptions: LetterDropdown[] = [];
  filteredLetterOptions: LetterDropdown[] = [];
  letterSearchControl = new FormControl('');

  isLoadingDropdowns = false;

  readonly selectPanelLoadingValue = '__PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__PANEL_EMPTY__';

  interdictionDescription = '-';
  donationDescription = '-';

  editModeValues = {
    interCode: '',
    interDesc: '',
    donationType: '',
    donationDesc: '',
    letterId: '',
    effDate: '',
    insertDate: ''
  };

  minDate = DateFieldValidationUtility.getMinDate();

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.form?.get('effDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }
    return true;
  };

  private originalInterCode = '';
  private originalDonationType = '';
  private originalLetterId = '';
  private originalEffDate = '';
  private initialTermDate: number | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: AssociateLetterToInterdictionService,
    private snackBar: MatSnackBar,
    private dateAdapter: DateAdapter<Moment>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownOptions();

    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    }

    this.setupSearchFilters();
    this.setupDateValidation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (this.form) {
        this.resetAndReinitialize();
      }
    }
  }

  private resetAndReinitialize(): void {
    this.initializeForm();

    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    }

    this.interdictionDescription = '-';
    this.donationDescription = '-';
    this.setupDateValidation();
  }

  private setupSearchFilters(): void {
    this.interdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredInterdictionOptions = this.interdictionOptions.filter(item =>
          item.interCode.toLowerCase().includes(term) || item.interDesc.toLowerCase().includes(term)
        );
      });

    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredDonationTypeOptions = this.donationTypeOptions.filter(item =>
          item.donationType.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)
        );
      });

    this.letterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredLetterOptions = this.letterOptions.filter(item =>
          item.letterCode.toLowerCase().includes(term) || item.letterId.toLowerCase().includes(term) || item.letterTitle.toLowerCase().includes(term)
        );
      });
  }

  private setupDateValidation(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.validateTerminationDateInput();
      });

    if (this.mode === 'add') {
      this.form.get('effDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.validateEffectiveDateInput();
        });
    }

    this.form.get('interCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const selected = this.interdictionOptions.find(item => item.interCode === value);
        this.interdictionDescription = selected?.interDesc || '-';
      });

    this.form.get('donationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const selected = this.donationTypeOptions.find(item => item.donationType === value);
        this.donationDescription = selected?.description || '-';
      });
  }

  private initializeForm(): void {
    const effectiveDateValidators = this.mode === 'add'
      ? [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]
      : [Validators.required];

    this.form = this.fb.group({
      interCode: ['', [Validators.required]],
      donationType: ['', [Validators.required]],
      letterId: ['', [Validators.required]],
      effDate: [null, effectiveDateValidators],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private loadDropdownOptions(): void {
    this.isLoadingDropdowns = true;

    this.service.getInterdictionsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.interdictionOptions = options;
          this.filteredInterdictionOptions = [...options];
        },
        error: () => {
          this.snackBar.open('Failed to load interdiction codes.', 'Close', { duration: 5000 });
          this.interdictionOptions = [];
          this.filteredInterdictionOptions = [];
        }
      });

    this.service.getDonationTypesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.donationTypeOptions = options;
          this.filteredDonationTypeOptions = [...options];
        },
        error: () => {
          this.snackBar.open('Failed to load donation types.', 'Close', { duration: 5000 });
          this.donationTypeOptions = [];
          this.filteredDonationTypeOptions = [];
        }
      });

    this.service.getLettersDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.letterOptions = options;
          this.filteredLetterOptions = [...options];
          this.isLoadingDropdowns = false;
        },
        error: () => {
          this.snackBar.open('Failed to load letter codes.', 'Close', { duration: 5000 });
          this.letterOptions = [];
          this.filteredLetterOptions = [];
          this.isLoadingDropdowns = false;
        }
      });
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    const editData = this.data;

    this.originalInterCode = editData.interCode || '';
    this.originalDonationType = editData.donationType || '';
    this.originalLetterId = editData.letterId || '';
    this.originalEffDate = editData.effDate ? moment(editData.effDate).format('YYYY-MM-DD') : '';

    this.editModeValues = {
      interCode: editData.interCode || '-',
      interDesc: editData.interDesc || '-',
      donationType: editData.donationType || '-',
      donationDesc: editData.donationDesc || '-',
      letterId: editData.letterId || '-',
      effDate: editData.effDate ? this.formatDateForDisplay(editData.effDate) : '-',
      insertDate: editData.insertDate ? this.formatDateForDisplay(editData.insertDate) : ''
    };

    this.form.get('interCode')?.disable();
    this.form.get('donationType')?.disable();
    this.form.get('letterId')?.disable();
    this.form.get('effDate')?.disable();

    this.form.get('interCode')?.clearValidators();
    this.form.get('donationType')?.clearValidators();
    this.form.get('letterId')?.clearValidators();
    this.form.get('effDate')?.clearValidators();
    this.form.get('interCode')?.updateValueAndValidity();
    this.form.get('donationType')?.updateValueAndValidity();
    this.form.get('letterId')?.updateValueAndValidity();
    this.form.get('effDate')?.updateValueAndValidity();

    this.form.patchValue({
      interCode: editData.interCode || '',
      donationType: editData.donationType || '',
      letterId: editData.letterId || '',
      effDate: editData.effDate ? moment(editData.effDate) : null,
      termDate: editData.termDate ? moment(editData.termDate) : null
    });

    this.initialTermDate = editData.termDate ? moment(editData.termDate).valueOf() : null;
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  onEffectiveDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('effDate');
      const inputElement = this.effectiveDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control?.markAsTouched();

      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateEffectiveDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  onTerminationDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('termDate');
      const inputElement = this.terminationDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control?.markAsTouched();

      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          control?.setValue(parsed);
          if (inputElement) {
            inputElement.value = this.dateAdapter.format(parsed, DD_MON_YYYY_FORMATS.display.dateInput);
          }
        }
      }

      this.validateTerminationDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('termDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Link Letter to Interdiction' : 'Edit Rule';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(createAnother = false): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: CreateAssociateLetterToInterdictionDto = {
        interCode: formValue.interCode?.trim() || '',
        donationType: formValue.donationType?.trim() || '',
        letterId: formValue.letterId?.trim() || '',
        effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DDTHH:mm:ss') : '',
        termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DDTHH:mm:ss') : undefined
      };
      apiCall = this.service.create(addPayload);
    } else {
      const updatePayload: UpdateAssociateLetterToInterdictionDto = {
        effDate: this.originalEffDate ? moment(this.originalEffDate).format('YYYY-MM-DDTHH:mm:ss') : '',
        termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DDTHH:mm:ss') : undefined
      };
      apiCall = this.service.update(
        this.originalInterCode,
        this.originalDonationType,
        this.originalLetterId,
        updatePayload
      );
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          const letterId = this.mode === 'add'
            ? formValue.letterId?.trim() || ''
            : this.originalLetterId;
          const message = this.mode === 'add'
            ? `"${letterId}" letter added successfully.`
            : `"${letterId}" letter updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();

          if (createAnother) {
            this.resetFormForCreateAnother();
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
  }

  private handleApiError(error: any): void {
    const apiError = error?.error;
    const errorCode = apiError?.errorCode || apiError?.errorResponse?.errorCode;
    const errorMessage = apiError?.errorResponse?.errorMessage || apiError?.errorResponse?.error || apiError?.message;

    if (apiError?.statusCode === 409 || errorCode === '18132' || errorCode === '18188') {
      this.snackBar.open(
        errorMessage || 'A record with this combination already exists.',
        'DISMISS',
        { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
      );
      return;
    }

    if (apiError?.statusCode === 404) {
      this.snackBar.open(
        errorMessage || 'Record not found.',
        'DISMISS',
        { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
      );
      return;
    }

    if (errorMessage) {
      this.snackBar.open(errorMessage, 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.snackBar.open('An error occurred. Please try again.', 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private resetFormForCreateAnother(): void {
    this.form.reset({
      interCode: '',
      donationType: '',
      letterId: '',
      effDate: null,
      termDate: null
    });
    this.interdictionDescription = '-';
    this.donationDescription = '-';
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit') {
      return true;
    }

    const currentTermDate = this.form.get('termDate')?.value;
    const currentTermValue = currentTermDate && moment.isMoment(currentTermDate)
      ? currentTermDate.valueOf()
      : null;

    return currentTermValue !== this.initialTermDate;
  }

  get isFormValid(): boolean {
    const isValid = this.form.valid;

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }

  get saveButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  getInterdictionCodeError(): string {
    const control = this.form.get('interCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Interdiction Code is required';
    return '';
  }

  getDonationTypeError(): string {
    const control = this.form.get('donationType');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Donation Type is required';
    return '';
  }

  getLetterIdError(): string {
    const control = this.form.get('letterId');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Letter Code is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effDate');
    if (!control) return '';

    const inputElement = this.effectiveDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Effective date is invalid';
    }

    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      control, 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control) return '';

    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination date is invalid';
    }

    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control, 'Termination Date', 'Effective Date', formErrors
    );
  }
}
