import { Injectable, inject, signal } from '@angular/core';
import { LoginCredentials, LoginResponse, OktaConfigResponse } from '../interfaces/auth.interface';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { API } from '../../core/constants/api.constants';
import { RestrictionService } from './restriction.service';
import { AccessLevelService } from './access-level.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  // Password warning state
  public showPasswordWarning = signal<boolean>(false);
  public passwordExpiryDays = signal<number>(0);

  private readonly OKTA_CONFIG_ENDPOINT = '/api/v1/Auth/Login/LoginWithOkta';
  private readonly JWT_TOKEN_KEY = 'jwt_token';
  private readonly USERNAME_KEY = 'current_username';
  private readonly AUTH_METHOD_KEY = 'auth_method';
  private readonly PASSWORD_CONFIG_KEY = 'password_config';

  private accessLevelService = inject(AccessLevelService);

  constructor(
    private apiService: ApiService,
    private restrictionService: RestrictionService
  ) { }

  /**
   * Authenticate user with provided credentials
   * @param credentials User login credentials
   * @returns Promise with login response
   */
  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }

      // Convert username to uppercase for non-Okta login
      const normalizedCredentials = {
        username: credentials.username.toUpperCase(),
        password: credentials.password
      };

      // Add X-Device-Name header with client machine identifier
      // Ensure values are always strings to prevent toLowerCase errors in consuming code
      const platform = String(navigator.platform || 'unknown-platform');
      const userAgent = String(navigator.userAgent || 'unknown-agent');

      // Create a simple hash from user agent using character codes (test-safe alternative to btoa)
      let hash = 0;
      for (let i = 0; i < userAgent.length; i++) {
        const char = userAgent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const hashedAgent = Math.abs(hash).toString(36).substring(0, 8);
      const deviceName = `${platform}-${hashedAgent}`;

      const headers = new HttpHeaders({
        'X-Device-Name': deviceName
      });

      let apiUrl= "/api/v1/Auth/Login/WithoutOkta";
      const response = await this.apiService.post<any>(apiUrl, normalizedCredentials, { headers }).toPromise();

      // Success case
      if (response?.isSuccess && response?.data?.token) {
        sessionStorage.removeItem('driveContext');
        sessionStorage.removeItem('labelPrinterContext');

        // Store JWT token in sessionStorage (tab-scoped) for authInterceptor
        sessionStorage.setItem(this.JWT_TOKEN_KEY, response.data.token);

        // Store username in sessionStorage for header service
        sessionStorage.setItem(this.USERNAME_KEY, response.data.username);

        // Store authentication method to distinguish from Okta users
        sessionStorage.setItem(this.AUTH_METHOD_KEY, 'standard');

        // TODO: REMOVE AFTER API TESTING - Temporary test values for password warning
        // Calculate a date 3 days from now for testing
        const testExpiryDate = new Date();
        testExpiryDate.setDate(testExpiryDate.getDate() + 3);

        return {
          success: true,
          token: response.data.token,
          password_warning_notice: response.data.password_warning_notice ?? null,
          password_expiry_date: response.data.password_expiry_date ?? null
        };
      }

      // Failed login - use backend-driven lockout state
      const message = response?.message || 'Invalid username or password.';
      this.error.set(message);

      // Return all backend-provided lockout and password information
      return {
        success: false,
        error: message,
        is_account_locked: response?.data?.is_account_locked ?? false,
        pass_attempts_left: response?.data?.pass_attempts_left ?? null,
        total_no_of_pass_attempts: response?.data?.total_no_of_pass_attempts ?? null,
        is_password_expired: response?.data?.is_password_expired ?? false,
        lockout_period: response?.data?.lockout_period ?? null,
        lockout_until: response?.data?.lockout_until ?? null,
        reset_request: response?.data?.reset_request ?? false,
        password_warning_notice: response?.data?.password_warning_notice ?? null,
        password_expiry_date: response?.data?.password_expiry_date ?? null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.error.set(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Reset password for a user
   * @param username Username for password reset
   * @returns Promise with success status
   */
  public async forgotPassword(username: string): Promise<{ success: boolean, message: string }> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!username) {
        throw new Error('Username is required');
      }

      return {
        success: true,
        message: 'If this account exists, password reset instructions have been sent to the associated email.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      this.error.set(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      this.isLoading.set(false);
    }
  }

  public resetLockState(): void {
    // Reset error state (lockout is now managed by backend)
    this.error.set(null);
  }

  /**
   * Set password warning state for display on home page
   * @param days Number of days until password expires
   */
  public setPasswordWarning(days: number): void {
    this.passwordExpiryDays.set(days);
    this.showPasswordWarning.set(true);
  }

  /**
   * Clear password warning state
   */
  public clearPasswordWarning(): void {
    this.showPasswordWarning.set(false);
    this.passwordExpiryDays.set(0);
  }

  /**
   * Check if Okta authentication is enabled
   * Calls the API endpoint to retrieve Okta configuration
   * @returns Observable with the API response containing isSuccess and data (enabled flag)
   */
  public checkOktaEnabled(): Observable<OktaConfigResponse> {
    return this.apiService.get<OktaConfigResponse>(this.OKTA_CONFIG_ENDPOINT, {});
  }

  public getStoredToken(): string {
    return sessionStorage.getItem(this.JWT_TOKEN_KEY) || '';
  }

  /**
   * Get stored username from sessionStorage
   * @returns Username string or empty string if not found
   */
  public getStoredUsername(): string {
    return sessionStorage.getItem(this.USERNAME_KEY) || '';
  }

  /**
   * Store username in sessionStorage (used by OktaCallbackComponent)
   */
  public storeUsername(username: string): void {
    sessionStorage.setItem(this.USERNAME_KEY, username);
  }

  /**
   * Store authentication method in sessionStorage (used by OktaCallbackComponent)
   */
  public storeAuthMethod(method: string): void {
    sessionStorage.setItem(this.AUTH_METHOD_KEY, method);
  }

  /**
   * Clear JWT token, username, and password config from sessionStorage (logout)
   */
  public clearToken(): void {
    sessionStorage.removeItem(this.JWT_TOKEN_KEY);
    sessionStorage.removeItem(this.USERNAME_KEY);
    sessionStorage.removeItem(this.AUTH_METHOD_KEY);
    sessionStorage.removeItem(this.PASSWORD_CONFIG_KEY);

    // Clear all restriction flags to allow normal navigation after logout
    this.restrictionService.clearAllRestrictions();
    this.accessLevelService.clear();
  }

  private readonly LOGOUT_EVENT_KEY = 'logout_event';

  public broadcastLogout(): void {
    localStorage.setItem(this.LOGOUT_EVENT_KEY, Date.now().toString());
  }

  public listenForCrossTabLogout(callback: () => void): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event) => {
      if (event.key === this.LOGOUT_EVENT_KEY) {
        callback();
      }
    });
  }

  public isOktaUser(): boolean {
    return sessionStorage.getItem(this.AUTH_METHOD_KEY) === 'okta';
  }

  /**
   * Get current authentication method
   * @returns Authentication method ('okta' or 'standard') or empty string if not authenticated
   */
  public getAuthMethod(): string {
    return sessionStorage.getItem(this.AUTH_METHOD_KEY) || '';
  }

  /**
   * Check password configuration for a user
   * @param username Username to check password config for
   * @returns Observable with password configuration response
   */
  public checkPasswordConfig(username: string): Observable<{
    isStrongPasswordConfigured: boolean;
    isResetPasswordRequested: boolean;
  }> {
    const endpoint = API.SYSTEM_ADMIN.PASSWORD_CONFIG_BY_USER(username);
    return this.apiService.get<{
      isStrongPasswordConfigured: boolean;
      isResetPasswordRequested: boolean;
    }>(endpoint);
  }

  /**
   * Store password configuration in sessionStorage
   * @param config Password configuration to store
   */
  public storePasswordConfig(config: {
    isStrongPasswordConfigured: boolean;
    isResetPasswordRequested: boolean;
  }): void {
    sessionStorage.setItem(this.PASSWORD_CONFIG_KEY, JSON.stringify(config));
  }

  /**
   * Get stored password configuration from sessionStorage
   * @returns Password configuration object or null if not found
   */
  public getStoredPasswordConfig(): {
    isStrongPasswordConfigured: boolean;
    isResetPasswordRequested: boolean;
  } | null {
    const configJson = sessionStorage.getItem(this.PASSWORD_CONFIG_KEY);
    if (!configJson) {
      return null;
    }
    try {
      return JSON.parse(configJson);
    } catch (error) {
      console.error('Failed to parse password config from sessionStorage:', error);
      return null;
    }
  }

  /**
   * Check if strong password is required for the current user
   * @returns True if strong password is required, false otherwise
   */
  public isStrongPasswordRequired(): boolean {
    const config = this.getStoredPasswordConfig();
    return config?.isStrongPasswordConfigured ?? false;
  }

  /**
   * Check if password reset is requested for the current user
   * @returns True if password reset is requested, false otherwise
   */
  public isPasswordResetRequested(): boolean {
    const config = this.getStoredPasswordConfig();
    return config?.isResetPasswordRequested ?? false;
  }

}
