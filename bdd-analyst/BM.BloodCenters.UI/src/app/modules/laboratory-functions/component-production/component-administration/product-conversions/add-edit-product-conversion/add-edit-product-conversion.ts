import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ProductConversionsService } from '../services/product-conversions.service';
import {
  ProductConversionModel,
  ProductDropdownDto,
  CreateProductConversionDto,
  UpdateProductConversionDto,
} from '../models/product-conversions.model';

@Component({
  selector: 'app-add-edit-product-conversion',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-product-conversion.html',
  styleUrls: ['./add-edit-product-conversion.scss'],
})
export class AddEditProductConversion implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProductConversionModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  @ViewChild('effDateInput', { read: ElementRef }) effDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput', { read: ElementRef }) termDateInput!: ElementRef<HTMLInputElement>;

  form: FormGroup;
  panelTitle = '';
  lastModifiedDisplay = '';

  minDate!: Moment;
  minEffectiveDate: Moment | null = null;
  minTerminationDate: Moment | null = null;

  effectiveDateFilterFn!: (date: Moment | null) => boolean;
  terminationDateFilterFn!: (date: Moment | null) => boolean;

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  editModeValues = {
    sourceProductCode: '',
    sourceProductDesc: '',
    targetProductCode: '',
    targetProductDesc: '',
    effDate: '',
    termDate: '',
  };

  sourceProducts: ProductDropdownDto[] = [];
  targetProducts: ProductDropdownDto[] = [];
  sourceProductDescription = '--';
  targetProductDescription = '--';

  sourceSearchControl = new FormControl('');
  filteredSourceProducts: ProductDropdownDto[] = [];
  targetSearchControl = new FormControl('');
  filteredTargetProducts: ProductDropdownDto[] = [];

  isLoadingSourceProducts = false;
  isLoadingTargetProducts = false;
  isSaving = false;

  private selectedSchemeType = '';
  private originalEffectiveDate: string | null = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productConversionsService: ProductConversionsService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const chapterTimezone = this.headerService.chapterTimeZone();
      this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
      this.minEffectiveDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    });

    this.form = this.fb.group({
      sourceProductCode: ['', [Validators.required, Validators.maxLength(5)]],
      targetProductCode: ['', [Validators.required, Validators.maxLength(5)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.setupDateValidation();
    this.setupPanel();
    this.loadSourceProducts();
    this.setupSourceProductListener();
    this.setupSourceSearch();
    this.setupTargetSearch();
    this.setupDateValueChangeListeners();
    this.setupDateInputValidation();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
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
      this.panelTitle = 'Add New Product Conversion';
      this.lastModifiedDisplay = '';
    } else {
      this.panelTitle = 'Edit Product Conversion';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.sourceProductDescription = '--';
    this.targetProductDescription = '--';
    this.targetProducts = [];
    this.filteredTargetProducts = [];
    this.selectedSchemeType = '';
    this.lastModifiedDisplay = '';
    this.originalEffectiveDate = null;
    this.lastChangedDateField = null;

    this.form.get('sourceProductCode')?.enable();
    this.form.get('targetProductCode')?.enable();
    this.form.get('effectiveDate')?.enable();

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.editModeValues = {
      sourceProductCode: this.data.sourceProductCode,
      sourceProductDesc: this.data.sourceProductDesc || '',
      targetProductCode: this.data.targetProductCode,
      targetProductDesc: this.data.targetProductDesc || '',
      effDate: this.data.effDate
        ? DateFieldValidationUtility.formatDateForUI(moment(this.data.effDate))?.toUpperCase() || ''
        : '',
      termDate: this.data.termDate
        ? DateFieldValidationUtility.formatDateForUI(moment(this.data.termDate))?.toUpperCase() || ''
        : '',
    };

    if (this.data.lastModifiedDate) {
      const formatted = DateFieldValidationUtility.formatDateTimeForUI(this.data.lastModifiedDate);
      if (formatted) {
        const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
        let timezoneAbbr = timezone;
        try {
          timezoneAbbr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
            .formatToParts(new Date(this.data.lastModifiedDate))
            .find(p => p.type === 'timeZoneName')?.value || timezone;
        } catch { /* fall back to raw timezone string */ }
        this.lastModifiedDisplay = `Last Modified: ${formatted} ${timezoneAbbr}`;
      } else {
        this.lastModifiedDisplay = '';
      }
    }

    this.originalEffectiveDate = this.data.effDate
      ? moment(this.data.effDate).format('YYYY-MM-DD')
      : null;

    this.form.get('sourceProductCode')?.disable();
    this.form.get('targetProductCode')?.disable();

    const effControl = this.form.get('effectiveDate');
    if (effControl) {
      effControl.enable();
      effControl.clearValidators();
      effControl.setValidators([Validators.required]);
      effControl.updateValueAndValidity();
    }

    const termControl = this.form.get('terminationDate');
    if (termControl) {
      termControl.clearValidators();
      termControl.updateValueAndValidity();
    }

    this.form.patchValue({
      sourceProductCode: this.data.sourceProductCode,
      targetProductCode: this.data.targetProductCode,
      effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
      terminationDate: this.data.termDate ? moment(this.data.termDate) : null,
    }, { emitEvent: false });

    if (this.data.effDate) {
      this.minTerminationDate = moment(this.data.effDate).startOf('day');
    } else {
      this.minTerminationDate = null;
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.cdr.markForCheck();
  }

  private loadSourceProducts(): void {
    this.isLoadingSourceProducts = true;
    this.productConversionsService.getSourceProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sourceProducts = response.data || [];
          this.filteredSourceProducts = this.sourceProducts;
          this.isLoadingSourceProducts = false;
        },
        error: () => {
          this.isLoadingSourceProducts = false;
        },
      });
  }

  private loadTargetProducts(sourceProductCode: string): void {
    this.isLoadingTargetProducts = true;
    this.targetProducts = [];
    this.filteredTargetProducts = [];

    this.productConversionsService.getTargetProducts(sourceProductCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.targetProducts = response.data || [];
          this.filteredTargetProducts = this.targetProducts;
          this.isLoadingTargetProducts = false;
        },
        error: () => {
          this.isLoadingTargetProducts = false;
        },
      });
  }

  private setupSourceProductListener(): void {
    this.form.get('sourceProductCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        this.form.get('targetProductCode')?.setValue('', { emitEvent: false });
        this.targetProductDescription = '--';

        if (code) {
          const product = this.sourceProducts.find((p) => p.productCode === code);
          if (product) {
            this.sourceProductDescription = product.productDesc || '--';
            this.selectedSchemeType = product.unitSchemeType || '';
            this.loadTargetProducts(code);
          } else {
            this.sourceProductDescription = '--';
            this.targetProducts = [];
            this.filteredTargetProducts = [];
          }
        } else {
          this.sourceProductDescription = '--';
          this.selectedSchemeType = '';
          this.targetProducts = [];
          this.filteredTargetProducts = [];
        }
      });
  }

  private setupDateValidation(): void {
    const chapterTimezone = this.chapterOffset;
    if (!chapterTimezone) return;

    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    this.minEffectiveDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    this.effectiveDateFilterFn = (date: Moment | null): boolean => {
      if (!date) return true;
      if (this.mode === 'edit') return true;
      const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
      const checkDate = moment.isMoment(date) ? date : moment(date);
      return checkDate.format('YYYY-MM-DD') >= chapterToday.format('YYYY-MM-DD');
    };

    this.terminationDateFilterFn = (date: Moment | null): boolean => {
      if (!date) return true;
      const checkDate = moment.isMoment(date) ? date : moment(date);

      if (this.mode === 'add') {
        const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
        if (checkDate.format('YYYY-MM-DD') < chapterToday.format('YYYY-MM-DD')) {
          return false;
        }
      }

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

  private setupDateValueChangeListeners(): void {
    const chapterTimezone = this.chapterOffset;

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((effDate: Moment | null) => {
        const effControl = this.form.get('effectiveDate');
        if (this.mode === 'edit' && effControl?.dirty) {
          effControl.setValidators([
            Validators.required,
            DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone),
          ]);
          effControl.updateValueAndValidity({ emitEvent: false });
        }

        if (effDate && moment.isMoment(effDate)) {
          const effDay = moment(effDate).startOf('day');
          if (this.mode === 'add') {
            const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
            this.minTerminationDate = effDay.isAfter(chapterToday) ? effDay : chapterToday;
          } else {
            this.minTerminationDate = effDay;
          }
        } else {
          this.minTerminationDate = this.mode === 'add' ? DateFieldValidationUtility.getMinDate(chapterTimezone) : null;
        }

        setTimeout(() => {
          this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDateInput('terminationDate', this.termDateInput);
      });
  }

  private setupSourceSearch(): void {
    this.sourceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (!search) {
          this.filteredSourceProducts = this.sourceProducts;
          return;
        }
        const lower = search.toLowerCase();
        this.filteredSourceProducts = this.sourceProducts.filter(
          (p) =>
            p.productCode.toLowerCase().includes(lower) ||
            (p.productDesc || '').toLowerCase().includes(lower)
        );
      });
  }

  private setupTargetSearch(): void {
    this.targetSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (!search) {
          this.filteredTargetProducts = this.targetProducts;
          return;
        }
        const lower = search.toLowerCase();
        this.filteredTargetProducts = this.targetProducts.filter(
          (p) =>
            p.productCode.toLowerCase().includes(lower) ||
            (p.productDesc || '').toLowerCase().includes(lower)
        );
      });
  }

  onSourceDropdownClosed(): void {
    this.sourceSearchControl.setValue('');
    this.filteredSourceProducts = this.sourceProducts;
  }

  onTargetDropdownClosed(): void {
    this.targetSearchControl.setValue('');
    this.filteredTargetProducts = this.targetProducts;
  }

  onTargetProductChange(): void {
    const code = this.form.get('targetProductCode')?.value;
    if (code) {
      const product = this.targetProducts.find((p) => p.productCode === code);
      this.targetProductDescription = product?.productDesc || '--';
    } else {
      this.targetProductDescription = '--';
    }
  }

  private setupDateInputValidation(): void {
    // Date input validation is handled in setupDateValueChangeListeners
  }

  private validateDateInput(controlName: string, inputRef: ElementRef<HTMLInputElement>): void {
    const control = this.form.get(controlName);
    const inputValue = inputRef?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onEffDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('effectiveDate');
      control?.markAsTouched();
      this.validateDateInput('effectiveDate', this.effDateInput);
    }, 0);
  }

  onTermDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('terminationDate');
      control?.markAsTouched();
      this.validateDateInput('terminationDate', this.termDateInput);
    }, 0);
  }

  onEffDateChanged(): void {
    this.lastChangedDateField = 'effective';
  }

  onTermDateChanged(): void {
    this.lastChangedDateField = 'termination';
  }

  onEffectiveDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    const input = event.target as HTMLInputElement;
    const control = this.form.get('effectiveDate');
    if (!control) return;

    const inputValue = input.value?.trim();
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
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onTerminationDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
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

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    if (this.mode === 'add') {
      const dto: CreateProductConversionDto = {
        sourceProductCode: formValue.sourceProductCode,
        targetProductCode: formValue.targetProductCode,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };

      this.productConversionsService.createProductConversion(dto)
        .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'All changes are saved.', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
        });
    } else {
      const dto: UpdateProductConversionDto = {
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };

      this.productConversionsService.updateProductConversion(
        formValue.sourceProductCode,
        formValue.targetProductCode,
        dto
      )
        .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'All changes are saved.', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
        });
    }
  }

  onAddAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    const dto: CreateProductConversionDto = {
      sourceProductCode: formValue.sourceProductCode,
      targetProductCode: formValue.targetProductCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
    };

    this.productConversionsService.createProductConversion(dto)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'All changes are saved.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.saveSuccess.emit();
          this.resetFormForAddMode();
        },
      });
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  getSourceProductError(): string {
    const control = this.form.get('sourceProductCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Source Product is required';
    return '';
  }

  getTargetProductError(): string {
    const control = this.form.get('targetProductCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Target Product is required';
    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
