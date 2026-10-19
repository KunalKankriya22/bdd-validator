import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DefineDonationProceduresService } from '../services/define-donation-procedures.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import {
  DefineDonationProceduresModel,
  CreateDonationProcedureDto,
  UpdateDonationProcedureDto,
  LookUp,
  DonationProcedureLookupModel
} from '../models/define-donation-procedures.model';

// Kept for backward compatibility with spec files
export interface AddEditDonationProcedureDialogData {
  mode: 'add' | 'edit';
  data?: DefineDonationProceduresModel;
}

interface SelectedProcedureCode {
  code: string;
  description: string;
}

// Side panel component for adding/editing donation procedures
@Component({
  selector: 'app-add-edit-donation-procedure',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-donation-procedure.html',
  styleUrls: ['./add-edit-donation-procedure.scss']
})
export class AddEditDonationProcedureComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineDonationProceduresModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  // Support for both side panel and dialog modes
  private isDialogMode = false;

  donationProcedureForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  panelTitle!: string;
  minDate!: moment.Moment;
  minTerminationDate: moment.Moment | null = null;

  // Dropdown options
  donationTypes: LookUp[] = [];
  procedureCodes: LookUp[] = [];

  // Filtered lists for ngx-mat-select-search
  filteredDonationTypes: LookUp[] = [];
  filteredProcedureCodes: LookUp[] = [];

  // Search controls
  donationTypeSearchControl = new FormControl<string>('');
  procedureCodeSearchControl = new FormControl<string>('');

  // Loading states
  isLoadingDonationTypes = false;
  isLoadingProcedureCodes = false;

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   * Not valid API codes; options are disabled so they never become the control value.
   */
  readonly selectPanelLoadingValue = '__ADD_EDIT_DONATION_PROCEDURE_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__ADD_EDIT_DONATION_PROCEDURE_PANEL_EMPTY__';

  // Selected procedure codes for the table
  selectedProcedureCodes: SelectedProcedureCode[] = [];
  displayedColumns: string[] = ['code', 'description', 'actions'];

  // Current donation type description
  selectedDonationTypeDescription = '';

  // Edit mode - selected procedure code and description
  selectedProcedureCode = '';
  selectedProcedureCodeDescription = '';

  // Edit mode values for display
  editModeValues = {
    effectiveDate: ''
  };

  // Date raw input tracking
  effDateRawInput = '';
  termDateRawInput = '';

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private defineDonationProceduresService: DefineDonationProceduresService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<AddEditDonationProcedureComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) dialogData?: AddEditDonationProcedureDialogData
  ) {
    // If opened as dialog, use dialog data
    if (dialogRef && dialogData) {
      this.isDialogMode = true;
      this.mode = dialogData.mode;
      this.data = dialogData.data || null;
    }
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.setupPanel();
    this.setupDropdownSearch();
    this.loadLookupData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    this.panelTitle = this.mode === 'add' ? 'Add Donation Procedure' : 'Edit Donation Procedure';
    this.initializeForm();
  }

  /**
   * Setup dropdown search filters (same pattern as add-edit-valid-abo)
   */
  private setupDropdownSearch(): void {
    // Donation Type search
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDonationTypes = this.donationTypes.filter(
          (option) =>
            option.key.toLowerCase().includes(term) ||
            option.value.toLowerCase().includes(term)
        );
      });

    // Procedure Code search
    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProcedureCodes = this.procedureCodes.filter(
          (option) =>
            option.key.toLowerCase().includes(term) ||
            option.value.toLowerCase().includes(term)
        );
      });
  }

  private initializeForm(): void {
    // Reset raw input tracking
    this.effDateRawInput = '';
    this.termDateRawInput = '';

    // Clear all state variables
    this.selectedProcedureCodes = [];
    this.selectedDonationTypeDescription = '';
    this.selectedProcedureCode = '';
    this.selectedProcedureCodeDescription = '';
    this.editModeValues.effectiveDate = '';

    const effectiveDateValidators = this.mode === 'add'
      ? [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]
      : [Validators.required];

    this.donationProcedureForm = this.fb.group({
      donationType: ['', Validators.required],
      procedureCodeSelect: [[], [(control: AbstractControl) => control.value?.length === 0 ? { required: true } : null]],
      effectiveDate: [null, effectiveDateValidators],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    // Set initial minTerminationDate for ADD mode
    if (this.mode === 'add') {
      this.minTerminationDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

      // Reset search controls and filtered lists
      this.donationTypeSearchControl.setValue('', { emitEvent: false });
      this.procedureCodeSearchControl.setValue('', { emitEvent: false });
      this.filteredDonationTypes = [...this.donationTypes];
      this.filteredProcedureCodes = [...this.procedureCodes];

      // Ensure all form fields are enabled in add mode
      this.donationProcedureForm.get('donationType')?.enable();
      this.donationProcedureForm.get('procedureCodeSelect')?.enable();
      this.donationProcedureForm.get('effectiveDate')?.enable();
    }

    // Listen to donation type changes to update description
    this.donationProcedureForm.get('donationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(donationType => {
        this.onDonationTypeChange(donationType);
      });

    // Listen to procedure code selection changes
    this.donationProcedureForm.get('procedureCodeSelect')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCodes => {
        this.updateSelectedProcedureCodes(selectedCodes);
      });

    // Listen to effective date changes to update min termination date
    this.donationProcedureForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (this.mode === 'add') {
          // ADD mode: Termination date must be >= effective date and >= chapter's today
          if (value && moment.isMoment(value) && value.isValid() && value.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')) {
            this.minTerminationDate = value.clone().startOf('day');
          } else {
            this.minTerminationDate = chapterToday.clone();
          }
        } else {
          // EDIT mode: Termination date must be >= max(chapter's today, effective date)
          if (value && moment.isMoment(value) && value.isValid()) {
            const effDate = value.clone().startOf('day');
            this.minTerminationDate = effDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')
              ? effDate : chapterToday.clone();
          } else {
            this.minTerminationDate = chapterToday.clone();
          }
        }
        // Re-validate termination date when effective date changes
        this.donationProcedureForm.get('terminationDate')?.updateValueAndValidity();
      });

    // In edit mode, populate the form
    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit(this.data);
    }
  }

  private loadLookupData(): void {
    this.isLoading = true;
    this.isLoadingDonationTypes = true;
    this.isLoadingProcedureCodes = true;

    this.defineDonationProceduresService
      .getLookupDropdownValues(this.headerService.getCurrentChapterId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookupData: DonationProcedureLookupModel) => {
          this.donationTypes = lookupData.donationTypes || [];
          this.procedureCodes = lookupData.procedureCodes || [];

          // Initialize filtered lists
          this.filteredDonationTypes = [...this.donationTypes];
          this.filteredProcedureCodes = [...this.procedureCodes];

          // Reset search controls
          this.donationTypeSearchControl.setValue('', { emitEvent: false });
          this.procedureCodeSearchControl.setValue('', { emitEvent: false });

          this.isLoading = false;
          this.isLoadingDonationTypes = false;
          this.isLoadingProcedureCodes = false;

          // If edit mode, set the description after data is loaded
          if (this.mode === 'edit' && this.data) {
            this.setDonationTypeDescription(this.data.donationType);
          }
        },
        error: (error) => {
          console.error('Error loading lookup data:', error);
          this.donationTypes = [];
          this.procedureCodes = [];
          this.filteredDonationTypes = [];
          this.filteredProcedureCodes = [];
          this.isLoading = false;
          this.isLoadingDonationTypes = false;
          this.isLoadingProcedureCodes = false;
          // Error is handled globally by authInterceptor
        }
      });
  }

  private populateFormForEdit(data: DefineDonationProceduresModel): void {
    // In edit mode, only one procedure code is editable
    this.donationProcedureForm.patchValue({
      donationType: data.donationType,
      procedureCodeSelect: [data.procedureCode],
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      terminationDate: data.terminationDate ? new Date(data.terminationDate) : null
    });

    // Disable donation type, procedure code, and effective date in edit mode
    this.donationProcedureForm.get('donationType')?.disable();
    this.donationProcedureForm.get('procedureCodeSelect')?.disable();
    this.donationProcedureForm.get('effectiveDate')?.disable();

    // Set edit mode procedure code values
    this.selectedProcedureCode = data.procedureCode;
    this.selectedProcedureCodeDescription = data.procedureCodeDescription;

    // Set selected procedure codes
    this.selectedProcedureCodes = [{
      code: data.procedureCode,
      description: data.procedureCodeDescription
    }];

    // Format effective date for display
    this.editModeValues.effectiveDate = this.formatDateForDisplay(data.effectiveDate);

    // Set minTerminationDate for edit mode: max(chapter's today, effective date)
    if (data.effectiveDate) {
      const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      const effDate = moment(data.effectiveDate).startOf('day');
      this.minTerminationDate = effDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')
        ? effDate : chapterToday.clone();
    }

    // Mark form as pristine and untouched so save button is disabled until user makes changes
    this.donationProcedureForm.markAsPristine();
    this.donationProcedureForm.markAsUntouched();
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  private onDonationTypeChange(donationType: string): void {
    this.setDonationTypeDescription(donationType);
  }

  private setDonationTypeDescription(donationType: string): void {
    const selectedType = this.donationTypes.find(dt => dt.key === donationType);
    this.selectedDonationTypeDescription = selectedType ? selectedType.value : '';
  }

  private updateSelectedProcedureCodes(selectedCodes: string[]): void {
    // Build the selected procedure codes array from the selected keys
    this.selectedProcedureCodes = selectedCodes.map(code => {
      const procedureCode = this.procedureCodes.find(pc => pc.key === code);
      return {
        code: code,
        description: procedureCode ? procedureCode.value : ''
      };
    });
  }

  removeProcedureCode(code: string): void {
    const currentSelection = this.donationProcedureForm.get('procedureCodeSelect')?.value || [];
    const updatedSelection = currentSelection.filter((c: string) => c !== code);
    this.donationProcedureForm.patchValue({
      procedureCodeSelect: updatedSelection
    });
  }

  onCancel(): void {
    if (this.isDialogMode && this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closePanel.emit();
    }
  }

  onSave(): void {
    this.markFormGroupTouched(this.donationProcedureForm);

    if (this.donationProcedureForm.invalid) {
      return;
    }

    if (this.mode === 'add' && this.selectedProcedureCodes.length === 0) {
      return;
    }

    this.isSaving = true;

    if (this.mode === 'add') {
      this.saveNewRecord();
    } else {
      this.updateRecord();
    }
  }

  private saveNewRecord(): void {
    const formValue = this.donationProcedureForm.getRawValue();

    const payload: CreateDonationProcedureDto = {
      donationType: formValue.donationType,
      procedureCodes: this.selectedProcedureCodes.map(pc => pc.code),
      effectiveDate: this.serializeDate(formValue.effectiveDate),
      terminationDate: formValue.terminationDate ? this.serializeDate(formValue.terminationDate) : null,
      chapterId: this.headerService.getCurrentChapterId(),
      insertUser: this.loginService.getStoredUsername()
    };

    this.defineDonationProceduresService
      .addDonationProcedure(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isSaving = false;
          const message = response?.message || 'Donation procedure added successfully.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (this.isDialogMode && this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.saveSuccess.emit();
            this.closePanel.emit();
          }
        },
        error: (error) => {
          console.error('Error adding donation procedure:', error);
          this.isSaving = false;
          // Error is handled globally by authInterceptor
        }
      });
  }

  private updateRecord(): void {
    const formValue = this.donationProcedureForm.getRawValue();

    const payload: UpdateDonationProcedureDto = {
      donationType: formValue.donationType,
      procedureCode: this.selectedProcedureCode,
      effectiveDate: this.serializeDate(formValue.effectiveDate),
      terminationDate: formValue.terminationDate ? this.serializeDate(formValue.terminationDate) : null,
      chapterId: this.headerService.getCurrentChapterId(),
      insertUser: this.loginService.getStoredUsername()
    };

    this.defineDonationProceduresService
      .updateDonationProcedure(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isSaving = false;
          const message = response?.message || 'Donation procedure updated successfully.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (this.isDialogMode && this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.saveSuccess.emit();
            this.closePanel.emit();
          }
        },
        error: (error) => {
          console.error('Error updating donation procedure:', error);
          this.isSaving = false;
          // Error is handled globally by authInterceptor
        }
      });
  }

  private serializeDate(date: moment.Moment | Date | null): string {
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('YYYY-MM-DD');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }


  /**
   * Handle date input changes (same pattern as add-edit-valid-abo)
   */
  onDateInputChange(event: Event, controlName: 'effectiveDate' | 'terminationDate'): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() ?? '';

    if (controlName === 'effectiveDate') {
      this.effDateRawInput = inputValue;
    } else {
      this.termDateRawInput = inputValue;
    }

    this.validateDateInput(inputValue, controlName);
  }

  /**
   * Handle date blur events
   */
  onDateBlur(event: Event, controlName: 'effectiveDate' | 'terminationDate'): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() ?? '';

    if (!inputValue) {
      if (controlName === 'effectiveDate') {
        this.effDateRawInput = '';
      } else {
        this.termDateRawInput = '';
      }
    }

    this.validateDateInput(inputValue, controlName);
  }

  /**
   * Validate date input (manual typing support)
   */
  private validateDateInput(inputValue: string, controlName: 'effectiveDate' | 'terminationDate'): void {
    const control = this.donationProcedureForm.get(controlName);
    if (!control) return;

    if (!inputValue) {
      if (control.hasError('invalidDateFormat')) {
        const errors = { ...control.errors };
        delete errors['invalidDateFormat'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return;
    }

    const trimmedInput = inputValue.trim().toUpperCase();
    const parsedDate = moment(trimmedInput, ['DD-MMM-YYYY', 'DD/MMM/YYYY', 'DD-MM-YYYY', 'DD/MM/YYYY'], true);

    if (!parsedDate.isValid()) {
      control.setErrors({ ...control.errors, invalidDateFormat: true });
      control.markAsTouched();
      return;
    }

    // Set the parsed date value to the form control to trigger proper formatting
    const currentValue = control.value;
    if (!currentValue || !this.areDatesEqual(parsedDate, currentValue)) {
      control.setValue(parsedDate.startOf('day'), { emitEvent: true });
      control.markAsTouched();
    }

    if (control.hasError('invalidDateFormat')) {
      const errors = { ...control.errors };
      delete errors['invalidDateFormat'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  /**
   * Compare two dates for equality (handles moment and Date objects)
   */
  private areDatesEqual(date1: any, date2: any): boolean {
    // Both null/undefined/empty - equal
    if (!date1 && !date2) return true;

    // One is null/undefined/empty, other is not - not equal
    if (!date1 || !date2) return false;

    // Parse both dates and compare
    const m1 = moment(date1);
    const m2 = moment(date2);

    // If either date is invalid after parsing, they're not equal
    if (!m1.isValid() || !m2.isValid()) return false;

    // Compare formatted dates
    return m1.format('YYYY-MM-DD') === m2.format('YYYY-MM-DD');
  }

  getEffectiveDateError(): string {
    const control = this.donationProcedureForm?.get('effectiveDate');
    if (!control) return '';

    if (this.effDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('required') && (control.dirty || control.touched)) {
      return 'Effective Date is required';
    }

    return DateFieldValidationUtility.getEffectiveDateErrorMessage(control, this.donationProcedureForm.errors);
  }

  getTerminationDateError(): string {
    const control = this.donationProcedureForm?.get('terminationDate');
    if (!control) return '';

    if (this.termDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    // Handle matDatepickerMin error - distinguish between past date and date range issues
    if (control.hasError('matDatepickerMin')) {
      // If dateRangeInvalid is also set, it's a date range issue (termination < effective)
      if (this.donationProcedureForm.errors?.['dateRangeInvalid']) {
        return 'Termination Date must be on or after Effective Date';
      }
      // Otherwise, it's a past date issue (termination < today)
      return 'Termination date cannot be past date';
    }

    if (this.donationProcedureForm.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be on or after Effective Date';
    }

    return DateFieldValidationUtility.getTerminationDateErrorMessage(control, this.donationProcedureForm.errors);
  }

  get saveButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  /**
   * Determines if save button should be enabled
   * Add mode: Enabled when form is valid and has procedure codes selected
   * Edit mode: Enabled when form is dirty (user made changes) AND has no visible errors
   */
  get isFormValid(): boolean {
    // Add mode: button enabled when form is valid and has procedure codes
    if (this.mode === 'add') {
      return this.donationProcedureForm.valid && this.selectedProcedureCodes.length > 0;
    }

    // Edit mode: button enabled when form is dirty (modified) AND no visible errors
    if (!this.donationProcedureForm.dirty) {
      return false;
    }

    // Check if any visible error messages exist
    const hasVisibleErrors =
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '';

    return !hasVisibleErrors;
  }
}
