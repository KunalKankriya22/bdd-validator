export interface DuattrUnitValidationResult {
  collectionDate: string;
}

export interface UnitAttributeRow {
  attribGroup: string;
  attribCode: string;
  attribDesc: string | null;
}

export interface DeleteUnitAttributesRequestBody {
  unitId: string;
  collDate: string;
  attributesToDelete: AttributeToDelete[];
}

export interface AttributeToDelete {
  attribGroup: string;
  attribCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T;
  total?: number;
  errorCode?: string;
  error?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
