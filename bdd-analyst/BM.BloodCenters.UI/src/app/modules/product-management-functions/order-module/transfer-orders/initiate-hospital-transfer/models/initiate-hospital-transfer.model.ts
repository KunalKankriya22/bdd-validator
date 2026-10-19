export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface OrderSearchResultDto {
  orderNo: string;
  consigneeId?: string;
  consigneeName?: string;
  class?: string;
  age?: number;
  priority?: string;
}

export interface SelectOrderDialogData {
  orders: OrderSearchResultDto[];
  selectedOrderNo?: string;
}

export interface OrderHeaderDto {
  orderNo: string;
  consigneeId: string;
  consigneeName: string;
  shipmentAge: number;
  status: string;
  priority: string;
  type: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  itemNo: number;
  product: string;
  description: string;
  aboRh: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  remainingQuantity: number;
  substitution: string;
  status: string;
}

export interface AttributeDto {
  group: string;
  attributeCode: string;
  attributeDescription: string;
}

export interface AntigenDto {
  antigenCode: string;
  antigenDescription: string;
}

export interface AttributeAntigenDto {
  orderNo: string;
  itemNo: number;
  productType: string;
  attributes: AttributeDto[];
  antigens: AntigenDto[];
}

export interface ProductAvailableDto {
  fromHospital: string;
  unitId: string;
  productCode: string;
  productType: string;
  aboRh: string;
  expirationDate: string;
  transferSlipSelected: string;
  contactPerson: string;
  phoneNumber: string;
}

export interface HospitalGroup {
  hospitalName: string;
  contactPerson: string;
  phoneNumber: string;
  products: ProductAvailableDto[];
}

export interface ProductsAvailableHeaderDto {
  itemNo: number;
  productType: string;
  quantityNeed: number;
  hospitalName: string;
  contactPerson: string;
  phoneNumber: string;
  quantityAvailable: number;
  products: ProductAvailableDto[];
}

export interface PrintTransferSlipRequest {
  orderNo: string;
  itemNo: number;
  unitIds: string[];
}

export interface PrintTransferSlipResponse {
  transferSlipNumber: string;
}

export interface ViewAttributeAntigenDialogData {
  orderNo: string;
  itemNo: number;
  productType: string;
  attributes: AttributeDto[];
  antigens: AntigenDto[];
}

export interface ProductsAvailableDialogData {
  orderNo: string;
  header: ProductsAvailableHeaderDto;
}
