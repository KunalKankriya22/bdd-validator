import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

/**
 * Create New Box Dialog Data Interface
 */
export interface CreateNewBoxDialogData {
  currentBoxId: string | null;
  hasPackedProducts: boolean;
  dialogTitle?: string;
  showCurrentBoxInfo?: boolean;
  validationMessage?: string;
  confirmButtonText?: string;
}

/**
 * Create New Box Dialog Result Interface
 */
export interface CreateNewBoxDialogResult {
  closeCurrentBox: boolean;
  allProperlyPacked: boolean;
}

/**
 * Create New Box Dialog Component
 * Dialog for creating a new packing box with validation
 */
@Component({
  selector: 'app-create-new-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule
  ],
  templateUrl: './create-new-box-dialog.html',
  styleUrl: './create-new-box-dialog.scss'
})
export class CreateNewBoxDialogComponent {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `create-new-box-dialog-${CreateNewBoxDialogComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  readonly data = inject<CreateNewBoxDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CreateNewBoxDialogComponent>);

  protected readonly dialogTitle = signal(this.data.dialogTitle || 'Create New Box');
  protected readonly showBoxInfo = signal(this.data.showCurrentBoxInfo !== false);
  private readonly customValidationMessage = this.data.validationMessage;

  // Signal-based state
  protected readonly closeCurrentBox = signal<boolean | null>(null);
  protected readonly allProperlyPacked = signal<boolean | null>(null);
  protected readonly validationError = signal<string | null>(null);

  /**
   * Check if form is valid
   * Both questions must be answered
   */
  protected isValid(): boolean {
    if (this.closeCurrentBox() === null || this.allProperlyPacked() === null) {
      return false;
    }

    // Validation: Cannot close box if not all products properly packed
    if (this.closeCurrentBox() === true && this.allProperlyPacked() === false) {
      return false;
    }

    return true;
  }

  /**
   * Handle close box selection change
   */
  protected onCloseBoxChange(value: boolean): void {
    this.closeCurrentBox.set(value);
    this.updateValidation();
  }

  /**
   * Handle properly packed selection change
   */
  protected onProperlyPackedChange(value: boolean): void {
    this.allProperlyPacked.set(value);
    this.updateValidation();
  }

  /**
   * Update validation messages
   */
  private updateValidation(): void {
    // Clear previous errors
    this.validationError.set(null);

    // Check if trying to close box when products not properly packed
    if (this.closeCurrentBox() === true && this.allProperlyPacked() === false) {
      this.validationError.set(
        this.customValidationMessage || 'Current box cannot be closed if it is not packed properly.'
      );
    }
  }

  /**
   * Handle create button click
   */
  protected onCreate(): void {
    if (!this.isValid()) {
      if (this.closeCurrentBox() === null || this.allProperlyPacked() === null) {
        this.validationError.set('Please answer both questions before proceeding');
      }
      return;
    }

    const result: CreateNewBoxDialogResult = {
      closeCurrentBox: this.closeCurrentBox() === true,
      allProperlyPacked: this.allProperlyPacked() === true
    };

    this.dialogRef.close(result);
  }

  /**
   * Handle cancel button click
   */
  protected onCancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Get display text for current box
   */
  protected getCurrentBoxDisplay(): string {
    return this.data.currentBoxId || 'No current box';
  }
}
