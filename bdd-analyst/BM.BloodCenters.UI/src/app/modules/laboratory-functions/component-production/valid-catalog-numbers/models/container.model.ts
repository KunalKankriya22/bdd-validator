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

// Catalog Detail (Container) DTO
export interface ContainerDto {
  catalogNumber: string;
  containerId: string;
  baseCatalogNo: string;
  inlineFilterFlag: string; // 'Y' or 'N'
  productType: string;
  subProdTypes: string | null;
  effDate: string | null;
  termDate: string | null;
  chapterId?: string;
  insertDate?: string;
  insertUser?: string;
}

// Query Parameters
export interface ContainerQueryParams {
  catalogNumber?: string;
  containerId?: string;
  productType?: string;
  showTerminated?: string; // 'Y' or 'N'
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string; // 'asc' or 'desc' (lowercase)
}

// Filter values for UI
export interface ContainerFilterValue {
  catalogNumber?: string;
  productType?: string;
  showTerminated?: boolean;
}

// Create DTO
export interface CreateContainerDto {
  containerId: string;
  baseCatalogNo: string;
  inlineFilterFlag: string; // 'Y' or 'N'
  productType: string;
  subProdTypes: string | null;
  effDate: string;
  termDate: string | null;
}

// Update DTO
export interface UpdateContainerDto {
  catalogNumber: string;
  containerId: string;
  inlineFilterFlag: string; // 'Y' or 'N'
  productType: string;
  subProdTypes: string | null;
  effDate: string;
  termDate: string | null;
}

// Lookup DTOs
export interface LookupDto {
  code: string;
  description: string;
}

export interface ContainerIdDropdownDto extends LookupDto {}
export interface ProductTypeDropdownDto extends LookupDto {}

// Paginated Response
export interface PaginatedContainerResponse {
  items: ContainerDto[];
  totalRecords: number;
}
