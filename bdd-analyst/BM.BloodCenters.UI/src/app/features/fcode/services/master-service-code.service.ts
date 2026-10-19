import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MasterServiceCodeDto,
  CreateMasterServiceCodeDto,
  UpdateMasterServiceCodeDto,
  MasterServiceCodeQueryDto,
  ApiResponse
} from '../models/master-service-code.model';

/**
 * Service for managing Master Service Codes (SFIBILL)
 * Implements all endpoints from master-service-codes-api-documentation.md
 */
@Injectable({
  providedIn: 'root'
})
export class MasterServiceCodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/master-service-codes`;

  /**
   * Get all master service codes with optional filtering, searching, and sorting
   * POST /master-service-codes/{take}/{skip}
   *
   * @param take - Number of records to return (recommended: 10-50)
   * @param skip - Number of records to skip for pagination
   * @param queryDto - Optional query parameters for filtering/searching/sorting
   * @returns Observable of API response with array of MasterServiceCodeDto
   */
  getAll(
    take: number,
    skip: number,
    queryDto?: MasterServiceCodeQueryDto
  ): Observable<ApiResponse<MasterServiceCodeDto[]>> {
    const url = `${this.baseUrl}/${take}/${skip}`;
    const body = queryDto || {};
    return this.http.post<ApiResponse<MasterServiceCodeDto[]>>(url, body);
  }

  /**
   * Get a single master service code by billing code
   * GET /master-service-codes/{billingCode}
   *
   * @param billingCode - Unique billing code identifier (case-insensitive)
   * @returns Observable of API response with single MasterServiceCodeDto in array
   */
  getByCode(billingCode: string): Observable<ApiResponse<MasterServiceCodeDto[]>> {
    const url = `${this.baseUrl}/${encodeURIComponent(billingCode)}`;
    return this.http.get<ApiResponse<MasterServiceCodeDto[]>>(url);
  }

  /**
   * Create a new master service code
   * POST /master-service-codes
   *
   * @param dto - CreateMasterServiceCodeDto with required fields
   * @returns Observable of API response (data not included in response)
   */
  create(dto: CreateMasterServiceCodeDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.baseUrl, dto);
  }

  /**
   * Update an existing master service code
   * PUT /master-service-codes/{billingCode}
   *
   * @param billingCode - Billing code to update (case-insensitive)
   * @param dto - UpdateMasterServiceCodeDto with fields to update
   * @returns Observable of API response (data not included in response)
   */
  update(
    billingCode: string,
    dto: UpdateMasterServiceCodeDto
  ): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}/${encodeURIComponent(billingCode)}`;
    return this.http.put<ApiResponse<void>>(url, dto);
  }

  /**
   * Soft delete a master service code by setting TERM_DATE to current chapter local date
   * DELETE /master-service-codes/{billingCode}
   *
   * @param billingCode - Billing code to delete (case-insensitive)
   * @returns Observable of API response with boolean in data array
   */
  delete(billingCode: string): Observable<ApiResponse<boolean[]>> {
    const url = `${this.baseUrl}/${encodeURIComponent(billingCode)}`;
    return this.http.delete<ApiResponse<boolean[]>>(url);
  }
}
