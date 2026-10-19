/**
 * Component Attribute Models
 * For Enter Component Attributes screen (COMPATT/CPIATTR)
 */

/**
 * Component Attribute DTO - represents a saved attribute record
 * Matches backend API response from PR #1387
 */
export interface ComponentAttributeDto {
  unitId: string;
  collDate: Date | string;
  chapterId: string;
  productCode: string;
  productDesc: string | null;
  productType: string | null;
  attribGroup: string;
  attribCode: string;
  attribDesc: string | null; // Backend returns attribDesc (not attribDescription)
  procDate: Date | string | null;
  insertDate: Date;
  insertUser: string;
  programId: string | null;
  expiryDate: Date | string | null;
  newExpiryDate: Date | string | null;
  interCode: string | null;
}

/**
 * Component Product DTO - for Product Code dropdown
 * Matches backend API response from PR #1387
 */
export interface ComponentProductDto {
  productCode: string;
  productDesc: string;
  productType: string;
  expiryDate: Date | string | null;
  componentStatus: string; // Must be 'L' for Lab status (FMB validation)
  poolProductFlag?: string; // 'Y' if pool product (FMB validation - cannot add attributes to pools)
  codeScheme?: string; // ISBT or Codabar scheme
}

/**
 * Attribute Group DTO - for Attribute Group dropdown
 * Matches backend API response from PR #1387
 */
export interface AttributeGroupDto {
  code: string;
  codeDesc: string;
}

/**
 * Attribute Code DTO - for Attribute Code dropdown
 * Matches backend API response
 */
export interface AttributeCodeDto {
  attribCode: string;
  attribDesc: string; // Backend returns attribDesc (not attribDescription)
  attribGroup: string;
  attribType?: string; // Must be 'A' for Attribute (FMB validation - not 'I' for Interdiction)
  lifeSpan?: number | null;
  lifeSpanInd?: string | null;
  interCode?: string | null;
  statusFlag?: string | null;
  stopLabelFlag?: string | null;
}

/**
 * Request payload for saving component attribute
 * Matches backend API request from PR #1387
 */
export interface SaveComponentAttributeRequest {
  unitId: string;
  collDate: Date | string;
  productCode: string;
  attribGroup: string;
  attribCode: string;
  procDate?: Date | string;
}
