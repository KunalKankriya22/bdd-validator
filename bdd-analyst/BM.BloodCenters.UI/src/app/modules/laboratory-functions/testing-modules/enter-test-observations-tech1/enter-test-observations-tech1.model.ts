/**
 * Models and interfaces for Enter Test Observations: Tech 1 component
 */

export interface TestBatchWorksheet {
  id: string;
  displayName: string;
  description?: string;
}

export interface TestIdOption {
  id: string;
  code: string;
  description?: string;
}

export interface TestTypeOption {
  id: string;
  code: string;
  description: string;
  controlValue?: string;
}

export interface ObservationColumn {
  columnId: string;
  columnName: string;
  order: number;
}

export interface BandRow {
  bandId: string;
  bandName: string;
  unitId: string;
  observations: { [columnId: string]: string | number | null };
  isOtherBand?: boolean;
}

export interface UnitObservationData {
  unitId: string;
  bands: BandRow[];
  collDate?: string;
  tbSeqNo?: number;
  bandSeqMap?: { [bandName: string]: number };
  tempResult1?: string;
}

/**
 * Flattened row for data-table component
 * Each row represents one unit with observation values as direct properties
 */
export interface ObservationTableRow {
  unitId: string;
  [key: string]: string | number | null;
}

export interface ResultInterpretation {
  code: string;
  description: string;
}

export interface TestObservationNote {
  noteId: number | null;
  note: string;
  insertUser: string;
  insertDate: string;
  updateUser?: string;
  updateDate?: string;
}

export interface ObservationFormData {
  testBatchWorksheetId: string;
  testId: string;
  testTypeId: string;
  resultInterpretationCode?: string;
  unitObservations: UnitObservationData[];
}

// API Response types

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  item?: T;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface LoadObservationsResponse {
  testBatchWorksheets: TestBatchWorksheet[];
  testIds: TestIdOption[];
  testTypes: TestTypeOption[];
  resultInterpretations: ResultInterpretation[];
}

export interface ObservationDataResponse {
  columns: ObservationColumn[];
  units: UnitObservationData[];
  description?: string;
  testTypeDescription?: string;
  controlValue?: string;
}

export interface SaveObservationsRequest {
  testBatchWorksheetId: string;
  testId: string;
  testTypeId: string;
  resultInterpretationCode?: string;
  unitObservations: UnitObservationData[];
  overrideCodes?: string[];
  loggedInUserName?: string;
  chapterId?: string;
  warehouseId?: string;
  warehouseName?: string;
}

export interface AdditionalBandsDialogData {
  unitId: string;
  columns: ObservationColumn[];
  existingBands: BandRow[];
  tbId: string;
  testId: string;
  tbSeqNo: string;
}

export interface AdditionalBandsDialogResult {
  action: 'save' | 'cancel';
  bands?: BandRow[];
}

export interface SaveNoteRequest {
  tbId: string;
  testId: string;
  unitId: string;
  tbSeqNo: number;
  noteId?: number | null;
  note: string;
}

export interface OtherBandDto {
  band1?: string;
  band2?: string;
  tech?: string;
}

export interface SaveOtherBandsRequest {
  tbId: string;
  testId: string;
  unitId: string;
  tbSeqNo: number;
  otherBands: OtherBandDto[];
}
