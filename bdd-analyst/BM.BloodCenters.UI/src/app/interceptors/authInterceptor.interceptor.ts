import { HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { SKIP_ERROR_TOAST, SKIP_AUTH_REDIRECT } from '../core/constants/http-context.constants';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { SnackbarService } from '../shared/services/snackbar.service';
import { HeaderService } from '../shared/services/header.service';
import { LoginService } from '../shared/services/login.service';
import { RestrictionService } from '../shared/services/restriction.service';
import { AccessLevelService } from '../shared/services/access-level.service';

/**
 * Interface for API error response structure
 */
interface ApiErrorResponse {
  success: boolean;
  message: string;
  errorCode: string;
  statusCode: number;
  item: boolean;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Auth interceptor - handles authentication headers and HTTP error responses
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const loginService = inject(LoginService);
  const headerService = inject(HeaderService);

  // Get JWT token from sessionStorage (tab-scoped), fallback to Okta token
  const jwtToken = loginService.getStoredToken();
  const token = jwtToken || authService.getAccessToken();

  // Inject services for error handling and navigation
  const snackbarService = inject(SnackbarService);
  const router = inject(Router);
  const restrictionService = inject(RestrictionService);
  const accessLevelService = inject(AccessLevelService);

  let headers = req.headers;
  if (!(req.body instanceof FormData) && req.body != null && !headers.has('Content-Type')) {
    headers = headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // Add custom headers for user and chapter/warehouse context
  const username = loginService.getStoredUsername();
  const chapterId = headerService.getCurrentChapterId();
  const warehouseId = headerService.getCurrentWarehouseId();
  const warehouseName = headerService.warehouseName();

  if (username) {
    headers = headers.set('X-LoggedInUserName', username);
  }
  if (chapterId) {
    headers = headers.set('X-ChapterId', chapterId);
  }
  if (warehouseId) {
    headers = headers.set('X-WareHouseId', warehouseId);
  }
  if (warehouseName) {
    headers = headers.set('X-WareHouseName', warehouseName);
  }
  const userTestingLabCode = headerService.userTestingLabCode();
  if (userTestingLabCode) {
    headers = headers.set('X-UserTestingLabCode', userTestingLabCode);
  }

  const cloned = req.clone({ headers });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - redirect to login unless opted out
      if (error.status === 401) {
        if (req.context.get(SKIP_AUTH_REDIRECT)) {
          return throwError(() => error);
        }

        accessLevelService.clear();
        loginService.broadcastLogout();

        // Clear all restriction flags to allow normal navigation after session expiry
        restrictionService.clearAllRestrictions();

        router.navigate(['/session-expired']);

        // Check auth method before clearing
        const authMethod = loginService.getAuthMethod();

        // Clear all auth and session data
        loginService.clearToken();
        headerService.clearSession();

        // If user was authenticated via Okta, clear Okta tokens
        if (authMethod === 'okta') {
          authService.clearTokens().catch((err) => {
            console.error('Error clearing Okta tokens:', err);
          });
        }

        return throwError(() => error);
      }

      // Check if this is a 404 with success: true (empty result, not an error)
      const errorData = error.error as ApiErrorResponse;
      if (error.status === 404 && errorData?.success === true) {
        // This is an empty result, not an error - let the service handle it
        return throwError(() => error);
      }

      // Silently handle 404 for static assets that may not exist
      if (error.status === 404 && (error.url?.includes('inst_logo.png') || error.url?.includes('version.json'))) {
        return throwError(() => error);
      }

      // Skip snackbar if the request opted out via HttpContext
      const skipConfig = req.context.get(SKIP_ERROR_TOAST);
      if (skipConfig === true || (Array.isArray(skipConfig) && skipConfig.includes(error.status))) {
        return throwError(() => error);
      }

      // For all other errors, show snackbar
      const errorMessage = getErrorMessage(error);
      snackbarService.showError(errorMessage);
      console.error('HTTP Error:', error);
      return throwError(() => error);
    }),
  );
}

/**
 * Extract and format error message based on HTTP error response
 */
function getErrorMessage(error: HttpErrorResponse): string {
  // Parse error.error if it's a JSON string (happens when responseType is 'text')
  let errorData: ApiErrorResponse | undefined;
  if (typeof error.error === 'string') {
    try {
      errorData = JSON.parse(error.error) as ApiErrorResponse;
    } catch {
      // If JSON parsing fails, errorData remains undefined
      errorData = undefined;
    }
  } else {
    errorData = error.error as ApiErrorResponse;
  }

  // Check if API call failed (success: false)
  if (errorData && errorData.success === false) {
    const statusCode = errorData.statusCode || error.status;

    // Check if errorResponse exists and has error message (for all status codes)
    if (errorData.errorResponse?.error) {
      // Include error code if it exists and is not empty
      if (errorData.errorResponse.errorCode && errorData.errorResponse.errorCode.trim()) {
        return `Error ${errorData.errorResponse.errorCode}: ${errorData.errorResponse.error}`;
      }
      return errorData.errorResponse.error;
    }

    // Check message field if it exists and is not empty (before showing interrupted message)
    if (errorData.message && errorData.message.trim()) {
      // Include error code if it exists and is not empty
      if (errorData.errorCode && errorData.errorCode.trim()) {
        return `Error ${errorData.errorCode}: ${errorData.message}`;
      }
      return errorData.message;
    }

    // For 400 status code with empty errorResponse and message, show interrupted message
    if (statusCode === 400) {
      return '[Request interrupted by user]';
    }
  }

  // Fallback: Handle specific status codes
  switch (error.status) {
    case 0:
      // Status 0 typically means the request couldn't reach the server
      return getStatus0ErrorMessage();
    case 401:
      return 'Unauthorized. Please log in again.';
    case 403:
      return 'Access forbidden.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'This record already exists. Please try again with different data.';
    case 500:
      return 'An error occurred while processing your request. Please try again later.';
    case 502:
      return 'Bad Gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway Timeout. The request took too long to process.';
    default:
      return (
        error.message || 'An error occurred while processing your request. Please try again later.'
      );
  }
}

/**
 * Get user-friendly error message for HTTP Status 0 errors
 * Status 0 typically indicates network/connectivity issues
 */
function getStatus0ErrorMessage(): string {
  return 'Unable to connect to the server. Please check your internet connection and try again.';
}
