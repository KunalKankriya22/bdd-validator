import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

import {
  PoolHeader,
  PoolUnit,
  ValidProduct,
  UnitProduct,
  ValidAbo,
  ValidLot,
  ValidCatalog,
  PoolSearchRequest,
  PoolSearchResponse,
  CreatePoolRequest,
  UpdatePoolRequest,
  ApiResponse,
  CommitPoolRequest,
  CommitPoolResponse,
  CommitPoolUnit,
  UnitValidationResponse,
  AttributeLookup,
  WeightInfo,
  ExpiryCalculationResponse,
} from '../models/prepare-pooled-components.model';

@Injectable({ providedIn: 'root' })
export class PreparePooledComponentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.PREPARE_POOLED_COMPONENTS.BASE}`;

  /**
   * Search pools (paginated)
   */
  searchPools(
    take: number,
    skip: number,
    request: PoolSearchRequest
  ): Observable<PoolSearchResponse> {
    return this.http
      .post<ApiResponse<PoolHeader[]>>(`${this.baseUrl}/${take}/${skip}`, request)
      .pipe(
        map((res) => ({
          items: res.data || [],
          totalRecords: res.total || 0,
        }))
      );
  }

  /**
   * Get pool by ID — returns full response including weightRequired and specificGravity
   */
  getPoolById(poolId: string): Observable<ApiResponse<PoolHeader>> {
    return this.http
      .get<ApiResponse<PoolHeader>>(`${this.baseUrl}/${encodeURIComponent(poolId)}`);
  }

  /**
   * Create pool
   */
  createPool(request: CreatePoolRequest): Observable<PoolHeader> {
    return this.http
      .post<ApiResponse<PoolHeader>>(this.baseUrl, request)
      .pipe(map((res) => res.data!));
  }

  /**
   * Update pool
   */
  updatePool(poolId: string, request: UpdatePoolRequest): Observable<PoolHeader> {
    return this.http
      .put<ApiResponse<PoolHeader>>(`${this.baseUrl}/${encodeURIComponent(poolId)}`, request)
      .pipe(map((res) => res.data!));
  }

  /**
   * Delete pool
   */
  deletePool(poolId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${encodeURIComponent(poolId)}`)
      .pipe(map(() => undefined));
  }

  /**
   * Get units in pool
   */
  getUnitsInPool(poolId: string): Observable<PoolUnit[]> {
    return this.http
      .get<ApiResponse<PoolUnit[]>>(`${this.baseUrl}/${encodeURIComponent(poolId)}/units`)
      .pipe(map((res) => res.data || []));
  }

  /**
   * Get valid products LOV
   */
  getValidProducts(): Observable<ValidProduct[]> {
    return this.http
      .get<ApiResponse<ValidProduct[]>>(`${this.baseUrl}/valid-products`, {
        params: { codeScheme: 'I' }
      })
      .pipe(map((res) => res.data || []));
  }

  /**
   * Get valid ABO LOV
   */
  getValidAbo(): Observable<ValidAbo[]> {
    return this.http
      .get<ApiResponse<ValidAbo[]>>(`${this.baseUrl}/valid-abo`)
      .pipe(map((res) => res.data || []));
  }

  /**
   * Get valid lots LOV filtered by catalog number and chapter
   */
  getValidLots(catalogNumber: string): Observable<ValidLot[]> {
    return this.http
      .get<ApiResponse<ValidLot[]>>(`${this.baseUrl}/valid-lots`, {
        params: { catalogNumber }
      })
      .pipe(map((res) => res.data || []));
  }

  /**
   * Get valid catalogs LOV filtered by chapter and CMC program
   */
  getValidCatalogs(): Observable<ValidCatalog[]> {
    return this.http
      .get<ApiResponse<ValidCatalog[]>>(`${this.baseUrl}/valid-catalogs`)
      .pipe(map((res) => res.data || []));
  }

  getValidProductsForUnit(unitId: string): Observable<UnitProduct[]> {
    return this.http
      .get<ApiResponse<UnitProduct[]>>(`${this.baseUrl}/valid-unit-products`, {
        params: { unitId }
      })
      .pipe(map((res) => res.data || []));
  }

  commitPool(poolId: string, request: CommitPoolRequest): Observable<CommitPoolResponse> {
    return this.http
      .post<ApiResponse<CommitPoolResponse>>(`${this.baseUrl}/${encodeURIComponent(poolId)}/commit`, request)
      .pipe(map((res) => res.data!));
  }

  validateUnit(poolId: string, unit: CommitPoolUnit): Observable<UnitValidationResponse> {
    return this.http
      .post<ApiResponse<UnitValidationResponse>>(`${this.baseUrl}/${encodeURIComponent(poolId)}/verify-pool-unit`, unit)
      .pipe(map((res) => res.data!));
  }

  removeUnitFromPool(poolId: string, unit: CommitPoolUnit): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/${encodeURIComponent(poolId)}/remove-unit`, unit)
      .pipe(map(() => undefined));
  }

  getAttribGroups(productCode: string): Observable<AttributeLookup[]> {
    return this.http
      .get<ApiResponse<AttributeLookup[]>>(`${this.baseUrl}/attrib-groups`, {
        params: { productCode }
      })
      .pipe(map((res) => res.data || []));
  }

  getAttribCodes(productCode: string, attribGroup: string): Observable<AttributeLookup[]> {
    return this.http
      .get<ApiResponse<AttributeLookup[]>>(`${this.baseUrl}/attrib-codes`, {
        params: { productCode, attribGroup }
      })
      .pipe(map((res) => res.data || []));
  }

  calculateExpiry(productCode: string, poolDate: string): Observable<ExpiryCalculationResponse> {
    return this.http
      .get<ApiResponse<ExpiryCalculationResponse>>(`${this.baseUrl}/calculate-expiry`, {
        params: { productCode, poolDate, codeScheme: 'I' }
      })
      .pipe(map((res) => res.data ?? {}));
  }

  getWeightInfo(productCode: string): Observable<WeightInfo> {
    return this.http
      .get<ApiResponse<WeightInfo>>(`${this.baseUrl}/weight-info`, {
        params: { productCode }
      })
      .pipe(map((res) => res.data ?? { weightRequired: 'N', specificGravity: null, freezeTimeRequired: 'N' }));
  }
}
