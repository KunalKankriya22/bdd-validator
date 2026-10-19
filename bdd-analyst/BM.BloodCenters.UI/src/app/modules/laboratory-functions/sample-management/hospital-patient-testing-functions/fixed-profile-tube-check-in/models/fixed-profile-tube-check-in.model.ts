export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  total?: number;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface FixedProfileTubeCheckinDto {
  osUnitId: string;
  unitId: string | null;
  collDate: string | null;
  receivedDate: string | null;
  chapterId: string | null;
  batchId: string | null;
  contractId: string | null;
  redTubeFlag: string | null;
  purpleTubeFlag: string | null;
  redTube2: string | null;
  serumPlasmaInd: string | null;
  warehouseId: string | null;
  programId: string | null;
  insertDats: string | null;
  osChkDigit: number | null;
  chkDigit: number | null;
  unitSeq: number | null;
  sequenceNo?: number | null; // API returns sequenceNo instead of unitSeq (optional - assigned by backend)
}

export interface CreateTubeCheckinRequestDto {
  osUnitId: string;
  unitId?: string | null;
  collDate?: string | null;
  receivedDate?: string | null;
  batchId?: string | null;
  contractId?: string | null;
  redTubeFlag?: string | null;
  purpleTubeFlag?: string | null;
  redTube2?: string | null;
  serumPlasmaInd?: string | null;
  warehouseId?: string | null;
}

export interface UpdateTubeCheckinRequestDto {
  unitId?: string | null;
  collDate?: string | null;
  receivedDate?: string | null;
  batchId?: string | null;
  contractId?: string | null;
  redTubeFlag?: string | null;
  purpleTubeFlag?: string | null;
  redTube2?: string | null;
  serumPlasmaInd?: string | null;
  warehouseId?: string | null;
}

export interface TubeCheckinQueryDto {
  osUnitId?: string | null;
  unitId?: string | null;
  contractId?: string | null;
  batchId?: string | null;
  chapterId?: string | null;
  collDateFrom?: string | null;
  collDateTo?: string | null;
  receivedDateFrom?: string | null;
  receivedDateTo?: string | null;
  redTubeFlag?: string | null;
  purpleTubeFlag?: string | null;
  redTube2?: string | null;
  serumPlasmaInd?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface ContractDropdownDto {
  contractId: string;
  company: string;
  redTubeAvailable?: boolean;
  red2TubeAvailable?: boolean;
  purpleTubeAvailable?: boolean;
  purple2TubeAvailable?: boolean;
}

export interface BatchDropdownDto {
  batchId: string;
  receivedDate: string;
}

export interface TubeCheckInTableRow {
  sNo: number;
  osUnitId: string;
  unitId: string;
  red1: string;
  red2: string;
  purple1: string;
  purple2: string;
}

export interface ContractOption {
  contractId: string;
  description: string;
  redTubeAvailable: boolean;
  red2TubeAvailable: boolean;
  purpleTubeAvailable: boolean;
  purple2TubeAvailable: boolean;
}

export interface TubeAvailability {
  red1: boolean;
  red2: boolean;
  purple1: boolean;
  purple2: boolean;
}

export const TUBE_FLAG_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'P', label: 'Plasma' },
  { value: 'S', label: 'Serum' },
];

// NEW API Models (Batch Check-In with BATCH_INPUTS and UTRS scheduling)
export interface BatchCheckinUnit {
  osUnitId: string;
  unitId?: string | null;
  redTubeFlag?: string | null;
  purpleTubeFlag?: string | null;
  redTube2?: string | null;
  serumPlasmaInd?: string | null;
  warehouseId?: string | null;
  osChkDigit?: number | null;
  chkDigit?: number | null;
}

export interface BatchCheckinRequestDto {
  batchId?: string | null; // "NEW" or null for auto-generation
  contractId: string;
  collDate: string; // ISO 8601
  receivedDate: string; // ISO 8601
  profileSetId?: string | null;
  profileSeqNo?: number | null;
  units: BatchCheckinUnit[];
}

export interface BatchCheckinResponseDto {
  success: boolean;
  message: string;
  item?: {
    batchId: string;
    unitsProcessed: number;
    testsScheduled: number;
    success: boolean;
  };
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
