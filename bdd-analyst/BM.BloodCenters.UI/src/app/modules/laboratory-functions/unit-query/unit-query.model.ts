export interface UnitQueryResult {
  unitId: string;
  collDate: string;
  chapterId: string;
  osUnitId: string | null;
  receivedDate: string | null;
  contractId: string | null;
  contractName: string | null;
  driveId: string | null;
  batchId: string | null;
  warehouseId: string | null;
  groupSiteId: string | null;
  siteName: string | null;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  bleedDuration: string | null;
  priorAbo: string | null;
  priorAboDescription: string | null;
  testedAbo: string | null;
  testedAboDescription: string | null;
  systemLabelDecision: string | null;
  numberOfBags: number | null;
  catalogNumber: string | null;
  lotNumber: string | null;
  donorDecisionCode: string | null;
  donorDecisionCodeDescription: string | null;
  bagCode: string | null;
  nursingAuditStatus: string | null;
  nursingAuditFlag: string | null;
  donorLabDats: string | null;
  labDistDats: string | null;
  qcCheckinFlag: string | null;
  qcCheckinDate: string | null;
  qcLabelFlag: string | null;
  qcLabelDate: string | null;
  redTubeFlag: string | null;
  redTube2: string | null;
  purpleTubeFlag: string | null;
  serumPlasmaInd: string | null;
  checkDigit: string | null;
  unitSchemeType: string | null;
  testMessage: string | null;
  firstSepTime: string | null;
  secondSepTime: string | null;
  thirdSepTime: string | null;
  firstSepCentrifugeId: string | null;
  secondSepCentrifugeId: string | null;
  thirdSepCentrifugeId: string | null;
  firstSepUserId: string | null;
  secondSepUserId: string | null;
  thirdSepUserId: string | null;
  firstSepWeight: number | null;
  secondSepWeight: number | null;
  thirdSepWeight: number | null;
  firstSepEntryMode: string | null;
  secondSepEntryMode: string | null;
  thirdSepEntryMode: string | null;
  firstSepDuration: string | null;
  secondSepDuration: string | null;
  thirdSepDuration: string | null;
  noteId: number | null;
  hasAttributes: boolean;
  hasInterdictions: boolean;
  hasTests: boolean;
  hasComponents: boolean;
  isArchived: boolean;
  hasDocuments: boolean;
  hasPathogenDetails: boolean;
  hasFreezeDetails: boolean;
  hasAddOnBags: boolean;
  hasAntigensPermission: boolean;
}

export interface ComponentResult {
  unitId: string;
  collDate: string;
  chapterId: string;
  componentPrefix: string | null;
  productCode: string | null;
  productDescription: string | null;
  productType: string | null;
  systemLabelDecision: string | null;
  systemLabelDecisionDescription: string | null;
  expirationDate: string | null;
  rejectReasonCode: string | null;
  bagsUsed: number | null;
  invProductType: string | null;
  componentStatus: string | null;
  componentStatusDescription: string | null;
  noteId: number | null;
  warehouseId: string | null;
  hasAttributes: boolean;
  hasInterdictions: boolean;
  bagId: string | null;
}

export interface UnitTestDetail {
  unitId: string;
  collDate: string;
  chapterId: string | null;
  testId: string | null;
  testSeqNo: number | null;
  resultStatus1: string | null;
  tbId: string | null;
  absorbance: string | null;
  ratio: string | null;
  cancelFlag: string | null;
  testState: string | null;
}

export interface UnitTestDetailCombined {
  scheduledTests: UnitTestDetail[];
  unscheduledTests: UnitTestDetail[];
  ScheduledTests?: UnitTestDetail[];
  UnscheduledTests?: UnitTestDetail[];
}

export interface UnitNote {
  noteId: number | null;
  noteSeq: number | null;
  note: string | null;
  insertUser: string | null;
  insertUserName: string | null;
  insertDate: string | null;
  auditKey: number | null;
  chapterId: string | null;
}

export interface FreezeDetail {
  productCode: string | null;
  parmCode: string | null;
  processDats: string | null;
  insertUser: string | null;
}

export interface UnitSearchRequest {
  unitId?: string;
  osUnitId?: string;
  chapterId?: string;
  collDateFrom?: string;
  collDateTo?: string;
  driveId?: string;
  contractId?: string;
  includeArchived?: boolean;
  sortColumn?: string;
  sortOrder?: string;
}

export type UnitQueryMode = 'REGULAR' | 'SUPER';

export interface QuickLink {
  label: string;
  icon: string;
  enabled: boolean;
  action: string;
}

export interface UnitQueryPanelRecord {
  unitId: string;
  collDate: string;
  chapterId: string;
  unitSchemeType: string | null;
  noteId: number | null;
}
