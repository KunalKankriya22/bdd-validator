import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  success: boolean;
  totalCount?: number;
}

export interface CommunicationRecord {
  commType: string;
  commCode: string;
  description: string;
  targetDays?: number;
  effDate: string;
  termDate?: string | null;
  insertDate?: string;
  insertUser?: string;
  programId?: string;
  chapterId?: string;
}

export interface CommTypeFilter {
  searchKeyword?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
}

export interface CommTypeSearchPayload {
  commType: string;
  searchKeyword?: string;
  showTerminated?: boolean;
  effectiveDate?: string;
  terminationDate?: string;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateCommRecordRequest {
  commType: string;
  commCode: string;
  description: string;
  targetDays?: number;
  effDate: string;
  termDate?: string | null;
}

export interface UpdateCommRecordRequest {
  description: string;
  targetDays?: number;
  effDate?: string;
  termDate?: string | null;
}

export interface CommTypeDialogResult {
  commCode: string;
  description: string;
  targetDays?: number;
  effDate: string;
  termDate?: string | null;
  addAnother?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommunicationTypesService {
  private apiUrl = '/api/v1/communication-types';

  constructor(private apiService: ApiService) {}

  search(
    commType: string,
    take: number = 10,
    skip: number = 0,
    filter?: {
      searchKeyword?: string;
      showTerminated?: boolean;
      effectiveDate?: string;
      terminationDate?: string;
      effectiveDatePeriod?: 'BEFORE' | 'AFTER';
      terminationDatePeriod?: 'BEFORE' | 'AFTER';
      sortColumn?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): Observable<{ data: CommunicationRecord[]; totalCount: number }> {
    const url = `${this.apiUrl}/${take}/${skip}`;
    const payload: CommTypeSearchPayload = {
      commType,
      searchKeyword: filter?.searchKeyword || '',
      showTerminated: filter?.showTerminated ?? false,
      effectiveDate: filter?.effectiveDate || undefined,
      terminationDate: filter?.terminationDate || undefined,
      effectiveDatePeriod: filter?.effectiveDatePeriod || undefined,
      terminationDatePeriod: filter?.terminationDatePeriod || undefined,
      sortColumn: filter?.sortColumn || undefined,
      sortOrder: filter?.sortOrder || undefined,
    };

    return this.apiService
      .post<ApiResponse<CommunicationRecord[]>>(url, payload)
      .pipe(
        map((response) => ({
          data: response.data || [],
          totalCount: response.totalCount || 0,
        }))
      );
  }

  create(data: CreateCommRecordRequest): Observable<ApiResponse<CommunicationRecord>> {
    return this.apiService.post<ApiResponse<CommunicationRecord>>(this.apiUrl, data);
  }

  update(
    commType: string,
    commCode: string,
    data: UpdateCommRecordRequest
  ): Observable<ApiResponse<CommunicationRecord>> {
    const url = `${this.apiUrl}/${encodeURIComponent(commType)}/${encodeURIComponent(commCode)}`;
    return this.apiService.put<ApiResponse<CommunicationRecord>>(url, data);
  }

  checkExists(commType: string, commCode: string): Observable<boolean> {
    const url = `${this.apiUrl}/details/${encodeURIComponent(commType)}/${encodeURIComponent(commCode)}`;
    return this.apiService.get<ApiResponse<CommunicationRecord>>(url).pipe(
      map(response => !!response?.data),
      catchError(() => of(false))
    );
  }
}
