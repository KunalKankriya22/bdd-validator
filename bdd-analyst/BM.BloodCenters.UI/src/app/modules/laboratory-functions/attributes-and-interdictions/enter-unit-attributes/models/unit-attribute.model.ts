export interface UnitValidationResult {
  unitId: string;
  collDate: string;
  chapterId: string;
  contractId: string | null;
  contractName: string;
  hasCueCompleted: boolean;
  hasLabeledComponents: boolean;
  alertSpFlag: string;
}

export interface UnitAttributeRow {
  attribGroup: string;
  attribGroupDesc: string | null;
  attribCode: string;
  attribCodeDesc: string | null;
  statusFlag: string | null;
  stopLabelFlag: string | null;
  insertDate: string | null;
  insertUserId: string | null;
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface AttributeGroupOption {
  code: string;
  description: string;
}

export interface AttributeCodeOption {
  code: string;
  description: string;
  statusFlag?: string | null;
  stopLabelFlag?: string | null;
  interCode?: string | null;
}

export interface CreateUnitAttributeRequest {
  unitId: string;
  collDate: string;
  attribGroup: string;
  attribCode: string;
}
