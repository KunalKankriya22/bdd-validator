import { Component, computed, effect, inject, signal, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { UI, UI_META } from '../../../core/constants/ui.constants';
import { VALIDATION } from '../../../core/constants/validation.constants';
import { ROUTES } from '../../../core/constants/route.constants';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthService, ForgotPasswordResponse } from '../../../shared/services/auth.service';
import { emailFormatValidator } from '../../../shared/validators/email.validator';

type ViewState = 'EMAIL_ENTRY' | 'EMAIL_SENT' | 'ERROR';

@Component({
  standalone: true,
  selector: 'forgot-password',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    AlertComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly UI = UI;
  readonly UI_META = UI_META;

  readonly viewState = signal<ViewState>('EMAIL_ENTRY');
  readonly isLoading = signal<boolean>(false);
  readonly showSuccessAlert = signal<boolean>(true);
  private lastEmailValue = '';
  private alertTimeoutId: number | null = null;

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [
      Validators.required,
      Validators.email,
      emailFormatValidator(),
      Validators.minLength(VALIDATION.EMAIL.MIN_LENGTH)
    ]]
  });

  readonly emailControl = computed(() => this.forgotPasswordForm.controls.email);
  
  get emailError(): string {
    const control = this.forgotPasswordForm.controls.email;
    
    // Server-side errors (from API response)
    if (control.hasError('userNotFound')) {
      return VALIDATION.EMAIL.MESSAGES.NOT_FOUND;
    }
    
    if (control.hasError('serverError')) {
      return VALIDATION.FORGOT_PASSWORD.MESSAGES.FAILED;
    }
    
    // Client-side validation errors
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

  readonly hasFieldError = computed(() => {
    const control = this.emailControl();
    return control.invalid && control.touched;
  });

  @ViewChild('successAlert', { read: ElementRef }) successAlert?: ElementRef;

  constructor() {
    this.emailControl().valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((newValue) => {
        if (newValue === this.lastEmailValue) {
          return;
        }
        
        this.lastEmailValue = newValue || '';
        
        // Clear errors when user starts typing
        const control = this.emailControl();
        
        if (this.viewState() === 'ERROR') {
          // Clear server errors and reset to EMAIL_ENTRY state
          if (control.hasError('userNotFound') || control.hasError('serverError')) {
            control.setErrors(null);
            control.updateValueAndValidity();
            this.viewState.set('EMAIL_ENTRY');
          }
        }
        
        if (control.touched) {
          control.markAsUntouched();
        }
      });


    effect((onCleanup) => {
      if (this.viewState() === 'EMAIL_SENT') {
        queueMicrotask(() => {
          if (this.successAlert?.nativeElement) {
            this.successAlert.nativeElement.focus();
          }
        });
        
        // Clear any existing timeout before creating a new one
        if (this.alertTimeoutId !== null) {
          clearTimeout(this.alertTimeoutId);
        }
        
        // Auto-hide success message after 8 seconds
        this.alertTimeoutId = window.setTimeout(() => {
          if (this.viewState() === 'EMAIL_SENT') {
            this.showSuccessAlert.set(false);
          }
          this.alertTimeoutId = null;
        }, 8000);
        
        // Cleanup function to clear timeout when effect re-runs or component destroys
        onCleanup(() => {
          if (this.alertTimeoutId !== null) {
            clearTimeout(this.alertTimeoutId);
            this.alertTimeoutId = null;
          }
        });
      }
    });
  }

  onSubmit(): void {
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    const email = this.forgotPasswordForm.value.email || '';
    this.isLoading.set(true);
    
    this.authService.forgotPassword(email).subscribe({
      next: (response: ForgotPasswordResponse) => {
        this.isLoading.set(false);

        // Check if the response indicates failure (success: false)
        if (!response.success) {
          const control = this.forgotPasswordForm.controls.email;
          this.lastEmailValue = control.value || '';
          control.markAsTouched();

          this.viewState.set('ERROR');

          setTimeout(() => {
            // Set userNotFound error if user doesn't exist
            control.setErrors({ userNotFound: true });
            control.markAsTouched();
          }, 0);
          return;
        }

        // Success case - show success message
        this.showSuccessAlert.set(true);
        this.viewState.set('EMAIL_SENT');
      },
      error: (error: any) => {
        this.isLoading.set(false);

        const control = this.forgotPasswordForm.controls.email;
        this.lastEmailValue = control.value || '';
        control.markAsTouched();

        this.viewState.set('ERROR');

        setTimeout(() => {
          // Check for user not found - either by status code or error message
          const isUserNotFound =
            error.status === 404 ||
            error.error?.message === 'User not found' ||
            error.error?.message?.toLowerCase().includes('user not found');

          if (isUserNotFound) {
            control.setErrors({ userNotFound: true });
          } else {
            control.setErrors({ serverError: true });
          }
          control.markAsTouched();
        }, 0);
      }
    });
  }

  onCancel(): void {
    this.forgotPasswordForm.reset();
    this.emailControl().setErrors(null);
    this.viewState.set('EMAIL_ENTRY');
  }

  onGoBackToLogin(): void {
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  hasError(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
