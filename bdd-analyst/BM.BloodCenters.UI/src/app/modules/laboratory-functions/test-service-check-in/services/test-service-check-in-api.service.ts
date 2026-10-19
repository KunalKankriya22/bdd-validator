import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  BatchCheckinRequest,
  BatchCheckinResponse,
  TestServiceContract,
  ContractTest,
  FixedProfileUnit
} from '../models/test-service-check-in.model';

export interface FixedProfileListResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: FixedProfileUnit[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TestServiceCheckInApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Main batch check-in endpoint
   * POST /api/v1/fixed-profile-tube-checkin/checkin
   *
   * Performs atomic batch check-in with:
   * - Auto-generates batch ID if batchId is "NEW" or null (format: MMDDYY-TS####)
   * - Creates BATCH_INPUTS header record
   * - Automatically schedules all contract-required tests in UTRS
   * - Links orphaned records (UTRS, UNIT_INTERDICTIONS, UNIT_ATTRIBUTES)
   *
   * @param request BatchCheckinRequest with units and metadata
   * @returns BatchCheckinResponse with batchId, unitsProcessed, and testsScheduled
   */
  checkInBatch(request: BatchCheckinRequest): Observable<BatchCheckinResponse> {
    return this.apiService.post<BatchCheckinResponse>(
      API.FIXED_PROFILE_TUBE_CHECKIN.CHECKIN,
      request
    );
  }

  /**
   * Get contracts dropdown
   * GET /api/v1/fixed-profile-tube-checkin/contracts
   *
   * Returns list of test service contracts for selection
   */
  getContracts(): Observable<TestServiceContract[]> {
    return this.apiService.get<TestServiceContract[]>(
      API.FIXED_PROFILE_TUBE_CHECKIN.CONTRACTS
    );
  }

  /**
   * Get batches dropdown
   * GET /api/v1/fixed-profile-tube-checkin/batches
   *
   * Returns list of existing batches for the chapter
   */
  getBatches(): Observable<string[]> {
    return this.apiService.get<string[]>(
      API.FIXED_PROFILE_TUBE_CHECKIN.BATCHES
    );
  }

  /**
   * Get paginated list of checked-in units
   * POST /api/v1/fixed-profile-tube-checkin/{take}/{skip}
   *
   * @param take Number of records to return (page size)
   * @param skip Number of records to skip (offset)
   * @returns Paginated list of FixedProfileUnit records with total count
   *
   * @example
   * // Get first 10 records
   * getCheckedInUnits(10, 0)
   *
   * // Get next 10 records (page 2)
   * getCheckedInUnits(10, 10)
   */
  getCheckedInUnits(take: number, skip: number): Observable<FixedProfileListResponse> {
    return this.apiService.post<FixedProfileListResponse>(
      API.FIXED_PROFILE_TUBE_CHECKIN.LIST(take, skip),
      {} // Empty body for POST request
    );
  }

  /**
   * Validate contract (if endpoint exists)
   * This may need to be implemented based on actual backend availability
   */
  validateContract(contractId: string): Observable<TestServiceContract> {
    // Placeholder - adjust based on actual backend endpoint
    return this.apiService.get<TestServiceContract>(
      `${API.FIXED_PROFILE_TUBE_CHECKIN.CONTRACTS}/${contractId}`
    );
  }

  /**
   * Get contract tests (if endpoint exists)
   * This may need to be implemented based on actual backend availability
   */
  getContractTests(contractId: string): Observable<ContractTest[]> {
    // Placeholder - adjust based on actual backend endpoint
    return this.apiService.get<ContractTest[]>(
      `${API.FIXED_PROFILE_TUBE_CHECKIN.CONTRACTS}/${contractId}/tests`
    );
  }
}
