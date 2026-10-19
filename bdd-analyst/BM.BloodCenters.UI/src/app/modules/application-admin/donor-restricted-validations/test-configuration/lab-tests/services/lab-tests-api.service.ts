import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

import {
  TestIdOption,
  TestDetails,
  LabTestModel,
  LabTestRequestParams,
  LabTestEditModel,
  DropdownOptions,
  DefineTestsLabCreateDto,
  DefineTestsLabUpdateDto,
  FilterDropdownOptions,
  DefineTestResultsLabFilterRequest,
  DefineTestResultsLabDto,
  DefineTestResultsLabArrayResponse,
  DefineTestResultsLabBulkUpsertDto,
  DefineTestResultsLabBulkUpsertResultDto
} from '../models/lab-tests.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class LabTestsApiService {
  private readonly apiService = inject(ApiService);

  // Cache for filter values to avoid duplicate API calls
  private filterValues$: Observable<FilterDropdownOptions> | null = null;

  /**
   * Get all test IDs for the dropdown
   * GET /api/v1/define-tests-lab/test-ids
   * Returns: [{ code: "2", description: "testxxxxxxxxx" }, { code: "@K", description: "Anti-Kell" }, ...]
   */
  getTestIds(): Observable<TestIdOption[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_TEST_IDS).pipe(
      map(response => {
        // Handle both wrapped and direct array responses
        const rawData = response.Data || response.data || response;
        const testsList: any[] = Array.isArray(rawData) ? rawData : [];

        return testsList.map(item => {
          // Handle both string and object formats
          if (typeof item === 'string') {
            return { testId: item };
          }
          const code = item.code || item.Code || item.testId || item.TestId || '';
          const description = item.description || item.Description || '';
          return {
            testId: code,
            description: description,
            testGroup: item.testGroup || item.TestGroup || undefined
          };
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get test details by test ID
   * GET /api/v1/define-tests-lab/{testId}
   * Backend returns DefineTestsLabDto (PascalCase)
   */
  getTestDetails(testId: string): Observable<TestDetails | null> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_BY_ID(testId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const item = response.Item || response.item ||
                     response.Data?.[0] || response.data?.[0] ||
                     response;

        if (!item) return null;

        return this.mapDtoToTestDetails(item);
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Maps DefineTestsLabDto (PascalCase, booleans) to TestDetails (camelCase, Y/N strings)
   */
  private mapDtoToTestDetails(dto: any): TestDetails {
    return {
      description: dto.Description ?? dto.description ?? '',
      shortId: dto.ShortId ?? dto.shortId ?? '',
      group: dto.Group ?? dto.group ?? '',
      antigenTest: this.boolToYN(dto.AntigenTest ?? dto.antigenTest),
      autoSchedule: this.boolToYN(dto.AutoSchedule ?? dto.autoSchedule),
      editResults: this.boolToYN(dto.EditResults ?? dto.editResults),
      discrepancyCheck: this.boolToYN(dto.DiscrepancyCheck ?? dto.discrepancyCheck),
      noOfResults: dto.NoOfResults ?? dto.noOfResults ?? 0,
      fullResult: this.boolToYN(dto.FullResult ?? dto.fullResult),
      effDateTime: dto.EffectiveDate ?? dto.effectiveDate ?? null,
      termDateTime: dto.TerminationDate ?? dto.terminationDate ?? null,
      modificationDate: dto.ModificationDate ?? dto.modificationDate ?? null
    };
  }

  /**
   * Converts boolean to Y/N string for display
   */
  private boolToYN(value: boolean | null | undefined): string {
    if (value === true) return 'Y';
    if (value === false) return 'N';
    return '';
  }

  /**
   * Get test groups dropdown
   * GET /api/v1/define-tests-lab/dropdowns/test-groups
   * Returns: [{ code: "AG", description: "Serological RBC Antigen" }, ...]
   */
  getTestGroups(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_DROPDOWNS_TEST_GROUPS).pipe(
      map(response => {
        const groups: any[] = Array.isArray(response) ? response : (response.Data || response.data || []);
        return groups.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description || '';
          return {
            value: code,
            display: description ? `${code} - ${description}` : code
          };
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get result codes dropdown for lab tests
   * GET /api/v1/define-tests-lab/dropdowns/result-codes
   * Returns: [{ code: "NEG", description: "Negative" }, ...]
   */
  getResultCodes(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_DROPDOWNS_RESULT_CODES).pipe(
      map(response => {
        const codes: any[] = Array.isArray(response) ? response : (response.Data || response.data || []);
        return codes.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description || '';
          return {
            value: code,
            display: description ? `${code} - ${description}` : code
          };
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get interdiction codes for a specific test ID
   * GET /api/v1/define-tests-lab/interdiction-codes/{testId}
   * Returns: [{ code: "ABOT", description: "ABO/Rh Not Initially Tested" }, ...]
   */
  getInterdictionCodesByTestId(testId: string): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_INTERDICTION_CODES_BY_TESTID(testId)).pipe(
      map(response => {
        const codes: any[] = Array.isArray(response) ? response : (response.Data || response.data || []);
        return codes.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description || '';
          return {
            value: code,
            display: description ? `${code} - ${description}` : code
          };
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get active test IDs for Confirm Test dropdowns
   * GET /api/v1/define-tests-lab/active-test-ids
   * Returns: [{ code: "iMPX", description: "Individual Multiplex NAT test" }, ...]
   */
  getActiveTestIds(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_ACTIVE_TEST_IDS).pipe(
      map(response => {
        const tests: any[] = Array.isArray(response) ? response : (response.Data || response.data || []);
        return tests.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description || '';
          return {
            value: code,
            display: description ? `${code} - ${description}` : code
          };
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get all dropdown options for the add/edit test form
   * GET /api/v1/define-tests-lab/dropdowns
   */
  getDropdowns(): Observable<DropdownOptions> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_DROPDOWNS).pipe(
      map(response => {
        const dto = response.Data || response.data || response;
        return this.mapDropdownDto(dto);
      }),
      catchError(error => throwError(() => error))
    );
  }

  private mapDropdownDto(dto: any): DropdownOptions {
    const groupList = dto.Group || dto.group || [];
    const antigenTestList = dto.AntigenTest || dto.antigenTest || [];
    const autoScheduleList = dto.AutoSchedule || dto.autoSchedule || [];
    const editResultsList = dto.EditResults || dto.editResults || [];
    const discrepancyCheckList = dto.DiscrepancyCheck || dto.discrepancyCheck || [];
    const noOfResultsList = dto.NoOfResults || dto.noOfResults || [];
    const fullResultList = dto.FullResult || dto.fullResult || [];

    return {
      group: groupList.map((item: any) => {
        const code = item.Code ?? item.code ?? '';
        const description = item.Description ?? item.description ?? '';
        return {
          value: code,
          display: description ? `${code} - ${description}` : code
        };
      }),
      antigenTest: antigenTestList.map((item: any) => ({
        value: item.Value ?? item.value,
        display: item.Label ?? item.label ?? ''
      })),
      autoSchedule: autoScheduleList.map((item: any) => ({
        value: item.Value ?? item.value,
        display: item.Label ?? item.label ?? ''
      })),
      editResults: editResultsList.map((item: any) => ({
        value: item.Value ?? item.value,
        display: item.Label ?? item.label ?? ''
      })),
      discrepancyCheck: discrepancyCheckList.map((item: any) => ({
        value: item.Value ?? item.value,
        display: item.Label ?? item.label ?? ''
      })),
      noOfResults: noOfResultsList.map((item: any) => ({
        value: item.Value ?? item.value,
        display: item.Label ?? item.label ?? ''
      })),
      fullResult: fullResultList.map((item: any) => ({
        value: item.Value ?? item.value,
        display: item.Label ?? item.label ?? ''
      }))
    };
  }

  /**
   * Create a new test
   * POST /api/v1/define-tests-lab
   */
  createTest(dto: DefineTestsLabCreateDto): Observable<any> {
    return this.apiService.post<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_CREATE, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing test
   * PUT /api/v1/define-tests-lab/{testId}
   */
  updateTest(testId: string, dto: DefineTestsLabUpdateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_TESTS_LAB_UPDATE(testId);
    return this.apiService.put<any>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get filter dropdown values for lab tests filter panel and edit mode
   * Uses dedicated endpoints for each dropdown type:
   * - GET /api/v1/define-test-results-lab/dropdowns/interdictions
   * - GET /api/v1/define-test-results-lab/dropdowns/attributes
   * - GET /api/v1/define-test-results-lab/dropdowns/tests (active lab tests from VALID_TESTS)
   *
   * Note: Result codes are now loaded separately via getResultCodes() from define-tests-lab API
   *
   * Cached with shareReplay(1) to prevent duplicate API calls when both LabTestsComponent
   * and LabTestsFilterPanel request filter values on the same page load.
   */
  getFilterValues(): Observable<FilterDropdownOptions> {
    if (!this.filterValues$) {
      const interdictions$ = this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_LAB_DROPDOWNS_INTERDICTIONS);
      const attributes$ = this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_LAB_DROPDOWNS_ATTRIBUTES);
      const tests$ = this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_LAB_DROPDOWNS_TESTS);

      this.filterValues$ = forkJoin({
        interdictions: interdictions$,
        attributes: attributes$,
        tests: tests$
      }).pipe(
        map(({ interdictions, attributes, tests }) => {
          // Extract arrays from each response (APIs return direct arrays of objects)
          const interdictionList: any[] = Array.isArray(interdictions) ? interdictions : [];
          const attributeList: any[] = Array.isArray(attributes) ? attributes : [];
          const testsList: any[] = Array.isArray(tests) ? tests : [];

          return {
            // Interdictions: { code: "1dff", description: "qq", interType: "N" }
            interdictionCodes: interdictionList.map(item => ({
              value: item.code || '',
              display: item.description ? `${item.code || ''} - ${item.description}` : (item.code || '')
            })),
            // Attributes: { code: "@K", description: "Anti-Kell present", attributeGroup: "ALERT" }
            attributeCodes: attributeList.map(item => ({
              value: item.code || '',
              display: item.description ? `${item.code || ''} - ${item.description}` : (item.code || '')
            })),
            // Tests: { testId: "ABORH", description: "ABO and Rh Blood Groupings", testGroup: "ABORH" }
            tests: testsList.map(item => ({
              value: item.testId || '',
              display: item.description ? `${item.testId || ''} - ${item.description}` : (item.testId || '')
            }))
          };
        }),
        shareReplay(1),
        catchError(error => throwError(() => error))
      );
    }

    return this.filterValues$;
  }

  /**
   * Clear the cached filter values
   * Call this if filter dropdown values might have changed (e.g., after adding new codes)
   */
  clearFilterValuesCache(): void {
    this.filterValues$ = null;
  }

  /**
   * Get lab test results filtered by test ID
   * POST /api/v1/define-test-results-lab/filter-by-testid?testId={testId}
   * Request Body: { interdiction, plateSeq, effectivePeriod, effectiveDate,
   *                 terminationPeriod, terminationDate, searchKeyword }
   * Returns: DefineTestResultsLabArrayResponse (array of DefineTestResultsLabDto)
   */
  getLabTests(
    params: LabTestRequestParams
  ): Observable<{ data: LabTestModel[]; totalRecords: number }> {
    if (!params.testId) {
      return of({ data: [], totalRecords: 0 });
    }

    const endpoint = API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_LAB_FILTER_BY_TESTID(
      params.testId
    );

    const filterBody: DefineTestResultsLabFilterRequest = {};

    if (params.interdictionCode) {
      filterBody.interdiction = params.interdictionCode;
    }
    if (params.initialRepeat) {
      // Map initialRepeat to plateSeq for API request
      filterBody.plateSeq = params.initialRepeat;
    }
    if (params.effectiveDatePeriod) {
      filterBody.effectivePeriod = params.effectiveDatePeriod.toUpperCase();
    }
    if (params.effectiveDate) {
      filterBody.effectiveDate = new Date(params.effectiveDate).toISOString();
    }
    if (params.terminationDatePeriod) {
      filterBody.terminationPeriod = params.terminationDatePeriod.toUpperCase();
    }
    if (params.terminationDate) {
      filterBody.terminationDate = new Date(params.terminationDate).toISOString();
    }
    if (params.searchKeyword) {
      filterBody.searchKeyword = params.searchKeyword;
    }

    return this.apiService.post<any>(endpoint, filterBody).pipe(
      map(response => {
        // Handle both direct array and wrapped response formats
        let items: DefineTestResultsLabDto[] = [];
        let total = 0;

        if (Array.isArray(response)) {
          // Direct array response
          items = response;
          total = items.length;
        } else {
          // Wrapped response: { data: [...], total: N } or { Data: [...], Total: N }
          const dataArray = response.data || response.Data || [];
          items = Array.isArray(dataArray) ? dataArray : [];
          total = response.total || response.Total || items.length;
        }

        return {
          data: items.map(item => this.mapDtoToLabTestModel(item)),
          totalRecords: total
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Bulk create/update lab test results
   * POST /api/v1/define-test-results-lab/bulk/upsert
   */
  saveBulkLabTests(testId: string, dto: DefineTestResultsLabBulkUpsertDto): Observable<DefineTestResultsLabBulkUpsertResultDto> {
    return this.apiService.post<any>(
      API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_LAB_BULK_UPSERT(testId),
      dto
    ).pipe(
      map(response => {
        const result = response.Data || response.data || response;
        return {
          TotalRecords: result.TotalRecords ?? result.totalRecords ?? 0,
          CreatedCount: result.CreatedCount ?? result.createdCount ?? 0,
          UpdatedCount: result.UpdatedCount ?? result.updatedCount ?? 0,
          FailureCount: result.FailureCount ?? result.failureCount ?? 0,
          SuccessCount: result.SuccessCount ?? result.successCount ?? 0,
          Success: result.Success ?? result.success ?? false,
          Message: result.Message ?? result.message ?? ''
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Maps DefineTestResultsLabDto (PascalCase) to LabTestModel (camelCase)
   * Maps API response fields to UI model
   */
  private mapDtoToLabTestModel(dto: DefineTestResultsLabDto): LabTestModel {
    return {
      resultCode: dto.ResultCode ?? '',
      initialRepeat: dto.PlateSeq ?? '',
      interdictionCode: dto.InterdictionCode ?? '',
      noOfRepeats: dto.NoOfRepeats ?? 0,
      attributeCode: dto.AttributeCode ?? '',
      confirmTest1: dto.ConfirmTest1 ?? '',
      confirmTest2: dto.ConfirmTest2 ?? '',
      confirmTest3: dto.ConfirmTest3 ?? '',
      confirmTest4: dto.ConfirmTest4 ?? '',
      confirmTest5: dto.ConfirmTest5 ?? '',
      confirmTest6: dto.ConfirmTest6 ?? '',
      machineResult: this.boolToYN(dto.AutoOnly),
      result2: this.boolToYN(dto.SecondTech),
      effDate: dto.EffectiveDate ?? '',
      termDate: dto.TerminationDate ?? null,
      modificationDate: dto.ModificationDate ?? '',
      auditKey: dto.AuditKey ?? 0
    };
  }
}
