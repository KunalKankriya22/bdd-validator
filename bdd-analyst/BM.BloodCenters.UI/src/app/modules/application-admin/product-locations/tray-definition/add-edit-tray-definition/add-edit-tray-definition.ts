import { Component, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { TrayDefinitionService } from '../services/tray-definition.service';
import { TrayScanService } from '@shared/services/tray-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import {
  TrayDto,
  CreateTrayRequestDto,
  UpdateTrayRequestDto,
  TrayStatusLovDto
} from '../models/tray-definition.model';

@Component({
  selector: 'app-add-edit-tray-definition',
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
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-tray-definition.html',
  styleUrls: ['./add-edit-tray-definition.scss']
})
export class AddEditTrayDefinition implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly trayDefinitionService = inject(TrayDefinitionService);
  private readonly trayScanService = inject(TrayScanService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly el = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: TrayDto | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `add-edit-tray-${AddEditTrayDefinition.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  form!: FormGroup;
  protected readonly panelTitle = computed(() =>
    this.mode === 'add' ? 'Add New Tray Details' : 'Edit Tray Details'
  );

  // Signals
  protected readonly trayStatusOptions = signal<TrayStatusLovDto[]>([]);
  protected readonly isLoadingOptions = signal<boolean>(true);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly lastModified = signal<string>('');
  protected readonly isFormValid = signal<boolean>(false);
  protected readonly trayNumberScanHint = signal<string>('');
  private _scanInProgress = false;

  // Display-only values for edit mode
  protected readonly displayTrayNumber = signal<string>('');
  protected readonly displayDescription = signal<string>('');
  protected readonly displayProduct = signal<string>('');
  protected readonly displayEffectiveDate = signal<string>('');

  // Original values for dirty check in edit mode
  private originalEditValues: { itemCount: number; trayStatus: string; terminationDate: string | null } | null = null;

  /**
   * Updates isFormValid signal based on form state and mode.
   * - Add mode: enabled when form is valid
   * - Edit mode: enabled when form is dirty (modified) AND valid
   */
  private updateFormValidState(): void {
    if (this.mode === 'add') {
      this.isFormValid.set(this.form?.valid ?? false);
    } else {
      this.isFormValid.set(this.hasChanges() && (this.form?.valid ?? false));
    }
  }

  // Track which date field was last changed for error display
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  // Min dates for date pickers using chapter timezone
  minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
  protected minTerminationDate = signal<moment.Moment | null>(null);

  // Error state matchers for cross-field validation
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.initForm();
    this.loadTrayStatusOptions();
    this.setupDateValidationListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (this.form) {
        this.updateFormForMode();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      trayNumber: ['', [Validators.required, Validators.maxLength(4), this.trayNumberValidator()]],
      trayDescription: ['', [Validators.required, Validators.maxLength(30)]],
      itemCount: [0, [this.itemCountValidator()]],
      trayStatus: ['IN', [Validators.required, Validators.maxLength(2)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Setup validators based on mode
    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    }

    // Subscribe to form status changes to update isFormValid signal
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFormValidState();
      });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFormValidState();
      });

    this.updateFormForMode();
  }

  private updateFormForMode(): void {
    if (this.mode === 'edit' && this.data) {
      // Set display values
      this.displayTrayNumber.set(this.data.trayNumber || '');
      this.displayDescription.set(this.data.trayDescription || '');
      this.displayProduct.set(this.data.productType || 'N/A');
      this.displayEffectiveDate.set(DateFieldValidationUtility.formatDateForUI(this.data.effectiveDate)?.toUpperCase() || '');

      // Set last modified timestamp
      if (this.data.lastModifiedDate) {
        const formattedDate = DateFieldValidationUtility.formatDateTimeForUI(this.data.lastModifiedDate);
        const timezone = this.headerService.getCurrentChapterTimezone() || 'PST';
        this.lastModified.set(`Last Modified: ${formattedDate} ${timezone}`);
      }

      // Populate editable fields
      this.form.patchValue({
        trayNumber: this.data.trayNumber || '',
        trayDescription: this.data.trayDescription || '',
        itemCount: this.data.itemCount || 0,
        trayStatus: this.data.trayStatus || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      }, { emitEvent: false });

      // In edit mode, set min termination date to the later of effective date or chapter date
      const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
      const effectiveDate = this.data.effectiveDate ? moment(this.data.effectiveDate).startOf('day') : null;

      if (effectiveDate && effectiveDate.isAfter(chapterDate)) {
        this.minTerminationDate.set(effectiveDate);
      } else {
        this.minTerminationDate.set(chapterDate);
      }

      // Disable fields that shouldn't be edited
      this.form.get('trayNumber')?.disable();
      this.form.get('trayDescription')?.disable();
      this.form.get('effectiveDate')?.disable();

      // Store original values for dirty check
      this.originalEditValues = {
        itemCount: this.data.itemCount || 0,
        trayStatus: this.data.trayStatus || '',
        terminationDate: this.data.termDate ? moment(this.data.termDate).format('YYYY-MM-DD') : null
      };

      // Setup edit mode validators
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    } else {
      // Add mode - reset form
      this.form.reset({
        trayNumber: '',
        trayDescription: '',
        itemCount: 0,
        trayStatus: 'IN',
        effectiveDate: null,
        terminationDate: null
      }, { emitEvent: false });
      this.trayNumberScanHint.set('');

      // Enable all fields
      this.form.get('trayNumber')?.enable();
      this.form.get('trayDescription')?.enable();
      this.form.get('effectiveDate')?.enable();

      // Setup add mode validators
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    // Update form valid state signal
    this.updateFormValidState();
  }

  private setupDateValidationListeners(): void {
    // Track which date field was last changed
    this.form.get('effectiveDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((effectiveDate) => {
        this.lastChangedDateField = 'effective';
        if (effectiveDate) {
          this.minTerminationDate.set(moment(effectiveDate).startOf('day'));
        } else {
          this.minTerminationDate.set(null);
        }
        // Revalidate termination date - use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private loadTrayStatusOptions(): void {
    this.trayDefinitionService.getTrayStatusLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.trayStatusOptions.set(options);
          this.isLoadingOptions.set(false);
        },
        error: (error) => {
          console.error('Error loading tray status options:', error);
          this.snackbarService.showError('Failed to load status options. Please try again.');
          this.isLoadingOptions.set(false);
        }
      });
  }

  get f() {
    return this.form.controls;
  }

  // Error message methods using DateFieldValidationUtility
  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  onTrayNumberBlur(event: FocusEvent): void {
    const raw = (this.form.get('trayNumber')?.value || '').trim();
    // On blur, call the API for any > 4 char value (e.g. user clicked away without Enter/Tab).
    // Guard with _scanInProgress to avoid double-call when Tab triggers both keydown and blur.
    if (raw.length > 4 && !this._scanInProgress) {
      this.processTrayNumberScan();
    }
  }

  onTrayNumberEnter(event: Event): void {
    event.preventDefault();
    this.processTrayNumberScan();
  }

  onTrayNumberTab(event: Event): void {
    this.processTrayNumberScan();
  }

  onTrayNumberInput(): void {
    this.trayNumberScanHint.set('');
  }

  private processTrayNumberScan(): void {
    const raw = (this.form.get('trayNumber')?.value || '').trim();

    // 1–4 chars = manual entry — no API call
    if (!raw || raw.length <= 4) return;
    // Prevent double-call (Tab keydown + blur fire in sequence)
    if (this._scanInProgress) return;

    this._scanInProgress = true;

    this.trayScanService.validateTrayScan(raw).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this._scanInProgress = false;
        if (!response.success) {
          const fieldMsg = response.message || 'Invalid tray scan format';
          const snackMsg = response.errorCode ? `${response.errorCode}: ${fieldMsg}` : fieldMsg;
          this.snackbarService.showError(snackMsg);
          this.trayNumberScanHint.set('');
          return;
        }
        const trayNumber = response.item?.trayNumber;
        if (trayNumber) {
          this.form.get('trayNumber')?.setValue(trayNumber);
          this.form.get('trayNumber')?.markAsTouched();
          this.trayNumberScanHint.set('Tray number is valid');
        } else {
          // 'M' = manual entry mode — clear so user types the 4-digit value
          this.form.get('trayNumber')?.setValue('');
          this.trayNumberScanHint.set('');
        }
      },
      error: (err) => {
        this._scanInProgress = false;
        const errBody = err?.error;
        const errMsg = errBody?.errorCode
          ? `${errBody.errorCode}: ${errBody.message || errBody.error}`
          : (errBody?.message || err?.message || 'Invalid tray scan format');
        this.snackbarService.showError(errMsg);
        this.form.get('trayNumber')?.setErrors({ invalidScan: errMsg });
        this.form.get('trayNumber')?.markAsTouched();
        this.trayNumberScanHint.set('');
      }
    });
  }

  onSave(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.mode === 'add') {
      this.createTray();
    } else {
      this.updateTray();
    }
  }

  onSaveAndCreateAnother(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    this.createTray(true);
  }

  private createTray(createAnother: boolean = false): void {
    const formValue = this.form.getRawValue();

    const payload: CreateTrayRequestDto = {
      trayNumber: formValue.trayNumber?.trim() || '',
      trayDescription: formValue.trayDescription?.trim() || '',
      itemCount: formValue.itemCount || 0,
      trayStatus: formValue.trayStatus || '',
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.isSaving.set(true);
    this.trayDefinitionService.createTray(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('New Tray details have been saved.');
          this.isSaving.set(false);

          if (createAnother) {
            // Reset form for another entry
            this.form.reset({
              trayNumber: '',
              trayDescription: '',
              itemCount: 0,
              trayStatus: '',
              effectiveDate: null,
              terminationDate: null
            });
            this.trayNumberScanHint.set('');
            this.submitted.set(false);
            this.saveSuccess.emit();
          } else {
            this.saveSuccess.emit();
            this.onClose();
          }
        },
        error: (error) => {
          this.handleError(error);
          this.isSaving.set(false);
        }
      });
  }

  private updateTray(): void {
    // Check if any changes were made
    if (!this.hasChanges()) {
      this.onClose();
      return;
    }

    const formValue = this.form.getRawValue();
    const chapterId = this.data?.chapterId || this.headerService.getCurrentChapterId();
    const trayNumber = this.data?.trayNumber || '';

    const payload: UpdateTrayRequestDto = {
      trayDescription: this.data?.trayDescription || '',
      itemCount: formValue.itemCount || 0,
      trayStatus: formValue.trayStatus || '',
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(this.data?.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.isSaving.set(true);
    this.trayDefinitionService.updateTray(chapterId, trayNumber, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Tray details have been updated.');
          this.isSaving.set(false);
          this.saveSuccess.emit();
          this.onClose();
        },
        error: (error) => {
          this.handleError(error);
          this.isSaving.set(false);
        }
      });
  }

  private hasChanges(): boolean {
    if (!this.originalEditValues) return true;

    const formValue = this.form.getRawValue();
    const currentTermDate = formValue.terminationDate
      ? moment(formValue.terminationDate).format('YYYY-MM-DD')
      : null;

    return (
      formValue.itemCount !== this.originalEditValues.itemCount ||
      formValue.trayStatus !== this.originalEditValues.trayStatus ||
      currentTermDate !== this.originalEditValues.terminationDate
    );
  }

  onClearAll(): void {
    if (this.mode === 'edit' && this.data) {
      // Reset to original values
      this.form.patchValue({
        itemCount: this.data.itemCount || 0,
        trayStatus: this.data.trayStatus || '',
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });
    } else {
      // Add mode - reset to defaults
      this.form.reset({
        trayNumber: '',
        trayDescription: '',
        itemCount: 0,
        trayStatus: 'IN',
        effectiveDate: null,
        terminationDate: null
      });
    }
    this.submitted.set(false);
    this.updateFormValidState();
  }

  onClose(): void {
    this.closePanel.emit();
  }

  // Positive number-only input handler (blocks minus sign and non-numeric, max 4 digits)
  onlyPositiveNumbers(event: KeyboardEvent): boolean {
    const key = event.key;

    // Allow: digits 0-9
    if (/^[0-9]$/.test(key)) {
      const input = event.target as HTMLInputElement | null;
      // Block if already at 4 digits (unless selecting text or no input element)
      if (input && input.value && input.value.length >= 4 && input.selectionStart === input.selectionEnd) {
        event.preventDefault();
        return false;
      }
      return true;
    }
    // Block everything else including minus sign
    event.preventDefault();
    return false;
  }

  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Only allow positive numbers, max 4 digits
    const numericOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 4);
    document.execCommand('insertText', false, numericOnly);
  }

  // Limit Item/Count to 4 digits
  onItemCountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    if (input.value !== value) {
      input.value = value;
      this.form.get('itemCount')?.setValue(value ? parseInt(value, 10) : 0);
    }
  }

  // Alphanumeric only input handler (blocks special characters)
  onlyAlphanumeric(event: KeyboardEvent): boolean {
    const key = event.key;
    // Allow: alphanumeric characters only
    if (/^[a-zA-Z0-9]$/.test(key)) {
      return true;
    }
    // Block special characters
    event.preventDefault();
    return false;
  }

  // Alphanumeric with spaces input handler (for Description field)
  onlyAlphanumericWithSpaces(event: KeyboardEvent): boolean {
    const key = event.key;
    // Allow: alphanumeric characters and spaces
    if (/^[a-zA-Z0-9 ]$/.test(key)) {
      return true;
    }
    // Block special characters
    event.preventDefault();
    return false;
  }

  onPasteAlphanumeric(event: ClipboardEvent, field: 'trayNumber' | 'trayDescription'): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // For trayNumber: only alphanumeric, for description: alphanumeric + spaces
    const pattern = field === 'trayNumber' ? /[^a-zA-Z0-9]/g : /[^a-zA-Z0-9 ]/g;
    const cleanedText = pastedText.replace(pattern, '');
    document.execCommand('insertText', false, cleanedText);
  }

  private focusFirstInvalidField(): void {
    const firstInvalid = this.el.nativeElement.querySelector(
      'input.ng-invalid, mat-select.ng-invalid, textarea.ng-invalid'
    ) as HTMLElement | null;
    if (firstInvalid) {
      setTimeout(() => firstInvalid.focus(), 50);
    }
  }

  private handleError(error: any): void {
    let errorMessage = 'An error occurred. Please try again.';
    let errorCode = '';

    if (error.errorCode) {
      errorCode = error.errorCode;
      switch (error.errorCode) {
        case '0319':
          errorMessage = 'Tray number already exists. Please use a different tray number.';
          break;
        case '0365':
          errorMessage = 'Invalid tray status code. Please select a valid status.';
          break;
        case '0500':
        case '4503':
          errorMessage = 'Termination Date must be on or after Effective Date.';
          break;
        case '0501':
          errorMessage = 'Effective Date cannot be in the past.';
          break;
        case '0600':
          errorMessage = 'Failed to save changes.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Show error with code prefix if available
    const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
    this.snackbarService.showError(displayMessage);
  }

  // Custom validators
  private trayNumberValidator() {
    return (control: any) => {
      if (!control.value) return null;
      const value = control.value.toString().trim();
      // Allow D[XXXX]D barcode format while scan API resolves; blur handler replaces it
      if (/^[Dd][A-Za-z0-9]{4}[Dd]$/.test(value)) return null;
      if (value.length > 4) return { trayNumberMaxLength: true };
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(value)) return { trayNumberInvalid: true };
      return null;
    };
  }

  private itemCountValidator() {
    return (control: any) => {
      if (control.value === null || control.value === undefined || control.value === '') return null;
      const value = parseInt(control.value, 10);
      if (isNaN(value)) return { itemCountInvalid: true };
      if (value < 0) return { itemCountMin: true };
      if (value > 9999) return { itemCountMax: true };
      return null;
    };
  }
}
