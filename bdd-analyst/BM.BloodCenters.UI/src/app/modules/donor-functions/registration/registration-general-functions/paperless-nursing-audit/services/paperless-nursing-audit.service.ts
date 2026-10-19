import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  AuditOptionDto,
  StartAuditProcessRequest,
  NursingAuditResponse,
  NursingAuditRecordDto,
  AuditSummaryDto,
  ExcludeFlagItem,
  UpdateExcludeFlagRequest,
  ReturnResult,
} from '../models/paperless-nursing-audit.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { Sort } from '@angular/material/sort';
import { SearchBarConfig } from '@shared/components/search-bar/search-bar';

export interface PaperlessNursingAuditState {
  filterFormValues: { idType: string; driveId: string; fromDate: any; toDate: any };
  driveIdOptions: string[];
  records: NursingAuditRecordDto[];
  sessionId: string;
  summary: AuditSummaryDto;
  hasData: boolean;
  pageIndex: number;
  pageSize: number;
  searchText: string;
  activeStatusFilter: string | null;
  filterStatusValue: string | null;
  filterChips: FilterChip[];
  currentSort: Sort;
  idColumnLabel: string;
  searchConfig: SearchBarConfig;
}

@Injectable({
  providedIn: 'root',
})
export class PaperlessNursingAuditService {
  private readonly apiService = inject(ApiService);

  private _savedState: PaperlessNursingAuditState | null = null;

  saveState(state: PaperlessNursingAuditState): void {
    this._savedState = state;
  }

  getAndClearState(): PaperlessNursingAuditState | null {
    const state = this._savedState;
    this._savedState = null;
    return state;
  }

  getOptions(): Observable<AuditOptionDto[]> {
    return this.apiService
      .get<ReturnResult<AuditOptionDto[]>>(API.PAPERLESS_NURSING_AUDIT.OPTIONS)
      .pipe(
        map((res) => {
          if (res.success && res.data && res.data.length > 0) {
            return res.data[0];
          }
          return [];
        }),
      );
  }

  startAudit(request: StartAuditProcessRequest): Observable<NursingAuditResponse> {
    return this.apiService
      .post<ReturnResult<NursingAuditResponse>>(API.PAPERLESS_NURSING_AUDIT.START, request)
      .pipe(
        map((res) => {
          if (res.success && res.data && res.data.length > 0) {
            return res.data[0];
          }
          throw new Error(res.message || 'Failed to start audit');
        }),
      );
  }

  getRecords(sessionId: string): Observable<NursingAuditResponse> {
    return this.apiService
      .get<ReturnResult<NursingAuditResponse>>(
        `${API.PAPERLESS_NURSING_AUDIT.GET_RECORDS}/${sessionId}`,
      )
      .pipe(
        map((res) => {
          if (res.success && res.data && res.data.length > 0) {
            return res.data[0];
          }
          throw new Error(res.message || 'No records found');
        }),
      );
  }

  updateExcludeFlags(sessionId: string, items: ExcludeFlagItem[]): Observable<boolean> {
    const request: UpdateExcludeFlagRequest = { items };
    return this.apiService
      .put<ReturnResult<boolean>>(
        `${API.PAPERLESS_NURSING_AUDIT.EXCLUDE}/${sessionId}/exclude`,
        request,
      )
      .pipe(
        map((res) => {
          if (res.success) {
            return true;
          }
          throw new Error(res.message || 'Failed to update exclude flags');
        }),
      );
  }

  commitAudit(sessionId: string): Observable<string> {
    return this.apiService
      .post<ReturnResult<string>>(
        `${API.PAPERLESS_NURSING_AUDIT.COMMIT}/${sessionId}/commit`,
        {},
      )
      .pipe(
        map((res) => {
          if (res.success) {
            return res.message || 'Audit committed successfully';
          }
          throw new Error(res.message || 'Commit failed');
        }),
      );
  }

  getDriveIds(idType: string, fromDate: string, toDate: string): Observable<string[]> {
    const query = `?idType=${encodeURIComponent(idType)}&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
    return this.apiService
      .get<ReturnResult<string[]>>(`${API.PAPERLESS_NURSING_AUDIT.DRIVE_IDS}${query}`)
      .pipe(
        map((res) => {
          if (res.success && res.data && res.data.length > 0) {
            return res.data[0];
          }
          return [];
        }),
      );
  }
}
