import { Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  totalPasswordLengthValidator,
  expiryWarningValidator,
  specialCharValidator,
  charsDifferenceValidator
} from './validators/password.validators';

import { PasswordConfigRequest, PasswordConfigurationService } from './services/password-configuration.service';
import { PasswordRequirements } from './password-requirements/password-requirements';
import { SecurityPolicies } from './security-policies/security-policies';
import { ExpirationNotifications } from './expiration-notifications/expiration-notifications';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';

@Component({
  standalone: true,
  selector: 'app-password-configuration',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PasswordRequirements,
    SecurityPolicies,
    ExpirationNotifications,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './password-configuration.html',
  styleUrls: ['./password-configuration.scss']
})
export class PasswordConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private configService = inject(PasswordConfigurationService);
  private headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Manage User Administration', link: '/system-administration' }
    ]
  };

  isLoading = true;
  isSaving = false;
  isStrongPasswordEnabled = false;

  form!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeForm();
  }

  /**
   * Initialize form with all password configuration fields and validators
   *
   * Business Rules:
   * - All numeric fields must be in valid ranges
   * - Min Length must be 1-50 characters
   * - Min Uppers, Lowers, Numerics, Specials must be 1-50
   * - Min Chars Change must be 1-50
   * - Expiration warning must be less than validity period
   * - History count prevents password reuse (1-50)
   * - Lockout times must be 1-50
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      passwordRequirements: this.fb.group({
        minLength: [8, [
          Validators.required,
          Validators.min(6),
          Validators.max(50)
        ]],

        requireUpper: [true, Validators.required],

        minUppers: [3, [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]],

        requireLower: [true, Validators.required],

        minLowers: [3, [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]],

        requireNumeric: [true, Validators.required],

        minNumeric: [1, [Validators.required, Validators.min(1), Validators.max(50)]],

        requireSpecial: [true, Validators.required],

        minSpecials: [1, [Validators.required, Validators.min(1), Validators.max(50)]],

        // Allowed special characters: Cannot contain @, %, &, ', commas, spaces, letters, or numbers
        // Valid examples: ! # $ ^ * ( ) - _ + = [ ] { } | \ : ; " < > . ? / ~ `
        allowedSpecialChars: ["!#$^*", [
          Validators.required,
          specialCharValidator()
        ]]
      }),

      securityPolicies: this.fb.group({
        minCharsToChange: [3, [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]],

        enableAccountLockout: [true, Validators.required],

        failedLoginAttempts: [3, [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]],

        enablePasswordHistory: [true, Validators.required],

        passwordHistoryCount: [24, [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]]
      }),

      expirationNotifications: this.fb.group({
        // Enable password expiration enforcement
        enablePasswordExpiration: [true, Validators.required],

        // Days until password expires and mandatory change required
        passwordValidityDays: [365, [
          Validators.required,
          Validators.min(1),
          Validators.max(3650)
        ]],

        warningNoticeDays: [5, [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]]
      })
    }, {
      validators: [
        totalPasswordLengthValidator(),
        expiryWarningValidator(),
        charsDifferenceValidator()
      ]
    });
  }

  ngOnInit(): void {
    // Initialization logic moved to ngAfterViewInit to ensure child components are ready
  }

  ngAfterViewInit(): void {
    // Wait for child components to initialize their toggle sync
    setTimeout(() => {
      this.loadConfiguration();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load password configuration and feature flag
   */
  private loadConfiguration(): void {
    this.isLoading = true;

    this.configService
      .getConfiguration()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.populateForm(config);
          this.isLoading = false;
        },
        error: (err) => {
          const errorMessage = this.extractErrorMessage(err);
          this.snackBar.open(
            errorMessage || 'Failed to load password configuration',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
          this.isLoading = false;
        }
      });
  }

  /**
   * Populate form with existing configuration values
   */
  private populateForm(config: any): void {
    if (config) {
      this.isStrongPasswordEnabled = config.isStrongPasswordEnabled ?? false;
      this.form.patchValue({
        passwordRequirements: {
          minLength: config.passwordRequirements?.minimumLength || 8,
          requireUpper: config.passwordRequirements?.requireUpperCase ?? true,
          minUppers: config.passwordRequirements?.minimumUpperCase || 1,
          requireLower: config.passwordRequirements?.requireLowerCase ?? true,
          minLowers: config.passwordRequirements?.minimumLowerCase || 1,
          requireNumeric: config.passwordRequirements?.requireNumeric ?? true,
          minNumeric: config.passwordRequirements?.minimumNumeric || 1,
          requireSpecial: config.passwordRequirements?.requireSpecialCharacters ?? true,
          minSpecials: config.passwordRequirements?.minimumSpecialCharacters || 1,
          allowedSpecialChars: config.passwordRequirements?.allowedSpecialCharacters || '!#$^*'
        },
        securityPolicies: {
          minCharsToChange: config.securityPolicies?.minimumCharactersToChange || 3,
          enableAccountLockout: config.securityPolicies?.accountLockoutEnabled ?? true,
          failedLoginAttempts: config.securityPolicies?.failedLoginAttemptsBeforeLockout || 3,
          enablePasswordHistory: config.securityPolicies?.passwordHistoryEnabled ?? true,
          passwordHistoryCount: config.securityPolicies?.previousPasswordsToRemember || 24
        },
        expirationNotifications: {
          enablePasswordExpiration: config.expirationNotifications?.passwordExpirationEnabled ?? true,
          passwordValidityDays: config.expirationNotifications?.passwordValidityPeriodDays || 365,
          warningNoticeDays: config.expirationNotifications?.warningNoticeBeforeExpirationDays || 5
        }
      });
    }
  }

  /**
   * Cancel configuration changes and reset form to last saved state
   */
  clearAll(): void {
    this.loadConfiguration();
    this.snackBar.open(
      'Changes discarded. Form reset to last saved configuration.',
      'Close',
      {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  }

  /**
   * Extract error message from API error response
   * Handles different error response formats:
   * - errors array
   * - modelErrors object
   * - message string
   */
  private extractErrorMessage(err: any): string {
    // Try to get errors from the errors array first
    if (err?.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
      return err.error.errors.join(', ');
    }

    // Try to get errors from modelErrors object
    if (err?.error?.modelErrors && typeof err.error.modelErrors === 'object') {
      const modelErrors = err.error.modelErrors;
      const errorMessages: string[] = [];

      for (const key in modelErrors) {
        if (Array.isArray(modelErrors[key])) {
          errorMessages.push(...modelErrors[key]);
        }
      }

      if (errorMessages.length > 0) {
        return errorMessages.join(', ');
      }
    }

    // Fallback to the message field or default error message
    return err?.error?.message ?? 'Failed to save password configuration';
  }


  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.form.getRawValue();
    const payload: PasswordConfigRequest = {
      ...formValue,
      metadata: {
        changedBy: this.headerService.headerConfig().user?.id || '',
        changedAt: new Date().toISOString()
      }
    };

    this.configService
      .updateConfiguration(payload)
      .subscribe({
        next: (res) => {
          this.snackBar.open(
            res?.message ?? 'Password configuration updated successfully',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            }
          );
          this.isSaving = false;
        },
        error: (err) => {
          const errorMessage = this.extractErrorMessage(err);
          this.snackBar.open(
            errorMessage,
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
          this.isSaving = false;
        }
      });
  }
}
