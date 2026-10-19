/**
 * TypeScript Interfaces for Manage Matrix - Pheresis
 * JIRA: MLT-12847
 */

// API Response wrapper (camelCase from backend)
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  total?: number;         // Legacy field name
  totalCount?: number;    // New field name (used by attribute-equipment endpoint)
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// Main entity - Product/Procedure Matrix
export interface ProcProdMatrix {
  proc: string;                    // Procedure code (PK1)
  procDesc?: string;               // Procedure description
  productType: string;             // Product type code (PK2)
  productDesc?: string;            // Product type description
  numberProducts?: string;         // Number of products (0-4 or blank)
  effDate: string;                 // Effective date (ISO format from API)
  termDate?: string;               // Termination date (ISO format from API)
  lastModifyDate?: string;         // Last modification date
  programId?: string;              // Program identifier
}

// List response
export interface MatrixListResponse {
  data: ProcProdMatrix[];
  totalCount: number;
}

// Create DTO (camelCase)
export interface CreateMatrixDto {
  proc: string;
  productType: string;
  numberProducts?: string;
  effDate: string;                 // YYYY-MM-DD format
  termDate?: string;               // YYYY-MM-DD format
}

// Update DTO (camelCase)
export interface UpdateMatrixDto {
  numberProducts?: string;
  effDate: string;                 // YYYY-MM-DD format
  termDate?: string;               // YYYY-MM-DD format
}

// Query DTO (camelCase)
export interface MatrixQueryDto {
  proc?: string;
  productType?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Dropdown DTOs
export interface ProcedureDropdown {
  code: string;           // Procedure code
  codeDesc: string;       // Procedure description
}

export interface ProductTypeDropdown {
  productCode: string;    // Product type code
  productDesc: string;    // Product type description
}

// ============================================
// Tab 2: Procedure Attribute/Equipment Matrix
// ============================================

// Main entity - Procedure Attribute Equipment (PascalCase - as returned from API)
export interface ProcedureAttributeEquipment {
  attribGroup: string;          // Attribute group code (PK1) - from API
  attribGroupDesc?: string;     // Attribute group description - from API
  attribCode: string;           // Attribute code (PK2) - from API
  attribCodeDesc?: string;      // Attribute code description - from API
  equipType: string;            // Equipment type code (PK3) - from API
  equipDesc?: string;           // Equipment description - from API
  parmCode: string;             // Parameter code (PK4) - from API
  parmDesc?: string;            // Parameter description - from API
  effDate: Date | string;       // Effective date (ISO format from API)
  termDate?: Date | string;     // Termination date (ISO format from API)
  lastModifiedDate?: string;    // Last modification date (ISO format from API)
  // Additional fields for frontend use (mapped from API response for easier component usage)
  attributeGroup?: string;      // Mapped from attribGroup
  attributeCode?: string;       // Mapped from attribCode
  attributeDesc?: string;       // Mapped from attribCodeDesc
  equipmentType?: string;       // Mapped from equipType
  equipmentDesc?: string;       // Mapped from equipDesc
  parameterCode?: string;       // Mapped from parmCode
  parameterDesc?: string;       // Mapped from parmDesc
}

// List response
export interface AttributeEquipmentListResponse {
  data: ProcedureAttributeEquipment[];
  totalCount: number;
}

// Create DTO (PascalCase - matches API)
export interface CreateProcedureAttributeEquipmentDto {
  attribGroup: string;
  attribCode: string;
  equipType: string;
  parmCode: string;
  effDate: string;              // YYYY-MM-DD format
  termDate?: string;            // YYYY-MM-DD format
}

// Update DTO (PascalCase - matches API)
export interface UpdateProcedureAttributeEquipmentDto {
  attribCode: string;           // New attribute code
  equipType: string;            // New equipment type
  parmCode: string;             // New parameter code
  effDate: string;              // New effective date (YYYY-MM-DD format)
  termDate?: string;            // Termination date (YYYY-MM-DD format)
}

// Dropdown DTOs for Tab 2
export interface AttributeGroupDropdown {
  attributeGroup: string;
  description: string;
}

export interface AttributeCodeDropdown {
  attributeCode: string;
  description: string;
}

export interface EquipmentTypeDropdown {
  equipmentType: string;
  description: string;
}

export interface ParameterCodeDropdown {
  parameterCode: string;
  description: string;
}

// ============================================
// Tab 3: Equipment/Product cGMP Matrix
// ============================================

export interface EquipmentProductCgmpMatrix {
  equipType: string;
  proc: string;
  productCode: string;
  parmCode: string;
  acceptMin?: number;
  acceptMax?: number;
  effDate: string;
  termDate?: string;
  lastModifyDate?: string;
  chapterId?: string;
}

export interface CreateEquipmentCgmpMatrixDto {
  equipType: string;
  proc: string;
  productCode: string;
  parmCode: string;
  acceptMin?: number;
  acceptMax?: number;
  effDate: string;
  termDate?: string;
}

export interface UpdateEquipmentCgmpMatrixDto {
  acceptMin?: number;
  acceptMax?: number;
  effDate: string;
  termDate?: string;
}

export interface EquipmentCgmpMatrixQueryDto {
  equipType?: string;
  proc?: string;
  productCode?: string;
  parmCode?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EquipmentTypeDropdownCgmp {
  code: string;
  codeDesc: string;
}

export interface ParameterCodeDropdownCgmp {
  code: string;
  codeDesc: string;
}
