export interface ProcessStageDto {
  processCode: string;
  stageCode: string;
  stageSequence: number | null;
  effDate: string;
  termDate: string | null;
  insertDate: string;
  insertUser: string;
  auditKey: number;
}

export interface DropdownDto {
  code: string;
  description: string;
}

export interface ProcessStageQueryDto {
  processCode?: string | null;
  stageCode?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface CreateProcessStageRequestDto {
  processCode: string;
  stageCode: string;
  stageSequence?: number | null;
  effDate: string;
  termDate?: string | null;
}

export interface UpdateProcessStageRequestDto {
  stageSequence?: number | null;
  effDate: string;
  termDate?: string | null;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  data?: any;
}
