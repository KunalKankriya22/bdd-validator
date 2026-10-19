export interface ValidateUnitRequest {
  unitId: string;
}

export interface UnitReference {
  tableName: string;
  columnName: string;
  recordCount: number;
  hasRecords: boolean;
}

export interface ValidateUnitItem {
  canDelete: boolean;
  unitId: string;
  validationErrors: string[];
  unitReferences: UnitReference[];
  hasPooledProducts: boolean;
  hasActiveComponents: boolean;
  unitExists: boolean;
}

export interface ValidateUnitResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: ValidateUnitItem;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DeleteUnitRequest {
  unitId: string;
  confirmed: boolean;
}

export interface DeleteUnitResponse {
  success: boolean;
  message?: string;
  statusCode: number;
  // Error fields for API-level failures
  errorCode?: string;
  error?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}
