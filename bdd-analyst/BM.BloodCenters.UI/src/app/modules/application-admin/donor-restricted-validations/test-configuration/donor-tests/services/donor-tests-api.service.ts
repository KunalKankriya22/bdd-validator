import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  TestIdOption,
  TestDetails,
  DonorTestResultModel,
  DonorTestResultRequestParams,
  DropdownOptions,
  DefineTestsDonorCreateDto,
  DefineTestsDonorUpdateDto,
  FilterDropdownOptions,
  DefineTestResultsDonorFilterRequest,
  DefineTestResultsDonorBulkUpsertDto,
  DefineTestResultsDonorBulkUpsertResultDto,
  EditModeDropdownOptions,
  TestDropdownItem,
  InterdictionDropdownItem,
  ResultCodeDropdownItem
} from '../models/donor-tests.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class DonorTestsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test IDs for the dropdown with descriptions
   * GET /api/v1/define-test-results-donor/dropdowns/tests
   * Backend returns array of { testId, description, testGroup }
   */
  getTestIds(): Observable<TestIdOption[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_TESTS).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];
        return items.map(item => ({
          testId: item.testId || item.TestId || '',
          description: item.description || item.Description,
          testGroup: item.testGroup || item.TestGroup
        }));
      }),
      catchError(error => {
        console.error('Error fetching test IDs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get test details by test ID
   * GET /api/v1/define-tests-donor/{testId}
   * Backend returns DefineTestsDonorDto
   */
  getTestDetails(testId: string): Observable<TestDetails | null> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_BY_ID(testId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const item = response.Item || response.item ||
                     response.Data?.[0] || response.data?.[0] ||
                     response;

        if (!item) return null;

        return this.mapDtoToTestDetails(item);
      }),
      catchError(error => {
        console.error(`Error fetching test details for ${testId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Maps DefineTestsDonorDto to TestDetails
   */
  private mapDtoToTestDetails(dto: any): TestDetails {
    const profileTest = dto.ProfileTest ?? dto.profileTest;
    const rawTestGroup: string = dto.TestGroup ?? dto.testGroup ?? '';
    const testGroupCode = rawTestGroup.includes('-') ? rawTestGroup.split('-')[0].trim() : rawTestGroup;
    return {
      description: dto.Description ?? dto.description ?? '',
      shortId: dto.ShortId ?? dto.shortId ?? '',
      profileTest: profileTest === true ? 'Yes' : profileTest === false ? 'No' : '',
      antigenType: dto.AntigenType ?? dto.antigenType ?? '',
      antigenGroup: dto.AntigenGroup ?? dto.antigenGroup ?? '',
      testGroup: testGroupCode,
      testGroupValue: dto.TestGroupValue ?? dto.testGroupValue ?? rawTestGroup,
      viewLevel: dto.ViewLevel ?? dto.viewLevel ?? '',
      effectiveDate: dto.EffectiveDate ?? dto.effectiveDate ?? null,
      terminationDate: dto.TerminationDate ?? dto.terminationDate ?? null,
      modificationDate: dto.ModificationDate ?? dto.modificationDate ?? null
    };
  }

  /**
   * Get all dropdown options for the add/edit test form
   * GET /api/v1/define-tests-donor/dropdowns
   * @deprecated Use individual dropdown methods instead (getAntigenTypes, getAntigenGroups, getTestGroups)
   */
  getDropdowns(): Observable<DropdownOptions> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_DROPDOWNS).pipe(
      map(response => {
        const dto = response.Data || response.data || response;
        return this.mapDropdownDto(dto);
      }),
      catchError(error => {
        console.error('Error fetching dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get antigen type dropdown options
   * GET /api/v1/define-tests-donor/dropdowns/antigen-types
   */
  getAntigenTypes(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_DROPDOWNS_ANTIGEN_TYPES).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return items.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description;
          return {
            value: code,
            display: description || code
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching antigen types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get antigen group dropdown options
   * GET /api/v1/define-tests-donor/dropdowns/antigen-groups
   */
  getAntigenGroups(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_DROPDOWNS_ANTIGEN_GROUPS).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return items.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description;
          return {
            value: code,
            display: description || code
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching antigen groups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get test group dropdown options
   * GET /api/v1/define-tests-donor/dropdowns/test-groups
   */
  getTestGroups(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_DROPDOWNS_TEST_GROUPS).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return items.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description;
          return {
            value: code,
            display: this.formatDropdownDisplay(code, description)
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching test groups:', error);
        return throwError(() => error);
      })
    );
  }

  private mapDropdownDto(dto: any): DropdownOptions {
    const profileTestOptions: boolean[] = dto.ProfileTestOptions || dto.profileTestOptions || [true, false];
    const antigenTypes: string[] = dto.AntigenTypes || dto.antigenTypes || [];
    const antigenGroups: string[] = dto.AntigenGroups || dto.antigenGroups || [];
    const testGroups: string[] = dto.TestGroups || dto.testGroups || [];
    const viewLevels: number[] = dto.ViewLevels || dto.viewLevels || [];

    return {
      profileTest: profileTestOptions.map(val => ({
        value: val,
        display: val ? 'Yes' : 'No'
      })),
      antigenType: antigenTypes.map(val => ({
        value: val,
        display: val
      })),
      antigenGroup: antigenGroups.map(val => ({
        value: val,
        display: val
      })),
      testGroup: testGroups.map(val => ({
        value: val.includes('-') ? val.split('-')[0].trim() : val,
        display: val
      })),
      viewLevel: viewLevels.map(val => ({
        value: val,
        display: String(val)
      }))
    };
  }

  /**
   * Create a new test
   * POST /api/v1/define-tests-donor
   */
  createTest(dto: DefineTestsDonorCreateDto): Observable<any> {
    return this.apiService.post<any>(API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_CREATE, dto).pipe(
      catchError(error => {
        console.error('Error creating test:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get the view level limit from the donor interdictions API
   * GET /api/v1/donor-interdictions/view-limit
   */
  getViewLevelLimit(): Observable<number> {
    return this.apiService.get<any>('/api/v1/donor-interdictions/view-limit').pipe(
      map(response => {
        const limitStr = response.item?.Viewlimit ?? response.item?.viewlimit ?? response.data?.viewlimit ?? '0';
        return parseInt(limitStr, 10) || 0;
      }),
      catchError(error => {
        console.error('Error fetching view level limit:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing test
   * PUT /api/v1/define-tests-donor/{testId}
   */
  updateTest(testId: string, dto: DefineTestsDonorUpdateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_TESTS_DONOR_UPDATE(testId);
    return this.apiService.put<any>(endpoint, dto).pipe(
      catchError(error => {
        console.error(`Error updating test ${testId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values for donor test results filter panel
   * GET /api/v1/define-test-results-donor/filter-values
   */
  getFilterValues(): Observable<FilterDropdownOptions> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_FILTER_VALUES).pipe(
      map(response => {
        const dto = response.Data || response.data || response;
        const interdictions: string[] = dto.Interdictions || dto.interdictions || [];

        return {
          interdictions: interdictions.map(code => ({
            value: code,
            display: code
          }))
        };
      }),
      catchError(error => {
        console.error('Error fetching filter values:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all dropdown options for edit mode
   * Fetches tests, interdictions, and result codes
   */
  getEditModeDropdowns(): Observable<EditModeDropdownOptions> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_TESTS).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return {
          tests: items.map(item => {
            const testId = item.testId || item.TestId || '';
            const description = item.description || item.Description;
            return {
              value: testId,
              display: this.formatDropdownDisplay(testId, description)
            };
          }),
          interdictions: [],
          resultCodes: []
        };
      }),
      catchError(error => {
        console.error('Error fetching edit mode dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction dropdown options
   * GET /api/v1/define-test-results-donor/dropdowns/interdictions
   */
  getInterdictionDropdowns(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_INTERDICTIONS).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return items.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description;
          return {
            value: code,
            display: this.formatDropdownDisplay(code, description)
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching interdiction dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction dropdown options by test ID
   * GET /api/v1/define-test-results-donor/dropdowns/interdictions/{testId}
   */
  getInterdictionDropdownsByTestId(testId: string): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_INTERDICTIONS_BY_TESTID(testId)).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return items.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description;
          return {
            value: code,
            display: this.formatDropdownDisplay(code, description)
          };
        });
      }),
      catchError(error => {
        console.error(`Error fetching interdiction dropdowns for test ${testId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get result code dropdown options
   * GET /api/v1/define-test-results-donor/dropdowns/result-codes
   */
  getResultCodeDropdowns(): Observable<{ value: string; display: string }[]> {
    return this.apiService.get<any>(API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_DROPDOWNS_RESULT_CODES).pipe(
      map(response => {
        const rawData = response.Data || response.data || response || [];
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return items.map(item => {
          const code = item.code || item.Code || '';
          const description = item.description || item.Description;
          return {
            value: code,
            display: this.formatDropdownDisplay(code, description)
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching result code dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Format dropdown display value
   * Shows "code - description" if description exists, otherwise just "code"
   */
  private formatDropdownDisplay(code: string, description?: string): string {
    if (description && description.trim()) {
      return `${code} - ${description}`;
    }
    return code;
  }

  /**
   * Get donor test results filtered by test ID
   * POST /api/v1/define-test-results-donor/filter-by-testid?testId={testId}
   */
  getDonorTestResults(
    params: DonorTestResultRequestParams
  ): Observable<{ data: DonorTestResultModel[]; totalRecords: number }> {
    if (!params.testId) {
      return of({ data: [], totalRecords: 0 });
    }

    const endpoint = API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_FILTER_BY_TESTID(params.testId);

    const filterBody: DefineTestResultsDonorFilterRequest = {};

    if (params.interdiction) {
      filterBody.interdiction = params.interdiction;
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
        const rawData = response.data || response.Data || (Array.isArray(response) ? response : []);
        const totalRecords = response.total ?? response.Total ?? response.totalRecords ?? 0;
        const items: any[] = Array.isArray(rawData) ? rawData : [];

        return {
          data: items.map(item => this.mapDtoToDonorTestResultModel(item)),
          totalRecords
        };
      }),
      catchError(error => {
        console.error('Error fetching donor test results:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Bulk create/update donor test results
   * POST /api/v1/define-test-results-donor/bulk/upsert?testId={testId}
   */
  saveBulkDonorTestResults(testId: string, dto: DefineTestResultsDonorBulkUpsertDto): Observable<DefineTestResultsDonorBulkUpsertResultDto> {
    return this.apiService.post<any>(
      API.APPLICATION_ADMIN.DEFINE_TEST_RESULTS_DONOR_BULK_UPSERT(testId),
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
      catchError(error => {
        console.error('Error saving donor test results:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Maps DefineTestResultsDonorDto to DonorTestResultModel
   */
  private mapDtoToDonorTestResultModel(dto: any): DonorTestResultModel {
    return {
      testId: dto.TestId ?? dto.testId ?? '',
      chapterId: dto.ChapterId ?? dto.chapterId ?? '',
      resultCode: dto.ResultCode ?? dto.resultCode ?? '',
      interdiction1: dto.Interdiction1 ?? dto.interdiction1 ?? '',
      interdiction2: dto.Interdiction2 ?? dto.interdiction2 ?? '',
      interdiction3: dto.Interdiction3 ?? dto.interdiction3 ?? '',
      effectiveDate: dto.EffectiveDate ?? dto.effectiveDate ?? null,
      terminationDate: dto.TerminationDate ?? dto.terminationDate ?? null,
      modificationDate: dto.ModificationDate ?? dto.modificationDate ?? null,
      auditKey: dto.AuditKey ?? dto.auditKey ?? 1
    };
  }
}
