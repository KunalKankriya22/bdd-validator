import { Component, signal, Inject, Optional, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResetPasswordService } from './reset-password.service';
import { PasswordResetTimerService } from '@shared/services/password-reset-timer.service';

@Component({
  selector: 'app-reset-password-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule,
  ],
  templateUrl: './reset-password-preview.html',
  styleUrls: ['./reset-password-preview.scss'],
})
export class ResetPasswordPreviewComponent implements OnInit {
  username: string;
  userEmail: string;
  userFullName: string;
  generated = '';
  isLoading = signal(false);
  isResetting = signal(false);
  private destroyRef = inject(DestroyRef);
  private passwordResetTimerService = inject(PasswordResetTimerService);

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { userId: string; email?: string; userFullName?: string } | null,
    @Optional() private dialogRef: MatDialogRef<ResetPasswordPreviewComponent> | null,
    private resetPasswordService: ResetPasswordService,
    private snackBar: MatSnackBar
  ) {
    this.username = data?.userId || '';
    this.userEmail = data?.email || '';
    this.userFullName = data?.userFullName || '';
  }

  ngOnInit(): void {
    // Validate that userId is provided
    if (!this.username) {
      this.snackBar.open('Error: No user ID provided for password reset', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      // Close dialog or navigate back if no userId
      if (this.dialogRef) {
        this.dialogRef.close();
      } else {
        history.back();
      }
      return;
    }

    // Generate temporary password on initialization
    this.generatePassword();
  }

  private generatePassword(): void {
    this.isLoading.set(true);

    this.resetPasswordService.generateTempPassword(this.username)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success && response.temporaryPassword) {
          this.generated = response.temporaryPassword;
        } else {
          this.snackBar.open(response.message || 'Failed to generate password', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.generateLocalPassword();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to generate temporary password from server', 'DISMISS', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.generateLocalPassword();
      }
    });
  }

  regenerate() {
    this.generatePassword();
  }

  private generateLocalPassword(): void {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const all = upper + lower + nums + special;
    const length = 12;

    // Helper function to get a secure random integer
    function secureRandomInt(max: number): number {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
    }

    // Build password ensuring at least one character from each set
    let pw = '';
    pw += upper[secureRandomInt(upper.length)];
    pw += lower[secureRandomInt(lower.length)];
    pw += nums[secureRandomInt(nums.length)];
    pw += special[secureRandomInt(special.length)];

    for (let i = 4; i < length; i++) {
        pw += all[secureRandomInt(all.length)];
    }

    // Shuffle the password securely
    const pwArray = pw.split('');
    for (let i = pwArray.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [pwArray[i], pwArray[j]] = [pwArray[j], pwArray[i]];
    }

    this.generated = pwArray.join('');
  }


  reset() {
    if (!this.userEmail) {
      this.snackBar.open('Cannot reset password: No email address on file', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!this.generated) {
      this.snackBar.open('Please wait for password generation to complete', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    this.isResetting.set(true);

    this.resetPasswordService.sendTempPassword(
      this.username,
      this.generated,
      this.userEmail,
      this.username,
      this.userFullName
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        this.isResetting.set(false);

        if (response.success) {
          // Start 24-hour timer
          this.passwordResetTimerService.startTimer(this.username);

          // Show success message
          this.snackBar.open(`The Password reset for ${this.username} ${this.userFullName} was successful.`, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          // Close dialog if opened as dialog
          if (this.dialogRef) {
            this.dialogRef.close({ success: true, userId: this.username });
          }
        } else {
          // Handle failure response
          this.snackBar.open(response.message || 'Password reset failed', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          // Close dialog with failure status
          if (this.dialogRef) {
            this.dialogRef.close({ success: false, userId: this.username });
          }
        }
      },
      error: (error) => {
        this.isResetting.set(false);
        this.snackBar.open(
          error.error?.message || 'Failed to send password reset email',
          'DISMISS',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  cancel() {
    // Close dialog if opened as dialog
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      history.back();
    }
  }
  pwdClicked = false;

onPwdClick() {
    this.pwdClicked = true;
    setTimeout(() => {
      this.pwdClicked = false; // remove grey after a short delay if you want
    }, 200);
  }

}
