import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LabelingInterdictionOverrideService } from '../services/labeling-interdiction-override.service';
import { LoginService } from '@shared/services/login.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  LabelingInterdictionOverrideModel,
  LabelingInterdictionOverrideCreateDto,
  LabelingInterdictionOverrideUpdateDto
} from '../models/labeling-interdiction-override.model';

export interface LabelingInterdictionOverrideFormData {
  donorDecisionCode: string;
  productType: string;
  interCode: string;
  interType: string;
  overrideDescription: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-labeling-interdiction-override',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-labeling-interdiction-override.html',
  styleUrls: ['./add-edit-labeling-interdiction-override.scss']
})
export class AddEditLabelingInterdictionOverride implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: LabelingInterdictionOverrideModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<LabelingInterdictionOverrideFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastModified: string = '';

  editModeValues: {
    donorDecisionCode: string;
    productType: string;
    interCode: string;
    interType: string;
    overrideDescription: string;
    effectiveDate: string;
  } = {
    donorDecisionCode: '',
    productType: '',
    interCode: '',
    interType: '',
    overrideDescription: '',
    effectiveDate: ''
  };

  donorDecisionCodeOptions: { value: string; display: string }[] = [];
  productTypeOptions: { value: string; display: string }[] = [];
  interCodeOptions: { value: string; display: string }[] = [];
  interTypeOptions: { value: string; display: string }[] = [
    { value: 'N', display: 'N - NFT' },
    { value: 'B', display: 'B - Bio' },
    { value: 'H', display: 'H - Hold' },
    { value: 'I', display: 'I - Initial' }
  ];

  // Search controls and filtered options
  donorDecisionCodeSearchControl = new FormControl('');
  filteredDonorDecisionCodeOptions: { value: string; display: string }[] = [];

  productTypeSearchControl = new FormControl('');
  filteredProductTypeOptions: { value: string; display: string }[] = [];

  interCodeSearchControl = new FormControl('');
  filteredInterCodeOptions: { value: string; display: string }[] = [];

  interTypeSearchControl = new FormControl('');
  filteredInterTypeOptions: { value: string; display: string }[] = [];

  // Auto-populated description fields (non-editable)
  productTypeDescription: string = '';
  interDescription: string = '';

  // Lookup maps for auto-populating descriptions
  private donorDecisionCodeDisplayMap: Map<string, string> = new Map();
  private productTypeDescriptionMap: Map<string, string> = new Map();
  private interCodeDescriptionMap: Map<string, string> = new Map();

  minEffectiveDate = DateFieldValidationUtility.getMinDate();

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  isLoadingOptions = false;
  isSaving = false;

  // Store original primary key values for edit mode (needed for update API)
  private originalKeys: {
    donorDecisionCode: string;
    productType: string;
    interCode: string;
  } = {
    donorDecisionCode: '',
    productType: '',
    interCode: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private overrideService: LabelingInterdictionOverrideService,
    private loginService: LoginService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      donorDecisionCode: ['', [Validators.required]],
      productType: ['', [Validators.required]],
      interCode: ['', [Validators.required]],
      interType: ['', [Validators.required]],
      overrideDescription: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupValidatorsBasedOnMode();
    this.setupDateFieldTracking();
    this.loadDropdowns();
    this.setupAutoPopulate();
    this.setupSearchControls();
  }

  /**
   * Setup validators based on Add or Edit mode
   */
  private setupValidatorsBasedOnMode(): void {
    if (this.mode === 'add') {
      // Add mode: Effective Date cannot be past date
      this.form.get('effectiveDate')?.setValidators([
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
    } else {
      // Edit mode: Allow past dates for existing records
      this.form.get('effectiveDate')?.setValidators([
        Validators.required
      ]);
      // Edit mode: Termination Date cannot be past date
      this.form.get('terminationDate')?.setValidators([
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
    }
    this.form.get('effectiveDate')?.updateValueAndValidity();
    this.form.get('terminationDate')?.updateValueAndValidity();
  }

  private setupDateFieldTracking(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  private setupSearchControls(): void {
    // Donor Decision Code search
    this.donorDecisionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredDonorDecisionCodeOptions = this.donorDecisionCodeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.display.toLowerCase().includes(term)
        );
      });

    // Product Type search
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredProductTypeOptions = this.productTypeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.display.toLowerCase().includes(term)
        );
      });

    // Inter Code search
    this.interCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredInterCodeOptions = this.interCodeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.display.toLowerCase().includes(term)
        );
      });

    // Inter Type search
    this.interTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredInterTypeOptions = this.interTypeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.display.toLowerCase().includes(term)
        );
      });
  }

  private setupAutoPopulate(): void {
    // Auto-populate Lab Product Type Description when Lab Product Type changes
    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        // Only update from map if map has been populated (dropdowns loaded)
        if (this.productTypeDescriptionMap.size > 0) {
          this.productTypeDescription = this.productTypeDescriptionMap.get(value) || '';
        }
      });

    // Auto-populate Interdiction Description when Interdiction changes
    this.form.get('interCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        // Only update from map if map has been populated (dropdowns loaded)
        if (this.interCodeDescriptionMap.size > 0) {
          this.interDescription = this.interCodeDescriptionMap.get(value) || '';
        }
      });
  }

  private loadDropdowns(): void {
    this.isLoadingOptions = true;

    this.overrideService.getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dropdowns) => {
          // Cue: combination of code - description
          const rawCodes = dropdowns.donorDecisionCodes || [];
          this.donorDecisionCodeOptions = rawCodes.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.filteredDonorDecisionCodeOptions = [...this.donorDecisionCodeOptions];
          this.donorDecisionCodeDisplayMap.clear();
          rawCodes.forEach((item) => {
            const displayValue = item.description ? `${item.code} - ${item.description}` : item.code;
            this.donorDecisionCodeDisplayMap.set(item.code, displayValue);
          });

          // Lab Product Type: code - description display, build lookup map
          const rawProductTypes = dropdowns.productTypes || [];
          this.productTypeOptions = rawProductTypes.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.filteredProductTypeOptions = [...this.productTypeOptions];
          this.productTypeDescriptionMap.clear();
          rawProductTypes.forEach((item) => {
            this.productTypeDescriptionMap.set(item.code, item.description || '');
          });

          // Interdiction: code - description display, build lookup map
          const rawInterCodes = dropdowns.interCodes || [];
          this.interCodeOptions = rawInterCodes.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.filteredInterCodeOptions = [...this.interCodeOptions];
          this.interCodeDescriptionMap.clear();
          rawInterCodes.forEach((item) => {
            this.interCodeDescriptionMap.set(item.code, item.description || '');
          });

          // Type: full form display with code prefix (N - NFT, B - Bio, etc.)
          const rawTypes = dropdowns.interTypes || [];
          if (rawTypes.length > 0) {
            this.interTypeOptions = rawTypes.map((item) => ({
              value: item.code,
              display: item.description ? `${item.code} - ${item.description}` : item.code
            }));
          }
          this.filteredInterTypeOptions = [...this.interTypeOptions];

          // In edit mode, re-apply form values after options load so mat-select displays them
          if (this.mode === 'edit' && this.data) {
            const savedProductTypeDesc = this.productTypeDescription;
            const savedInterDesc = this.interDescription;
            const savedDonorDecisionCodeDisplay = this.editModeValues.donorDecisionCode;

            this.form.patchValue({
              donorDecisionCode: this.data.donorDecisionCode || '',
              productType: this.data.productType || '',
              interCode: this.data.interCode || '',
              interType: this.data.interType || ''
            }, { emitEvent: false });

            // Update donorDecisionCode display value from map if available
            const currentDonorDecisionCode = this.form.get('donorDecisionCode')?.value;
            if (currentDonorDecisionCode) {
              const mapDisplay = this.donorDecisionCodeDisplayMap.get(currentDonorDecisionCode);
              this.editModeValues.donorDecisionCode = mapDisplay || savedDonorDecisionCodeDisplay;
            }

            // Update descriptions from map if available, otherwise keep row data values
            const currentProductType = this.form.get('productType')?.value;
            if (currentProductType) {
              const mapDesc = this.productTypeDescriptionMap.get(currentProductType);
              this.productTypeDescription = mapDesc || savedProductTypeDesc;
              this.editModeValues.productType = mapDesc
                ? `${currentProductType} - ${mapDesc}`
                : currentProductType;
            }
            const currentInterCode = this.form.get('interCode')?.value;
            if (currentInterCode) {
              const mapDesc = this.interCodeDescriptionMap.get(currentInterCode);
              this.interDescription = mapDesc || savedInterDesc;
              this.editModeValues.interCode = mapDesc
                ? `${currentInterCode} - ${mapDesc}`
                : currentInterCode;
            }
          }

          this.isLoadingOptions = false;
        },
        error: () => {
          this.isLoadingOptions = false;
        }
      });
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
      this.panelTitle = 'Add New Override';
      this.lastModified = '';
    } else {
      this.panelTitle = 'Edit Override';
      const modifiedDate = this.data?.lastModifiedDate;
      this.lastModified = modifiedDate
        ? `Last Modified: ${moment(modifiedDate).format('DD-MMM-YYYY').toUpperCase()}`
        : '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      donorDecisionCode: '',
      productType: '',
      interCode: '',
      interType: '',
      overrideDescription: '',
      effectiveDate: ''
    };

    // Clear auto-populated description fields
    this.productTypeDescription = '';
    this.interDescription = '';

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable all fields in add mode
    this.form.get('donorDecisionCode')?.enable();
    this.form.get('productType')?.enable();
    this.form.get('interCode')?.enable();
    this.form.get('interType')?.enable();
    this.form.get('overrideDescription')?.enable();
    this.form.get('effectiveDate')?.enable();

    // Restore required validators for add mode
    this.form.get('donorDecisionCode')?.setValidators([Validators.required]);
    this.form.get('productType')?.setValidators([Validators.required]);
    this.form.get('interCode')?.setValidators([Validators.required]);
    this.form.get('interType')?.setValidators([Validators.required]);
    this.form.get('overrideDescription')?.setValidators([Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]);
    this.form.get('effectiveDate')?.setValidators([Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())]);

    // Update validity
    this.form.get('donorDecisionCode')?.updateValueAndValidity();
    this.form.get('productType')?.updateValueAndValidity();
    this.form.get('interCode')?.updateValueAndValidity();
    this.form.get('interType')?.updateValueAndValidity();
    this.form.get('overrideDescription')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const donorDecisionCode = this.data.donorDecisionCode || '';
      const productType = this.data.productType || '';
      const interCode = this.data.interCode || '';
      const interType = this.data.interType || '';
      const overrideDescription = this.data.overrideDescription || '';

      // Store original primary key values for update API
      this.originalKeys = {
        donorDecisionCode,
        productType,
        interCode
      };

      // Display values for read-only cards
      const effectiveDateMoment = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;

      // Get formatted display value for donorDecisionCode from map, or fall back to code only
      const donorDecisionCodeDisplay = this.donorDecisionCodeDisplayMap.get(donorDecisionCode) || donorDecisionCode;

      this.editModeValues = {
        donorDecisionCode: donorDecisionCodeDisplay,
        productType,
        interCode,
        interType: interType ? (this.interTypeOptions.find(o => o.value === interType)?.display || interType) : '',
        overrideDescription,
        effectiveDate: effectiveDateMoment?.isValid() ? effectiveDateMoment.format('DD-MMM-YYYY').toUpperCase() : ''
      };

      this.form.patchValue({
        donorDecisionCode,
        productType,
        interCode,
        interType,
        overrideDescription,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      // Set descriptions AFTER patchValue to avoid being overwritten by valueChanges
      this.productTypeDescription = this.data.productTypeDescription || '';
      this.interDescription = this.data.interDescription || '';

      // Disable non-editable fields in edit mode
      this.form.get('donorDecisionCode')?.disable();
      this.form.get('productType')?.disable();
      this.form.get('interCode')?.disable();
      this.form.get('interType')?.disable();
      this.form.get('overrideDescription')?.disable();
      this.form.get('effectiveDate')?.disable();
    }
  }

  /** Focuses the first invalid form field for screen reader announcement (WCAG 3.3.1) */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) {
        setTimeout(() => el.focus(), 100);
      }
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    // Get current user ID from cookie for audit trail
    const currentUserId = this.loginService.getStoredUsername();

    if (this.mode === 'add') {
      const addPayload: LabelingInterdictionOverrideCreateDto = {
        donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
        productType: formValue.productType?.trim() || '',
        interCode: formValue.interCode?.trim() || '',
        interType: formValue.interType || '',
        overrideDescription: formValue.overrideDescription?.trim() || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        userId: currentUserId
      };
      apiCall = this.overrideService.createOverride(addPayload);
    } else {
      const updatePayload: LabelingInterdictionOverrideUpdateDto = {
        donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
        productType: formValue.productType?.trim() || '',
        interCode: formValue.interCode?.trim() || '',
        interType: formValue.interType || '',
        overrideDescription: formValue.overrideDescription?.trim() || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        userId: currentUserId
      };
      apiCall = this.overrideService.updateOverride(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(
            response.message || (this.mode === 'add' ? 'Override added successfully' : 'Override updated successfully')
          );

          this.saveSuccess.emit({
            donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
            productType: formValue.productType?.trim() || '',
            interCode: formValue.interCode?.trim() || '',
            interType: formValue.interType || '',
            overrideDescription: formValue.overrideDescription?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          });
          this.closePanel.emit();
        },
        error: () => {}
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    // Get current user ID from cookie for audit trail
    const currentUserId = this.loginService.getStoredUsername();

    if (this.mode === 'add') {
      const addPayload: LabelingInterdictionOverrideCreateDto = {
        donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
        productType: formValue.productType?.trim() || '',
        interCode: formValue.interCode?.trim() || '',
        interType: formValue.interType || '',
        overrideDescription: formValue.overrideDescription?.trim() || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        userId: currentUserId
      };
      apiCall = this.overrideService.createOverride(addPayload);
    } else {
      const updatePayload: LabelingInterdictionOverrideUpdateDto = {
        donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
        productType: formValue.productType?.trim() || '',
        interCode: formValue.interCode?.trim() || '',
        interType: formValue.interType || '',
        overrideDescription: formValue.overrideDescription?.trim() || '',
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        userId: currentUserId
      };
      apiCall = this.overrideService.updateOverride(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(
            response.message || 'Operation completed successfully'
          );

          this.saveSuccess.emit({
            donorDecisionCode: formValue.donorDecisionCode?.trim() || '',
            productType: formValue.productType?.trim() || '',
            interCode: formValue.interCode?.trim() || '',
            interType: formValue.interType || '',
            overrideDescription: formValue.overrideDescription?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          });

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
        },
        error: () => {}
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PST]');
    }
  }

  get donorDecisionCodeControl() {
    return this.form.get('donorDecisionCode');
  }

  get productTypeControl() {
    return this.form.get('productType');
  }

  get interCodeControl() {
    return this.form.get('interCode');
  }

  get interTypeControl() {
    return this.form.get('interType');
  }

  get overrideDescriptionControl() {
    return this.form.get('overrideDescription');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getDonorDecisionCodeError(): string {
    const control = this.donorDecisionCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Cue is required';
    return '';
  }

  getProductTypeError(): string {
    const control = this.productTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Lab Product Type is required';
    return '';
  }

  getInterCodeError(): string {
    const control = this.interCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Interdiction is required';
    return '';
  }

  getInterTypeError(): string {
    const control = this.interTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Type is required';
    return '';
  }

  getOverrideDescriptionError(): string {
    const control = this.overrideDescriptionControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Override Description is required';
    if (control.hasError('whitespaceOnly')) return 'Override Description cannot contain only spaces';
    if (control.hasError('maxlength')) return 'Override Description must be at most 50 characters';
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

  /**
   * Prevent leading spaces in Override Description field
   */
  onOverrideDescriptionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // If the value starts with a space, remove it
    if (value && value.startsWith(' ')) {
      const trimmedValue = value.trimStart();
      this.form.get('overrideDescription')?.setValue(trimmedValue, { emitEvent: false });
      // Update the input element's value to reflect the change
      input.value = trimmedValue;
    }
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get isFormValid(): boolean {
    return this.form.valid && !this.hasDateValidationError();
  }
}
