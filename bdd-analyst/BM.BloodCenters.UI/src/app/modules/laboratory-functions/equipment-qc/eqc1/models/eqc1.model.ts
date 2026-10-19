export interface EquipmentType {
  code: string;
  description: string;
}

export interface EquipmentLookup {
  equipId: string;
  equipReference: string;
}

export interface QcType {
  qcType: string;
  description: string;
}

export interface QcResult {
  code: string;
  description: string;
}

export interface QcControlDetail {
  qcId: string;
  refNumber: string;
  arrangeBy: number;
  qcItem: string;
  qcUnits: string;
  targetValue: string;
  minAccept: string;
  maxAccept: string;
}

export interface QcHeaderResponse {
  equipReference: string;
  equipmentType: string;
  qcReference: string;
  qcId: string;
  qcType: string;
  qcTypeDescription: string;
  qcDate: string;
  qcTech1: string;
  qcTech2: string | null;
  qcResult1: string;
  qcResult1Description: string;
  qcResult2: string | null;
  qcResult2Description: string | null;
  qcStatus: string;
  qcStatusDescription: string;
  insertDate: string;
  lastModifiedDate: string;
  modifiedBy: string;
}

export interface QcDetailResponse {
  qcReference: string;
  qcId: string;
  arrangeBy: number;
  expectedValue: string;
  minimumValue: string;
  maximumValue: string;
  actualValue: string;
  interpretation: string;
  interpretation2: string | null;
  insertDate: string;
  insertedBy: string;
}

export interface QcEvent {
  qcReference: string;
  qcType: string;
  qcDate: string;
  qcStatus: string;
}

export interface ReviewCode {
  reviewCode: string;
}

export interface BarcodeResponse {
  equipmentReference: string;
  equipmentType: string;
  equipmentId: string;
  isValid: boolean;
}

export interface SystemUser {
  userId: string;
  userName: string;
}

export interface QcProcedure {
  qcId: string;
  refNumber: string;
  arrangeBy: number;
  qcItem: string;
  qcUnits: string;
  targetValue: string;
  minAccept: string;
  maxAccept: string;
  actualValue: string;
  interpretation: string | null;
  interpretation2: string | null;
}

export interface QcDetailHeader {
  qcRefNo: string;
  qcTypeCode: string;
  qcTypeDescription: string;
  qcTech1: string;
  qcResultCode: string;
  qcResultDescription: string;
  qcStatus: string;
  qcStatusDescription: string;
}

export interface CreateQcDetailItem {
  qcId: string;
  refNumber: string | null;
  arrangeBy: number;
  actualValue: string;
  interpretation: string | null;
  interpretation2: string | null;
}

export interface CreateQcRequest {
  equipmentReference: string;
  equipmentType: string;
  qcType: string;
  qcTech1: string;
  qcDate: string;
  qcResult1: string;
  details: CreateQcDetailItem[];
}

export interface UpdateQcHeaderRequest {
  qcType: string;
  qcDate: string;
  qcTech1: string;
  qcTech2?: string;
  qcResult1: string;
  qcResult2?: string;
}

export interface UpdateQcDetailsRequest {
  details: CreateQcDetailItem[];
}

export interface CreateQcResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: {
    qcReference: string;
    qcStatus: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
  total?: number;
  errorResponse?: {
    errorCode: string;
    errorMessage: string;
  };
}
