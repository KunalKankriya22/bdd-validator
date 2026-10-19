import { Component, EventEmitter, inject, Input, OnInit, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DefineDurationBetweenProceduresService } from '../services/define-duration-between-procedures.service';
import moment, { Moment } from 'moment';
import {
  DefineDurationBetweenProceduresModel,
  DefineDurationBetweenProceduresDto,
  UpdateDefineDurationBetweenProceduresDto,
  DonationType,
  ProcedureCode
} from '../models/define-duration-between-procedures.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-define-duration',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-define-duration.html',
  styleUrls: ['./add-edit-define-duration.scss']
})
export class AddEditDefineDuration implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineDurationBetweenProceduresModel | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  form: FormGroup;
  title = computed(() => (this.mode === 'add' ? 'Add Rule' : 'Edit Rule'));
  saveButtonText = computed(() => (this.mode === 'add' ? 'ADD' : 'SAVE'));

  donationTypeOptions: DonationType[] = [];
  procedureCodeOptions: ProcedureCode[] = [];
  prevProcedureCodeOptions: ProcedureCode[] = [];

  filteredDonationTypes: DonationType[] = [];
  filteredProcedureCodes: ProcedureCode[] = [];
  filteredPrevProcedureCodes: ProcedureCode[] = [];

  currDonationTypeSearchControl = new FormControl('');
  procedureCodeSearchControl = new FormControl('');
  prevProcedureCodeSearchControl = new FormControl('');

  minDate = DateFieldValidationUtility.getMinDate();
  minTerminationDate: Moment | null = null;

  isLoadingDonationTypes = false;
  isLoadingProcedureCodes = false;
  isSaving = signal(false);

  private readonly headerService = inject(HeaderService);

  constructor(
    private fb: FormBuilder,
    private defineDurationService: DefineDurationBetweenProceduresService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      currDonationType: ['', [Validators.required]],
      currDonationTypeDescription: [{ value: '', disabled: true }],
      procedureCode: ['', [Validators.required]],
      procedureCodeDescription: [{ value: '', disabled: true }],
      prevProcedureCode: ['', [Validators.required]],
      prevProcedureCodeDescription: [{ value: '', disabled: true }],
      daysBetween: ['', [Validators.required, Validators.min(0), Validators.max(9999), Validators.pattern(/^\d+$/)]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null],
      chapterId: [this.headerService.chapterId() || 'ALL'],
      programId: ['MANUAL']
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }

  ngOnInit(): void {
    this.loadDropdownOptions();

    this.currDonationTypeSearchControl.valueChanges.subscribe(search => {
      const term = (search || '').toLowerCase();
      this.filteredDonationTypes = this.donationTypeOptions.filter(dt =>
        dt.donationType.toLowerCase().includes(term) ||
        dt.description.toLowerCase().includes(term)
      );
    });

    this.procedureCodeSearchControl.valueChanges.subscribe(search => {
      const term = (search || '').toLowerCase();
      this.filteredProcedureCodes = this.procedureCodeOptions.filter(pc =>
        pc.procedureCode.toLowerCase().includes(term) ||
        pc.description.toLowerCase().includes(term)
      );
    });

    this.prevProcedureCodeSearchControl.valueChanges.subscribe(search => {
      const term = (search || '').toLowerCase();
      this.filteredPrevProcedureCodes = this.prevProcedureCodeOptions.filter(pc =>
        pc.procedureCode.toLowerCase().includes(term) ||
        pc.description.toLowerCase().includes(term)
      );
    });

    // Initialize min termination date to today for ADD mode
    if (this.mode === 'add') {
      this.minTerminationDate = DateFieldValidationUtility.getMinDate();
    }

    // Add change listeners to update descriptions
    this.form.get('currDonationType')?.valueChanges.subscribe(value => {
      this.onDonationTypeChange(value);
    });

    this.form.get('procedureCode')?.valueChanges.subscribe(value => {
      this.onProcedureCodeChange(value);
    });

    this.form.get('prevProcedureCode')?.valueChanges.subscribe(value => {
      this.onPrevProcedureCodeChange(value);
    });

    // Trigger validation on termination date when effective date changes
    this.form.get('effectiveDate')?.valueChanges.subscribe(value => {
      if (this.mode === 'add') {
        // ADD mode: Termination date cannot be in the past (min is chapter's today or effective date, whichever is later)
        const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date
        if (value && moment.isMoment(value) && value.isValid()) {
          this.minTerminationDate = value.isAfter(today) ? value.clone() : today.clone();
        } else {
          this.minTerminationDate = today.clone();
        }
      } else {
        // EDIT mode: Termination date must be >= Effective Date AND >= chapter's today
        const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date
        if (value && moment.isMoment(value) && value.isValid()) {
          this.minTerminationDate = value.isAfter(today) ? value.clone() : today.clone();
        } else {
          this.minTerminationDate = today.clone();
        }
      }
      this.form.get('terminationDate')?.updateValueAndValidity();
    });

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Re-enable effective date — editable in edit mode per spec
      this.form.get('effectiveDate')?.enable();
      this.form.get('effectiveDate')?.setValidators([Validators.required]);
      this.form.get('effectiveDate')?.updateValueAndValidity();
      if (this.data) {
        this.populateFormForEdit();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }
  }

  /**
   * Load dropdown options from API
   */
  private loadDropdownOptions(): void {
    this.isLoadingDonationTypes = true;
    this.isLoadingProcedureCodes = true;

    this.defineDurationService.getDonationTypes()
      .subscribe({
        next: (response) => {
          this.donationTypeOptions = response.data || [];
          this.filteredDonationTypes = [...this.donationTypeOptions];
          this.isLoadingDonationTypes = false;
        },
        error: (error) => {
          console.error('Error loading donation types:', error);
          this.isLoadingDonationTypes = false;
        }
      });

    this.defineDurationService.getProcedureCodes()
      .subscribe({
        next: (response) => {
          const codes = response.data || [];
          this.procedureCodeOptions = codes;
          this.prevProcedureCodeOptions = codes;
          this.filteredProcedureCodes = [...codes];
          this.filteredPrevProcedureCodes = [...codes];
          this.isLoadingProcedureCodes = false;
        },
        error: (error) => {
          console.error('Error loading procedure codes:', error);
          this.isLoadingProcedureCodes = false;
        }
      });
  }

  /**
   * Handle donation type dropdown change
   */
  private onDonationTypeChange(donationType: string): void {
    if (!donationType) {
      this.form.patchValue({ currDonationTypeDescription: '' }, { emitEvent: false });
      return;
    }

    const selected = this.donationTypeOptions.find(dt => dt.donationType === donationType);
    if (selected) {
      this.form.patchValue({ currDonationTypeDescription: selected.description }, { emitEvent: false });
    }
  }

  /**
   * Handle current procedure dropdown change
   */
  private onProcedureCodeChange(procedureCode: string): void {
    if (!procedureCode) {
      this.form.patchValue({ procedureCodeDescription: '' }, { emitEvent: false });
      return;
    }

    const selected = this.procedureCodeOptions.find(pc => pc.procedureCode === procedureCode);
    if (selected) {
      this.form.patchValue({ procedureCodeDescription: selected.description }, { emitEvent: false });
    }
  }

  /**
   * Handle previous procedure dropdown change
   */
  private onPrevProcedureCodeChange(procedureCode: string): void {
    if (!procedureCode) {
      this.form.patchValue({ prevProcedureCodeDescription: '' }, { emitEvent: false });
      return;
    }

    const selected = this.prevProcedureCodeOptions.find(pc => pc.procedureCode === procedureCode);
    if (selected) {
      this.form.patchValue({ prevProcedureCodeDescription: selected.description }, { emitEvent: false });
    }
  }

  private populateFormForEdit(): void {
    const record: DefineDurationBetweenProceduresModel = this.data!;

    // In edit mode, disable non-editable fields (only effectiveDate and terminationDate are editable)
    this.form.get('currDonationType')?.disable();
    this.form.get('procedureCode')?.disable();
    this.form.get('prevProcedureCode')?.disable();
    this.form.get('daysBetween')?.disable();

    this.form.patchValue({
      currDonationType: record.currDonationType || '',
      currDonationTypeDescription: record.currDonationTypeDescription || '',
      procedureCode: record.procedureCode || '',
      procedureCodeDescription: record.procedureCodeDescription || '',
      prevProcedureCode: record.prevProcedureCode || '',
      prevProcedureCodeDescription: record.prevProcedureCodeDescription || '',
      daysBetween: record.daysBetween || '',
      effectiveDate: record.effectiveDate ? moment(record.effectiveDate) : null,
      terminationDate: record.terminationDate ? moment(record.terminationDate) : null,
      chapterId: record.chapterId || this.headerService.chapterId() || 'ALL',
      programId: record.programId || 'MANUAL',
      insertUser: record.insertUser || 'DONSYS'
    });

    // Initialize min termination date: max(effective date, chapter's today)
    const today = DateFieldValidationUtility.getMinDate(); // Use chapter local date
    if (record.effectiveDate) {
      const effDate = moment(record.effectiveDate).startOf('day');
      this.minTerminationDate = effDate.isAfter(today) ? effDate : today;
    } else {
      this.minTerminationDate = today;
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving.set(true);

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DefineDurationBetweenProceduresDto = {
        currDonationType: formValue.currDonationType?.trim() || '',
        procedureCode: formValue.procedureCode || '',
        prevProcedureCode: formValue.prevProcedureCode || '',
        daysBetween: parseInt(formValue.daysBetween) || 0,
        effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null,
        chapterId: formValue.chapterId || this.headerService.chapterId() || 'ALL',
        programId: formValue.programId || 'MANUAL',
        InsertUser: this.headerService.getCurrentUsername() || 'DONSYS'
      };
      apiCall = this.defineDurationService.addDefineDuration(addPayload);
    } else {
      const updatePayload: UpdateDefineDurationBetweenProceduresDto = {
        currDonationType: formValue.currDonationType || '',
        procedureCode: formValue.procedureCode || '',
        prevProcedureCode: formValue.prevProcedureCode || '',
        daysBetween: parseInt(formValue.daysBetween) || 0,
        effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null,
        chapterId: formValue.chapterId || this.headerService.chapterId() || 'ALL',
        programId: formValue.programId || 'MANUAL',
        insertUser: this.headerService.getCurrentUsername() || 'DONSYS'
      };
      apiCall = this.defineDurationService.updateDefineDuration(updatePayload);
    }

    apiCall.subscribe({
      next: (response: any) => {
        const message = response?.message || (this.mode === 'add'
          ? 'Duration rule added successfully'
          : 'Duration rule updated successfully');

        this.snackbarService.showSuccess(message, 'DISMISS');

        this.isSaving.set(false);
        this.save.emit(response);
        this.onCancel();
      },
      error: (error) => {
        console.error('Error saving duration rule:', error);

        // Handle model validation errors from API (set errors on form controls)
        // General errors are handled globally by the interceptor
        if (error.error?.modelErrors) {
          const modelErrors = error.error.modelErrors;

          // Set errors on form controls
          if (modelErrors.CurrDonationType) {
            this.form.get('currDonationType')?.setErrors({
              apiError: modelErrors.CurrDonationType[0]
            });
            this.form.get('currDonationType')?.markAsTouched();
          }

          if (modelErrors.ProcedureCode) {
            this.form.get('procedureCode')?.setErrors({
              apiError: modelErrors.ProcedureCode[0]
            });
            this.form.get('procedureCode')?.markAsTouched();
          }

          if (modelErrors.PrevProcedureCode) {
            this.form.get('prevProcedureCode')?.setErrors({
              apiError: modelErrors.PrevProcedureCode[0]
            });
            this.form.get('prevProcedureCode')?.markAsTouched();
          }

          if (modelErrors.DaysBetween) {
            this.form.get('daysBetween')?.setErrors({
              apiError: modelErrors.DaysBetween[0]
            });
            this.form.get('daysBetween')?.markAsTouched();
          }

          if (modelErrors.EffectiveDate) {
            this.form.get('effectiveDate')?.setErrors({
              apiError: modelErrors.EffectiveDate[0]
            });
            this.form.get('effectiveDate')?.markAsTouched();
          }

          if (modelErrors.TerminationDate) {
            this.form.get('terminationDate')?.setErrors({
              apiError: modelErrors.TerminationDate[0]
            });
            this.form.get('terminationDate')?.markAsTouched();
          }
        }

        this.isSaving.set(false);
      }
    });
  }

  get currDonationTypeControl() {
    return this.form.get('currDonationType');
  }

  get procedureCodeControl() {
    return this.form.get('procedureCode');
  }

  get prevProcedureCodeControl() {
    return this.form.get('prevProcedureCode');
  }

  get daysBetweenControl() {
    return this.form.get('daysBetween');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getCurrDonationTypeError(): string {
    const control = this.currDonationTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Current Donation Type is required';
    }
    if (control.hasError('apiError')) {
      return control.getError('apiError');
    }
    return '';
  }

  getProcedureCodeError(): string {
    const control = this.procedureCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Current Procedure is required';
    }
    if (control.hasError('apiError')) {
      return control.getError('apiError');
    }
    return '';
  }

  getPrevProcedureCodeError(): string {
    const control = this.prevProcedureCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Previous Procedure is required';
    }
    if (control.hasError('apiError')) {
      return control.getError('apiError');
    }
    return '';
  }

  getDaysBetweenError(): string {
    const control = this.daysBetweenControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Days Between is required';
    }
    if (control.hasError('pattern')) {
      return 'Days Between must be a whole number';
    }
    if (control.hasError('min')) {
      return 'Days Between must be 0 or greater';
    }
    if (control.hasError('max')) {
      return 'Days Between cannot exceed 9999';
    }
    if (control.hasError('apiError')) {
      return control.getError('apiError');
    }
    return '';
  }

  getEffectiveDateError(): string {
    const baseError = DateFieldValidationUtility.getEffectiveDateErrorMessage(
      this.form.get('effectiveDate'),
      this.form.errors
    );

    if (baseError) return baseError;

    // Handle API errors
    const control = this.effectiveDateControl;
    if (control?.hasError('apiError')) {
      return control.getError('apiError');
    }

    return '';
  }

  getTerminationDateError(): string {
    const baseError = DateFieldValidationUtility.getTerminationDateErrorMessage(
      this.form.get('terminationDate'),
      this.form.errors
    );

    if (baseError) return baseError;

    // Handle API errors
    const control = this.terminationDateControl;
    if (control?.hasError('apiError')) {
      return control.getError('apiError');
    }

    return '';
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      const hasFieldErrors =
        !!this.form.get('currDonationType')?.errors ||
        !!this.form.get('procedureCode')?.errors ||
        !!this.form.get('prevProcedureCode')?.errors ||
        !!this.form.get('daysBetween')?.errors;
      const hasDateErrors = this.getTerminationDateError() !== '';
      return !hasFieldErrors && !hasDateErrors;
    }
    return this.form.valid;
  }

  canSave(): boolean {
    return this.isFormValid;
  }

  /**
   * Prevents non-numeric key input
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only digits (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Handles paste event to only allow numeric values
   */
  onPasteNumbers(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    // If pasted text contains non-numeric characters, prevent paste
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
