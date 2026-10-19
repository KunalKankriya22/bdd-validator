import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { ROUTES } from '../../../core/constants/route.constants';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthService } from '../../../shared/services/auth.service';
import { ChangePasswordService, PasswordConfiguration } from '../../system-administration/change-password/services/change-password.service';
import { emailFormatValidator } from '../../../shared/validators/email.validator';
import { VALIDATION } from '../../../core/constants/validation.constants';

type ViewState = 'RESET_FORM' | 'SUCCESS' | 'TOKEN_EXPIRED';

@Component({
  standalone: true,
  selector: 'reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    AlertComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private changePasswordService = inject(ChangePasswordService);

  readonly VALIDATION = VALIDATION;
  readonly viewState = signal<ViewState>('RESET_FORM');
  readonly isLoading = signal(false);
  readonly isConfigLoading = signal(true);
  readonly configError = signal(false);
  readonly linkSent = signal(false);
  readonly serverError = signal(false);

  private token = '';

  // Password configuration (loaded from API — no defaults, must load successfully)
  passwordConfig: PasswordConfiguration | null = null;
  pwd_Min_Length = 0;
  pwd_Min_Caps = 0;
  pwd_Min_Lower = 0;
  pwd_Min_Number = 0;
  pwd_Min_Special = 0;
  pwd_Special = '';

  // Password visibility toggles
  hideNewPassword = true;
  hideConfirmPassword = true;

  // Reset password form
  readonly resetPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, this.passwordValidator.bind(this)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // Token-expired re-request form
  readonly resendForm = this.fb.nonNullable.group({
    email: ['', [
      Validators.required,
      Validators.email,
      emailFormatValidator(),
      Validators.minLength(VALIDATION.EMAIL.MIN_LENGTH)
    ]]
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.viewState.set('TOKEN_EXPIRED');
      return;
    }

    // Clear token from URL to prevent exposure in browser history
    if (this.route.snapshot.queryParamMap.has('token')) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }

    this.loadPasswordConfiguration();
  }

  loadPasswordConfiguration(): void {
    this.isConfigLoading.set(true);
    this.configError.set(false);

    this.changePasswordService.getPasswordConfiguration().subscribe({
      next: (config) => {
        this.passwordConfig = config;
        this.pwd_Min_Length = config.pwd_Min_Length;
        this.pwd_Min_Caps = config.pwd_Min_Caps;
        this.pwd_Min_Lower = config.pwd_Min_Lower;
        this.pwd_Min_Number = config.pwd_Min_Number;
        this.pwd_Min_Special = config.pwd_Min_Special;
        this.pwd_Special = config.pwd_Special;
        this.isConfigLoading.set(false);

        const newPasswordControl = this.resetPasswordForm.get('newPassword');
        if (newPasswordControl?.value) {
          newPasswordControl.updateValueAndValidity();
        }
      },
      error: (error) => {
        console.error('Failed to load password configuration:', error);
        this.isConfigLoading.set(false);
        this.configError.set(true);
      }
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const errors: ValidationErrors = {};

    // Length (from API config — no hardcoded max)
    if (value.length < this.pwd_Min_Length) {
      errors['lengthInvalid'] = true;
    }

    // Uppercase (from API config)
    if (this.pwd_Min_Caps > 0) {
      const upperCount = (value.match(/[A-Z]/g) || []).length;
      if (upperCount < this.pwd_Min_Caps) errors['insufficientUppercase'] = true;
    }

    // Lowercase (from API config)
    if (this.pwd_Min_Lower > 0) {
      const lowerCount = (value.match(/[a-z]/g) || []).length;
      if (lowerCount < this.pwd_Min_Lower) errors['insufficientLowercase'] = true;
    }

    // Numbers (from API config)
    if (this.pwd_Min_Number > 0) {
      const numberCount = (value.match(/\d/g) || []).length;
      if (numberCount < this.pwd_Min_Number) errors['insufficientNumbers'] = true;
    }

    // Special characters (from API config)
    if (this.pwd_Min_Special > 0) {
      const escaped = this.pwd_Special.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const specialCount = (value.match(new RegExp(`[${escaped}]`, 'g')) || []).length;
      if (specialCount < this.pwd_Min_Special) errors['insufficientSpecialChars'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (confirmPassword && newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    const confirmControl = control.get('confirmPassword');
    if (confirmControl?.hasError('passwordMismatch') && newPassword === confirmPassword) {
      confirmControl.setErrors(null);
    }

    return null;
  }

  isValidationMet(rule: string): boolean {
    const control = this.resetPasswordForm?.get('newPassword');
    if (!control || !control.value) return false;

    const errors = control.errors;

    switch (rule) {
      case 'length': return !errors || !errors['lengthInvalid'];
      case 'uppercase': return !errors || !errors['insufficientUppercase'];
      case 'lowercase': return !errors || !errors['insufficientLowercase'];
      case 'number': return !errors || !errors['insufficientNumbers'];
      case 'special': return !errors || !errors['insufficientSpecialChars'];
      default: return false;
    }
  }

  get showPasswordMismatchError(): boolean {
    const confirmControl = this.resetPasswordForm?.get('confirmPassword');
    return !!(confirmControl?.touched && confirmControl?.hasError('passwordMismatch'));
  }

  get emailError(): string {
    const control = this.resendForm.controls.email;

    if (control.hasError('userNotFound')) {
      return VALIDATION.EMAIL.MESSAGES.NOT_FOUND;
    }
    if (control.hasError('serverError')) {
      return VALIDATION.RESET_PASSWORD.MESSAGES.FAILED;
    }
    if (control.hasError('required')) {
      return VALIDATION.EMAIL.MESSAGES.REQUIRED;
    }
    if (control.hasError('email') || control.hasError('emailFormat')) {
      return VALIDATION.EMAIL.MESSAGES.INVALID;
    }
    if (control.hasError('minlength')) {
      return VALIDATION.EMAIL.MESSAGES.MIN_LENGTH;
    }
    return '';
  }

  onResetPassword(): void {
    this.resetPasswordForm.markAllAsTouched();

    if (this.resetPasswordForm.invalid) return;

    this.isLoading.set(true);
    this.serverError.set(false);
    const { newPassword, confirmPassword } = this.resetPasswordForm.value;

    this.authService.resetPasswordWithToken(this.token, newPassword!, confirmPassword!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.viewState.set('SUCCESS');
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.viewState.set('TOKEN_EXPIRED');
        } else {
          this.serverError.set(true);
        }
      }
    });
  }

  onSendResetLink(): void {
    this.resendForm.markAllAsTouched();

    if (this.resendForm.invalid) return;

    this.isLoading.set(true);
    const email = this.resendForm.value.email || '';

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.linkSent.set(true);
      },
      error: (error) => {
        this.isLoading.set(false);
        const control = this.resendForm.controls.email;
        control.markAsTouched();

        if (error.status === 404) {
          control.setErrors({ userNotFound: true });
        } else {
          control.setErrors({ serverError: true });
        }
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  hasError(fieldName: string): boolean {
    const control = this.resendForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
