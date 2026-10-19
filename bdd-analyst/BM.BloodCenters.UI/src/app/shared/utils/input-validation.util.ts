/**
 * Utility functions for input validation and sanitization
 * Reusable across all components to maintain consistent input behavior
 */

import { AbstractControl } from '@angular/forms';

export class InputValidationUtil {
  /**
   * Prevents leading spaces and multiple consecutive spaces in text input
   * Call this on (keydown) event for text fields
   *
   * @param event - The keyboard event
   * @param control - The form control or value string
   * @returns void
   *
   * @example
   * ```html
   * <input
   *   formControlName="comment"
   *   (keydown)="preventLeadingAndMultipleSpaces($event, form.get('comment')!)"
   * />
   * ```
   */
  static preventLeadingAndMultipleSpaces(
    event: KeyboardEvent,
    control: AbstractControl | string
  ): void {
    if (event.key === ' ' || event.code === 'Space') {
      const currentValue = typeof control === 'string' ? control : (control.value || '');

      // Prevent space at the beginning
      if (currentValue.length === 0) {
        event.preventDefault();
        return;
      }

      // Prevent multiple consecutive spaces
      if (currentValue.endsWith(' ')) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Trims trailing spaces from a field value on blur
   * Call this on (blur) event for text fields
   *
   * @param control - The form control to trim
   * @returns void
   *
   * @example
   * ```html
   * <input
   *   formControlName="comment"
   *   (blur)="trimTrailingSpaces(form.get('comment')!)"
   * />
   * ```
   */
  static trimTrailingSpaces(control: AbstractControl): void {
    const value = control.value;

    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control.setValue(trimmed);
      }
    }
  }

  /**
   * Prevents space input entirely (useful for date fields, codes, etc.)
   * Call this on (keydown) event
   *
   * @param event - The keyboard event
   * @returns void
   *
   * @example
   * ```html
   * <input
   *   matInput
   *   [matDatepicker]="picker"
   *   (keydown)="preventSpaceInput($event)"
   * />
   * ```
   */
  static preventSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  /**
   * Prevents all non-numeric input (useful for number-only fields)
   * Allows: digits, backspace, delete, arrow keys, tab
   *
   * @param event - The keyboard event
   * @returns void
   *
   * @example
   * ```html
   * <input
   *   type="text"
   *   formControlName="phoneNumber"
   *   (keydown)="preventNonNumeric($event)"
   * />
   * ```
   */
  static preventNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  /**
   * Validates that a string contains only alphanumeric characters
   *
   * @param value - The string to validate
   * @returns true if alphanumeric, false otherwise
   */
  static isAlphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9]*$/.test(value);
  }

  /**
   * Removes all whitespace from a string
   *
   * @param value - The string to clean
   * @returns String without any whitespace
   */
  static removeAllSpaces(value: string): string {
    return value.replace(/\s/g, '');
  }

  /**
   * Normalizes multiple spaces to single space
   *
   * @param value - The string to normalize
   * @returns String with normalized spaces
   */
  static normalizeSpaces(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
