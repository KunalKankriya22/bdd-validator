import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  PoolCompatibilityMatrixModel,
  PoolCompatibilityMatrixParamsDto,
  PoolCompatibilityMatrixCreateDto,
  PoolCompatibilityMatrixUpdateDto,
  PoolCompatibilityMatrixBatchCreateDto,
  PoolCompatibilityMatrixBatchResponse,
  ProductTypeOption,
  WorkOptionModel,
  PoolCompatibilityMatrixResponse
} from '../models/pool-compatibility-matrix.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

/**
 * Service for managing Pool Compatibility Matrix data
 * Handles CRUD operations, batch create, and filter/search functionality
 */
@Injectable({
  providedIn: 'root'
})
export class PoolCompatibilityMatrixService {
  private readonly apiService = inject(ApiService);

  /**
   * Fetches Pool Compatibility Matrix table data with pagination, search, and filters
   * @param take Number of records to fetch
   * @param skip Number of records to skip (for pagination)
   * @param params Search, filter, and sort parameters
   * @returns Observable with data array and total record count
   */
  getPoolCompatibilityMatrix(
    take: number,
    skip: number,
    params: PoolCompatibilityMatrixParamsDto
  ): Observable<{ data: PoolCompatibilityMatrixModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX(take, skip);

    return this.apiService.post<PoolCompatibilityMatrixResponse>(endpoint, params).pipe(
      map(response => {
        const data = response.item?.data || [];
        let totalCount = response.item?.totalCount || 0;

        // If totalCount is 0 but we have data, estimate the total
        if (totalCount === 0 && data.length > 0) {
          // If we got a full page of results, assume there might be more
          if (data.length === take) {
            // Set total to current skip + current data + another page worth
            // This allows pagination to show next page button
            totalCount = skip + data.length + take;
          } else {
            // Partial page means this is the last page
            totalCount = skip + data.length;
          }
        }

        return {
          data: data,
          totalRecords: totalCount
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches list of active inventory product types for add/edit dropdowns
   * @returns Observable with array of product type options
   */
  getInventoryProductTypes(): Observable<ProductTypeOption[]> {
    return this.apiService.get<ProductTypeOption[]>(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_INVENTORY_TYPES
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches list of active finished product types for add/edit dropdowns
   * @returns Observable with array of product type options
   */
  getFinishedProductTypes(): Observable<ProductTypeOption[]> {
    return this.apiService.get<ProductTypeOption[]>(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_FINISHED_TYPES
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches list of inventory product types for filter dropdowns
   * @returns Observable with array of product type options
   */
  getFilterInventoryProductTypes(): Observable<ProductTypeOption[]> {
    return this.apiService.get<ProductTypeOption[]>(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_FILTER_INVENTORY_TYPES
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches list of finished product types for filter dropdowns
   * @returns Observable with array of product type options
   */
  getFilterFinishedProductTypes(): Observable<ProductTypeOption[]> {
    return this.apiService.get<ProductTypeOption[]>(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_FILTER_FINISHED_TYPES
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches list of active work options for dropdowns
   * @returns Observable with array of work option models
   */
  getWorkOptions(): Observable<WorkOptionModel[]> {
    return this.apiService.get<WorkOptionModel[]>(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_WORK_OPTIONS
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new Pool Compatibility Matrix record
   * @param payload The pool compatibility data to create
   * @returns Observable with creation result
   */
  createPoolCompatibilityMatrix(payload: PoolCompatibilityMatrixCreateDto): Observable<any> {
    return this.apiService.post(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_CREATE,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing Pool Compatibility Matrix record
   * @param payload The updated pool compatibility data
   * @returns Observable with update result
   */
  updatePoolCompatibilityMatrix(payload: PoolCompatibilityMatrixUpdateDto): Observable<any> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_UPDATE,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates multiple Pool Compatibility Matrix records at once
   * @param payload Batch create request with array of records
   * @returns Observable with batch creation result
   */
  batchCreatePoolCompatibilityMatrix(
    payload: PoolCompatibilityMatrixBatchCreateDto
  ): Observable<PoolCompatibilityMatrixBatchResponse> {
    return this.apiService.post<PoolCompatibilityMatrixBatchResponse>(
      API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_BATCH,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
