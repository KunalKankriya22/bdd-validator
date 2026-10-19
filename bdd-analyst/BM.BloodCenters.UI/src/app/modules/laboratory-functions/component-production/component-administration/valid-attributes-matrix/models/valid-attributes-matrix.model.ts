/**
 * Valid Attributes Matrix (ISBT) Models
 * Aligned with backend AttributeMatrixController
 * JIRA: MLT-12843
 * Parent Story: MLT-12842
 */

/**
 * Main entity — maps to backend AttributeMatrix model
 */
export interface ValidAttributesMatrix {
  attribAddedGroup: string;
  attribAddedCode: string;
  attribDeletedGroup: string | null;
  attribDeletedCode: string | null;
  deleteModifierCode: string | null;
  addModifierCode: string | null;
  associatedAttribGroup: string | null;
  associatedAttribCode: string | null;
  effDate: Date | string;
  termDate: Date | string | null;
  lastModifiedDate: Date | string | null;
  auditKey: number | null;
  programId: string | null;
  attribAddedGroupDesc: string | null;
  attribAddedCodeDesc: string | null;
}

/**
 * Maps to backend CreateAttributeMatrixDto
 */
export interface CreateValidAttributesMatrixDto {
  attribAddedGroup: string;
  attribAddedCode: string;
  attribDeletedGroup?: string | null;
  attribDeletedCode?: string | null;
  deleteModifierCode?: string | null;
  addModifierCode?: string | null;
  associatedAttribGroup?: string | null;
  associatedAttribCode?: string | null;
  effDate: string;
  termDate?: string | null;
}

/**
 * Maps to backend UpdateAttributeMatrixDto
 */
export interface UpdateValidAttributesMatrixDto {
  attribDeletedGroup?: string | null;
  attribDeletedCode?: string | null;
  deleteModifierCode?: string | null;
  addModifierCode?: string | null;
  associatedAttribGroup?: string | null;
  associatedAttribCode?: string | null;
  effDate: string;
  termDate?: string | null;
}

/**
 * Maps to backend AttributeMatrixQueryDto (POST body for list endpoint)
 */
export interface ValidAttributesMatrixParamsDto {
  attribAddedGroup?: string;
  attribAddedCode?: string;
  modifierCode?: string;
  attribDeletedCode?: string;
  associatedAttribCode?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Filter values for the filter panel UI
 */
export interface ValidAttributesMatrixFilterValue {
  associatedAttribCode?: string;
  deleteModifierCode?: string;
  attribDeletedCode?: string;
}

/**
 * Maps to backend AttributeGroupDropdownDto
 */
export interface AttributeGroupDropdown {
  code: string;
  codeDesc: string;
}

/**
 * Maps to backend AttributeCodeDropdownDto
 */
export interface AttributeCodeDropdown {
  attribCode: string;
  attribDesc: string;
}

/**
 * Maps to backend ModifierCodeDropdownDto
 */
export interface ModifierCodeDropdown {
  code: string;
  description: string;
}

/**
 * API Response wrapper — maps to backend ReturnResult<T>
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  item?: T extends Array<infer U> ? U : T;
  total?: number;
  statusCode: number;
  message: string;
  error?: string;
  errorCode?: string;
}
