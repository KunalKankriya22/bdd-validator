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
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { DefineResourceMasterListService } from '../services/define-resource-master-list.service';
import {
  DefineResourceMasterListModel,
  DefineResourceMasterListDto,
  UpdateDefineResourceMasterListDto
} from '../models/define-resource-master-list.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';

export interface ResourceCodeFormData {
  resourceCode: string;
  description: string;
  type: string;
  sequence: number;
  critical: string; // 'Y' or 'N'
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-resource-code',
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
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-resource-code.html',
  styleUrls: ['./add-edit-resource-code.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditResourceCode implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineResourceMasterListModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ResourceCodeFormData>();

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;

  // Min date for effective date picker (today)
  minDate = DateFieldValidationUtility.getMinDate();

  // Dropdown options
  typeOptions: { value: string; label: string }[] = [];

  criticalOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  editModeValues = {
    resourceCode: '',
    effectiveDate: ''
  };

  minEffectiveDate: moment.Moment | null = null;
  minTerminationDate: moment.Moment | null = null;

  private originalValues = {
    resourceCode: '',
    effectiveDate: null as Date | null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private defineResourceMasterListService: DefineResourceMasterListService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.updatePanelTitle();
    this.loadFilterOptions();

    if (this.mode === 'add') {
      this.minEffectiveDate = DateFieldValidationUtility.getMinDate();
    } else {
      this.minEffectiveDate = null;
    }

    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    }
  }

  /**
   * Load filter options from API for Type dropdown
   */
  private loadFilterOptions(): void {
    this.defineResourceMasterListService
      .getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map resource types to dropdown format in CAPS
          this.typeOptions = response.resourceTypes.map(type => ({
            value: type,
            label: type
          }));
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback to default options if API fails
          this.typeOptions = [
            { value: 'STAFF', label: 'STAFF' },
            { value: 'COACH', label: 'COACH' },
            { value: 'VAN', label: 'VAN' },
            { value: 'MACH', label: 'MACH' },
            { value: 'BEDS', label: 'BEDS' },
            { value: 'BLK', label: 'BLK' },
            { value: 'PILLO', label: 'PILLO' },
            { value: 'SNACK', label: 'SNACK' }
          ];
          this.cdr.markForCheck();
        }
      });
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

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value && moment.isMoment(value) && value.isValid()) {
          // Normalize to start of day to ensure date-only comparison
          this.minTerminationDate = value.clone().startOf('day');
        } else {
          this.minTerminationDate = null;
        }
        // Re-validate termination date when effective date changes
        this.form.get('terminationDate')?.updateValueAndValidity();
        this.cdr.markForCheck(); // Trigger change detection to show errors
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck(); // Trigger change detection to show errors
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      resourceCode: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      description: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      type: [''],
      sequence: [null, [Validators.min(0), Validators.max(99)]],
      critical: ['N', [Validators.required]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add Resource Code' : 'Edit Item';
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.originalValues.resourceCode = this.data.resourceCode || '';
    this.originalValues.effectiveDate = this.data.effDate ? new Date(this.data.effDate) : null;

    this.editModeValues.resourceCode = this.data.resourceCode || '';
    this.editModeValues.effectiveDate = this.data.effDate
      ? this.formatDate(new Date(this.data.effDate))
      : '';

    this.form.get('resourceCode')?.disable();
    this.form.get('description')?.disable();
    this.form.get('effectiveDate')?.disable();

    this.form.get('resourceCode')?.clearValidators();
    this.form.get('description')?.clearValidators();
    this.form.get('effectiveDate')?.clearValidators();

    this.form.get('resourceCode')?.updateValueAndValidity();
    this.form.get('description')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();

    this.form.patchValue({
      resourceCode: this.data.resourceCode || '',
      description: this.data.resourceDesc || '',
      type: this.data.resourceType || '',
      sequence: this.data.sortSeq || null,
      critical: this.data.criticalInd?.toUpperCase() === 'Y' ? 'Y' : 'N',
      effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
      terminationDate: this.data.termDate ? moment(this.data.termDate) : null
    });

    // Set min termination date based on effective date (normalized to start of day)
    if (this.data.effDate) {
      this.minTerminationDate = moment(this.data.effDate).startOf('day');
    }

    this.cdr.markForCheck();
  }

  onSequenceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Limit to 2 digits max
    if (inputValue.length > 2) {
      inputValue = inputValue.substring(0, 2);
    }

    // Always update input value after cleaning
    input.value = inputValue;

    const value = parseInt(inputValue, 10);

    // Validate min value (0 is allowed for sequence)
    if (!isNaN(value) && value < 0) {
      input.value = '0';
      this.form.patchValue({ sequence: 0 }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Format date to DD-MMM-YYYY (e.g., "15-JAN-2024")
   */
  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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
      const effectiveMoment = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
      const terminationMoment = formValue.terminationDate ? moment(formValue.terminationDate) : null;

      const addPayload: DefineResourceMasterListDto = {
        resourceCode: formValue.resourceCode?.trim() || '',
        resourceDesc: formValue.description?.trim() || '',
        resourceType: formValue.type?.trim() || '',
        sortSeq: formValue.sequence || 0,
        criticalInd: formValue.critical || 'N',
        effDate: effectiveMoment ? effectiveMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
        termDate: terminationMoment ? terminationMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : ''
      };
      apiCall = this.defineResourceMasterListService.addResourceCode(addPayload);
    } else {
      const terminationMoment = formValue.terminationDate ? moment(formValue.terminationDate) : null;

      const updatePayload: UpdateDefineResourceMasterListDto = {
        resourceCode: this.originalValues.resourceCode,
        resourceDesc: formValue.description?.trim() || '',
        resourceType: formValue.type?.trim() || '',
        sortSeq: formValue.sequence || 0,
        criticalInd: formValue.critical || 'N',
        effDate: this.originalValues.effectiveDate ? moment(this.originalValues.effectiveDate).format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
        termDate: terminationMoment ? terminationMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : ''
      };
      apiCall = this.defineResourceMasterListService.updateResourceCode(updatePayload);
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
          const message = this.mode === 'add'
            ? 'Resource code has been added successfully.'
            : 'Resource code has been updated successfully.';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ResourceCodeFormData = {
            resourceCode: formValue.resourceCode?.trim() || '',
            description: formValue.description?.trim() || '',
            type: formValue.type?.trim() || '',
            sequence: formValue.sequence,
            critical: formValue.critical,
            effectiveDate: formValue.effectiveDate && moment.isMoment(formValue.effectiveDate)
              ? formValue.effectiveDate.toDate()
              : new Date(),
            terminationDate: formValue.terminationDate && moment.isMoment(formValue.terminationDate)
              ? formValue.terminationDate.toDate()
              : null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        }
      });
  }

  // Form control getters
  get resourceCodeControl() {
    return this.form.get('resourceCode');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get typeControl() {
    return this.form.get('type');
  }

  get sequenceControl() {
    return this.form.get('sequence');
  }

  get criticalControl() {
    return this.form.get('critical');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  // Validation error methods
  getResourceCodeError(): string {
    const control = this.resourceCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Resource Code is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Resource Code cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Resource Code must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Maximum 5 characters allowed';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Description is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Description cannot contain only spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Maximum 50 characters allowed';
    }
    return '';
  }

  getTypeError(): string {
    const control = this.typeControl;
    if (!control || !control.touched) return '';

    return '';
  }

  getSequenceError(): string {
    const control = this.sequenceControl;
    if (!control || !control.touched) return '';

    if (control.hasError('min')) {
      return 'Sequence must be 0 or greater';
    }
    if (control.hasError('max')) {
      return 'Sequence must be 99 or less';
    }
    return '';
  }

  getCriticalError(): string {
    const control = this.criticalControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Critical is required';
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

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    const effectiveMoment = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
    const terminationMoment = formValue.terminationDate ? moment(formValue.terminationDate) : null;

    const addPayload: DefineResourceMasterListDto = {
      resourceCode: formValue.resourceCode?.trim() || '',
      resourceDesc: formValue.description?.trim() || '',
      resourceType: formValue.type?.trim() || '',
      sortSeq: formValue.sequence || 0,
      criticalInd: formValue.critical || 'N',
      effDate: effectiveMoment ? effectiveMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
      termDate: terminationMoment ? terminationMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : ''
    };

    this.defineResourceMasterListService
      .addResourceCode(addPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('New resource code added successfully', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ResourceCodeFormData = {
            resourceCode: formValue.resourceCode?.trim() || '',
            description: formValue.description?.trim() || '',
            type: formValue.type?.trim() || '',
            sequence: formValue.sequence,
            critical: formValue.critical,
            effectiveDate: formValue.effectiveDate && moment.isMoment(formValue.effectiveDate)
              ? formValue.effectiveDate.toDate()
              : new Date(),
            terminationDate: formValue.terminationDate && moment.isMoment(formValue.terminationDate)
              ? formValue.terminationDate.toDate()
              : null
          };

          this.saveSuccess.emit(result);

          // Reset form for next entry
          this.form.reset({
            critical: 'N'
          });
          this.form.markAsUntouched();

          this.cdr.markForCheck();
        }
      });
  }
}
