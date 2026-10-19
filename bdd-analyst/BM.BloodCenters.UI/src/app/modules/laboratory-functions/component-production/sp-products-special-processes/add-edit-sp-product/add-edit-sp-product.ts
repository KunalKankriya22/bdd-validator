import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  SpProductModel,
  SpProductFormValue,
  LookUp,
} from '../models/sp-products-special-processes.model';
import { SpProductsSpecialProcessesApiService } from '../services/sp-products-special-processes-api.service';

@Component({
  selector: 'app-add-edit-sp-product',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-sp-product.html',
  styleUrls: ['./add-edit-sp-product.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditSpProductComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiService = inject(SpProductsSpecialProcessesApiService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: SpProductModel | null = null;
  @Input() productCodeOptions: LookUp[] = [];

  attributeGroupOptions: LookUp[] = [];
  attributeCodeOptions: LookUp[] = [];

  isLoadingProductCodes = false;
  isLoadingAttributeGroups = false;
  isLoadingAttributeCodes = false;

  @Output() save = new EventEmitter<SpProductFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<SpProductFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  productCodeSearchCtrl = new FormControl('');
  attributeGroupSearchCtrl = new FormControl('');
  attributeCodeSearchCtrl = new FormControl('');

  filteredProductCodes: LookUp[] = [];
  filteredAttributeGroups: LookUp[] = [];
  filteredAttributeCodes: LookUp[] = [];

  selectedProductDescription = '';
  selectedAttributeGroupDescription = '';

  minDate: Moment;
  terminationMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');

    if (this.mode === 'add') {
      const today = this.chapterTimezoneService.getChapterLocalDate();
      if (checkDate.isBefore(today)) {
        return false;
      }
    }

    const eff = this.form?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    if (this.mode === 'edit') return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    return !checkDate.isBefore(today);
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupModeValidators();

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
      }
    });

    if (this.mode === 'add') {
      this.setupSearchFilters();
      this.setupAttributeGroupDescriptionUpdater();
      this.setupProductCodeDescriptionUpdater();
      this.setupCascadingDropdowns();
      this.loadProductCodes();
    } else {
      this.form.get('productCode')?.disable();

      if (this.data?.attribGroup) {
        this.form.get('attribGroup')?.disable();
      }
      if (this.data?.attribCode) {
        this.form.get('attribCode')?.disable();
      }

      if (!this.data?.attribGroup || !this.data?.attribCode) {
        this.setupSearchFilters();
        this.setupAttributeGroupDescriptionUpdater();
        this.setupCascadingDropdowns();
        this.loadEditModeDropdowns();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productCodeOptions']) {
      this.filteredProductCodes = this.productCodeOptions;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    const effControl = this.form.get('effDate');
    const termControl = this.form.get('termDate');

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      if (effControl) {
        effControl.clearValidators();
        effControl.setValidators([Validators.required]);
        effControl.enable();
        effControl.updateValueAndValidity();
      }

      if (termControl) {
        termControl.clearValidators();
        termControl.updateValueAndValidity();
      }
    }
  }

  private setupSearchFilters(): void {
    this.filteredProductCodes = this.productCodeOptions;
    this.filteredAttributeGroups = this.attributeGroupOptions;
    this.filteredAttributeCodes = this.attributeCodeOptions;

    this.productCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductCodes = this.filterList(
          this.productCodeOptions, search, (c) => c.code
        );
        this.cdr.markForCheck();
      });

    this.attributeGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredAttributeGroups = this.filterList(
          this.attributeGroupOptions, search, (p) => `${p.code} - ${p.name}`
        );
        this.cdr.markForCheck();
      });

    this.attributeCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredAttributeCodes = this.filterList(
          this.attributeCodeOptions, search, (b) => b.code
        );
        this.cdr.markForCheck();
      });
  }

  private filterList<T>(list: T[], search: string | null, accessor: (item: T) => string): T[] {
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((item) => accessor(item).toLowerCase().includes(term));
  }

  private setupAttributeGroupDescriptionUpdater(): void {
    this.form.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedValue: string | null) => {
        if (selectedValue) {
          const selectedType = this.attributeGroupOptions.find(
            (type) => type.code === selectedValue
          );
          this.selectedAttributeGroupDescription = selectedType?.name || '';
        } else {
          this.selectedAttributeGroupDescription = '';
        }
        this.cdr.markForCheck();
      });

    const initialAttributeGroup = this.form.get('attribGroup')?.value;
    if (initialAttributeGroup) {
      const selectedType = this.attributeGroupOptions.find(
        (type) => type.code === initialAttributeGroup
      );
      this.selectedAttributeGroupDescription = selectedType?.name || '';
    }
  }

  private setupProductCodeDescriptionUpdater(): void {
    this.form.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedCode: string | null) => {
        if (selectedCode) {
          const selectedProduct = this.productCodeOptions.find(
            (product) => product.code === selectedCode
          );
          this.selectedProductDescription = selectedProduct?.name || '';
        } else {
          this.selectedProductDescription = '';
        }
        this.cdr.markForCheck();
      });
  }

  private loadProductCodes(): void {
    if (this.productCodeOptions.length > 0) {
      this.filteredProductCodes = this.productCodeOptions;
      return;
    }
    this.isLoadingProductCodes = true;
    this.apiService.getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodeOptions = codes;
          this.filteredProductCodes = codes;
          this.isLoadingProductCodes = false;
          this.updateProductDescription();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingProductCodes = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadAttributeGroups(productCode: string): void {
    this.isLoadingAttributeGroups = true;
    this.attributeGroupOptions = [];
    this.filteredAttributeGroups = [];
    this.attributeCodeOptions = [];
    this.filteredAttributeCodes = [];
    this.form.get('attribCode')?.reset();

    this.apiService.getAttributeGroups(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroupOptions = groups;
          this.filteredAttributeGroups = groups;
          this.isLoadingAttributeGroups = false;
          this.updateAttributeGroupDescription();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingAttributeGroups = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadAttributeCodes(productCode: string, attribGroup: string): void {
    this.isLoadingAttributeCodes = true;
    this.attributeCodeOptions = [];
    this.filteredAttributeCodes = [];

    this.apiService.getAttributeCodes(productCode, attribGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodeOptions = codes;
          this.filteredAttributeCodes = codes;
          this.isLoadingAttributeCodes = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingAttributeCodes = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadEditModeDropdowns(): void {
    const productCode = this.data!.productCode;
    const attribGroup = this.data?.attribGroup;

    if (!attribGroup) {
      this.isLoadingAttributeGroups = true;
      this.apiService.getAttributeGroups(productCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (groups) => {
            this.attributeGroupOptions = groups;
            this.filteredAttributeGroups = groups;
            this.isLoadingAttributeGroups = false;
            this.updateAttributeGroupDescription();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingAttributeGroups = false;
            this.cdr.markForCheck();
          }
        });
    } else if (!this.data?.attribCode) {
      this.loadAttributeCodes(productCode, attribGroup);
    }
  }

  private setupCascadingDropdowns(): void {
    this.form.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode: string | null) => {
        if (productCode) {
          this.loadAttributeGroups(productCode);
        } else {
          this.attributeGroupOptions = [];
          this.filteredAttributeGroups = [];
          this.attributeCodeOptions = [];
          this.filteredAttributeCodes = [];
        }
        this.form.get('attribGroup')?.reset();
        this.form.get('attribCode')?.reset();
      });

    this.form.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((attribGroup: string | null) => {
        const productCode = this.form.get('productCode')?.value;
        const attribCodeCtrl = this.form.get('attribCode');
        if (attribCodeCtrl && !attribCodeCtrl.disabled) {
          if (productCode && attribGroup) {
            this.loadAttributeCodes(productCode, attribGroup);
          } else {
            this.attributeCodeOptions = [];
            this.filteredAttributeCodes = [];
          }
          attribCodeCtrl.reset();
        }
      });
  }

  private updateProductDescription(): void {
    const code = this.form?.getRawValue()?.productCode;
    if (code) {
      const product = this.productCodeOptions.find(p => p.code === code);
      this.selectedProductDescription = product?.name || '';
    }
  }

  private updateAttributeGroupDescription(): void {
    const code = this.form?.getRawValue()?.attribGroup;
    if (code) {
      const group = this.attributeGroupOptions.find(g => g.code === code);
      this.selectedAttributeGroupDescription = group?.name || '';
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      productCode: [
        this.mode === 'edit' ? this.data?.productCode : null,
        [Validators.required]
      ],
      attribGroup: [this.data?.attribGroup || null],
      attribCode: [this.data?.attribCode || null],
      effDate: [
        this.data?.effDate ? moment(this.data.effDate, 'YYYY-MM-DD') : null,
        [Validators.required]
      ],
      termDate: [
        this.data?.termDate ? moment(this.data.termDate, 'YYYY-MM-DD') : null
      ],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {});

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {});

    if (this.mode === 'edit') {
      // Set initial description for edit mode
      this.selectedProductDescription = this.data?.productDesc || '';
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const effControl = this.form.get('effDate');
        if (this.mode === 'edit' && effControl?.dirty) {
          effControl.setValidators([
            Validators.required,
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset),
          ]);
          effControl.updateValueAndValidity({ emitEvent: false });
        }

        this.updateTerminationMinDate();
        setTimeout(() => {
          this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        });
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate)) {
      const effDay = effDate.clone().startOf('day');
      if (this.mode === 'add') {
        this.terminationMinDate = effDay.isAfter(this.minDate) ? effDay : this.minDate;
      } else {
        this.terminationMinDate = effDay;
      }
    } else {
      this.terminationMinDate = this.mode === 'add' ? this.minDate : moment('1900-01-01');
    }
  }

  private getChapterMinDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
  }

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

  onSave(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.save.emit(this.getFormValue());
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.saveAndCreateAnother.emit(this.getFormValue());
    }
  }

  private validateForm(): boolean {
    const termControl = this.form.get('termDate');
    const termWasTouched = this.mode === 'edit' && termControl?.touched;

    this.form.markAllAsTouched();

    if (this.mode === 'edit' && !termWasTouched && termControl) {
      termControl.markAsUntouched();
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.mode === 'edit') {
      return !this.getEffectiveDateError() && !this.getTerminationDateError();
    }

    return !this.form.invalid && !this.form.hasError('dateRangeInvalid');
  }

  onClearAll(): void {
    this.form.reset();
    if (this.mode === 'edit') {
      this.form.patchValue({
        productCode: this.data?.productCode || '',
        attribGroup: this.data?.attribGroup || null,
        attribCode: this.data?.attribCode || null,
        effDate: this.data?.effDate ? moment(this.data.effDate, 'YYYY-MM-DD') : null
      });
      if (this.data?.attribGroup && !this.data?.attribCode) {
        this.loadAttributeCodes(this.data!.productCode, this.data!.attribGroup);
      }
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onEffDateChanged(): void {
    this.lastChangedDateField = 'effective';
  }

  onTermDateChanged(): void {
    this.lastChangedDateField = 'termination';
  }

  onEffDateInput(event: Event): void {
    this.lastChangedDateField = 'effective';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    this.lastChangedDateField = 'termination';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  onEffDateBlur(): void {
    const control = this.form.get('effDate');
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
      this.form.get('termDate')?.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  onTermDateBlur(): void {
    const control = this.form.get('termDate');
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  private getFormValue(): SpProductFormValue {
    const raw = this.form.getRawValue();
    return {
      productCode: raw.productCode,
      attribGroup: raw.attribGroup,
      attribCode: raw.attribCode,
      effDate: raw.effDate,
      termDate: raw.termDate,
    };
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.dirty && !this.getEffectiveDateError() && !this.getTerminationDateError();
    }

    const termControl = this.form.get('termDate');
    if (termControl?.hasError('invalidDate') ||
        termControl?.hasError('invalidDateFormat') ||
        termControl?.hasError('matDatepickerParse') ||
        this.form.hasError('dateRangeInvalid')) {
      return false;
    }

    return Object.keys(this.form.controls)
      .filter(key => key !== 'termDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Product' : 'Edit Product';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get showCreateAnotherButton(): boolean {
    return this.mode === 'add';
  }
}
