export interface ModifyUnitCollectionDate {
  collDate: string;
  contractId: string | null;
  contractName: string | null;
}

export interface ModifyUnitDetails {
  unitId: string;
  collDate: string;
  contractId: string | null;
  contractName: string | null;
  driveId: string | null;
  groupSiteId: string | null;
  siteName: string | null;
  bleedStartDate: string | null;
  bleedStartTime: string | null;
  bleedEndDate: string | null;
  bleedEndTime: string | null;
  qcCheckinDate: string | null;
  qcCheckinTime: string | null;
  qcCheckinFlag: string | null;
  donorFormAbo: string | null;
  aboDescription: string | null;
  donorDecisionCode: string | null;
  donorDecisionDescription: string | null;
  catalogNumber: string | null;
  lotNumber: string | null;
  batchId: string | null;
  redTubeFlag: string | null;
  redTube2: string | null;
  purpleTubeFlag: string | null;
  serumPlasmaInd: string | null;
  hasComponents: boolean;
  isCatalogLocked: boolean;
  isBleedTimeLocked: boolean;
  isQcFlagDisabled: boolean;
  isCatalogNull: boolean;
  codeScheme: string | null;
  attributes: ModifyUnitAttributeRow[];
  equipment: ModifyUnitEquipmentRow[];
  chapterConfig: ModifyUnitChapterConfig | null;
}

export interface ModifyUnitAttributeRow {
  attribGroup: string;
  attribCode: string;
  groupDescription: string | null;
  codeDescription: string | null;
  interCode: string | null;
  interType: string | null;
  requiresEquipment: boolean;
  parmCode: string | null;
}

export interface ModifyUnitEquipmentRow {
  parmCode: string;
  equipReference: string | null;
  equipType: string | null;
  equipTypeDescription: string | null;
  serialNumber: string | null;
}

export interface ModifyUnitChapterConfig {
  maxBleedTime: string | null;
  slowBleedTime: string | null;
  cueScanFlag: string | null;
  codeScheme: string | null;
}

export interface ModifyUnitUpdateRequest {
  unitId: string;
  collDate: string;
  driveId: string | null;
  groupSiteId: string | null;
  bleedStartDate: string | null;
  bleedStartTime: string | null;
  bleedEndDate: string | null;
  bleedEndTime: string | null;
  qcCheckinDate: string | null;
  qcCheckinTime: string | null;
  qcCheckinFlag: string | null;
  donorFormAbo: string | null;
  donorDecisionCode: string | null;
  catalogNumber: string | null;
  lotNumber: string | null;
  batchId: string | null;
  redTubeFlag: string | null;
  redTube2: string | null;
  purpleTubeFlag: string | null;
  serumPlasmaInd: string | null;
  attributes: ModifyUnitAttributeRequest[];
  deletedAttributes: ModifyUnitAttributeRequest[];
  equipment: ModifyUnitEquipmentRequest[];
  overrides: string[];
}

export interface ModifyUnitAttributeRequest {
  attribGroup: string;
  attribCode: string;
  interCode: string | null;
  parmCode: string | null;
  equipReference: string | null;
}

export interface ModifyUnitEquipmentRequest {
  parmCode: string;
  equipReference: string | null;
  equipType: string | null;
  serialNumber: string | null;
}

export interface ModifyUnitUpdateResponse {
  status: string;
  warnings: ModifyUnitWarning[];
  message: string | null;
}

export interface ModifyUnitWarning {
  code: string;
  message: string;
}

export interface DriveOption {
  driveId: string;
  groupSiteId: string | null;
  siteName: string | null;
  sortOrder: number | null;
}

export interface GroupSiteOption {
  groupSiteId: string;
  siteName: string | null;
}

export interface AboOption {
  aboLabel: string;
  aboShortName: string | null;
}

export interface CatalogOption {
  catalogNumber: string;
}

export interface LotOption {
  lotNumber: string;
}

export interface BatchOption {
  batchId: string;
}

export interface AttrGroupOption {
  code: string;
  description: string;
}

export interface AttrCodeOption {
  attribCode: string;
  description: string | null;
  interCode: string | null;
  interType: string | null;
  requiresEquipment: boolean;
  parmCode: string | null;
}

export interface EquipTypeOption {
  equipType: string;
  description: string | null;
}

export interface SerialNumberOption {
  serialNumber: string;
}

export interface DdCodeOption {
  code: string;
  description: string;
}

export const YES_NO_OPTIONS = [
  { code: 'Y', description: 'Yes' },
  { code: 'N', description: 'No' },
];
