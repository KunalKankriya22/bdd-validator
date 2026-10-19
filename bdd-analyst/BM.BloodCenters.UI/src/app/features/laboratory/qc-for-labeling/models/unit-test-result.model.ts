export interface UnitTestResultDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  testId: string;
  testSeqNo: number;
  testResult: string | null;
  testDate: string | null;
  performedBy: string | null;
  comments: string | null;
  resultCode: string | null;
  cancelFlag: string | null;
  absorbance: string | null;
  resultStatus: string | null;
  testDescription: string | null;
  resultStatusDescription: string | null;
  tbId: string | null;
  ratio: string | null;
  resultStatus1: string | null;
}
