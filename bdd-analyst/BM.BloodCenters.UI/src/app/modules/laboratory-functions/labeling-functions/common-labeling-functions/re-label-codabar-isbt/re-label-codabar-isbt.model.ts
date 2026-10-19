export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total?: number;
}

export interface UserAccessResponse {
  success: boolean;
  message: string;
  statusCode: number;
  hasAccess: boolean;
}

export interface UnitValidationResult {
  unitId: string;
  osUnitId: string;
  collectionDate: string;
  productCode: string;
  productDescription: string;
  componentPrefix: string;
  componentStatus: string;
  relabelProductCode: string | null;
  isCodabarUnit: boolean;
  firstIsbtUnitId: string | null;
  donorId: string;
  donorFirstName: string;
  donorLastName: string;
  donorDateOfBirth: string;
  donorBloodType: string;
  systemLabelDecision: string;
  expiryDate: string;
  contractId: string;
  catalogNumber: string;
  lotNumber: string;
}

export interface ComponentItem {
  componentPrefix: string;
  productCode: string;
  productDescription: string;
  componentStatus: string;
  isAlreadyRelabeled: boolean;
  systemLabelDecision: string;
  expiryDate: string;
  componentWeight: number;
  bagId: string;
}

export interface UnitAttribute {
  attribGroup: string;
  attribCode: string;
  attribType: string;
}

export interface AboMapping {
  aboLabel: string;
  aboShortName: string;
  testedAbo?: string;
}

export interface IsbtProductCodeMapping {
  codabarProductCode: string;
  mappedProductCodes: string;
  intendedUse: string;
  productDescription?: string;
  fullIsbtProductCode?: string;
}

export interface SpecialTestingCode {
  productCode: string;
  description: string | null;
}

export interface FacilityCode {
  collId: string;
  collName: string;
  contractId?: string;
}

export interface CatalogNumber {
  catalogNumber: string;
  manufacturerCode?: string;
  spFlag?: string;
}

export interface LotNumber {
  catalogNumber?: string;
  lotNumber: string;
  spFlag?: string;
}

export interface AboValue {
  aboLabel: string;
  aboShortName: string;
}

export interface ProductCode {
  productCode: string;
  description: string;
}

/** Unit-filtered dropdown — GET /product-code-dropdown?unitId={unitId} */
export interface ProductCodeDropdownItem {
  productCode: string;
  productDesc: string;
  componentPrefix: string;
}

export interface UnitNote {
  noteId: string;
  noteSequence: number;
  note: string;
  auditKey: number;
  insertDate: string;
  insertUser: string;
  insertUserName: string;
  programId: string;
  chapterId: string;
}

export interface AddNoteRequest {
  note: string;
}

export interface ValidateComponentRequest {
  unitId: string;
  collectionDate: string;
  productCode: string;
  componentPrefix: string;
}

export interface ValidateIsbtDetailsRequest {
  isbtUnitId: string;
  catalogNumber: string;
  lotNumber: string;
  isbtProductCode: string;
  aboLabel: string;
  expirationDate: string;
  codabarExpirationDate: string;
  specialTestingCode?: string;
  facilityCode?: string;
  contractId: string;
  codabarProductCode: string;
  codabarUnitId: string;
}

export interface VerifyLabelRequest {
  scannedIsbtUnitId: string;
  expectedIsbtUnitId: string;
  scannedProductCode: string;
  expectedProductCode: string;
  scannedAbo: string;
  expectedAbo: string;
  scannedExpirationDate: string;
  expectedExpirationDate: string;
  scannedSpecialTestingCode?: string;
  expectedSpecialTestingCode?: string;
}

export interface RelabelRequest {
  unitId: string;
  collectionDate: string;
  productCode: string;
  componentPrefix: string;
  newProductCode: string;
}

export interface RelabelPrintLabelRequest {
  codabarUnitId: string;
  unitId: string;
  productCode: string;
  abo: string;
  expirationDate: string;
  specialTestingCode?: string;
  contractId?: string;
  facilityCode?: string;
  labelType: string;
  overrides: string[] | null;
}

export interface RelabelCommitRequest {
  codabarUnitId: string;
  collectionDate: string;
  productCode: string;
  componentPrefix: string;
  isbtUnitId: string;
  isbtProductCode: string;
  aboLabel: string;
  expirationDate: string;
  catalogNumber: string;
  lotNumber: string;
  specialTestingCode?: string | null;
  facilityCode?: string | null;
  licensureFlag?: string | null;
  contractId: string;
  expirationDateChangeOnly: boolean;
}
