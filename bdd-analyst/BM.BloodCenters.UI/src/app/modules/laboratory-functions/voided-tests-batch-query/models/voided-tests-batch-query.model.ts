export interface BatchIdLookupDto {
  tbId: string;
  chapterId: string;
}

export interface TestIdLookupDto {
  testId: string;
}

export interface VoidedTestSearchDto {
  tbId: string;
  testId: string;
}

export interface VoidedTestResultDto {
  displayUnitId: string;
  resultStatus: string;
  resultDats: string;
  voidReasonCode: string;
  voidDats: string;
  voidUserId: string;
}

export interface VoidedTestsApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total?: number;
}
