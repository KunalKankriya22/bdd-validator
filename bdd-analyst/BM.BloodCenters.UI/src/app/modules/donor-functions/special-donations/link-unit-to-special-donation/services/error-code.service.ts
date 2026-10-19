import { Injectable } from '@angular/core';

/**
 * Error Code Mapping Service
 * Maps Oracle Forms error codes to user-friendly messages
 * Based on sdilunit_fmb.xml error codes
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorCodeService {

  private errorMessages: { [key: string]: string } = {
    // Date Validations
    '0060': 'Collection date cannot be in the future',
    '1145': 'Collection date is too old and exceeds the allowed limit',

    // Patient Validations
    '0080': 'Please enter either patient name or patient ID',
    '1306': 'Patient ID not found or patient has no surgery dates scheduled',

    // Unit Validations
    '1230': 'This unit is not registered in the system',
    '16157': 'Collection date does not match the registered unit date',
    '16206': 'Invalid ISBT unit prefix',
    '16211': 'ISBT unit ID characters 6-8 must be numeric',

    // Link/Unlink Operations
    '0161': 'No units available to link or unlink for this patient',
    '9163': 'Operation completed successfully',

    // Navigation
    '1700': 'Already at the first record',
    '2159': 'Already at the last record',

    // Search Results
    '14301': 'No patients found matching your search criteria',

    // Generic Errors
    'DUPLICATE_UNIT': 'This unit is already linked to this patient',
    'UNIT_NOT_FOUND': 'Unit ID not found in the system',
    'INVALID_UNIT_PATIENT': 'This unit cannot be linked to the selected patient',
    'INVALID_DATE_FORMAT': 'Invalid date format. Please use MM-DD-YYYY',
    'REQUIRED_FIELD': 'This field is required',
    'INVALID_PHONE': 'Invalid phone number format',
    'INVALID_UNIT_FORMAT': 'Invalid unit ID format',
    'NETWORK_ERROR': 'Network error. Please check your connection and try again',
    'SERVER_ERROR': 'Server error. Please try again later',
    'UNAUTHORIZED': 'You are not authorized to perform this action',
    'VALIDATION_ERROR': 'Please correct the errors before proceeding'
  };

  /**
   * Get error message by code
   */
  getErrorMessage(code: string, defaultMessage?: string): string {
    return this.errorMessages[code] || defaultMessage || 'An error occurred. Please try again.';
  }

  /**
   * Check if error code exists
   */
  hasErrorCode(code: string): boolean {
    return code in this.errorMessages;
  }

  /**
   * Get all error codes
   */
  getAllErrorCodes(): string[] {
    return Object.keys(this.errorMessages);
  }

  /**
   * Format error message with parameters
   */
  formatErrorMessage(code: string, params?: { [key: string]: any }): string {
    let message = this.getErrorMessage(code);

    if (params) {
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });
    }

    return message;
  }

  /**
   * Map API error response to error code
   */
  mapApiError(error: any): { code: string; message: string } {
    // Check if error has errorCode property
    if (error?.error?.errorResponse?.errorCode) {
      const code = error.error.errorResponse.errorCode.toString();
      return {
        code: code,
        message: this.getErrorMessage(code, error.error.errorResponse.error)
      };
    }

    // Check for HTTP status codes
    if (error?.status) {
      switch (error.status) {
        case 400:
          return { code: 'VALIDATION_ERROR', message: this.getErrorMessage('VALIDATION_ERROR') };
        case 401:
        case 403:
          return { code: 'UNAUTHORIZED', message: this.getErrorMessage('UNAUTHORIZED') };
        case 404:
          return { code: 'UNIT_NOT_FOUND', message: this.getErrorMessage('UNIT_NOT_FOUND') };
        case 500:
          return { code: 'SERVER_ERROR', message: this.getErrorMessage('SERVER_ERROR') };
        default:
          return { code: 'NETWORK_ERROR', message: this.getErrorMessage('NETWORK_ERROR') };
      }
    }

    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || error?.error?.message || 'An unexpected error occurred'
    };
  }
}
