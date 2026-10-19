export interface AdditionalConfirmatoryTestScheduledDto {
  testId: string;
  testGroup: string | null;
  testDesc: string | null;
  sampleType: string | null;
  effDate: string | null;
  termDate: string | null;
  isActive: boolean;
}

export interface TestGroupLookupDto {
  testGroup: string;
  description: string | null;
}

export interface SampleTypeLookupDto {
  sampleType: string;
  description: string | null;
}

export interface AdditionalConfirmatoryTestScheduledQueryDto {
  testId?: string;
  testGroup?: string;
  sampleType?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
  activeOnly?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
}

export interface AdditionalConfirmatoryTestScheduledListResponse {
  data: AdditionalConfirmatoryTestScheduledDto[];
  totalCount: number;
}

export interface ValidateUnitResponse {
  unitId: string;
  collDate: string | null;
  chapterId: string | null;
}

export interface ExistingTestDto {
  statusFlag: string | null;
  testId: string | null;
  testSeqNo: number | null;
  tbId: string | null;
  resultStatus1: string | null;
}

export interface ScheduleTestsRequest {
  testIds: string[];
  units: ScheduleUnitDto[];
}

export interface ScheduleUnitDto {
  unitId: string;
  collDate: string | null;
}

export interface ScheduleTestsResponse {
  testsScheduled: number;
  unitsProcessed: number;
}

export interface UnitSequence {
  sequenceNumber: number;
  unitId: string;
  collectionDate: string | null;
}

export interface AtcFilterCriteria {
  testGroupId: string | null;
  description: string | null;
  unitId: string | null;
}

export interface SelectTestsDialogData {
  testGroup?: string;
  selectedTests?: string[];
}

export interface SelectTestsDialogResult {
  selectedTests: AdditionalConfirmatoryTestScheduledDto[];
}
