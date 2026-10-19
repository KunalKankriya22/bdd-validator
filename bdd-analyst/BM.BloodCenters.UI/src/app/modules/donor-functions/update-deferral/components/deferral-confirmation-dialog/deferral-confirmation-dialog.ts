import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/**
 * Data interface for Deferral Confirmation Dialog
 */
export interface DeferralConfirmationDialogData {
  deferralId: string;
  donorId: string | null;
  donorName: string | null;
  driveDate: string | null;
}

/**
 * Result interface for Deferral Confirmation Dialog
 */
export interface DeferralConfirmationDialogResult {
  confirmed: boolean;
}

/**
 * Deferral Confirmation Dialog Component
 *
 * Implements double-entry confirmation as required by legacy Oracle Forms.
 * The user must re-enter the Deferral ID to confirm the update operation.
 * This prevents accidental updates to the wrong record (Error 16102 in legacy).
 *
 * @see Gap Analysis: Section 1.3 - Double-Entry Confirmation (CRITICAL GAP)
 */
@Component({
  selector: 'app-deferral-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">verified_user</mat-icon>
      Confirm Deferral Update
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="confirmation-info">
        <p class="instruction">
          To ensure you are updating the correct record, please re-enter the Deferral ID below.
        </p>

        <div class="record-details">
          <div class="detail-row">
            <span class="label">Deferral ID:</span>
            <span class="value highlight">{{ data.deferralId }}</span>
          </div>
          @if (data.donorId) {
            <div class="detail-row">
              <span class="label">Donor ID:</span>
              <span class="value">{{ data.donorId }}</span>
            </div>
          }
          @if (data.donorName) {
            <div class="detail-row">
              <span class="label">Donor Name:</span>
              <span class="value">{{ data.donorName }}</span>
            </div>
          }
          @if (data.driveDate) {
            <div class="detail-row">
              <span class="label">Drive Date:</span>
              <span class="value">{{ data.driveDate }}</span>
            </div>
          }
        </div>
      </div>

      <mat-form-field appearance="fill" class="confirm-field">
        <mat-label>Re-enter Deferral ID <span class="required">*</span></mat-label>
        <input
          matInput
          [formControl]="confirmDeferralIdControl"
          maxlength="15"
          placeholder="Enter Deferral ID to confirm"
          (keyup.enter)="onConfirm()"
          aria-required="true"
          [attr.aria-describedby]="hasError() ? 'confirm-error' : null">
        @if (confirmDeferralIdControl.hasError('required') && confirmDeferralIdControl.touched) {
          <mat-error id="confirm-error" role="alert">Deferral ID is required</mat-error>
        }
        @if (confirmDeferralIdControl.hasError('mismatch')) {
          <mat-error id="confirm-error" role="alert">
            Deferral ID does not match. Please verify and try again. (Error 16102)
          </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()" class="cancel-button">
        CANCEL
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onConfirm()"
        [disabled]="!canConfirm()"
        class="confirm-button">
        CONFIRM UPDATE
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 16px 24px;
      background-color: var(--mat-primary-50, #e3f2fd);
      border-bottom: 1px solid var(--mat-divider-color, #e0e0e0);
    }

    .title-icon {
      color: var(--mat-primary-500, #1976d2);
    }

    .dialog-content {
      padding: 24px;
      min-width: 400px;
    }

    .confirmation-info {
      margin-bottom: 24px;
    }

    .instruction {
      margin: 0 0 16px 0;
      color: var(--mat-text-secondary, #666);
      font-size: 14px;
    }

    .record-details {
      background-color: var(--mat-background-card, #fafafa);
      border: 1px solid var(--mat-divider-color, #e0e0e0);
      border-radius: 4px;
      padding: 12px 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .detail-row .label {
      font-weight: 500;
      color: var(--mat-text-secondary, #666);
    }

    .detail-row .value {
      color: var(--mat-text-primary, #333);
    }

    .detail-row .value.highlight {
      font-weight: 600;
      color: var(--mat-primary-700, #1565c0);
    }

    .confirm-field {
      width: 100%;
    }

    .required {
      color: var(--mat-warn-500, #f44336);
    }

    .dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }

    .cancel-button {
      color: var(--mat-text-secondary, #666);
    }
  `]
})
export class DeferralConfirmationDialogComponent {
  readonly data = inject<DeferralConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DeferralConfirmationDialogComponent>);

  confirmDeferralIdControl = new FormControl('', [Validators.required]);

  hasError = computed(() =>
    this.confirmDeferralIdControl.hasError('required') ||
    this.confirmDeferralIdControl.hasError('mismatch')
  );

  canConfirm = signal(false);

  constructor() {
    // Watch for changes to enable/disable confirm button
    this.confirmDeferralIdControl.valueChanges.subscribe(value => {
      this.canConfirm.set(!!value && value.trim().length > 0);
      // Clear mismatch error when user types
      if (this.confirmDeferralIdControl.hasError('mismatch')) {
        this.confirmDeferralIdControl.setErrors(null);
      }
    });
  }

  onConfirm(): void {
    if (!this.confirmDeferralIdControl.value) {
      this.confirmDeferralIdControl.markAsTouched();
      return;
    }

    const enteredId = this.confirmDeferralIdControl.value.trim().toUpperCase();
    const expectedId = this.data.deferralId.trim().toUpperCase();

    if (enteredId !== expectedId) {
      // Error 16102: Deferral ID mismatch
      this.confirmDeferralIdControl.setErrors({ mismatch: true });
      return;
    }

    this.dialogRef.close({ confirmed: true } as DeferralConfirmationDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false } as DeferralConfirmationDialogResult);
  }
}
