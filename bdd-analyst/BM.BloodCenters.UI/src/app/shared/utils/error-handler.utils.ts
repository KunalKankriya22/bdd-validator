/**
 * Utility class for handling HTTP error responses
 * Extracts meaningful error messages from various error response structures
 */
export class HttpErrorHandler {
  /**
   * Extracts error message from API error response with priority hierarchy
   * @param error - Error object from API (unknown type for maximum compatibility)
   * @param defaultMessage - Fallback message if no specific error found
   * @returns Formatted error message, preferably with error code
   *
   * Priority order:
   * 1. Error with code: "Error {code}: {message}" (most specific)
   * 2. Error response message (without code)
   * 3. Error object's error property
   * 4. Error object's message property
   * 5. Top-level message property
   * 6. Default message (fallback)
   */
  static extractErrorMessage(error: unknown, defaultMessage: string): string {
    // Handle null/undefined early
    if (!error) {
      return defaultMessage;
    }

    // Type-safe error structure (covers most API error responses)
    const err = error as {
      error?: {
        errorResponse?: {
          error?: string;
          errorCode?: string;
        };
        error?: string;
        message?: string;
      };
      message?: string;
    };

    // Priority 1: Error with code (format: "Error {code}: {message}")
    // Most informative - includes both error code and description
    if (err.error?.errorResponse?.error && err.error?.errorResponse?.errorCode) {
      return `Error ${err.error.errorResponse.errorCode}: ${err.error.errorResponse.error}`;
    }

    // Priority 2: Error response message without code
    if (err.error?.errorResponse?.error) {
      return err.error.errorResponse.error;
    }

    // Priority 3: Error object's error property
    if (err.error?.error) {
      return err.error.error;
    }

    // Priority 4: Error object's message property
    if (err.error?.message) {
      return err.error.message;
    }

    // Priority 5: Top-level message property
    if (err.message) {
      return err.message;
    }

    // Fallback: Default message
    return defaultMessage;
  }
}
