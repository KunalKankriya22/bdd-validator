import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { HlaInterimOutput, InterimCodeLov } from '../models/hla-interim-output.model';
import { HlaInterimOutputService } from '../services/hla-interim-output.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

/**
 * Interface for storing original form values for change detection in edit mode
 * Dates are stored as formatted strings (YYYY-MM-DD) to avoid timezone/time-component issues
 */
interface OriginalFormValues {
  matchA1A1: string;
  matchA1A2: string;
  outcomeAntigenA1: string;
  matchA2A1: string;
  matchA2A2: string;
  outcomeAntigenA2: string;
  effectiveDate: string | null;
  terminationDate: string | null;
}

@Component({
  selector: 'app-add-edit-hla-interim-output',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-hla-interim-output.html',
  styleUrls: ['./add-edit-hla-interim-output.scss']
})
export class AddEditHlaInterimOutput implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: HlaInterimOutput | null = null;
  @Input() interimCodeOptions: InterimCodeLov[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  isSaving = false;
  minDate!: moment.Moment;
  private destroy$ = new Subject<void>();
  private formSubscriptions$ = new Subject<void>();
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private termDateBlurred = false;
  private originalFormValues: OriginalFormValues | null = null;

  // Search controls for dropdowns
  readonly matchA1A1SearchControl = new FormControl('');
  readonly matchA1A2SearchControl = new FormControl('');
  readonly outcomeAntigenA1SearchControl = new FormControl('');
  readonly matchA2A1SearchControl = new FormControl('');
  readonly matchA2A2SearchControl = new FormControl('');
  readonly outcomeAntigenA2SearchControl = new FormControl('');

  // Signals for search filtering
  private readonly matchA1A1Search = signal('');
  private readonly matchA1A2Search = signal('');
  private readonly outcomeAntigenA1Search = signal('');
  private readonly matchA2A1Search = signal('');
  private readonly matchA2A2Search = signal('');
  private readonly outcomeAntigenA2Search = signal('');
  private readonly interimCodeOptionsSignal = signal<InterimCodeLov[]>([]);

  readonly filteredMatchA1A1Options = computed(() => {
    const search = this.matchA1A1Search().toLowerCase();
    const options = this.interimCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.interimCode.toLowerCase().includes(search) ||
      opt.interimDescription.toLowerCase().includes(search)
    );
  });

  readonly filteredMatchA1A2Options = computed(() => {
    const search = this.matchA1A2Search().toLowerCase();
    const options = this.interimCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.interimCode.toLowerCase().includes(search) ||
      opt.interimDescription.toLowerCase().includes(search)
    );
  });

  readonly filteredOutcomeAntigenA1Options = computed(() => {
    const search = this.outcomeAntigenA1Search().toLowerCase();
    const options = this.interimCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.interimCode.toLowerCase().includes(search) ||
      opt.interimDescription.toLowerCase().includes(search)
    );
  });

  readonly filteredMatchA2A1Options = computed(() => {
    const search = this.matchA2A1Search().toLowerCase();
    const options = this.interimCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.interimCode.toLowerCase().includes(search) ||
      opt.interimDescription.toLowerCase().includes(search)
    );
  });

  readonly filteredMatchA2A2Options = computed(() => {
    const search = this.matchA2A2Search().toLowerCase();
    const options = this.interimCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.interimCode.toLowerCase().includes(search) ||
      opt.interimDescription.toLowerCase().includes(search)
    );
  });

  readonly filteredOutcomeAntigenA2Options = computed(() => {
    const search = this.outcomeAntigenA2Search().toLowerCase();
    const options = this.interimCodeOptionsSignal();
    if (!search) return options;
    return options.filter(opt =>
      opt.interimCode.toLowerCase().includes(search) ||
      opt.interimDescription.toLowerCase().includes(search)
    );
  });

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Effective date filter: not before chapter's local date (today) */
  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');

    // Prevent dates before chapter's local date (today)
    return !checkDate.isBefore(today);
  };

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  constructor(
    private fb: FormBuilder,
    private service: HlaInterimOutputService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupDateSubscriptions();
    this.setupSearchSubscriptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      // Complete old form subscriptions before recreating form
      this.formSubscriptions$.next();
      this.formSubscriptions$.complete();
      this.formSubscriptions$ = new Subject<void>();

      this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
      this.initializeForm();
      this.setupValidators();
      this.setupDateSubscriptions();
    }

    if (changes['interimCodeOptions'] && this.interimCodeOptions) {
      this.interimCodeOptionsSignal.set(this.interimCodeOptions);
    }
  }

  ngOnDestroy(): void {
    this.formSubscriptions$.next();
    this.formSubscriptions$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.termDateBlurred = false;

    // All fields except Effective Date in edit mode
    this.form = this.fb.group({
      matchA1A1: [this.getRawCode(this.data?.matchA1A1) || '', Validators.required],
      matchA1A2: [this.getRawCode(this.data?.matchA1A2) || '', Validators.required],
      outcomeAntigenA1: [this.getRawCode(this.data?.outcomeAntigenA1) || '', Validators.required],
      matchA2A1: [this.getRawCode(this.data?.matchA2A1) || '', Validators.required],
      matchA2A2: [this.getRawCode(this.data?.matchA2A2) || '', Validators.required],
      outcomeAntigenA2: [this.getRawCode(this.data?.outcomeAntigenA2) || '', Validators.required],
      effectiveDate: [
        this.data?.effectiveDate ? moment(this.data.effectiveDate) : null,
        Validators.required
      ],
      terminationDate: [
        this.data?.terminationDate ? moment(this.data.terminationDate) : null
      ]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });

    // Store original values in edit mode for change detection
    if (this.mode === 'edit') {
      this.storeOriginalValues();
    }
  }

  private storeOriginalValues(): void {
    const formValue = this.form.getRawValue();
    this.originalFormValues = {
      matchA1A1: formValue.matchA1A1 || '',
      matchA1A2: formValue.matchA1A2 || '',
      outcomeAntigenA1: formValue.outcomeAntigenA1 || '',
      matchA2A1: formValue.matchA2A1 || '',
      matchA2A2: formValue.matchA2A2 || '',
      outcomeAntigenA2: formValue.outcomeAntigenA2 || '',
      effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : null,
      terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
    };
  }

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.originalFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentValue = this.form.getRawValue();

    const currentEffectiveDate = currentValue.effectiveDate ? moment(currentValue.effectiveDate).format('YYYY-MM-DD') : null;
    const currentTerminationDate = currentValue.terminationDate ? moment(currentValue.terminationDate).format('YYYY-MM-DD') : null;

    return (
      currentValue.matchA1A1 !== this.originalFormValues.matchA1A1 ||
      currentValue.matchA1A2 !== this.originalFormValues.matchA1A2 ||
      currentValue.outcomeAntigenA1 !== this.originalFormValues.outcomeAntigenA1 ||
      currentValue.matchA2A1 !== this.originalFormValues.matchA2A1 ||
      currentValue.matchA2A2 !== this.originalFormValues.matchA2A2 ||
      currentValue.outcomeAntigenA2 !== this.originalFormValues.outcomeAntigenA2 ||
      currentEffectiveDate !== this.originalFormValues.effectiveDate ||
      currentTerminationDate !== this.originalFormValues.terminationDate
    );
  }

  private setupValidators(): void {
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    }
  }

  private setupDateSubscriptions(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.formSubscriptions$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.formSubscriptions$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private setupSearchSubscriptions(): void {
    this.matchA1A1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA1A1Search.set(value || ''));

    this.matchA1A2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA1A2Search.set(value || ''));

    this.outcomeAntigenA1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.outcomeAntigenA1Search.set(value || ''));

    this.matchA2A1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA2A1Search.set(value || ''));

    this.matchA2A2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA2A2Search.set(value || ''));

    this.outcomeAntigenA2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.outcomeAntigenA2Search.set(value || ''));
  }

  private getRawCode(value: string | undefined): string {
    return value ?? '';
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Combination' : 'Edit Combination';
  }

  get formattedEffectiveDate(): string {
    if (!this.data?.effectiveDate) return '-';
    return moment(this.data.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    const error = DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
    if (error) return error;

    if (this.mode === 'edit') {
      const termControl = this.form.get('terminationDate');
      if (termControl && this.termDateBlurred && termControl.value) {
        const selectedDate = moment.isMoment(termControl.value) ? termControl.value : moment(termControl.value);
        if (selectedDate.isValid()) {
          const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
          if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
            return 'Termination date cannot be past date';
          }
        }
      }
    }

    return '';
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

  onTerminationDateBlur(): void {
    this.termDateBlurred = true;
    const termControl = this.form.get('terminationDate');
    if (termControl) {
      termControl.markAsTouched();
    }
  }

  onCancel(): void {
    this.form.reset();
    this.close.emit();
  }

  onSave(closeAfterSave: boolean = true): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    const payload: Partial<HlaInterimOutput> = {
      matchA1A1: formValue.matchA1A1,
      matchA1A2: formValue.matchA1A2,
      outcomeAntigenA1: formValue.outcomeAntigenA1,
      matchA2A1: formValue.matchA2A1,
      matchA2A2: formValue.matchA2A2,
      outcomeAntigenA2: formValue.outcomeAntigenA2,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) ?? null
    };

    const operation$ = this.mode === 'add'
      ? this.service.create(payload)
      : this.service.update(
          this.data!.matchA1A1!,
          this.data!.matchA1A2!,
          this.data!.matchA2A1!,
          this.data!.matchA2A2!,
          payload
        );

    operation$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;

          // Check if the response indicates failure (type narrowing for discriminated union)
          if (response && typeof response === 'object' && 'success' in response && response.success === false) {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage = response?.error ||
                                 response?.errorResponse?.error ||
                                 response?.message ||
                                 'Failed to save combination.';
            const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;

            this.snackBar.open(displayMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            // Do NOT close the dialog or reset the form - user needs to fix the error
            return;
          }

          // Success case
          const message = this.mode === 'add'
            ? 'New HLA interim output added successfully.'
            : 'HLA interim output updated successfully.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.form.reset();
            this.close.emit();
          } else {
            // Reset form but keep dialog open for "Save and Add Another"
            this.form.reset();
            this.form.markAsUntouched();
            this.form.markAsPristine();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;

          // Extract error code and message
          const errorCode = error?.error?.errorCode || error?.error?.statusCode || error?.status;
          const errorMessage = error?.error?.message || error?.error?.error || 'Failed to save combination. Please try again.';

          // Format error message with code if available
          const displayMessage = errorCode
            ? `Error ${errorCode}: ${errorMessage}`
            : errorMessage;

          this.snackBar.open(displayMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSaveAndAddAnother(): void {
    this.onSave(false);
  }

  get isFormActionDisabled(): boolean {
    if (this.mode === 'edit') {
      // Disable if saving, form is invalid, no changes made, or termination date has error after blur
      if (this.isSaving || this.form.invalid || !this.hasFormChanged()) return true;
      return this.termDateBlurred && this.getTerminationDateError() !== '';
    }
    return this.form.invalid || this.isSaving;
  }
}
