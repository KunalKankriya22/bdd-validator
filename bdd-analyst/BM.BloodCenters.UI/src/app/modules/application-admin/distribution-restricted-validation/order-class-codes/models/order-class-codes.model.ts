/**
 * OrderClassCodesModel
 * Represents Order Class data structure from API
 */
export interface OrderClassCodesModel {
  orderClass?: string;
  chapterId?: string;
  description?: string;
  priority?: number;
  hours?: number;
  displayFlag?: string; // "Y" or "N"
  effectiveDate?: Date | null;
  terminationDate?: Date | null;
  modificationDate?: Date | null;
  editable?: boolean;
}

/**
 * Request DTO for fetching Order Class Codes data
 * Matches backend request structure (camelCase)
 */
export interface OrderClassCodesParamsDto {
  searchKeyword?: string;
  sort?: string; // 'A' for Ascending, 'D' for Descending
  prioritySort?: string; // 'A' for Ascending, 'D' for Descending
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

/**
 * DTO for adding new Order Class Code record
 */
export interface OrderClassCodesDto {
  orderClass: string;
  chapterId?: string;
  description: string;
  priority: number;
  hours: number;
  displayFlag: string; // "Y" or "N"
  effectiveDate: string | null;  // format: YYYY-MM-DD
  terminationDate?: string | null;  // format: YYYY-MM-DD
}

/**
 * DTO for updating existing Order Class Code record
 */
export interface UpdateOrderClassCodesDto {
  orderClass: string;
  chapterId: string;
  description: string;
  priority: number;
  hours: number;
  displayFlag: string; // "Y" or "N"
  effectiveDate: string | null;  // format: YYYY-MM-DD
  terminationDate?: string | null;  // format: YYYY-MM-DD
}
