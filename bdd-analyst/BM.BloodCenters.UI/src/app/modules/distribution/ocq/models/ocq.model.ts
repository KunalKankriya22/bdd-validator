/**
 * Customer Orders Query Models
 * JIRA: MLT-14025
 * Module: Distribution - Customer Orders Query
 */

/** Customer lookup for autocomplete */
export interface CustomerLookupDto {
  customerId: string;
  name: string;
}

/** Dropdown option for filters */
export interface DropdownOption {
  code: string;
  description: string;
}

/** Search request DTO */
export interface CustomerOrderSearchRequest {
  customerId: string;
  orderClass?: string;
  orderType?: string;
  orderStatus?: string;
  fromDate?: string;
  toDate?: string;
}

/** Order item DTO */
export interface OrderItemDto {
  itemNo: number;
  productType: string;
  productTypeDesc: string;
  bloodType: string;
  aboDesc: string;
  itemStatus: string;
  itemStatusDesc: string;
  requiredQty: number;
  allocatedQty: number;
  canceledQty: number;
  shippedQty: number;
}

/** Customer order DTO */
export interface CustomerOrderDto {
  orderNo: string;
  customerId: string;
  customerName: string;
  orderStatus: string;
  orderStatusDesc: string;
  orderType: string;
  orderTypeDesc: string;
  priority: string;
  orderDate: string;
  hoursOld: string;
  items: OrderItemDto[];
}

/** Order item attribute DTO */
export interface OrderItemAttributeDto {
  attribGroup: string;
  attribCode: string;
  attribDesc: string;
  sourceProductType?: string;
  sourceQty?: number;
  unitPrice?: number;
}

/** Order item antigen DTO */
export interface OrderItemAntigenDto {
  antigenId: string;
  antigenDesc: string;
  resultStatus: string;
  unitPrice?: number;
}

/** Order item detail DTO (includes attributes and antigens) */
export interface OrderItemDetailDto {
  orderNo: string;
  itemNo: number;
  productType: string;
  productTypeDesc: string;
  bloodType: string;
  aboDesc: string;
  itemStatus: string;
  itemStatusDesc: string;
  requiredQty: number;
  allocatedQty: number;
  canceledQty: number;
  shippedQty: number;
  attributes: OrderItemAttributeDto[];
  antigens: OrderItemAntigenDto[];
}

/** API Response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}
