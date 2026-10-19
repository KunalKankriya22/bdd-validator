export interface HoldingTestModel {
  tbId: string;
  unitId: string;
  chkDigit?: string | null;
  testId: string;
  absorbance?: string | null;
  ratio?: string | null;
  resultStatus?: string | null;
  resultDate?: string | null;
  holdingStatus?: string | null;
  batchCreationDate?: string | null;
  tbIdMode?: string | null;
}

export interface HoldingTestQueryParams {
  allOrPending: string;
  testId?: string | null;
  tbId?: string | null;
  unitId?: string | null;
  absorbance?: string | null;
  ratio?: string | null;
  resultStatus?: string | null;
  holdingStatus?: string | null;
  searchText?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
  take: number;
  skip: number;
}

export interface HoldingTestGridFilter {
  testId: string | null;
  absorbance: string | null;
  ratio: string | null;
  resultValue: string | null;
  status: string | null;
}

export interface ViewInterdictionModel {
  unitId: string;
  collDate: string | null;
  interCode: string | null;
}

export interface ReturnResult<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T;
  total?: number;
  item?: any;
  error?: string;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface FilterValuesResult {
  testIds: string[];
  absorbances: string[];
  ratios: string[];
  resultValues: string[];
  statuses: string[];
}

export interface MenuAccessResult {
  success: boolean;
  item?: boolean;
  message?: string;
  errorCode?: string;
  statusCode: number;
}
