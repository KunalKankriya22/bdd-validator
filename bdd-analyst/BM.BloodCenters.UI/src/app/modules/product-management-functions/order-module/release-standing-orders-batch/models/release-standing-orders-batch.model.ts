/**
 * TypeScript models for Release Standing Orders - Batch Program
 * Generated from API Documentation: /api/release-standing-orders
 * JIRA Ticket: MLT-14029
 */

/**
 * Request DTO for batch processing endpoint
 * POST /api/release-standing-orders/batch
 */
export interface ReleaseStandingOrdersBatchRequestDto {
  /** Whether to generate order slip reports (currently deferred) */
  includeReports?: boolean;
  /** If true, returns eligible orders without processing */
  previewOnly?: boolean;
}

/**
 * Response DTO for batch processing and preview endpoints
 * Contains results of batch processing or preview
 */
export interface ReleaseStandingOrdersBatchResponseDto {
  /** Number of successfully generated orders */
  processedCount: number;
  /** List of successfully created orders */
  generatedOrders: GeneratedOrderDto[];
  /** List of failed order attempts */
  failedOrders: FailedOrderDto[];
  /** Timestamp when processing completed */
  processedAt: string;
  /** Day of week processed (MON, TUE, WED, THU, FRI, SAT, SUN) */
  weekDay: string;
}

/**
 * Generated order details
 * Represents a successfully created order from a standing order
 */
export interface GeneratedOrderDto {
  /** Generated order number (format: yyddd-XXXX) */
  orderNo: string;
  /** Customer ID */
  customerId: string;
  /** Contract ID */
  contractId: string;
  /** Delivery location ID */
  consigneeId: string;
  /** Number of items in the order */
  itemCount: number;
  /** Order status (HO=Hold, OR=Ordered) */
  orderStatus: string;
  /** Whether order slip report was submitted */
  reportSubmitted: boolean;
}

/**
 * Failed order details
 * Represents a standing order that failed to process
 */
export interface FailedOrderDto {
  /** Contract ID that failed */
  contractId: string;
  /** Customer ID */
  customerId: string;
  /** Consignee ID */
  consigneeId: string;
  /** Error description */
  errorMessage: string;
  /** Day of week */
  weekDay: string;
}

/**
 * Standard API Response wrapper (for list responses)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[][];
  error?: string;
  errorCode?: string;
}

/**
 * Standard API Response wrapper (for single item responses)
 */
export interface ApiResponseSingle<T> {
  success: boolean;
  message: string;
  statusCode: number;
  item?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Order status display mapping
 */
export const ORDER_STATUS_MAP: Record<string, string> = {
  HO: 'Hold',
  OR: 'Ordered',
};

/**
 * Week day display mapping
 */
export const WEEK_DAY_MAP: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};
