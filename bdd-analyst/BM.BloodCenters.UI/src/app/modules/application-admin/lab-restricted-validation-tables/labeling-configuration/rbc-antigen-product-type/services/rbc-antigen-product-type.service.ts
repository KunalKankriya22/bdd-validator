import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  RbcAntigenProductTypeModel,
  RbcAntigenProductTypeListBody,
  RbcAntigenProductTypeCreateDto,
  RbcAntigenProductTypeUpdateDto,
  LookupItem
} from '../models/rbc-antigen-product-type.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class RbcAntigenProductTypeService {
  private readonly apiService = inject(ApiService);

  /**
   * List / filter AG print prod type records
   * POST /lbl-ag-print-prod-types/list
   * Returns all matching records (no server-side pagination)
   */
  getAgPrintProdTypes(body: RbcAntigenProductTypeListBody): Observable<{ data: RbcAntigenProductTypeModel[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_LIST;

    return this.apiService.post<any>(endpoint, body).pipe(
      map(response => {
        if (!response) {
          return { data: [], total: 0 };
        }
        const data: RbcAntigenProductTypeModel[] = response.data || [];
        const total: number = response.total ?? data.length;
        return { data, total };
      }),
      catchError(error => {
        console.error('Error fetching AG print prod type data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get product type lookup options
   * GET /lbl-ag-print-prod-types/lookups/product-types
   * Response is a plain array: [{ code, description }]
   */
  getProductTypeLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_LOOKUP_TYPES;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching product type lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new AG Print Prod Type record
   * POST /lbl-ag-print-prod-types
   */
  createRecord(data: RbcAntigenProductTypeCreateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_ADD;

    return this.apiService.post<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating AG print prod type:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing AG Print Prod Type record
   * PUT /lbl-ag-print-prod-types/{productType}
   * Only sends editable fields (effDate, termDate)
   */
  updateRecord(productType: string, data: RbcAntigenProductTypeUpdateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_UPDATE(productType);

    return this.apiService.put<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating AG print prod type:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an AG Print Prod Type record
   * DELETE /lbl-ag-print-prod-types/{productType}
   */
  deleteRecord(productType: string): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_DELETE(productType);

    return this.apiService.delete<any>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting AG print prod type:', error);
        return throwError(() => error);
      })
    );
  }
}
