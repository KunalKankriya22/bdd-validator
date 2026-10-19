// Frontend model
export interface ProcedureCode {
  procedureCode: string;
  description: string;
  deferralDays: number;
  achievementCredits: number;
  procedureDuration: number | null;
  sequence: number;
  effectiveDate: string;
  terminationDate: string | null;
  standardRbcLoss: number;
  standardPlasmaLoss: number;
  extracorporealRbcLoss: number;
  extracorporealPlasmaLoss: number;
  chapterId?: string;
  isActive?: boolean;
}

// API Response model (PascalCase from backend)
export interface ProcedureCodeApiModel {
  ChapterId: string;
  ProcedureCode: string;
  Description: string;
  Duration: number;
  CreditCount: number;
  SchViewInterval: number | null;
  SortSequence: number;
  StandardRbcLoss: number;
  StandardPlasmaLoss: number;
  EcvRbcLoss: number;
  EcvPlasmaLoss: number;
  EffDate: string;
  TermDate: string | null;
  IsActive: boolean;
}

export interface ProcedureCodeApiResponse {
  Data: ProcedureCodeApiModel[];
  TotalCount: number;
}

export interface ProcedureCodeMutationResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item?: ProcedureCode;
  error?: string;
}

export interface ProcedureCodeFilter {
  search?: string;
  procedureCode?: string;
  deferralDays?: number | null;
  effDatePeriod?: 'before' | 'after';
  effDate?: string;
  termDatePeriod?: 'before' | 'after';
  termDate?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ProcedureCodeCreateRequest {
  procedureCode: string;
  description: string;
  duration: number;
  creditCount: number;
  schViewInterval: number | null;
  sortSequence: number;
  effDate: string;
  termDate?: string | null;
  standardRbcLoss: number;
  standardPlasmaLoss: number;
  ecvRbcLoss: number;
  ecvPlasmaLoss: number;
}

export interface ProcedureCodeUpdateRequest {
  duration: number;
  creditCount: number;
  schViewInterval: number | null;
  sortSequence: number;
  termDate?: string | null;
  standardRbcLoss: number;
  standardPlasmaLoss: number;
  ecvRbcLoss: number;
  ecvPlasmaLoss: number;
}

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export interface AddUpdateDialogData {
  mode: 'add' | 'edit';
  procedureCode?: string;
  description?: string;
  deferralDays?: number;
  achievementCredits?: number;
  procedureDuration?: number;
  sequence?: number;
  effectiveDate?: Date;
  terminationDate?: Date | null;
  standardRbcLoss?: number;
  standardPlasmaLoss?: number;
  extracorporealRbcLoss?: number;
  extracorporealPlasmaLoss?: number;
}

export interface ProcedureCodeOption {
  code: string;
  description: string;
}

// API Response models for filter dropdowns (matching backend DTOs)
export interface ProcedureCodeDropdownDto {
  procedureCode: number;
}

export interface DeferralDaysDropdownDto {
  duration: number;
}

export interface ValidProcedureTypeFilterDropdownValues {
  procedureCodes: ProcedureCodeDropdownDto[];
  deferralDays: DeferralDaysDropdownDto[];
}
