export interface EquipmentQcRow {
  seqNo: string;
  description: string;
  units: string | null;
  targetValue: string | null;
  minAccept: string | null;
  maxAccept: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  isNew?: boolean;
  isModified?: boolean;
}

export interface EquipmentQcFilterCriteria {
  equipmentType: string;
  qcType: string;
}

export interface EquipmentQcMasterData {
  qcId: string | null;
  reviewRequired: string | null;
  reviewRequiredDescription: string | null;
  frequency: string | null;
  qcPeriod: string | null;
  qcPeriodDesc: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  requiredForClarification: string | null;
  createWorksheet: string | null;
}

export interface EquipmentType {
  code: string;
  codeDesc: string;
}

export interface QcType {
  code: string;
  codeDesc: string;
}

export interface ReviewRequired {
  code: string;
  codeDesc: string;
}

export interface QcPeriodOption {
  code: string;
  codeDesc: string;
}

export interface Units {
  code: string;
  description: string;
}

export interface EquipmentQcDataRequest {
  equipmentType: string;
  qcType: string;
  pageNumber: number;
  pageSize: number;
}

export interface EquipmentQcDataResponse {
  masterData: EquipmentQcMasterData;
  rows: EquipmentQcRow[];
  totalRecords: number;
}

export interface SaveEquipmentQcDataRequest {
  equipmentType: string;
  qcType: string;
  qcId: string | null;
  reviewRequired: string | null;
  frequency: string | null;
  qcPeriod: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  requiredForClarification: string | null;
  createWorksheet: string | null;
  isNew: boolean;
  rows: EquipmentQcRow[];
}

export interface ReturnResult<T> {
  success: boolean;
  message: string | null;
  data: T;
  item: T;
  errors: string[] | null;
}

export interface YesNoOption {
  value: string;
  label: string;
}

export const YES_NO_OPTIONS: YesNoOption[] = [
  { value: 'Y', label: 'YES' },
  { value: 'N', label: 'NO' }
];
