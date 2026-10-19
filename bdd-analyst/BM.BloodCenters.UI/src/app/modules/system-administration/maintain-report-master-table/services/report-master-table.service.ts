import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ReportMasterTableModel,
  ReportMasterTableParamsDto,
  WarehouseChapterLovResponse,
} from '../models/report-master-table.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ReportMasterTableFilterLov } from '../models/report-master-table.model';
import { environment } from 'src/environments/environment';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportMasterTableService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);

  getReportMasterTable(
    take: number,
    skip: number,
    params: ReportMasterTableParamsDto
  ): Observable<{ data: ReportMasterTableModel[]; totalRecords: number }> {
    const endpoint = API.SYSTEM_ADMIN.REPORT_MASTER_TABLE(take, skip);

    return this.apiService.post<ReturnResult<ReportMasterTableModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0

      })),
      catchError(error => {
        console.error('Error fetching report master table:', error);
        return throwError(() => error);
      })
    );
  }

  getReportMasterTableFilters(): Observable<ReturnResult<ReportMasterTableFilterLov>> {

    return this.apiService.get<ReturnResult<ReportMasterTableFilterLov>>(API.SYSTEM_ADMIN.REPORT_MASTER_TABLE_FILTERS).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getReportMasterTableAddDropdown(): Observable<ReturnResult<{ chapterIds: string[] }>> {
    return this.apiService.get<ReturnResult<{ chapterIds: string[] }>>(API.SYSTEM_ADMIN.REPORT_MASTER_TABLE_ADD_DROPDOWN).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getWarehouseChapterDropdowns(): Observable<WarehouseChapterLovResponse> {
    return this.apiService.get<{ data: WarehouseChapterLovResponse }>(API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_DROPDOWNS).pipe(
      map(res => res.data),
      catchError(error => throwError(() => error))
    );
  }

    createReportMaster(payload: any) {
    return this.apiService.post(
      API.SYSTEM_ADMIN.CREATE_REPORT_MASTER,
      payload
    );
  }

  updateReportMaster(query: { chapterId: string; codeType: string; code: string }, payload: any) {
    const url =
      `${API.SYSTEM_ADMIN.UPDATE_REPORT_MASTER}` +
      `?CHAPTER_ID=${encodeURIComponent(query.chapterId)}` +
      `&CODE_TYPE=${encodeURIComponent(query.codeType)}` +
      `&CODE=${encodeURIComponent(query.code)}`;

    return this.apiService.put(url, payload);
  }

  deleteReportMaster(query: { chapterId: string; codeType: string; code: string }): Observable<any> {
    const payload = {
      chapterID: query.chapterId || '',
      type: query.codeType,
      code: query.code
    };

    const url = `${environment.apiUrl}/${API.SYSTEM_ADMIN.DELETE_REPORT_MASTER.replace(/^\/+|\/+$/g, '')}`;

    return this.http.delete(url, {
      body: payload,
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError(error => {
        console.error('Error deleting report master:', error);
        return throwError(() => error);
      })
    );
  }

}