import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

export interface ValueValidationEvent {
  value: string;
  callback: (isValid: boolean, errorMessage?: string) => void;
}

/**
 * Reusable Value Chips Input Component
 * Allows users to add values as chips with Enter key support and validation
 */
@Component({
  selector: 'app-value-chips-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './value-chips-input.html',
  styleUrl: './value-chips-input.scss'
})
export class ValueChipsInputComponent implements OnInit {
  @Input() label = 'Value';
  @Input() placeholder = 'Value {index}';
  @Input() addButtonText = 'ADD';
  @Input() required = false;
  @Input() maxLength = 30;
  @Input() disabled = false;
  @Input() allowDuplicates = false;
  @Input() caseSensitive = false;
  @Input() values: string[] = [];

  @Output() valuesChange = new EventEmitter<string[]>();
  @Output() valueAdded = new EventEmitter<string>();
  @Output() valueRemoved = new EventEmitter<string>();
  @Output() validateValue = new EventEmitter<ValueValidationEvent>();

  currentValue = '';
  errorMessage = '';

  ngOnInit(): void {
    if (!this.values) {
      this.values = [];
    }
  }

  /**
   * Get dynamic placeholder based on number of values
   */
  getPlaceholder(): string {
    const index = this.values.length + 1;
    return this.placeholder.replace('{index}', index.toString());
  }

  /**
   * Check if value can be added
   */
  canAdd(): boolean {
    return !this.disabled && !!this.currentValue?.trim();
  }

  /**
   * Add value as chip
   */
  onAdd(): void {
    const value = this.currentValue?.trim();
    if (!value) {
      return;
    }

    this.errorMessage = '';

    // Check for duplicates
    if (!this.allowDuplicates) {
      const existingValue = this.caseSensitive
        ? this.values.find(v => v === value)
        : this.values.find(v => v.toLowerCase() === value.toLowerCase());

      if (existingValue) {
        this.errorMessage = 'This value has already been added';
        return;
      }
    }

    // Emit validation event if there are subscribers
    if (this.validateValue.observed) {
      this.validateValue.emit({
        value,
        callback: (isValid: boolean, errorMsg?: string) => {
          if (isValid) {
            this.addValue(value);
          } else {
            this.errorMessage = errorMsg || 'Invalid value';
          }
        }
      });
    } else {
      // No validation needed, add directly
      this.addValue(value);
    }
  }

  /**
   * Add value to the list
   */
  private addValue(value: string): void {
    this.values.push(value);
    this.currentValue = '';
    this.errorMessage = '';
    this.valuesChange.emit(this.values);
    this.valueAdded.emit(value);
  }

  /**
   * Remove value from chips
   */
  onRemove(index: number): void {
    if (index >= 0 && index < this.values.length) {
      const removedValue = this.values[index];
      this.values.splice(index, 1);
      this.valuesChange.emit(this.values);
      this.valueRemoved.emit(removedValue);
    }
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    // Optional: Can be used for additional validation or cleanup
  }

  /**
   * Reset the component
   */
  reset(): void {
    this.values = [];
    this.currentValue = '';
    this.errorMessage = '';
    this.valuesChange.emit(this.values);
  }

  /**
   * Set error message from parent
   */
  setError(message: string): void {
    this.errorMessage = message;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorMessage = '';
  }
}
