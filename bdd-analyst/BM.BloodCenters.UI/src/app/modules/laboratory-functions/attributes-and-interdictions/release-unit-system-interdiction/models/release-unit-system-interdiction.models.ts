export interface ValidateUnitResponseDto {
  unitId: string;
  collDate: string;
  isValid: boolean;
  parsedUnitId: string;
  checkDigit: string | null;
  codeScheme: 'I' | 'C';
  manualUnitId: string;
  codabarUnitScheme: 'A' | 'N' | '8' | null;
  entryMode: 'S' | 'M';
  barcodeType: 'CODE128' | 'CODABAR';
  chapterScheme: 'I' | 'C';
}

export interface UnitSystemInterdictionDto {
  unitId: string;
  collDate: string;
  interCode: string;
  interDesc: string | null;
  interType: string | null;
  interTypeDesc: string | null;
  chapterId: string;
  insertDate: string;
  insertUser: string;
}

export interface ReleaseUnitSystemInterdictionsRequestDto {
  unitId: string;
  collDate: string;
  interCodes: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  item?: T;
  total?: number;
  error?: string;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
}
