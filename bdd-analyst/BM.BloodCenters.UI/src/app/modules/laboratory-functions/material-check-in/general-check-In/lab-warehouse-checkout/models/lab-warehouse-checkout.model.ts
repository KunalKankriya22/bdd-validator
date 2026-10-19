/**
 * Lab Warehouse Checkout Models
 * JIRA: MLT-12943
 * Mnemonic: CPIWHOUT
 */

export interface LabWarehouseCheckoutDto {
  batchId: string;
  unitId: string;
  productCode: string;
  receiveWarehouse?: string;
  chapterId: string;
  collectionDate?: string;
  productDescription?: string;
}

export interface CreateLabWarehouseCheckoutDto {
  batchId: string;
  unitId: string;
  productCode?: string;
  receiveWarehouse?: string;
}

export interface UpdateLabWarehouseCheckoutDto {
  receiveWarehouse?: string;
}

export interface LabWarehouseCheckoutQueryDto {
  batchId?: string;
  unitId?: string;
  productCode?: string;
  receiveWarehouse?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface ValidProductDto {
  productCode: string;
  productDescription: string;
  aliquot: string;
  collectionDate?: string;
}

export interface BatchIdLovDto {
  batchId: string;
  batchName: string;
  toWarehouse: string;
  toWarehouseName: string;
  checkoutTemp: number | null;
  createDate: string;
  createUser: string;
}

export interface WarehouseLookupDto {
  warehouseId: string;
  warehouseName: string;
}

export interface ReturnResult<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: any;
}

export interface LabWarehouseCheckoutUnit {
  sequence: number;
  unitId: string;
  collectionDate: string;
  productCode: string;
  productDescription: string;
  aliquot?: string;
  batchId: string;
}

// Validation models
export interface WarningDto {
  code: string;
  message: string;
}

export interface ValidateUnitRequestDto {
  unitId: string;
  overrides?: string[];
}

export interface ValidateUnitResponseDto {
  status: 'OK' | 'WARNING' | 'ERROR';
  collDate?: string;
  hasComponents: boolean;
  products: ValidProductDto[];
  warnings: WarningDto[];
}

export interface ValidateProductRequestDto {
  unitId: string;
  productCode: string;
  collDate: string;
  overrides?: string[];
}

export interface ValidateProductResponseDto {
  status: 'OK' | 'WARNING' | 'ERROR';
  productDescription?: string;
  temperatureOk?: boolean;
  needsCmtInterdiction?: boolean;
  warnings: WarningDto[];
}
