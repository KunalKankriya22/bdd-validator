/**
 * Inventory Product Types data model interfaces
 * Used for Inventory Product Types table component and related services
 */

/**
 * Main Inventory Product Type data model
 * Represents a single Product Type record from the API
 */
export interface InventoryProductTypeModel {
  productType: string;
  shortName: string;
  description: string;
  price: number | null;
  lifeSpan: number | null;
  lifeSpanInd: string;
  sortSequence: number | null;
  productGrouping: string;
  aboOnly: boolean;
  rhRequired: boolean;
  importAllowed: boolean;
  pooledProduct: boolean;
  specialInventory: boolean;
  tempMax: number | null;
  tempMin: number | null;
  effectiveDate: string;
  terminationDate: string | null;
  modificationDate: string | null;
}

/**
 * Request parameters for Inventory Product Types API calls
 * Used for search, filter, and sort operations
 */
export interface InventoryProductTypeParamsDto {
  SearchKeyword?: string;
  ProductGrouping?: string;
  SpecialInventory?: boolean;
  PriceRange?: string;
  Price?: number;
  EffectiveDateFrom?: string;
  EffectiveDateTo?: string;
  TerminationDateFrom?: string;
  TerminationDateTo?: string;
  SortBy?: string;
  SortDirection?: string;
}

/**
 * API response format for Inventory Product Types table data
 * Includes pagination information
 */
export interface InventoryProductTypeResponse {
  data: InventoryProductTypeModel[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Filter state for Inventory Product Types table
 * Tracks currently applied filters
 */
export interface InventoryProductTypeFilterValue {
  productGrouping: string | null;
  specialInventory: boolean | null;
  priceRange: string | null; // 'Over' or 'Under'
  price: number | null;
  effectiveDateFrom: string | null;
  effectiveDateTo: string | null;
  terminationDateFrom: string | null;
  terminationDateTo: string | null;
}

/**
 * Code and description pair for product grouping dropdown options
 */
export interface ProductGroupingOption {
  code: string;
  description: string;
}

/**
 * Filter dropdown options (LOV - List of Values)
 * Populated from API /dropdowns endpoint
 */
export interface InventoryProductTypeFilterLov {
  productGrouping: ProductGroupingOption[];
}

/**
 * Create/Update DTO for Inventory Product Type
 * Used when creating or updating records
 * Field names match backend DTO exactly (camelCase versions of backend PascalCase)
 */
export interface InventoryProductTypeCreateDto {
  productType: string;
  shortName: string;
  description: string;
  standardPrice?: number; // Backend: StandardPrice
  lifeSpan?: number;
  lifeSpanIndicator?: string;
  sortSequence?: number;
  productGrouping: string;
  aboOnly: boolean;
  poolProduct: boolean; // Backend: PoolProduct
  specialProductType: boolean; // Backend: SpecialProductType
  shipAnyRh: boolean; // Backend: ShipAnyRh
  aboFlag: boolean; // Backend: AboFlag
  maximumTemp?: number; // Backend: MaximumTemp
  minimumTemp?: number; // Backend: MinimumTemp
  effectiveDate: string;
  terminationDate?: string;
}

/**
 * Update DTO for Inventory Product Type (same as create for this domain)
 */
export type InventoryProductTypeUpdateDto = InventoryProductTypeCreateDto;
