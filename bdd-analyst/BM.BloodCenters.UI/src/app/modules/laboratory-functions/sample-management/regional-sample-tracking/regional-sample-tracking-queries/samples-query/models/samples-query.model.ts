export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  item?: T | null;
  total?: number | null;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
}

export interface SamplesQuerySearchRequest {
  unitId?: string | null;
  osUnitId?: string | null;
  collDate?: string | null;
  receivedDate?: string | null;
  batchId?: string | null;
  donorId?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface UnitRecord {
  unitId: string;
  chapterId: string;
  collDate?: string | null;
  osUnitId?: string | null;
  receivedDate?: string | null;
  batchId?: string | null;
  contractId?: string | null;
  driveId?: string | null;
  priorAbo?: string | null;
  donorDecisionCode?: string | null;
  redTubeFlag?: string | null;
  redTube2Flag?: string | null;
  purpleTubeFlag?: string | null;
  serumPlasmaInd?: string | null;
  qcCheckinFlag?: string | null;
  qcCheckinDate?: string | null;
  qcTestFlag?: string | null;
  qcTestDate?: string | null;
  skipReason?: string | null;
  noteId?: string | null;
  company?: string | null;
}

export interface UnitTestResult {
  chapterId?: string | null;
  testSeqNo?: number | null;
  testId: string;
  resultStatus1?: string | null;
  absorbance?: number | null;
  ratio?: number | null;
  tbId?: string | null;
  resultDats?: string | null;
  extractId?: string | null;
  resultsBatch?: string | null;
  auditKey?: number | null;
  cnfrmQcDate?: string | null;
}

export interface UnitAttribute {
  attribGroup: string;
  attribGroupDesc?: string | null;
  attribCode: string;
  attribCodeDesc?: string | null;
  attribValue?: string | null;
  effDate?: string | null;
  termDate?: string | null;
}

export interface UnitInterdiction {
  interCode: string;
  interDescription?: string | null;
  interType?: string | null;
}

export interface NoteIndicators {
  sampleNoteCount: number;
  tBatchNoteCount: number;
  cBatchNoteCount: number;
  testNoteCount: number;
}

export interface UnitDetailsResponse {
  unit: UnitRecord;
  testResults: UnitTestResult[];
  attributes: UnitAttribute[];
  interdictions: UnitInterdiction[];
  hasNotes: boolean;
  hasInterdictions: boolean;
  hasReactiveResults: boolean;
  hasDocuments: boolean;
  interdictionsCount: number;
  noteIndicators: NoteIndicators;
}

export interface AttributesInterdictionsDialogData {
  unitId: string;
  attributes: UnitAttribute[];
  interdictions: UnitInterdiction[];
}

export interface SampleCheckinDetailsDialogData {
  unitId: string;
}

export interface SampleCheckinDetail {
  collDate?: string | null;
  sampleType?: string | null;
  frozenFlag?: string | null;
  thawFlag?: string | null;
  thawStartTime?: string | null;
  skipReason?: string | null;
}

export interface SampleCheckinDetailsResponse {
  contractId?: string | null;
  contractDescription?: string | null;
  samples: SampleCheckinDetail[];
}

export interface SamplesQueryNote {
  noteId?: string | null;
  noteSequence: number;
  note?: string | null;
  auditKey: number;
  insertDate?: string | null;
  insertUser?: string | null;
  insertUserName?: string | null;
  programId?: string | null;
  chapterId?: string | null;
}
