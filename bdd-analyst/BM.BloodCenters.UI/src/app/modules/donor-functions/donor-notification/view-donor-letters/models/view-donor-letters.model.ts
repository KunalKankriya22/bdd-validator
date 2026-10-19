export interface DonorLetterDto {
  donorId: string;
  letterSeqNo: string;
  donorName: string;
  letterCode?: string;
  generatedByName?: string;
  generateDate?: string;
  authorizedByName?: string;
  authorizeDate?: string;
  reprintedByName?: string;
  lastReprintedOn?: string;
}

export interface DonorLetterDetailDto extends DonorLetterDto {
  address?: string;
  phone?: string;
  letterText?: string;
}

export interface LetterCodeLookupDto {
  letterCode: string;
  title: string;
}

export interface DonorLookupDto {
  donorId: string;
  name: string;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

export interface DonorLettersQueryParams {
  fromDate: string;
  toDate: string;
  letterCode?: string;
  donorId?: string;
  sortColumn?: string;
  sortOrder?: string;
  take?: number;
  skip?: number;
}

export interface DonorLookupQueryParams {
  fromDate: string;
  toDate: string;
  searchTerm?: string;
}

export interface ViewDonorLettersDetailDialogData {
  donorId: string;
  letterSeqNo: string;
}
