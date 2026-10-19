/**
 * Manual Donor Interface Models
 * Models for manual donor test interface form and API
 */

/**
 * Test Result dropdown option (Prior ABO/Rh Test Result)
 */
export interface TestResultOption {
  code: string;
  description: string;
}

/**
 * Form value interface
 */
export interface ManualDonorInterfaceFormValue {
  unitId: string;
  donorVerified: string;
  hasAssertion: string;
  priorTestResult: string;
}

/**
 * API Request DTO for submitting manual donor interface
 * Maps to backend DTO (camelCase)
 */
export interface ManualDonorInterfaceSubmitDto {
  unitId: string;
  chapterId: string;
  donorChecked: string;
  permanentAssertion: string;
  priorAbo: string;
}

/**
 * API Response DTO from test results endpoint
 */
export interface TestResultsResponseDto {
  success: boolean;
  message: string;
  statusCode: number;
  data?: TestResultCodeDto[];
}

/**
 * Test Result Code DTO from backend
 */
export interface TestResultCodeDto {
  priorAbo: string;
  description: string;
}

/**
 * API Response DTO after submission
 */
export interface ManualDonorInterfaceResponseDto {
  success: boolean;
  message: string;
  statusCode?: number;
}

/**
 * Mapped test result option for UI
 */
export interface TestResultDropdownOption {
  value: string;
  display: string;
}

/**
 * Unit validation response data from BE validate-unit endpoint.
 * BE detects everything (scan/manual, Code128/Codabar, scheme) from the raw input.
 */
export interface UnitValidationResponse {
  parsedUnitId: string;
  checkDigit: string | null;
  codeScheme: 'I' | 'C';
  manualUnitId: string;
  codabarUnitScheme: 'A' | 'N' | '8' | null;

  // Detection info — BE tells FE everything
  entryMode: 'S' | 'M';           // Scan or Manual (detected by BE from content)
  barcodeType: 'CODE128' | 'CODABAR'; // Which barcode format was detected
  chapterScheme: 'I' | 'C';       // What the chapter is configured for
}

/**
 * Full API response wrapper for validate-unit endpoint
 */
export interface UnitValidationApiResponse {
  success: boolean;
  message: string;
  errorCode: string | null;
  item: UnitValidationResponse | null;
}

export interface UnitDetailsDto {
  unitId: string;
  collDate: string;
}

export interface UnitDetailsApiResponse {
  success: boolean;
  message: string;
  item: UnitDetailsDto | null;
}
