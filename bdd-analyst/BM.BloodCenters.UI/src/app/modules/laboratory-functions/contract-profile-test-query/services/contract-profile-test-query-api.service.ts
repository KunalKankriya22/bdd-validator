import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../../../../core/constants/api.constants';
import {
  ContractLookupResponse,
  ProfileSetLookupResponse,
  ValidateProfileSetRequest,
  ValidateProfileSetResponse,
  ContractProfileTestQueryRequest,
  ContractProfileTestQueryResponse
} from '../models/contract-profile-test-query.model';

/**
 * API Service for Contract Profile Test Query
 *
 * Integrates with ContractProfileTestQueryController endpoints
 *
 * Backend Controller:
 * BM.BloodCenters.API/Src/BM.BloodCenters.API/Modules/LaboratoryQueries/
 * Controllers/ContractProfileTestQueryController.cs
 *
 * FMB Technical Documentation:
 * BM.BloodCenters.API/Src/BM.BloodCenters.API/RGQTESTS_FMB_Technical_Analysis.md
 *
 * Oracle Forms Procedures Migrated:
 * - CONTRACT_LOV (Contract lookup with search)
 * - PROFILE_SET_ID_LOV (Profile Set lookup)
 * - VALIDATE_PROFILE_SETID (Profile Set validation + MaxProfileSeqNo)
 * - Query execution with WHERE clause filtering
 */
@Injectable({
  providedIn: 'root'
})
export class ContractProfileTestQueryApiService {
  private readonly http = inject(HttpClient);

  /**
   * Get contract lookup (CONTRACT_LOV functionality)
   * Searches by contract ID or company name (partial match)
   * GET /api/v1/contract-profile-test-query/contracts?searchText={text}
   */
  getContractLookup(searchText?: string): Observable<ContractLookupResponse> {
    const url = API.LABORATORY.CONTRACT_PROFILE_TEST_QUERY.CONTRACTS(searchText);
    return this.http.get<ContractLookupResponse>(url);
  }

  /**
   * Get profile set lookup (PROFILE_SET_ID_LOV functionality)
   * Returns available profile sets for selected contract
   * GET /api/v1/contract-profile-test-query/profile-sets?contractId={id}
   */
  getProfileSetLookup(contractId: string): Observable<ProfileSetLookupResponse> {
    const url = API.LABORATORY.CONTRACT_PROFILE_TEST_QUERY.PROFILE_SETS(contractId);
    return this.http.get<ProfileSetLookupResponse>(url);
  }

  /**
   * Validate profile set ID for a contract (VALIDATE_PROFILE_SETID procedure)
   * Returns profile description and max profile sequence number if valid
   * POST /api/v1/contract-profile-test-query/validate-profile-set
   */
  validateProfileSet(request: ValidateProfileSetRequest): Observable<ValidateProfileSetResponse> {
    return this.http.post<ValidateProfileSetResponse>(
      API.LABORATORY.CONTRACT_PROFILE_TEST_QUERY.VALIDATE_PROFILE_SET,
      request
    );
  }

  /**
   * Query contract profile tests
   * POST /api/v1/contract-profile-test-query/profile-tests
   */
  getContractProfileTests(request: ContractProfileTestQueryRequest): Observable<ContractProfileTestQueryResponse> {
    return this.http.post<ContractProfileTestQueryResponse>(
      API.LABORATORY.CONTRACT_PROFILE_TEST_QUERY.PROFILE_TESTS,
      request
    );
  }
}
