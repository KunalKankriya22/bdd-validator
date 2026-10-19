import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { trimmedMaxLengthValidator, trimmedRequiredValidator } from '../validators/interdiction-class.validator';
import { AssignInterdictionClassService } from '../services/assign-interdiction-class.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AssignInterdictionClassDto, AssignInterdictionClassModel } from '../models/assign-interdiction-class.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface InterdictionCodeOption {
  code: string;
  description: string;
}

export interface ClassOption {
  value: string;
  label: string;
}

export interface InterdictionClassFormData {
  interdictionCode: string;
  description: string;
  class: string;
  type: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

@Component({
  selector: 'app-add-edit-interdiction-class',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-interdiction-class.html',
  styleUrls: ['./add-edit-interdiction-class.scss']
})
export class AddEditInterdictionClass implements OnInit, OnChanges, OnDestroy {
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AssignInterdictionClassModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<InterdictionClassFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';
  modificationDate: Date | null = null;

  editModeValues: {
    interdictionCode: string;
    description: string;
    class: string;
    type: string;
  } = {
      interdictionCode: '',
      description: '',
      class: '',
      type: ''
    };

  readonly DESCRIPTION_MAX_LENGTH = 50;

  interdictionCodeOptions: InterdictionCodeOption[] = [];
  classOptions: ClassOption[] = [];

  // Search controls for dropdowns
  interdictionCodeSearchCtrl = new FormControl('');
  classSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredInterdictionCodeOptions = signal<InterdictionCodeOption[]>([]);
  filteredClassOptions = signal<ClassOption[]>([]);

  minDate = DateFieldValidationUtility.getMinDate();
  minTerminationDate = DateFieldValidationUtility.getMinDate();

  loadingInterdictionCodes = false;
  loadingClasses = false;
  loadingInterdictionDetails = false;
  isSaving = false;

  private initialFormValues: any = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private assignInterdictionClassService: AssignInterdictionClassService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      interdictionCode: ['', [trimmedRequiredValidator()]],
      description: [{ value: '', disabled: true }, [trimmedMaxLengthValidator(this.DESCRIPTION_MAX_LENGTH)]],
      class: ['', [Validators.required]],
      type: [{ value: '', disabled: true }],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadFiltersFromAPI();
    this.setupDateValidationListeners();
    this.setupInterdictionCodeChangeListener();
    this.setupSearchFilters();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Interdiction Class';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Code';

      const dateToDisplay = this.data?.modificationDate;
      this.lastUpdated = dateToDisplay ? `Last Updated: ${this.formatDateTime(dateToDisplay)}` : '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      interdictionCode: '',
      description: '',
      class: '',
      type: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('interdictionCode')?.enable();
    this.form.get('class')?.enable();

    this.form.get('description')?.disable();
    this.form.get('type')?.disable();

    // Reset initial values for change detection
    this.initialFormValues = null;

    DateFieldValidationUtility.setupAddModeValidators(this.form);
  }

  private populateFormForEdit(): void {
    if (this.data) {

      this.editModeValues = {
        interdictionCode: this.data.interdictionCode || '',
        description: this.data.description || '',
        class: this.data.class || '',
        type: this.formatType(this.data.type || '')
      };

      this.form.get('interdictionCode')?.disable();
      this.form.get('description')?.disable();
      this.form.get('class')?.disable();
      this.form.get('type')?.disable();

      this.form.patchValue({
        interdictionCode: this.data.interdictionCode || '',
        description: this.data.description || '',
        class: this.data.class || '',
        type: this.data.type || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      // Set initial min termination date: max(today, effectiveDate)
      if (this.data.effectiveDate) {
        const effMoment = moment(this.data.effectiveDate);
        const utcToday = DateFieldValidationUtility.getMinDate();
        this.minTerminationDate = effMoment.isAfter(utcToday) ? effMoment : utcToday;
      } else {
        this.minTerminationDate = DateFieldValidationUtility.getMinDate();
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();

      // Show error immediately if effective date is in the past
      const effControl = this.form.get('effectiveDate');
      if (effControl?.value && moment.isMoment(effControl.value) && effControl.value.isBefore(DateFieldValidationUtility.getMinDate())) {
        effControl.markAsTouched();
      }

      this.modificationDate = this.data.modificationDate || null;

      this.initialFormValues = {
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate).format('YYYY-MM-DD') : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate).format('YYYY-MM-DD') : null
      };
    }
  }

  private loadFiltersFromAPI(): void {
    this.loadingInterdictionCodes = true;
    this.loadingClasses = true;

    this.assignInterdictionClassService.getAssignInterdictionClassFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {

          if (response.data && Array.isArray(response.data)) {
            const filterData = response.data[0];

            if (filterData?.interdictionCode && Array.isArray(filterData.interdictionCode)) {
              this.interdictionCodeOptions = filterData.interdictionCode.map(code => ({
                code: code,
                description: ''
              }));
              this.filteredInterdictionCodeOptions.set(this.interdictionCodeOptions);
            }


            if (filterData?.class && Array.isArray(filterData.class)) {
              this.classOptions = filterData.class.map(classValue => ({
                value: classValue,
                label: classValue
              }));
              this.filteredClassOptions.set(this.classOptions);
            }
          }

          this.loadingInterdictionCodes = false;
          this.loadingClasses = false;
        },
        error: (err) => {
          console.error('Error loading filters:', err);
          this.loadingInterdictionCodes = false;
          this.loadingClasses = false;


        }
      });
  }

  /**
   * Setup search filtering for dropdowns
   */
  private setupSearchFilters(): void {
    // Filter Interdiction Code options
    this.interdictionCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterInterdictionCodes();
      });

    // Filter Class options
    this.classSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterClasses();
      });
  }

  private filterInterdictionCodes(): void {
    const search = this.interdictionCodeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredInterdictionCodeOptions.set(this.interdictionCodeOptions);
      return;
    }

    const filtered = this.interdictionCodeOptions.filter(option =>
      option.code.toLowerCase().includes(search)
    );
    this.filteredInterdictionCodeOptions.set(filtered);
  }

  private filterClasses(): void {
    const search = this.classSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredClassOptions.set(this.classOptions);
      return;
    }

    const filtered = this.classOptions.filter(option =>
      option.label.toLowerCase().includes(search)
    );
    this.filteredClassOptions.set(filtered);
  }

  /**
   * Setup listener for interdiction code changes
   * When code is selected in ADD mode, fetch details and populate description & type
   */
  private setupInterdictionCodeChangeListener(): void {

    if (this.mode !== 'add') {
      return;
    }

    this.form.get('interdictionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCode => {
        if (selectedCode && selectedCode.trim() !== '') {
          this.fetchInterdictionDetails(selectedCode.trim());
        } else {

          this.resetDependentFields();
        }
      });
  }

  /**
   * Fetch interdiction details by code and populate description & type
   * Uses AssignInterdictionClassService for fetching details
   */
  private fetchInterdictionDetails(interdictionCode: string): void {
    this.loadingInterdictionDetails = true;

    this.assignInterdictionClassService.getInterdictionByCode(interdictionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const description = response.interDesc || '';
          const type = response.interType || '';
          const formattedType = this.formatType(type);

          this.form.patchValue({
            description: description,
            type: formattedType
          });

          // Update editModeValues for display
          this.editModeValues.description = description;
          this.editModeValues.type = formattedType;

          this.loadingInterdictionDetails = false;
        },
        error: (err) => {
          console.error('Error fetching interdiction details:', err);
          this.loadingInterdictionDetails = false;


          this.resetDependentFields();

        }
      });
  }

  /**
   * Reset description and type fields when no code is selected
   */
  private resetDependentFields(): void {
    this.form.patchValue({
      description: '',
      type: ''
    });

    this.form.get('description')?.disable();
    this.form.get('type')?.disable();
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const utcToday = DateFieldValidationUtility.getMinDate();
        if (value && moment.isMoment(value) && value.isValid()) {
          this.minTerminationDate = value.isAfter(utcToday) ? value.clone() : utcToday;
        } else {
          this.minTerminationDate = utcToday;
        }
        this.form.get('terminationDate')?.updateValueAndValidity();
        this.validateEffectiveDateInput();
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDateInput();
      });
  }

  private validateEffectiveDateInput(): void {
    const control = this.form.get('effectiveDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      // Set custom error when input has text but value is null (invalid date)
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      // Clear custom error if input is empty or has valid value
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const dto: AssignInterdictionClassDto = {
      InterdictionCode: formValue.interdictionCode?.trim() || '',
      Class: formValue.class || '',
      EffectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : moment.utc().format('YYYY-MM-DD'),
      TerminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
    };

    this.isSaving = true;

    const apiCall = this.mode === 'add'
      ? this.assignInterdictionClassService.addInterdictionClass(dto)
      : this.assignInterdictionClassService.updateInterdictionClass(dto);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            // const message = this.mode === 'add'
            //   ? 'Interdiction Class added successfully'
            //   : 'Interdiction Class updated successfully';
            const message = response.message || 'Operation completed successfully';


            this.snackBar.open(message, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            const result: InterdictionClassFormData = {
              interdictionCode: formValue.interdictionCode?.trim() || '',
              description: formValue.description?.trim() || '',
              class: formValue.class || '',
              type: formValue.type || '',
              effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
              terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
            };

            this.saveSuccess.emit(result);
            this.closePanel.emit();
          }

        },
        error: (error) => {
          console.error('Error saving interdiction class:', error);
          const errorMessage = this.extractErrorMessage(error, 'Error saving interdiction class');
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const dto: AssignInterdictionClassDto = {
      InterdictionCode: formValue.interdictionCode?.trim() || '',
      Class: formValue.class || '',
      EffectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : moment.utc().format('YYYY-MM-DD'),
      TerminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
    };

    this.isSaving = true;

    const apiCall = this.mode === 'add'
      ? this.assignInterdictionClassService.addInterdictionClass(dto)
      : this.assignInterdictionClassService.updateInterdictionClass(dto);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            const message = response.message || 'Operation completed successfully';

            this.snackBar.open(message, 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            const result: InterdictionClassFormData = {
              interdictionCode: formValue.interdictionCode?.trim() || '',
              description: formValue.description?.trim() || '',
              class: formValue.class || '',
              type: formValue.type || '',
              effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
              terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
            };

            this.saveSuccess.emit(result);

            if (this.mode === 'edit') {
              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            } else {
              this.resetFormForAddMode();
            }
          } else {
          }
        },
        error: (error) => {
          console.error('Error saving interdiction class:', error);
          const errorMessage = this.extractErrorMessage(error, 'Error saving interdiction class');
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private hasDateValidationError(): boolean {
    const terminationControl = this.form.get('terminationDate');
    return terminationControl?.hasError('terminationBeforeEffective') || false;
  }

  get interdictionCodeControl() {
    return this.form.get('interdictionCode');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get classControl() {
    return this.form.get('class');
  }

  get typeControl() {
    return this.form.get('type');
  }

  private readonly typeMap: Record<string, string> = {
    'I': 'Initial', 'H': 'Hold', 'B': 'Bio', 'N': 'NFT'
  };

  formatType(value: string | null): string {
    if (!value) return '';
    return this.typeMap[value] || value;
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getInterdictionCodeError(): string {
    const control = this.interdictionCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('trimmedRequired')) {
      return 'Interdiction Code is required';
    }
    return '';
  }

  getClassError(): string {
    const control = this.classControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Class is required';
    }
    return '';
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

  getDescriptionRemainingCharacters(): string {
    const length = this.descriptionControl?.value?.length || 0;
    const remaining = this.DESCRIPTION_MAX_LENGTH - length;
    return `${remaining}/${this.DESCRIPTION_MAX_LENGTH}`;
  }

  formatDate(date: Date | moment.Moment | null): string {
    if (!date) return '-';
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.format('DD-MMM-YYYY');
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], HH:mm [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, HH:mm [PST]');
    }
  }

  getInterdictionCodeDisplay(code: string): string {
    return code;
  }

  /**
   * Check if form data has changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentEffectiveDate = this.form.get('effectiveDate')?.value;
    const currentEffectiveValue = currentEffectiveDate && moment.isMoment(currentEffectiveDate)
      ? currentEffectiveDate.format('YYYY-MM-DD')
      : null;

    const currentTerminationDate = this.form.get('terminationDate')?.value;
    const currentTerminationValue = currentTerminationDate && moment.isMoment(currentTerminationDate)
      ? currentTerminationDate.format('YYYY-MM-DD')
      : null;

    return currentEffectiveValue !== this.initialFormValues.effectiveDate
      || currentTerminationValue !== this.initialFormValues.terminationDate;
  }

  get isFormValid(): boolean {
    const isValid = this.form.valid && !this.hasDateValidationError();

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }

  get areDescriptionAndTypeDisabled(): boolean {
    if (this.mode === 'edit') {
      return true;
    }

    const codeControl = this.form.get('interdictionCode');
    return !codeControl?.value || codeControl.value.trim() === '';
  }

  /**
   * Extract error message with error code from API response
   */
  private extractErrorMessage(error: any, defaultMessage: string = 'Error saving record'): string {
    if (error?.error?.errorResponse?.error && error?.error?.errorResponse?.errorCode) {
      const errorCode = error.error.errorResponse.errorCode;
      const errorMessage = error.error.errorResponse.error;
      return `Error: ${errorCode} : ${errorMessage}`;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    return error?.message || defaultMessage;
  }
}