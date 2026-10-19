export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
}

export interface ContractOption {
  contractId: string;
  company: string;
}

export interface BatchOption {
  batchId: string;
  receivedDate: string;
}

export interface MissingReasonCode {
  code: string;
  description: string;
}

export interface MissingTubeUnit {
  unitId: string;
  checkDigit?: string | null;
  receivedDate: string;
  redTubeFlag?: string | null;
  redTube2Flag?: string | null;
  purpleTubeFlag?: string | null;
  serumPlasmaInd?: string | null;
}

export interface MissingTubesQueryResponse {
  units: MissingTubeUnit[];
  totalCount: number;
  totalUnitsInBatch: number;
  unitsWithMissingTubes: number;
  contractId: string;
  companyName?: string | null;
  batchId: string;
  minTemp?: number | null;
  maxTemp?: number | null;
}
