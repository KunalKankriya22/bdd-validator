export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface OrderSearchResultDto {
  orderNo: string;
  orderName?: string;
  orderDate?: string;
}

export interface OrderChargesHeaderDto {
  orderNo: string;
  orderName?: string;
  customerName?: string; // API uses customerName
  orderDate: string;
  charges: OrderChargeDto[];
  grandTotal?: number;
}

export interface OrderChargeDto {
  orderChargeRowId?: string;
  chargeId?: number | string;
  serviceCode: string;
  serviceDescription: string;
  creditDebit?: string;
  debitCredit?: string;
  quantity: number;
  amount: number;
  isAmountEditable?: boolean;
  lastModified?: string;
}

export interface ServiceCodeDto {
  code: string;
  description: string;
  defaultAmount?: number;
  isAmountEditable?: boolean;
}

export interface CrDbIndicatorDto {
  code: string;
  description: string;
}

export interface AddChargeRequest {
  serviceCode: string;
  creditDebit: string;
  quantity: number;
  amount: number;
}

export interface UpdateChargeRequest {
  serviceCode: string;
  creditDebit: string;
  quantity: number;
  amount: number;
  rowId?: string;
}

export interface OrderItemDto {
  itemNo: number;
  product: string;
  aboRh: string;
  requiredQuantity: number;
  canceledQuantity: number;
  unitPrice: number;
}

export interface ItemAntigenDto {
  itemNo: number;
  antigen: string;
  result: string;
  unitPrice: number;
}

export interface ItemAttributeDto {
  itemNo: number;
  group: string;
  code: string;
  unitPrice: number;
}

export interface ItemAttributesAntigensDto {
  antigens: ItemAntigenDto[];
  attributes: ItemAttributeDto[];
}

export interface AddEditChargeDialogData {
  mode: 'add' | 'edit';
  orderNo: string;
  charge?: OrderChargeDto;
  serviceCodes: ServiceCodeDto[];
  crDbIndicators: CrDbIndicatorDto[];
}

export interface OrderItemsDialogData {
  orderNo: string;
  items: OrderItemDto[];
}

export interface AttributesAntigensDialogData {
  antigens: ItemAntigenDto[];
  attributes: ItemAttributeDto[];
}
