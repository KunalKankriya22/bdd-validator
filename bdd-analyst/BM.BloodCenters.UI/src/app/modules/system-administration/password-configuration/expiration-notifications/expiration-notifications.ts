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
  selector: 'app-expiration-notifications',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './expiration-notifications.html',
  styleUrls: ['./expiration-notifications.scss']
})
export class ExpirationNotifications extends BasePasswordChildComponent implements OnInit, OnDestroy {
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
    // Password expiration toggle -> passwordValidityDays and warningNoticeDays inputs
    this.group.get('enablePasswordExpiration')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const validityCtrl = this.group.get('passwordValidityDays');
        const warningCtrl = this.group.get('warningNoticeDays');
        if (enabled) {
          validityCtrl?.enable();
          warningCtrl?.enable();
        } else {
          validityCtrl?.setValue(null);  // Clear to null when disabled
          validityCtrl?.disable();
          warningCtrl?.setValue(null);  // Clear to null when disabled
          warningCtrl?.disable();
        }
      });

    // Set initial state based on current toggle value
    const enablePasswordExpiration = this.group.get('enablePasswordExpiration')?.value;
    if (enablePasswordExpiration) {
      this.group.get('passwordValidityDays')?.enable();
      this.group.get('warningNoticeDays')?.enable();
    } else {
      this.group.get('passwordValidityDays')?.setValue(null);
      this.group.get('passwordValidityDays')?.disable();
      this.group.get('warningNoticeDays')?.setValue(null);
      this.group.get('warningNoticeDays')?.disable();
    }
  }

  /**
   * Check if expiry warning validation has errors
   * Warning notice days must be < password validity period
   */
  showExpiryWarningError(): boolean {
    return this.checkParentError('expiryWarning');
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
