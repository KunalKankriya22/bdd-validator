import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  HlaInterimOutput,
  HlaInterimOutputSearchParams,
  InterimCodeLov,
  HlaInterimOutputFilterValues
} from '../models/hla-interim-output.model';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  error: string | null;
  total: number;
}

interface FilterValuesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: HlaInterimOutputFilterValues;
}

interface BackendHlaInterimOutput {
  matchA1A1: string;
  matchA1A1Description: string;
  matchA1A2: string;
  matchA1A2Description: string;
  matchA2A1: string;
  matchA2A1Description: string;
  matchA2A2: string;
  matchA2A2Description: string;
  outputA1: string;
  outputA1Description: string;
  outputA2: string;
  outputA2Description: string;
  effDate: string;
  termDate?: string | null;
  programId: string;
  insertDate: string;
  insertUser: string;
  chapterId: string;
}

interface LovResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  error: string | null;
}

/**
 * API error response structure for business logic errors (success: false)
 */
interface ApiErrorResponse {
  success: false;
  errorCode?: string;
  error?: string;
  message?: string;
  statusCode?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

/**
 * Discriminated union for create/update operations
 * Either returns the created/updated item, null, or an error response
 */
type CreateUpdateResult = HlaInterimOutput | null | ApiErrorResponse;

@Injectable({
  providedIn: 'root'
})
export class HlaInterimOutputService {
  private readonly apiService = inject(ApiService);

  /**
   * Transforms backend response to frontend model
   * Backend provides both codes (for forms) and descriptions (for display)
   */
  private transformBackendToFrontend(backendItem: BackendHlaInterimOutput): HlaInterimOutput {
    const hlaCode = `${backendItem.matchA1A1}-${backendItem.matchA1A2}-${backendItem.matchA2A1}-${backendItem.matchA2A2}`;

    return {
      hlaCode: hlaCode,
      hlaDescription: hlaCode,
      matchA1A1: backendItem.matchA1A1,
      matchA1A1Description: backendItem.matchA1A1Description,
      matchA1A2: backendItem.matchA1A2,
      matchA1A2Description: backendItem.matchA1A2Description,
      matchA2A1: backendItem.matchA2A1,
      matchA2A1Description: backendItem.matchA2A1Description,
      matchA2A2: backendItem.matchA2A2,
      matchA2A2Description: backendItem.matchA2A2Description,
      outcomeAntigenA1: backendItem.outputA1,
      outcomeAntigenA1Description: backendItem.outputA1Description,
      outcomeAntigenA2: backendItem.outputA2,
      outcomeAntigenA2Description: backendItem.outputA2Description,
      effectiveDate: backendItem.effDate,
      terminationDate: backendItem.termDate || null,
      insUser: backendItem.insertUser,
      insDate: backendItem.insertDate
    };
  }

  getAll(
    take: number = 25,
    skip: number = 0,
    searchParams?: HlaInterimOutputSearchParams
  ): Observable<{ data: HlaInterimOutput[]; total: number }> {
    // Transform frontend params to backend DTO format
    const payload: any = {};

    if (searchParams) {
      if (searchParams.matchA1A1) payload.matchA1A1 = searchParams.matchA1A1;
      if (searchParams.matchA1A2) payload.matchA1A2 = searchParams.matchA1A2;
      if (searchParams.outcomeAntigenA1) payload.outputA1 = searchParams.outcomeAntigenA1;
      if (searchParams.matchA2A1) payload.matchA2A1 = searchParams.matchA2A1;
      if (searchParams.matchA2A2) payload.matchA2A2 = searchParams.matchA2A2;
      if (searchParams.outcomeAntigenA2) payload.outputA2 = searchParams.outcomeAntigenA2;
      if (searchParams.searchText) payload.searchKeyword = searchParams.searchText;
      if (searchParams.sortColumn) payload.sortColumn = searchParams.sortColumn;
      if (searchParams.sortOrder) payload.sortOrder = searchParams.sortOrder;

      // Map effective date filter
      if (searchParams.effDate && searchParams.effDatePeriod) {
        if (searchParams.effDatePeriod === 'After') {
          payload.effDateAfter = searchParams.effDate;
        } else {
          payload.effDateBefore = searchParams.effDate;
        }
      }

      // Map termination date filter
      if (searchParams.termDate && searchParams.termDatePeriod) {
        if (searchParams.termDatePeriod === 'After') {
          payload.termDateAfter = searchParams.termDate;
        } else {
          payload.termDateBefore = searchParams.termDate;
        }
      }
    }

    return this.apiService.post<ApiResponse<BackendHlaInterimOutput>>(
      API.HLA.INTERIM_OUTPUT.SEARCH(take, skip),
      payload
    ).pipe(
      map(response => ({
        data: (response.data || []).map(item => this.transformBackendToFrontend(item)),
        total: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getByMatchCodes(
    matchA1A1: string,
    matchA1A2: string,
    matchA2A1: string,
    matchA2A2: string
  ): Observable<HlaInterimOutput | null> {
    return this.apiService.get<ApiResponse<BackendHlaInterimOutput>>(
      API.HLA.INTERIM_OUTPUT.GET_BY_MATCH(matchA1A1, matchA1A2, matchA2A1, matchA2A2)
    ).pipe(
      map(response => {
        const item = response.data && response.data.length > 0 ? response.data[0] : null;
        return item ? this.transformBackendToFrontend(item) : null;
      }),
      catchError(() => of(null))
    );
  }

  create(data: Partial<HlaInterimOutput>): Observable<CreateUpdateResult> {
    const payload = {
      matchA1A1: data.matchA1A1,
      matchA1A2: data.matchA1A2,
      matchA2A1: data.matchA2A1,
      matchA2A2: data.matchA2A2,
      outputA1: data.outcomeAntigenA1,
      outputA2: data.outcomeAntigenA2,
      effDate: data.effectiveDate,
      termDate: data.terminationDate || null
    };

    return this.apiService.post<ApiResponse<BackendHlaInterimOutput> | ApiErrorResponse>(
      API.HLA.INTERIM_OUTPUT.CREATE,
      payload
    ).pipe(
      map(response => {
        // Pass through error responses so component can handle them
        if (response?.success === false) {
          return response as ApiErrorResponse;
        }
        const item = (response as ApiResponse<BackendHlaInterimOutput>).data && (response as ApiResponse<BackendHlaInterimOutput>).data.length > 0 ? (response as ApiResponse<BackendHlaInterimOutput>).data[0] : null;
        return item ? this.transformBackendToFrontend(item) : null;
      }),
      catchError(error => throwError(() => error))
    );
  }

  update(
    matchA1A1: string,
    matchA1A2: string,
    matchA2A1: string,
    matchA2A2: string,
    data: Partial<HlaInterimOutput>
  ): Observable<CreateUpdateResult> {
    const payload = {
      matchA1A1: data.matchA1A1,
      matchA1A2: data.matchA1A2,
      matchA2A1: data.matchA2A1,
      matchA2A2: data.matchA2A2,
      outputA1: data.outcomeAntigenA1,
      outputA2: data.outcomeAntigenA2,
      effDate: data.effectiveDate,
      termDate: data.terminationDate || null
    };

    return this.apiService.put<ApiResponse<BackendHlaInterimOutput> | ApiErrorResponse>(
      API.HLA.INTERIM_OUTPUT.UPDATE(matchA1A1, matchA1A2, matchA2A1, matchA2A2),
      payload
    ).pipe(
      map(response => {
        // Pass through error responses so component can handle them
        if (response?.success === false) {
          return response as ApiErrorResponse;
        }
        const item = (response as ApiResponse<BackendHlaInterimOutput>).data && (response as ApiResponse<BackendHlaInterimOutput>).data.length > 0 ? (response as ApiResponse<BackendHlaInterimOutput>).data[0] : null;
        return item ? this.transformBackendToFrontend(item) : null;
      }),
      catchError(error => throwError(() => error))
    );
  }

  getFilterValues(): Observable<HlaInterimOutputFilterValues | null> {
    return this.apiService.get<FilterValuesResponse>(
      API.HLA.INTERIM_OUTPUT.GET_FILTER_VALUES
    ).pipe(
      map(response => response.item || null),
      catchError(() => of(null))
    );
  }

  getInterimCodesLov(): Observable<InterimCodeLov[]> {
    return this.apiService.get<LovResponse<InterimCodeLov>>(
      API.HLA.INTERIM_OUTPUT.GET_INTERIM_CODES_LOV
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }
}
