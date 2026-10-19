export interface AntigenGroupOption {
  name: string;
  displayOrder: number;
}

export interface AntigenGroupRow {
  auditKey: number;
  serologicalTest: string;
  serologicalSeq: number;
  molecularTest: string;
  molecularSeq: number;
  effectiveDate: string;
  terminationDate: string;
}

export interface TestEntry {
  test: string;
  sequence: number;
}

export interface GroupDetail {
  antigenGroup: string;
  displayOrder: number;
  effectiveDate: string;
  terminationDate: string;
  serological: TestEntry[];
  molecular: TestEntry[];
}

export type PanelMode = 'add' | 'editGroup' | 'editRow';

// ── API request/response shapes ────────────────────────────────────────────

export interface RbcAgGroupSearchRequest {
  antigenGroup: string | null;
  displayOrder: number | null;
  showTerminated: string;
  chapterLocalDate: string | null;
  effectiveDate?: string | null;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER' | null;
  terminationDate?: string | null;
  terminationDatePeriod?: 'BEFORE' | 'AFTER' | null;
  sortColumn?: string | null;
  sortDirection?: string | null;
}

export interface RbcAgGroupApiModel {
  antigenGroup: string;
  antigenGrpDispOrder: number;
  serAgTestId: string;
  serTestDispOrder: number;
  molAgTestId: string | null;
  molTestDispOrder: number | null;
  effDate: string;
  termDate: string | null;
  insertDate: string;
  insertUser: string;
  programId: string;
  auditKey: number;
}

export interface RbcAgGroupFilterOption {
  antigenGroup: string;
  antigenGrpDispOrder: number;
}

export interface RbcAgGroupLookupItem {
  value: string;
}

export interface RbcAgGroupCreateRequest {
  antigenGroup: string;
  antigenGrpDispOrder: number;
  serAgTestId: string;
  serTestDispOrder: number;
  molAgTestId: string | null;
  molTestDispOrder: number | null;
  effDate: string;
  termDate: string | null;
}

export interface RbcAgGroupUpdateRequest extends RbcAgGroupCreateRequest {
  auditKey: number;
}

export interface RbcAgGroupBatchRecord {
  auditKey: number | null;
  serAgTestId: string;
  serTestDispOrder: number;
  molAgTestId: string | null;
  molTestDispOrder: number | null;
}

export interface RbcAgGroupBatchUpdateRequest {
  antigenGroup: string;
  antigenGrpDispOrder: number;
  termDate: string | null;
  records: RbcAgGroupBatchRecord[];
}

export interface ApiResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  errorCode: string | null;
  statusCode: number;
  data: T[] | null;
  item: T | null;
  total: number | null;
}

export const DISPLAY_ORDER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const SEQUENCE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
