export interface Chapter {
  id: string;
  name: string;
}

export interface ChapterApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    chapterId: string;
    chapterName: string;
  }[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface Instrument {
  id: string;
  name: string;
  chapterId: string;
}

export interface InstrumentApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    code: string;
    codeDesc: string;
  }[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface RawData {
  fileId: string;
  recordSequence: number;
  chapterId: string;
  machineId: string;
  machineTestId: string;
  unitId: string;
  collDate: string;
  patientDob: string;
  patientFirstName: string;
  patientLastName: string;
  testId1: string;
  testId2?: string;
  testId3?: string;
  testId4?: string;
  testId5?: string;
  testId6?: string;
  result1: string;
  result2?: string;
  result3?: string;
  result4?: string;
  result5?: string;
  result6?: string;
  resultDate: string;
  machineResult: string;
  plateId: string;
  wellNumber: string;
  absorbance: string;
  ratio: string;
  lowerResultRange: string;
  upperResultRange: string;
  extBatchId: string;
  finalPoolSize: number;
  siteId: string;
  errorCode?: string;
  uploadStatus: string;
  resultUserId: string;
  parsedBy: string;
  skipRecord: string;
  comments: string;
  auditKey: number;
  insertDate: string;
  insertUser: string;
}

export interface RawDataApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: RawData[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface UploadStatus {
  chapterId: string;
  machineId: string;
  fileId: string;
  ltTbId: string;
  uploadStatus: string;
  totRecLoaded: number;
  totRecProcessed: number;
  totRecRejected: number;
  processDate: string;
  logFileName: string;
  auditKey: number;
}

export interface UploadStatusApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: UploadStatus[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface UnitDetail {
  unitId: string;
  machineTestId: string;
  ltTestId: string;
  machineResult: string;
  ltResult?: string;
  uploadStatus: string;
  uploadStatusDescription: string;
  chapterId: string;
  machineId: string;
  fileId: string;
}

export interface UnitDetailApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: UnitDetail[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface ErrorCode {
  auditKey?: number;
  chapterId?: string;
  machineId?: string;
  machineTestId: string;
  errorCode: string;
  errorDesc: string; // Backend uses errorDesc, not errorDescription
  skipLevel: string; // Backend uses skipLevel (S/A), not skipAbort
  programId?: string;
  effDate: string; // Backend uses effDate, not effectiveDate
  termDate?: string; // Backend uses termDate, not terminationDate
  insertDate?: string;
  insertUser?: string;
}

export interface ErrorHandlingFilterRequest {
  chapterId: string;
  machineId: string;
  machineTestId?: string | null;
  searchItem: string;
  effectiveDate: string | null;
  terminationDate: string | null;
  periodEffDate: string | null;
  periodTermDate: string | null;
  sortDirection: string | null;
}

export interface ErrorCodeApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ErrorCode[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface MachineTestId {
  machineTestId: string;
  testId: string;
}

export interface MachineTestIdApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: MachineTestId[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface LogFile {
  fileName: string;
  fileId: string;
  parmId: string;
  reportStatus?: string;
  submitDate?: string;
  applId?: string;
  reportName?: string;
  userName?: string;
  repServer?: string;
}

export interface RawDataFilters {
  fileId?: string;
  searchText?: string;
}

export interface UploadStatusFilters {
  fileId?: string;
  testBatchId?: string;
  status?: string;
  periodAfter?: string;
  periodBefore?: string;
  searchText?: string;
}

export interface ErrorCodeFilters {
  fileId?: string;
  testBatchId?: string;
  status?: string;
  periodAfter?: string;
  periodBefore?: string;
  searchText?: string;
}

export interface UserDetails {
  userId: string;
  userName: string;
  staffNo: string;
  accPriv: number;
}

export interface UserDetailsApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: UserDetails;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}
