import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface PasswordConfigurationApiResponse {
  pwd_History: number;
  pwd_Min_Length: number;
  pwd_Min_Caps: number;
  pwd_Min_Lower: number;
  pwd_Min_Number: number;
  pwd_Min_Special: number;
  pwd_Min_Char_Chg: number;
  pwd_Lockout: number;
  pwd_Intrvl: number;
  pwd_Method: 'Y' | 'N';
  pwd_Special: string;
  pwd_War_Msg: number;
  pwd_Lockout_Interval: number;
  pwd_Lockout_Period: number;
  strong_Pwd_Enabled?: string;
}

export interface PasswordConfigRequest {
  passwordRequirements: {
    minimumSpecialCharacters: number;
    minimumLowerCase: number;
    minimumUpperCase: number;
    minLength: number;
    requireUpper: boolean;
    minUppers: number;
    requireLower: boolean;
    minLowers: number;
    requireNumeric: boolean;
    minNumeric: number;
    requireSpecial: boolean;
    minSpecials: number;
    allowedSpecialChars: string;
  };
  securityPolicies: {
    accountLockoutEnabled: any;
    previousPasswordsToRemember: number;
    passwordHistoryEnabled: boolean;
    failedLoginAttemptsBeforeLockout: number;
    minimumCharactersToChange: number;
    minCharsToChange: number;
    enableAccountLockout: boolean;
    failedLoginAttempts: number;
    enablePasswordHistory: boolean;
    passwordHistoryCount: number;
  };
  expirationNotifications: {
    passwordExpirationEnabled: any;
    warningNoticeBeforeExpirationDays: number;
    enablePasswordExpiration: boolean;
    passwordValidityDays: number;
    warningNoticeDays: number;
  };
  metadata: {
    changedBy: string;
    changedAt: string;
  };
}

/**
 * Feature flag response from LT_APPLICATION_CONFIG
 */
export interface FeatureFlagResponse {
  strongPasswordEnabled: boolean;
  featureName: string;
  enabledFrom: string;
  enabledTo: string;
}

/**
 * Audit log entry for tracking password configuration changes
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  changedAt: string;
  action: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  ipAddress: string;
  systemNotes: string;
}

/**
 * Service to manage password configuration
 * 
 * Responsibilities:
 * 1. Load strong password feature flag from LT_APPLICATION_CONFIG
 * 2. Load current password configuration
 * 3. Save new password configuration with validation
 * 4. Perform audit logging of all changes
 * 5. Apply changes immediately to all users
 * 6. Handle AD integration if enabled
 */

@Injectable({
  providedIn: 'root'
})
export class PasswordConfigurationService {

  private readonly API_URL = '/api/v1/system-admin/password-configuration';
  private strongPasswordEnabledSubject = new BehaviorSubject<boolean>(false);
  public strongPasswordEnabled$ = this.strongPasswordEnabledSubject.asObservable();

  constructor(private http: HttpClient) {}

  /*GET API CALL*/
  getConfiguration(): Observable<any> {
    return this.http
      .get<PasswordConfigurationApiResponse>(this.API_URL)
      .pipe(map(api => {
        const isStrong = api.strong_Pwd_Enabled?.trim().toUpperCase() === 'Y';
        this.strongPasswordEnabledSubject.next(isStrong);
        return this.mapApiToUi(api);
      }));
  }

  /*POST API CALL*/
  createConfiguration(uiPayload: PasswordConfigRequest): Observable<any> {
    return this.http.post(
      this.API_URL,
      this.mapUiToApi(uiPayload)
    );
  }

  /*PUT API CALL*/
  updateConfiguration(uiPayload: PasswordConfigRequest): Observable<any> {
    return this.http.put(
      this.API_URL,
      this.mapUiToApi(uiPayload)
    );
  }

  /**
   * Get audit log entries for password configuration changes
   * Tracks who changed what, when, and what changed
   * 
   * @param limit - Maximum number of log entries to return
   * @returns Observable<AuditLogEntry[]> - List of audit log entries
   */
  getAuditLog(limit: number = 50): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.API_URL}/audit-log?limit=${limit}`)
      .pipe(
        catchError(error => {
          console.error('Error loading audit log:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Notify all users of password configuration change
   * Implementation depends on notification strategy (SignalR, WebSocket, polling, etc.)
   * This should happen immediately upon configuration save
   */
  private notifyUsersOfConfigurationChange(): void {
    // TODO: Implement notification mechanism
    // - SignalR: Hub connection to notify all connected clients
    // - WebSocket: Send broadcast message to all connections
    // - Polling: Users will detect change on next request
    // - Server-Sent Events: Stream notification to all subscribers
  }

  /**
   * Check if account lockout should be enforced
   * Returns the number of failed attempts before lockout
   * 
   * @returns Observable<number> - Failed attempts before lockout (0 if disabled)
   */
  getAccountLockoutThreshold(): Observable<number> {
    return this.http.get<PasswordConfigRequest>(`${this.API_URL}/current`)
      .pipe(
        map(config => {
          return config.securityPolicies.accountLockoutEnabled
            ? config.securityPolicies.failedLoginAttemptsBeforeLockout
            : 0;
        }),
        catchError(() => {
          console.error('Error getting account lockout threshold');
          return of(0);
        })
      );
  }

  /**
   * Check if password expiration is enforced
   * Returns the number of days until expiration
   * 
   * @returns Observable<number> - Days until expiration (0 if disabled)
   */
  getPasswordValidityPeriod(): Observable<number> {
    return this.http.get<PasswordConfigRequest>(`${this.API_URL}/current`)
      .pipe(
        map(config => {
          return config.expirationNotifications.passwordExpirationEnabled
            ? config.expirationNotifications.passwordValidityDays
            : 0;
        }),
        catchError(() => {
          console.error('Error getting password validity period');
          return of(0);
        })
      );
  }

  /**
   * Check if password history is enabled
   * Returns the number of previous passwords to remember
   * 
   * @returns Observable<number> - Number of passwords to remember (0 if disabled)
   */
  getPasswordHistoryCount(): Observable<number> {
    return this.http.get<PasswordConfigRequest>(`${this.API_URL}/current`)
      .pipe(
        map(config => {
          return config.securityPolicies.passwordHistoryEnabled
            ? config.securityPolicies.previousPasswordsToRemember
            : 0;
        }),
        catchError(() => {
          console.error('Error getting password history count');
          return of(0);
        })
      );
  }

  /**
   * Check password against current password history
   * Ensures user cannot reuse previous passwords
   * 
   * @param userId - User ID to check history for
   * @param newPassword - New password to validate
   * @returns Observable<boolean> - true if password can be used (not in history)
   */
  validatePasswordHistory(userId: string, newPassword: string): Observable<boolean> {
    return this.http.post<{ allowed: boolean }>(
      `${this.API_URL}/validate-history`,
      { userId, newPassword }
    ).pipe(
      map(response => response.allowed),
      catchError(error => {
        console.error('Error validating password history:', error);
        // Propagate error so callers can decide how to handle validation failures
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate password meets character change requirement
   * Ensures minimum number of characters differ from old password
   * 
   * @param oldPassword - Previous password
   * @param newPassword - New password
   * @param minimumCharsToChange - Minimum characters that must differ
   * @returns boolean - true if password change is valid
   */
  validatePasswordChange(
  oldPassword: string,
  newPassword: string,
  minimumCharsToChange: number
): boolean {
  let changeCount = 0;

  const maxLength = Math.max(oldPassword.length, newPassword.length);

  for (let i = 0; i < maxLength; i++) {
    if ((oldPassword[i] || '') !== (newPassword[i] || '')) {
      changeCount++;
    }
  }

  return changeCount >= minimumCharsToChange;
}

  private mapApiToUi(api: any): any {
    // Helper function to parse numeric values, treating empty string as 0
    const parseNumeric = (value: any): number => {
      if (value === '' || value === null || value === undefined) {
        return 0;
      }
      return typeof value === 'number' ? value : parseInt(value, 10) || 0;
    };

    // Parse all numeric fields
    const pwd_Min_Caps = parseNumeric(api.pwd_Min_Caps);
    const pwd_Min_Lower = parseNumeric(api.pwd_Min_Lower);
    const pwd_Min_Number = parseNumeric(api.pwd_Min_Number);
    const pwd_Min_Special = parseNumeric(api.pwd_Min_Special);
    const pwd_Lockout = parseNumeric(api.pwd_Lockout);
    const pwd_History = parseNumeric(api.pwd_History);
    const pwd_Intrvl = parseNumeric(api.pwd_Intrvl);
    const pwd_War_Msg = parseNumeric(api.pwd_War_Msg);

    return {
      isStrongPasswordEnabled: api.strong_Pwd_Enabled?.trim().toUpperCase() === 'Y',
      passwordRequirements: {
        minLength: parseNumeric(api.pwd_Min_Length),
        requireUpper: pwd_Min_Caps > 0,
        minUppers: pwd_Min_Caps > 0 ? pwd_Min_Caps : 0,
        requireLower: pwd_Min_Lower > 0,
        minLowers: pwd_Min_Lower > 0 ? pwd_Min_Lower : 0,
        requireNumeric: pwd_Min_Number > 0,
        minNumeric: pwd_Min_Number > 0 ? pwd_Min_Number : 0,
        requireSpecial: pwd_Min_Special > 0,
        minSpecials: pwd_Min_Special > 0 ? pwd_Min_Special : 0,
        allowedSpecialChars: api.pwd_Special || '',
        // Properties expected by populateForm
        minimumLength: parseNumeric(api.pwd_Min_Length),
        requireUpperCase: pwd_Min_Caps > 0,
        minimumUpperCase: pwd_Min_Caps > 0 ? pwd_Min_Caps : 0,
        requireLowerCase: pwd_Min_Lower > 0,
        minimumLowerCase: pwd_Min_Lower > 0 ? pwd_Min_Lower : 0,
        minimumNumeric: pwd_Min_Number > 0 ? pwd_Min_Number : 0,
        requireSpecialCharacters: pwd_Min_Special > 0,
        minimumSpecialCharacters: pwd_Min_Special > 0 ? pwd_Min_Special : 0,
        allowedSpecialCharacters: api.pwd_Special || ''
      },
      securityPolicies: {
        minCharsToChange: parseNumeric(api.pwd_Min_Char_Chg),
        enableAccountLockout: pwd_Lockout > 0,
        failedLoginAttempts: pwd_Lockout > 0 ? pwd_Lockout : 0,
        enablePasswordHistory: pwd_History > 0,
        passwordHistoryCount: pwd_History > 0 ? pwd_History : 0,
        // Properties expected by populateForm
        minimumCharactersToChange: parseNumeric(api.pwd_Min_Char_Chg),
        accountLockoutEnabled: pwd_Lockout > 0,
        failedLoginAttemptsBeforeLockout: pwd_Lockout > 0 ? pwd_Lockout : 0,
        passwordHistoryEnabled: pwd_History > 0,
        previousPasswordsToRemember: pwd_History > 0 ? pwd_History : 0
      },
      expirationNotifications: {
        enablePasswordExpiration: api.pwd_Method === 'Y',
        passwordValidityDays: pwd_Intrvl > 0 ? pwd_Intrvl : 0,
        warningNoticeDays: pwd_War_Msg > 0 ? pwd_War_Msg : 0,
        // Properties expected by populateForm
        passwordExpirationEnabled: api.pwd_Method === 'Y',
        passwordValidityPeriodDays: pwd_Intrvl > 0 ? pwd_Intrvl : 0,
        warningNoticeBeforeExpirationDays: pwd_War_Msg > 0 ? pwd_War_Msg : 0
      },
      metadata: {
        changedBy: '',
        changedAt: ''
      }
    };
  }

  private mapUiToApi(ui: PasswordConfigRequest): any {
    return {
      // Password history: send empty string when toggle is off, otherwise send the count
      pwd_History: ui.securityPolicies.enablePasswordHistory
        ? ui.securityPolicies.passwordHistoryCount
        : '',

      pwd_Min_Length: ui.passwordRequirements.minLength,

      // Uppercase: send empty string when toggle is off, otherwise send the minimum count
      pwd_Min_Caps: ui.passwordRequirements.requireUpper
        ? ui.passwordRequirements.minUppers
        : '',

      // Lowercase: send empty string when toggle is off, otherwise send the minimum count
      pwd_Min_Lower: ui.passwordRequirements.requireLower
        ? ui.passwordRequirements.minLowers
        : '',

      // Numeric: send empty string when toggle is off, otherwise send the minimum count
      pwd_Min_Number: ui.passwordRequirements.requireNumeric
        ? ui.passwordRequirements.minNumeric
        : '',

      // Special: send empty string when toggle is off, otherwise send the minimum count
      pwd_Min_Special: ui.passwordRequirements.requireSpecial
        ? ui.passwordRequirements.minSpecials
        : '',

      pwd_Min_Char_Chg: ui.securityPolicies.minCharsToChange,

      // Account lockout: send empty string when toggle is off, otherwise send the failed attempts count
      pwd_Lockout: ui.securityPolicies.enableAccountLockout
        ? ui.securityPolicies.failedLoginAttempts
        : '',

      // Password expiration: send days when enabled, otherwise send empty string
      pwd_Intrvl: ui.expirationNotifications.enablePasswordExpiration
        ? ui.expirationNotifications.passwordValidityDays
        : '',

      pwd_Method: ui.expirationNotifications.enablePasswordExpiration ? 'Y' : 'N',

      // Special chars: always send the allowed chars value regardless of toggle state
      // This defines which special characters are globally allowed for the system
      pwd_Special: ui.passwordRequirements.allowedSpecialChars || '',

      // Warning notice: send empty string when expiration toggle is off, otherwise send the warning days
      pwd_War_Msg: ui.expirationNotifications.enablePasswordExpiration
        ? ui.expirationNotifications.warningNoticeDays
        : '',

      pwd_Lockout_Interval: ui.securityPolicies.enableAccountLockout
        ? ui.securityPolicies.failedLoginAttempts
        : '',

      pwd_Lockout_Period: ui.securityPolicies.enableAccountLockout
        ? ui.securityPolicies.failedLoginAttempts
        : ''
    };
  }
}
