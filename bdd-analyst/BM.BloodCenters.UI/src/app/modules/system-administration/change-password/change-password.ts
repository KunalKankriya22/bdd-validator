import { Component, inject, OnInit, OnDestroy, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderService } from '../../../shared/services/header.service';
import { ChangePasswordService, PasswordConfiguration } from './services/change-password.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoginService } from '../../../shared/services/login.service';
import { PasswordResetTimerService } from '../../../shared/services/password-reset-timer.service';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertComponent
  ],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.scss']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ChangePasswordComponent>);
  public headerService = inject(HeaderService);
  private changePasswordService = inject(ChangePasswordService);
  private snackbarService = inject(SnackbarService);
  private loginService = inject(LoginService);
  private passwordResetTimerService = inject(PasswordResetTimerService);
  private destroy$ = new Subject<void>();

  changePasswordForm!: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  currentPasswordError = '';
  passwordHistoryError = '';
  isLoadingConfig = true;
  isSubmitting = false;
  isMandatory = false; // Indicates if password change is mandatory
  isStrongPasswordRequired = false; // Indicates if strong password configuration is required
  requireStartsWithAlpha = false; // Traditional password: must start with alphabetic character

  newPasswordErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control) =>
      !!(control?.touched && (control.hasError('required') || control.hasError('insufficientCharChanges') || control.hasError('passwordHistory')))
  };

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { isMandatory?: boolean; isStrongPasswordRequired?: boolean }
  ) {
    this.isMandatory = data?.isMandatory ?? false;
    this.isStrongPasswordRequired = data?.isStrongPasswordRequired ?? false;
  }

  /**
   * Get the current user's display information
   */
  get currentUserName(): string {
    return this.headerService.headerConfig().user?.name || this.loginService.getStoredUsername();
  }

  get currentUserId(): string {
    return this.headerService.headerConfig().user?.id || this.loginService.getStoredUsername();
  }

  // Password configuration from API - using secure defaults
  passwordConfig: PasswordConfiguration | null = null;
  pwd_Min_Length = 8;
  pwd_Min_Caps = 0;
  pwd_Min_Lower = 0;
  pwd_Min_Number = 0;
  pwd_Min_Special = 0;
  pwd_Min_Char_Chg = 0;
  pwd_History = 0;
  pwd_Special = "";
  pwd_Min_Alpha = 0; // For traditional password: at least 1 alpha (upper OR lower)

  ngOnInit(): void {
    // Create form without password validator initially to avoid race condition
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]], // Validator added after config loads
      confirmPassword: ['', [Validators.required]]
    }, { validators: [this.passwordMatchValidator, this.passwordNotSameValidator, this.minimumCharacterChangesValidator] });

    // Re-validate when current password changes to trigger character change validation
    this.changePasswordForm.get('currentPassword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.currentPasswordError) {
          this.currentPasswordError = '';
        }
        this.changePasswordForm.get('newPassword')?.updateValueAndValidity({ emitEvent: false });
      });

    // Clear password history error when user types in new password
    this.changePasswordForm.get('newPassword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.passwordHistoryError) {
          this.passwordHistoryError = '';
          const control = this.changePasswordForm.get('newPassword');
          if (control?.hasError('passwordHistory')) {
            const errors = { ...control.errors };
            delete errors['passwordHistory'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      });

    // Load password configuration and add validator after it loads
    this.loadPasswordConfiguration();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load password configuration
   * If isStrongPasswordRequired = true: Call API to get configuration
   * If isStrongPasswordRequired = false: Use traditional predefined rules
   * Otherwise: Call API as fallback
   */
  loadPasswordConfiguration(): void {
    // Check if isStrongPasswordRequired is defined from cookies
    if (this.data?.isStrongPasswordRequired !== undefined || this.isMandatory) {
      const isStrong = this.isStrongPasswordRequired;

      if (isStrong) {
        // Strong password is required: Call API to get the actual configuration
        this.changePasswordService.getPasswordConfiguration().subscribe({
          next: (config) => {
            this.passwordConfig = config;
            // Use actual values from API response
            this.pwd_Min_Length = config.pwd_Min_Length ?? 8;
            this.pwd_Min_Caps = config.pwd_Min_Caps ?? 0;
            this.pwd_Min_Lower = config.pwd_Min_Lower ?? 0;
            this.pwd_Min_Number = config.pwd_Min_Number ?? 0;
            this.pwd_Min_Special = config.pwd_Min_Special ?? 0;
            this.pwd_Min_Char_Chg = config.pwd_Min_Char_Chg ?? 0;
            this.pwd_History = config.pwd_History ?? 0;
            this.pwd_Special = config.pwd_Special || "";
            this.pwd_Min_Alpha = 0; // Not used for strong password
            this.requireStartsWithAlpha = false; // Not used for strong password

            // Add password validator now that configuration is loaded
            this.addPasswordValidator();
            this.isLoadingConfig = false;
          },
          error: (error) => {
            console.error('Failed to load password configuration:', error);
            // Use traditional password as fallback if API fails
            this.applyTraditionalPasswordRules();

            this.isLoadingConfig = false;
          }
        });
      } else {
        // Traditional password: Use predefined rules
        this.applyTraditionalPasswordRules();
        this.isLoadingConfig = false;
      }
      return;
    }

    // Fallback: Load from API for regular password changes (when cookies are not available)
    this.changePasswordService.getPasswordConfiguration().subscribe({
      next: (config) => {
        this.passwordConfig = config;
        // Use actual values from config, including 0 for disabled requirements
        this.pwd_Min_Length = config.pwd_Min_Length ?? 8;
        this.pwd_Min_Caps = config.pwd_Min_Caps ?? 0;
        this.pwd_Min_Lower = config.pwd_Min_Lower ?? 0;
        this.pwd_Min_Number = config.pwd_Min_Number ?? 0;
        this.pwd_Min_Special = config.pwd_Min_Special ?? 0;
        this.pwd_Min_Char_Chg = config.pwd_Min_Char_Chg ?? 0;
        this.pwd_History = config.pwd_History ?? 0;
        this.pwd_Special = config.pwd_Special || "";
        this.requireStartsWithAlpha = false; // Not used when loading from API

        // Add password validator now that configuration is loaded
        this.addPasswordValidator();
        this.isLoadingConfig = false;
      },
      error: (error) => {
        console.error('Failed to load password configuration:', error);

        // Use traditional password as fallback
        this.applyTraditionalPasswordRules();

        // Notify user that defaults are being used


        this.isLoadingConfig = false;
      }
    });
  }

  /**
   * Apply traditional password rules
   * Traditional: 6-50 chars, 1 alpha, 1 numeric
   */
  private applyTraditionalPasswordRules(): void {
    this.pwd_Min_Length = 6;
    this.pwd_Min_Caps = 0; // Not specifically required
    this.pwd_Min_Lower = 0; // Not specifically required
    this.pwd_Min_Alpha = 1; // At least 1 alpha character (upper OR lower)
    this.pwd_Min_Number = 1; // At least 1 numeric
    this.pwd_Min_Special = 0; // Not required for traditional
    this.requireStartsWithAlpha = true; // Traditional: must start with alpha
    this.pwd_Min_Char_Chg = 0;
    this.pwd_History = 0;
    this.pwd_Special = "";

    // Add password validator with the traditional rules
    this.addPasswordValidator();
  }

  /**
   * Add password validator to form after configuration is loaded
   * This prevents race condition where validator runs with default values
   */
  private addPasswordValidator(): void {
    const newPasswordControl = this.changePasswordForm.get('newPassword');
    if (newPasswordControl) {
      newPasswordControl.setValidators([
        Validators.required,
        this.passwordValidator.bind(this)
      ]);
      newPasswordControl.updateValueAndValidity();
      // Re-trigger form-level validators
      this.changePasswordForm.updateValueAndValidity();
    }
  }

  /**
   * Custom validator for password requirements
   * Only validates requirements that are enabled (> 0)
   */
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    // Length validation (always required)
    if (value.length < this.pwd_Min_Length || value.length > 50) {
      errors['lengthInvalid'] = true;
    }

    // Starts with alpha validation (traditional password only)
    if (this.requireStartsWithAlpha) {
      if (!/^[A-Za-z]/.test(value)) {
        errors['startsWithAlpha'] = true;
      }
    }

    // Alpha characters validation (for traditional password: at least 1 alpha - upper OR lower)
    if (this.pwd_Min_Alpha > 0) {
      const alphaCount = (value.match(/[A-Za-z]/g) || []).length;
      if (alphaCount < this.pwd_Min_Alpha) {
        errors['insufficientAlpha'] = true;
      }
    }

    // Uppercase characters validation (only if required)
    if (this.pwd_Min_Caps > 0) {
      const upperCaseCount = (value.match(/[A-Z]/g) || []).length;
      if (upperCaseCount < this.pwd_Min_Caps) {
        errors['insufficientUppercase'] = true;
      }
    }

    // Lowercase characters validation (only if required)
    if (this.pwd_Min_Lower > 0) {
      const lowerCaseCount = (value.match(/[a-z]/g) || []).length;
      if (lowerCaseCount < this.pwd_Min_Lower) {
        errors['insufficientLowercase'] = true;
      }
    }

    // Number validation (only if required)
    if (this.pwd_Min_Number > 0) {
      const numberCount = (value.match(/\d/g) || []).length;
      if (numberCount < this.pwd_Min_Number) {
        errors['insufficientNumbers'] = true;
      }
    }

    // Special characters validation (only if required)
    if (this.pwd_Min_Special > 0 && this.pwd_Special) {
      const specialChars = this.pwd_Special;
      const escapedSpecialChars = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const specialRegex = new RegExp(`[${escapedSpecialChars}]`, 'g');
      const specialCount = (value.match(specialRegex) || []).length;
      if (specialCount < this.pwd_Min_Special) {
        errors['insufficientSpecialChars'] = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const confirmControl = control.get('confirmPassword');

    if (confirmPassword && newPassword !== confirmPassword) {
      // Merge with existing errors instead of overwriting
      const existingErrors = confirmControl?.errors || {};
      confirmControl?.setErrors({ ...existingErrors, passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear only the passwordMismatch error if passwords match
    if (confirmControl?.hasError('passwordMismatch') && newPassword === confirmPassword) {
      const errors = { ...confirmControl.errors };
      delete errors['passwordMismatch'];
      confirmControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return null;
  }

  /**
   * Custom validator to ensure new password is different from current password
   */
  passwordNotSameValidator(control: AbstractControl): ValidationErrors | null {
    const currentPassword = control.get('currentPassword')?.value;
    const newPassword = control.get('newPassword')?.value;
    const newPasswordControl = control.get('newPassword');

    if (currentPassword && newPassword && currentPassword === newPassword) {
      // Merge with existing errors instead of overwriting
      const existingErrors = newPasswordControl?.errors || {};
      newPasswordControl?.setErrors({ ...existingErrors, passwordSameAsCurrent: true });
      return { passwordSameAsCurrent: true };
    }

    // Clear only the passwordSameAsCurrent error if passwords are different
    if (newPasswordControl?.hasError('passwordSameAsCurrent') && currentPassword !== newPassword) {
      const errors = { ...newPasswordControl.errors };
      delete errors['passwordSameAsCurrent'];
      newPasswordControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return null;
  }

  /**
   * Custom validator to ensure new password has minimum character changes from current password
   */
  minimumCharacterChangesValidator = (control: AbstractControl): ValidationErrors | null => {
    const currentPassword = control.get('currentPassword')?.value;
    const newPassword = control.get('newPassword')?.value;
    const newPasswordControl = control.get('newPassword');

    // Only validate if both passwords exist and pwd_Min_Char_Chg is configured
    if (!currentPassword || !newPassword || this.pwd_Min_Char_Chg <= 0) {
      // Clear only the insufficientCharChanges error if not applicable
      if (newPasswordControl?.hasError('insufficientCharChanges')) {
        const errors = { ...newPasswordControl.errors };
        delete errors['insufficientCharChanges'];
        newPasswordControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
    }

    // Count how many characters are different between old and new password
    let changedChars = 0;
    const maxLength = Math.max(currentPassword.length, newPassword.length);

    // Count positional differences
    for (let i = 0; i < maxLength; i++) {
      if (currentPassword[i] !== newPassword[i]) {
        changedChars++;
      }
    }

    // Check if minimum character changes requirement is met
    if (changedChars < this.pwd_Min_Char_Chg) {
      // Merge with existing errors instead of overwriting
      const existingErrors = newPasswordControl?.errors || {};
      const newErrors = { ...existingErrors, insufficientCharChanges: true };
      newPasswordControl?.setErrors(newErrors);
      return { insufficientCharChanges: true };
    }

    // Clear only the insufficientCharChanges error if requirement is met
    if (newPasswordControl?.hasError('insufficientCharChanges')) {
      const errors = { ...newPasswordControl.errors };
      delete errors['insufficientCharChanges'];
      newPasswordControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return null;
  }

  /**
   * Check if a specific validation rule is met
   */
  isValidationMet(rule: string): boolean {
    const newPasswordControl = this.changePasswordForm?.get('newPassword');
    if (!newPasswordControl || !newPasswordControl.value) {
      return false;
    }

    const value = newPasswordControl.value;
    const errors = newPasswordControl.errors;

    switch (rule) {
      case 'length':
        return !errors || !errors['lengthInvalid'];
      case 'startsWithAlpha':
        return !errors || !errors['startsWithAlpha'];
      case 'alpha':
        return !errors || !errors['insufficientAlpha'];
      case 'uppercase':
        return !errors || !errors['insufficientUppercase'];
      case 'lowercase':
        return !errors || !errors['insufficientLowercase'];
      case 'number':
        return !errors || !errors['insufficientNumbers'];
      case 'special':
        return !errors || !errors['insufficientSpecialChars'];
      case 'charChanges':
        return !errors || !errors['insufficientCharChanges'];
      default:
        return false;
    }
  }

  /**
   * Check if passwords match
   */
  get passwordsMatch(): boolean {
    const newPassword = this.changePasswordForm?.get('newPassword')?.value;
    const confirmPassword = this.changePasswordForm?.get('confirmPassword')?.value;
    return newPassword === confirmPassword && confirmPassword !== '';
  }

  /**
   * Check if confirm password has been touched and doesn't match
   */
  get showPasswordMismatchError(): boolean {
    const confirmControl = this.changePasswordForm?.get('confirmPassword');
    return !!(confirmControl?.dirty && confirmControl?.hasError('passwordMismatch'));
  }

  /**
   * Check if new password is the same as current password
   */
  get showPasswordSameAsCurrentError(): boolean {
    const newPasswordControl = this.changePasswordForm?.get('newPassword');
    return !!(newPasswordControl?.touched && newPasswordControl?.hasError('passwordSameAsCurrent'));
  }

  /**
   * Check if new password has insufficient character changes from current password
   */
  get showInsufficientCharChangesError(): boolean {
    const newPasswordControl = this.changePasswordForm?.get('newPassword');
    return !!(newPasswordControl?.touched && newPasswordControl?.hasError('insufficientCharChanges'));
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.changePasswordForm.valid && !this.isSubmitting) {
      const formValue = this.changePasswordForm.value;

      // Try to get userId from header service first, then fall back to stored username
      let userId = this.headerService.headerConfig().user?.id;

      if (!userId) {
        // For mandatory password change after login, header service may not be populated yet
        userId = this.loginService.getStoredUsername();
      }

      if (!userId) {
        return;
      }

      // Clear previous errors
      this.currentPasswordError = '';
      this.isSubmitting = true;

      const request = {
        userId: userId,
        oldPassword: formValue.currentPassword,
        newPassword: formValue.newPassword
      };

      this.changePasswordService.updatePassword(request).subscribe({
        next: (response) => {
          this.isSubmitting = false;

          // Check if isMatch is false in the response
          if (response.data && response.data.length > 0 && response.data[0].isMatch === false) {
            this.currentPasswordError = 'Incorrect Password';
            this.changePasswordForm.get('currentPassword')?.setErrors({ serverError: true });
            return;
          }

          // Clear any active password reset timer for this user
          this.passwordResetTimerService.clearTimer(userId);

          this.snackbarService.showSuccess('Password changed successfully!');
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error) => {
          this.isSubmitting = false;

          const serverMessage = error?.error?.message
            || error?.error?.error
            || 'Failed to change password. Please try again.';

          this.passwordHistoryError = serverMessage;
          const control = this.changePasswordForm.get('newPassword');
          const existingErrors = control?.errors || {};
          control?.setErrors({ ...existingErrors, passwordHistory: true });
        }
      });
    }
  }

  /**
   * Strips spaces in all flows. In strong password mode, also strips characters
   * not in [a-zA-Z0-9] + allowed special chars (pwd_Special).
   */
  onPasswordInput(event: Event, controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): void {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/ /g, '');

    if (this.isStrongPasswordRequired && this.pwd_Special) {
      const escapedSpecial = this.pwd_Special.replace(/[-[\]\\^]/g, '\\$&');
      const allowed = new RegExp(`[^a-zA-Z0-9${escapedSpecial}]`, 'g');
      sanitized = sanitized.replace(allowed, '');
    }

    if (sanitized !== input.value) {
      input.value = sanitized;
      this.changePasswordForm.get(controlName)?.setValue(sanitized, { emitEvent: true });
    }
  }

  onNewPasswordBlur(): void {
    const newPassword = this.changePasswordForm.get('newPassword')?.value;
    const userId = this.currentUserId;
    if (!newPassword || !userId) return;

    this.changePasswordService.validatePasswordHistory({ userId, newPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const result = response?.data?.[0];
          if (result && !result.isValid) {
            const count = result.pwdHistoryCount;
            this.passwordHistoryError = `Your password must not match any of your last ${count} password${count > 1 ? 's' : ''}.`;
            const control = this.changePasswordForm.get('newPassword');
            const existingErrors = control?.errors || {};
            control?.setErrors({ ...existingErrors, passwordHistory: true });
          }
        }
      });
  }

  /**
   * Cancel and close dialog
   * Only allowed if not mandatory
   */
  onCancel(): void {
    if (!this.isMandatory) {
      this.dialogRef.close();
    }
  }
}
