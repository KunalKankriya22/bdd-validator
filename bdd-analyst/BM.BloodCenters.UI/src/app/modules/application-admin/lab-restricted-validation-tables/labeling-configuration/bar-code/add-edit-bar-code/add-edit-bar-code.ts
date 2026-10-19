import { Component, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { BarCodeService } from '../services/bar-code.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  BarCodeModel,
  BarCodeCreateDto,
  BarCodeUpdateDto,
  LookupItem
} from '../models/bar-code.model';

export interface BarCodeFormData {
  barcodeValue: string;
  testId: string;
  resultCode: string;
  effDate: Date | null;
  termDate: Date | null;
}

@Component({
  selector: 'app-add-edit-bar-code',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-bar-code.html',
  styleUrls: ['./add-edit-bar-code.scss']
})
export class AddEditBarCode implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: BarCodeModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();
  @ViewChild('closeBtn', { read: ElementRef }) closeBtnRef!: ElementRef<HTMLButtonElement>;

  public focus(): void {
    setTimeout(() => this.closeBtnRef?.nativeElement?.focus(), 50);
  }

  form: FormGroup;
  panelTitle: string = '';
  lastModified: string = '';

  editModeValues: {
    barcodeValue: string;
    barcodeDesc: string;
    testId: string;
    resultCode: string;
    resultDisplay: string;
    effectiveDate: string;
  } = {
    barcodeValue: '',
    barcodeDesc: '',
    testId: '',
    resultCode: '',
    resultDisplay: '',
    effectiveDate: ''
  };

  allBarcodeOptions: { value: string; display: string; description: string }[] = [];
  barcodeOptions: { value: string; display: string; description: string }[] = [];
  barcodeSearchControl = new FormControl('');
  allTestIdOptions: { value: string; display: string }[] = [];
  testIdOptions: { value: string; display: string }[] = [];
  testIdSearchControl = new FormControl('');
  resultCodeOptions: { value: string; display: string }[] = [
    { value: 'N', display: 'Negative' },
    { value: 'P', display: 'Positive' }
  ];

  isLoadingBarcodes = false;
  isLoadingOptions = false;
  isSaving = false;
  savingAction: 'save' | 'saveAndCreate' | null = null;
  currentChapterId: string = '';
  minDate = DateFieldValidationUtility.getMinDate();
  terminationMinDate = DateFieldValidationUtility.getMinDate();

  // Error state matchers for cross-field date validation display
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private barCodeService: BarCodeService,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      barcodeValue: ['', Validators.required],
      testId: ['', Validators.required],
      resultCode: ['', Validators.required],
      effDate: [null],
      termDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')] });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadBarcodeLookups();
    this.loadTestIdLookups();
    this.setupBarcodeSearch();
    this.setupTestIdSearch();
    this.setupFormSubscriptions();
    this.currentChapterId = this.headerService.chapterId();
  }

  private setupFormSubscriptions(): void {
    // When barcodeValue changes, update description display
    this.form.get('barcodeValue')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        const match = this.allBarcodeOptions.find(opt => opt.value === value);
        this.selectedBarcodeDesc = match?.description || '';
      });

    // Track effective date changes for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        const termControl = this.form.get('termDate');
        const hadInvalidDate = termControl?.hasError('invalidDate');
        this.updateTerminationMinDate();
        if (hadInvalidDate && !termControl?.value) {
          setTimeout(() => termControl?.setErrors({ invalidDate: true }));
        }
      });

    // Track termination date changes for cross-field error display
    // distinctUntilChanged prevents spurious valueChanges emissions from
    // MatDatepicker's _validatorOnChange (triggered when [min] binding updates)
    // from overwriting lastChangedDateField when only validity — not value — changed.
    this.form.get('termDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  selectedBarcodeDesc = '';


  private loadBarcodeLookups(): void {
    this.isLoadingBarcodes = true;

    this.barCodeService.getBarcodeLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: LookupItem[]) => {
          this.allBarcodeOptions = lookups.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code,
            description: item.description || ''
          }));
          this.barcodeOptions = [...this.allBarcodeOptions];
          this.isLoadingBarcodes = false;
        },
        error: (error) => {
          console.error('Error loading barcode lookups:', error);
          this.isLoadingBarcodes = false;
          this.snackBar.open(
            'Failed to load Bar Code options. Please refresh and try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  private loadTestIdLookups(): void {
    this.isLoadingOptions = true;

    this.barCodeService.getTestIdLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: LookupItem[]) => {
          this.allTestIdOptions = lookups.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.testIdOptions = [...this.allTestIdOptions];

          // In edit mode, re-apply testId after options load so mat-select displays it
          if (this.mode === 'edit' && this.data) {
            this.form.patchValue({
              testId: this.data.testId || ''
            }, { emitEvent: false });
          }

          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading test ID lookups:', error);
          this.allTestIdOptions = [];
          this.testIdOptions = [];
          this.isLoadingOptions = false;
          this.snackBar.open(
            'Failed to load Test ID options. Please refresh and try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  private setupBarcodeSearch(): void {
    this.barcodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.barcodeOptions = this.allBarcodeOptions.filter(o =>
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.barcodeOptions = [...this.allBarcodeOptions];
        }
      });
  }

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.testIdOptions = this.allTestIdOptions.filter(o =>
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.testIdOptions = [...this.allTestIdOptions];
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
        this.setupPanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Bar Code';
      this.lastModified = '';
      // Setup date validators with chapter offset
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      this.panelTitle = 'Edit Bar Code Configuration';
      this.lastModified = this.data?.insertDate
        ? 'Last Modified: ' + DateFieldValidationUtility.formatDateForUI(moment(this.data.insertDate))?.toUpperCase()
        : '';
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      barcodeValue: '',
      barcodeDesc: '',
      testId: '',
      resultCode: '',
      resultDisplay: '',
      effectiveDate: ''
    };

    this.selectedBarcodeDesc = '';
    this.resultCodeOptions = [
      { value: 'N', display: 'Negative' },
      { value: 'P', display: 'Positive' }
    ];

    this.form.reset();
    this.terminationMinDate = this.minDate;
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable all fields in add mode
    this.form.get('barcodeValue')?.enable();
    this.form.get('testId')?.enable();
    this.form.get('resultCode')?.enable();
    this.form.get('effDate')?.enable();

    // Restore required validators for add mode
    this.form.get('barcodeValue')?.setValidators([Validators.required]);
    this.form.get('testId')?.setValidators([Validators.required]);
    this.form.get('resultCode')?.setValidators([Validators.required]);

    // Use shared utility to setup date field validators for Add mode
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);


    // Update validity
    this.form.get('barcodeValue')?.updateValueAndValidity();
    this.form.get('testId')?.updateValueAndValidity();
    this.form.get('resultCode')?.updateValueAndValidity();
  }

  private formatResultDisplay(code: string): string {
    switch (code.toUpperCase()) {
      case 'N': return 'Negative';
      case 'P': return 'Positive';
      default: return code;
    }
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment.utc(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const barcodeValue = this.data.barcodeValue || '';
      const testId = this.data.testId || '';
      const resultCode = this.data.resultCode || '';

      // Display values for read-only cards (PK fields)
      this.editModeValues = {
        barcodeValue,
        barcodeDesc: this.data.barcodeDesc || '',
        testId,
        resultCode,
        resultDisplay: this.formatResultDisplay(resultCode),
        effectiveDate: this.data.effDate ? this.formatDateForDisplay(this.data.effDate) : ''
      };

      this.form.patchValue({
        barcodeValue,
        testId,
        resultCode,
        effDate: this.data.effDate ? moment(moment.utc(this.data.effDate).format('YYYY-MM-DD')) : null,
        termDate: this.data.termDate ? moment(moment.utc(this.data.termDate).format('YYYY-MM-DD')) : null
      });

      this.updateTerminationMinDate();

      // Disable PK fields (barcodeValue, testId, resultCode) and effective date in edit mode
      // Only termDate remains editable
      this.form.get('barcodeValue')?.disable();
      this.form.get('testId')?.disable();
      this.form.get('resultCode')?.disable();
      this.form.get('effDate')?.disable();

      // Mark form as pristine after populating to disable save button until user makes changes
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  private updateTerminationMinDate(): void {
    const effDateValue = this.form.get('effDate')?.value;
    let newMin = this.minDate;
    if (effDateValue) {
      const effMoment = moment(effDateValue);
      if (effMoment.isValid() && effMoment.isSameOrAfter(this.minDate, 'day')) {
        newMin = effMoment;
      }
    }
    if (!this.terminationMinDate.isSame(newMin, 'day')) {
      this.terminationMinDate = newMin;
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
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;
    this.savingAction = 'save';

    if (this.mode === 'add') {
      const addPayload: BarCodeCreateDto = {
        barcodeValue: formValue.barcodeValue?.trim() || '',
        testId: formValue.testId?.trim() || '',
        resultCode: formValue.resultCode?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        loggedInUserName: this.loginService.getStoredUsername()
      };

      this.barCodeService.createBarCode(addPayload)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; this.savingAction = null; })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Barcode configuration added successfully';
            this.snackBar.open(message, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
              duration: 3000
            });

            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => this.handleSaveError(error)
        });
    } else {
      // For Bar Code, PK fields (testId, resultCode) are not editable in edit mode
      // URL uses original PK values to identify the record
      const updatePayload: BarCodeUpdateDto = {
        testId: this.editModeValues.testId,
        resultCode: this.editModeValues.resultCode,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };

      // Use original PK values in URL to identify the record
      this.barCodeService.updateBarCode(
        this.editModeValues.barcodeValue,
        this.editModeValues.testId,
        this.editModeValues.resultCode,
        updatePayload
      )
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; this.savingAction = null; })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Barcode configuration updated successfully';
            this.snackBar.open(message, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
              duration: 3000
            });

            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => this.handleSaveError(error)
        });
    }
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;
    this.savingAction = 'saveAndCreate';

    if (this.mode === 'add') {
      const addPayload: BarCodeCreateDto = {
        barcodeValue: formValue.barcodeValue?.trim() || '',
        testId: formValue.testId?.trim() || '',
        resultCode: formValue.resultCode?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        loggedInUserName: this.loginService.getStoredUsername()
      };

      this.barCodeService.createBarCode(addPayload)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; this.savingAction = null; })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Operation completed successfully';
            this.snackBar.open(message, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
              duration: 3000
            });

            this.saveSuccess.emit();

            if (this.mode === 'edit') {
              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            } else {
              this.resetFormForAddMode();
            }
          },
          error: (error) => this.handleSaveError(error)
        });
    } else {
      // For Bar Code, when PK fields (testId, resultCode) are edited,
      // the URL should use the NEW values, not the original values
      const updatePayload: BarCodeUpdateDto = {
        testId: formValue.testId?.trim() || '',
        resultCode: formValue.resultCode?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };

      // Use barcode (original PK) and new testId/resultCode values in URL
      this.barCodeService.updateBarCode(
        this.editModeValues.barcodeValue,
        formValue.testId?.trim() || '',
        formValue.resultCode?.trim() || '',
        updatePayload
      )
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; this.savingAction = null; })
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || 'Operation completed successfully';
            this.snackBar.open(message, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
              duration: 3000
            });

            this.saveSuccess.emit();

            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          },
          error: (error) => this.handleSaveError(error)
        });
    }
  }

  private handleSaveError(error: any): void {
    console.error('Error saving barcode configuration:', error);
    this.snackBar.open(
      error?.error?.message || 'Save failed. Please try again.',
      'DISMISS',
      { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
    );
  }

  formatDateTime(date: string | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PST]');
    }
  }

  get barcodeValueControl() {
    return this.form.get('barcodeValue');
  }

  get testIdControl() {
    return this.form.get('testId');
  }

  get resultCodeControl() {
    return this.form.get('resultCode');
  }

  get effDateControl() {
    return this.form.get('effDate');
  }

  get termDateControl() {
    return this.form.get('termDate');
  }

  getBarcodeValueError(): string {
    const control = this.barcodeValueControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Bar Code is required';
    return '';
  }

  getTestIdError(): string {
    const control = this.testIdControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Test ID is required';
    return '';
  }

  getResultCodeError(): string {
    const control = this.resultCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Result Code is required';
    return '';
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get isSaveEnabled(): boolean {
    // In add mode: form must be valid
    // In edit mode: form must be valid AND dirty (changed)
    if (this.mode === 'add') {
      return this.form.valid;
    } else {
      return this.form.valid && this.form.dirty;
    }
  }
}
