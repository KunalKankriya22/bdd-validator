export interface AllTestsForUnitQueryDto {
  unitId: string;
  collDate?: string | null;
  chapterId?: string | null;
  testId?: string | null;
  showCancel?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
  take?: number | null;
  skip?: number | null;
}

export interface AllTestsForUnitResultDto {
  utrsTests: UtrsTestDto[];
  unitTestBaseTests: UnitTestBaseDto[];
  totalCount: number;
}

export interface UtrsTestDto {
  unitId: string;
  collDate: string;
  testId: string;
  testSeqNo: number;
  testMode?: string | null;
  testModeDesc?: string | null;
  testState?: string | null;
  resultStatus1?: string | null;
  resultStatus2?: string | null;
  resultStatus1Desc?: string | null;
  resultStatus2Desc?: string | null;
  tbId?: string | null;
  tbSeqNo?: number | null;
  absorbance?: number | null;
  ratio?: number | null;
  resultDats?: string | null;
  resultUserId?: string | null;
  testingLabCode?: string | null;
  wellNumber?: string | null;
  editResultFlag?: string | null;
  chapterId?: string | null;
  testChapterId?: string | null;
  cancelFlag?: string | null;
  programId?: string | null;
  temperature?: string | null;
  expanded?: boolean;
}

export interface UnitTestBaseDto {
  unitId: string;
  testId: string;
  testSeqNo: number;
  testMode?: string | null;
  testModeDesc?: string | null;
  testState?: string | null;
  resultStatus1?: string | null;
  resultStatus2?: string | null;
  resultStatus1Desc?: string | null;
  resultStatus2Desc?: string | null;
  tbId?: string | null;
  tbSeqNo?: number | null;
  absorbance?: number | null;
  ratio?: number | null;
  resultDats?: string | null;
  resultUserId?: string | null;
  testingLabCode?: string | null;
  wellNumber?: string | null;
  editResultFlag?: string | null;
  chapterId?: string | null;
  testChapterId?: string | null;
  cancelFlag?: string | null;
  temperature?: string | null;
  expanded?: boolean;
}
