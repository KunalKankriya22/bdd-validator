export interface QcHistoryQueryDto {
  equipmentType?: string | null;
  equipmentId?: string | null;
  equipmentReference?: string | null;
  qcStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface QcHistoryDto {
  equipType: string;
  equipId: string;
  equipReference: string;
  equipStatus: string | null;
  qcReference: string;
  qcType: string;
  qcDate: string;
  qcTech1: string | null;
  qcTech2: string | null;
  qcStatus: string | null;
  qcStatusDesc: string | null;
}

export interface EquipmentTypeDropdownDto {
  equipType: string;
  description: string;
}

export interface EquipmentIdDropdownDto {
  equipId: string;
  equipReference: string;
  serviceDates: string;
}

export interface EquipmentRefDropdownDto {
  equipReference: string;
  serviceDates: string;
}

export interface QcStatusDropdownDto {
  code: string;
  codeDesc: string;
}

export interface QcHistoryApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  item?: boolean;
  error?: string;
  errorCode?: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}
