import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  LookupProductsRequest,
  ProductLookup,
  LookupAliquotsRequest,
  AliquotLookup,
  RecordFreezeRequest,
  RecordFreezeResponse,
  CheckDuplicateRequest,
  CheckDuplicateResponse,
  QueryFreezeHistoryRequest,
  QueryFreezeHistoryPaginatedResponse,
} from './freeze-start-time.model';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T[];
  total?: number;
}

/**
 * Service for Freeze Start Time API operations
 * Implements all endpoints from freeze-start-time-api-documentation.md
 */
@Injectable({
  providedIn: 'root',
})
export class FreezeStartTimeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.FREEZE_START_TIME.BASE}`;

  /**
   * Validate unit ID and retrieve collection date and bleed start time
   * POST /freeze-start-time/validate-unit
   */
  validateUnit(request: ValidateUnitRequest): Observable<ValidateUnitResponse> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIME.VALIDATE_UNIT}`;
    return this.http
      .post<ApiResponse<ValidateUnitResponse>>(url, request)
      .pipe(map((response) => response.data![0]));
  }

  /**
   * Lookup eligible FROZP products for a unit
   * POST /freeze-start-time/lookup-products
   */
  lookupProducts(request: LookupProductsRequest): Observable<ProductLookup[]> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIME.LOOKUP_PRODUCTS}`;
    return this.http
      .post<ApiResponse<ProductLookup[]>>(url, request)
      .pipe(map((response) => response.data![0] || []));
  }

  /**
   * Lookup available aliquots for a product
   * POST /freeze-start-time/lookup-aliquots
   */
  lookupAliquots(request: LookupAliquotsRequest): Observable<AliquotLookup[]> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIME.LOOKUP_ALIQUOTS}`;
    return this.http
      .post<ApiResponse<AliquotLookup[]>>(url, request)
      .pipe(map((response) => response.data![0] || []));
  }

  /**
   * Record freeze start time with automatic time limit validation
   * POST /freeze-start-time/record
   */
  recordFreeze(request: RecordFreezeRequest): Observable<RecordFreezeResponse> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIME.RECORD}`;
    return this.http
      .post<ApiResponse<RecordFreezeResponse>>(url, request)
      .pipe(map((response) => response.data![0]));
  }

  /**
   * Check if freeze entry already exists (duplicate check)
   * POST /freeze-start-time/check-duplicate
   */
  checkDuplicate(request: CheckDuplicateRequest): Observable<CheckDuplicateResponse> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIME.CHECK_DUPLICATE}`;
    return this.http
      .post<ApiResponse<CheckDuplicateResponse>>(url, request)
      .pipe(map((response) => response.data![0]));
  }

  /**
   * Query freeze start time history with pagination
   * POST /freeze-start-time/query
   */
  queryHistory(request: QueryFreezeHistoryRequest): Observable<QueryFreezeHistoryPaginatedResponse> {
    const url = `${environment.apiUrl}${API.FREEZE_START_TIME.QUERY_HISTORY}`;
    return this.http
      .post<ApiResponse<QueryFreezeHistoryPaginatedResponse>>(url, request)
      .pipe(map((response) => response.data![0]));
  }
}
