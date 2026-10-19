export interface UnitValidationResponse {
  parsedUnitId: string;
  checkDigit: string | null;
  codeScheme: 'I' | 'C';
  manualUnitId: string;
  codabarUnitScheme: 'A' | 'N' | '8' | null;
  entryMode: 'S' | 'M';
  barcodeType: 'CODE128' | 'CODABAR';
  chapterScheme: 'I' | 'C';
}

export interface UnitValidationApiResponse {
  success: boolean;
  message: string;
  errorCode: string | null;
  item: UnitValidationResponse | null;
}
