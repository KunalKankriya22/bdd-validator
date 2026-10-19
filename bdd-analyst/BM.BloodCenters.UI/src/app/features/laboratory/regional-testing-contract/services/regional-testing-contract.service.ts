import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import {
  RegionalTestingContract,
  ApiResponse,
  CreateRegionalTestingContractDto,
  UpdateRegionalTestingContractDto,
  RegionalTestingContractQueryDto
} from '../models/regional-testing-contract.models';

/**
 * Regional Testing Contract Service
 * Handles all API operations for regional testing contracts
 *
 * Base URL: /api/v1/regional-testing-contract
 * API Documentation: rgicntct-api-documentation.md
 */
@Injectable({
  providedIn: 'root'
})
export class RegionalTestingContractService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/regional-testing-contract`;

  /**
   * Get All / Filter Contracts
   * POST /regional-testing-contract/{take}/{skip}
   *
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @param query Optional filter criteria
   * @returns Observable of contracts with total count
   */
  getContracts(
    take: number,
    skip: number,
    query?: RegionalTestingContractQueryDto
  ): Observable<ApiResponse<RegionalTestingContract[]>> {
    const body: RegionalTestingContractQueryDto = {
      contractType: query?.contractType || null,
      searchKeyword: query?.searchKeyword || null,
      showTerminated: query?.showTerminated || false,
      sortColumn: query?.sortColumn || 'EffDate',
      sortOrder: query?.sortOrder || 'DESC'
    };

    return this.http.post<ApiResponse<RegionalTestingContract[]>>(
      `${this.baseUrl}/${take}/${skip}`,
      body
    );
  }

  /**
   * Get Contract By ID
   * GET /regional-testing-contract/{contractId}
   *
   * @param contractId Unique identifier of the contract
   * @returns Observable of single contract
   */
  getContractById(contractId: string): Observable<RegionalTestingContract> {
    return this.http.get<ApiResponse<RegionalTestingContract[]>>(
      `${this.baseUrl}/${encodeURIComponent(contractId)}`
    ).pipe(
      map(response => response.data?.[0]!)
    );
  }

  /**
   * Create Contract
   * POST /regional-testing-contract
   *
   * @param dto Create request DTO
   * @returns Observable with created contract ID
   */
  createContract(dto: CreateRegionalTestingContractDto): Observable<{ contractId: string }> {
    return this.http.post<ApiResponse<{ contractId: string }[]>>(
      this.baseUrl,
      dto
    ).pipe(
      map(response => response.data?.[0]!)
    );
  }

  /**
   * Update Contract
   * PUT /regional-testing-contract/{contractId}
   *
   * @param contractId Unique identifier of the contract to update
   * @param dto Update request DTO
   * @returns Observable of update response
   */
  updateContract(
    contractId: string,
    dto: UpdateRegionalTestingContractDto
  ): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/${encodeURIComponent(contractId)}`,
      dto
    );
  }

  /**
   * Delete Contract (Soft Delete)
   * DELETE /regional-testing-contract/{contractId}
   *
   * Sets TERM_DATE to current date instead of physical deletion
   *
   * @param contractId Unique identifier of the contract to delete
   * @returns Observable of deletion success
   */
  deleteContract(contractId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean[]>>(
      `${this.baseUrl}/${encodeURIComponent(contractId)}`
    ).pipe(
      map(response => response.data?.[0] || false)
    );
  }

  /**
   * Get Contract Types Lookup
   * Returns static list of contract types
   *
   * @returns Array of contract type options
   */
  getContractTypes(): { code: string; description: string }[] {
    return [
      { code: 'R', description: 'Regional' },
      { code: 'T', description: 'Testing' },
      { code: 'S', description: 'Supplier' }
    ];
  }

  /**
   * Validate Contract Type
   *
   * @param contractType Contract type code
   * @returns True if valid (R, T, or S)
   */
  isValidContractType(contractType: string): boolean {
    return ['R', 'T', 'S'].includes(contractType?.toUpperCase());
  }
}
