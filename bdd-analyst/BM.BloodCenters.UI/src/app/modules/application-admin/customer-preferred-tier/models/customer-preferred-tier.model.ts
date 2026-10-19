/**
 * CustomerPreferredTierModel
 * Represents Customer Preferred Tier data displayed in table
 */
export interface CustomerPreferredTierModel {
  productType?: string;
  chapterId?: string;
  customerId?: string;
  tier?: number;
  effDate?: Date | null;
  termDate?: Date | null;
  productTypeDesc?: string;
  customerName?: string;
  fromDay?: number;
  toDay?: number;
  unitPrice?: number;
  lifeSpan?: number;
  lifeSpanInd?: string;
  lastModifiedDate?: Date | null;
  lastModifiedUser?: string;
}

/**
 * Request DTO for fetching Customer Preferred Tier data with filters
 */
export interface CustomerPreferredTierQueryDto {
  productType?: string | null;
  customerId?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
  effDatePeriod?: string | null;
  effDateFilter?: string | null;
  termDatePeriod?: string | null;
  termDateFilter?: string | null;
}

/**
 * DTO for creating new Customer Preferred Tier record
 */
export interface CreateCustomerPreferredTierRequestDto {
  productType: string;
  tier: number;
  effDate: string;
  termDate?: string | null;
}

/**
 * DTO for updating existing Customer Preferred Tier record
 */
export interface UpdateCustomerPreferredTierRequestDto {
  tier: number;
  effDate: string;
  termDate?: string | null;
}

/**
 * Customer dropdown item
 */
export interface CustomerDropdownDto {
  customerId: string;
  customerName: string;
}

/**
 * Product Type dropdown item
 */
export interface ProductTypeDropdownDto {
  productType: string;
  productTypeDesc: string;
}

/**
 * Pricing Tier dropdown item
 */
export interface PricingTierDropdownDto {
  tier: number;
  fromDay: number;
  toDay: number;
  unitPrice: number;
  lifeSpan: number;
  lifeSpanInd: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface CustomerPreferredTierFilterValue {
  productType: string | null;
  effDatePeriod: string | null;
  effDateFilter: string | null;
  termDatePeriod: string | null;
  termDateFilter: string | null;
}

/**
 * Filter LOV Model for dropdowns
 */
export interface CustomerPreferredTierFilterLov {
  customers?: CustomerDropdownDto[];
  productTypes?: ProductTypeDropdownDto[];
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
