import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import { ApiService } from '@shared/services/api.service';
import {
  ApiResponse,
  BatchDetailRequest,
  BatchDetailResponse,
  ContractOption,
  ResultsExtractData,
  ResultsExtractQueryRequest,
  ValidContract
} from '../models/results-extract-query.model';

/**
 * API Service for Results Extract Query
 * Handles contract autocomplete and results query operations
 */
@Injectable({ providedIn: 'root' })
export class ResultsExtractQueryApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Search for contracts with autocomplete
   * GET /api/v1/results-extract-query/contracts?searchTerm={search}&take={take}&skip={skip}
   * @param search Search term (partial match on contract ID or company)
   * @param take Number of results to return (max 100, default 50)
   * @param skip Number of results to skip (default 0)
   * @returns Observable of contract options
   */
  searchContracts(search: string = '', take: number = 50, skip: number = 0): Observable<ContractOption[]> {
    const endpoint = API.LABORATORY.RESULTS_EXTRACT_QUERY_CONTRACTS(search, take, skip);

    return this.apiService.get<ApiResponse<ContractOption[]>>(endpoint).pipe(
      map(response => response.item || response.data || [])
    );
  }

  /**
   * Query results by contract and date range
   * POST /api/v1/results-extract-query
   * @param request Query parameters
   * @returns Observable of results extract data
   */
  queryResults(request: ResultsExtractQueryRequest): Observable<ResultsExtractData> {
    const endpoint = API.LABORATORY.RESULTS_EXTRACT_QUERY;

    return this.apiService.post<ApiResponse<ResultsExtractData>>(endpoint, request).pipe(
      map(response => (response.item || response.data)!)
    );
  }

  /**
   * Get total count from the last query response
   * Used for pagination - returns totalCount from API response
   * POST /api/v1/results-extract-query
   * @param request Query parameters
   * @returns Observable of full API response with totalCount
   */
  queryResultsWithCount(request: ResultsExtractQueryRequest): Observable<{ data: ResultsExtractData; totalCount: number }> {
    const endpoint = API.LABORATORY.RESULTS_EXTRACT_QUERY;

    return this.apiService.post<ApiResponse<ResultsExtractData>>(endpoint, request).pipe(
      map(response => {
        const data: ResultsExtractData = (response.item || response.data)!;
        return {
          data: data,
          totalCount: data.totalBatches || 0
        };
      })
    );
  }

  /**
   * Get batch detail (units + test results) for a single batch — on-demand loading
   * POST /api/v1/results-extract-query/batch-detail
   */
  getBatchDetail(request: BatchDetailRequest): Observable<BatchDetailResponse> {
    const endpoint = API.LABORATORY.RESULTS_EXTRACT_QUERY_BATCH_DETAIL;

    return this.apiService.post<ApiResponse<BatchDetailResponse>>(endpoint, request).pipe(
      map(response => (response.item || response.data)!)
    );
  }

  /**
   * Get all valid RG contracts accessible to the user
   * GET /api/v1/results-extract-query/valid-contracts
   * @returns Observable of valid contracts list
   */
  getAllValidContracts(): Observable<ValidContract[]> {
    const endpoint = API.LABORATORY.RESULTS_EXTRACT_QUERY_VALID_CONTRACTS;

    return this.apiService.get<ApiResponse<ValidContract[]>>(endpoint).pipe(
      map(response => response.item || response.data || [])
    );
  }
}
