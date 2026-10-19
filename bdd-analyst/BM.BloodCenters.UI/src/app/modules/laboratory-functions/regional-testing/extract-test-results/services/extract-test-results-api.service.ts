import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ContractsApiResponse,
  BatchesApiResponse,
  UnitsApiResponse,
  CreateExtractionApiResponse,
  ContractDto,
  BatchDto,
  UnitDto,
  ExtractionQueryDto,
  UnitQueryDto,
  CreateExtractionRequestDto,
  ExtractionResponseDto
} from '../models/extract-test-results.model';

@Injectable({
  providedIn: 'root'
})
export class ExtractTestResultsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/extract-test-results`;

  /**
   * Get Active Contracts
   * Endpoint: GET /extract-test-results/contracts
   * ChapterId is resolved server-side from user context
   */
  getActiveContracts(): Observable<ContractDto[]> {
    return this.http
      .get<ContractsApiResponse>(`${this.baseUrl}/contracts`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get Batches Ready for Extraction
   * Endpoint: POST /extract-test-results/batches/{take}/{skip}
   */
  getBatches(
    take: number,
    skip: number,
    query: ExtractionQueryDto
  ): Observable<{ data: BatchDto[]; total: number }> {
    return this.http
      .post<BatchesApiResponse>(`${this.baseUrl}/batches/${take}/${skip}`, query)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        }))
      );
  }

  /**
   * Get Units for Selected Batches
   * Endpoint: POST /extract-test-results/units/{take}/{skip}
   */
  getUnits(
    take: number,
    skip: number,
    query: UnitQueryDto
  ): Observable<{ data: UnitDto[]; total: number }> {
    return this.http
      .post<UnitsApiResponse>(`${this.baseUrl}/units/${take}/${skip}`, query)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        }))
      );
  }

  /**
   * Create Extraction
   * Endpoint: POST /extract-test-results
   */
  createExtraction(
    request: CreateExtractionRequestDto
  ): Observable<ExtractionResponseDto & { message: string }> {
    return this.http
      .post<CreateExtractionApiResponse>(this.baseUrl, request)
      .pipe(map(response => ({ ...response.data[0], message: response.message })));
  }
}
