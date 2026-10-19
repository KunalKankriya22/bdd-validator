/**
 * Models for Restock Unshipped Products feature
 * Based on API documentation: restock-unshipped-product-api-documentation.md
 */

/**
 * Pick Slip DTO - represents a pick slip with restockable products
 */
export interface PickSlipDto {
  pickSlipId: string;
  chapterId: string;
  totalProducts: number;
  restockableProducts: number;
  createDate: string;
  createUser?: string;
  warehouseId: string;
}

/**
 * Pick Slip Product DTO - represents a product on a pick slip
 */
export interface PickSlipProductDto {
  pickSlipId: string;
  unitId: string;
  productCode: string;
  productShortName: string;
  aliquot: string;
  chapterId: string;
  bloodType: string;
  bloodTypeDesc: string;
  expDate: string;
  collDate: string;
  productStatus: string;
  warehouseId: string;
  device?: string;
  rack?: string;
  tray?: string;
  locationId?: string;
  checkDigit?: string;
  unitSchemeType?: string;
  productType?: string;
}

/**
 * Pick Slip Query DTO - request for filtering pick slips
 */
export interface PickSlipQueryDto {
  pickSlipId?: string;
  chapterId?: string;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Restock Product Request DTO - request to restock products
 */
export interface RestockProductRequestDto {
  pickSlipId: string;
  chapterId: string;
  products: RestockProductItemDto[];
}

/**
 * Restock Product Item DTO - individual product to restock
 */
export interface RestockProductItemDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  collDate?: string;
  locationId: string;
  warehouseId: string;
  deviceType?: string;
  deviceNumber?: string;
  rackNumber?: string;
  trayNumber?: string;
  productType?: string;
}

/**
 * Restock Response DTO - response from restock operation
 */
export interface RestockResponseDto {
  productsRestocked: number;
  rowsAffected: number;
  pickSlipClosed: boolean;
  warnings?: RestockWarningDto[];
}

export interface RestockWarningDto {
  code: string;
  message: string;
}

/**
 * Storage Device DTO - from PRODUCT_STORAGE/STORAGE_DEVICES tables
 */
export interface StorageDeviceDto {
  deviceType: string;
  deviceNumber: string;
  description: string;
}

/**
 * Storage Rack DTO - from RACK_DETAILS table
 */
export interface StorageRackDto {
  rackNumber: string;
  description: string;
  mixAbo: string;
  mixProduct: string;
  trayCount: number;
}

/**
 * Storage Tray DTO - from TRAYS table
 */
export interface StorageTrayDto {
  trayNumber: string;
  shelfNumber: string;
  description: string;
  itemCount: number;
  trayCapacity: number;
  isFull: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  item?: T;
  total?: number;
}

/**
 * Product Code Option - for product code dropdown
 */
export interface ProductCodeOption {
  code: string;
  description: string;
}

/**
 * ABO/Rh Option - for blood type dropdown
 */
export interface AboRhOption {
  code: string;
  description: string;
}

/**
 * Location Option - for device/rack/tray dropdowns
 */
export interface LocationOption {
  id: string;
  name: string;
}

/**
 * Filter Criteria for products table
 */
export interface ProductFilterCriteria {
  unitId?: string;
  productCode?: string;
  aboRh?: string;
  device?: string;
  rack?: string;
  tray?: string;
}

/**
 * Extended Product DTO for display in table (includes restock status)
 */
export interface DisplayProductDto extends PickSlipProductDto {
  isRestocked: boolean;
}
