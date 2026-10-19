import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { CityStateZipQueryService } from '../../services/city-state-zip-query.service';
import {
  ValidCityStateDto,
  CreateValidCityStateDto,
  UpdateValidCityStateDto,
  StateDto,
  CityDto,
  CountyDto
} from '../../models/city-state-zip-query.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

export interface AddEditZipDialogData {
  mode: 'add' | 'edit';
  record?: ValidCityStateDto;
}

@Component({
  selector: 'app-add-edit-zip-dialog',
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
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-zip-dialog.html',
  styleUrls: ['./add-edit-zip-dialog.scss']
})
export class AddEditZipDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-zip-dialog-${AddEditZipDialog.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CityStateZipQueryService);
  private readonly headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  stateOptions: StateDto[] = [];
  filteredStateOptions: StateDto[] = [];
  stateSearchCtrl = new FormControl<string>('', { nonNullable: true });
  cityOptions: CityDto[] = [];
  filteredCityOptions: CityDto[] = [];
  citySearchCtrl = new FormControl<string>('', { nonNullable: true });
  countyOptions: CountyDto[] = [];
  isLoadingStates = false;
  isLoadingCities = false;
  isLoadingCounties = false;
  isSaving = false;
  submitted = false;
  minDate!: moment.Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  readonly isEditMode: boolean;
  readonly dialogTitle: string;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  constructor(
    public dialogRef: MatDialogRef<AddEditZipDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditZipDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.dialogTitle = this.isEditMode ? 'Edit Zip Code' : 'Add New Zip Code';
  }

  ngOnInit(): void {
    this.initForm();
    this.loadStates();
    this.stateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const q = (search || '').toLowerCase();
        this.filteredStateOptions = q
          ? this.stateOptions.filter(
              (s) => s.code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
            )
          : [...this.stateOptions];
      });
    this.citySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const q = (search || '').toLowerCase();
        this.filteredCityOptions = q
          ? this.cityOptions.filter((c) => c.code.toLowerCase().includes(q))
          : [...this.cityOptions];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const record = this.data.record;

    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    this.form = this.fb.group({
      state: [(record?.state || '').trim(), [Validators.required, Validators.maxLength(2)]],
      city: [(record?.city || '').trim(), [Validators.required, Validators.maxLength(40)]],
      zip: [(record?.zip || '').trim(), [
        Validators.required,
        Validators.pattern('^[0-9]{5}$'),
        Validators.min(1)
      ]],
      county: [(record?.county || '').trim(), [Validators.required, Validators.maxLength(40)]],
      commonlyUsedFlag: [record?.commonlyUsedFlag || ''],
      effectiveDate: [
        record?.effectiveDate ? moment(record.effectiveDate) : null,
        [Validators.required]
      ],
      terminationDate: [
        record?.terminationDate ? moment(record.terminationDate) : null
      ]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termControl = this.form.get('terminationDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
        termControl.updateValueAndValidity();
      }
    }

    this.form.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedDateField = 'effective';
    });
    this.form.get('terminationDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedDateField = 'termination';
    });

    // Cascading: load cities when state changes
    this.form.get('state')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: string) => {
        this.form.patchValue({ city: '', county: '' }, { emitEvent: false });
        this.cityOptions = [];
        this.filteredCityOptions = [];
        this.citySearchCtrl.setValue('', { emitEvent: false });
        this.countyOptions = [];

        if (state) {
          this.loadCities(state);
        }
      });

    // Cascading: load counties when city changes (requires state + city)
    this.form.get('city')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((city: string) => {
        this.form.patchValue({ county: '' }, { emitEvent: false });
        this.countyOptions = [];

        const state = this.form.get('state')?.value;
        if (state && city) {
          this.loadCounties(state, city);
        }
      });

    // For edit mode, load cities/counties for the pre-selected values
    if (this.isEditMode && record?.state) {
      const trimmedState = record.state.trim();
      this.loadCities(trimmedState);
      if (record?.city) {
        this.loadCounties(trimmedState, record.city.trim());
      }
    }
  }

  private loadStates(): void {
    this.isLoadingStates = true;
    this.service.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.stateOptions = states.map(s => ({ ...s, code: (s.code || '').trim() }));
          this.filteredStateOptions = [...this.stateOptions];
          this.isLoadingStates = false;
          if (this.isEditMode) {
            const currentState = this.form.get('state')?.value;
            if (currentState) {
              this.form.get('state')?.setValue(currentState, { emitEvent: false });
            }
          }
        },
        error: () => {
          this.stateOptions = [];
          this.isLoadingStates = false;
        }
      });
  }

  private loadCities(state: string): void {
    this.isLoadingCities = true;
    this.service.getCities(state)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.cityOptions = cities.filter(c => c.code?.trim()).map(c => ({ ...c, code: c.code.trim() }));
          this.filteredCityOptions = [...this.cityOptions];
          this.isLoadingCities = false;
          if (this.isEditMode) {
            const currentCity = this.form.get('city')?.value;
            if (currentCity) {
              this.form.get('city')?.setValue(currentCity, { emitEvent: false });
            }
          }
        },
        error: () => {
          this.cityOptions = [];
          this.isLoadingCities = false;
        }
      });
  }

  private loadCounties(state: string, city: string): void {
    this.isLoadingCounties = true;
    this.service.getCounties(state, city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counties) => {
          this.countyOptions = counties.filter(c => c.code?.trim()).map(c => ({ ...c, code: c.code.trim() }));
          this.isLoadingCounties = false;
          if (this.isEditMode) {
            const currentCounty = this.form.get('county')?.value;
            if (currentCounty) {
              this.form.get('county')?.setValue(currentCounty, { emitEvent: false });
            }
          }
        },
        error: () => {
          this.countyOptions = [];
          this.isLoadingCounties = false;
        }
      });
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Restrict zip code input to numbers only
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(charCode)) {
      return true;
    }
    // Ensure it's a number (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Strip non-numeric characters on paste for ZIP code
   */
  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = this.form.get('zip')?.value || '';
    const newValue = currentValue.substring(0, start) + numericOnly + currentValue.substring(end);
    this.form.patchValue({ zip: newValue.substring(0, 5) }); // Limit to 5 digits
  }

  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.form.hasError('dateRangeInvalid')) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    // Ensure ZIP is left-padded to 5 digits
    const zip = formValue.zip ? String(formValue.zip).padStart(5, '0') : '';

    const dto = {
      state: formValue.state,
      city: formValue.city,
      zip,
      county: formValue.county || null,
      commonlyUsedFlag: formValue.commonlyUsedFlag || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    if (this.isEditMode && this.data.record?.uspsId) {
      const updateDto: UpdateValidCityStateDto = dto;
      this.service.update(this.data.record.uspsId, updateDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.dialogRef.close({ success: true });
          },
          error: (error) => {
            this.isSaving = false;
            this.handleError(error);
          }
        });
    } else {
      const createDto: CreateValidCityStateDto = dto;
      this.service.create(createDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.dialogRef.close({ success: true });
          },
          error: (error) => {
            this.isSaving = false;
            this.handleError(error);
          }
        });
    }
  }

  private handleError(error: any): void {
    // Extract error message from API response
    let errorMessage = 'An error occurred while saving the record.';

    if (error?.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Show error in form or as a general error
    // For now, we'll use the first field as a placeholder
    this.form.setErrors({ serverError: errorMessage });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !(control.touched || this.submitted)) {
      return '';
    }

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }

    if (control.hasError('pattern')) {
      if (fieldName === 'zip') {
        return 'ZIP code must be exactly 5 digits';
      }
    }

    if (control.hasError('min')) {
      return 'Zip code must be greater than zero';
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

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      state: 'State',
      city: 'City',
      zip: 'ZIP Code',
      county: 'County',
      commonlyUsedFlag: 'Used Flag',
      effectiveDate: 'Effective Date',
      terminationDate: 'Termination Date'
    };
    return labels[fieldName] || fieldName;
  }
}
