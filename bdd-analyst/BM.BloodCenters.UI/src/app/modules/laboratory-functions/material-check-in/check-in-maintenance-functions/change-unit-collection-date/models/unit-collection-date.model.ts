/**
 * Request body for validate-unit API
 * Note: userId, chapterId, programId are populated from context by backend
 * FMB: NEW_COLL_DATE has Required="false" - optional for initial search
 */
export interface ValidateUnitRequest {
  unitId: string;
  newCollectionDate?: string;      // ISO 8601 format (optional - for initial search)
  confirmed: boolean;
}

/**
 * Request body for change collection date API
 * Note: userId, chapterId, programId are populated from context by backend
 */
export interface CollectionDateRequest {
  unitId: string;
  newCollectionDate: string;       // ISO 8601 format
  currentCollectionDate: string;   // ISO 8601 format
  confirmed: boolean;
}

/**
 * Response from validate-unit API
 */
export interface ValidateUnitResponse {
  isValid: boolean;
  unitId: string;
  chapterId: string;
  currentCollectionDate: string;
  insertDate?: string;              // Unit check-in date (max allowed for new collection date)
  contractId?: string;
  hasSystemLabelDecision?: boolean;
  componentCount?: number;
  unitExists?: boolean;
  validationErrors?: string[];
  message?: string;
  // Legacy fields (may not be returned by backend)
  donorName?: string;
  productCode?: string;
  status?: string;
  errors?: string[];
}

/**
 * Response from change API
 */
export interface ChangeCollectionDateResponse {
  success: boolean;
  message?: string;
  unitId?: string;
  newCollectionDate?: string;
  affectedRecords?: number;
  // Error fields for API-level failures
  errorCode?: string;
  error?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/**
 * Unit search result for display
 */
export interface UnitSearchResult {
  unitId: string;
  currentCollectionDate: string;
  donorName: string;
  productCode: string;
  status: string;
}
