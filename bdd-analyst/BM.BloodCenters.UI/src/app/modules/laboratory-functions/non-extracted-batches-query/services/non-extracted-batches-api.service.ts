import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  BatchDto,
  UnitDto,
  TestResultDto,
  ContractLookupDto,
  QueryBatchesResponse,
  NonExtractedBatchesQueryParams
} from '../models/non-extracted-batches.model';

/**
 * API Service for Non-Extracted Batches Query
 *
 * Provides methods to query batches with non-extracted test results
 * and drill down to units and individual test results.
 */
@Injectable({
  providedIn: 'root'
})
export class NonExtractedBatchesApiService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);

  /**
   * Query batches with non-extracted test results
   * @param params Query parameters (contractId optional, fromDate and toDate required)
   * @returns Observable of query batches response with batches array and totals
   */
  queryBatches(params: NonExtractedBatchesQueryParams): Observable<QueryBatchesResponse> {
    const endpoint = API.NON_EXTRACTED_BATCHES.GET_BATCHES;

    let httpParams = new HttpParams()
      .set('fromDate', params.fromDate)
      .set('toDate', params.toDate);

    if (params.contractId) {
      httpParams = httpParams.set('contractId', params.contractId);
    }

    return this.apiService.get<QueryBatchesResponse>(endpoint, { params: httpParams })
      .pipe(
        map((response: any) => response.data)
      );
  }

  /**
   * Get units for a specific batch
   * @param batchId Batch identifier
   * @param contractId Optional contract filter
   * @returns Observable of unit array
   */
  getUnitsForBatch(batchId: string, contractId?: string): Observable<UnitDto[]> {
    const endpoint = API.NON_EXTRACTED_BATCHES.GET_UNITS(batchId);

    let httpParams = new HttpParams();
    if (contractId) {
      httpParams = httpParams.set('contractId', contractId);
    }

    return this.apiService.get<UnitDto[]>(endpoint, { params: httpParams })
      .pipe(
        map((response: any) => response.data || [])
      );
  }

  /**
   * Get test results for a specific unit
   * @param batchId Batch identifier
   * @param unitId Unit identifier
   * @param collDate Collection date (required)
   * @param contractId Optional contract filter
   * @returns Observable of test results array
   */
  getTestResultsForUnit(
    batchId: string,
    unitId: string,
    collDate: string,
    contractId?: string
  ): Observable<TestResultDto[]> {
    const endpoint = API.NON_EXTRACTED_BATCHES.GET_TEST_RESULTS(batchId, unitId);

    let httpParams = new HttpParams()
      .set('collDate', collDate);

    if (contractId) {
      httpParams = httpParams.set('contractId', contractId);
    }

    return this.apiService.get<TestResultDto[]>(endpoint, { params: httpParams })
      .pipe(
        map((response: any) => response.data || [])
      );
  }

  /**
   * Get active regional testing contracts for dropdown
   * @returns Observable of contract lookup array
   */
  getActiveContracts(): Observable<ContractLookupDto[]> {
    const endpoint = API.NON_EXTRACTED_BATCHES.GET_CONTRACTS;

    return this.apiService.get<ContractLookupDto[]>(endpoint)
      .pipe(
        map((response: any) => response.data || [])
      );
  }
}
