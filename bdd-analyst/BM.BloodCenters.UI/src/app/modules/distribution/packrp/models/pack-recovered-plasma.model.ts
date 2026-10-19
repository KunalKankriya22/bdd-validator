/**
 * Pack Recovered Plasma - TypeScript Models and DTOs
 * Based on API Documentation: pkrepcl-api-documentation.md
 * JIRA: MLT-14014
 */

/**
 * Customer Selection DTO (Response)
 * Endpoint: GET /api/pack-recovered-plasma/customers
 */
export interface CustomerSelectionDto {
  customerId: string;
  customerName: string;
  consigneeId: string;
  consigneeName: string;
  contractNumber: string | null;
  contractEffDate: string | null;
  contractTermDate: string | null;
  hasValidContract: boolean;
}

/**
 * Order DTO (Response)
 * Endpoint: GET /api/pack-recovered-plasma/orders
 */
export interface OrderDto {
  orderId: string;
  customerId: string;
  customerName: string;
  consigneeId: string;
  consigneeName: string;
  orderDate: string;
  status: string;
  totalItems: number;
  packedItems: number;
  remainingItems: number;
}

/**
 * Pick Slip Query DTO (Request)
 * Endpoint: POST /api/pack-recovered-plasma/pick-slips/{take}/{skip}
 */
export interface PickSlipQueryDto {
  pickSlipId?: string | null;
  customerId?: string | null;
  consigneeId?: string | null;
  orderId?: string | null;
  productCode?: string | null;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * Pick Slip DTO (Response)
 * Endpoint: GET /api/pack-recovered-plasma/pick-slips/{id}
 * Endpoint: POST /api/pack-recovered-plasma/pick-slips/{take}/{skip}
 */
export interface PickSlipDto {
  pickSlipId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  consigneeId: string;
  consigneeName: string;
  productCode: string;
  aboType: string;
  quantityOrdered: number;
  quantityPacked: number;
  status: string;
  insertDate?: string;
  insertUser?: string;
}

/**
 * Create Pick Slip Request DTO
 * Endpoint: POST /api/pack-recovered-plasma/pick-slips
 */
export interface CreatePickSlipRequestDto {
  orderId: string;
  customerId: string;
  consigneeId: string;
  productCode: string;
  aboType: string;
}

/**
 * Create Pick Slip Response DTO
 */
export interface CreatePickSlipResponseDto {
  pickSlipId: string;
}

/**
 * Box DTO (Response)
 * Endpoint: GET /api/pack-recovered-plasma/boxes/{pickSlipId}
 * Endpoint: GET /api/pack-recovered-plasma/boxes/{boxId}
 */
export interface BoxDto {
  boxId: string;
  pickSlipId: string;
  maxCapacity: number;
  currentCount: number;
  remainingCapacity: number;
  percentageFull: number;
  isAtCapacity: boolean;
  status: string;
  insertDate?: string;
  insertUser?: string;
}

/**
 * Create Box Request DTO
 * Endpoint: POST /api/pack-recovered-plasma/boxes
 */
export interface CreateBoxRequestDto {
  pickSlipId: string;
  maxCapacity: number;
  boxId?: string | null;
  productType?: string;
}

/**
 * Create Box Response DTO
 */
export interface CreateBoxResponseDto {
  boxId: string;
}

/**
 * Pack Product Request DTO
 * Endpoint: POST /api/pack-recovered-plasma/pack
 */
export interface PackProductRequestDto {
  dinNumber: string;
  boxId: string;
  pickSlipId: string;
  productCode: string;
  barcodeScheme?: string | null;
  customerId?: string | null;
  consigneeId?: string | null;
  orderNo?: string | null;
  productType?: string | null;
  chapterId?: string | null;
  validateAboCompatibility?: boolean;
  validateExpiry?: boolean;
  validateInterdictions?: boolean;
  validateTier?: boolean;
  autoCreateOrder?: boolean;
  autoCloseBox?: boolean;
}

/**
 * Pack Product Response DTO
 */
export interface PackProductResponseDto {
  dinNumber: string;
  boxId: string;
  currentCount: number;
  remainingCapacity: number;
  boxClosed?: boolean;
  tier?: number;
  orderNo?: string;
  pickSlipId?: string;
}

/**
 * Unpack Product Request DTO
 * Endpoint: POST /api/pack-recovered-plasma/unpack
 */
export interface UnpackProductRequestDto {
  dinNumber: string;
  boxId: string;
  pickSlipId: string;
}

/**
 * Unpack Product Response DTO
 */
export interface UnpackProductResponseDto {
  dinNumber: string;
  boxId: string;
  currentCount: number;
  remainingCapacity: number;
}

/**
 * Product DTO (Response)
 * Endpoint: GET /api/pack-recovered-plasma/products/available
 */
export interface ProductDto {
  dinNumber: string;
  productCode: string;
  productDescription: string;
  aboRh: string;
  expirationDate: string;
  stockState: string;
  barcodeScheme: string;
}

/**
 * Product Detail DTO (Response)
 * Endpoint: GET /api/v1/pack-recovered-plasma/products/detail/{din}
 */
export interface ProductDetailDto {
  dinNumber: string;
  productCode: string;
  collectionDate?: string;
  barcodeScheme?: string;
  barcodeSchemeLabel?: string;
  componentWeight?: number;
  componentVolume?: number;
}

/**
 * Packed Product DTO (Response)
 * Endpoint: GET /api/pack-recovered-plasma/packed-products/box/{boxId}
 * Endpoint: GET /api/pack-recovered-plasma/packed-products/pickslip/{pickSlipId}
 */
export interface PackedProductDto {
  dinNumber: string;
  pickSlipId: string;
  boxId: string;
  productCode: string;
  productDescription?: string;
  aboRh: string;
  expirationDate: string;
  stockState?: string;
  barcodeScheme?: string;
  collectionDate?: string;
  componentWeight?: number;
  componentVolume?: number;
  insertDate?: string;
  insertUser?: string;
}

/**
 * Pick Slips Query Response
 */
export interface PickSlipsQueryResponseDto {
  data: PickSlipDto[];
  totalCount: number;
}

/**
 * Volume Summary (Computed)
 * Used for displaying volume totals in UI
 */
export interface VolumeSummary {
  previousVolume: number;
  currentVolume: number;
  totalVolume: number;
}

/**
 * Product Input Form Data
 * Used for the input section of the form
 */
export interface ProductInputData {
  unitId: string;
  productCode: string;
}

/**
 * Error Response Structure from API
 */
export interface PackRecoveredPlasmaErrorResponse {
  errorCode: string;
  error: string;
}
