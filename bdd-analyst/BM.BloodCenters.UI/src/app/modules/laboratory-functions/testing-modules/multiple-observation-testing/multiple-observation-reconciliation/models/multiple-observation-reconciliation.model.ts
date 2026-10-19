export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface TestDropdownDto {
  testId: string;
  testDesc: string;
}

export interface WorksheetDropdownDto {
  tbId: string;
  testId: string;
}

export interface PendingTestDto {
  tbId: string;
  testChapterId: string;
  testId: string;
  tbSeqNo: number;
  unitId: string;
  resultStatus2?: string;
  resultUserId?: string;
  tempResult1?: string;
  chkDigit?: string;
}

export interface BandDetailDto {
  bandName: string;
  tech1BandVal?: string;
  tech2BandVal?: string;
  superBandVal?: string;
  superIntensity?: string;
  tech2Intensity?: string;
  displayBandVal?: string;
}

export interface OtherBandDto {
  unitId?: string;
  band1?: string;
  band2?: string;
  tech?: string;
}

export interface OtherBandCompositeRow {
  tech1Band1: string;
  tech1Band2: string;
  tech2Band1: string;
  tech2Band2: string;
  supBand1: string;
  supBand2: string;
}

export interface NoteDto {
  noteId?: number;
  note?: string;
  insertUser?: string;
  insertDate?: string;
  updateUser?: string;
  updateDate?: string;
}

export interface TestBandResponseDto {
  unitId: string;
  tbId: string;
  testId: string;
  tbSeqNo: number;
  testChapterId?: string;
  testType?: string;
  testTypeDesc?: string;
  ctrlVal?: string;
  noteId?: number;
  noteDetails?: NoteDto;
  otherBandsEnabled: boolean | string;
  tech1Intp?: string;
  tech1IntpDesc?: string;
  tech2Intp?: string;
  tech2IntpDesc?: string;
  superIntp?: string;
  reconFlag?: string;
  tech1User?: string;
  tech1Date?: string;
  tech2User?: string;
  tech2Date?: string;
  superUser?: string;
  superDate?: string;
  programId?: string;
  bandDetails: BandDetailDto[];
  otherBands: OtherBandDto[];
}

export interface ValidResultDto {
  result: string;
  resultDesc: string;
}

export interface ValidInterpretationDto {
  result: string;
  resultDesc: string;
}

export interface ValidTestBandDto {
  bandName: string;
  bandSeq: number;
}

export interface ReconcileTestRequest {
  superIntp: string;
}

export interface UpdateBandValuesRequest {
  bandValues: { bandName: string; superBandVal: string | null }[];
}

export interface ValidateCombinationRequest {
  unitId: string;
  tbId: string;
  testId: string;
  tbSeqNo: number;
  testType: string;
  ctrlVal: string | null;
}

export interface ValidateCombinationResponse {
  calculatedInterpretation: string;
  isMatch: boolean;
  matchedSetInterpretation?: string;
  message?: string;
}

export interface CommitReconciliationRequest {
  tbId: string;
  testId: string;
  antigenFlag: string;
  units: { tbSeqNo: number; unitId: string; supervisorResult: string }[];
}

export interface OtherBandSaveRequest {
  unitId: string;
  tbId: string;
  testId: string;
  tbSeqNo: number;
  collDate?: string;
  otherBands: { band1: string | null; band2: string | null }[];
}

export interface SaveNoteRequest {
  tbId: string;
  testId: string;
  unitId: string;
  tbSeqNo: number;
  noteId?: number | null;
  note: string;
}
