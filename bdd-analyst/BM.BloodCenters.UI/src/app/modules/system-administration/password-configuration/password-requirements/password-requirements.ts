import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { BasePasswordChildComponent } from '../base-password-child.component';

@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './password-requirements.html',
  styleUrls: ['./password-requirements.scss']
})
export class PasswordRequirements extends BasePasswordChildComponent implements OnInit, OnChanges {
  private destroy$ = new Subject<void>();

  get minLengthValue(): number {
    return this.isStrongPasswordEnabled ? 15 : 6;
  }

  get minCharValue(): number {
    return this.isStrongPasswordEnabled ? 2 : 1;
  }

  constructor(cc: ControlContainer) {
    super(cc);
  }

  ngOnInit(): void {
    this.setupToggleInputSync();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isStrongPasswordEnabled'] && this.group) {
      this.updateValidators();
    }
  }

  private updateValidators(): void {
    const minLen = this.minLengthValue;
    const minChar = this.minCharValue;

    const lengthCtrl = this.group.get('minLength');
    lengthCtrl?.setValidators([Validators.required, Validators.min(minLen), Validators.max(50)]);
    lengthCtrl?.updateValueAndValidity();

    ['minUppers', 'minLowers', 'minNumeric', 'minSpecials'].forEach(field => {
      const ctrl = this.group.get(field);
      if (ctrl?.enabled) {
        ctrl.setValidators([Validators.required, Validators.min(minChar), Validators.max(50)]);
        ctrl.updateValueAndValidity();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup synchronization between toggle switches and their corresponding input fields
   * When toggle is ON, input field is enabled; when toggle is OFF, input field is disabled AND cleared
   */
  private setupToggleInputSync(): void {
    // Uppercase toggle -> minUppers input
    this.group.get('requireUpper')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const ctrl = this.group.get('minUppers');
        if (enabled) {
          ctrl?.enable();
          ctrl?.updateValueAndValidity();
          ctrl?.markAsTouched();
        } else {
          ctrl?.setValue(null);  // Clear to null when disabled
          ctrl?.disable();
        }
      });

    // Lowercase toggle -> minLowers input
    this.group.get('requireLower')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const ctrl = this.group.get('minLowers');
        if (enabled) {
          ctrl?.enable();
          ctrl?.updateValueAndValidity();
          ctrl?.markAsTouched();
        } else {
          ctrl?.setValue(null);  // Clear to null when disabled
          ctrl?.disable();
        }
      });

    // Numeric toggle -> minNumeric input
    this.group.get('requireNumeric')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const ctrl = this.group.get('minNumeric');
        if (enabled) {
          ctrl?.enable();
          ctrl?.updateValueAndValidity();
          ctrl?.markAsTouched();
        } else {
          ctrl?.setValue(null);  // Clear to null when disabled
          ctrl?.disable();
        }
      });

    // Special toggle -> minSpecials input only (allowedSpecialChars stays enabled)
    this.group.get('requireSpecial')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const minSpecialsCtrl = this.group.get('minSpecials');
        if (enabled) {
          minSpecialsCtrl?.enable();
          minSpecialsCtrl?.updateValueAndValidity();
          minSpecialsCtrl?.markAsTouched();
        } else {
          minSpecialsCtrl?.setValue(null);  // Clear to null when disabled
          minSpecialsCtrl?.disable();
        }
        // allowedSpecialChars remains enabled regardless of toggle state
      });

    // Set initial state based on current toggle values
    const requireUpper = this.group.get('requireUpper')?.value;
    const requireLower = this.group.get('requireLower')?.value;
    const requireNumeric = this.group.get('requireNumeric')?.value;
    const requireSpecial = this.group.get('requireSpecial')?.value;

    if (!requireUpper) {
      this.group.get('minUppers')?.setValue(null);
      this.group.get('minUppers')?.disable();
    }
    if (!requireLower) {
      this.group.get('minLowers')?.setValue(null);
      this.group.get('minLowers')?.disable();
    }
    if (!requireNumeric) {
      this.group.get('minNumeric')?.setValue(null);
      this.group.get('minNumeric')?.disable();
    }
    if (!requireSpecial) {
      this.group.get('minSpecials')?.setValue(null);
      this.group.get('minSpecials')?.disable();
      // allowedSpecialChars stays enabled regardless of toggle state
    }
  }

  /**
   * Check if total password length validator error exists
   * Show warning if sum of character requirements exceeds minimum length
   */
  showTotalLengthError(): boolean {
    return this.checkParentError('totalPasswordLength');
  }

  /**
   * Prevent invalid characters in numeric input fields
   * Blocks: e, E, +, -, . (scientific notation and signs)
   */
  preventInvalidChars(event: KeyboardEvent): void {
    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Get the error details for a specific field and error type
   * Returns the error object with details (not just a boolean)
   */
  getErrorDetails(fieldName: string, errorType: string): any {
    const field = this.group.get(fieldName);
    if (field && field.hasError(errorType) && (field.dirty || field.touched)) {
      return field.getError(errorType);
    }
    return null;
  }
}
