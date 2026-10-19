export interface ConsentHistoryDto {
  chapterId: string;
  unitId: string | null;
  deferralId: string | null;
  collDate: string | null;
  letterCode: string | null;
  signatureDate: string | null;
  witness: string | null;
  manualSignatureDate: string | null;
  status: string | null;
  donorId: string;
  transactionId: string;
  letterId: string;
}

export interface ConsentHistoryDetailDto {
  letterContent: string | null;
  letterCode: string | null;
  chapterId: string | null;
}

export interface ConsentHistoryQueryDto {
  donorId: string;
  fromDate?: string | null;
  toDate?: string | null;
  unitId?: string | null;
  deferralId?: string | null;
  searchKeyword?: string | null;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
  errorResponse?: string[];
}

export interface ConsentDetailDialogData {
  donorId: string;
  transactionId: string;
  letterId: string;
}

export interface ConsentHistoryDonorInfoDto {
  donorId: string;
  donorName: string;
  address: string | null;
}
