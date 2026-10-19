/**
 * Valid Instrument Test Schedule Models
 * API Route: /api/v1/valid-instrument-test-schedules
 * JIRA: MLT-12476
 */

export interface ValidInstrumentTestScheduleDto {
  machineId: string;
  chapterId: string;
  machineTestId: string;
  testId1?: string | null;
  testId1Res?: string | null;
  testId2?: string | null;
  testId2Res?: string | null;
  testId3?: string | null;
  testId3Res?: string | null;
  testId4?: string | null;
  testId4Res?: string | null;
  testId5?: string | null;
  testId5Res?: string | null;
  testId6?: string | null;
  testId6Res?: string | null;
  poolSize?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  programId?: string | null;
  auditKey?: number | null;
  insertDate?: string | null;
  insertUser?: string | null;
  instrumentDescription?: string | null;
}

export interface CreateValidInstrumentTestScheduleRequestDto {
  machineId: string;
  chapterId: string;
  machineTestId: string;
  testId1?: string | null;
  testId1Res?: string | null;
  testId2?: string | null;
  testId2Res?: string | null;
  testId3?: string | null;
  testId3Res?: string | null;
  testId4?: string | null;
  testId4Res?: string | null;
  testId5?: string | null;
  testId5Res?: string | null;
  testId6?: string | null;
  testId6Res?: string | null;
  poolSize?: number | null;
  effDate: string;
  termDate?: string | null;
  originalEffDate?: string | null;
}

export interface UpdateValidInstrumentTestScheduleRequestDto {
  testId1?: string | null;
  testId1Res?: string | null;
  testId2?: string | null;
  testId2Res?: string | null;
  testId3?: string | null;
  testId3Res?: string | null;
  testId4?: string | null;
  testId4Res?: string | null;
  testId5?: string | null;
  testId5Res?: string | null;
  testId6?: string | null;
  testId6Res?: string | null;
  poolSize?: number | null;
  effDate?: string | null;
  termDate?: string | null;
  originalEffDate?: string | null;
}

export interface ValidInstrumentTestScheduleQueryDto {
  chapterId?: string | null;
  instrumentId?: string | null;
  machineTestId?: string | null;
  searchKeyword?: string | null;
  sortDirection?: 'ASC' | 'DESC' | null;
  includeTerminated?: boolean;
  effectiveDate?: string | null;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: string | null;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
}

export interface ValidInstrumentTestScheduleFilter {
  effectiveDate?: Date | null;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: Date | null;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
}

/** Machine / instrument dropdown item */
export interface InstrumentLookupDto {
  code: string;
  codeDesc: string;
}

/** Instrument test ID dropdown item */
export interface InstrumentTestLookupDto {
  machineTestId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  totalCount?: number;
  total?: number;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error: string;
  };
}

// ── Instrument Results (VINTSTRS / MLT-12476) ────────────────────────────────

export interface InstrumentResultDto {
  chapterId: string;
  machineId: string;
  testId: string;
  resultStatus: string;
  machineResultStatus?: string | null;
  resultDesc?: string | null;
  effDate?: string | null;
  termDate?: string | null;
  lastModifiedDate?: string | null;
  machineDesc?: string | null;
  testDesc?: string | null;
  insertUserId?: string | null;
  insertDate?: string | null;
}

export interface InstrumentTestDetailDto {
  chapterId: string;
  machineId: string;
  testId: string;
  testDesc?: string | null;
  machineTestId?: string | null;
  effDate?: string | null;
  termDate?: string | null;
  lastModifiedDate?: string | null;
  programId?: string | null;
}

export interface CreateInstrumentTestRequestDto {
  chapterId: string;
  machineId: string;
  testId: string;
  machineTestId?: string | null;
  effDate: string;
  termDate?: string | null;
}

export interface UpdateInstrumentTestRequestDto {
  machineTestId?: string | null;
  termDate?: string | null;
}

export interface ResultStatusDropdownDto {
  resultStatus: string;
  resultDesc?: string | null;
}

/** Machine dropdown item for VINTSTRS */
export interface MachineLookupDto {
  machineId: string;
  machineDesc: string;
}

/** Test dropdown item for VINTSTRS (cascades from machine) */
export interface TestDropdownDto {
  testId: string;
  testDesc: string;
}

export interface InstrumentResultQueryDto {
  chapterId?: string | null;
  machineId?: string | null;
  testId?: string | null;
  resultStatus?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
  includeTerminated?: boolean;
  effectiveDate?: string | null;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: string | null;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
}

export interface InstrumentResultFilter {
  searchKeyword?: string | null;
  includeTerminated?: boolean;
  effectiveDate?: Date | null;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: Date | null;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
}

export interface CreateInstrumentResultDto {
  chapterId: string;
  machineId: string;
  testId: string;
  resultStatus: string;
  machineResultStatus: string;
  effDate: string;
  termDate?: string | null;
}

export interface UpdateInstrumentResultDto {
  machineResultStatus?: string;
  effDate?: string;
  termDate?: string | null;
}
