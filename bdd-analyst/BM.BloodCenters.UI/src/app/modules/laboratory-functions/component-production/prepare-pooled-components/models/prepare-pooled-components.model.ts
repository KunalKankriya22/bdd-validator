/**
 * Pool header details
 */
export interface PoolHeader {
  poolId: string;
  chapterId?: string;
  patientId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  facility?: string;
  productCode: string;
  productDescription?: string;
  bagId?: string;
  lotNumber?: string;
  filterLotNumber?: string;
  pooledAboRh?: string;
  aboDescription?: string;
  interCode?: string;
  poolDats?: string;
  poolExpiryDats?: string;
  poolInsertDats?: string;
  poolUserId?: string;
  poolWeight?: number;
  programId?: string;
  numberOfUnits?: number;
  catalogNumber?: string;
}

/**
 * Unit in pool
 */
export interface PoolUnit {
  unitId: string;
  productCode: string;
  productDescription?: string;
  componentPrefix?: string;
  expiryDate?: string;
  systemLabelDecision?: string;
  sldDescription?: string;
  componentStatus?: string;
  collDate?: string;
}

/**
 * Attribute row
 */
export interface AttributeRow {
  attributeGroup: string;
  attributeCode: string;
}

/**
 * Valid product LOV item
 */
export interface ValidProduct {
  code: string;
  description: string;
}

/**
 * Unit-specific product LOV item (includes expiry/SLD for product line display)
 */
export interface UnitProduct {
  code: string;
  description: string;
  componentPrefix?: string;
  expiryDate?: string;
  systemLabelDecision?: string;
  sldDescription?: string;
}

/**
 * Valid ABO LOV item
 */
export interface ValidAbo {
  code: string;
  label: string | null;
  description: string;
}

/**
 * Valid lot LOV item
 */
export interface ValidLot {
  code: string;
}

/**
 * Valid catalog LOV item
 */
export interface ValidCatalog {
  code: string;
}

/**
 * Pool search request
 */
export interface PoolSearchRequest {
  poolId?: string;
  productCode?: string;
  patientId?: string;
  facility?: string;
  fromDate?: string;
  toDate?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Pool search response
 */
export interface PoolSearchResponse {
  items: PoolHeader[];
  totalRecords: number;
}

/**
 * Create pool request
 */
export interface CreatePoolRequest {
  poolId: string;
  patientId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  facility?: string;
  productCode: string;
  bagId?: string;
  catalogNumber?: string;
  lotNumber?: string;
  filterLotNumber?: string;
  pooledAboRh?: string;
  interCode?: string;
  poolDats?: string;
  poolExpiryDats?: string;
  poolWeight?: number;
  numberOfUnits?: number;
}

/**
 * Update pool request
 */
export interface UpdatePoolRequest extends CreatePoolRequest {}

/**
 * API response wrapper
 */
export interface AttributeLookup {
  code: string;
  description: string;
}

export interface PoolAttributeItem {
  attribGroup: string;
  attribCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  total?: number;
  errorCode?: string;
  weightRequired?: string;
  specificGravity?: number;
  freezeTimeRequired?: string;
  attributes?: PoolAttributeItem[];
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

export interface CommitPoolUnit {
  unitId: string;
  productCode: string;
  componentPrefix?: string;
  poolDats?: string;
}

export interface CommitPoolAttribute {
  attribGroup: string;
  attribCode: string;
}

export interface LabelVerification {
  scannedUnitId: string;
  scannedAbo: string;
  scannedProductCode: string;
  scannedExpiryDate?: string;
  scannedSpTest?: string;
}

export interface CommitPoolRequest {
  units: CommitPoolUnit[];
  attributes: CommitPoolAttribute[];
  expectedUnitCount?: number;
  poolWeight?: number;
  freezeTime?: string;
  verification: LabelVerification;
}

export interface CommitPoolResponse {
  poolId: string;
  systemLabelDecision?: string;
  expiryDate?: string;
  unitCount: number;
  interdictionsPlaced: string[];
}

export interface WeightInfo {
  weightRequired: string;
  specificGravity: number | null;
  freezeTimeRequired: string;
}

export interface ExpiryCalculationResponse {
  expiryDate?: string;
  lifeSpan?: number;
  lifeSpanUnit?: string;
}

export interface UnitValidationResponse {
  unitId: string;
  collDate?: string;
  warehouseId?: string;
  productCode?: string;
  componentPrefix?: string;
  expiryDate?: string;
  systemLabelDecision?: string;
  sldDescription?: string;
  componentStatus?: string;
  pooledComponentId?: string;
  unitInterdictionCount: number;
  compInterdictionCount: number;
  poolExpiryDate?: string;
}
