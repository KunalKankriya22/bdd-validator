// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error?: string | null;
  errorCode?: string | null;
  statusCode: number;
  data: T[] | T | null;
  item?: any;
  total?: number;
  totalCount?: number;
  errorResponse?: any;
}

// Valid Catalog Number DTO
export interface ValidCatalogDto {
  catalogNumber: string;
  manufacturerCode: string;
  manufacturer: string;
  totalBagsInSet: number;
  numberOfProds: number;
  bagType: string;
  bagVolume: number | null;
  weightOfBag: number | null;
  collectionVolume: number | null;
  anticoagulant: string | null;
  additiveSolution: string | null;
  instSpecificCode: string | null;
  bagStorageRestriction: string | null;
  effDate: string | null;
  termDate: string | null;
  lastModifiedDate?: string | null;
  chapterId?: string;
}

// Query Parameters for listing
export interface ValidCatalogQueryParams {
  catalogNumber?: string;
  manufacturerCode?: string;
  manufacturer?: string;
  showTerminated?: string; // 'Y' or 'N'
  effDate?: string;
  effDatePeriod?: 'after' | 'before';
  termDate?: string;
  termDatePeriod?: 'after' | 'before';
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Filter values for UI
export interface ValidCatalogFilterValue {
  catalogNumber?: string;
  manufacturerCode?: string;
  manufacturer?: string;
  showTerminated?: boolean;
  effDate?: string;
  effDatePeriod?: 'after' | 'before';
  termDate?: string;
  termDatePeriod?: 'after' | 'before';
}

// Create DTO
export interface CreateValidCatalogDto {
  catalogNumber: string;
  manufacturerCode: string;
  totalBagsInSet: number | null;
  numberOfProds: number | null;
  bagType: string;
  bagVolume: number | null;
  weightOfBag: number | null;
  collectionVolume: number | null;
  anticoagulant: string | null;
  additiveSolution: string | null;
  instSpecificCode: string | null;
  bagStorageRestriction: string | null;
  effDate: string;
  termDate: string | null;
}

// Update DTO
export interface UpdateValidCatalogDto {
  originalCatalogNumber: string;
  catalogNumber: string;
  manufacturerCode: string;
  manufacturer: string;
  totalBagsInSet: number | null;
  numberOfProds: number | null;
  bagType: string;
  bagVolume: number | null;
  weightOfBag: number | null;
  collectionVolume: number | null;
  anticoagulant: string | null;
  additiveSolution: string | null;
  instSpecificCode: string | null;
  bagStorageRestriction: string | null;
  effDate: string;
  termDate: string | null;
}

// Lookup DTOs
export interface LookupDto {
  code: string;
  description: string;
}

export interface CatalogNumberDropdownDto extends LookupDto {}
export interface ManufacturerDropdownDto extends LookupDto {}
export interface BagTypeDropdownDto extends LookupDto {}
export interface AnticoagulantDropdownDto extends LookupDto {}
export interface AdditiveDropdownDto extends LookupDto {}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  totalRecords: number;
}
