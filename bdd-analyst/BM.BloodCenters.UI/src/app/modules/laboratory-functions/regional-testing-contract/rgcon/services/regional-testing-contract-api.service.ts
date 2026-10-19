import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../../../../core/constants/api.constants';
import { HeaderService } from '@shared/services/header.service';
import {
  RegionalTestingContractProfileDto,
  CreateRegionalTestingContractProfileDto,
  UpdateRegionalTestingContractProfileDto,
  RegionalTestingContractProfileQueryDto,
  ApiResponse,
  ContractDto,
  ContractQueryDto,
  CreateContractDto,
  UpdateContractDto,
  ProfileSetData,
  ProfileType,
  NonProfileTestData,
  CustomerOverrideData,
  ConfirmatoryOverrideTestData,
  TestLookup,
  TestGroupLookup,
  TestByGroupLookup,
  ResultLookup,
  ReactiveTestResult,
  ConfirmatoryTestResult,
  ConfirmatoryQueryPanelData
} from '../models/regional-testing-contract.model';

/**
 * API Service for Regional Testing Contract Profile Management
 * Implements all endpoints from API Documentation: MLT-12617
 * Base URL: /api/v1/regional-testing-contract-profiles
 */
@Injectable({
  providedIn: 'root'
})
export class RegionalTestingContractApiService {
  private readonly http = inject(HttpClient);
  private readonly headerService = inject(HeaderService);

  // ===== Contract Main Endpoints =====

  /**
   * Get paginated list of contracts with optional filtering, searching, and sorting
   * POST /api/v1/regional-testing-contract/{take}/{skip}
   *
   * @param take Number of records to return (page size)
   * @param skip Number of records to skip (offset)
   * @param query Optional query parameters for filtering/sorting
   * @returns Observable of contracts with total count
   */
  getAllContracts(
    take: number = 10,
    skip: number = 0,
    query?: ContractQueryDto
  ): Observable<{ data: ContractDto[]; total: number }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.QUERY(take, skip)}`;

    return this.http.post<ApiResponse<ContractDto[]>>(url, query || {})
      .pipe(
        map(response => ({
          data: response.data,
          total: response.totalCount || 0
        }))
      );
  }

  /**
   * Get a single contract by ID with all child entities
   * GET /api/v1/regional-testing-contract/{contractId}
   *
   * @param contractId Contract identifier
   * @returns Observable of contract with child entities
   */
  getContractById(contractId: string): Observable<ContractDto> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.GET_BY_ID(contractId)}`;

    return this.http.get<ApiResponse<ContractDto[]>>(url)
      .pipe(
        map(response => response.data[0])
      );
  }

  /**
   * Create a new contract with optional child entities
   * POST /api/v1/regional-testing-contract
   *
   * @param dto Create DTO with contract data
   * @returns Observable of created contract ID
   */
  createContract(dto: CreateContractDto): Observable<{ contractId: string }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.CREATE}`;

    return this.http.post<any>(url, dto)
      .pipe(
        map(response => {
          // API may return data array or just success message
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          // Fallback: return empty contractId (backend should return data on create)
          return { contractId: '' };
        })
      );
  }

  /**
   * Update an existing contract
   * PUT /api/v1/regional-testing-contract/{contractId}
   *
   * Note: Child entities are replaced (delete all, insert new)
   *
   * @param contractId Contract identifier
   * @param dto Update DTO with modified data
   * @returns Observable of updated contract ID
   */
  updateContract(contractId: string, dto: UpdateContractDto): Observable<{ contractId: string }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.UPDATE(contractId)}`;

    return this.http.put<ApiResponse<{ contractId: string }[]>>(url, dto)
      .pipe(
        map(response => {
          // API returns data array on success, undefined on some update responses
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          // For updates, return the contractId we already have
          return { contractId };
        })
      );
  }

  /**
   * Soft delete a contract (sets term_date to current date)
   * DELETE /api/v1/regional-testing-contract/{contractId}
   *
   * @param contractId Contract identifier
   * @returns Observable of deletion success
   */
  deleteContract(contractId: string): Observable<boolean> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.DELETE(contractId)}`;

    return this.http.delete<ApiResponse<boolean[]>>(url)
      .pipe(
        map(response => response.data[0])
      );
  }

  // ===== Contract Profile Endpoints =====

  /**
   * Get paginated list of contract profiles with optional filtering, searching, and sorting
   * POST /api/regional-testing-contract-profiles/{take}/{skip}
   *
   * @param take Number of records to return (max 100)
   * @param skip Number of records to skip for pagination
   * @param query Optional query parameters for filtering/sorting
   * @returns Observable of contract profiles with totalCount
   */
  getAll(
    take: number = 10,
    skip: number = 0,
    query?: RegionalTestingContractProfileQueryDto
  ): Observable<{ data: RegionalTestingContractProfileDto[]; totalCount: number }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.PROFILES.QUERY(take, skip)}`;

    return this.http.post<ApiResponse<RegionalTestingContractProfileDto[]>>(url, query || {})
      .pipe(
        map(response => ({
          data: response.data,
          totalCount: response.totalCount || 0
        }))
      );
  }

  /**
   * Get a single contract profile by composite key
   * GET /api/regional-testing-contract-profiles/{contractId}/{profileSetId}
   *
   * @param contractId Contract identifier (max 9 chars)
   * @param profileSetId Profile Set identifier (max 20 chars)
   * @returns Observable of contract profile
   */
  getById(contractId: string, profileSetId: string): Observable<RegionalTestingContractProfileDto> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.PROFILES.GET_BY_ID(contractId, profileSetId)}`;

    return this.http.get<ApiResponse<RegionalTestingContractProfileDto>>(url)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Create a new contract profile
   * POST /api/regional-testing-contract-profiles
   *
   * Validation:
   * - contractId: Required, max 9 chars
   * - profileSetId: Required, max 20 chars
   * - profileType: Optional, must be P, A, or S
   * - effDate: Required, not in past (chapter-local date)
   * - termDate: Optional, must be >= effDate, not in past
   *
   * @param dto Create DTO with contract profile data
   * @returns Observable of created profile composite key
   */
  create(dto: CreateRegionalTestingContractProfileDto): Observable<{ contractId: string; profileSetId: string }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.PROFILES.CREATE}`;

    return this.http.post<ApiResponse<{ contractId: string; profileSetId: string }>>(url, dto)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Update an existing contract profile
   * PUT /api/regional-testing-contract-profiles/{contractId}/{profileSetId}
   *
   * Note: For update, effDate can be in the past (unlike create)
   *
   * @param contractId Contract identifier
   * @param profileSetId Profile Set identifier
   * @param dto Update DTO with modified data
   * @returns Observable of void (success indicated by HTTP 200)
   */
  update(
    contractId: string,
    profileSetId: string,
    dto: UpdateRegionalTestingContractProfileDto
  ): Observable<void> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.PROFILES.UPDATE(contractId, profileSetId)}`;

    return this.http.put<ApiResponse<void>>(url, dto)
      .pipe(
        map(() => undefined)
      );
  }

  /**
   * Soft delete a contract profile (sets TERM_DATE to chapter local date)
   * DELETE /api/regional-testing-contract-profiles/{contractId}/{profileSetId}
   *
   * Note: This is a soft delete - sets termination date to chapter-local date
   *
   * @param contractId Contract identifier
   * @param profileSetId Profile Set identifier
   * @returns Observable of void (success indicated by HTTP 200)
   */
  delete(contractId: string, profileSetId: string): Observable<void> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.PROFILES.DELETE(contractId, profileSetId)}`;

    return this.http.delete<ApiResponse<void>>(url)
      .pipe(
        map(() => undefined)
      );
  }

  /**
   * Get filter options for Step 1 dropdowns
   * GET /api/v1/regional-testing-contract/filter-options
   * Returns: cbcChapters, stateCodes, barCodeProtocols, resultsMethods
   */
  getFilterOptions(): Observable<{
    cbcChapters: { value: string; label: string }[];
    stateCodes: { value: string; label: string }[];
    barCodeProtocols: { value: string; label: string }[];
    resultsMethods: { value: string; label: string }[];
  }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.FILTER_OPTIONS}`;

    return this.http.get<ApiResponse<any>>(url)
      .pipe(
        map(response => response.data[0])
      );
  }

  /**
   * Get available chapters for multi-select dialog
   * GET /api/v1/regional-testing-contract/available-chapters
   */
  getChaptersLookup(): Observable<{ chapterId: string; chapterName: string }[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.AVAILABLE_CHAPTERS}`;

    return this.http.get<ApiResponse<{ chapterId: string; chapterName: string }[]>>(url)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Generate contract ID
   * GET /api/v1/regional-testing-contract/generate-contract-id/{contractType}
   */
  generateContractId(contractType: string): Observable<{ contractPrefix: string; lastContractId: string }> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.GENERATE_CONTRACT_ID(contractType)}`;

    return this.http.get<ApiResponse<any>>(url)
      .pipe(
        map(response => response.data[0])
      );
  }

  /**
   * Get states lookup for address details
   * Uses existing API endpoint (from filter options)
   */
  getStatesLookup(): Observable<{ stateCode: string; stateName: string }[]> {
    const url = `${environment.apiUrl}${API.CHAPTER.STATES_LOOKUP}`;

    return this.http.get<ApiResponse<{ stateCode: string; stateName: string }[]>>(url)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get countries lookup for address details
   * Uses existing API endpoint
   */
  getCountriesLookup(): Observable<{ countryCode: string; countryName: string }[]> {
    const url = `${environment.apiUrl}${API.CHAPTER.COUNTRIES_LOOKUP}`;

    return this.http.get<ApiResponse<{ countryCode: string; countryName: string }[]>>(url)
      .pipe(
        map(response => response.data)
      );
  }

  // ── Contract Tests (Step 2) ──────────────────────────────────────

  /**
   * Get test groups for filtering
   * GET /api/v1/regional-testing-contract/{contractId}/test-groups
   */
  getTestGroups(contractId: string): Observable<TestGroupLookup[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.TEST_GROUPS(contractId)}`;

    return this.http.get<ApiResponse<{ value: string; label: string }[]>>(url)
      .pipe(
        map(response => response.data.map(item => ({
          groupId: item.value,
          description: item.label
        })))
      );
  }

  /**
   * Get profile test lookup
   * GET /api/v1/regional-testing-contract/{contractId}/profile-test-lookup
   */
  getTestLookups(contractId: string = ''): Observable<TestLookup[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.PROFILE_TEST_LOOKUP(contractId || 'NEW')}`;

    return this.http.get<ApiResponse<{ testId: string; testDesc: string; testGroup?: string }[]>>(url)
      .pipe(
        map(response => response.data.map(item => ({
          testId: item.testId,
          description: item.testDesc,
          testGroup: item.testGroup
        })))
      );
  }

  /**
   * Get non-profile test lookup
   * GET /api/v1/regional-testing-contract/{contractId}/non-profile-test-lookup
   */
  getTestsByGroup(contractId: string, _groupId?: string): Observable<TestByGroupLookup[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.NON_PROFILE_TEST_LOOKUP(contractId)}`;

    return this.http.get<ApiResponse<{ testId: string; testDesc: string; testGroup: string }[]>>(url)
      .pipe(
        map(response => response.data.map(item => ({
          testId: item.testId,
          testGroup: item.testGroup,
          description: item.testDesc
        })))
      );
  }

  /**
   * Get reactive test lookup
   * GET /api/v1/regional-testing-contract/reactive-test-lookup
   */
  getReactiveTestLookup(): Observable<TestLookup[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.REACTIVE_TEST_LOOKUP}`;

    return this.http.get<ApiResponse<{ testId: string; testDesc: string }[]>>(url)
      .pipe(
        map(response => response.data.map(item => ({
          testId: item.testId,
          description: item.testDesc
        })))
      );
  }

  /**
   * Get reactive test results for a specific test
   * GET /api/v1/regional-testing-contract/reactive-test-results/{testId}
   */
  getResultCodesForTest(testId: string): Observable<ResultLookup[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.REACTIVE_TEST_RESULTS(testId)}`;

    return this.http.get<ApiResponse<{ resultStatus: string; codeDesc: string }[]>>(url)
      .pipe(
        map(response => response.data.map(item => ({
          resultCode: item.resultStatus,
          resultDescription: item.codeDesc
        })))
      );
  }

  /**
   * Get confirmatory test lookup
   * GET /api/v1/regional-testing-contract/confirmatory-test-lookup/{reactiveTestId}
   */
  getConfirmatoryTestLookup(reactiveTestId: string): Observable<TestLookup[]> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.CONFIRMATORY_TEST_LOOKUP(reactiveTestId)}`;

    return this.http.get<ApiResponse<{ testId: string; testDesc: string }[]>>(url)
      .pipe(
        map(response => response.data.map(item => ({
          testId: item.testId,
          description: item.testDesc
        })))
      );
  }

  /**
   * Get contract tests for a profile set
   * GET /api/v1/regional-testing-contract/{contractId}/contract-tests/{profileSetId}
   */
  getProfileSets(contractId: string): Observable<ProfileSetData[]> {
    // For new contracts, return empty array
    if (!contractId || contractId === 'NEW') {
      return of([]);
    }

    // Profile sets are part of the main contract GET response
    return this.getContractById(contractId).pipe(
      map(contract => {
        if (!contract.profiles || contract.profiles.length === 0) {
          return [];
        }

        // Group profiles by profileSetId to create ProfileSetData objects
        const profileMap = new Map<string, ProfileSetData>();

        contract.profiles.forEach(profile => {
          if (!profileMap.has(profile.profileSetId)) {
            // Cast profileType to ProfileType if it's one of the valid values, otherwise null
            const profileType = profile.profileType && ['P', 'A', 'S'].includes(profile.profileType)
              ? profile.profileType as ProfileType
              : null;

            profileMap.set(profile.profileSetId, {
              profileSetId: profile.profileSetId,
              profileType: profileType,
              effectiveDate: profile.effDate,
              terminationDate: profile.termDate || null,
              tests: []
            });
          }
        });

        return Array.from(profileMap.values());
      })
    );
  }

  /**
   * Save contract tests for a profile set
   * POST /api/v1/regional-testing-contract/{contractId}/contract-tests/{profileSetId}
   */
  saveProfileSet(contractId: string, profileSetId: string, tests: any[]): Observable<void> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.CONTRACT_TESTS.SAVE(contractId, profileSetId)}`;

    return this.http.post<ApiResponse<void>>(url, tests)
      .pipe(
        map(() => undefined)
      );
  }

  getNonProfileTests(contractId: string): Observable<NonProfileTestData[]> {
    // For new contracts, return empty array
    if (!contractId || contractId === 'NEW') {
      return of([]);
    }

    // Non-profile tests are part of the main contract GET response
    return this.getContractById(contractId).pipe(
      map(contract => {
        if (!contract.nonProfileTests || contract.nonProfileTests.length === 0) {
          return [];
        }

        // Get current logged-in user as fallback
        const currentUser = this.headerService.getCurrentUsername() || 'SYSTEM';

        return contract.nonProfileTests.map(test => ({
          testId: test.testId,
          description: test.testDesc || test.testId, // Fallback to testId if no description
          effectiveDate: test.effDate,
          terminationDate: test.termDate || null,
          lastModifiedUser: test.insertUser || currentUser, // Use insertUser, or current user
          lastModifiedDate: test.insertDate || new Date().toISOString()
        }));
      })
    );
  }

  getCustomerOverrides(contractId: string): Observable<CustomerOverrideData[]> {
    // For new contracts, return empty array
    if (!contractId || contractId === 'NEW') {
      return of([]);
    }

    // Customer overrides are extracted from contract.confirmTests
    return this.getContractById(contractId).pipe(
      map(contract => {
        if (!contract.confirmTests || contract.confirmTests.length === 0) {
          return [];
        }

        // Group confirmTests by reactiveTestId
        const grouped = new Map<string, typeof contract.confirmTests>();
        contract.confirmTests.forEach(ct => {
          const existing = grouped.get(ct.reactiveTestId) || [];
          existing.push(ct);
          grouped.set(ct.reactiveTestId, existing);
        });

        // Convert to CustomerOverrideData array
        const overrides: CustomerOverrideData[] = [];
        grouped.forEach((tests, reactiveTestId) => {
          const firstTest = tests[0];

          // Start with an empty row at the top for adding new tests
          const confirmatoryTests: ConfirmatoryOverrideTestData[] = [{
            testId: '',
            description: '',
            effectiveDate: '',
            terminationDate: null,
            isNew: true
          }];

          // Then add existing confirmatory tests
          confirmatoryTests.push(...tests.map(ct => ({
            testId: ct.confirmTestId,
            description: ct.confirmTestId, // TODO: Get from test lookup
            effectiveDate: ct.effDate,
            terminationDate: ct.termDate || null
          })));

          overrides.push({
            reactiveTestId: reactiveTestId,
            description: reactiveTestId, // TODO: Get from test lookup
            result: firstTest.reactiveTestResult,
            plateSequence: firstTest.reactivePlateSeq === 1 ? 'R' : 'I',
            confirmatoryTests: confirmatoryTests
          });
        });

        return overrides;
      })
    );
  }

  getConfirmatoryQueryData(contractId: string, reactiveTestId: string): Observable<ConfirmatoryQueryPanelData> {
    // Get ALL confirmatory tests from the contract (not filtered by reactiveTestId)
    return this.getContractById(contractId).pipe(
      map(contract => {
        if (!contract.confirmTests || contract.confirmTests.length === 0) {
          return {
            contractId,
            reactiveTests: [],
            confirmatoryTests: []
          };
        }

        // Group by reactiveTestId to get unique reactive tests
        const reactiveTestMap = new Map<string, typeof contract.confirmTests[0]>();
        contract.confirmTests.forEach(ct => {
          if (!reactiveTestMap.has(ct.reactiveTestId)) {
            reactiveTestMap.set(ct.reactiveTestId, ct);
          }
        });

        // Build reactive tests array (all unique reactive tests)
        const reactiveTests: ReactiveTestResult[] = Array.from(reactiveTestMap.values()).map(ct => ({
          testId: ct.reactiveTestId,
          testResults: ct.reactiveTestResult || '',
          sequence: ct.reactivePlateSeq === 1 ? 'R' : 'I' // 1 = Repeat, 0 = Initial
        }));

        // Build confirmatory tests array (ALL confirmatory tests)
        const confirmatoryTests: ConfirmatoryTestResult[] = contract.confirmTests.map(ct => ({
          testId: ct.confirmTestId,
          description: ct.confirmTestId, // TODO: Get description from test lookup if available
          effectiveDate: ct.effDate || '',
          terminationDate: ct.termDate || null
        }));

        return {
          contractId,
          reactiveTests,
          confirmatoryTests
        };
      })
    );
  }

  // Deprecated methods - keeping for backwards compatibility
  deleteProfileTest(_contractId: string, _profileSetId: string, _testId: string): Observable<void> {
    return of(undefined);
  }

  addNonProfileTest(_contractId: string, _testId: string): Observable<void> {
    return of(undefined);
  }

  addNonProfileTestsBatch(_contractId: string, _testIds: string[]): Observable<void> {
    return of(undefined);
  }

  saveCustomerOverride(_contractId: string, _data: CustomerOverrideData): Observable<void> {
    return of(undefined);
  }

  deleteConfirmatoryTest(_contractId: string, _reactiveTestId: string, _testId: string): Observable<void> {
    return of(undefined);
  }

  /**
   * Get state codes for address dropdown
   */
  getStateCodes(): Observable<{ code: string; description: string }[]> {
    // Use the same endpoint as imported blood contract for state codes
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.STATE_CODES}`;
    return this.http.get<any>(url)
      .pipe(
        map(response => (response.data || []).map((item: any) => ({
          code: item.code,
          description: item.description
        })))
      );
  }

  /**
   * Save address for regional testing contract
   */
  saveAddress(contractId: string, address: any): Observable<any> {
    const url = `${environment.apiUrl}${API.REGIONAL_TESTING_CONTRACT.ADDRESS.UPSERT(contractId)}`;
    return this.http.post<any>(url, address);
  }
}
