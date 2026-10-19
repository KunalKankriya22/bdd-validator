/**
 * DTOs for Cancel Unfilled Orders feature
 * Based on API Documentation: /api/v1/cancel-unfilled-orders
 * JIRA Ticket: MLT-14131
 */

/**
 * Standard API response wrapper matching Atlas Framework ReturnResult<T>
 */
export interface ReturnResult<T = void> {
  success: boolean;
  message: string;
  statusCode: number;
  item?: T;
  data?: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

/**
 * Order search criteria (query parameters)
 */
export interface OrderSearchCriteriaDto {
  hoursOld?: number;
  orderNo?: string;
}

/**
 * Lightweight LOV item for Order dropdown
 */
export interface EligibleOrderLovDto {
  orderNo: string;
  customerId: string;
  customerName: string | null;
  orderStatus: string;
  ageInHours: number | null;
}

/**
 * Order type lookup for Type dropdown
 */
export interface OrderTypeLookupDto {
  orderType: string;
  orderTypeDesc: string;
}

/**
 * Order class lookup for Class filter
 */
export interface OrderClassLookupDto {
  orderClass: string;
  orderClassDesc: string;
}

/**
 * Order item attribute detail
 */
export interface OrderItemAttributeDto {
  orderNo: string;
  itemNo: number;
  attribGroup: string | null;
  attribCode: string | null;
  attribDesc: string | null;
  chapterId: string | null;
}

/**
 * Order detail with optional order items
 */
export interface OrderDetailDto {
  chapterId: string;
  orderNo: string;
  customerId: string;
  customerName: string | null;
  orderType: string | null;
  orderTypeDesc: string | null;
  orderClass: string | null;
  orderClassDesc: string | null;
  orderStatus: string | null;
  contractId: string | null;
  consigneeId: string | null;
  standingOrderFlag: string | null;
  insertDate: string | null;
  estArrivalTime: string | null;
  ageInHours: number | null;
  hasUnfilledItems: boolean;
  orderItems: OrderItemDetailDto[];
}

/**
 * Order item detail with unfilled quantity calculation
 */
export interface OrderItemDetailDto {
  chapterId: string;
  orderNo: string;
  itemNo: number;
  productType: string | null;
  productTypeDesc: string | null;
  bloodType: string | null;
  aboDesc: string | null;
  tier: number | null;
  requiredQty: number | null;
  allocatedQty: number | null;
  canceledQty: number | null;
  systemCancelQty: number | null;
  shippedQty: number | null;
  itemStatus: string | null;
  unfilledQty: number | null;
  balance?: number | null;
}

/**
 * Cancel order request (confirmation required)
 */
export interface CancelOrderRequestDto {
  Confirmation: string;
}

/**
 * Cancel order response
 */
export interface CancelOrderResponseDto {
  orderNo: string;
  message: string;
  itemsUpdated: number;
  success: boolean;
  updatedOrder?: OrderDetailDto;
}
