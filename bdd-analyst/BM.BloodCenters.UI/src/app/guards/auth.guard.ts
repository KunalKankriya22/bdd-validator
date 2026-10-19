import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { LoginService } from '../shared/services/login.service';

/**
 * Auth guard - protects routes from unauthenticated access
 * Supports both Okta SSO and standard JWT authentication
 * Uses sessionStorage (tab-scoped) so each tab requires independent login
 */
export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const loginService = inject(LoginService);
  const router = inject(Router);

  // Check authentication method from sessionStorage
  const authMethod = loginService.getAuthMethod();

  // For Okta users
  if (authMethod === 'okta') {
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) {
      return true;
    } else {
      // Clear invalid Okta session
      await authService.clearTokens();
      loginService.clearToken();
      router.navigate(['/login']);
      return false;
    }
  }

  // For standard JWT users
  if (authMethod === 'standard') {
    const jwtToken = loginService.getStoredToken();
    const username = loginService.getStoredUsername();

    if (jwtToken && username) {
      // Token exists - assume valid (backend will validate on API calls)
      // If token is expired, authInterceptor will catch 401 and redirect to login
      return true;
    }
  }

  // No valid authentication found
  loginService.clearToken();
  router.navigate(['/login']);
  return false;
};
