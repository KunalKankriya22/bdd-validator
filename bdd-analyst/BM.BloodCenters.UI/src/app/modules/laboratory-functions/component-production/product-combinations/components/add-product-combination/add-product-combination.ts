import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  ProductTypeDetailDto,
  CreateProductCombinationRequestDto,
  getErrorMessage
} from '../../models/product-combinations.model';
import { ProductCombinationsApiService } from '../../services/product-combinations-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Subject, takeUntil } from 'rxjs';

interface ProductSlot {
  productTypeCode: string | null;
  description: string;
}

@Component({
  selector: 'app-add-product-combination',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-product-combination.html',
  styleUrls: ['./add-product-combination.scss']
})
export class AddProductCombinationComponent implements OnInit, OnDestroy {
  activeProductTypes: ProductTypeDetailDto[] = [];
  filteredProductTypes: ProductTypeDetailDto[] = [];

  form!: FormGroup;
  isSubmitting = false;
  validationMessage = '';

  bagCountOptions = Array.from({ length: 15 }, (_, i) => i + 1);
  filteredBagCountOptions: number[] = [];
  productSlots: ProductSlot[] = [];
  productTypeSearchControl = new FormControl('');
  bagCountSearchControl = new FormControl('');
  nextSetId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddProductCombinationComponent>,
    private service: ProductCombinationsApiService,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupProductTypeSearch();
    this.setupBagCountSearch();
    this.loadNextSetId(); // Load code set when panel opens
  }

  /**
   * Setup product type search filtering
   */
  private setupProductTypeSearch(): void {
    // Initialize filtered list
    this.filteredProductTypes = this.activeProductTypes.slice();

    // Listen to search changes
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterProductTypes(searchText || '');
      });
  }

  /**
   * Setup bag count search filtering
   */
  private setupBagCountSearch(): void {
    // Initialize filtered list
    this.filteredBagCountOptions = this.bagCountOptions.slice();

    // Listen to search changes
    this.bagCountSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.filterBagCount(searchText || '');
      });
  }

  /**
   * Filter bag count based on search text
   */
  private filterBagCount(searchText: string): void {
    if (!searchText) {
      this.filteredBagCountOptions = this.bagCountOptions.slice();
      return;
    }

    const search = searchText.toLowerCase();
    this.filteredBagCountOptions = this.bagCountOptions.filter(count =>
      count.toString().includes(search)
    );
  }

  /**
   * Filter product types based on search text
   */
  private filterProductTypes(searchText: string): void {
    if (!searchText) {
      this.filteredProductTypes = this.activeProductTypes.slice();
      return;
    }

    const search = searchText.toLowerCase();
    this.filteredProductTypes = this.activeProductTypes.filter(type =>
      type.productTypeCode.toLowerCase().includes(search) ||
      type.productTypeDesc.toLowerCase().includes(search)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      bagCount: [null]
    });

    // Watch bag count changes to update product slots
    this.form.get('bagCount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {
        this.updateProductSlots(count);
      });
  }

  /**
   * Load next available set ID from API
   */
  private loadNextSetId(): void {
    this.service.getNextSetId()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nextSetId) => {
          this.nextSetId = nextSetId;
        },
        error: () => {
          this.nextSetId = null;
        }
      });
  }

  /**
   * Update product slots based on bag count
   * Clear all selections when bag count changes
   */
  private updateProductSlots(count: number): void {
    if (!count) {
      this.productSlots = [];
      return;
    }

    // Always reset all slots when bag count changes
    this.productSlots = [];
    for (let i = 0; i < count; i++) {
      this.productSlots.push({ productTypeCode: null, description: '' });
    }
  }

  /**
   * Get code set value from API
   */
  get codeSetValue(): string {
    return this.nextSetId ? this.nextSetId.toString() : '';
  }

  /**
   * Handle product type selection change
   */
  onProductTypeChange(index: number, productTypeCode: string): void {
    const productType = this.activeProductTypes.find(
      pt => pt.productTypeCode === productTypeCode
    );

    if (productType) {
      this.productSlots[index].description = productType.productTypeDesc;
    } else {
      this.productSlots[index].description = '';
    }

    this.validateSelection();
  }

  /**
   * Get available product types for a specific slot (excluding already selected)
   */
  getAvailableTypesForSlot(slotIndex: number): ProductTypeDetailDto[] {
    const selectedCodes = this.productSlots
      .map((slot, index) => index !== slotIndex ? slot.productTypeCode : null)
      .filter(code => code !== null);

    return this.filteredProductTypes.filter(
      type => !selectedCodes.includes(type.productTypeCode)
    );
  }

  /**
   * Validate the selection
   */
  private validateSelection(): void {
    // No validation message needed since we show exact number of rows
    this.validationMessage = '';
  }

  /**
   * Check if form is valid
   */
  get isFormValid(): boolean {
    const bagCount = this.form.get('bagCount')?.value;
    if (!bagCount) return false;

    const selectedCount = this.productSlots.filter(slot => slot.productTypeCode).length;
    return selectedCount === bagCount;
  }

  /**
   * Save and close
   */
  onSave(): void {
    if (!this.isFormValid) return;
    this.saveProductCombination(false);
  }

  /**
   * Save and create another
   */
  onSaveAndCreateAnother(): void {
    if (!this.isFormValid) return;
    this.saveProductCombination(true);
  }

  /**
   * Save product combination
   */
  private saveProductCombination(createAnother: boolean = false): void {
    this.isSubmitting = true;

    const payload: CreateProductCombinationRequestDto = {
      numberOfBags: this.form.get('bagCount')?.value,
      productTypes: this.productSlots
        .filter(slot => slot.productTypeCode)
        .map(slot => slot.productTypeCode!)
    };

    this.service.createProductCombination(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.snackbar.showSuccess('Product combination created successfully');

          if (createAnother) {
            // Reset form for creating another
            this.resetForm();
          } else {
            // Close dialog
            this.dialogRef.close(true);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          // Handle API response with success: false
          const errorCode = error?.error?.errorResponse?.errorCode || error?.error?.errorCode;
          const message = errorCode ? getErrorMessage(errorCode) : (error?.message || 'Failed to create product combination');
          this.snackbar.showError(message);
        }
      });
  }

  /**
   * Reset form for creating another product combination
   */
  private resetForm(): void {
    this.form.reset();
    this.productSlots = [];
    this.validationMessage = '';
    this.loadNextSetId(); // Load next code set
    this.productTypeSearchControl.setValue('');
    this.bagCountSearchControl.setValue('');
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close(false);
  }
}
