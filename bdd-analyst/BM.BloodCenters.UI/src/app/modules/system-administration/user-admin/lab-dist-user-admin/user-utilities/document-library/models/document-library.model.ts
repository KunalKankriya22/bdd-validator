/**
 * Document Library Models
 */

/**
 * API Response wrapper
 */
export interface ReturnResult<T> {
  success: boolean | null;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number | null;
  data: T[] | null;
  item: T | null;
  total: number | null;
  errorResponse: object;
}

/**
 * Document Library DTO from API
 */
export interface DocumentLibraryDto {
  chapterId: string;
  sessionId: string;
  docName: string;
  docType: string;
  docId: string;
  docLinkedTable: string;
  docLinkedColumn: string;
  docLinkedDesc: string;
  insertDate: string;
  insertUser: string;
  linkedValues: string[];
}

/**
 * Search criteria for documents
 */
export interface DocumentLibrarySearchDto {
  docLinkedTable?: string;
  docLinkedColumn?: string;
  docLinkedValue?: string;
  docId?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Upload metadata
 */
export interface UploadMetadata {
  docName: string;
  docId: string;
  docLinkedTable: string;
  docLinkedColumn: string;
  docLinkedDesc: string;
  linkedValues: string[];
}

/**
 * Delete request body
 */
export interface DeleteDocumentRequest {
  deleteAll: boolean;
  selectedValues?: string[];
}

/**
 * Link category from API
 */
export interface LinkCategoryDto {
  code: string;
  description: string;
  tableName: string;
  columnName: string;
}

/**
 * Available table/column link option
 */
export interface TableColumnLink {
  code: string;
  linkWith: string;
  linkTable: string;
  linkColumn: string;
}

/**
 * Document display model for UI table
 */
export interface DocumentDisplay {
  sessionId: string;
  docName: string;
  docLinkedDesc: string;
  docId: string;
  docLinkedTable: string;
  docLinkedColumn: string;
  linkedValue: string;
  docType?: string; // Optional - derived from filename
}

/**
 * Column code item from API
 */
export interface ColumnCodeItem {
  columnName: string;
  description: string;
}
