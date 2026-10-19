export interface VoidedTestSearchDto {
  unitId: string;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface VoidedTestListDto {
  tbId: string;
  testId: string;
  testSeqNo: number;
  resultStatus: string;
  resultDateTime: string | null;
  voidReasonCode: string;
  voidDateTime: string | null;
  voidUserId: string;
}

export interface VoidedUnitLovDto {
  unitId: string;
  collDate: string;
  displayUnitId: string | null;
}

export interface VerifyUnitResponseDto {
  isValid: boolean;
  collectionDate: string | null;
  displayUnitId: string | null;
  error: VerifyUnitErrorDto | null;
}

export interface VerifyUnitErrorDto {
  code: string;
  message: string;
}
