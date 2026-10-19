export interface HlaGradingModel {
  gradeId: number;
  grade: string;
  a1: string;
  a2: string;
  b1: string;
  b2: string;
  gradeLevel: number | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  totalCount: number;
  maxGradeId: number;
}

export interface HlaGradingDropdownModel {
  grades: DropdownOption[];
  hlaCodes: DropdownOption[];
}

export interface DropdownOption {
  key: string;
  value: string;
}

export interface HlaGradingParamsDto {
  searchKeyword?: string;
  sortColumn?: string;
  sortDirection?: string;
  effectiveDatePeriod?: string;
  effectiveDate?: string;
  terminationDatePeriod?: string;
  terminationDate?: string;
}

export interface CreateHlaGradingDto {
  grade: string;
  a1: string;
  a2: string;
  b1: string;
  b2: string;
  gradeLevel: number | null;
  effectiveDate: string | null;
  terminationDate: string | null;
}

export interface UpdateHlaGradingDto {
  originalGradeId: number;
  originalGrade: string;
  originalA1: string;
  originalA2: string;
  originalB1: string;
  originalB2: string;
  grade: string;
  a1: string;
  a2: string;
  b1: string;
  b2: string;
  gradeLevel: number | null;
  effectiveDate: string | null;
  terminationDate: string | null;
}

export interface HlaGradingFilterValue {
  effectivePeriod?: string;
  effectiveDate?: string;
  terminationPeriod?: string;
  terminationDate?: string;
}

export interface HlaGradingDialogData {
  mode: 'add' | 'edit';
  record?: HlaGradingModel;
  gradeOptions: DropdownOption[];
  hlaCodeOptions: DropdownOption[];
  nextGradeId: number;
}

export interface HlaGradingDialogResult {
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total: number;
  error?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
