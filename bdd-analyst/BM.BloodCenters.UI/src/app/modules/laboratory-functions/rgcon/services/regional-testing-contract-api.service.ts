import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  RegionalTestingContractDto,
  CreateRegionalTestingContractDto,
  UpdateRegionalTestingContractDto,
  RegionalTestingContractQueryDto,
  ApiResponse
} from '../models/regional-testing-contract.model';

@Injectable({
  providedIn: 'root'
})
export class RegionalTestingContractApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.BASE}`;

  /**
   * Get all contracts with filtering, searching, and pagination
   * POST /api/v1/regional-testing-contract/{take}/{skip}
   */
  getAllContracts(
    query: RegionalTestingContractQueryDto,
    take: number,
    skip: number
  ): Observable<{ data: RegionalTestingContractDto[]; total: number }> {
    const url = `${this.baseUrl}/${take}/${skip}`;

    return this.http.post<ApiResponse<RegionalTestingContractDto>>(url, query).pipe(
      map(response => ({
        data: response.data || [],
        total: response.totalCount || 0
      })),
      catchError(error => {
        console.error('Failed to load regional testing contracts:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single contract by ID
   * GET /api/v1/regional-testing-contract/{contractId}
   */
  getContractById(contractId: string): Observable<RegionalTestingContractDto | null> {
    const url = `${this.baseUrl}/${contractId}`;

    return this.http.get<ApiResponse<RegionalTestingContractDto>>(url).pipe(
      map(response => response.data?.[0] || null),
      catchError(error => {
        console.error(`Failed to load contract ${contractId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new regional testing contract
   * POST /api/v1/regional-testing-contract
   */
  createContract(dto: CreateRegionalTestingContractDto): Observable<{ contractId: string }> {
    return this.http.post<ApiResponse<{ contractId: string }>>(this.baseUrl, dto).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error('No contract ID returned from server');
      }),
      catchError(error => {
        console.error('Failed to create contract:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing regional testing contract
   * PUT /api/v1/regional-testing-contract/{contractId}
   */
  updateContract(
    contractId: string,
    dto: UpdateRegionalTestingContractDto
  ): Observable<void> {
    const url = `${this.baseUrl}/${contractId}`;

    return this.http.put<ApiResponse<void>>(url, dto).pipe(
      map(() => void 0),
      catchError(error => {
        console.error(`Failed to update contract ${contractId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Soft delete a contract by setting TERM_DATE to current date
   * DELETE /api/v1/regional-testing-contract/{contractId}
   */
  deleteContract(contractId: string): Observable<boolean> {
    const url = `${this.baseUrl}/${contractId}`;

    return this.http.delete<ApiResponse<boolean>>(url).pipe(
      map(response => response.data?.[0] || false),
      catchError(error => {
        console.error(`Failed to delete contract ${contractId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
