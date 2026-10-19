import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryProductTypeModel } from '../models/inventory-product-types.model';

/**
 * Validator to ensure price has at most 2 decimal places and is a valid number
 */
function twoDecimalPlacesValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) {
    return null; // Allow empty
  }

  const value = control.value.toString().trim();

  // Check if it's just a decimal point or invalid number
  if (value === '.' || value === '' || isNaN(Number(value))) {
    return { invalidNumber: true };
  }

  // Check if it contains a decimal point
  if (value.includes('.')) {
    const parts = value.split('.');
    // Check if more than 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return { twoDecimalPlaces: true };
    }
  }

  return null;
}

export interface ModifyPriceDialogData {
  selectedProducts: InventoryProductTypeModel[];
}

@Component({
  selector: 'app-modify-price-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './modify-price-dialog.html',
  styleUrls: ['./modify-price-dialog.scss']
})
export class ModifyPriceDialog implements OnInit {
  form!: FormGroup;
  currentPrice: string = '';
  selectedCount: number = 0;
  isValueFocused = false;

  adjustmentTypes = [
    { label: 'Percentage', value: 'percentage' },
    { label: 'Amount', value: 'amount' }
  ];

  adjustmentDirections = [
    { label: 'Increase', value: 'increase' },
    { label: 'Decrease', value: 'decrease' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModifyPriceDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ModifyPriceDialogData,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.selectedCount = this.data.selectedProducts.length;
    this.currentPrice = this.calculateCurrentPrice();

    this.form = this.fb.group({
      adjustmentType: ['percentage', Validators.required],    // ✅ Default
      adjustmentDirection: [null, Validators.required], // No default selection
      adjustmentValue: [null, [Validators.required, Validators.min(0.01), twoDecimalPlacesValidator]]
    });
  }

  private calculateCurrentPrice(): string {
    if (this.data.selectedProducts.length === 0) {
      return '-';
    }

    const prices = this.data.selectedProducts
      .map(p => p.price)
      .filter(p => p !== null && p !== undefined) as number[];

    if (prices.length === 0) {
      return '-';
    }

    // Check if all prices are the same
    const allSame = prices.every(p => p === prices[0]);
    if (allSame) {
      return `$${prices[0].toFixed(2)}`;
    }

    return 'Mixed';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const adjustmentValue = Number(formValue.adjustmentValue);

    // VALIDATION: Check if increase would exceed maximum price
    if (formValue.adjustmentDirection === 'increase') {
      const wouldExceedMax = this.checkIfIncreaseWouldExceedMax(
        formValue.adjustmentType,
        adjustmentValue
      );

      if (wouldExceedMax.hasExceeded) {
        const errorMsg = formValue.adjustmentType === 'percentage'
          ? `Increase of ${adjustmentValue}% would result in price exceeding maximum ($999,999.99) for some products. ` +
            `Highest current price: $${wouldExceedMax.highestPrice?.toFixed(2)}`
          : `Increase amount ($${adjustmentValue.toFixed(2)}) would cause the highest current price ` +
            `($${wouldExceedMax.highestPrice?.toFixed(2)}) to exceed maximum ($999,999.99). Please enter a smaller amount.`;

        // Show error in snackbar
        this.snackBar.open(errorMsg, 'DISMISS', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        return;  // Stop execution
      }
    }

    // REMOVED: Negative price prevention to allow legacy parity
    // The adjustment field stays positive (user enters "50" and selects "Decrease")
    // But now the RESULTING price can go below zero (e.g., $25 - $50 = -$25)

    // Proceed with calculation (remove Math.max capping)
    const updatedProducts = this.data.selectedProducts.map(product => {
      const currentPrice = product.price || 0;
      let newPrice = currentPrice;

      if (formValue.adjustmentType === 'percentage') {
        const percentageChange = adjustmentValue / 100;
        if (formValue.adjustmentDirection === 'increase') {
          newPrice = currentPrice * (1 + percentageChange);
        } else {
          newPrice = currentPrice * (1 - percentageChange);
        }
      } else {
        // amount
        if (formValue.adjustmentDirection === 'increase') {
          newPrice = currentPrice + adjustmentValue;
        } else {
          newPrice = currentPrice - adjustmentValue;
        }
      }

      // Allow negative prices - removed Math.max(0) capping
      return {
        ...product,
        price: Number(newPrice.toFixed(2))
      };
    });

    this.dialogRef.close(updatedProducts);
  }

  /**
   * Checks if increase adjustment would result in price exceeding maximum
   */
  private checkIfIncreaseWouldExceedMax(
    adjustmentType: string,
    adjustmentValue: number
  ): { hasExceeded: boolean; highestPrice: number | null } {
    const MAX_PRICE = 999999.99;
    let highestPrice: number | null = null;
    let wouldExceedMax = false;

    for (const product of this.data.selectedProducts) {
      const currentPrice = product.price || 0;

      // Track highest price
      if (highestPrice === null || currentPrice > highestPrice) {
        highestPrice = currentPrice;
      }

      let newPrice = currentPrice;

      if (adjustmentType === 'percentage') {
        const percentageChange = adjustmentValue / 100;
        newPrice = currentPrice * (1 + percentageChange);
      } else {
        // amount
        newPrice = currentPrice + adjustmentValue;
      }

      if (newPrice > MAX_PRICE) {
        wouldExceedMax = true;
        break;  // Found at least one exceeding max
      }
    }

    return { hasExceeded: wouldExceedMax, highestPrice };
  }

  getAdjustmentValueLabel(): string {
    const adjustmentType = this.form.get('adjustmentType')?.value;
    return adjustmentType === 'percentage' ? 'Percentage (%)' : 'Amount ($)';
  }

  getAdjustmentValuePlaceholder(): string {
    const adjustmentType = this.form.get('adjustmentType')?.value;
    if (!adjustmentType) {
      return 'Enter value';
    }
    return adjustmentType === 'percentage' ? 'e.g., 25' : 'e.g., 10.00';
  }

  /**
   * Enhanced version: prevents dots and spaces from causing issues
   * Prevent invalid price input characters (only allow digits, one decimal point, and at most 2 decimal places)
   * @param event Keyboard event
   */
  preventInvalidPriceInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const key = event.key;

    // ✅ FIX Bug #7: Prevent spaces entirely
    if (key === ' ') {
      event.preventDefault();
      return;
    }

    // Allow only digits and decimal point
    if (!/^[0-9.]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple decimal points
    if (key === '.' && currentValue.includes('.')) {
      event.preventDefault();
      return;
    }

    // If there's already a decimal point, check decimal places
    if (currentValue.includes('.')) {
      const parts = currentValue.split('.');
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      // If cursor is after decimal and there are already 2 decimal places
      if (selectionStart > currentValue.indexOf('.') && parts[1].length >= 2 && selectionStart === selectionEnd) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Prevent invalid paste for price
   * @param event Clipboard event
   */
  preventInvalidPricePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';

    // Check if pasted text is a valid number with at most 2 decimal places
    if (!/^\d+(\.\d{0,2})?$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
