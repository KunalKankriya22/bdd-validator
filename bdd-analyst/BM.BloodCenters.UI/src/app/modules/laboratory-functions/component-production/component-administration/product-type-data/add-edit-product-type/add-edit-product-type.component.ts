import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';

import { ProductTypeService } from '../services/product-type.service';
import {
  ProductType,
  ProductClassDropdown,
  ProductTypeDropdownOption,
  YesNoOption,
  CreateProductTypeDto,
  UpdateProductTypeDto
} from '../models/product-type.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface ProductTypeFormData {
  productTypeCode: string;
  productTypeDesc: string;
  productClass: string;
  productGroupName: string;
  aboOnly: string;
  attribFlag: string;
  weightRequired: string;
  effDate: string;
  termDate: string | null;
}

@Component({
  selector: 'app-add-edit-product-type',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-product-type.component.html',
  styleUrls: ['./add-edit-product-type.component.scss']
})
export class AddEditProductType implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProductType | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ProductTypeFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    productTypeCode: string;
    productTypeDesc: string;
  } = {
    productTypeCode: '',
    productTypeDesc: ''
  };

  productTypeOptions: ProductTypeDropdownOption[] = [];
  productTypeSearchCtrl = new FormControl('');
  filteredProductTypeOptions = signal<ProductTypeDropdownOption[]>([]);
  loadingProductTypes = false;

  productClassOptions: ProductClassDropdown[] = [];
  productClassSearchCtrl = new FormControl('');
  filteredProductClassOptions = signal<ProductClassDropdown[]>([]);

  yesNoOptions: YesNoOption[] = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  attribFlagOptions: YesNoOption[] = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  minDate = DateFieldValidationUtility.getMinDate();

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff && moment.isMoment(eff)) {
      const effDay = eff.clone().startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  loadingProductClasses = false;
  isSaving = false;

  private initialFormValues: any = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productTypeService: ProductTypeService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group(
      {
        productTypeCode: ['', [Validators.required, Validators.maxLength(5)]],
        productTypeDesc: [''],
        productClass: ['', [Validators.required]],
        classDescription: [{ value: '', disabled: true }],
        productGroupName: [''],
        productGroupIdentifier: [''],
        aboOnly: [''],
        attribFlag: [''],
        weightRequired: [''],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null]
      },
      {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
        ]
      }
    );
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadProductTypes();
    this.loadProductClasses();
    this.setupDateValidationListeners();
    this.setupProductTypeChangeListener();
    this.setupProductClassChangeListener();
    this.setupSearchFilters();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
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
      this.panelTitle = 'Add New Product Type';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Product Type';

      const dateToDisplay = this.data?.lastModifiedDate;
      this.lastUpdated = dateToDisplay
        ? `Last Modified: ${this.formatDateTime(dateToDisplay)}`
        : '';
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      productTypeCode: '',
      productTypeDesc: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('classDescription')?.disable();
    this.form.get('productTypeCode')?.enable();
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.filteredProductTypeOptions.set(this.productTypeOptions);

    // Re-apply add-mode validators (effective date may have been disabled in edit mode)
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    this.initialFormValues = null;
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.editModeValues = {
        productTypeCode: this.data.productTypeCode || '',
        productTypeDesc: this.data.productTypeDesc || ''
      };

      this.form.get('classDescription')?.disable();
      this.form.get('productTypeCode')?.disable();

      const classDesc = this.getClassDescFromCode(this.data.productClass);

      this.form.patchValue({
        productTypeCode: this.data.productTypeCode || '',
        productTypeDesc: this.data.productTypeDesc || '',
        productClass: this.data.productClass || '',
        classDescription: classDesc || this.data.productGroupName || '',
        productGroupName: this.data.productGroupName || '',
        productGroupIdentifier: this.data.productGroupIdentifier || '',
        aboOnly: this.data.aboOnly || '',
        attribFlag: this.data.attribFlag || '',
        weightRequired: this.data.weightRequired || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      }, { emitEvent: false });

      this.form.markAsPristine();
      this.form.markAsUntouched();

      const effControl = this.form.get('effectiveDate');
      if (
        effControl?.value &&
        moment.isMoment(effControl.value) &&
        effControl.value.isBefore(DateFieldValidationUtility.getMinDate())
      ) {
        effControl.markAsTouched();
      }

      this.initialFormValues = {
        productTypeCode: this.data.productTypeCode || '',
        productClass: this.data.productClass || '',
        productGroupName: this.data.productGroupName || '',
        aboOnly: this.data.aboOnly || '',
        attribFlag: this.data.attribFlag || '',
        weightRequired: this.data.weightRequired || '',
        effectiveDate: this.data.effDate ? moment(this.data.effDate).valueOf() : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate).valueOf() : null
      };
    }
  }

  private loadProductClasses(): void {
    this.loadingProductClasses = true;
    this.form.get('productClass')?.disable();

    this.productTypeService
      .getProductClassesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productClassOptions = response.data || [];
          this.filteredProductClassOptions.set(this.productClassOptions);
          this.loadingProductClasses = false;
          this.form.get('productClass')?.enable();

          if (this.mode === 'edit' && this.data?.productClass) {
            const classDesc = this.getClassDescFromCode(this.data.productClass);
            this.form.patchValue({
              productClass: this.data.productClass,
              classDescription: classDesc
            }, { emitEvent: false });
          }
        },
        error: (err) => {
          console.error('Error loading product classes:', err);
          this.loadingProductClasses = false;
          this.form.get('productClass')?.enable();
        }
      });
  }

  private getClassDescFromCode(code: string): string {
    const option = this.productClassOptions.find(
      (opt) => opt.code === code
    );
    return option?.codeDesc || '';
  }

  private setupProductClassChangeListener(): void {
    this.form
      .get('productClass')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((selectedClass) => {
        if (selectedClass) {
          const classDesc = this.getClassDescFromCode(selectedClass);
          this.form.patchValue({
            classDescription: classDesc,
            productGroupName: classDesc
          }, { emitEvent: false });
        } else {
          this.form.patchValue({
            classDescription: '',
            productGroupName: ''
          }, { emitEvent: false });
        }
      });
  }

  private loadProductTypes(): void {
    this.loadingProductTypes = true;
    this.form.get('productTypeCode')?.disable();

    this.productTypeService
      .getProductTypesLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const all: ProductTypeDropdownOption[] = response.data || [];
          this.productTypeOptions = all.filter(opt => this.getCharCount(opt.productTypeDesc) <= 30);
          this.filteredProductTypeOptions.set(this.productTypeOptions);
          this.loadingProductTypes = false;
          if (this.mode === 'add') {
            this.form.get('productTypeCode')?.enable();
          }
        },
        error: (err) => {
          console.error('Error loading product types:', err);
          this.loadingProductTypes = false;
          if (this.mode === 'add') {
            this.form.get('productTypeCode')?.enable();
          }
        }
      });
  }

  private setupProductTypeChangeListener(): void {
    this.form
      .get('productTypeCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((selectedCode) => {
        if (selectedCode) {
          const option = this.productTypeOptions.find(
            (opt) => opt.productTypeCode === selectedCode
          );
          this.form.patchValue({
            productTypeDesc: option?.productTypeDesc || ''
          }, { emitEvent: false });
        } else {
          this.form.patchValue({ productTypeDesc: '' }, { emitEvent: false });
        }
      });
  }

  private setupSearchFilters(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductTypes();
      });

    this.productClassSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductClasses();
      });
  }

  private filterProductTypes(): void {
    const search = this.productTypeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredProductTypeOptions.set(this.productTypeOptions);
      return;
    }
    const filtered = this.productTypeOptions.filter(
      (option) =>
        option.productTypeCode.toLowerCase().includes(search) ||
        option.productTypeDesc.toLowerCase().includes(search)
    );
    this.filteredProductTypeOptions.set(filtered);
  }

  private filterProductClasses(): void {
    const search = this.productClassSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredProductClassOptions.set(this.productClassOptions);
      return;
    }

    const filtered = this.productClassOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(search) ||
        option.codeDesc.toLowerCase().includes(search)
    );
    this.filteredProductClassOptions.set(filtered);
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
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

  onProductTypeCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.form.get('productTypeCode')?.setValue(input.value, { emitEvent: false });
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

    if (this.mode === 'add') {
      const dto: CreateProductTypeDto = {
        productTypeCode: formValue.productTypeCode?.trim().toUpperCase() || '',
        productTypeDesc: formValue.productTypeDesc?.trim() || '',
        productClass: formValue.productClass || null,
        productGroupName: formValue.productGroupName?.trim() || formValue.classDescription?.trim() || '',
        productGroupIdentifier: formValue.productGroupIdentifier?.trim() || null,
        aboOnly: formValue.aboOnly || null,
        attribFlag: formValue.attribFlag || null,
        weightRequired: formValue.weightRequired || null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : moment.utc().format('YYYY-MM-DD'),
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null
      };

      this.isSaving = true;

      this.productTypeService
        .createProductType(dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(
                `Product ${formValue.productTypeCode} has been added.`,
                'DISMISS',
                {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar'],
                  duration: 5000
                }
              );

              this.saveSuccess.emit(this.buildFormData(formValue));
              this.closePanel.emit();
            }
          },
          error: (error) => {
            console.error('Error creating product type:', error);
            this.snackBar.open(
              this.extractErrorMessage(error, 'Error creating product type'),
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        });
    } else {
      const dto: UpdateProductTypeDto = {
        productTypeDesc: formValue.productTypeDesc?.trim() || this.data?.productTypeDesc || '',
        productClass: formValue.productClass || null,
        productGroupName: formValue.productGroupName?.trim() || formValue.classDescription?.trim() || '',
        productGroupIdentifier: formValue.productGroupIdentifier?.trim() || null,
        aboOnly: formValue.aboOnly || null,
        attribFlag: formValue.attribFlag || null,
        weightRequired: formValue.weightRequired || null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : moment.utc().format('YYYY-MM-DD'),
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null
      };

      this.isSaving = true;

      this.productTypeService
        .updateProductType(formValue.productTypeCode, dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(
                `Product ${formValue.productTypeCode} has been updated.`,
                'DISMISS',
                {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar'],
                  duration: 5000
                }
              );

              this.saveSuccess.emit(this.buildFormData(formValue));
              this.closePanel.emit();
            }
          },
          error: (error) => {
            console.error('Error updating product type:', error);
            this.snackBar.open(
              this.extractErrorMessage(error, 'Error updating product type'),
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        });
    }
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

    if (this.mode === 'add') {
      const dto: CreateProductTypeDto = {
        productTypeCode: formValue.productTypeCode?.trim().toUpperCase() || '',
        productTypeDesc: formValue.productTypeDesc?.trim() || '',
        productClass: formValue.productClass || null,
        productGroupName: formValue.productGroupName?.trim() || formValue.classDescription?.trim() || '',
        productGroupIdentifier: formValue.productGroupIdentifier?.trim() || null,
        aboOnly: formValue.aboOnly || null,
        attribFlag: formValue.attribFlag || null,
        weightRequired: formValue.weightRequired || null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : moment.utc().format('YYYY-MM-DD'),
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null
      };

      this.isSaving = true;

      this.productTypeService
        .createProductType(dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(
                `Product ${formValue.productTypeCode} has been added.`,
                'DISMISS',
                {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar'],
                  duration: 5000
                }
              );

              this.saveSuccess.emit(this.buildFormData(formValue));
              this.resetFormForAddMode();
            }
          },
          error: (error) => {
            console.error('Error creating product type:', error);
            this.snackBar.open(
              this.extractErrorMessage(error, 'Error creating product type'),
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        });
    } else {
      const dto: UpdateProductTypeDto = {
        productTypeDesc: formValue.productTypeDesc?.trim() || this.data?.productTypeDesc || '',
        productClass: formValue.productClass || null,
        productGroupName: formValue.productGroupName?.trim() || formValue.classDescription?.trim() || '',
        productGroupIdentifier: formValue.productGroupIdentifier?.trim() || null,
        aboOnly: formValue.aboOnly || null,
        attribFlag: formValue.attribFlag || null,
        weightRequired: formValue.weightRequired || null,
        effDate: formValue.effectiveDate
          ? moment(formValue.effectiveDate).format('YYYY-MM-DD')
          : moment.utc().format('YYYY-MM-DD'),
        termDate: formValue.terminationDate
          ? moment(formValue.terminationDate).format('YYYY-MM-DD')
          : null
      };

      this.isSaving = true;

      this.productTypeService
        .updateProductType(formValue.productTypeCode, dto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(
                `Product ${formValue.productTypeCode} has been updated.`,
                'DISMISS',
                {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar'],
                  duration: 5000
                }
              );

              this.saveSuccess.emit(this.buildFormData(formValue));

              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            }
          },
          error: (error) => {
            console.error('Error updating product type:', error);
            this.snackBar.open(
              this.extractErrorMessage(error, 'Error updating product type'),
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        });
    }
  }

  private buildFormData(formValue: any): ProductTypeFormData {
    return {
      productTypeCode: formValue.productTypeCode?.trim() || '',
      productTypeDesc: formValue.productTypeDesc?.trim() || '',
      productClass: formValue.productClass || '',
      productGroupName: formValue.productGroupName?.trim() || formValue.classDescription?.trim() || '',
      aboOnly: formValue.aboOnly || '',
      attribFlag: formValue.attribFlag || '',
      weightRequired: formValue.weightRequired || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get productTypeCodeControl() { return this.form.get('productTypeCode'); }
  get productTypeDescControl() { return this.form.get('productTypeDesc'); }
  get productClassControl() { return this.form.get('productClass'); }
  get effectiveDateControl() { return this.form.get('effectiveDate'); }
  get terminationDateControl() { return this.form.get('terminationDate'); }

  getProductTypeCodeError(): string {
    const control = this.productTypeCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Product Type Code is required';
    if (control.hasError('maxlength')) return 'Product Type Code cannot exceed 5 characters';
    return '';
  }

  getProductTypeDescError(): string {
    const control = this.productTypeDescControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Product Type Description is required';
    if (control.hasError('maxlength')) return 'Description cannot exceed 30 characters';
    return '';
  }

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

  formatDate(date: Date | moment.Moment | null): string {
    if (!date) return '-';
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.format('DD-MMM-YYYY');
  }

  formatDateTime(date: Date | string | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], HH:mm [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, HH:mm [PST]').toUpperCase();
    }
  }

  private getCharCount(text: string | null | undefined): number {
    return text?.length ?? 0;
  }

  getProductTypeDisplay(option: ProductTypeDropdownOption): string {
    return option.productTypeDesc
      ? `${option.productTypeCode} - ${option.productTypeDesc}`
      : option.productTypeCode;
  }

  getProductClassDisplay(option: ProductClassDropdown): string {
    return option.codeDesc
      ? `${option.code} - ${option.codeDesc}`
      : option.code;
  }

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true;
    }

    const currentValues = this.form.getRawValue();

    const productTypeCodeChanged = currentValues.productTypeCode !== this.initialFormValues.productTypeCode;
    const productClassChanged = currentValues.productClass !== this.initialFormValues.productClass;
    const aboOnlyChanged = currentValues.aboOnly !== this.initialFormValues.aboOnly;
    const attribFlagChanged = currentValues.attribFlag !== this.initialFormValues.attribFlag;
    const weightRequiredChanged = currentValues.weightRequired !== this.initialFormValues.weightRequired;

    const currentEffDate = currentValues.effectiveDate && moment.isMoment(currentValues.effectiveDate)
      ? currentValues.effectiveDate.valueOf()
      : null;
    const effDateChanged = currentEffDate !== this.initialFormValues.effectiveDate;

    const currentTermDate = currentValues.terminationDate && moment.isMoment(currentValues.terminationDate)
      ? currentValues.terminationDate.valueOf()
      : null;
    const termDateChanged = currentTermDate !== this.initialFormValues.terminationDate;

    return (
      productClassChanged ||
      aboOnlyChanged ||
      attribFlagChanged ||
      weightRequiredChanged ||
      effDateChanged ||
      termDateChanged
    );
  }

  get isFormValid(): boolean {
    const isValid = this.form.valid && !this.hasDateValidationError();

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }

  private extractErrorMessage(error: any, defaultMessage: string = 'Error saving record'): string {
    if (error?.error?.error?.errorCode && error?.error?.error?.errorDescription) {
      return `Error: ${error.error.error.errorCode} : ${error.error.error.errorDescription}`;
    }
    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      return `Error: ${error.error.errorResponse.errorCode} : ${error.error.errorResponse.error}`;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    return error?.message || defaultMessage;
  }
}
