export interface TestBandHeaderDto {
  unitId: string;
  testChapterId: string;
  testId: string;
  tbId: string;
  tbSeqNo: number;
  testType: string | null;
  testTypeDesc: string | null;
  ctrlVal: string | null;
  supYn: string | null;
  otherBandsEnabled: string | null;
  systemMessage: string | null;
  superIntp: string | null;
  superUser: string | null;
  superDate: string | null;
  tech1Intp: string | null;
  tech1User: string | null;
  tech1Date: string | null;
  tech2Intp: string | null;
  tech2User: string | null;
  tech2Date: string | null;
  noteId: number | null;
  reconFlag: string | null;
  programId: string | null;
}

export interface TestBandDetailDto {
  bandSeq: number;
  bandName: string | null;
  tech1BandVal: string | null;
  tech2BandVal: string | null;
  superBandVal: string | null;
  superIntensity: string | null;
  tech2Intensity: string | null;
}

export interface OtherTestBandDto {
  tech: string | null;
  band1: string | null;
  band2: string | null;
}

export interface TestObservationDto {
  header: TestBandHeaderDto;
  details: TestBandDetailDto[];
  otherBands: OtherTestBandDto[];
}

export interface SaveAllRequestDto {
  superIntp: string | null;
  voidCode: string;
  bandDetails: SaveAllBandDetailDto[];
}

export interface SaveAllBandDetailDto {
  bandSeq: number;
  bandName: string;
  superBandVal: string | null;
}

export interface TestIdLookupDto {
  testId: string;
  testDesc: string | null;
}

export interface TestBatchLookupDto {
  tbId: string;
  tbSeqNo: number;
  resultStatus1: string | null;
}

export interface BandValueLookupDto {
  result: string;
  resultDesc: string | null;
}

export interface ResultCodeLookupDto {
  resultCode: string;
  resultDesc: string | null;
}

export interface EditReasonLookupDto {
  code: string;
  codeDesc: string | null;
}

export interface CheckDigitDto {
  checkDigit: string;
}

export interface NoteDto {
  noteId: number;
  note: string;
  insertUser: string | null;
  insertDate: string | null;
}

export interface CreateNoteRequestDto {
  noteText: string;
}

export interface UpdateNoteRequestDto {
  noteText: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

export interface BandRow {
  bandSeq: number;
  bandName: string | null;
  bandLabel: string;
  value: string | null;
  tech1BandVal: string | null;
  tech2BandVal: string | null;
  superBandVal: string | null;
}

export interface NoteItem {
  id: string | number;
  author: string;
  date: string;
  version: string | null;
  content: string;
}

export interface TestObservationQueryParams {
  testChapterId: string;
  testId: string;
  tbId: string;
  tbSeqNo: number;
}

export interface DropdownOption {
  value: string;
  label: string;
}
