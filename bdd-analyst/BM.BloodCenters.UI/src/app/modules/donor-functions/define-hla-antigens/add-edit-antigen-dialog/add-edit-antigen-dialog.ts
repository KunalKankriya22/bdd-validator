import { Component, Inject, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import moment from 'moment';

import { HlaAntigensService } from '../services/hla-antigens.service';
import {
  AddEditAntigenDialogData,
  UpdateHlaAntigenDto
} from '../models/hla-antigens.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-add-edit-antigen-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-antigen-dialog.html',
  styleUrls: ['./add-edit-antigen-dialog.scss']
})
export class AddEditAntigenDialog implements OnInit, OnDestroy {
  private readonly hlaAntigensService = inject(HlaAntigensService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  isSaving = signal<boolean>(false);

  // Date validation
  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  terminationMinDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Effective date filter: not before chapter's local date (today); all dates allowed when read-only */
  effectiveDateFilter = (date: any): boolean => {
    if (!date) return true;
    if (this.isEffDateReadOnly) return true;
    const checkDate = date.clone().startOf('day');
    const today = this.minDate.clone().startOf('day');
    return !checkDate.isBefore(today);
  };

  /** Termination date filter: not before effective date and not before today */
  terminationDateFilter = (date: any): boolean => {
    if (!date) return true;
    const checkDate = date.clone().startOf('day');
    const minTermDate = this.terminationMinDate.clone().startOf('day');
    return !checkDate.isBefore(minTermDate);
  };

  // Locus options loaded from API
  locusOptions: { code: string; description: string }[] = [];

  // Selected locus description
  selectedLocusDescription: string = '';

  isEffDateReadOnly = false;

  get editEffectiveDateDisplay(): string {
    if (!this.data.effDate) return '-';
    return moment(this.data.effDate).format('DD-MMM-YYYY').toUpperCase();
  }

  // Locus search control
  locusSearchControl = new FormControl('');
  filteredLocusOptions: { code: string; description: string }[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddEditAntigenDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditAntigenDialogData
  ) {}

  ngOnInit(): void {
    this.loadLocusCodes();
    this.initializeForm();
    this.setupFormListeners();
    this.setupLocusSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLocusCodes(): void {
    if (this.data.locusOptions?.length) {
      this.locusOptions = this.data.locusOptions;
      this.filteredLocusOptions = this.data.locusOptions;
      return;
    }

    this.hlaAntigensService.getLocusCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.locusOptions = codes;
          this.filteredLocusOptions = codes;
        },
        error: () => {
          this.snackbarService.showError('Failed to load locus codes');
        }
      });
  }

  /**
   * Setup locus search filtering
   */
  private setupLocusSearch(): void {
    this.locusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterLocusOptions();
      });
  }

  /**
   * Filter locus options based on search text
   */
  private filterLocusOptions(): void {
    const searchTerm = (this.locusSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredLocusOptions = this.locusOptions;
    } else {
      this.filteredLocusOptions = this.locusOptions.filter(locus =>
        locus.code.toLowerCase().includes(searchTerm) ||
        locus.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Initialize form with validators
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      locus: [
        null,
        [Validators.required, Validators.maxLength(2)]
      ],
      epitopeId: [
        null,
        [Validators.required, Validators.maxLength(6)]
      ],
      epitopeSuperI: [
        null,
        [Validators.maxLength(6)]
      ],
      effDate: [
        null,
        [Validators.required]
      ],
      termDate: [
        null
      ]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.data.mode === 'edit') {
      this.form.patchValue({
        locus: this.data.locus || '',
        epitopeId: this.data.epitopeId || '',
        epitopeSuperI: this.data.epitopeSuperI || null,
        effDate: this.data.effDate ? moment(this.data.effDate) : null,
        termDate: this.data.termDate ? moment(this.data.termDate) : null
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.selectedLocusDescription = this.data.locusDescription || '';

      const effValue = this.form.get('effDate')?.value;
      const today = this.minDate.clone().startOf('day');
      this.isEffDateReadOnly = !!(effValue && effValue.isValid() && effValue.clone().startOf('day').isBefore(today));

      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());

      if (!this.isEffDateReadOnly) {
        const effControl = this.form.get('effDate');
        effControl?.enable();
        effControl?.setValidators([Validators.required]);
        effControl?.updateValueAndValidity();
      }

      if (effValue && effValue.isValid && effValue.isValid()) {
        this.terminationMinDate = effValue.clone();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }
  }

  /**
   * Setup form value change listeners
   */
  private setupFormListeners(): void {
    // Track which date field was last changed for cross-field error display
    // Use distinctUntilChanged to prevent NG0100 error
    this.form.get('effDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          if (!prev.isValid || !curr.isValid) return false;
          if (!prev.isValid() || !curr.isValid()) return false;
          return prev.format('YYYY-MM-DD') === curr.format('YYYY-MM-DD');
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
          if (!prev.isValid || !curr.isValid) return false;
          if (!prev.isValid() || !curr.isValid()) return false;
          return prev.format('YYYY-MM-DD') === curr.format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  /**
   * Update the minimum allowed date for termination date based on effective date
   */
  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;

    if (effectiveValue && effectiveValue.isValid && effectiveValue.isValid()) {
      // If effective date is after the global minDate, use effective date as min
      // Otherwise, use the global minDate
      this.terminationMinDate = effectiveValue.isAfter(this.minDate)
        ? effectiveValue.clone()
        : this.minDate.clone();
    } else {
      // If no valid effective date, reset to global minDate
      this.terminationMinDate = this.minDate.clone();
    }
  }

  /**
   * Get form field error messages
   */
  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  /**
   * Handle effective date input for validation
   */
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  /**
   * Handle termination date input for validation
   */
  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.data.mode === 'edit'
    );
  }

  /**
   * Handle locus selection change
   */
  onLocusChange(event: MatSelectChange): void {
    const selectedLocus = this.locusOptions.find(l => l.code === event.value);
    this.selectedLocusDescription = selectedLocus?.description || '';
  }

  /**
   * Handle save action
   */
  onSave(addAnother: boolean = false): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    // Default to showing cross-field error on Effective Date if no field was changed yet
    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    // Check for cross-field date validation errors
    if (this.form.hasError('dateRangeInvalid')) {
      this.form.get('termDate')?.markAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.isSaving.set(true);

    const formValue = this.form.getRawValue();

    // Convert dates to YYYY-MM-DD format for API
    const effDateStr = DateFieldValidationUtility.serializeDateForApi(formValue.effDate);
    const termDateStr = formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) : null;

    const payload = {
      locus: formValue.locus,
      epitopeId: formValue.epitopeId,
      epitopeSuperI: formValue.epitopeSuperI || null,
      effDate: effDateStr!,
      termDate: termDateStr
    };

    const saveOperation = this.data.mode === 'edit'
      ? this.hlaAntigensService.updateHlaAntigen(this.data.locus!, this.data.epitopeId!, payload)
      : this.hlaAntigensService.addHlaAntigen(payload);

    const successMessage = this.data.mode === 'edit'
      ? 'HLA Antigen updated successfully'
      : 'HLA Antigen added successfully';

    saveOperation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.success === false) {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to save HLA Antigen';
            const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
            this.snackbarService.showError(displayMessage);
            this.isSaving.set(false);
            return;
          }

          this.showSuccessMessage(successMessage);
          this.isSaving.set(false);

          if (addAnother && this.data.mode === 'add') {
            this.form.reset();
            this.selectedLocusDescription = '';
          } else {
            this.dialogRef.close({ action: 'save', data: payload });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.handleSaveError(error);
          this.isSaving.set(false);
        }
      });
  }

  /**
   * Handle save and add another action
   */
  onSaveAndAddAnother(): void {
    this.onSave(true);
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  /**
   * Handle save error
   */
  private handleSaveError(error: HttpErrorResponse): void {
    const errorResponse = error?.error?.errorResponse || error?.error;
    const errorCode = errorResponse?.errorCode;
    const errorMessage = errorResponse?.error || error?.message || 'Failed to save HLA Antigen';

    const displayMessage = errorCode
      ? `${errorCode}: ${errorMessage}`
      : errorMessage;

    this.snackbarService.showError(displayMessage);
  }

  /**
   * Focus the first invalid form field for accessibility (WCAG 3.3.1)
   */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  /**
   * Get dialog title
   */
  getDialogTitle(): string {
    return this.data.mode === 'edit' ? 'Edit Antigen' : 'Add New Antigen';
  }
}
