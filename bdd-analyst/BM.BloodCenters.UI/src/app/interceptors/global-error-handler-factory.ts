import { ErrorHandler, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService } from '../shared/services/snackbar.service';

/**
 * Global Error Handler Factory
 *
 * NOTE: HTTP errors are primarily handled by the authInterceptor (authInterceptor.interceptor.ts).
 * This global error handler serves as:
 * 1. A fallback for any HTTP errors that slip through the interceptor
 * 2. The primary handler for client-side JavaScript errors
 *
 * HTTP errors should rarely reach this handler since the interceptor catches them first.
 */
export function globalErrorHandlerFactory(
  injector: Injector
): ErrorHandler {
  let snackbarService: SnackbarService | null = null;

  return {
    handleError(error: Error | HttpErrorResponse): void {
      let message: string;
      const stackTrace = error instanceof Error ? error.stack : '';
      try {
        snackbarService ??= injector.get(SnackbarService);
      } catch {
        console.error('Failed to initialize SnackbarService in error handler');
      }

      if (error instanceof HttpErrorResponse) {
        // HTTP errors are handled by the interceptor, but this serves as a fallback
        message = getServerErrorMessage(error);
        console.log('Server Error (fallback):', message);
      } else {
        message = getClientErrorMessage(error, snackbarService);
        console.log('Client Error:', message);
      }

      console.log('Error:', message, stackTrace);
    }
  };
}

/**
 * Fallback handler for HTTP errors that slip through the interceptor
 * In normal operation, this should rarely be called since the interceptor handles HTTP errors
 * NOTE: Does NOT show snackbar - the interceptor already displayed it
 */
function getServerErrorMessage(error: HttpErrorResponse): string {
  const message = error.message || `HTTP Error ${error.status}: Server error occurred.`;
  // Do not show snackbar here - interceptor already handled it
  return message;
}

function getClientErrorMessage(error: Error, snackbarService: SnackbarService | null): string {
  const message = error.message || 'Client error occurred.';

  // Handle lazy loading errors (chunk load failures)
  // This typically happens when:
  // 1. New deployment occurred while user has app open
  // 2. Browser cached old chunks that no longer exist
  // 3. Network issues during lazy module loading
  if (isChunkLoadError(error)) {
    console.warn('Lazy loading failed - reloading page to fetch latest chunks:', message);
    // Check if we've already attempted a reload to prevent infinite loops
    const hasReloaded = sessionStorage.getItem('chunk-load-error-reload');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk-load-error-reload', 'true');
      window.location.reload();
      return 'Reloading application to fetch latest version...';
    } else {
      // If reload didn't fix it, clear the flag and show error
      sessionStorage.removeItem('chunk-load-error-reload');
      snackbarService?.showError('Failed to load module. Please clear your browser cache and try again.');
    }
  } else {
    snackbarService?.showError(message);
  }

  return message;
}

/**
 * Detects if an error is related to lazy loading/chunk loading failures
 */
function isChunkLoadError(error: Error): boolean {
  const errorMessage = (error.message || '').toLowerCase();
  const errorName = (error.name || '').toLowerCase();

  return (
    errorMessage.includes('failed to fetch dynamically imported module') ||
    errorMessage.includes('loading chunk') ||
    errorMessage.includes('chunk load') ||
    errorMessage.includes('failed to fetch') && errorMessage.includes('chunk') ||
    errorName.includes('chunkloaderror')
  );
}
