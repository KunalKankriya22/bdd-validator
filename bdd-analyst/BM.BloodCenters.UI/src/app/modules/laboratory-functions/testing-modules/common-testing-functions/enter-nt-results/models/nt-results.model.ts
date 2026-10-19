export interface CreateNtBatchRequestDto {
  groupTestId?: string;
  testIds?: string[];
  testGroup?: string;
}

export interface AddUnitToNtBatchRequestDto {
  unitId: string;
  tbId: string;
}

export interface NtBatchDetailDto {
  tbId: string;
  testChapterId: string;
  testId: string;
  testType: string;
  testingLabCode: string | null;
}

export interface NtBatchDto {
  tbId: string;
  testChapterId: string;
  groupTestId: string | null;
  userId: string;
  insertDats: string;
  firstUnitId: string | null;
  lastUnitId: string | null;
  repeatFlag: string;
  startWorkNumber: string;
  details: NtBatchDetailDto[];
}

export interface ValidTestDto {
  testId: string;
  testDesc: string;
  testGroup: string | null;
  antigenFlag: string;
  autoSchedule: string;
  effDate: string;
  termDate: string | null;
}

export interface TestGroupDto {
  code: string;
  codeDesc: string;
  effDate: string;
  termDate: string | null;
}

export interface AddUnitResponseDto {
  unitId: string;
  tbId: string;
  collDate: string;
  testsProcessed: number;
  testsAutoScheduled: number;
}

export interface ProcessedUnit {
  unitId: string;
  collDate: string;
  result: string;
}

export interface TestGroupValidationDto {
  code: string;
  codeDesc: string;
  activeTestCount: number;
}

export interface ApiSingleResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  item: T;
}

export interface ApiDataResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
}
