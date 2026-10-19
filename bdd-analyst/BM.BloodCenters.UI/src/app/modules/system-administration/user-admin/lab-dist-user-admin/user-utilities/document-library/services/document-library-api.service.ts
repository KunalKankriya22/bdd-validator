import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReturnResult,
  DocumentLibraryDto,
  DocumentLibrarySearchDto,
  UploadMetadata,
  DeleteDocumentRequest,
  LinkCategoryDto,
  TableColumnLink,
  ColumnCodeItem
} from '../models/document-library.model';

/**
 * API Service for Document Library operations
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentLibraryApiService {
  private apiService = inject(ApiService);

  /**
   * Upload document with metadata
   * @param file The file to upload
   * @param metadata Document metadata
   * @returns Observable of uploaded document
   */
  uploadDocument(file: File, metadata: UploadMetadata): Observable<DocumentLibraryDto> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('Metadata', JSON.stringify(metadata));

    return this.apiService.post<ReturnResult<DocumentLibraryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.UPLOAD,
      formData
    ).pipe(
      map(response => {
        if (response.success && response.item) {
          return response.item;
        }
        throw new Error(response.message || 'Upload failed');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Search documents with filters
   * @param filters Search criteria
   * @param take Number of records to retrieve
   * @param skip Number of records to skip
   * @returns Observable of document array
   */
  searchDocuments(
    filters: DocumentLibrarySearchDto,
    take: number = 1000,
    skip: number = 0
  ): Observable<{ documents: DocumentLibraryDto[]; total: number }> {
    return this.apiService.post<ReturnResult<DocumentLibraryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.SEARCH(take, skip),
      filters
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            documents: response.data,
            total: response.total || 0
          };
        }
        return { documents: [], total: 0 };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get document metadata by session ID
   * @param sessionId Document session ID
   * @returns Observable of document metadata
   */
  getDocumentMetadata(sessionId: string): Observable<DocumentLibraryDto> {
    return this.apiService.get<ReturnResult<DocumentLibraryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.GET(sessionId)
    ).pipe(
      map(response => {
        if (response.success && response.item) {
          return response.item;
        }
        throw new Error(response.message || 'Document not found');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Download document file
   * @param sessionId Document session ID
   * @returns Observable of file blob
   */
  downloadDocument(sessionId: string): Observable<Blob> {
    return this.apiService.get<Blob>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.DOWNLOAD(sessionId),
      { responseType: 'blob' }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete document
   * @param sessionId Document session ID
   * @param deleteRequest Delete request body
   * @returns Observable of void (completes on success)
   */
  deleteDocument(
    sessionId: string,
    deleteRequest: DeleteDocumentRequest = { deleteAll: true }
  ): Observable<void> {
    return this.apiService.delete<ReturnResult<DocumentLibraryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.DELETE(sessionId),
      { body: deleteRequest }
    ).pipe(
      map(response => {
        if (response.success || response.message?.includes('deleted')) {
          return;
        }
        throw new Error(response.message || 'Delete failed');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get available link categories
   * @returns Observable of link categories
   */
  getLinkCategories(): Observable<TableColumnLink[]> {
    return this.apiService.get<ReturnResult<LinkCategoryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_CATEGORIES
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(category => ({
            code: category.code,
            linkWith: category.description,
            linkTable: category.tableName,
            linkColumn: category.columnName
          }));
        }
        return [];
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Link existing document to additional values
   * @param sessionId Document session ID
   * @param metadata Document metadata with new linked values
   * @returns Observable of updated document
   */
  linkDocumentValues(sessionId: string, metadata: UploadMetadata): Observable<DocumentLibraryDto> {
    // For linking existing documents, we use the same upload endpoint but with session ID
    // The backend should handle this case appropriately
    const formData = new FormData();
    formData.append('SessionId', sessionId);
    formData.append('Metadata', JSON.stringify(metadata));

    return this.apiService.post<ReturnResult<DocumentLibraryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.UPLOAD,
      formData
    ).pipe(
      map(response => {
        if (response.success && response.item) {
          return response.item;
        }
        throw new Error(response.message || 'Link failed');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Link additional values to an existing document
   */
  linkValues(sessionId: string, valuesToLink: string[]): Observable<DocumentLibraryDto> {
    return this.apiService.post<ReturnResult<DocumentLibraryDto>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_VALUES(sessionId),
      { valuesToLink }
    ).pipe(
      map(response => {
        if (response.success && response.item) {
          return response.item;
        }
        throw new Error(response.message || 'Failed to link values');
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Validate if a value exists in the specified table/column
   * @param tableName Table name
   * @param columnName Column name
   * @param value Value to validate
   * @returns Observable of validation result
   */
  validateValue(tableName: string, columnName: string, value: string): Observable<boolean> {
    const params = new HttpParams()
      .set('tableName', tableName)
      .set('columnName', columnName)
      .set('value', value);

    return this.apiService.get<ReturnResult<boolean>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.VALIDATE_VALUE,
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.item !== null) {
          return response.item;
        }
        return false;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get column codes for document library filters
   * @param tableName Optional table name to filter columns
   * @returns Observable of column code strings
   */
  getColumnCodes(tableName?: string): Observable<string[]> {
    let params = new HttpParams();
    if (tableName) {
      params = params.set('tableName', tableName);
    }

    return this.apiService.get<ReturnResult<ColumnCodeItem>>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.COLUMN_CODES,
      { params }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          // Extract unique column names from the data array
          const columnNames = response.data.map(item => item.columnName);
          // Remove duplicates and return
          return [...new Set(columnNames)];
        }
        return [];
      }),
      catchError(error => throwError(() => error))
    );
  }
}
