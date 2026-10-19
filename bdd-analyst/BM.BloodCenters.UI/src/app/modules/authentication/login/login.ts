import { Component, computed, signal, ViewChild, TemplateRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoginService } from '../../../shared/services/login.service';
import { HeaderService } from '../../../shared/services/header.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MessageDialog } from '../../../shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '../../../shared/interfaces/auth.interface';
import { ROUTES } from '../../../core/constants/route.constants';
import { TranslateModule } from '@ngx-translate/core';
import { UI, UI_META } from '../../../core/constants/ui.constants';
import { AuthService } from '../../../shared/services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  public checkingOkta = signal<boolean>(true);
  public isAccountLocked = signal<boolean>(false);
  public isPasswordExpired = signal<boolean>(false);

  public username = signal<string>('');
  public password = signal<string>('');
  public hidePassword = signal<boolean>(true);
  public usernameError = signal<string | null>(null);
  public passwordError = signal<string | null>(null);
  public authError = signal<string | null>(null);
  public attemptsMessage = signal<string | null>(null);
  public attemptsParams = signal<{ remaining: number; max: number } | null>(null);

  // Dynamic values from API response
  private totalPasswordAttempts = signal<number>(3); // Default fallback

  private lockDialogRef: MatDialogRef<MessageDialog> | null = null;
  private passwordExpiredDialogRef: MatDialogRef<MessageDialog> | null = null;
  readonly UI = UI;
  readonly UI_META = UI_META;
   private oktaTriggered = false;

  @ViewChild('accountLockContent') accountLockContent!: TemplateRef<any>;
  @ViewChild('passwordExpiredContent') passwordExpiredContent!: TemplateRef<any>;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    public loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private authService: AuthService,
    private headerService: HeaderService
  ) {}

  /**
   * Handle username input change
   * @param event Input event
   */
  public onUsernameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toUpperCase();
    this.username.set(value);
    this.validateUsername(value);

    this.authError.set(null);
    this.attemptsMessage.set(null);
  }

  /**
   * Handle password input change
   * @param event Input event
   */
  public onPasswordChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.password.set(value);
    this.validatePassword(value);

    this.authError.set(null);
    this.attemptsMessage.set(null);
  }

  /**
   * Toggle password visibility
   */
  public togglePasswordVisibility(): void {
    this.hidePassword.update(current => !current);
  }

  /**
   * Validate username input
   * @param username Username to validate
   * @returns Boolean indicating if username is valid
   */
  private validateUsername(username: string): boolean {
    if (!username || username.trim() === '') {
      this.usernameError.set('Username is required');
      return false;
    }
    this.usernameError.set(null);
    return true;
  }

  /**
   * Validate password input
   * @param password Password to validate
   * @returns Boolean indicating if password is valid
   */
  private validatePassword(password: string): boolean {
    if (!password || password.trim() === '') {
      this.passwordError.set('Password is required');
      return false;
    }
    this.passwordError.set(null);
    return true;
  }

  /**
   * Handle login form submission
   */
  public async onSubmit(): Promise<void> {
    // Validate inputs

    if (! this.validateUsername(this.username()) || !this.validatePassword(this.password())) {
      return;
    }

    const response = await this.loginService.login({
      username: this.username(),
      password: this.password()
    });

    if (response.success) {
      // Clear stale chapter/warehouse cookies from any previous session
      this.headerService.clearCookies();
      sessionStorage.removeItem('driveContext');
      sessionStorage.removeItem('labelPrinterContext');

      // Check for password expiry warning and store in service for home page display
      if (response.password_warning_notice && response.password_expiry_date && !response.is_password_expired) {
        const today = new Date();
        const expiryDate = new Date(response.password_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Show warning if days until expiry <= warning notice days
        if (daysUntilExpiry > 0 && daysUntilExpiry <= response.password_warning_notice) {
          this.loginService.setPasswordWarning(daysUntilExpiry);
        }
      }

      // Check password configuration after successful login
      this.checkPasswordConfigAfterLogin(this.username());
      return;
    }

    // Store dynamic values from API response
    if (response.total_no_of_pass_attempts) {
      this.totalPasswordAttempts.set(response.total_no_of_pass_attempts);
    }

    // Handle password expiry - highest priority check
    if (response.is_password_expired) {
      this.openPasswordExpiredDialog();
      return;
    }

    // Handle account lockout based on backend response
    if (response.is_account_locked) {
      // Admin-locked: no auto-unlock time OR password was reset by admin — show simple "Contact Admin" message
      const isAdminLocked = !response.lockout_until || !!response.reset_request;
      if (!isAdminLocked) {
        this.authError.set('AUTH.LOGIN.INVALID_CREDENTIALS');
        this.attemptsMessage.set('AUTH.LOGIN.ATTEMPTS_LEFT_MESSAGE');
        this.attemptsParams.set({
          remaining: 0,
          max: response.total_no_of_pass_attempts ?? this.totalPasswordAttempts()
        });
        this.cdr.detectChanges();
        this.openAccountLockedDialog(false);
      } else {
        this.openAccountLockedDialog(true);
      }
      return;
    }

    // Handle remaining attempts warning
    if (response.pass_attempts_left !== null && response.pass_attempts_left !== undefined) {
      // If no attempts left, show 0 remaining then lock
      if (response.pass_attempts_left === 0) {
        this.authError.set('AUTH.LOGIN.INVALID_CREDENTIALS');
        this.attemptsMessage.set('AUTH.LOGIN.ATTEMPTS_LEFT_MESSAGE');
        this.attemptsParams.set({
          remaining: 0,
          max: response.total_no_of_pass_attempts ?? this.totalPasswordAttempts()
        });
        this.cdr.detectChanges();
        this.openAccountLockedDialog();
        return;
      }


      // Show remaining attempts warning using dynamic values from API
      this.authError.set('AUTH.LOGIN.INVALID_CREDENTIALS');
      this.attemptsMessage.set('AUTH.LOGIN.ATTEMPTS_LEFT_MESSAGE');
      this.attemptsParams.set({
        remaining: response.pass_attempts_left,
        max: response.total_no_of_pass_attempts ?? this.totalPasswordAttempts()
      });
    } else if (response.error) {
      // Show generic error if no attempts info provided
      this.authError.set('AUTH.LOGIN.INVALID_CREDENTIALS');
    }
  }

  private openAccountLockedDialog(isAdminLocked = false): void {
  this.isAccountLocked.set(true);

  this.lockDialogRef = this.dialog.open(MessageDialog, {
    panelClass: ['ws-message-dialog-panel', 'ws-message-dialog-flat-buttons'],
    width: '600px',
    disableClose: true,
    ariaLabel: 'AUTH.ACCOUNT_LOCK.ARIA.DIALOG',
    ariaDescribedBy: 'account-lock-description',
    data: {
      title: 'AUTH.ACCOUNT_LOCK.TITLE_WITH_USER',
      icon: 'warning',

      contentTemplate: this.accountLockContent,
      params: {
        username: this.username(),
        attempts: this.totalPasswordAttempts(),
        isAdminLocked,
      },

      primaryAction: {
        label: 'AUTH.ACCOUNT_LOCK.LOGIN_DIFFERENT',
        action: 'login-different'
      },
      secondaryAction: {
        label: 'AUTH.ACCOUNT_LOCK.CLOSE',
        action: 'close'
      }
    }
  });

  this.lockDialogRef.afterClosed().subscribe(() => {
    // RESET BACKEND LOCK
    this.loginService.resetLockState();
    //  RESET FRONTEND LOCK
    this.isAccountLocked.set(false);
    // RESET FORM
    this.resetLoginForm();
  });
}

  private openPasswordExpiredDialog(): void {
    this.isPasswordExpired.set(true);

    this.passwordExpiredDialogRef = this.dialog.open(MessageDialog, {
      panelClass: 'ws-message-dialog-panel',
      width: '600px',
      disableClose: true,
      ariaLabel: 'AUTH.PASSWORD_EXPIRED.ARIA.DIALOG',
      ariaDescribedBy: 'password-expired-description',
      data: {
        title: 'AUTH.PASSWORD_EXPIRED.TITLE',
        icon: 'warning',

        contentTemplate: this.passwordExpiredContent,
        params: {
          username: this.username()
        },

        primaryAction: {
          label: 'AUTH.PASSWORD_EXPIRED.RESET_PASSWORD',
          action: 'reset-password'
        },
        secondaryAction: {
          label: 'AUTH.PASSWORD_EXPIRED.LOGIN_DIFFERENT',
          action: 'login-different'
        }
      }
    });

    this.passwordExpiredDialogRef.afterClosed().subscribe((action: string | undefined) => {
      // RESET BACKEND STATE
      this.loginService.resetLockState();
      // RESET FRONTEND STATE
      this.isPasswordExpired.set(false);
      // RESET FORM
      this.resetLoginForm();

      if (action === 'reset-password') {
        this.router.navigate([ROUTES.AUTH.FORGOT_PASSWORD]);
      }
    });
  }

  private resetLoginForm(): void {
    this.username.set('');
    this.password.set('');
    this.hidePassword.set(true);

    this.usernameError.set(null);
    this.passwordError.set(null);
    this.authError.set(null);
    this.attemptsMessage.set(null);
  }

  /**
   * Check password configuration after successful login
   * Store config in cookies and navigate to home
   * Home component will check if password reset is required
   */
  private checkPasswordConfigAfterLogin(username: string): void {
    this.loginService.checkPasswordConfig(username).subscribe({
      next: (config) => {
        // Store password configuration in cookies
        this.loginService.storePasswordConfig(config);

        // Always navigate to home after successful login
        // Home component will handle mandatory password change if needed
        this.router.navigate([ROUTES.HOME]);
      },
      error: (error) => {
        console.error('Failed to check password configuration:', error);
        // Navigate to home even if config check fails (don't block user)
        this.router.navigate([ROUTES.HOME]);
      }
    });
  }


  /**
   * Navigate to forgot password page
   */
  public onForgotPassword(): void {
      this.router.navigate(['/forgot-password']);
  }
  /**
   * for login button disabled
   */
  
  public isFormValid = computed(() => {
    return !!this.username().trim() && !!this.password().trim();
  });


/**
 * Handle errors from Okta callback redirect
 * @param errorCode - Error code from query parameters
 */
private handleOktaCallbackError(errorCode: string): void {
  let errorMessage = '';

  switch (errorCode) {
    case 'user_not_registered':
      errorMessage = 'Your email is not registered in the system. Please contact your administrator.';
      break;
    case 'invalid_user_data':
      errorMessage = 'Invalid user data received. Please try again or contact support.';
      break;
    case 'user_fetch_failed':
      errorMessage = 'Failed to fetch user information. Please try again.';
      break;
    case 'auth_callback_failed':
      errorMessage = 'Authentication callback failed. Please try logging in again.';
      break;
    default:
      errorMessage = 'An error occurred during authentication. Please try again.';
  }

  this.authError.set(errorMessage);
  console.error('Okta callback error:', errorCode, errorMessage);
}

ngOnInit() {
  // If already authenticated, redirect to home
  const alreadyLoggedIn = this.isAlreadyLoggedIn();
  if (alreadyLoggedIn) {
    this.router.navigate([ROUTES.HOME]);
    return;
  }

  // Check for error query parameters from Okta callback — must run before Okta redirect
  const errorParam = this.route.snapshot.queryParams['error'];
  if (errorParam) {
    this.handleOktaCallbackError(errorParam);
    this.checkingOkta.set(false);
    return;
  }



  // TODO: Remove - bypassing checkOktaEnabled API for local Okta testing
 // this.oktaTriggered = true;
 // this.authService.login();
  this.loginService.checkOktaEnabled().subscribe({
    next: (res) => {
      if (res?.isSuccess && res?.data) {
        this.oktaTriggered = true;
        this.authService.login();
      } else {
        this.checkingOkta.set(false);
      }
    },
    error: () => {
      this.checkingOkta.set(false);
    }
  });
}

private isAlreadyLoggedIn(): boolean {
  const authMethod = this.loginService.getAuthMethod();

  if (authMethod === 'standard') {
    return !!(this.loginService.getStoredToken() && this.loginService.getStoredUsername());
  }

  return false;
}

}