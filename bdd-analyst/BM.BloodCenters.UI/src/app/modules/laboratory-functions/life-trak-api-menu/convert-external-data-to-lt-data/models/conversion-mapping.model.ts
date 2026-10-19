/**
 * Conversion Mapping Models and Interfaces
 * Component: Convert External Data to LT Data (APICONVL)
 */

/**
 * Source Application DTO (from LOV endpoint)
 */
export interface SourceApplicationDto {
  code: string;
  codeDesc: string;
}

/**
 * Target Value Type DTO (from LOV endpoint)
 */
export interface TargetValueTypeDto {
  code: string;
  codeDesc: string;
}

/**
 * Conversion Mapping DTO (main data model)
 */
export interface ConversionMappingDto {
  sourceApplId: string;
  sourceValueType?: string;
  sourceValue: string;
  targetApplId: string;
  targetValueType: string;
  targetValue: string;
  effDate: string;
  termDate?: string;
  insertDate?: string;
  lastModDate?: string;
  programId?: string;
}

/**
 * Query parameters for filtering conversion mappings
 */
export interface ConversionMappingQueryDto {
  sourceApplId?: string;
  targetApplId?: string;
}

/**
 * Create Conversion Mapping DTO
 * Dates are sent as YYYY-MM-DD strings to avoid timezone issues
 */
export interface CreateConversionMappingDto {
  sourceApplId: string;
  targetApplId?: string; // Defaults to 'BC' in API
  sourceValue: string;
  targetValue: string;
  targetValueType: string;
  effDate: string; // YYYY-MM-DD format
  termDate?: string; // YYYY-MM-DD format
}

/**
 * Update Conversion Mapping DTO
 * Dates are sent as YYYY-MM-DD strings to avoid timezone issues
 */
export interface UpdateConversionMappingDto {
  targetValueType: string;
  effDate: string; // YYYY-MM-DD format
  termDate?: string; // YYYY-MM-DD format
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
    message?: string;
  };
}

/**
 * Dialog data for Add Conversion Dialog
 */
export interface AddConversionDialogData {
  sourceApplId: string; // Pre-filled from main form
  targetValueTypes: TargetValueTypeDto[];
}

/**
 * Dialog data for Edit Conversion Dialog
 */
export interface EditConversionDialogData {
  mapping: ConversionMappingDto;
  targetValueTypes: TargetValueTypeDto[];
}

/**
 * Dialog result for Add/Edit operations
 */
export interface ConversionDialogResult {
  action: 'save' | 'saveAndAddNew' | 'cancel';
  data?: CreateConversionMappingDto | UpdateConversionMappingDto;
}
