export interface AvailableUnit {
  unitId: string;
  checkDigit: string | null;
  aliquot: string | null;
  productCode: string;
  productCodeDesc: string;
  bloodType: string | null;
  codeDesc: string;
  expirationDate: string | null;
  patientName: string | null;
  productType: string;
  collectionDate: string | null;
  chapterId: string;
  pickSlipId: string | null;
}

export interface CustomerInfo {
  customerId: string;
  customerName: string;
}

export interface ConsigneeInfo {
  consigneeId: string;
  consigneeName: string;
}

export interface ScheduleOrderResponse {
  orderNo: string;
  pickSlipId: string;
  unitsScheduled: number;
}

export interface AvailableUnitsQuery {
  customerId: string;
  consigneeId: string;
  take: number;
  skip: number;
}

export interface SelectedUnit {
  unitId: string;
  productCode: string;
  aliquot: string | null;
}

export interface CreateOrderRequest {
  customerId: string;
  consigneeId: string;
  selectedUnits: SelectedUnit[];
  acknowledgeRestrictedProducts?: boolean;
}

export interface CustomerLookup {
  customerId: string;
  name: string;
}

export interface ConsigneeLookup {
  consigneeId: string;
  name: string;
}

export interface ReturnResult<T> {
  success: boolean;
  statusCode: number;
  message: string;
  errorCode?: string;
  data: T[];
  total: number;
}
