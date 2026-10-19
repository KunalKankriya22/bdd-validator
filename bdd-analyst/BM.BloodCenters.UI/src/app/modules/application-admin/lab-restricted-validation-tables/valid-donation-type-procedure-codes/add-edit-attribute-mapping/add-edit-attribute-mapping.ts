import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { ValidDonationTypeProcedureCodesService } from '../services/valid-donation-type-procedure-codes.service';
import {
  ValidDonationTypeProcedureCodesModel,
  ValidDonationTypeProcedureCodesDto,
  UpdateValidDonationTypeProcedureCodesDto
} from '../models/valid-donation-type-procedure-codes.model';

export interface AttributeMappingFormData {
  donationType: string;
  procedureCode: string;
  attributeGroup: string;
  attributeCode: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

// Custom date format for Material datepicker
export const APP_DATE_FORMATS = {
  parse: {
    dateInput: 'DD-MMM-YYYY',
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-add-edit-attribute-mapping',
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
    MatSnackBarModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ],
  templateUrl: './add-edit-attribute-mapping.html',
  styleUrls: ['./add-edit-attribute-mapping.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditAttributeMapping implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidDonationTypeProcedureCodesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<AttributeMappingFormData>();

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;
  isLoadingDropdowns = false;
  minDate = DateFieldValidationUtility.getMinDate();

  donationTypes: string[] = [];
  procedureCodes: string[] = [];
  attributeGroups: string[] = [];
  attributeCodes: string[] = [];

  editModeValues = {
    donationType: '',
    procedureCode: '',
    attributeGroup: '',
    attributeCode: '',
    effectiveDate: '',
    terminationDate: '',
    modificationDate: ''
  };

  private originalValues = {
    donationType: '',
    procedureCode: '',
    attributeGroup: '',
    attributeCode: '',
    effectiveDate: ''
  };

  private destroy$ = new Subject<void>();

  // Date formatting constant - using noon to avoid timezone shift issues
  private readonly ISO_DATE_TIME_NOON = 'T12:00:00.000Z';

  constructor(
    private fb: FormBuilder,
    private validDonationTypeProcedureCodesService: ValidDonationTypeProcedureCodesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.loadDropdownData();
    this.updatePanelTitle();

    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    }
  }

  /**
   * Setup listeners to revalidate dates when either date changes
   */
  private setupDateValidationListeners(): void {
    // Trigger change detection when form validation state changes (needed for OnPush)
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // When effective date changes, revalidate the form
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const termControl = this.form.get('terminationDate');
        this.form.updateValueAndValidity({ emitEvent: false });
        // Mark termination date as touched to show validation errors
        if (termControl?.value) {
          termControl.markAsTouched();
        }
        this.cdr.markForCheck();
      });

    // When termination date changes, revalidate the form
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      donationType: ['', [Validators.required]],
      procedureCode: ['', [Validators.required]],
      attributeGroup: ['', [Validators.required]],
      attributeCode: ['', [Validators.required]],
      effectiveDate: [null, [DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }

  private loadDropdownData(): void {
    this.isLoadingDropdowns = true;
    this.cdr.markForCheck();

    this.validDonationTypeProcedureCodesService.getFilterOptions()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDropdowns = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (filterOptions) => {
          this.donationTypes = filterOptions.donationTypes || [];
          this.procedureCodes = filterOptions.procedureCodes || [];
          this.attributeGroups = filterOptions.attribGroups || [];
          this.attributeCodes = filterOptions.attribCodes || [];
          this.cdr.markForCheck();
        },
        error: () => {
          // Error handling can be added here if needed
        }
      });
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Attribute Mapping' : 'Edit Attribute Mapping';
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    // Store original composite key values for API update call
    // IMPORTANT: Store the original effectiveDate exactly as received from API
    // to ensure it matches the record in the database
    this.originalValues.donationType = this.data.donationType || '';
    this.originalValues.procedureCode = this.data.procedureCode || '';
    this.originalValues.attributeGroup = this.data.attribGroup || '';
    this.originalValues.attributeCode = this.data.attribCode || '';
    this.originalValues.effectiveDate = this.data.effectiveDate
      ? (typeof this.data.effectiveDate === 'string'
          ? this.data.effectiveDate
          : this.toISOStringWithoutTimezone(new Date(this.data.effectiveDate)))
      : '';

    // Store display values for read-only fields in edit mode
    this.editModeValues.donationType = this.data.donationType || '-';
    this.editModeValues.procedureCode = this.data.procedureCode || '-';
    this.editModeValues.attributeGroup = this.data.attribGroup || '-';
    this.editModeValues.attributeCode = this.data.attribCode || '-';
    this.editModeValues.effectiveDate = this.data.effectiveDate
      ? moment(this.data.effectiveDate).format('DD-MMM-YYYY')
      : '-';
    this.editModeValues.terminationDate = this.data.terminationDate
      ? moment(this.data.terminationDate).format('DD-MMM-YYYY')
      : '-';
    this.editModeValues.modificationDate = this.data.modificationDate
      ? moment(this.data.modificationDate).format('DD-MMM-YYYY')
      : '-';

    // In edit mode, disable all fields except terminationDate
    // Only terminationDate is editable when editing an existing record
    this.form.get('donationType')?.disable();
    this.form.get('procedureCode')?.disable();
    this.form.get('attributeGroup')?.disable();
    this.form.get('attributeCode')?.disable();
    this.form.get('effectiveDate')?.disable();

    // Clear validators for disabled fields (they're not required when disabled)
    this.form.get('donationType')?.clearValidators();
    this.form.get('procedureCode')?.clearValidators();
    this.form.get('attributeGroup')?.clearValidators();
    this.form.get('attributeCode')?.clearValidators();
    this.form.get('effectiveDate')?.clearValidators();

    // Update validation for all disabled fields
    this.form.get('donationType')?.updateValueAndValidity();
    this.form.get('procedureCode')?.updateValueAndValidity();
    this.form.get('attributeGroup')?.updateValueAndValidity();
    this.form.get('attributeCode')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();

    // Populate form with data
    this.form.patchValue({
      donationType: this.data.donationType || '',
      procedureCode: this.data.procedureCode || '',
      attributeGroup: this.data.attribGroup || '',
      attributeCode: this.data.attribCode || '',
      effectiveDate: this.data.effectiveDate ? new Date(this.data.effectiveDate) : null,
      terminationDate: this.data.terminationDate ? new Date(this.data.terminationDate) : null
    });

    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Convert date value to native Date object
   * Handles both moment objects and native Date objects
   */
  private toNativeDate(value: any): Date | null {
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

  /**
   * Convert Date to ISO string without timezone shift
   * Preserves the local date by using UTC at noon
   */
  private toISOStringWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}${this.ISO_DATE_TIME_NOON}`;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    this.cdr.markForCheck(); // Trigger change detection to show validation errors

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const effectiveDate = this.toNativeDate(formValue.effectiveDate);
      const terminationDate = this.toNativeDate(formValue.terminationDate);

      const addPayload: ValidDonationTypeProcedureCodesDto = {
        donationType: formValue.donationType?.trim() || undefined,
        procedureCode: formValue.procedureCode?.trim() || undefined,
        attribGroup: formValue.attributeGroup?.trim() || '',
        attribCode: formValue.attributeCode?.trim() || '',
        effectiveDate: effectiveDate ? this.toISOStringWithoutTimezone(effectiveDate) : '',
        terminationDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : undefined,
        // TODO: sortSequence is hardcoded to 99999 for new records. Consider implementing:
        // - Auto-increment based on max existing sortSequence
        // - User-configurable field in the form
        // - Backend auto-assignment logic
        sortSequence: 99999
      };
      apiCall = this.validDonationTypeProcedureCodesService.addAttributeMapping(addPayload);
    } else {
      const terminationDate = this.toNativeDate(formValue.terminationDate);

      // Use originalValues for all composite key fields to ensure we're updating the correct record
      const updatePayload: UpdateValidDonationTypeProcedureCodesDto = {
        currentDonationType: this.originalValues.donationType || undefined,
        currentProcedureCode: this.originalValues.procedureCode || undefined,
        currentAttribGroup: this.originalValues.attributeGroup,
        currentAttribCode: this.originalValues.attributeCode,
        currentEffectiveDate: this.originalValues.effectiveDate,
        terminationDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : undefined,
        // Preserve existing sortSequence value when updating
        sortSequence: this.data?.sortSequence ?? 99999
      };
      apiCall = this.validDonationTypeProcedureCodesService.updateAttributeMapping(updatePayload);
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
        next: () => {
          const identifier = this.mode === 'add'
            ? `${formValue.donationType} / ${formValue.procedureCode}`
            : `${this.originalValues.donationType} / ${this.originalValues.procedureCode}`;

          const message = this.mode === 'add'
            ? `${identifier} has been added successfully.`
            : `${identifier} has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: AttributeMappingFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedureCode: formValue.procedureCode?.trim() || '',
            attributeGroup: formValue.attributeGroup?.trim() || '',
            attributeCode: formValue.attributeCode?.trim() || '',
            effectiveDate: this.toNativeDate(formValue.effectiveDate) || new Date(),
            terminationDate: this.toNativeDate(formValue.terminationDate)
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This attribute mapping already exists';
            } else if (error.status === 404) {
              errorMessage = 'Attribute mapping not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          this.cdr.markForCheck();
        }
      });
  }

  // Form control getters
  get donationTypeControl() {
    return this.form.get('donationType');
  }

  get procedureCodeControl() {
    return this.form.get('procedureCode');
  }

  get attributeGroupControl() {
    return this.form.get('attributeGroup');
  }

  get attributeCodeControl() {
    return this.form.get('attributeCode');
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

  getProcedureCodeError(): string {
    const control = this.procedureCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Procedure Code is required';
    }
    return '';
  }

  getAttributeGroupError(): string {
    const control = this.attributeGroupControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Attribute Group is required';
    }
    return '';
  }

  getAttributeCodeError(): string {
    const control = this.attributeCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Attribute Code is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.form);
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateError(this.form);
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  /**
   * Save and create another attribute mapping
   * Only available in ADD mode
   */
  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    const effectiveDate = this.toNativeDate(formValue.effectiveDate);
    const terminationDate = this.toNativeDate(formValue.terminationDate);

    const addPayload: ValidDonationTypeProcedureCodesDto = {
      donationType: formValue.donationType?.trim() || undefined,
      procedureCode: formValue.procedureCode?.trim() || undefined,
      attribGroup: formValue.attributeGroup?.trim() || '',
      attribCode: formValue.attributeCode?.trim() || '',
      effectiveDate: effectiveDate ? this.toISOStringWithoutTimezone(effectiveDate) : '',
      terminationDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : undefined,
      sortSequence: 99999
    };

    this.validDonationTypeProcedureCodesService.addAttributeMapping(addPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          const identifier = `${formValue.donationType} / ${formValue.procedureCode}`;
          const message = `${identifier} has been added successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: AttributeMappingFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedureCode: formValue.procedureCode?.trim() || '',
            attributeGroup: formValue.attributeGroup?.trim() || '',
            attributeCode: formValue.attributeCode?.trim() || '',
            effectiveDate: this.toNativeDate(formValue.effectiveDate) || new Date(),
            terminationDate: this.toNativeDate(formValue.terminationDate)
          };

          this.saveSuccess.emit(result);

          // Reset form for another entry
          this.form.reset();
          this.form.patchValue({
            donationType: '',
            procedureCode: '',
            attributeGroup: '',
            attributeCode: '',
            effectiveDate: null,
            terminationDate: null
          });
          this.cdr.markForCheck();
        },
        error: (error) => {
          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This attribute mapping already exists';
            } else if (error.status === 404) {
              errorMessage = 'Attribute mapping not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          this.cdr.markForCheck();
        }
      });
  }
}
