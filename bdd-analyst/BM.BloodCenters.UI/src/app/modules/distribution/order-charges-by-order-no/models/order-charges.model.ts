/**
 * Order Charges by Order No - Data Models
 *
 * This file contains all TypeScript interfaces and types for the Order Charges by Order No module.
 * Models are based on Figma design (MLT-14018) and API documentation (oeqchrg-api-documentation.md).
 * API Base: /api/order-charges
 * Created: 2026-06-03
 */

/**
 * Frontend display model for Product Charge (camelCase)
 * Used in main products table
 */
export interface ProductCharge {
  unitId: string;
  prodCode: string | null;
  productDesc: string | null;
  collDate: string | null;  // Collection Date (format from API: MM-DD-YY)
  abo: string | null;
  aliquot: string | null;
  expDate: string | null;  // Expiration Date (format from API: MM-DD-YY)
  boxId: string | null;
  price: number | null;
}

/**
 * Frontend display model for Antigen Charge
 * Used in additional charges modal - Product Antigens section
 */
export interface AntigenCharge {
  unitId: string;
  prodCode: string | null;
  aliquot: string | null;
  testId: string | null;
  price: number | null;
}

/**
 * Frontend display model for Attribute Charge
 * Used in additional charges modal - Product Attributes section
 */
export interface AttributeCharge {
  unitId: string;
  prodCode: string | null;
  aliquot: string | null;
  attributeCode: string | null;
  attributeDesc: string | null;
  price: number | null;
}

/**
 * Frontend display model for Other Charge
 * Used in additional charges modal - Order Charges section
 */
export interface OtherCharge {
  chargeCode: string;
  chargeDesc: string | null;
  amount: number | null;
}

/**
 * Frontend display model for Debit/Credit Adjustment
 * Used in grand total calculations
 */
export interface DebitCreditAdjustment {
  adjType: string | null;  // "DEBIT" or "CREDIT"
  amount: number | null;
  reason: string | null;
}

/**
 * Calculated totals for order charges
 * Used in footer totals display
 */
export interface OrderChargesTotals {
  productsTotal: number;
  antigensTotal: number;
  attributesTotal: number;
  otherDebitTotal: number;
  otherCreditTotal: number;
  grandTotal: number;
}

/**
 * Complete order charges summary
 * Main data model for the page
 */
export interface OrderChargesSummary {
  orderNo: string;
  chapterId: string;
  orderType: string | null;
  customerId: string | null;
  customerName: string | null;
  status: string | null;
  statusDesc: string | null;
  priority?: number | null;
  orderBy: string | null;
  estArrivalTime: string | null;  // DateTime (converted to chapter timezone if enabled)
  insertDate: string | null;  // DateTime
  products: ProductCharge[];
  antigens: AntigenCharge[];
  attributes: AttributeCharge[];
  otherCharges: OtherCharge[];
  adjustments: DebitCreditAdjustment[];
  totals: OrderChargesTotals;
}

/**
 * Order Type dropdown option
 * From GET /api/order-charges/order-types
 */
export interface OrderTypeDto {
  code: string;
  description: string;
}

/**
 * Order list item for dropdown
 * From GET /api/order-charges/orders
 */
export interface OrderListItemDto {
  orderNo: string;
  orderType: string;
  customerName: string;
  insertDate: string;  // Format: MM-DD-YY
}

/**
 * API response wrapper for order charges summary
 * From GET /api/order-charges/{orderNo}
 */
export interface OrderChargesSummaryApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: OrderChargesSummary;
}

/**
 * API response wrapper for order types list
 * From GET /api/order-charges/order-types
 */
export interface OrderTypesApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: OrderTypeDto[];
}

/**
 * API response wrapper for orders list
 * From GET /api/order-charges/orders
 */
export interface OrdersListApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: OrderListItemDto[];
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data: T;
}

/**
 * Filter form values
 */
export interface OrderChargesFilterForm {
  orderType: string | null;
  orderNo: string | null;
  orderBy: string | null;
}

/**
 * Audit trail entry for order history
 */
export interface AuditTrailItem {
  actionFunction: string | null;
  actionDate: string | null;
  userName: string | null;
}

/**
 * Order item (ordered product) from RegularOrder API
 */
export interface OrderedProduct {
  orderNo: string;
  itemNo: number;
  productType: string | null;
  bloodType: string | null;
  requiredQty: number;
  allocatedQty: number;
  canceledQty: number;
  itemStatus: string | null;
}

/**
 * Order note
 */
export interface OrderNote {
  noteId: number | null;
  note: string | null;
}

/**
 * Ordered antigen (from ORDER_ITEM_ANTIGENS - what was ordered, not shipped)
 */
export interface OrderedAntigenItem {
  itemNo: number;
  antigenId: string | null;
  unitPrice: number;
  resultStatus: string | null;
}

/**
 * Ordered attribute (from ORDER_ITEM_ATTRIBUTES - what was ordered, not shipped)
 */
export interface OrderedAttributeItem {
  itemNo: number;
  attribGroup: string | null;
  attribCode: string | null;
  unitPrice: number | null;
}
