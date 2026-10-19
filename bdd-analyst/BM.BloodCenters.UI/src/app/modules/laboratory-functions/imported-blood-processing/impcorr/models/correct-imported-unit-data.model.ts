/**
 * TypeScript models for Correct Imported Unit Data feature
 * API documentation: CorrectImportedUnits-API-Documentation.md
 * JIRA: MLT-12626 / MLT-12628
 * Mnemonic: IMPCORR | Form: IMUUNITS
 */

/** Backend DTO — matches GET ALL / GET BY ID response shape from the API */
export interface ComponentAttributeDto {
  unitId: string;
  chapterId: string;
  productCode: string;
  attribGroup: string;
  attribCode: string;
  orgImportedProd: string | null;
  attributeGroupDesc: string | null;
  attributeCodeDesc: string | null;
  insertDate: string;
  insertUserId: string;
  programId: string | null;
  // Unit fields (from UNITS table via LEFT JOIN)
  collDate: string | null;
  contractId: string | null;
  collId: string | null;
  unitExpiryDate: string | null;
  barCodeProtocol: string | null;
  chkDigit: string | null;
  collYear: string | null;
  donorDecisionCode: string | null;
  interCode: string | null;
  osUnitId: string | null;
  receivedDate: string | null;
  batchId: string | null;
  // Component fields (from COMPONENTS table via LEFT JOIN)
  componentPrefix: string | null;
  systemLabelDecision: string | null;
  systemLabelDecisionDesc: string | null;
  componentExpiryDate: string | null;
  labelUserId: string | null;
  labelDats: string | null;
  impLicenseFlag: string | null;
}

/** Request body for POST /correct-imported-units (Create) */
export interface CreateComponentAttributeRequestDto {
  unitId: string;
  chapterId: string;
  productCode: string;
  attribGroup: string;
  attribCode: string;
  orgImportedProd?: string | null;
}

/** Request body for PUT /correct-imported-units/{...} (Update — only orgImportedProd is mutable) */
export interface UpdateComponentAttributeRequestDto {
  orgImportedProd?: string | null;
}

/** Request body for POST /correct-imported-units/{take}/{skip} (Get All) */
export interface ComponentAttributeQueryDto {
  unitId?: string;
  productCode?: string;
  attribGroup?: string;
  attribCode?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/** LOV item returned by GET /correct-imported-units/attribute-groups */
export interface AttributeGroupDropdownDto {
  code: string;
  description: string;
}

/** LOV item returned by GET /correct-imported-units/attribute-codes/{attribGroup} */
export interface AttributeCodeDropdownDto {
  code: string;
  description: string;
  statusFlag?: string;
  stopLabelFlag?: string;
  interCode?: string | null;
}

/** LOV item returned by GET /correct-imported-units/product-codes/{unitId} */
export interface ProductCodeDropdownDto {
  productCode: string;
  productDesc: string;
  productType: string;
}

/** LOV item returned by GET /correct-imported-units/contracts */
export interface ContractDropdownDto {
  code: string;
  description: string;
}

/** LOV item returned by GET /correct-imported-units/abo-labels */
export interface AboLabelDropdownDto {
  code: string;
  description: string;
}

/** LOV item returned by GET /correct-imported-units/valid-product-codes */
export interface ValidProductCodeDropdownDto {
  productCode: string;
  productShortName: string;
}

/** Mapped frontend model for a component attribute (includes enriched unit/component fields) */
export interface ComponentAttributeModel {
  // Composite key
  unitId: string;
  chapterId: string;
  productCode: string;
  attributeGroup: string;
  attributeCode: string;
  originalImportedProduct: string | null;
  // Descriptions
  attributeGroupDescription: string | null;
  attributeCodeDescription: string | null;
  // Audit
  insertDate: string;
  insertUserId: string;
  programId: string | null;
  // Unit detail fields (card 2)
  contractId: string | null;
  externalUnitId: string | null;   // osUnitId
  receivedDate: string | null;
  batchId: string | null;
  checkInUser: string | null;      // labelUserId
  checkInDate: string | null;      // labelDats
  aboLabel: string | null;         // systemLabelDecisionDesc
  expirationDate: string | null;   // componentExpiryDate
  licenseFlag: string | null;      // impLicenseFlag
  componentPrefix: string | null;
}

/** Request body for POST /correct-imported-units/save */
export interface SaveComponentAttributeRequestDto {
  unitId: string;
  productCode: string;
  newProductCode?: string | null;
  systemLabelDecision?: string | null;
  expiryDate?: string | null;
  impLicenseFlag?: string | null;
  componentPrefix?: string | null;
  attributes: Array<{ attribGroup: string; attribCode: string }>;
}

/** Editable table row in the attribute details section */
export interface AttributeRow {
  id: string;
  attributeGroup: string;
  attributeCode: string;
  attributeGroupDescription: string;
  attributeCodeDescription: string;
  isNew: boolean;
  isDirty: boolean;
  // Composite key fields stored for existing rows
  unitId?: string;
  chapterId?: string;
  productCode?: string;
  originalAttribGroup?: string;
  originalAttribCode?: string;
  originalImportedProduct?: string | null;
}

/** Frontend LOV item for attribute groups */
export interface AttributeGroupLov {
  code: string;
  description: string;
}

/** Frontend LOV item for attribute codes */
export interface AttributeCodeLov {
  code: string;
  description: string;
}

/** Frontend LOV item for product codes */
export interface ProductCodeLov {
  code: string;
  description: string;
  productType?: string;
}

/** Frontend LOV item for contracts */
export interface ContractLov {
  code: string;
  description: string;
}

/** Frontend LOV item for ABO labels */
export interface AboLabelLov {
  code: string;
  description: string;
}

export interface SearchFormValue {
  unitId: string;
  productCode: string;
}
