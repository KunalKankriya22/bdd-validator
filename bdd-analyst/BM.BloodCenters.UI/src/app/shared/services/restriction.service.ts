import { Injectable } from '@angular/core';

/**
 * RestrictionService
 *
 * Manages user restriction state when access to the application needs to be blocked.
 * Currently used for two Okta authentication error scenarios:
 * 1. Multiple user IDs associated with a single email address (okta-restriction)
 * 2. User not found or authentication denied (access-denied)
 *
 * The service uses sessionStorage to persist restriction state within the current tab:
 * - Page refreshes (sessionStorage persists within the same tab)
 * - Manual URL navigation
 * - Browser back/forward actions
 * Each tab maintains its own independent restriction state.
 */
@Injectable({
  providedIn: 'root'
})
export class RestrictionService {
  private readonly OKTA_RESTRICTION_FLAG = 'okta_restriction_active';
  private readonly ACCESS_DENIED_FLAG = 'access_denied_active';

  /**
   * Mark user as restricted (Okta multi-user scenario)
   */
  setOktaRestrictionActive(): void {
    sessionStorage.setItem(this.OKTA_RESTRICTION_FLAG, 'true');
  }

  /**
   * Check if user is currently in okta-restriction state
   */
  isOktaRestricted(): boolean {
    return sessionStorage.getItem(this.OKTA_RESTRICTION_FLAG) === 'true';
  }

  /**
   * Clear restriction flag
   */
  clearOktaRestriction(): void {
    sessionStorage.removeItem(this.OKTA_RESTRICTION_FLAG);
  }

  /**
   * Mark user as access denied (authentication/authorization failure)
   */
  setAccessDeniedActive(): void {
    sessionStorage.setItem(this.ACCESS_DENIED_FLAG, 'true');
  }

  /**
   * Check if user is currently in access-denied state
   */
  isAccessDenied(): boolean {
    return sessionStorage.getItem(this.ACCESS_DENIED_FLAG) === 'true';
  }

  /**
   * Clear access-denied flag
   */
  clearAccessDenied(): void {
    sessionStorage.removeItem(this.ACCESS_DENIED_FLAG);
  }

  /**
   * Clear all restriction flags
   */
  clearAllRestrictions(): void {
    this.clearOktaRestriction();
    this.clearAccessDenied();
  }
}
