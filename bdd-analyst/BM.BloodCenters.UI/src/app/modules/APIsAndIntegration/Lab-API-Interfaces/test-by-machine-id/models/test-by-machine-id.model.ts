import { Moment } from 'moment';

// Dropdown options
export interface InstrumentIdOption {
  instrumentId: string;
  description?: string;
}

export interface InstrumentTestIdOption {
  testId: string;
  description?: string;
}

export interface LifeTrackTestOption {
  testId: string;
  description?: string;
  testShortId?: string;
  testGroup?: string;
}

// Instrument Test Result Model (for the first table)
export interface InstrumentTestModel {
  id?: number;
  instrumentId: string;
  testId: string;
  test1?: string;
  result1?: string;
  test2?: string;
  result2?: string;
  test3?: string;
  result3?: string;
  test4?: string;
  result4?: string;
  test5?: string;
  result5?: string;
  poolSize?: number | string;
  auditKey?: number;
}

// Application Scheduling Test Model (for the second table)
export interface ApplicationSchedulingTestModel {
  id?: number;
  instrumentId: string;
  testId: string;
  test1?: string;
  result1?: string;
  test2?: string;
  result2?: string;
  test3?: string;
  result3?: string;
  defTest4?: string;
  result4?: string;
  defTest5?: string;
  result5?: string;
  defTest6?: string;
  result6?: string;
  effectiveDate?: Date | string | null;
  terminationDate?: Date | string | null;
  auditKey?: number;
}

// Editable row models for inline editing
export interface InstrumentTestEditModel extends InstrumentTestModel {
  isDirty?: boolean;
  errors?: Record<string, string>;
}

// Omit date fields from base so we can widen them to include Moment
// (TypeScript does not allow narrowing base interface properties via extends)
export interface ApplicationSchedulingTestEditModel
  extends Omit<ApplicationSchedulingTestModel, 'effectiveDate' | 'terminationDate'> {
  effectiveDate?: Moment | Date | string | null;
  terminationDate?: Moment | Date | string | null;
  isDirty?: boolean;
  errors?: Record<string, string>;
}

// API Request Parameters
export interface TestByMachineIdParamsDto {
  instrumentId?: string;
  testId?: string;
}

// API Response
export interface TestByMachineIdResponse {
  instrumentTests: InstrumentTestModel[];
  applicationSchedulingTests: ApplicationSchedulingTestModel[];
  totalRecords: number;
}

// Bulk Upsert DTOs
export interface InstrumentTestUpsertDto {
  Test1?: string;
  Result1?: string;
  Test2?: string;
  Result2?: string;
  Test3?: string;
  Result3?: string;
  Test4?: string;
  Result4?: string;
  Test5?: string;
  Result5?: string;
  PoolSize?: number | string;
}

export interface ApplicationSchedulingTestUpsertDto {
  Test1?: string;
  Result1?: string;
  Test2?: string;
  Result2?: string;
  Test3?: string;
  Result3?: string;
  DefTest4?: string;
  Result4?: string;
  DefTest5?: string;
  Result5?: string;
  DefTest6?: string;
  Result6?: string;
  EffectiveDate?: string;
  TerminationDate?: string;
}

export interface TestByMachineIdBulkUpsertDto {
  InstrumentId: string;
  TestId: string;
  InstrumentTests: InstrumentTestUpsertDto[];
  ApplicationSchedulingTests: ApplicationSchedulingTestUpsertDto[];
  isNewRecord?: boolean; // Flag to indicate if this is a create or update operation
}

// API Success Response
export interface SaveResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Backend API Response Wrapper (actual structure from API)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode?: number;
  data: T;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// Backend DTO (matches ValidInstrumentTestScheduleDto from API)
export interface ValidInstrumentTestScheduleBackendDto {
  MachineId: string;
  ChapterId: string;
  MachineTestId?: string;
  TestId1?: string;
  TestId1Res?: string;
  TestId2?: string;
  TestId2Res?: string;
  TestId3?: string;
  TestId3Res?: string;
  TestId4?: string;
  TestId4Res?: string;
  TestId5?: string;
  TestId5Res?: string;
  TestId6?: string;
  TestId6Res?: string;
  PoolSize?: string;
  LtSchTestId1?: string;
  LtSchRes1?: string;
  LtSchTestId2?: string;
  LtSchRes2?: string;
  LtSchTestId3?: string;
  LtSchRes3?: string;
  LtSchDfltTest4?: string;
  LtSchDfltRes4?: string;
  LtSchDfltTest5?: string;
  LtSchDfltRes5?: string;
  LtSchDfltTest6?: string;
  LtSchDfltRes6?: string;
  EffDate: string | Date;
  TermDate?: string | Date | null;
  AuditKey?: number;
  ProgramId?: string;
  InsertDate?: string | Date;
  InsertUser?: string;
  InstrumentDescription?: string;
}

// Backend Query DTO
export interface ValidInstrumentTestScheduleQueryDto {
  InstrumentId?: string;
  MachineTestId?: string;
  SortBy?: string;
  SortDirection?: string;
  IncludeTerminated?: boolean;
}

// Backend Create Request DTO (POST) - includes all fields (camelCase)
export interface ValidInstrumentTestScheduleCreateDto {
  machineId: string;
  chapterId: string;
  machineTestId: string;
  testId1: string;
  testId1Res: string;
  testId2: string;
  testId2Res: string;
  testId3: string;
  testId3Res: string;
  testId4: string;
  testId4Res: string;
  testId5: string;
  testId5Res: string;
  testId6: string;
  testId6Res: string;
  poolSize: string;
  ltSchTestId1: string;
  ltSchRes1: string;
  ltSchTestId2: string;
  ltSchRes2: string;
  ltSchTestId3: string;
  ltSchRes3: string;
  ltSchDfltTest4: string;
  ltSchDfltRes4: string;
  ltSchDfltTest5: string;
  ltSchDfltRes5: string;
  ltSchDfltTest6: string;
  ltSchDfltRes6: string;
  effDate: string | null;
  termDate: string | null;
  originalEffDate?: string | null;
}

// Backend Update Request DTO (PUT) - includes test fields, effDate and termDate
// IDs (machineId, chapterId, machineTestId) are sent in URL path parameters
export interface ValidInstrumentTestScheduleUpdateDto {
  testId1: string;
  testId1Res: string;
  testId2: string;
  testId2Res: string;
  testId3: string;
  testId3Res: string;
  testId4: string;
  testId4Res: string;
  testId5: string;
  testId5Res: string;
  testId6: string;
  testId6Res: string;
  poolSize: string;
  ltSchTestId1: string;
  ltSchRes1: string;
  ltSchTestId2: string;
  ltSchRes2: string;
  ltSchTestId3: string;
  ltSchRes3: string;
  ltSchDfltTest4: string;
  ltSchDfltRes4: string;
  ltSchDfltTest5: string;
  ltSchDfltRes5: string;
  ltSchDfltTest6: string;
  ltSchDfltRes6: string;
  effDate: string | null;
  termDate: string | null;
}
