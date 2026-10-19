export interface CpqUnitValidationResponseDto {
  unitId: string;
  collectionDate: string | null;
  codeScheme: string | null;
}

export interface UnitAttributeDto {
  attribCode: string;
  attribDesc: string;
  attribGroup: string;
  attribType: string;
  insertDate: string;
  insertUserId: string;
}

export interface ComponentAttributeDto {
  productCode: string;
  attribCode: string;
  attribDesc: string;
  attribGroup: string;
  insertDate: string;
  procDate: string | null;
  insertUserId: string;
}

export interface CpqQueryAttributesResponseDto {
  unitAttributes: UnitAttributeDto[];
  componentAttributes: ComponentAttributeDto[];
  messages: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  total?: number;
  errorCode?: string;
}

export interface UnitComponentAttributesQueryParams {
  unitId: string;
  collDate: string;
  codeScheme: string;
  productCode?: string;
}

export interface ProductCodeLovDto {
  productCode: string;
  productDesc: string | null;
}

// ============================================
// NEW DTOs for Paginated Endpoints
// ============================================

export interface CpqUnitAttributeQueryDto {
  unitId: string;
  collDate: string; // ISO DateTime format
  codeScheme: string; // 'I' or 'C'
  attribCode?: string | null;
  attribGroup?: string | null;
  insertUserId?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null; // 'AttribCode'
  sortOrder?: string | null; // 'ASC' or 'DESC'
}

export interface CpqComponentAttributeQueryDto {
  unitId: string;
  collDate: string;
  codeScheme: string;
  productCode?: string | null;
  attribCode?: string | null;
  insertUserId?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null; // 'ProductCode'
  sortOrder?: string | null; // 'ASC' or 'DESC'
}

// Filter Options Response DTOs
export interface AttributeCodeOption {
  code: string;
  description: string | null;
}

export interface AttributeGroupOption {
  code: string;
  description: string | null;
}

export interface ProductCodeOption {
  code: string;
  description: string | null;
}

export interface UnitAttributesFilterOptionsDto {
  attribCodes: AttributeCodeOption[];
  attribGroups: AttributeGroupOption[];
  users: string[];
}

export interface ComponentAttributesFilterOptionsDto {
  productCodes: ProductCodeOption[];
  attribCodes: AttributeCodeOption[];
  users: string[];
}

// Paginated Response
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  total: number; // Total records count
}
