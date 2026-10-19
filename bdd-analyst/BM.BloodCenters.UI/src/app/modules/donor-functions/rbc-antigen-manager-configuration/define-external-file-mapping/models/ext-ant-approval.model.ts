export interface ExtAntApprovalRecord {
  testBatchPrefix: string;
  testAntigen: string;
  extFacCode: string;
  approvedFlag: string;
  effDate: string;
  termDate: string | null;
  insertDate: string;
  insertUser: string;
  programId: string;
  chapterId: string;
  modifiedUser: string | null;
  modifiedDate: string | null;
  auditKey: number;
}

export interface ExtAntApprovalSearchDto {
  testBatchPrefix: string;
  testAntigen: string;
  approvedFlag: string;
  searchText: string;
  showTerminated: boolean;
  chapterLocalDate?: string;
}

export interface ExtAntApprovalCreateDto {
  testBatchPrefix: string;
  testAntigen: string;
  extFacCode: string;
  approvedFlag: string;
  effDate: string;
  termDate: string | null;
}

export interface ExtAntApprovalUpdateDto {
  auditKey: number;
  approvedFlag: string;
  effDate: string;
  termDate: string | null;
}

export interface ExtAntApprovalLookup {
  value: string;
  label?: string;
}

export interface ExtAntApprovalFilterOption {
  testAntigen: string;
  approvedFlag: string;
}

export const APPROVED_FLAG_LABELS: Record<string, string> = {
  L: 'Licensed',
  U: 'Unapproved',
  A: 'Approved',
};
