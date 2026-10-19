import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { SterileDockingLovService } from '../services/sterile-docking-lov.service';
import {
  DockingConfigurationComplete,
  DockingType,
  UnitEntryDto,
  LovOption,
  ProductCodeOption,
  ValidateUnitForDockingRequest
} from '../models/sterile-docking-definition.model';
import { getInputValidationError } from '@shared/validators/input.validators';

@Component({
  selector: 'app-unit-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent
  ],
  templateUrl: './unit-entry-form.component.html',
  styleUrl: './unit-entry-form.component.scss'
})
export class UnitEntryFormComponent implements OnInit, OnDestroy, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly lovService = inject(SterileDockingLovService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @Input() configuration?: DockingConfigurationComplete | null;
  @Input() maxUnits = 0;
  @Input() currentUnitCount = 0;
  @Input() existingUnitIds: string[] = [];
  @Input() expectedDerivedProduct?: string; // Expected derived product for verification
  @Output() unitAdded = new EventEmitter<UnitEntryDto>();
  @Output() unitLimitReached = new EventEmitter<void>();
  @Output() reprintEligibleChange = new EventEmitter<boolean>();
  @Output() derivedProductErrorChange = new EventEmitter<string | null>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Form
  form!: FormGroup;

  // LOV data
  productCodes: ProductCodeOption[] = [];

  // Filtered arrays
  filteredProducts: ProductCodeOption[] = [];

  // Unit validation state
  validatedUnitData: any = null;
  private productTypeFromValidation: string | undefined;

  isSaving = false;
  private isResetting = false;
  private resetTimerId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.setupProductCodeAutocomplete();
    this.subscribeToChapterChanges();
    this.updateVerifyProductValidator();
    this.updateProductCodeValidator();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configuration'] && this.form) {
      this.updateVerifyProductValidator();
      this.updateProductCodeValidator();
    }
    // Do not pre-fill derived product from previous entry
    // Derived product should only come from calculate-derived-product API
  }

  private updateProductCodeValidator(): void {
    const ctrl = this.form.get('originalProductCode');
    if (this.isNeedleDocking()) {
      ctrl?.clearValidators();
      ctrl?.setValue('');
    } else {
      ctrl?.setValidators([Validators.required]);
    }
    ctrl?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    if (this.resetTimerId) {
      clearTimeout(this.resetTimerId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.reset({ weldOk: '', verifyProduct: '' });
        this.validatedUnitData = null;
        this.productCodes = [];
        this.filteredProducts = [];
        this.unitIdField?.clear();
      });
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      originalProductCode: ['', [Validators.required]],
      weldOk: ['', [Validators.required]],
      verifyProduct: ['']
    });
  }

  isNeedleDocking(): boolean {
    return this.configuration?.itemInd === DockingType.NE;
  }

  requiresVerifyProduct(): boolean {
    const dockingType = this.configuration?.itemInd;
    return dockingType === DockingType.FB || dockingType === DockingType.BF;
  }

  private updateVerifyProductValidator(): void {
    const ctrl = this.form.get('verifyProduct');
    if (this.requiresVerifyProduct()) {
      ctrl?.setValidators([Validators.required]);
      ctrl?.setValue('');
    } else {
      ctrl?.clearValidators();
      ctrl?.setValue('');
    }
    ctrl?.updateValueAndValidity();
  }

  private setupProductCodeAutocomplete(): void {
    this.filteredProducts = this.productCodes;

    this.form.get('originalProductCode')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        if (!search || search.trim() === '') {
          this.filteredProducts = this.productCodes;
          return;
        }
        this.filteredProducts = this.filterProductOptions(this.productCodes, search);
      });
  }

  private filterProductOptions(
    options: ProductCodeOption[],
    search: string | null
  ): ProductCodeOption[] {
    if (!search) {
      return options;
    }
    const searchLower = search.toLowerCase();
    return options.filter(
      option =>
        option.code.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }

  private loadProductCodes(): void {
    this.lovService.getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(codes => {
        this.productCodes = codes;
        this.filteredProducts = codes;
      });
  }

  // --- Shared Unit ID field events ---

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const data = event.data;
    const unitId = data.parsedUnitId;

    if (!this.configuration) {
      event.confirm();
      return;
    }

    const request: ValidateUnitForDockingRequest = {
      unitId,
      dockingType: this.configuration.itemInd?.toString() || '',
      productCode: this.form.get('originalProductCode')?.value || undefined,
      filterType: this.configuration.filterType || undefined,
      attribCode: this.configuration.attributeCode || this.configuration.attribCode || undefined,
      processDate: this.configuration.processDate || undefined,
      collDate: this.configuration.collDate || undefined
    };

    this.lovService.validateUnitForDocking(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dockingResult) => {
          if (dockingResult.success === false) {
            const errorCode = dockingResult.errorCode || '';
            const message = dockingResult.message || 'Unit validation failed';
            event.reject(`[${errorCode}] ${message}`);
          } else {
            this.productTypeFromValidation = dockingResult.productType || undefined;
            event.confirm();
          }
        },
        error: (err) => {
          const errorBody = err.error;
          const message = errorBody?.errorCode
            ? `[${errorBody.errorCode}] ${errorBody.message || 'Validation failed'}`
            : errorBody?.message || 'Unit validation failed';
          event.reject(message);
        }
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    this.validatedUnitData = { ...data, isValid: true, unitId };
    this.loadUnitProductCodes(unitId);
  }

  onUnitCleared(): void {
    this.validatedUnitData = null;
    this.productTypeFromValidation = undefined;
    this.productCodes = [];
    this.filteredProducts = [];
    this.derivedProductError = null;
    this.lastDerivedProductCode = null;
    this.form.patchValue({ originalProductCode: '' });
  }

  private loadUnitProductCodes(unitId: string): void {
    const dockingType = this.configuration?.itemInd;
    const isFbBf = dockingType === DockingType.FB || dockingType === DockingType.BF;
    // FMB: FB/BF LOV filters by :ctrl_blk_2.product_type (from config's filter type selection)
    const productType = isFbBf
      ? (this.configuration?.productType || this.productTypeFromValidation)
      : undefined;

    this.lovService.getUnitProductCodes(unitId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe(codes => {
        this.productCodes = codes;
        this.filteredProducts = codes;
      });
  }

  productCodeValidated = false;
  verifyProductValidated = false;
  derivedProductCode: string | null = null;

  private emitReprintEligible(): void {
    const eligible = this.requiresVerifyProduct() && !!this.derivedProductCode && !this.verifyProductValidated;
    this.reprintEligibleChange.emit(eligible);
  }

  onProductCodeBlur(): void {
    const value = this.form.get('originalProductCode')?.value?.trim();
    if (!value) {
      this.productCodeValidated = false;
      return;
    }

    const match = this.productCodes.find(
      p => p.code === value || p.code === value.substring(0, 5) ||
           p.code.toUpperCase() === value.toUpperCase()
    );

    const ctrl = this.form.get('originalProductCode');
    if (match) {
      ctrl?.setValue(match.code);
      ctrl?.setErrors(null);
      this.productCodeValidated = true;
      this.calculateDerivedProductIfNeeded(match.code);
    } else if (this.productCodes.length > 0) {
      ctrl?.setErrors({ invalidProduct: true });
      this.productCodeValidated = false;
    } else {
      this.productCodeValidated = true;
    }
  }

  onProductCodeFocus(): void {
    this.filteredProducts = this.productCodes;
  }

  onProductCodeSelected(code: string): void {
    const match = this.productCodes.find(p => p.code === code);
    if (match) {
      this.form.patchValue({ originalProductCode: match.code });
      this.productCodeValidated = true;
      this.calculateDerivedProductIfNeeded(match.code);
    }
  }

  derivedProductError: string | null = null;
  private lastDerivedProductCode: string | null = null;

  private calculateDerivedProductIfNeeded(productCode: string): void {
    if (!this.requiresVerifyProduct()) return;
    if (productCode === this.lastDerivedProductCode) return;
    this.lastDerivedProductCode = productCode;

    const attribCode = this.configuration?.attributeCode || this.configuration?.attribCode;
    const filterType = this.configuration?.filterType;
    this.lovService.calculateDerivedProduct(productCode, attribCode, filterType)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.derivedProductCode = result.derivedProduct;
        if (result.error) {
          this.derivedProductError = result.error;
        } else {
          this.derivedProductError = null;
        }
        this.derivedProductErrorChange.emit(this.derivedProductError);
        this.emitReprintEligible();
      });
  }


  onVerifyProductBlur(): void {
    const value = this.form.get('verifyProduct')?.value?.trim();
    if (!value) {
      this.verifyProductValidated = false;
      return;
    }

    const ctrl = this.form.get('verifyProduct');
    const originalProductCode = this.form.get('originalProductCode')?.value;

    if (!originalProductCode) {
      ctrl?.setErrors(null);
      this.verifyProductValidated = true;
      return;
    }

    if (!this.derivedProductCode) {
      ctrl?.setErrors({ mismatch: true });
      this.verifyProductValidated = false;
      return;
    }

    const match = value.toUpperCase() === this.derivedProductCode.toUpperCase() ||
                  value.substring(0, 5).toUpperCase() === this.derivedProductCode.substring(0, 5).toUpperCase();

    if (match) {
      ctrl?.setErrors(null);
      this.verifyProductValidated = true;
      this.derivedProductCode = null;
    } else {
      ctrl?.setErrors({ mismatch: true });
      this.verifyProductValidated = false;
    }
    this.emitReprintEligible();
  }

  private readonly fieldLabels: Record<string, string> = {
    originalProductCode: 'Original Product Code',
    weldOk: 'Weld OK',
    verifyProduct: 'Verify Product'
  };

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    const label = this.fieldLabels[fieldName] || fieldName;
    return getInputValidationError(control, label);
  }

  onWeldOkClosed(): void {
    if (this.isResetting) return;
    if (!this.requiresVerifyProduct()) {
      this.tryAutoAdd();
    }
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    this.tryAutoAdd();
  }

  private tryAutoAdd(): void {
    if (this.isSaving) return;

    if (this.form.invalid || !this.unitIdField?.isValid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.validatedUnitData?.isValid) {
      this.snackbarService.showError('Please validate the Unit ID first');
      return;
    }

    const unitId = this.unitIdField.parsedUnitId!;

    if (this.existingUnitIds.includes(unitId)) {
      this.snackbarService.showError(`Unit ${unitId} has already been added`);
      return;
    }

    if (this.maxUnits > 0 && this.currentUnitCount >= this.maxUnits) {
      this.snackbarService.showError(`Err: 0109: Exceeded declared number of units - ${this.maxUnits} units`);
      this.unitLimitReached.emit();
      return;
    }

    if (this.derivedProductError) {
      return;
    }

    // Convert verify product text input to Y/N for backend
    // If verify product field has a value and it's valid, send 'Y', otherwise 'N'
    let verifyProductValue: 'Y' | 'N' = 'N';
    if (this.requiresVerifyProduct()) {
      verifyProductValue = this.verifyProductValidated ? 'Y' : 'N';
    }

    const unitDto: UnitEntryDto = {
      unitId,
      originalProductCode: this.form.value.originalProductCode!,
      weldOk: this.form.value.weldOk!,
      verifyProduct: verifyProductValue
    };

    this.isSaving = true;
    this.unitAdded.emit(unitDto);
  }

  resetFormForNextEntry(): void {
    this.isSaving = false;
    this.isResetting = true;
    this.form.reset({ weldOk: '', verifyProduct: '' });
    this.validatedUnitData = null;
    this.productTypeFromValidation = undefined;
    this.productCodeValidated = false;
    this.verifyProductValidated = false;
    this.derivedProductCode = null;
    this.derivedProductError = null;
    this.lastDerivedProductCode = null;
    this.unitIdField?.clear();

    const newCount = this.currentUnitCount + 1;
    if (this.maxUnits > 0 && newCount >= this.maxUnits) {
      this.unitLimitReached.emit();
    }

    this.emitReprintEligible();

    this.resetTimerId = setTimeout(() => {
      this.resetTimerId = null;
      this.isResetting = false;
    }, 150);
  }

  onSaveError(): void {
    this.isSaving = false;
  }
}
