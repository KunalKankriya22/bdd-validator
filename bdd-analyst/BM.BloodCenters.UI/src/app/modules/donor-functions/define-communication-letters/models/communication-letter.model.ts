export interface CommLetterView {
  letterId: string;
  letterCode: string;
  letterTitle: string;
  versionNo: number;
  versionDate?: string;
  documentType?: string;
  effDate: string;
  termDate?: string | null;
  letterContent?: string;
  documentName?: string;
  datafileName?: string;
}

export interface CommLetterCodeOption {
  letterCode: string;
  letterTitle?: string;
  versionNo?: number;
  effDate?: string;
  termDate?: string | null;
}

export interface CommLetterFilterCriteria {
  showTerminated: string;
  letterCode?: string;
}

export interface CreateCommLetterDto {
  letterCode: string;
  letterTitle: string;
  documentType: string;
  effDate: string;
  termDate?: string | null;
  letterContent?: string | null;
}

export interface ReviseCommLetterDto {
  letterTitle: string;
  documentType: string;
  effDate: string;
  termDate?: string | null;
  oldTermDate?: string | null;
  letterContent?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
  totalCount?: number;
}

export interface PreviewLetterResponse {
  jobId: string;
  parmId: string;
  reportName: string;
  status: string;
  message?: string;
}
