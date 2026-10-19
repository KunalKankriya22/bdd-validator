import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import {
  ProfileTest,
  ApiResponse,
  CreateProfileTestDto,
  UpdateProfileTestDto
} from '../models/regional-testing-contract.models';

/**
 * Regional Testing Contract Profile Service
 * Handles all API operations for contract profile tests
 *
 * Base URL: /api/v1/regional-testing-contract-profiles
 * API Documentation: MLT-12617-api-documentation.md
 *
 * TODO: Verify API endpoints when backend implementation is complete
 */
@Injectable({
  providedIn: 'root'
})
export class RegionalTestingContractProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/regional-testing-contract-profiles`;

  /**
   * Get All Profile Tests for a Contract
   * POST /regional-testing-contract-profiles/{take}/{skip}
   *
   * @param take Number of records to return
   * @param skip Number of records to skip
   * @param contractId Optional contract ID filter
   * @returns Observable of profile tests
   */
  getProfileTests(
    take: number,
    skip: number,
    contractId?: string
  ): Observable<ApiResponse<ProfileTest[]>> {
    const body = {
      contractId: contractId || null
    };

    return this.http.post<ApiResponse<ProfileTest[]>>(
      `${this.baseUrl}/${take}/${skip}`,
      body
    );
  }

  /**
   * Get Profile Test By ID
   * GET /regional-testing-contract-profiles/{contractId}/{profileSetId}
   *
   * @param contractId Contract identifier
   * @param profileSetId Profile set identifier
   * @returns Observable of single profile test
   */
  getProfileTestById(contractId: string, profileSetId: string): Observable<ProfileTest> {
    return this.http.get<ApiResponse<ProfileTest[]>>(
      `${this.baseUrl}/${encodeURIComponent(contractId)}/${encodeURIComponent(profileSetId)}`
    ).pipe(
      map(response => response.data?.[0]!)
    );
  }

  /**
   * Create Profile Test
   * POST /regional-testing-contract-profiles
   *
   * @param dto Create request DTO
   * @returns Observable of creation response
   */
  createProfileTest(dto: CreateProfileTestDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.baseUrl, dto);
  }

  /**
   * Update Profile Test
   * PUT /regional-testing-contract-profiles/{contractId}/{profileSetId}
   *
   * @param contractId Contract identifier
   * @param profileSetId Profile set identifier
   * @param dto Update request DTO
   * @returns Observable of update response
   */
  updateProfileTest(
    contractId: string,
    profileSetId: string,
    dto: UpdateProfileTestDto
  ): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/${encodeURIComponent(contractId)}/${encodeURIComponent(profileSetId)}`,
      dto
    );
  }

  /**
   * Delete Profile Test
   * DELETE /regional-testing-contract-profiles/{contractId}/{profileSetId}
   *
   * @param contractId Contract identifier
   * @param profileSetId Profile set identifier
   * @returns Observable of deletion success
   */
  deleteProfileTest(contractId: string, profileSetId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean[]>>(
      `${this.baseUrl}/${encodeURIComponent(contractId)}/${encodeURIComponent(profileSetId)}`
    ).pipe(
      map(response => response.data?.[0] || false)
    );
  }

  /**
   * Get Profile Types Lookup
   * Returns static list of profile types
   *
   * @returns Array of profile type options
   */
  getProfileTypes(): { code: string; description: string }[] {
    return [
      { code: 'P', description: 'Primary' },
      { code: 'A', description: 'Ad Hoc' },
      { code: 'S', description: 'Secondary' }
    ];
  }

  /**
   * Get Yes/No Options for dropdowns
   *
   * @returns Array of Yes/No options
   */
  getYesNoOptions(): { code: string; description: string }[] {
    return [
      { code: 'Y', description: 'Yes' },
      { code: 'N', description: 'No' }
    ];
  }
}
