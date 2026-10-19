import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  CryoModifyDetailsDto,
  UpdateCryoDetailsRequestDto,
  ThawMethodDto,
  CentrifugeDto,
  CatalogNumberDto,
  ApiResponse
} from '../models/modify-cryo-details.model';

/**
 * Modify CRYO Details Service
 *
 * Maps to CryoModifyDetailsController backend endpoints
 * Base route: /api/v1/cryo-modify-details
 */
@Injectable({
  providedIn: 'root'
})
export class ModifyCryoDetailsService {
  private readonly apiService = inject(ApiService);

  /**
   * GET /api/v1/cryo-modify-details/{unitId}
   * Gets CRYO record and all related data for a unit
   * Maps to: UNIT_ID VALIDATE_FIELD trigger from CPIMCRYO form
   */
  getCryoRecord(unitId: string): Observable<CryoModifyDetailsDto> {
    return this.apiService
      .get<ApiResponse<CryoModifyDetailsDto[]>>(`/api/v1/cryo-modify-details/${unitId}`)
      .pipe(
        map((response) => {
          // Backend returns array with single object
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            return data[0];
          }
          throw new Error('No CRYO record found');
        })
      );
  }

  /**
   * PUT /api/v1/cryo-modify-details/{unitId}
   * Updates CRYO details for a unit (multi-table transaction)
   * Maps to: KEY-COMMIT + PRE_COMMIT_DATA from CPIMCRYO form
   * Evaluates 4 interdiction rules: CRTE, CRWS, CRSE, CRYO
   * Updates: cryo_units, units, components, component_cgmp, component_interdictions
   */
  updateCryoRecord(
    unitId: string,
    dto: UpdateCryoDetailsRequestDto
  ): Observable<string> {
    return this.apiService
      .put<ApiResponse<void>>(`/api/v1/cryo-modify-details/${unitId}`, dto)
      .pipe(map((response) => response.message || 'CRYO details updated successfully'));
  }

  /**
   * GET /api/v1/cryo-modify-details/thaw-methods
   * Gets valid thaw methods for the chapter (LOV)
   * Maps to: CTRL_BLK_1_THAW_METHOD_LOV0 record group from CPIMCRYO form
   */
  getThawMethods(): Observable<ThawMethodDto[]> {
    return this.apiService
      .get<ApiResponse<any>>('/api/v1/cryo-modify-details/thaw-methods')
      .pipe(
        map((response) => {
          const data = response.data;
          // Handle both array and nested array formats
          if (Array.isArray(data)) {
            if (data.length > 0 && Array.isArray(data[0])) {
              return data[0] as ThawMethodDto[];
            }
            return data as ThawMethodDto[];
          }
          return [];
        })
      );
  }

  /**
   * GET /api/v1/cryo-modify-details/centrifuges
   * Gets valid centrifuges for the chapter (LOV)
   * Maps to: CTRL_BLK_1_CENTRIFUGE__LOV1 record group from CPIMCRYO form
   */
  getCentrifuges(): Observable<CentrifugeDto[]> {
    return this.apiService
      .get<ApiResponse<any>>('/api/v1/cryo-modify-details/centrifuges')
      .pipe(
        map((response) => {
          const data = response.data;
          // Handle both array and nested array formats
          if (Array.isArray(data)) {
            if (data.length > 0 && Array.isArray(data[0])) {
              return data[0] as CentrifugeDto[];
            }
            return data as CentrifugeDto[];
          }
          return [];
        })
      );
  }

  /**
   * GET /api/v1/cryo-modify-details/catalog-numbers?unitId={unitId}
   * Gets valid catalog numbers for a unit (LOV)
   * Maps to: CTRL_BLK_1_CATALOG_NO_LOV1 record group from CPIMCRYO form
   * Filtered by unit's base catalog and CRYO product type
   */
  getCatalogNumbers(unitId: string): Observable<CatalogNumberDto[]> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService
      .get<ApiResponse<CatalogNumberDto[][]>>('/api/v1/cryo-modify-details/catalog-numbers', { params })
      .pipe(
        map((response) => {
          // Backend returns nested array [[{...}]]
          const data = response.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0];
          }
          return [];
        })
      );
  }
}
