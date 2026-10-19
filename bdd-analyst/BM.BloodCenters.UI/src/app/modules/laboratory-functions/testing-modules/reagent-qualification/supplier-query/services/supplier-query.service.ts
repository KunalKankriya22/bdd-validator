import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SuppliersLookupResponse,
  SupplierQuerySearchResponse,
  SupplierLookup,
  SupplierQueryResult,
  SupplierQuerySearchRequest
} from '../models/supplier-query.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get suppliers for dropdown
   * GET /api/v1/supplier-query/suppliers-dropdown
   */
  getSuppliersLookup(): Observable<SupplierLookup[]> {
    return this.apiService.get<SuppliersLookupResponse>(API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.SUPPLIERS_DROPDOWN).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error fetching suppliers lookup:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Search supplier query with filters
   * POST /api/v1/supplier-query/search
   */
  searchSupplierQuery(
    request: SupplierQuerySearchRequest
  ): Observable<{ data: SupplierQueryResult[]; total: number }> {
    return this.apiService.post<any>(
      API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.SEARCH,
      request
    ).pipe(
      map(response => ({
        data: response?.data || [],
        // Handle both 'total' and 'totalCount' field names from API
        total: response?.total ?? response?.totalCount ?? response?.data?.length ?? 0
      })),
      catchError(error => {
        console.error('Error searching supplier query:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get detailed reagent information by ID
   * GET /api/v1/supplier-query/{reagentId}
   */
  getReagentById(reagentId: string): Observable<SupplierQueryResult> {
    return this.apiService.get<{ data: SupplierQueryResult }>(
      API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.GET_BY_ID(reagentId)
    ).pipe(
      map(response => response?.data),
      catchError(error => {
        console.error('Error fetching reagent detail:', error);
        return throwError(() => error);
      })
    );
  }
}
