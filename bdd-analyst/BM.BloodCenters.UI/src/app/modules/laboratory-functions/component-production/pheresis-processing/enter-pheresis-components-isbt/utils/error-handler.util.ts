export interface ApiError {
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  error?: {
    errorCode?: string;
    errorResponse?: {
      errorCode: string;
      error: string;
    };
    message?: string;
  };
  message?: string;
}

export function extractErrorMessage(error: ApiError, fallback: string): string {
  let errorMessage = fallback;
  let errorCode = '';

  // Extract from API response body (error.error) first, then HTTP wrapper
  if (error?.error?.errorCode) {
    errorCode = error.error.errorCode;
  } else if (error?.errorCode) {
    errorCode = error.errorCode;
  } else if (error?.error?.errorResponse?.errorCode && error.error.errorResponse.errorCode) {
    errorCode = error.error.errorResponse.errorCode;
  }

  // Extract message from API body first, skip HTTP wrapper message
  if (error?.error?.errorResponse?.error && error.error.errorResponse.error) {
    errorMessage = error.error.errorResponse.error;
  } else if (error?.error?.message) {
    errorMessage = error.error.message;
  } else if (error?.errorResponse?.error && error.errorResponse.error) {
    errorMessage = error.errorResponse.error;
  } else if (error?.message && !error?.message.startsWith('Http failure')) {
    errorMessage = error.message;
  }

  return errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
}

export function shouldClearUnitField(errorCode?: string): boolean {
  if (!errorCode) return false;

  const clearOnErrors = [
    '0063', '0095', '0065', '0039', '0135', '0155', '0137', '0400', '0188', '9752', '1251',
  ];

  return clearOnErrors.includes(errorCode);
}

export function isWeightRequired(weightRequired?: string): boolean {
  return weightRequired === 'Y';
}

export function shouldShowAttributes(attribFlag?: string): boolean {
  return attribFlag === 'Y';
}

export function isValidWeight(weight: number | null): boolean {
  if (weight === null || weight === undefined) return false;
  return weight > 0 && weight <= 999.99;
}

export function isValidVolume(volume: number | null): boolean {
  if (volume === null || volume === undefined) return false;
  return volume > 0 && volume <= 999.99;
}

export function calculateVolume(weight: number | null, specificGravity: number | null): number | null {
  if (!weight || !specificGravity || specificGravity === 0) return null;
  return parseFloat((weight / specificGravity).toFixed(2));
}

export function hasProperty<T extends object>(obj: T, prop: keyof T): boolean {
  return prop in obj;
}

export function parseIsbtCatalogScan(scannedValue: string): string | null {
  if (!scannedValue) return null;
  const trimmed = scannedValue.trim();
  if (trimmed.startsWith('=') && trimmed.length >= 12) {
    return trimmed.substring(1).trim();
  }
  return trimmed;
}

export function parseWeightScan(scannedValue: string): number | null {
  if (!scannedValue) return null;
  const trimmed = scannedValue.trim();
  const numericMatch = trimmed.match(/[\d.]+/);
  if (numericMatch) {
    const parsed = parseFloat(numericMatch[0]);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}
