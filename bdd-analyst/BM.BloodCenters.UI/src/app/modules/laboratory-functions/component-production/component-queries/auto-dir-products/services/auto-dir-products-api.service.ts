import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  AutoDirProductsSearchRequestDto,
  AutoDirProductsUnitDto,
  AutoDirProductsSearchResponse,
  ApiResponse,
  HospitalLookupDto,
  PatientLookupDto
} from '../models/auto-dir-products.model';

/**
 * API Service for Auto/Dir Products Query
 * Handles communication with /api/auto-dir-products endpoints
 */
@Injectable({
  providedIn: 'root',
})
export class AutoDirProductsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Search for Auto/Dir products with complex filter criteria and pagination
   * POST /api/auto-dir-products/search/{take}/{skip}
   *
   * @param request Search request DTO with filter criteria
   * @returns Observable with search results and total count
   *
   * Business Rules:
   * - At least one search criterion is required
   * - toDate must be >= fromDate
   * - surgeryDate must be >= needByDate
   * - sort must be 'A' (Ascending) or 'D' (Descending)
   */
  searchProducts(
    request: AutoDirProductsSearchRequestDto
  ): Observable<AutoDirProductsSearchResponse> {
    const take = request.take || 50;
    const skip = request.skip || 0;
    const url = API.AUTO_DIR_PRODUCTS.SEARCH(take, skip);

    // Build request body (exclude take/skip as they're in URL)
    const body = {
      unitId: request.unitId,
      fromDate: request.fromDate,
      toDate: request.toDate,
      needByDate: request.needByDate,
      surgeryDate: request.surgeryDate,
      hospitalId: request.hospitalId,
      patientId: request.patientId,
      sort: request.orderBy === 'COLL' ? 'D' : 'A' // Convert orderBy to sort
    };

    return this.apiService
      .post<ApiResponse<AutoDirProductsUnitDto[]>>(url, body)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const total = response?.total ?? data.length;
          return { data, total };
        }),
        catchError((error) => {
          console.error('Error searching Auto/Dir products:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get detailed information for a specific unit from Auto/Dir donations
   * GET /api/auto-dir-products/{unitId}
   *
   * @param unitId Unit ID to retrieve
   * @returns Observable with unit details
   *
   * Possible Errors:
   * - 400: Empty unitId
   * - 404: Unit not found or is not an Auto/Directed donation
   */
  getByUnitId(unitId: string): Observable<AutoDirProductsUnitDto> {
    const url = API.AUTO_DIR_PRODUCTS.GET_BY_ID(unitId);

    return this.apiService
      .get<ApiResponse<AutoDirProductsUnitDto>>(url)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error retrieving unit ${unitId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of hospitals for dropdown
   * GET /api/auto-dir-products/hospitals
   *
   * @returns Observable with array of hospital lookup items
   */
  getHospitals(): Observable<HospitalLookupDto[]> {
    const url = API.AUTO_DIR_PRODUCTS.HOSPITALS;

    return this.apiService
      .get<ApiResponse<HospitalLookupDto[]>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error retrieving hospitals:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of patients for dropdown
   * GET /api/auto-dir-products/patients
   *
   * @returns Observable with array of patient lookup items
   */
  getPatients(): Observable<PatientLookupDto[]> {
    const url = API.AUTO_DIR_PRODUCTS.PATIENTS;

    return this.apiService
      .get<ApiResponse<PatientLookupDto[]>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error retrieving patients:', error);
          return throwError(() => error);
        })
      );
  }
}
