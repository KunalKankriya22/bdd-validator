export interface TestBatchOption {
  tbId: string;
  testId: string;
  statusMessage: string;
}

export interface TestOption {
  testId: string;
  testDesc: string;
  statusMessage: string;
}

export interface RunOption {
  runId: string;
  insertDate: string;
}

export interface KitOption {
  testKitId: string;
  testKitClass: string;
  insertDate: string;
}

export interface DeviceOption {
  equipId: string;
  serialNumber: string;
}

export interface ReagentOption {
  reagentId: string;
  expiryDate: string;
}

export interface BatchDetail {
  testKitId: string | null;
  parmType: string | null;
  runId: string | null;
  kitLotNumber: string | null;
  testingLabCode: string | null;
}

export interface ControlBatchParameter {
  sequence: number;
  parmCode: string;
  description: string;
  parmValue: string | null;
  datatype: string;
  relatedCode: string | null;
  voidCode: string | null;
  acceptMin: number | null;
  acceptMax: number | null;
  firstTech: string | null;
  firstDate: string | null;
  secondTech: string | null;
  secondDate: string | null;
  acceptFlag: string | null;
  techNo: number;
  confirmFlag: string | null;
  tech1Reqd: string | null;
  tech2Reqd: string | null;
  parmValueDisplay: string | null;
}

export interface ControlBatchReagent {
  reagentName: string;
  manufacturer: string;
  channel: number | null;
  expiryDate: string;
  lotNumber: string;
  reagentCode: string;
  supplierCode: string;
}

export interface ControlBatchUnit {
  sequence: number;
  unitId: string;
  testId: string;
  resultStatus: string;
  absorbance: string | null;
  ratio: string | null;
}

export interface RetrieveResult {
  parameters: ControlBatchParameter[];
  reagents: ControlBatchReagent[];
  unitCount: number;
  tech1Reqd: string | null;
  tech2Reqd: string | null;
  parmCheckFlag: string | null;
  voidCode: string | null;
  configMessage: string | null;
}

export interface ValidateParameterRequest {
  tbId: string;
  testId: string;
  chapterId?: string;
  parmCode: string;
  parmValue: string;
  datatype: string;
  relatedCode?: string | null;
  relatedParmValue?: string | null;
  acceptMin?: number | null;
  acceptMax?: number | null;
}

export interface ValidateParameterResult {
  acceptFlag: string;
  status: string;
  convertedValue: string | null;
  warnings: WarningItem[] | null;
}

export interface WarningItem {
  code: string;
  message: string;
}

export interface SaveRequest {
  tbId: string;
  testId: string;
  runId?: string | null;
  testKitId: string;
  saveMode: 'SAVE' | 'CONFIRM' | 'FINALIZE';
  parameters: SaveParameterItem[];
  overrides?: string[] | null;
}

export interface SaveParameterItem {
  parmCode: string;
  parmValue: string | null;
  acceptFlag: string | null;
  confirmFlag: string | null;
  voidCode: string | null;
}

export interface SaveResult {
  status: string;
  message: string;
  warnings: WarningItem[] | null;
}

export interface BatchInfo {
  tbId: string;
  testId: string;
  testDesc: string;
  unitCount: number;
  configMessage: string | null;
  testKitId: string;
}

export type ParameterStatus = 'Pending' | 'Acceptable' | 'Not Acceptable';

export function getParameterStatus(acceptFlag: string | null): ParameterStatus {
  if (acceptFlag === 'Y') return 'Acceptable';
  if (acceptFlag === 'N') return 'Not Acceptable';
  return 'Pending';
}
