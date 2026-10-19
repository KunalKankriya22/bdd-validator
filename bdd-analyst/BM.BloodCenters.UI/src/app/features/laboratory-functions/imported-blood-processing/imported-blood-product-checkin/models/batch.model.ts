/**
 * Imported Blood Product Batch Models
 * Based on API guide: IMCHKIN-API-Integration-Guide
 */

/**
 * Batch creation request DTO - POST /batches
 */
export interface CreateBatchInputDto {
  batchId?: string | null;
  contractId: string;
  airwayBillNo: string;
  shippedDate: string;
  receivedDate: string;
  productType: string;
  minTemp: number;
  maxTemp: number;
  cartonCount: number;
  numberOfUnits: number;
  licenseFlag: 'Y' | 'N';
}

/**
 * Batch response model - from GET /batches and POST /batches
 */
export interface BatchResponse {
  batchId: string;
  contractId: string;
  chapterId: string;
  airwayBillNo: string;
  shippedDate: string;
  receivedDate: string;
  productType: string;
  minTemp: number;
  maxTemp: number;
  cartonCount: number;
  numberOfUnits: number;
  licenseFlag?: 'Y' | 'N';
  qcDate?: string | null;
  company?: string;
}

/**
 * Batch list/query filter params - GET /batches/{take}/{skip}?...
 */
export interface BatchQueryDto {
  contractId?: string;
  fromDate?: string;
  toDate?: string;
  incompleteOnly?: boolean;
}
