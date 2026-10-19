/** Standard API response wrapper matching ReturnResult<T> */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  errorCode?: string;
  item?: T;
  total?: number;
}

/** Test available for unit – dropdown/LOV item */
export interface TestForUnit {
  testId: string;
  testDesc: string;
}

/** Test batch summary – grid row */
export interface TestBatch {
  unitId: string;
  testId: string;
  tbId: string;
  tbSeqNo: number;
  collDate: string | null;       // ISO 8601 datetime
  chapterId: string | null;
  testChapterId: string | null;
  resultStatus: string | null;
  resultTimestamp: string | null; // ISO 8601 datetime – already chapter-local
  resultDescription: string | null;
  scheduled: 'SCHEDULED' | 'UNSCHEDULED';
}

/** Band observation detail – grid row */
export interface BandDetail {
  bandName: string;
  tech1BandVal: string | null;
  tech2BandVal: string | null;
  superBandVal: string | null;
  displayBandVal: string | null; // pre-calculated – just display this
}

/** Other band pair – grid row */
export interface OtherBand {
  band1: string;
  band2: string;
  tech: string | null; // '1' or 'S'
}

/** Note details from band-details response */
export interface NoteDetails {
  note: string | null;
  insertUser: string | null;
  insertDate: string | null; // ISO 8601, chapter-local time
}

/** Complete band details response */
export interface TestBandResponse {
  unitId: string;
  tbId: string;
  testId: string;
  tbSeqNo: number;
  testChapterId: string | null;
  testType: string | null;
  ctrlVal: string | null;
  noteId: number | null;
  noteDetails: NoteDetails | null; // null when no note exists
  otherBandsEnabled: boolean;
  bandDetails: BandDetail[];
  otherBands: OtherBand[];
}

/** Create note request */
export interface CreateNoteRequest {
  unitId: string;
  testId: string;
  tbId: string;
  tbSeqNo: number;
  testChapterId: string;
  note: string;
}

/** Update note request */
export interface UpdateNoteRequest {
  note: string;
}
