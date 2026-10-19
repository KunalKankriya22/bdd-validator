import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  AntigenConfigRule,
  AntigenConfigRulesSearchRequest,
  AntigenConfigRuleCreateRequest,
  AntigenConfigRuleUpdateRequest,
  ApiResponse,
  LookupValue,
  TestIdOption,
  FilterOption,
} from '../models/antigen-config-rules.model';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string | null;
  errorCode?: string | null;
  statusCode?: number;
  data?: T[] | null;
  item?: T | number | null;
  total?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AntigenConfigRulesService {
  private readonly apiService = inject(ApiService);

  search(
    take: number,
    skip: number,
    request: AntigenConfigRulesSearchRequest
  ): Observable<{ data: AntigenConfigRule[]; total: number }> {
    const endpoint = API.ANTIGEN_CONFIG_RULES.SEARCH(take, skip);
    return this.apiService.post<ReturnResult<AntigenConfigRule>>(endpoint, request).pipe(
      map(res => ({ data: res.data || [], total: res.total || 0 })),
      catchError(err => throwError(() => err))
    );
  }

  create(request: AntigenConfigRuleCreateRequest): Observable<ApiResponse> {
    return this.apiService
      .post<ApiResponse>(API.ANTIGEN_CONFIG_RULES.CREATE, request)
      .pipe(catchError(err => throwError(() => err)));
  }

  update(primaryRuleId: number, request: AntigenConfigRuleUpdateRequest): Observable<ApiResponse> {
    return this.apiService
      .put<ApiResponse>(API.ANTIGEN_CONFIG_RULES.UPDATE(primaryRuleId), request)
      .pipe(catchError(err => throwError(() => err)));
  }

  terminate(primaryRuleId: number): Observable<ApiResponse> {
    return this.apiService
      .post<ApiResponse>(API.ANTIGEN_CONFIG_RULES.TERMINATE(primaryRuleId), {})
      .pipe(catchError(err => throwError(() => err)));
  }

  delete(primaryRuleId: number): Observable<ApiResponse> {
    return this.apiService
      .delete<ApiResponse>(API.ANTIGEN_CONFIG_RULES.DELETE(primaryRuleId))
      .pipe(catchError(err => throwError(() => err)));
  }

  getFilterOptions(): Observable<FilterOption[]> {
    return this.apiService
      .get<ReturnResult<FilterOption>>(API.ANTIGEN_CONFIG_RULES.FILTER_OPTIONS)
      .pipe(
        map(res => res.data || []),
        catchError(err => throwError(() => err))
      );
  }

  getAntigenGroups(): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<LookupValue>>(API.ANTIGEN_CONFIG_RULES.LOOKUP_ANTIGEN_GROUPS)
      .pipe(
        map(res => (res.data || []).map(v => v.value)),
        catchError(err => throwError(() => err))
      );
  }

  getAntigenTests(): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<LookupValue>>(API.ANTIGEN_CONFIG_RULES.LOOKUP_ANTIGEN_TESTS)
      .pipe(
        map(res => (res.data || []).map(v => v.value)),
        catchError(err => throwError(() => err))
      );
  }

  getLabelingAntigens(): Observable<string[]> {
    return this.apiService
      .get<ReturnResult<LookupValue>>(API.ANTIGEN_CONFIG_RULES.LOOKUP_LABELING_ANTIGENS)
      .pipe(
        map(res => (res.data || []).map(v => v.value)),
        catchError(err => throwError(() => err))
      );
  }

  getTestIds(testType: 'SER' | 'MOL'): Observable<TestIdOption[]> {
    return this.apiService
      .get<ReturnResult<LookupValue>>(API.ANTIGEN_CONFIG_RULES.LOOKUP_TEST_IDS(testType))
      .pipe(
        map(res => (res.data || []).map(v => ({ value: v.value, description: v.description }))),
        catchError(err => throwError(() => err))
      );
  }

  getCount(antigenGroup?: string, antigenCode?: string, showTerminated?: string): Observable<number> {
    let url = API.ANTIGEN_CONFIG_RULES.COUNT + '?';
    if (antigenGroup) url += `antigenGroup=${encodeURIComponent(antigenGroup)}&`;
    if (antigenCode) url += `antigenCode=${encodeURIComponent(antigenCode)}&`;
    if (showTerminated) url += `showTerminated=${encodeURIComponent(showTerminated)}`;
    return this.apiService
      .get<ReturnResult<number>>(url)
      .pipe(
        map(res => (typeof res.item === 'number' ? res.item : 0)),
        catchError(err => throwError(() => err))
      );
  }
}
