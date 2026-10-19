import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { BasePasswordChildComponent } from '../base-password-child.component';

@Component({
  standalone: true,
  selector: 'app-security-policies',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './security-policies.html',
  styleUrls: ['./security-policies.scss']
})
export class SecurityPolicies extends BasePasswordChildComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(cc: ControlContainer) {
    super(cc);
  }

  ngOnInit(): void {
    this.setupToggleInputSync();
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
    // Account lockout toggle -> failedLoginAttempts input
    this.group.get('enableAccountLockout')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const ctrl = this.group.get('failedLoginAttempts');
        if (enabled) {
          ctrl?.enable();
        } else {
          ctrl?.setValue(null);  // Clear to null when disabled
          ctrl?.disable();
        }
      });

    // Password history toggle -> passwordHistoryCount input
    this.group.get('enablePasswordHistory')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const ctrl = this.group.get('passwordHistoryCount');
        if (enabled) {
          ctrl?.enable();
        } else {
          ctrl?.setValue(null);  // Clear to null when disabled
          ctrl?.disable();
        }
      });

    // Set initial state based on current toggle values
    const enableAccountLockout = this.group.get('enableAccountLockout')?.value;
    const enablePasswordHistory = this.group.get('enablePasswordHistory')?.value;

    if (!enableAccountLockout) {
      this.group.get('failedLoginAttempts')?.setValue(null);
      this.group.get('failedLoginAttempts')?.disable();
    }
    if (!enablePasswordHistory) {
      this.group.get('passwordHistoryCount')?.setValue(null);
      this.group.get('passwordHistoryCount')?.disable();
    }
  }

  /**
   * Check if chars to change exceeds minimum length
   * This would prevent password validation since change diff can't exceed total length
   */
  showCharsDifferenceError(): boolean {
    return this.checkParentError('charsDifference');
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
}
