import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DonorDecisionCodesService } from '../services/donor-decision-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from 'src/app/core/constants/timezone.constants';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { DonorDecisionCodeDto, UpdateDonorDecisionCodeDto, DonorDecisionCodeModel, DonorDecisionCodeOption } from '../models/donor-decision-codes.model';

export interface DonorDecisionCodeFormData {
  barCodeValue: string;
  donorDecisionCode: string;
  displayCode: string;
  effDate: Date;
  termDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-donor-decision-code',
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
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-donor-decision-code.html',
  styleUrls: ['./add-edit-donor-decision-code.scss']
})

export class AddEditDonorDecisionCode implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DonorDecisionCodeModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<DonorDecisionCodeFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    barCodeValue: string;
    donorDecisionCode: string;
    displayCode: string;
  } = {
      barCodeValue: '',
      donorDecisionCode: '',
      displayCode: ''
    };

  readonly donorDecisionCodeOptions = signal<DonorDecisionCodeOption[]>([]);
  readonly donorDecisionCodeSearchControl = new FormControl('');
  readonly donorDecisionCodeSearch = signal('');

  readonly filteredDonorDecisionCodes = computed(() => {
    const search = this.donorDecisionCodeSearch().toLowerCase();
    const options = this.donorDecisionCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      o.donorDecisionCode.toLowerCase().includes(search) ||
      (o.description && o.description.toLowerCase().includes(search))
    );
  });

  minDate = DateFieldValidationUtility.getMinDate();
  minTerminationDate: moment.Moment | null = null;

  loadingDonorDecisionCodes = false;
  isSaving = false;
  isEffectiveDateEditable = false;

  // Date raw input tracking
  effDateRawInput = '';
  termDateRawInput = '';

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private donorDecisionCodesService: DonorDecisionCodesService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      barcode: [null, [Validators.required]],
      donorDecisionCode: ['', [Validators.required]],
      description: [''],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Setup search control subscription
    this.donorDecisionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donorDecisionCodeSearch.set(value || ''));

    // Reactively update date validators and minDate when chapter timezone changes
    effect(() => {
      const tz = this.headerService.chapterTimeZone();
      this.minDate = DateFieldValidationUtility.getMinDate(tz);

      if (this.mode === 'add') {
        DateFieldValidationUtility.setupAddModeValidators(this.form, tz);
      } else {
        DateFieldValidationUtility.setupEditModeValidators(this.form);
        if (this.isEffectiveDateEditable) {
          const effControl = this.form.get('effectiveDate');
          if (effControl) {
            effControl.enable();
            effControl.setValidators([
              Validators.required,
              DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
            ]);
            effControl.updateValueAndValidity({ emitEvent: false });
          }
        }
      }

      this.updateMinTerminationDate(this.form.get('effectiveDate')?.value);
      this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDataFromAPI();
    this.setupDateChangeTracking();
    this.setupDonorDecisionCodeChangeListener();
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
    // Reset raw input tracking
    this.effDateRawInput = '';
    this.termDateRawInput = '';

    if (this.mode === 'add') {
      this.panelTitle = 'Add Donor Decision Code';
      this.lastUpdated = '';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

      // Set initial minTerminationDate for ADD mode
      this.minTerminationDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    } else {
      this.panelTitle = 'Edit Donor Decision Code';

      const dateToDisplay = this.data?.lastModifiedDate || new Date();
      this.lastUpdated = this.formatLastModified(dateToDisplay);

      // Determine if the effective date is in the future (editable)
      const chapterToday = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
      if (this.data?.effDate) {
        const effDate = moment(this.data.effDate).startOf('day');
        this.isEffectiveDateEditable = effDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD');
      } else {
        this.isEffectiveDateEditable = false;
      }

      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form);

      // For future effective dates, keep the effective date control enabled with validators
      if (this.isEffectiveDateEditable) {
        const effControl = this.form.get('effectiveDate');
        if (effControl) {
          effControl.enable();
          effControl.addValidators(
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
          );
          effControl.updateValueAndValidity({ emitEvent: false });
        }
      }

      // Add past date validator for termination date in edit mode
      const terminationDateControl = this.form.get('terminationDate');
      if (terminationDateControl) {
        terminationDateControl.addValidators(
          DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
        );
        terminationDateControl.updateValueAndValidity({ emitEvent: false });
      }

      // Set minTerminationDate for edit mode: max(chapter's today, effective date)
      if (this.data && this.data.effDate) {
        const effDate = moment(this.data.effDate).startOf('day');
        this.minTerminationDate = effDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')
          ? effDate : chapterToday.clone();
      }
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      barCodeValue: '',
      donorDecisionCode: '',
      displayCode: ''
    };

    // Reset raw input tracking
    this.effDateRawInput = '';
    this.termDateRawInput = '';
    this.isEffectiveDateEditable = false;

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('barcode')?.enable();
    this.form.get('donorDecisionCode')?.enable();
    this.form.get('description')?.disable();

    // Reset minTerminationDate for add mode
    this.minTerminationDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  private populateFormForEdit(): void {
    if (this.data) {

      this.editModeValues = {
        barCodeValue: this.data.barCodeValue || '',
        donorDecisionCode: this.data.donorDecisionCode || '',
        displayCode: this.data.displayCode || ''
      };

      this.form.get('barcode')?.disable();

      this.form.patchValue({
        barcode: this.data.barCodeValue || '',
        donorDecisionCode: this.data.donorDecisionCode || '',
        description: this.data.displayCode || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });
    }
  }

  private loadDataFromAPI(): void {
    this.loadingDonorDecisionCodes = true;

    // Load donor decision codes
    this.donorDecisionCodesService.getDonorDecisionCodeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.donorDecisionCodeOptions.set(codes);
          this.loadingDonorDecisionCodes = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading donor decision codes:', err);
          this.donorDecisionCodeOptions.set([]);
          this.loadingDonorDecisionCodes = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupDonorDecisionCodeChangeListener(): void {
    this.form.get('donorDecisionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCode => {
        if (selectedCode) {
          this.fetchDonorDecisionCodeDescription(selectedCode);
        } else {
          this.form.patchValue({ description: '' });
          this.editModeValues.displayCode = '';
        }
      });
  }

  private fetchDonorDecisionCodeDescription(code: string): void {
    const selectedCode = this.donorDecisionCodeOptions().find(c => c.donorDecisionCode === code);
    if (selectedCode) {
      this.form.patchValue({ description: selectedCode.description || '' });
      this.editModeValues.displayCode = selectedCode.description || '';
    } else {
      // Fallback: fetch from API
      this.donorDecisionCodesService.getDonorDecisionCodeByCode(code)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.form.patchValue({ description: response.description || '' });
            this.editModeValues.displayCode = response.description || '';
          },
          error: (err) => {
            console.error('Error fetching donor decision code description:', err);
            this.form.patchValue({ description: '' });
            this.editModeValues.displayCode = '';
          }
        });
    }
  }

  /**
   * Track which date field was last changed for cross-field error display
   * and update minTerminationDate based on effective date
   */
  private setupDateChangeTracking(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.lastChangedDateField = 'effective';
        this.updateMinTerminationDate(value);
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  /**
   * Update minimum termination date based on effective date and mode
   */
  private updateMinTerminationDate(effectiveDate: Moment | null): void {
    const chapterToday = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    if (this.mode === 'add') {
      // ADD mode: Termination date must be >= effective date and >= chapter's today
      if (effectiveDate && moment.isMoment(effectiveDate) && effectiveDate.isValid() &&
          effectiveDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')) {
        this.minTerminationDate = effectiveDate.clone().startOf('day');
      } else {
        this.minTerminationDate = chapterToday.clone();
      }
    } else {
      // EDIT mode: Termination date must be >= max(chapter's today, effective date)
      if (effectiveDate && moment.isMoment(effectiveDate) && effectiveDate.isValid()) {
        const effDate = effectiveDate.clone().startOf('day');
        this.minTerminationDate = effDate.format('YYYY-MM-DD') > chapterToday.format('YYYY-MM-DD')
          ? effDate : chapterToday.clone();
      } else {
        this.minTerminationDate = chapterToday.clone();
      }
    }

    // Re-validate termination date when effective date changes
    this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const effectiveDate = formValue.effectiveDate as Moment;
    const terminationDate = formValue.terminationDate as Moment;

    if (!effectiveDate || !effectiveDate.isValid()) {
      return;
    }

    if (terminationDate && !terminationDate.isValid()) {
      return;
    }

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const dto: DonorDecisionCodeDto = {
        barCodeValue: formValue.barcode || '',
        donorDecisionCode: formValue.donorDecisionCode || '',
        effDate: effectiveDate.format('YYYY-MM-DD'),
        termDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.donorDecisionCodesService.addDonorDecisionCode(dto);
    } else {
      const updateDto: UpdateDonorDecisionCodeDto = {
        donorDecisionCode: formValue.donorDecisionCode || '',
        originalDonorDecisionCode: this.editModeValues.donorDecisionCode || '',
        effDate: effectiveDate.format('YYYY-MM-DD'),
        termDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.donorDecisionCodesService.updateDonorDecisionCode(this.editModeValues.barCodeValue || '', updateDto);
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
          if (response.success) {
            const code = formValue.donorDecisionCode || this.editModeValues.donorDecisionCode || '';
            const description = formValue.description || this.editModeValues.displayCode || '';
            const message = `Donor decision code '${code} - ${description}' saved successfully`;

            this.snackBar.open(message, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            const result: DonorDecisionCodeFormData = {
              barCodeValue: formValue.barcode || '',
              donorDecisionCode: formValue.donorDecisionCode || '',
              displayCode: formValue.description || '',
              effDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : '',
              termDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
            };

            this.saveSuccess.emit(result);
            this.closePanel.emit();
          } else {
          }
        },
        error: (error) => {
          console.error('Error saving donor decision code:', error);
          // Error is handled globally by authInterceptor
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const effectiveDate = formValue.effectiveDate as Moment;
    const terminationDate = formValue.terminationDate as Moment;

    if (!effectiveDate || !effectiveDate.isValid()) {
      return;
    }

    if (terminationDate && !terminationDate.isValid()) {
      return;
    }

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const dto: DonorDecisionCodeDto = {
        barCodeValue: formValue.barcode || '',
        donorDecisionCode: formValue.donorDecisionCode || '',
        effDate: effectiveDate.format('YYYY-MM-DD'),
        termDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.donorDecisionCodesService.addDonorDecisionCode(dto);
    } else {
      const updateDto: UpdateDonorDecisionCodeDto = {
        donorDecisionCode: formValue.donorDecisionCode || '',
        originalDonorDecisionCode: this.editModeValues.donorDecisionCode || '',
        effDate: effectiveDate.format('YYYY-MM-DD'),
        termDate: terminationDate ? terminationDate.format('YYYY-MM-DD') : null
      };
      apiCall = this.donorDecisionCodesService.updateDonorDecisionCode(this.editModeValues.barCodeValue || '', updateDto);
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
          if (response.success) {
            const code = formValue.donorDecisionCode || this.editModeValues.donorDecisionCode || '';
            const description = formValue.description || this.editModeValues.displayCode || '';
            const message = `Donor decision code '${code} - ${description}' saved successfully`;

            this.snackBar.open(message, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            const result: DonorDecisionCodeFormData = {
              barCodeValue: formValue.barcode || '',
              donorDecisionCode: formValue.donorDecisionCode || '',
              displayCode: formValue.description || '',
              effDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : '',
              termDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
            };

            this.saveSuccess.emit(result);

            // Keep panel open and reset form for another add
            if (this.mode === 'edit') {
              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            } else {
              this.resetFormForAddMode();
            }
          } else {
          }
        },
        error: (error) => {
          console.error('Error saving donor decision code:', error);
          // Error is handled globally by authInterceptor
        }
      });
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  private formatLastModified(date: Date | string | null | undefined): string {
    if (!date) return '';

    const dateStr = typeof date === 'string' ? date : date.toISOString();
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!isoMatch) return '';

    const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = isoMatch;

    let timeZone = this.headerService.chapterTimeZone();
    if (!timeZone || !TIMEZONE_OFFSET_REGEX.test(timeZone)) {
      timeZone = '+00:00';
    }
    const displayLabel = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? `GMT${timeZone}`;

    const sign = timeZone[0] === '+' ? 1 : -1;
    const [tzHH, tzMM] = timeZone.slice(1).split(':').map(Number);
    const chapterNow = new Date(Date.now() + sign * (tzHH * 60 + tzMM) * 60000);
    const todayStr = `${chapterNow.getUTCFullYear()}-${String(chapterNow.getUTCMonth() + 1).padStart(2, '0')}-${String(chapterNow.getUTCDate()).padStart(2, '0')}`;

    const isToday = `${yearStr}-${monthStr}-${dayStr}` === todayStr;
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const datePart = isToday ? 'Today' : `${dayStr}-${MONTHS[parseInt(monthStr, 10) - 1]}-${yearStr}`;

    return `Last Modified: ${datePart}, ${hourStr}:${minuteStr} ${displayLabel}`;
  }

  get isFormValid(): boolean {
    return this.form.valid && !this.hasDateValidationError();
  }

  get isSaveEnabled(): boolean {
    if (this.mode === 'add') {
      return this.isFormValid;
    } else {
      // In edit mode, require both valid AND dirty (changed)
      return this.isFormValid && this.form.dirty;
    }
  }

  /**
   * Get formatted effective date for display in edit mode
   */
  getEffectiveDateDisplay(): string {
    if (!this.data?.effDate) return '-';
    return moment(this.data.effDate).format('DD-MMM-YYYY').toUpperCase();
  }


  onBarcodeKeydown(event: KeyboardEvent): void {
    // Prevent 'e', 'E', '+', '-', '.' characters in number input
    const invalidKeys = ['e', 'E', '+', '-', '.'];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onBarcodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-digit characters
    value = value.replace(/\D/g, '');

    // Limit to 5 digits
    if (value.length > 5) {
      value = value.slice(0, 5);
    }

    // Update the form control with the sanitized value
    if (value !== input.value) {
      this.form.patchValue({ barcode: value ? parseInt(value, 10) : null }, { emitEvent: false });
      input.value = value;
    }
  }

  getBarcodeError(): string {
    const control = this.form.get('barcode');
    if (control?.hasError('required') && control.touched) {
      return 'Barcode is required';
    }
    return '';
  }

  getDonorDecisionCodeError(): string {
    const control = this.form.get('donorDecisionCode');
    if (control?.hasError('required') && control.touched) {
      return 'Donor Decision Code is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form?.get('effectiveDate');
    if (!control) return '';

    if (this.effDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('required') && (control.dirty || control.touched)) {
      return 'Effective Date is required';
    }

    return DateFieldValidationUtility.getEffectiveDateErrorMessage(control, this.form.errors);
  }

  getTerminationDateError(): string {
    const control = this.form?.get('terminationDate');
    if (!control) return '';

    if (this.termDateRawInput && !control.value && control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be on or after Effective Date';
    }

    return DateFieldValidationUtility.getTerminationDateErrorMessage(control, this.form.errors);
  }

  /**
   * Handle date input changes (same pattern as add-edit-donation-procedure)
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
    const control = this.form.get(controlName);
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
}
