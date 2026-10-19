export interface ProductCurrentStatusQueryDto {
  unitId: string;
  productCode?: string;
  aliquot?: string;
  codeScheme?: string;
}

export interface ActiveProductDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  bloodTypeDesc?: string;
  stockState?: string;
  stockStateDesc?: string;
  locationId?: string;
  expirationDate?: string;
  productType?: string;
  productTypeDesc?: string;
  noteId?: number;
  noteText?: string;
  insertDate: string;
  applCustody?: string;
  importFlag?: string;
  inventoryClass?: string;
  inventoryClassDesc?: string;
  osokFlag?: string;
  osokFlagDesc?: string;
}

export interface ShippedProductDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  bloodTypeDesc?: string;
  shippedTo?: string;
  shippedToName?: string;
  shippedDate?: string;
  stockState: string;
  stockStateDesc?: string;
  expirationDate?: string;
  productType?: string;
  productTypeDesc?: string;
  shipmentNo?: string;
  patientId?: string;
  importFlag?: string;
  inventoryClass?: string;
  inventoryClassDesc?: string;
  osokFlag?: string;
  osokFlagDesc?: string;
  cp6Dest?: string;
  insertDate?: string;
}

export interface DiscardedProductDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  bloodTypeDesc?: string;
  discardDate: string;
  expirationDate?: string;
  productType?: string;
  productTypeDesc?: string;
  productStatus?: string;
  locationId?: string;
  rejectReason?: string;
  rejectReasonDesc?: string;
  pickSlipId?: string;
  boxId?: string;
  discardType?: string;
}

export interface UnitAntigenDto {
  unitId: string;
  testId: string;
  testDesc?: string;
  testResult?: string;
  testResultDesc?: string;
  resultDate?: string;
  confirmFlag?: string;
}

export interface UnitAttributeDto {
  attribGroup: string;
  attribCode: string;
}

export interface ProductCodeLovDto {
  productCode: string;
  productShortName?: string;
}

export interface ProductCurrentStatusSummaryDto {
  unitId: string;
  activeProducts: ActiveProductDto[];
  shippedProducts: ShippedProductDto[];
  discardedProducts: DiscardedProductDto[];
  unitAntigens: UnitAntigenDto[];
  unitAttributes: UnitAttributeDto[];
}

export interface MergedAttributeAntigenRow {
  attribute: string;
  antigen: string;
  agConfirmed: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
