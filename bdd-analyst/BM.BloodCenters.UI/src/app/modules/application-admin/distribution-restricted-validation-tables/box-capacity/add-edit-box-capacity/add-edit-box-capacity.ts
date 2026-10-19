import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, signal, computed } from '@angular/core';
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
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { BoxCapacityService } from '../services/box-capacity.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil, finalize, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  BoxCapacityModel,
  BoxCapacityDto,
  UpdateBoxCapacityDto,
  BoxTypeLov,
  InventoryProductTypeLov
} from '../models/box-capacity.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface BoxCapacityFormData {
  boxType: string;
  inventoryProductType: string;
  capacity: number;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-box-capacity',
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
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-box-capacity.html',
  styleUrls: ['./add-edit-box-capacity.scss']
})
export class AddEditBoxCapacity implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: BoxCapacityModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<BoxCapacityFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    boxType: string;
    inventoryProductType: string;
    capacity: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
      boxType: '',
      inventoryProductType: '',
      capacity: '',
      effectiveDate: '',
      terminationDate: ''
    };

  boxTypeOptions: BoxTypeLov[] = [];
  inventoryProductTypeOptions: InventoryProductTypeLov[] = [];

  // Search controls for dropdowns
  boxTypeSearchCtrl = new FormControl('');
  inventoryProductTypeSearchCtrl = new FormControl('');

  // Signals for filtered options
  boxTypeOptionsSignal = signal<BoxTypeLov[]>([]);
  inventoryProductTypeOptionsSignal = signal<InventoryProductTypeLov[]>([]);

  // Convert FormControl values to signals
  boxTypeSearchSignal = toSignal(this.boxTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  inventoryProductTypeSearchSignal = toSignal(this.inventoryProductTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredBoxTypeOptions = computed(() => {
    const searchTerm = this.boxTypeSearchSignal()?.toLowerCase() || '';
    const options = this.boxTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.boxType.toLowerCase().includes(searchTerm) ||
      option.boxTypeDescription.toLowerCase().includes(searchTerm)
    );
  });

  filteredInventoryProductTypeOptions = computed(() => {
    const searchTerm = this.inventoryProductTypeSearchSignal()?.toLowerCase() || '';
    const options = this.inventoryProductTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.inventoryProductType.toLowerCase().includes(searchTerm) ||
      option.productTypeDescription.toLowerCase().includes(searchTerm)
    );
  });

  isLoadingOptions = false;
  isSaving = false;
  showCapacityOverflowError = false;

  // Min date for effective date picker (chapter local date)
  minDate!: moment.Moment;
  minEffectiveDate: moment.Moment | null = null;
  minTerminationDate: moment.Moment | null = null;

  // Date filter functions for chapter-aware date pickers
  effectiveDateFilterFn!: (date: moment.Moment | null) => boolean;
  terminationDateFilterFn!: (date: moment.Moment | null) => boolean;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Date formatting constant - using noon to avoid timezone shift issues
  private readonly ISO_DATE_TIME_NOON = 'T12:00:00.000Z';

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    boxType: string;
    inventoryProductType: string;
    effectiveDate: Date | null;
  } = {
    boxType: '',
    inventoryProductType: '',
    effectiveDate: null
  };

  // Store original editable values for dirty tracking in edit mode
  private originalEditableValues: {
    capacity: number | null;
    effectiveDate: string | null;
    terminationDate: string | null;
  } = { capacity: null, effectiveDate: null, terminationDate: null };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private boxCapacityService: BoxCapacityService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      boxType: ['', [Validators.required]],
      inventoryProductType: ['', [Validators.required]],
      capacity: [null, [Validators.required, Validators.min(0), Validators.max(9999)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  ngOnInit(): void {
    this.setupDateValidation();
    this.setupPanel();
    this.loadDropdownOptions();
    this.setupDateValueChangeListeners();
    this.setupDropdownValueChangeListeners();

    // Setup validators based on mode
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }
    // Note: Edit mode validators are set up in populateFormForEdit()
    // to keep effective date enabled instead of disabled
  }

  /**
   * Setup date validation with chapter timezone
   */
  private setupDateValidation(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();
    if (!chapterTimezone) return;

    // Set minDate based on chapter timezone
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.minEffectiveDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    // Create effective date filter based on chapter timezone
    this.effectiveDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(chapterTimezone);

    // Termination date filter - ensures date is not in past and after effective date
    this.terminationDateFilterFn = (date: moment.Moment | null): boolean => {
      if (!date) return true;

      const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
      const checkDate = moment.isMoment(date) ? date : moment(date);

      // Cannot be before chapter's today
      if (checkDate.format('YYYY-MM-DD') < chapterToday.format('YYYY-MM-DD')) {
        return false;
      }

      // Must be on or after effective date
      const effectiveDate = this.form?.get('effectiveDate')?.value;
      if (effectiveDate && moment.isMoment(effectiveDate)) {
        const effDay = moment(effectiveDate).startOf('day');
        if (checkDate.isBefore(effDay, 'day')) {
          return false;
        }
      }

      return true;
    };
  }

  /**
   * Setup value change listeners for date fields
   */
  private setupDateValueChangeListeners(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    // Setup min termination date based on effective date
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((effDate: moment.Moment | null) => {
        if (effDate && moment.isMoment(effDate)) {
          this.minTerminationDate = moment(effDate).startOf('day');
        } else {
          this.minTerminationDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
        }
        this.form.get('terminationDate')?.updateValueAndValidity();
        this.cdr.markForCheck();
      });
  }

  /**
   * Setup listeners for dropdown fields to clear validation when value is cleared
   */
  private setupDropdownValueChangeListeners(): void {
    // Box Type dropdown
    this.form.get('boxType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('boxType');
        if (!value && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });

    // Inventory Product Type dropdown
    this.form.get('inventoryProductType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const control = this.form.get('inventoryProductType');
        if (!value && control) {
          control.setErrors(null);
          if (this.mode === 'add') {
            control.markAsPristine();
            control.markAsUntouched();
          }
        }
      });
  }

  /**
   * Load box types and inventory product types from API for dropdown options
   */
  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;

    this.boxCapacityService.getBoxCapacityLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.boxTypeOptions = response.data?.[0]?.boxTypes || [];
          this.inventoryProductTypeOptions = response.data?.[0]?.inventoryProdTypes || [];

          // Update signals for filtered dropdowns
          this.boxTypeOptionsSignal.set(this.boxTypeOptions);
          this.inventoryProductTypeOptionsSignal.set(this.inventoryProductTypeOptions);

          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading dropdown options:', error);
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
      this.panelTitle = 'Add New Box Capacity';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Box Capacity';
      this.lastUpdated = this.data?.lastModificationDate
        ? `Last Updated: ${this.formatDateTime(new Date(this.data.lastModificationDate))}`
        : '';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      boxType: '',
      inventoryProductType: '',
      capacity: '',
      effectiveDate: '',
      terminationDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.showCapacityOverflowError = false;

    // Enable all fields for add mode
    this.form.get('boxType')?.enable();
    this.form.get('inventoryProductType')?.enable();
    this.form.get('capacity')?.enable();

    // Restore required validators for add mode
    this.form.get('boxType')?.setValidators([Validators.required]);
    this.form.get('inventoryProductType')?.setValidators([Validators.required]);
    this.form.get('capacity')?.setValidators([Validators.required, Validators.min(0), Validators.max(9999)]);

    // Use shared utility to setup date field validators for Add mode
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    // Update validity
    this.form.get('boxType')?.updateValueAndValidity();
    this.form.get('inventoryProductType')?.updateValueAndValidity();
    this.form.get('capacity')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const boxType = this.data.boxType || '';
      const inventoryProductType = this.data.inventoryProdType || '';
      const effectiveDate = this.data.effectiveDate;

      // Store original values for update API
      this.originalValues = {
        boxType,
        inventoryProductType,
        effectiveDate: effectiveDate ?? null
      };

      this.editModeValues = {
        boxType,
        inventoryProductType,
        capacity: this.data.capacity !== undefined && this.data.capacity !== null ? this.data.capacity.toString() : '',
        effectiveDate: effectiveDate ? this.formatDateForDisplay(effectiveDate) : '',
        terminationDate: this.data.terminationDate ? this.formatDateForDisplay(this.data.terminationDate) : ''
      };

      // Disable non-editable fields in edit mode (boxType and inventoryProductType)
      this.form.get('boxType')?.disable();
      this.form.get('inventoryProductType')?.disable();

      // Clear validators for disabled fields
      this.form.get('boxType')?.clearValidators();
      this.form.get('inventoryProductType')?.clearValidators();
      this.form.get('capacity')?.setValidators([Validators.required, Validators.min(0), Validators.max(9999)]);

      // Keep effective date enabled and set appropriate validators for edit mode
      const chapterTimezone = this.headerService.chapterTimeZone();

      // Setup termination date validators for edit mode
      const terminationDateControl = this.form.get('terminationDate');
      if (terminationDateControl) {
        terminationDateControl.clearValidators();
        terminationDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator()
        ]);
        terminationDateControl.updateValueAndValidity();
      }

      // Patch values first
      this.form.patchValue({
        boxType,
        inventoryProductType,
        capacity: this.data.capacity,
        effectiveDate: effectiveDate ? moment(effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      }, { emitEvent: false });

      // Then enable effective date and set validators (after patching to ensure it stays enabled)
      // In edit mode, we need to validate that the effective date cannot be in the past
      const effectiveDateControl = this.form.get('effectiveDate');
      effectiveDateControl?.enable();
      effectiveDateControl?.setValidators([
        Validators.required,
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone)
      ]);
      effectiveDateControl?.updateValueAndValidity();

      // Update validity for other controls
      this.form.get('boxType')?.updateValueAndValidity();
      this.form.get('inventoryProductType')?.updateValueAndValidity();
      this.form.get('capacity')?.updateValueAndValidity();

      // Store original editable values for dirty tracking
      this.originalEditableValues = {
        capacity: this.data.capacity ?? null,
        effectiveDate: effectiveDate ? moment(effectiveDate).format('YYYY-MM-DD') : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate).format('YYYY-MM-DD') : null
      };

      // Set min termination date based on effective date and chapter timezone
      const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
      if (effectiveDate) {
        const effDay = moment(effectiveDate).startOf('day');
        this.minTerminationDate = effDay.isAfter(chapterToday) ? effDay : chapterToday;
      } else {
        this.minTerminationDate = chapterToday;
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();

      // If effective date is in the past, mark as touched to show error immediately
      // This must be done AFTER markAsUntouched() to ensure the error is visible on panel open
      if (effectiveDateControl && effectiveDate && DateFieldValidationUtility.isPastDate(moment(effectiveDate), chapterTimezone)) {
        effectiveDateControl.markAsTouched();
        effectiveDateControl.markAsDirty();
      }

      this.cdr.markForCheck();
    }
  }

  private formatDateForDisplay(date: Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
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

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const currentChapterId = this.headerService.chapterId();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const effectiveDate = this.toNativeDate(formValue.effectiveDate);
      const terminationDate = this.toNativeDate(formValue.terminationDate);

      const addPayload: BoxCapacityDto = {
        boxType: formValue.boxType || '',
        productType: formValue.inventoryProductType || '',
        capacity: formValue.capacity || 0,
        effectiveDate: effectiveDate ? this.toISOStringWithoutTimezone(effectiveDate) : '',
        terminationDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : '',
        chapterId: currentChapterId || undefined
      };
      apiCall = this.boxCapacityService.addBoxCapacity(addPayload);
    } else {
      const effectiveDate = this.toNativeDate(formValue.effectiveDate);
      const terminationDate = this.toNativeDate(formValue.terminationDate);

      const updatePayload: UpdateBoxCapacityDto = {
        boxType: this.originalValues.boxType,
        productType: this.originalValues.inventoryProductType,
        capacity: formValue.capacity || 0,
        effectiveDate: effectiveDate ? this.toISOStringWithoutTimezone(effectiveDate) : '',
        terminationDate: terminationDate ? this.toISOStringWithoutTimezone(terminationDate) : '',
        chapterId: currentChapterId || undefined
      };
      apiCall = this.boxCapacityService.updateBoxCapacity(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'New record has been added successfully'
            : 'Box capacity record has been updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: BoxCapacityFormData = {
            boxType: formValue.boxType || '',
            inventoryProductType: formValue.inventoryProductType || '',
            capacity: formValue.capacity || 0,
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('Error saving box capacity:', error);
          // Error is handled globally by authInterceptor
        }
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const timeZone = this.headerService.chapterTimeZone();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const hour = parts.find(p => p.type === 'hour')?.value || '12';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'AM';
    const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';

    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');
    const datePart = isToday ? 'Today' : momentDate.format('DD-MMM-YYYY').toUpperCase();
    return `${datePart}, ${hour}:${minute} ${dayPeriod} ${timeZoneName}`;
  }

  get boxTypeControl() {
    return this.form.get('boxType');
  }

  get inventoryProductTypeControl() {
    return this.form.get('inventoryProductType');
  }

  get capacityControl() {
    return this.form.get('capacity');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getBoxTypeError(): string {
    const control = this.boxTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Box Type is required';
    }
    return '';
  }

  getInventoryProductTypeError(): string {
    const control = this.inventoryProductTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Inventory Product Type is required';
    }
    return '';
  }

  onCapacityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Allow only digits (no negative values) and limit to 4 digits
    let value = input.value.replace(/[^\d]/g, '');

    // Enforce maximum 4 digits - prevent typing more (silently truncate without error)
    if (value.length > 4) {
      value = value.substring(0, 4);
    }

    const capacityControl = this.form.get('capacity');

    // If field is cleared, clear errors and reset state (same as date fields)
    if (!value) {
      this.showCapacityOverflowError = false;
      capacityControl?.setValue(null, { emitEvent: false });
      capacityControl?.setErrors(null);
      if (this.mode === 'edit') {
        capacityControl?.markAsDirty();
      } else {
        capacityControl?.markAsPristine();
        capacityControl?.markAsUntouched();
      }
      capacityControl?.updateValueAndValidity();
    } else {
      const numValue = Number(value);
      capacityControl?.setValue(numValue, { emitEvent: false });

      // Clear overflow flag - no error should be shown for restriction
      this.showCapacityOverflowError = false;
      // Trigger validation to check min/max
      capacityControl?.updateValueAndValidity();
    }

    input.value = value;

    this.cdr.markForCheck();
  }

  onCapacityBlur(event: Event): void {
    const capacityControl = this.form.get('capacity');
    if (!capacityControl) return;

    capacityControl.markAsTouched();
    capacityControl.updateValueAndValidity();
    this.cdr.markForCheck();
  }



  getCapacityError(): string {
    const control = this.capacityControl;
    if (!control) return '';

    // For errors, require touched state
    if (!control.touched) return '';

    if (control.hasError('required')) {
      return 'Capacity is required';
    }
    if (control.hasError('min')) {
      return 'Value must be between 0 and 9999.';
    }
    if (control.hasError('max')) {
      return 'Value must be between 0 and 9999.';
    }
    return '';
  }

  getEffectiveDateError(inputElement?: HTMLInputElement): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(inputElement?: HTMLInputElement): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get isFormDirty(): boolean {
    if (this.mode === 'add') {
      return true;
    }
    const currentCapacity = this.form.get('capacity')?.value ?? null;
    const currentEffDate = this.form.get('effectiveDate')?.value;
    const currentEffDateStr = currentEffDate
      ? (moment.isMoment(currentEffDate) ? currentEffDate.format('YYYY-MM-DD') : moment(currentEffDate).format('YYYY-MM-DD'))
      : null;
    const currentTermDate = this.form.get('terminationDate')?.value;
    const currentTermDateStr = currentTermDate
      ? (moment.isMoment(currentTermDate) ? currentTermDate.format('YYYY-MM-DD') : moment(currentTermDate).format('YYYY-MM-DD'))
      : null;
    return currentCapacity !== this.originalEditableValues.capacity
      || currentEffDateStr !== this.originalEditableValues.effectiveDate
      || currentTermDateStr !== this.originalEditableValues.terminationDate;
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('effectiveDate');

    if (!control) return;

    const inputValue = input.value?.trim();

    // If field is cleared, clear errors and reset state (same as Termination Date)
    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      if (this.mode === 'edit') {
        control.markAsDirty();
      } else {
        control.markAsPristine();
        control.markAsUntouched();
      }
      control.updateValueAndValidity();
    } else {
      // If input has text but control value is null, datepicker couldn't parse it
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onEffectiveDateBlur(event: Event): void {
    const control = this.form.get('effectiveDate');
    if (!control) return;

    control.markAsTouched();
    control.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }
}
