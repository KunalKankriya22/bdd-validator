/**
 * ExternalBcDataTranslateModel
 * Represents external to blood center data translation configuration
 */
export interface ExternalBcDataTranslateModel {
  convRefValueId?: number;
  sourceId?: string;
  targetId?: string;
  sourceCodeType?: string;
  targetCodeType?: string;
  sourceValue?: string;
  targetValue?: string;
  sourceColumn?: string;
  effDate?: string | Date | null;
  termDate?: string | Date | null;
  convProcCall?: string;
}

/**
 * Request DTO for fetching External BC Data Translate data
 */
export interface ExternalBcDataTranslateParamsDto {
  searchKeyword?: string;
  sourceCodeType?: string;
  targetCodeType?: string;
  sort?: string;
}

export interface CodeDescriptionOption {
  code: string;
  description: string;
}

/**
 * Dropdown options response
 */
export interface ExternalBcDataTranslateDropdownsResponse {
  sourceIds: CodeDescriptionOption[];
  targetIds: CodeDescriptionOption[];
  sourceCodeTypes: CodeDescriptionOption[];
  targetCodeTypes: CodeDescriptionOption[];
  targetValues: string[];
}

/**
 * DTO for adding new External BC Data Translate record
 */
export interface ExternalBcDataTranslateDto {
  sourceId: string;
  targetId: string;
  sourceCodeType: string;
  targetCodeType: string;
  sourceValue: string;
  targetValue: string;
  sourceTable?: string;
  sourceColumn?: string;
  targetTable?: string;
  targetColumn?: string;
  conversionComment?: string;
  effDate: string; // ISO date string
  termDate?: string; // ISO date string or empty string
  convProcCall?: string;
}

/**
 * DTO for updating existing External BC Data Translate record
 */
export interface UpdateExternalBcDataTranslateDto {
  sourceId: string;
  targetId: string;
  oldSourceCodeType: string;
  oldSourceValue: string;
  oldTargetCodeType: string;
  oldTargetValue: string;
  sourceCodeType: string;
  targetCodeType: string;
  sourceValue: string;
  targetValue: string;
  sourceTable?: string;
  sourceColumn?: string;
  targetTable?: string;
  targetColumn?: string;
  conversionComment?: string;
  effDate: string; // ISO date string
  termDate?: string; // ISO date string or empty string
  convProcCall?: string;
}

/**
 * Source Code Description Response
 */
export interface SourceCodeDescriptionResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: {
    code: string;
    description: string;
  };
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}
