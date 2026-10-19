/**
 * ReturnReasonsModel
 * Model for Return Reasons table data
 */
export interface ReturnReasonsModel {
  chapterId?: string;
  code?: string;
  codeDesc?: string;
  locationType?: string;
  crNcr?: string;
  enforce?: string;
  feeCode1?: string;
  feeCode2?: string;
  effDate?: Date | null;
  termDate?: Date | null;
  status?: string;
  lastModifiedDate?: Date | null;
}

/**
 * Request DTO for fetching Return Reasons data
 */
export interface ReturnReasonsParamsDto {
  SearchKeyword?: string;
  ChapterId?: string;
  LocationType?: string;
  CrNcr?: string;
  Enforce?: string;
  EffectiveDate?: string;
  EffectiveDatePeriod?: string;
  TerminationDate?: string;
  TerminationDatePeriod?: string;
  Sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * Filter Form Value Interface
 */
export interface ReturnReasonsFilterValue {
  locationType: string | null;
  crNcr: string | null;
  enforce: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}

/**
 * Location Type Response Model
 */
export interface LocationTypeModel {
  code: string;
  codeDesc: string;
  changeControlFlag: string;
}

/**
 * Charge Code Response Model
 */
export interface ChargeCodeModel {
  chargeCode: string;
}

/**
 * Filter LOV Model
 */
export interface ReturnReasonsFilterLov {
  chapterIds?: string[];
  codes?: string[];
  locationTypes?: string[];
  crNcrOptions?: string[];
  enforceOptions?: string[];
}

/**
 * DTO for adding new Return Reasons record
 */
export interface ReturnReasonsDto {
  code: string;
  codeDesc: string;
  locationType: string;
  crNcr: string;
  enforce: string;
  feeCode1: string;
  feeCode2: string;
  effDate: string | null;
  termDate?: string | null;
  loggedInUserName: string;
  chapterId: string;
  warehouseId: string;
  warehouseName: string;
}

/**
 * DTO for updating existing Return Reasons record
 */
export interface UpdateReturnReasonsDto {
  // Current values (to identify the record)
  currentChapterId: string;
  currentCode: string;
  currentEffDate?: string | null;

  // New values
  code: string;
  codeDesc: string;
  locationType: string;
  crNcr: string;
  enforce: string;
  feeCode1: string;
  feeCode2: string;
  effDate: string | null;
  termDate?: string | null;
  loggedInUserName: string;
  chapterId: string;
  warehouseId: string;
  warehouseName: string;
}
