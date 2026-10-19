// ==================== API Response Wrappers ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
  statusCode: number;
}

export interface ApiItemResponse<T> {
  success: boolean;
  message?: string;
  item?: T;
  statusCode: number;
}

// ==================== Contract DTOs ====================

export interface ContractDto {
  contractId: string;
  company: string;
  centerId: string;
}

// ==================== Option Code DTOs ====================

export interface OptionCodeDto {
  value: string;
  label: string;
}

// ==================== Reason Code DTOs ====================

export interface ReasonCodeDto {
  code: string;
  codeDesc: string;
}

// ==================== Batch DTOs ====================

export interface BatchUnitsRequestDto {
  contractId: string;
  batchId: string;
}

export interface BatchUnitDto {
  unitId: string;
  collDate: string;
  osUnitId: string;
}

// ==================== Skipped Unit DTOs ====================

export interface SkippedUnitDto {
  unitId: string;
  osUnitId: string;
  collDate: string;
  skipFlag: string;
  reasonCode: string;
  reasonDescription: string;
  insertUserId?: string;
  insertDate: string;
  resetDate?: string | null;
}

export interface SkippedUnitsRequestDto {
  contractId: string;
  batchId?: string | null;
}

// ==================== Unit Validation DTOs ====================

export interface ValidateUnitRequestDto {
  contractId: string;
  unitId: string;
}

export interface UnitValidationResultDto {
  isValid: boolean;
  unitId: string | null;
  osUnitId: string | null;
  collDate: string | null;
  errorMessage: string | null;
}

// ==================== Skip Operation DTOs ====================

export interface SkipUnitItem {
  unitId: string;
  collDate: string;
  reasonCode: string;
}

export interface SkipUnitsRequestDto {
  contractId: string;
  batchId?: string;
  reasonCode?: string;
  units: SkipUnitItem[];
}

export interface SkipUnitsResultDto {
  successCount: number;
  failureCount: number;
}

// ==================== Reset Operation DTOs ====================

export interface ResetUnitItem {
  unitId: string;
  collDate: string;
}

export interface ResetUnitsRequestDto {
  contractId: string;
  reasonCode: string;
  units: ResetUnitItem[];
}

export interface ResetUnitsResultDto {
  successCount: number;
  failureCount: number;
}

// ==================== UI State Models ====================

export interface SkipResultsTableRow {
  unitId: string;
  outsideUnitId: string;
  receivedDate: string;
  reason: string;
  description: string;
  collDateIso?: string;
}

export interface TestBatchOption {
  batchId: string;
  displayText: string;
}
