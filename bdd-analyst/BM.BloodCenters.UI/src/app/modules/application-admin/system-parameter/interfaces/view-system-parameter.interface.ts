/**
 * System Parameter data model interfaces
 */

export interface SystemParameterModel {
  parameterCode: string;
  chapterId: string;
  parameterType: string;
  parameterValue: string;
  description: string;
  effectiveDate: string;        // calendar date
  terminationDate: string | null;  // calendar date
  programId: string;
  insertUser: string;
}

export interface SystemParameterParamsDto {
  searchKeyword?: string;
  sortOrder?: string;
  parameterFilter?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
}

export interface SystemParameterFilterFormValue {
  parameter: string | null;
  effectivePeriod: string | null;
  effectiveDate: any | null;
  terminationPeriod: string | null;
  terminationDate: any | null;
}

export interface ParameterOption {
  parameterCode: string;
  description: string;
}

export interface SystemParameterCreateDto {
  parameterCode: string;
  chapterId: string;
  parameterType: string;
  parameterValue: string;
  description: string;
  effectiveDate: string;        // required, calendar date, must be >= today (UTC)
  terminationDate?: string;     // optional, calendar date, must be >= effectiveDate
  programId: string;
  insertUser: string;
}

export type SystemParameterUpdateDto = SystemParameterCreateDto & {
  originalParameterType?: string;
};
