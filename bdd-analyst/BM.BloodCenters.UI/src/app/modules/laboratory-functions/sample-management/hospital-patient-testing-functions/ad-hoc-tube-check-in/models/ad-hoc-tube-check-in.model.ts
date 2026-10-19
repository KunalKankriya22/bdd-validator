export type TubeIndicatorValue = 'Y' | 'P' | 'S' | '';

export interface AdhocContractDto {
  contractId: string;
  company: string;
  barCodeProtocol: string | null;
  ediInputInd: string | null;
  redTubeCount: number | null;
  purpleTubeCount: number | null;
  unitIdPattern: string | null;
}

export interface AdhocBatchDto {
  batchId: string;
  contractSuffix: string | null;
  receivedDate: string | null;
  unitCount: number;
}

export interface AdhocBatchUnitDto {
  unitId: string;
  displayUnitId: string | null;
  osUnitId: string | null;
  chkDigit: string | null;
  redTubeFlag: string | null;
  redTube2: string | null;
  purpleTubeFlag: string | null;
  serumPlasmaInd: string | null;
  collDate: string | null;
  receivedDate: string | null;
}

export interface AdhocTestDto {
  testId: string;
  testGroup: string | null;
  testDesc: string | null;
}

export interface AdhocTestGroupDto {
  code: string;
  codeDesc: string | null;
}

export interface AdhocContractSuffixDto {
  contractSuffix: string;
}

export interface AdhocCustomContractDto {
  testId: string;
  testDesc: string | null;
  contractId: string | null;
  batchId: string | null;
  contractSuffix: string | null;
}

export interface AdhocValidateUnitResultDto {
  isValid: boolean;
  isDuplicate: boolean;
  isDuplicateOsUnit: boolean;
  codeScheme: string | null;
}

export interface AdhocCheckInRequestDto {
  contractId: string;
  batchId: string | null;
  contractSuffix: string | null;
  collDate: string | null;
  receivedDate: string;
  r1Num: string | null;
  r2Num: string | null;
  p1Num: string | null;
  p2Num: string | null;
  osUnitId: string | null;
  unitId: string | null;
  chkDigit: string | null;
  r1UnitId: string | null;
  r2UnitId: string | null;
  p1UnitId: string | null;
  p2UnitId: string | null;
  selectedTestIds: string[] | null;
}

export interface AdhocCheckInResponseDto {
  unitId: string;
  osUnitId: string | null;
  batchId: string;
  contractSuffix: string | null;
  testsAssigned: number;
}

export interface TubeConfig {
  r1: TubeIndicatorValue;
  r2: TubeIndicatorValue;
  p1: TubeIndicatorValue;
  p2: TubeIndicatorValue;
}
