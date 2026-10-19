import { HttpErrorResponse } from '@angular/common/http';
import { EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Utility class for handling HTTP errors in External BC Data Translate module
 */
export class ExternalBcDataTranslateErrorHandler {
  /**
   * Extract error message from HTTP error response
   * @param error - HTTP error response
   * @returns User-friendly error message
   */
  static getErrorMessage(error: any): string {
    // Priority 1: Check for specific error codes in response body (handles 400 status with error codes)
    const errorCode = error?.error?.errorResponse?.errorCode ||
                      error?.error?.ErrorResponse?.ErrorCode;

    if (errorCode === '0319') {
      return EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.CONVERSION_CODE_EXISTS;
    }

    // Priority 2: Try to get message from error response
    if (error?.error?.message) {
      return error.error.message;
    }

    // Priority 3: Handle specific HTTP status codes
    if (error instanceof HttpErrorResponse || error?.status) {
      switch (error.status) {
        case 409:
          return EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.CONVERSION_CODE_EXISTS;
        case 404:
          return EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.CONVERSION_CODE_NOT_FOUND;
        default:
          return EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.SAVE_FAILED;
      }
    }

    // Fallback to generic error message
    return EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.SAVE_FAILED;
  }
}
