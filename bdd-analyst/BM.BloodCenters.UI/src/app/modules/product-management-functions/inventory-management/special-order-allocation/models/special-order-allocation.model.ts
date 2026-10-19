/**
 * TypeScript Models and Interfaces for Special Order Allocation
 * Generated from API Documentation: special-order-allocation-api-documentation.md
 * JIRA: MLT-14033
 * Mnemonic: SALLO
 */

// ==================== Response DTOs ====================

/**
 * Main allocation response DTO
 * Represents a unit allocated to an order item on a pick slip
 */
export interface SpecialOrderAllocationDto {
  pickSlipId: string;
  itemNo: number;
  unitId: string;
  productCode: string;
  chapterId: string;
  status: string | null;
  productType?: string | null;
  bloodType?: string | null;
  abo?: string | null;
  rh?: string | null;
  expirationDate?: string | null;
  collectionDate?: string | null;
  aliquot?: string | null;
  productPrice?: number | null;
  programId?: string | null;
  orderNo?: string | null;
  // Kept for backward compatibility — API returns these as null
  quantity?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  insertDate?: string | null;
  insertUser?: string | null;
}

/**
 * Order item response DTO
 * Represents an order item needing allocation
 */
export interface OrderItemDto {
  orderNo: string;
  itemNo: number;
  productCode: string | null;
  productTypeDesc?: string | null;
  requiredQty?: number;
  canceledQty?: number | null;
  systemCancelQty?: number | null;
  tier?: number;
  unitPrice?: number | null;
  quantityAllocated?: number;
  chapterId?: string | null;
  itemStatus?: string;
  itemStatusDesc?: string | null;
  bloodType?: string | null;
  abo?: string | null;
  rh?: string | null;
  subOk?: string | null;
  allocatedQty?: number;
  attribGroup?: string | null;
  attribCode?: string | null;
  antigenCodes?: string | null;
  productType?: string | null;
  bloodTypeDesc?: string | null;
  shippedQty?: number;
  subQty?: number | null;
  attribDesc?: string | null;
  antigenId?: string | null;
  antigenDesc?: string | null;
  sourceProductType?: string | null;
  sourceQty?: number | null;
  productDescription?: string | null;
  substitutionFlag?: string | null;
  groupCode?: string | null;
  attributeCode?: string | null;
  quantity?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  specialInstructions?: string | null;
}

// ==================== Request DTOs ====================

/**
 * Query/filter DTO for searching allocations
 * Used with POST /special-order-allocation/{take}/{skip}
 */
export interface SpecialOrderAllocationQueryDto {
  orderNo?: string | null;
  pickSlipId?: string | null;
  unitId?: string | null;
  productCode?: string | null;
  status?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
  fromDate?: string | null; // ISO 8601 date string
  toDate?: string | null; // ISO 8601 date string
}

/**
 * Create allocation request DTO
 * Used with POST /special-order-allocation
 */
export interface CreateSpecialOrderAllocationRequestDto {
  pickSlipId: string;
  itemNo: number;
  unitId: string;
  productCode: string;
  productStatus?: string | null;
  productType?: string | null;
  bloodType?: string | null;
  expirationDate?: string | null;
  collectionDate?: string | null;
  aliquot?: string | null;
  productPrice?: number | null;
  orderNo?: string | null;
  // Kept for backward compatibility — not used by current API
  quantity?: number | null;
  abo?: string | null;
  rh?: string | null;
  effDate?: string | null;
  termDate?: string | null;
}

/**
 * Update allocation request DTO
 * Used with PUT /special-order-allocation/{pickSlipId}/{itemNo}/{unitId}
 */
export interface UpdateSpecialOrderAllocationRequestDto {
  unitId: string;
  productCode: string;
  productStatus?: string | null;
  // Kept for backward compatibility — not used by current API
  quantity?: number | null;
  effDate?: string | null;
  termDate?: string | null;
}

// ==================== UI Models ====================

/**
 * Order type item for dropdown
 */
export interface OrderTypeItem {
  code: string;
  description: string;
}

/**
 * Order item for dropdown and display
 */
export interface OrderItem {
  orderNo: string;
  orderType: string;
  customerName: string;
  status: string;
  priority: string;
  estimateArrivalTime: string | null;
  customerId: string | null;
  consigneeId: string | null;
}

/**
 * Order lookup item from API
 */
export interface OrderLookupDto {
  orderNo: string;
  customerId: string | null;
  customerName: string | null;
  orderStatus: string | null;
  orderStatusDesc: string | null;
  priority: string | null;
  orderDate: string | null;
}

/**
 * Order header from API
 */
export interface OrderHeaderDto {
  orderNo: string;
  orderType: string | null;
  customerName: string | null;
  orderStatus: string | null;
  orderStatusDesc: string | null;
  priority: string | null;
  estArrivalTime: string | null;
  customerId: string | null;
  consigneeId: string | null;
}

/**
 * Pick slip item for dropdown
 */
export interface PickSlipItem {
  pickSlipId: string;
  pickSlipNumber: string;
  status: string;
  warehouse: string | null;
}

/**
 * Pick slip lookup from API
 */
export interface PickSlipLookupDto {
  pickSlipId: string;
  orderNo: string;
  warehouse: string | null;
  status: string | null;
}

/**
 * Allocated unit from API
 */
export interface AllocatedUnitDto {
  itemNo: number;
  unitId: string | null;
  productCode: string | null;
  productType: string | null;
  productStatus: string | null;
  bloodType: string | null;
  aliquot: string | null;
  abo: string | null;
  rh: string | null;
  expirationDate: string | null;
  collectionDate: string | null;
  // Kept for backward compatibility — API still returns these as null
  quantity?: number | null;
  status?: string | null;
  warehouse?: string | null;
}

/**
 * Order item antigen from API
 */
export interface OrderItemAntigenDto {
  orderNo: string;
  itemNo: number;
  antigenId: string;
  antigenCode: string | null;
  resultStatus: string | null;
  chapterId: string | null;
  // Kept for backward compatibility — API still returns these as null
  antigenDesc?: string | null;
  antigenValue?: string | null;
}

/**
 * Order item attribute from API
 */
export interface OrderItemAttributeDto {
  orderNo: string;
  itemNo: number;
  attribGroup: string;
  attribCode: string;
  chapterId: string;
}

/**
 * Matching product from API
 */
export interface MatchingProductApiDto {
  unitId: string;
  productCode: string;
  productType: string | null;
  productDescription: string | null;
  bloodType: string | null;
  abo: string | null;
  rh: string | null;
  expirationDate: string | null;
  collectionDate: string | null;
  inventoryClass: string | null;
  stockState: string | null;
  warehouse: string | null;
  aliquot: string | null;
}

/**
 * Matching products query for API
 */
export interface MatchingProductsQueryApiDto {
  orderNo: string;
  itemNo: number;
  productCode: string | null;
  productType: string | null;
  bloodType: string | null;
  orderType: string | null;
  subProduct: boolean;
  subAbo: boolean;
  source: boolean;
  ignoreClass: boolean;
  attCount: number;
  antCount: number;
  take?: number;
  skip?: number;
}

/**
 * Allocate units request for API
 */
export interface AllocateUnitsRequestApiDto {
  orderNo: string;
  itemNo: number;
  pickSlipId: string | null;
  customerId: string | null;
  productType: string | null;
  bloodType: string | null;
  tier: number;
  unitPrice: number;
  unitIds: string[];
  source?: boolean;
}

/**
 * Allocate units response from API
 */
export interface AllocateUnitsResponseDto {
  successCount: number;
  failedCount: number;
  pickSlipId: string | null;
  inventoryWarning?: InventoryWarningDto | null;
}

export interface InventoryWarningDto {
  productType: string;
  bloodType: string;
  available: number;
  minimal: number;
  belowMinimal: boolean;
}

/**
 * Inventory summary from API
 */
export interface InventorySummaryApiDto {
  minimal: number;
  optimal: number;
  maxTier: number;
  tiers: InventoryTierDetailApiDto[];
}

/**
 * Inventory tier detail from API
 */
export interface InventoryTierDetailApiDto {
  tier: number;
  fromDay: number;
  toDay: number;
  unitPrice: number;
  inStock: number;
  onOrder: number;
  allocated: number;
  packed: number;
  available: number;
}

/**
 * Order item table row
 * Combined data for displaying order items with allocation info
 */
export interface OrderItemTableRow {
  itemNo: number;
  productCode: string;
  productDescription: string;
  aboRh: string;
  substitutionFlag: string;
  orderedQuantity: number;
  allocatedQuantity: number;
  allocatedQuantityDisplay: string;
  groupCode: string;
  attributeCode: string;
  antigenCodes: string;
  orderNo: string;
  bloodType: string | null;
  abo: string | null;
  rh: string | null;
  subOk: string | null;
  tier: number;
  unitPrice: number;
}

/**
 * Allocated unit for Units Allocated dialog
 */
export interface AllocatedUnitRow {
  itemNo: number;
  unitId: string;
  productCode: string;
  aliquot: string;
  expirationDate: string;
  warehouse: string;
  pickSlipId: string;
}

/**
 * Stock tier row for View Stock dialog
 */
export interface StockTierRow {
  tier: number;
  from: number;
  to: number;
  days: string; // "Days" label
  stock: number;
  order: number;
  alloc: number;
  pack: number;
  avail: number;
}

/**
 * Stock summary for View Stock dialog header
 */
export interface StockSummary {
  productCode: string;
  productDescription: string;
  aboRh: string;
  optimal: number;
  minimal: number;
  tiers: StockTierRow[];
  totalStock: number;
  totalOrder: number;
  totalAlloc: number;
  totalPack: number;
  totalAvail: number;
}

export interface UnitAntigenDto {
  testId: string;
  testResult: string;
  confirmStatus: string | null;
}

export interface UnitAttributeDto {
  attribGroup: string;
  attribCode: string;
}

export interface UnitAntigenAttributeDto {
  antigens: UnitAntigenDto[];
  attributes: UnitAttributeDto[];
}

export interface AntigenAttributeRow {
  antigen: string;
  result: string;
  confirmed: string;
  attributesGroup: string;
  attributesCode: string;
}

/**
 * Matching product row for Matching Products dialog
 */
export interface MatchingProductRow {
  selected: boolean;
  unitId: string;
  productCode: string;
  aboRh: string;
  expirationDate: string;
  warehouse: string;
  collectionDate: string;
  abo: string | null;
  rh: string | null;
}

/**
 * Matching products dialog data
 */
export interface MatchingProductsDialogData {
  itemNo: number;
  productCode: string;
  productDescription: string;
  aboRh: string;
  need: number;
  found: number;
  allocat: number;
  orderNo: string;
  pickSlipId: string | null;
  antigenCodes: string[];
  matchingProducts: MatchingProductRow[];
  abo: string | null;
  rh: string | null;
  bloodType: string | null;
  subProduct: boolean;
  subAbo: boolean;
  source: boolean;
  productType: string | null;
  orderType: string | null;
  customerId: string | null;
  tier: number;
  unitPrice: number;
  attCount: number;
  antCount: number;
}

/**
 * Search criteria for matching products
 */
export interface MatchingCriteria {
  abo: boolean;
  product: boolean;
  source: boolean;
  ignoreClass: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  message: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
