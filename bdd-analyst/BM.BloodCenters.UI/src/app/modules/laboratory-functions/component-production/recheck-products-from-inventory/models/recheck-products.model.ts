export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  item?: T;
  data?: T[];
  total?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

export interface ValidateUnitRequest {
  unitId: string;
}

export interface ValidateUnitResponse {
  unitId: string;
  collectionDate: string;
  isEligible: boolean;
  availableComponents: AvailableComponent[];
  hasInterdictions: boolean;
  warnings: RecheckWarning[];
}

export interface AvailableComponent {
  productCode: string;
  productDescription: string;
}

export interface ValidateComponentRequest {
  unitId: string;
  productCode: string;
  collectionDate: string;
  chapterId: string;
  codeScheme?: string;
}

export interface ValidateComponentResponse {
  productCode: string;
  description: string;
  expiryDate: string | null;
  componentStatus: string;
  isEligible: boolean;
  warnings: RecheckWarning[];
}

export interface RecheckProcessRequest {
  unitId: string;
  productCode: string;
  collectionDate: string;
  chapterId: string;
  allowExpired?: boolean;
  codeScheme?: string;
  entryMode?: 'S' | 'M';
}

export interface RecheckResultResponse {
  unitId: string;
  productCode: string;
  productDescription: string;
  expiryDate: string | null;
  previousStatus: string;
  newStatus: string;
  recheckDate: string;
  recheckUser: string;
  warehouseId: string | null;
  warnings: RecheckWarning[];
}

export interface RecheckWarning {
  code: string;
  message: string;
}

export interface RecheckTableEntry {
  unitId: string;
  productCode: string;
  productDescription: string;
  expiryDate: string | null;
}
