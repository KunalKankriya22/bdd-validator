import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { DonorDocumentDisplay } from '../models/donor-document-library.model';

@Injectable({ providedIn: 'root' })
export class DonorDocumentLibraryService {
  private readonly apiService = inject(ApiService);

  searchDocuments(
    filters: {
      docLinkedTable?: string;
      docLinkedColumn?: string;
      docLinkedValue?: string;
      docId?: string;
      fromDate?: string;
      toDate?: string;
    },
    take: number,
    skip: number,
  ): Observable<{ documents: any[]; total: number }> {
    return this.apiService
      .post<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.SEARCH(take, skip), filters)
      .pipe(
        map((response) => {
          if (response?.success && response.data) {
            return { documents: response.data, total: response.total || 0 };
          }
          return { documents: [], total: 0 };
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  uploadDocument(file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('Metadata', JSON.stringify(metadata));
    return this.apiService
      .post<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.UPLOAD, formData)
      .pipe(
        map((response) => {
          if (response?.success) {
            return response.item || response.data;
          }
          throw new Error(response?.message || 'Upload failed');
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  downloadDocument(sessionId: string): Observable<Blob> {
    return this.apiService.get<Blob>(
      API.USER_UTILITIES.DOCUMENT_LIBRARY.DOWNLOAD(sessionId),
      { responseType: 'blob' as any },
    );
  }

  deleteDocument(
    sessionId: string,
    deleteRequest: { deleteAll: boolean; selectedValues?: string[] },
  ): Observable<void> {
    return this.apiService
      .delete<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.DELETE(sessionId), {
        body: deleteRequest,
      })
      .pipe(
        map(() => void 0),
        catchError((error) => throwError(() => error)),
      );
  }

  getLinkCategories(): Observable<any[]> {
    return this.apiService
      .get<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_CATEGORIES)
      .pipe(
        map((response) => {
          if (response?.success && response.data) {
            return response.data.map((item: any) => ({
              code: item.code,
              linkWith: item.description,
              linkTable: item.tableName,
              linkColumn: item.columnName,
            }));
          }
          return [];
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  linkValues(sessionId: string, valuesToLink: string[]): Observable<any> {
    return this.apiService
      .post<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_VALUES(sessionId), {
        valuesToLink,
      })
      .pipe(
        map((response) => response),
        catchError((error) => throwError(() => error)),
      );
  }

  validateValue(
    tableName: string,
    columnName: string,
    value: string,
  ): Observable<boolean> {
    const params = `?tableName=${encodeURIComponent(tableName)}&columnName=${encodeURIComponent(columnName)}&value=${encodeURIComponent(value)}`;
    return this.apiService
      .get<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.VALIDATE_VALUE + params)
      .pipe(
        map((response) => response?.success === true),
        catchError((error) => throwError(() => error)),
      );
  }

  getColumnCodes(tableName?: string): Observable<string[]> {
    const params = tableName
      ? `?tableName=${encodeURIComponent(tableName)}`
      : '';
    return this.apiService
      .get<any>(API.USER_UTILITIES.DOCUMENT_LIBRARY.COLUMN_CODES + params)
      .pipe(
        map((response) => {
          if (response?.success && response.data) {
            return response.data.map((item: any) => item.columnName).filter(Boolean) as string[];
          }
          return [];
        }),
        catchError((error) => throwError(() => error)),
      );
  }
}
