export interface ProductCode {
  productCode: string;
  productFormula?: string;
  productShortName?: string;
  productType?: string;
  productDesc?: string;
  productClass?: string;
  classDesc?: string; // Display field from MASTER_CODES
  modifierCode?: string;
  modifierDesc?: string; // Display field from MASTER_CODES
  lifeSpan?: number;
  lifeSpanInd?: string; // H=Hours, D=Days, Y=Years
  timeLimit?: number;
  maxBleedTime?: number;
  minTemp?: number;
  maxTemp?: number;
  minWeight?: number;
  maxWeight?: number;
  minRcvTemp?: number;
  maxRcvTemp?: number;
  productCount?: number;
  specificGravity?: number;
  oftFlag?: string; // Y/N
  rhLabelFlag?: string; // Y/N
  dummyProductFlag?: string; // Y/N
  pheresisFlag?: string; // Y/N
  cellCountFlag?: string; // Y/N/O
  returnable?: string; // Y/N
  poolProductCode?: string; // Y/N
  outOfStateFlag?: string; // Y/N
  pathogenReductionFlag?: string; // Y/N or null
  unitSchemeType?: string; // C=Codabar, I=Code128
  compProductCode?: string;
  preprintedLabelFlag?: string; // Y/N
  manufProductFlag?: string; // Y/N
  researchProductFlag?: string; // Y/N
  invProductType?: string;
  inventoryClass?: string;
  stdPrice?: number;
  serviceCode?: string;
  effDate?: Date | string;
  termDate?: Date | string | null;
  lastModifiedDate?: Date | string;
  programId?: string;
}

export interface ProductCodeDto {
  productCode: string;
  productFormula?: string;
  productShortName?: string;
  productType?: string;
  productDesc?: string;
  productClass?: string;
  classDesc?: string;
  modifierCode?: string;
  modifierDesc?: string;
  lifeSpan?: number;
  lifeSpanInd?: string;
  timeLimit?: number;
  maxBleedTime?: number;
  minTemp?: number;
  maxTemp?: number;
  minWeight?: number;
  maxWeight?: number;
  minRcvTemp?: number;
  maxRcvTemp?: number;
  productCount?: number;
  specificGravity?: number;
  oftFlag?: string;
  rhLabelFlag?: string;
  dummyProductFlag?: string;
  pheresisFlag?: string;
  cellCountFlag?: string;
  returnable?: string;
  poolProductCode?: string;
  outOfStateFlag?: string;
  pathogenReductionFlag?: string;
  unitSchemeType?: string;
  compProductCode?: string;
  preprintedLabelFlag?: string;
  manufProductFlag?: string;
  researchProductFlag?: string;
  invProductType?: string;
  inventoryClass?: string;
  stdPrice?: number;
  serviceCode?: string;
  effDate?: string;
  termDate?: string | null;
  lastModifiedDate?: string;
  programId?: string;
}

export interface ProductCodesResponse {
  data: ProductCode[];
  total: number;
}

export interface ProductCodeRequest {
  productCode: string;
  productFormula?: string;
  productShortName?: string;
  productType?: string;
  productDesc?: string;
  productClass?: string;
  modifierCode?: string;
  lifeSpan?: number;
  lifeSpanInd?: string;
  timeLimit?: number;
  maxBleedTime?: number;
  minTemp?: number;
  maxTemp?: number;
  minWeight?: number;
  maxWeight?: number;
  minRcvTemp?: number;
  maxRcvTemp?: number;
  productCount?: number;
  specificGravity?: number;
  oftFlag?: string;
  rhLabelFlag?: string;
  dummyProductFlag?: string;
  pheresisFlag?: string;
  cellCountFlag?: string;
  returnable?: string;
  poolProductCode?: string;
  outOfStateFlag?: string;
  pathogenReductionFlag?: string;
  unitSchemeType?: string;
  compProductCode?: string;
  preprintedLabelFlag?: string;
  manufProductFlag?: string;
  researchProductFlag?: string;
  invProductType?: string;
  inventoryClass?: string;
  stdPrice?: number;
  serviceCode?: string;
  effDate?: string;
  termDate?: string | null;
}

export interface ProductCodeParamsDto {
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
  productType?: string;
  productClass?: string;
  effectiveDate?: string | null;        // ISO format YYYY-MM-DD
  effectivePeriod?: string | null;      // 'After' or 'Before'
  terminationDate?: string | null;      // ISO format YYYY-MM-DD
  terminationPeriod?: string | null;    // 'After' or 'Before'
}

export interface AddEditProductCodeDialogData {
  mode: 'add' | 'edit' | 'view';
  product?: ProductCode;
  productTypes?: ProductTypeLookup[];
  productClasses?: ProductClassLookup[];
  modifiers?: ModifierLookup[];
}

export interface ProductTypeLookup {
  productTypeCode: string;
  productTypeDesc: string;
}

export interface ProductClassLookup {
  code: string;
  codeDesc: string;
}

export interface ModifierLookup {
  code: string;
  codeDesc: string;
}

export interface InventoryClassLookup {
  code: string;
  codeDesc: string;
}

/**
 * Backend DTO for product codes API response
 */
export interface ProductCodeApiResponse {
  data: ProductCodeDto[];
  total: number;
}

/**
 * Product attribute for view mode display
 */
export interface ProductAttribute {
  attributeGroup: string;
  attributeGroupDescription: string;
  attributeCode: string;
  attributeDescription: string;
}

/**
 * Product attributes API response
 */
export interface ProductAttributesResponse {
  data: ProductAttribute[];
  total: number;
  success: boolean;
  message: string;
}

/**
 * Single product API response
 */
export interface SingleProductApiResponse {
  data: ProductCodeDto[];
}

/**
 * Generic API response for create/update/delete operations
 */
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/**
 * Lookup items API response
 */
export interface LookupItemsResponse<T> {
  data: T[];
  total: number;
}
