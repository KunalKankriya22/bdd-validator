/**
 * Additional Test Scheduling Models
 * API: /api/v1/additional-confirmatory-test-scheduled
 */

export interface ValidTestDto {
  testId: string;
  testGroup: string | null;
  testGroupDesc: string | null;
  testDesc: string | null;
  effDate: string | null;
  termDate: string | null;
  isActive: boolean;
}

export interface TestGroupDto {
  testGroup: string;
  description: string | null;
}

export interface SampleTypeDto {
  sampleType: string;
  description: string | null;
}

export interface ValidateUnitResponseDto {
  unitId: string;
  catalogNumber: string | null;
  collectionDate: string | null;
  chapterId: string | null;
  isValid: boolean;
  errorMessage: string | null;
  collDate: string;
  hasComponents: boolean;
  componentCount: number;
}

export interface ExistingTestsRequestDto {
  unitId: string;
  chapterId: string;
  testIds: string[];
}

export interface ExistingTestDto {
  status: 'Scheduled' | 'Unscheduled' | null;
  testId: string | null;
  testSeqNo: number | null;
  result: string | null;
  testBatchId: string | null;
}

export interface ScheduleTestRequestDto {
  unitId: string;
  chapterId: string;
  testId: string;
  testBatchId?: string | null;
}

export interface ScheduleTestResponseDto {
  scheduled: boolean;
  message: string | null;
}

export interface TestSchedulingQueryDto {
  searchKeyword?: string | null;
  testGroup?: string | null;
  sampleType?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
  screenMode?: 'DTL' | 'CNFRM' | null;
}

export interface MasterCodeDto {
  code: string;
  description: string | null;
}

export interface SccRecordDto {
  testId: string;
  sampleType: string | null;
  statusFlag: 'A' | 'S' | 'X' | 'U';
  availableSampleTypes: string[];
}

export interface SccStatusResponseDto {
  sccRecords: SccRecordDto[];
}

export interface SccSampleTypeRequestDto {
  unitId: string;
  testId: string;
  sampleType: string;
  chapterId: string;
}

export interface SccOverrideRequestDto {
  unitId: string;
  testId: string;
  chapterId: string;
  superUserId: string;
  password: string;
  reasonCode: string;
  holdCode?: string | null;
  comments: string;
  skip?: boolean;
}

export interface SccUpdateResponseDto {
  success: boolean;
  message: string | null;
}

export interface SampleTypeSelectionDialogData {
  unitId: string;
  testId: string;
  availableSampleTypes: string[];
}

export interface OverrideDialogData {
  unitId: string;
  testId: string;
  chapterId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  totalCount?: number;
  errorCode?: string;
}

export interface ScannedUnit {
  unitId: string;
  chapterId: string;
  collectionDate: string | null;
  catalogNumber: string | null;
  isValid: boolean;
  scannedAt: Date;
}

export interface ScheduledTestWithStatus {
  testId: string;
  testDesc: string | null;
  testSeqNo: number | null;
  status: 'Scheduled' | 'Unscheduled';
  result: string | null;
  testBatchId: string | null;
  isScheduled: boolean;
}

export interface TestLookupFilterState {
  testGroup: string | null;
  sampleType: string | null;
  searchKeyword: string;
}
