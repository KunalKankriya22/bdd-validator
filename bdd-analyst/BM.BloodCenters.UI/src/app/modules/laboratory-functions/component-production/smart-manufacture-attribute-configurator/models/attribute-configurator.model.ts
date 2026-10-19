export interface AttributeConfigDto {
  chapterId: string;
  functionName: string;
  labProductType: string;
  productDescription: string;
  attributeClass: string | null;
  attributeCode: string | null;
  modifier: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  insertUser: string;
  insertDate: string;
  lastModifiedBy: string;
  modifiedDate: string | null;
}

export interface FunctionNameOption {
  code: string;
  description: string;
}

export interface LabProductTypeOption {
  productType: string;
  productTypeDesc: string;
}

export interface AttributeClassOption {
  code: string;
  codeDesc: string;
}

export interface AttributeCodeOption {
  code: string;
  codeDesc: string;
}

export interface ModifierOption {
  code: string;
  codeDesc: string;
}

export interface SaveAttributeConfigRequest {
  functionName: string;
  labProductType: string;
  attributeClass: string;
  attributeCode: string;
  modifier: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
}
