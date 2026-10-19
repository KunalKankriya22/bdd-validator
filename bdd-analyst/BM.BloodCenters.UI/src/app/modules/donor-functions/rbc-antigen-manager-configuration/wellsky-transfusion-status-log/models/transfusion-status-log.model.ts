export interface TransfusionStatusLogSearchDto {
  fromDate?: string;
  toDate?: string;
}

export interface TransfusionJobDto {
  jobId: number;
  jobDate: string;
  errorCount: number | null;
  successCount: number | null;
  untilDate: string | null;
  tfFromDate: string | null;
  tfToDate: string | null;
  tfAddRecordsCount: number | null;
  tfCancelRecordsCount: number | null;
  extractStatus: string | null;
  uploadStatus: string | null;
  jobError: string | null;
}

export interface TransfusionUnitDto {
  unitId: string;
  antigenCode: string;
  resultCode: string;
  insertDate: string | null;
  cancelDate: string | null;
  testBatchId: string | null;
  bcComments: string | null;
}

export type TransfusionErrorUnitDto = TransfusionUnitDto;
