/**
 * Box Details Models
 * JIRA: MLT-14101
 * Oracle Form: SHQBOXDT (BOXDTQ)
 */

/**
 * Box search result item from GET /box-details/search
 */
export interface BoxSearchResult {
  boxId: string;
  status: string | null;
  consigneeId: string | null;
  consigneeName: string | null;
  boxType: string | null;
  boxTypeDescription: string | null;
  packedBy: string | null;
  packedDate: string | null;
  warehouseId: string | null;
  warehouseDescription: string | null;
  customerId: string | null;
  customerName: string | null;
  customerType: string | null;
  orderClass: string | null;
  orderDate: string | null;
  creationDate: string;
}

/**
 * Product in a box from GET /box-details/{boxId}
 */
export interface BoxProduct {
  unitId: string;
  collectionDate: string;
  productCode: string;
  aliquot: string;
  productType: string | null;
  bloodType: string;
  bloodTypeDescription: string;
  checkDigit: string | null;
  productStatus: string | null;
  expirationDate: string | null;
  qcFlag: string | null;
  qcDate: string | null;
  inspectedBy: string | null;
  pickSlipId: string;
  tier: number | null;
  productPrice: number | null;
  itemNo: number | null;
  workOrderNo: string | null;
}

/**
 * Box details from GET /box-details/{boxId}
 */
export interface BoxDetails {
  boxId: string;
  chapterId: string;
  boxType: string;
  boxTypeDescription: string;
  boxStatus: string;
  boxStatusDescription: string;
  packedBy: string;
  packedDate: string;
  temperature: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  shipmentNo: string | null;
  customerId: string;
  customerName: string;
  consigneeId: string | null;
  consigneeName: string | null;
  warehouseId: string | null;
  creationDate: string;
  closedDate: string | null;
  productGrouping: string | null;
  productGroupingDescription: string | null;
  mfgProductType: string | null;
  mfgProductVolume: number | null;
  products: BoxProduct[];
}

/**
 * Query parameters for GET /box-details/search
 */
export interface BoxSearchParams {
  fromDate?: string;
  toDate?: string;
  status?: BoxStatusCode | null;
  searchTerm?: string | null;
  showDiscardAndMfgCustomer?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Box status codes for filter
 */
export type BoxStatusCode = 'O' | 'CL' | 'RD';

/**
 * Tab status filter (UI representation)
 */
export type BoxStatusFilter = 'all' | 'open' | 'ready';

/**
 * Box ready for shipment result from GET /api/boxes-ready-for-shipment
 * JIRA: MLT-14102, Oracle Form: SHQBOXES
 */
export interface BoxReadyForShipment {
  boxId: string;
  priority: string | null;
  consigneeName: string | null;
  estArrivalTime: string | null;
  orderNo: string | null;
  boxType: string | null;
  packedByName: string | null;
  closedDate: string | null;
}

/**
 * Query parameters for GET /api/boxes-ready-for-shipment
 */
export interface BoxesReadyForShipmentParams {
  sortOrder?: 'ASC' | 'DESC';
  take?: number;
  skip?: number;
  searchTerm?: string | null;
  priority?: string | null;
  consigneeName?: string | null;
  packedByName?: string | null;
}

/**
 * Response from GET /api/boxes-ready-for-shipment
 */
export interface BoxesReadyForShipmentResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: BoxReadyForShipment[];
  totalCount: number;
}

/**
 * Filter values for the Ready for Shipment filter panel
 */
export interface ReadyForShipmentFilterValue {
  priority: string | null;
  consignee: string | null;
  packedBy: string | null;
}

/**
 * Open Box search result — mirrors SHQOPBOX columns exactly.
 */
export interface OpenBoxSearchResult {
  boxId: string;
  warehouseId: string | null;
  warehouseDescription: string | null;
  customerName: string | null;
  customerType: string | null;
  orderClass: string | null;
  orderDate: string | null;
  packedDate: string | null;
  packedBy: string | null;
}

export interface OpenBoxPaginatedResponse {
  items: OpenBoxSearchResult[];
  totalCount: number;       // Boxes Selected (with include_flag filter)
  totalOpenBoxes: number;   // Total Open Boxes (without include_flag filter)
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

/**
 * Paginated data wrapper from API
 */
export interface PaginatedData<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Paginated API response for search endpoint
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: PaginatedData<T>;
}
