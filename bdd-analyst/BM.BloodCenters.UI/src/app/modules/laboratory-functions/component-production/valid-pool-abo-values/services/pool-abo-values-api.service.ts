import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidAboPooledSldDto,
  CreateValidAboPooledSldDto,
  UpdateValidAboPooledSldDto,
  PoolSldLookupDto,
  ApiResponseWrapper,
  SearchValidAboPooledSldRequest
} from '../models/pool-abo-values.model';

@Injectable({
  providedIn: 'root',
})
export class PoolAboValuesApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all Valid ABO Pooled SLD records with optional sort direction
   * GET /api/v1/valid-abo-pooled-sld?sortDir={ASC|DESC}
   * @param sortDir Sort direction: "ASC" or "DESC" (defaults to "ASC")
   * @returns Observable with array of Valid ABO Pooled SLD records
   */
  getValidAboPooledSldList(
    sortDir: 'ASC' | 'DESC' = 'ASC'
  ): Observable<ValidAboPooledSldDto[]> {
    return this.apiService
      .get<ApiResponseWrapper<ValidAboPooledSldDto[]>>(
        API.VALID_POOL_ABO_VALUES.LIST(sortDir)
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getValidAboPooledSldList failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search Valid ABO Pooled SLD records with pagination and filters
   * POST /api/v1/valid-abo-pooled-sld/{take}/{skip}
   * @param take Number of records to return (page size)
   * @param skip Number of records to skip (offset)
   * @param searchRequest Filter criteria (all optional)
   * @returns Observable with paginated array and total count
   */
  searchValidAboPooledSld(
    take: number,
    skip: number,
    searchRequest: SearchValidAboPooledSldRequest
  ): Observable<ApiResponseWrapper<ValidAboPooledSldDto[]>> {
    return this.apiService
      .post<ApiResponseWrapper<ValidAboPooledSldDto[]>>(
        API.VALID_POOL_ABO_VALUES.SEARCH(take, skip),
        searchRequest
      )
      .pipe(
        catchError((error) => {
          console.error('searchValidAboPooledSld failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new Valid ABO Pooled SLD record
   * POST /api/v1/valid-abo-pooled-sld
   * @param dto Create request payload
   * @returns Observable with created record
   */
  createValidAboPooledSld(
    dto: CreateValidAboPooledSldDto
  ): Observable<ApiResponseWrapper<ValidAboPooledSldDto>> {
    return this.apiService
      .post<ApiResponseWrapper<ValidAboPooledSldDto>>(
        API.VALID_POOL_ABO_VALUES.CREATE,
        dto
      )
      .pipe(
        catchError((error) => {
          console.error('createValidAboPooledSld failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing Valid ABO Pooled SLD record by auditKey
   * PUT /api/v1/valid-abo-pooled-sld/{auditKey}
   * @param auditKey Unique identifier of the record
   * @param dto Update request payload (includes poolSld and poolSldDesc)
   * @returns Observable with updated record
   */
  updateValidAboPooledSld(
    auditKey: string,
    dto: UpdateValidAboPooledSldDto
  ): Observable<ApiResponseWrapper<ValidAboPooledSldDto>> {
    return this.apiService
      .put<ApiResponseWrapper<ValidAboPooledSldDto>>(
        API.VALID_POOL_ABO_VALUES.UPDATE(auditKey),
        dto
      )
      .pipe(
        catchError((error) => {
          console.error('updateValidAboPooledSld failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get Pool SLD lookup values for dropdown selection
   * GET /api/v1/valid-abo-pooled-sld/pool-sld-lookup
   * @returns Observable with array of Pool SLD lookup values
   */
  getPoolSldLookup(): Observable<PoolSldLookupDto[]> {
    return this.apiService
      .get<ApiResponseWrapper<PoolSldLookupDto[]>>(
        API.VALID_POOL_ABO_VALUES.POOL_SLD_LOOKUP
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getPoolSldLookup failed:', error);
          return throwError(() => error);
        })
      );
  }
}
