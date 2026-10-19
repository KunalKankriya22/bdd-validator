import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import {
  ExtractIdDropdownDto,
  ContractDropdownDto,
  ConfirmatoryExtractUnitDto,
  ScheduleExtractionRequestDto,
  ExecuteExtractionRequestDto,
  ExtractionResultDto,
  ApiResponse
} from '../models/confirmatory-extraction.model';

/**
 * API Service for Confirmatory Extraction
 * Implements endpoints from confirmatory-extraction-api-documentation.md
 * JIRA: MLT-14234
 *
 * Base URL: /api/confirmatory-extraction
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmatoryExtractionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/confirmatory-extraction`;

  /**
   * Get Extract IDs from last 14 days for dropdown
   * GET /confirmatory-extraction/extract-ids
   */
  getExtractIds(): Observable<ExtractIdDropdownDto[]> {
    return this.http.get<ApiResponse<ExtractIdDropdownDto[]>>(`${this.baseUrl}/extract-ids`)
      .pipe(map(response => response.data));
  }

  /**
   * Get Contracts for a specific Extract ID
   * GET /confirmatory-extraction/contracts/{extractId}
   *
   * @param extractId Extract ID to filter contracts
   */
  getContracts(extractId: string): Observable<ContractDropdownDto[]> {
    return this.http.get<ApiResponse<ContractDropdownDto[]>>(`${this.baseUrl}/contracts/${encodeURIComponent(extractId)}`)
      .pipe(map(response => response.data));
  }

  /**
   * Get Units for extraction
   * GET /confirmatory-extraction/units?extractId=X&contractId=Y
   *
   * @param extractId Extract ID (required)
   * @param contractId Contract ID (optional)
   */
  getUnits(
    extractId: string,
    contractId?: string,
    qcDateFrom?: string | null,
    qcDateTo?: string | null,
    receivedDateFrom?: string | null,
    receivedDateTo?: string | null
  ): Observable<ConfirmatoryExtractUnitDto[]> {
    let params = new HttpParams().set('extractId', extractId);
    if (contractId) params = params.set('contractId', contractId);
    if (qcDateFrom) params = params.set('qcDateFrom', qcDateFrom);
    if (qcDateTo) params = params.set('qcDateTo', qcDateTo);
    if (receivedDateFrom) params = params.set('receivedDateFrom', receivedDateFrom);
    if (receivedDateTo) params = params.set('receivedDateTo', receivedDateTo);

    return this.http.get<ApiResponse<ConfirmatoryExtractUnitDto[]>>(`${this.baseUrl}/units`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Schedule Extraction for future execution
   * POST /confirmatory-extraction/schedule-extraction
   *
   * @param request Schedule extraction request with afterTime in chapter-local timezone
   */
  scheduleExtraction(request: ScheduleExtractionRequestDto): Observable<ExtractionResultDto> {
    return this.http.post<ApiResponse<ExtractionResultDto>>(`${this.baseUrl}/schedule-extraction`, request)
      .pipe(map(response => response.data));
  }

  /**
   * Execute Immediate Extraction
   * POST /confirmatory-extraction/execute-extraction
   *
   * @param request Execute extraction request
   */
  executeExtraction(request: ExecuteExtractionRequestDto): Observable<ExtractionResultDto> {
    return this.http.post<ApiResponse<ExtractionResultDto>>(`${this.baseUrl}/execute-extraction`, request)
      .pipe(map(response => response.data));
  }
}
