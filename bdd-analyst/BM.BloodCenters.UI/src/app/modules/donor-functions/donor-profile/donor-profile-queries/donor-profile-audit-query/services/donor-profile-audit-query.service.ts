import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonorProfileAuditQueryDto,
  DonorProfileAuditQueryResponse,
  DonorProfileAuditDetailResponse,
  DonorProfileAuditResultDto,
  DonorProfileAuditDetailDto,
  DonorSearchRequest,
  DonorSearchResultDto
} from '../models/donor-profile-audit-query.model';

interface DonorSearchResponse {
  success?: boolean;
  data?: DonorSearchResultDto[];
  items?: DonorSearchResultDto[];
}

@Injectable({ providedIn: 'root' })
export class DonorProfileAuditQueryService {
  private readonly apiService = inject(ApiService);

  queryAuditRecords(
    criteria: DonorProfileAuditQueryDto,
    take: number,
    skip: number,
    expandAll = false,
    searchText?: string,
    tableName?: string
  ): Observable<{ data: DonorProfileAuditResultDto[]; total: number }> {
    let endpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(take, skip, expandAll);

    // Build query parameters
    const queryParams: string[] = [];

    if (criteria.insertUser) {
      queryParams.push(`insertUser=${encodeURIComponent(criteria.insertUser)}`);
    }

    if (searchText && searchText.trim()) {
      queryParams.push(`searchText=${encodeURIComponent(searchText.trim())}`);
    }

    if (tableName && tableName.trim()) {
      queryParams.push(`tableName=${encodeURIComponent(tableName.trim())}`);
    }

    if (queryParams.length > 0) {
      const separator = expandAll ? '&' : '?';
      endpoint += separator + queryParams.join('&');
    }

    return this.apiService.post<DonorProfileAuditQueryResponse>(endpoint, criteria).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getAuditDetail(recordId: number): Observable<DonorProfileAuditDetailDto | null> {
    const endpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.DETAIL(recordId);

    return this.apiService.get<DonorProfileAuditDetailResponse>(endpoint).pipe(
      map(response => response.data || null),
      catchError(error => throwError(() => error))
    );
  }

  searchDonors(criteria: DonorSearchRequest): Observable<DonorSearchResultDto[]> {
    const endpoint = API.SEARCH_FOR_DONOR.SEARCH;

    return this.apiService.post<DonorSearchResponse>(endpoint, criteria).pipe(
      map(response => response.data || response.items || []),
      catchError(error => throwError(() => error))
    );
  }
}
