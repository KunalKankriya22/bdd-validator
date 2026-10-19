import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RestrictionService } from '../shared/services/restriction.service';

/**
 * Okta Restriction Guard
 *
 * Prevents navigation to application routes when user is in a restricted state.
 * Handles two restriction scenarios:
 * 1. okta-restriction: Multiple user IDs are associated with a single Okta email
 * 2. access-denied: User authentication/authorization failed
 *
 * Behavior:
 * - If user is in okta-restriction AND trying to navigate away from /okta-restriction:
 *   → Redirects back to /okta-restriction
 *   → Blocks the navigation attempt
 * - If user is in access-denied AND trying to navigate away from /access-denied:
 *   → Redirects back to /access-denied
 *   → Blocks the navigation attempt
 * - If user is restricted AND on their restriction page:
 *   → Allows (user is already on the appropriate restriction page)
 * - If user is not restricted:
 *   → Allows all navigation
 *
 * This guard should be applied to ALL routes to prevent bypass via manual URL entry.
 */
export const oktaRestrictionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const restrictionService = inject(RestrictionService);
  const router = inject(Router);

  // Check if user is in okta-restriction state
  const isOktaRestricted = restrictionService.isOktaRestricted();
  const isAccessDenied = restrictionService.isAccessDenied();

  // Priority 1: Handle okta-restriction (multiple users found)
  // Okta-restriction takes priority - if user is okta-restricted, they MUST stay on /okta-restriction
  if (isOktaRestricted && state.url !== '/okta-restriction') {
    console.warn('Navigation blocked: User is in okta-restriction state. Redirecting to /okta-restriction');
    router.navigate(['/okta-restriction']);
    return false;
  }

  // If user is okta-restricted and already on okta-restriction page, allow (even if access-denied is also active)
  // This handles the edge case where both flags are set
  if (isOktaRestricted && state.url === '/okta-restriction') {
    return true;
  }

  // Priority 2: Handle access-denied (authentication/authorization failure)
  if (isAccessDenied && state.url !== '/access-denied') {
    console.warn('Navigation blocked: User is in access-denied state. Redirecting to /access-denied');
    router.navigate(['/access-denied']);
    return false;
  }

  // Allow navigation if:
  // - User is not restricted, OR
  // - User is restricted but already on their appropriate restriction page
  return true;
};
