export interface CalculateISBTCheckDigitRequest {
  unitId: string;
}

export interface ISBTCheckDigitResult {
  unitId: string;
  checkDigit: string;
  unitIdWithCheckDigit: string;
}

export interface ISBTCheckDigitResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ISBTCheckDigitResult;
  errorResponse?: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface ISBTUnitCheckDigitDialogData {
  prefilledUnitId?: string;
}

export type ISBTUnitCheckDigitDialogResult =
  | { action: 'close' }
  | { action: 'cancel' }
  | undefined;
