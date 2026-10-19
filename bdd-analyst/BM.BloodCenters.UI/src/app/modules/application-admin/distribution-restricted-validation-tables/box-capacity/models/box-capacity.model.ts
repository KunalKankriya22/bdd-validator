/**
 * BoxCapacityModel
 * Represents Box Capacity data
 */
export interface BoxCapacityModel {
  boxType?: string;
  boxDescription?: string;
  inventoryProdType?: string;
  prodDescription?: string;
  capacity?: number;
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  lastModificationDate?: Date | null;
}

/**
 * Request DTO for fetching Box Capacity data
 */
export interface BoxCapacityParamsDto {
  searchKeyword?: string;
  boxType?: string;
  productType?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  capacity?: number;
  capacityRange?: string;
  sort?: string;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface BoxCapacityFilterValue {
  boxType: string | null;
  inventoryProductType: string | null;
  capacityRange: string | null; // "Over" or "Under"
  capacity: number | null;
  effectiveDatePeriod: string | null; // "After" or "Before"
  effectiveDate: Date | null;
  terminationDatePeriod: string | null; // "After" or "Before"
  terminationDate: Date | null;
}

/**
 * Box Type LOV Item
 */
export interface BoxTypeLov {
  boxType: string;
  boxTypeDescription: string;
}

/**
 * Inventory Product Type LOV Item
 */
export interface InventoryProductTypeLov {
  inventoryProductType: string;
  productTypeDescription: string;
}

/**
 * Filter LOV Model
 */
export interface BoxCapacityFilterLov {
  boxTypes?: BoxTypeLov[];
  inventoryProdTypes?: InventoryProductTypeLov[];
}

/**
 * DTO for adding new Box Capacity record
 */
export interface BoxCapacityDto {
  boxType: string;
  productType: string;
  capacity: number;
  effectiveDate: string;
  terminationDate?: string;
  chapterId?: string;
}

/**
 * DTO for updating existing Box Capacity record
 * Same structure as BoxCapacityDto
 */
export interface UpdateBoxCapacityDto {
  boxType: string;
  productType: string;
  capacity: number;
  effectiveDate: string;
  terminationDate?: string;
  chapterId?: string;
}
