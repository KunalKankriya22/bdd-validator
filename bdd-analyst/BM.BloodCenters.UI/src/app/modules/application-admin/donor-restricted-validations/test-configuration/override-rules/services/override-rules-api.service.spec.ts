import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { OverrideRulesApiService } from './override-rules-api.service';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  TestIdOption,
  OverrideRuleModel,
  InterdictionCode,
  OverrideRuleRequestParams
} from '../models/override-rules.model';

describe('OverrideRulesApiService', () => {
  let headerServiceSpy: any;
  let loginServiceSpy: any;
  let service: OverrideRulesApiService;
  let apiService: jasmine.SpyObj<ApiService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockTestIds: TestIdOption[] = [
    { testId: 'TST001', testDesc: 'Blood Type Test' },
    { testId: 'TST002', testDesc: 'Antibody Screening' }
  ];

  const mockInterdictionCodes: InterdictionCode[] = [
    { interCode: 'INT001', interDesc: 'Permanent Deferral' },
    { interCode: 'INT002', interDesc: 'Temporary Deferral' }
  ];

  const mockOverrideRules: OverrideRuleModel[] = [
    {
      testId: 'TST001',
      chapterId: 'ALL',
      currentResultStatus: 'POSITIVE',
      newResultStatus: 'NEGATIVE',
      overrideFlag: 'Y',
      interCode: 'INT001',
      interDescription: 'Permanent Deferral',
      effDate: new Date('2025-01-01'),
      termDate: null,
      programId: 'PROG001',
      insertDate: new Date('2025-01-15'),
      insertUser: 'admin',
      auditKey: 1
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    headerServiceSpy = createMockHeaderService();

    // Set default return values
    loginServiceSpy.getStoredUsername.and.returnValue('testUser');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OverrideRulesApiService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(OverrideRulesApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
  });
  describe('getTestIds', () => {
    it('should retrieve test IDs without search', (done) => {
      const mockResponse = { data: mockTestIds };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTestIds().subscribe(result => {
        expect(result).toEqual(mockTestIds);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.TEST_IDS,
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should retrieve test IDs with search keyword', (done) => {
      const mockResponse = { data: mockTestIds };
      const searchKeyword = 'TST';
      apiService.get.and.returnValue(of(mockResponse));

      service.getTestIds(searchKeyword).subscribe(result => {
        expect(result).toEqual(mockTestIds);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.TEST_IDS,
          jasmine.objectContaining({ params: jasmine.any(Object) })
        );
        done();
      });
    });

    it('should include chapterId param and searchKeyword in HttpParams', (done) => {
      const mockResponse = { data: mockTestIds };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTestIds('blood').subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.get('searchKeyword')).toBe('blood');
        expect(params.get('chapterId')).toBe('TST');
        done();
      });
    });

    it('should not set searchKeyword param when not provided', (done) => {
      const mockResponse = { data: mockTestIds };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTestIds().subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.has('searchKeyword')).toBe(false);
        expect(params.get('chapterId')).toBe('TST');
        done();
      });
    });

    it('should handle error when fetching test IDs', (done) => {
      const errorMessage = 'Error fetching test IDs';
      apiService.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getTestIds().subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('getInterdictionCodes', () => {
    it('should retrieve interdiction codes', (done) => {
      const mockResponse = { data: mockInterdictionCodes };
      apiService.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodes().subscribe(result => {
        expect(result).toEqual(mockInterdictionCodes);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.APP_ADMIN_INTERDICTION_CODES);
        done();
      });
    });



    it('should handle error when fetching interdiction codes', (done) => {
      const errorMessage = 'Error fetching interdiction codes';
      apiService.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getInterdictionCodes().subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('getOverrideRules', () => {
    it('should retrieve override rules with pagination', (done) => {
      const take = 10;
      const skip = 0;
      const params: OverrideRuleRequestParams = { testId: 'TST001' };
      const mockResponse = { data: mockOverrideRules, total: 1 };

      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(take, skip, params).subscribe(result => {
        expect(result.data).toEqual(mockOverrideRules);
        expect(result.totalRecords).toBe(1);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.GET_RULES(take, skip),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should include all request parameters and verify body mappings', (done) => {
      const take = 25;
      const skip = 50;
      const params: OverrideRuleRequestParams = {
        testId: 'TST001',
        searchKeyword: 'POSITIVE',
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        sort: 'TEST_ID_ASC'
      };
      const mockResponse = { data: mockOverrideRules, total: 1 };

      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(take, skip, params).subscribe(() => {
        const body = apiService.post.calls.mostRecent().args[1];
        expect(body.testId).toBe('TST001');
        expect(body.searchKeyword).toBe('POSITIVE');
        expect(body.overrideFlag).toBe('Y');
        expect(body.interCode).toBe('INT001');
        expect(body.sort).toBe('TEST_ID_ASC');
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.GET_RULES(take, skip),
          jasmine.any(Object)
        );
        done();
      });
    });



    it('should handle error when fetching override rules', (done) => {
      const errorMessage = 'Error fetching override rules';
      apiService.post.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getOverrideRules(10, 0, { testId: 'TST001' }).subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('saveBulkOverrideRules', () => {
    it('should save bulk override rules', (done) => {
      const rulesToSave: any[] = [
        {
          testId: 'TST001',
          chapterId: 'ALL',
          currentResultStatus: 'POSITIVE',
          newResultStatus: 'NEGATIVE',
          overrideFlag: 'Y',
          interCode: 'INT001',
          effDate: '2025-01-01T00:00:00.000Z',
          termDate: null,
          auditKey: 0
        }
      ];
      const expectedPayload = [
        {
          testId: 'TST001',
          chapterId: 'TST', // Overwritten by headerService.getCurrentChapterId()
          currentResultStatus: 'POSITIVE',
          newResultStatus: 'NEGATIVE',
          overrideFlag: 'Y',
          interCode: 'INT001',
          effDate: '2025-01-01T00:00:00.000Z',
          termDate: null,
          auditKey: 0,
          userId: 'testUser' // Added by service from loginService.getStoredUsername()
        }
      ];
      const mockResponse = { message: '1 test result override rule(s) processed successfully (Created: 1, Updated: 0)' };

      apiService.post.and.returnValue(of(mockResponse));

      service.saveBulkOverrideRules(rulesToSave).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.SAVE,
          expectedPayload
        );
        done();
      });
    });

    it('should handle save with mixed create and update', (done) => {
      const rulesToSave: any[] = [
        {
          testId: 'TST001',
          chapterId: 'ALL',
          currentResultStatus: 'POSITIVE',
          newResultStatus: 'NEGATIVE',
          overrideFlag: 'Y',
          interCode: 'INT001',
          effDate: '2025-01-01T00:00:00.000Z',
          termDate: null,
          auditKey: 0 // New record
        },
        {
          testId: 'TST001',
          chapterId: 'ALL',
          currentResultStatus: 'REACTIVE',
          newResultStatus: 'NON-REACTIVE',
          overrideFlag: 'N',
          interCode: 'INT002',
          effDate: '2025-02-01T00:00:00.000Z',
          termDate: '2025-12-31T00:00:00.000Z',
          auditKey: 1 // Existing record
        }
      ];
      const mockResponse = { message: '2 test result override rule(s) processed successfully (Created: 1, Updated: 1)' };

      apiService.post.and.returnValue(of(mockResponse));

      service.saveBulkOverrideRules(rulesToSave).subscribe(result => {
        expect(result.message).toContain('Created: 1, Updated: 1');
        done();
      });
    });

    it('should handle error when saving override rules', (done) => {
      const rulesToSave: any[] = [
        {
          testId: 'TST001',
          chapterId: 'ALL',
          currentResultStatus: 'POSITIVE',
          newResultStatus: 'NEGATIVE',
          overrideFlag: 'Y',
          interCode: 'INT001',
          effDate: '2025-01-01T00:00:00.000Z',
          termDate: null,
          auditKey: 0
        }
      ];
      const errorMessage = 'Error saving override rules';
      apiService.post.and.returnValue(throwError(() => new Error(errorMessage)));

      service.saveBulkOverrideRules(rulesToSave).subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });

    it('should save empty array of rules', (done) => {
      const rulesToSave: any[] = [];
      const mockResponse = { message: '0 test result override rule(s) processed successfully (Created: 0, Updated: 0)' };

      apiService.post.and.returnValue(of(mockResponse));

      service.saveBulkOverrideRules(rulesToSave).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.SAVE,
          rulesToSave
        );
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should re-throw error when fetching test IDs fails', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getTestIds().subscribe({
        error: (err) => {
          expect(err.message).toBe('API Error');
          done();
        }
      });
    });

    it('should re-throw error when fetching interdiction codes fails', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getInterdictionCodes().subscribe({
        error: (err) => {
          expect(err.message).toBe('API Error');
          done();
        }
      });
    });

    it('should re-throw error when fetching override rules fails', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('API Error')));

      service.getOverrideRules(10, 0, { testId: 'TST001' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('API Error');
          done();
        }
      });
    });

    it('should re-throw error when saving override rules fails', (done) => {
      const rulesToSave: any[] = [{ testId: 'TST001', auditKey: 0 }];
      apiService.post.and.returnValue(throwError(() => new Error('API Error')));

      service.saveBulkOverrideRules(rulesToSave).subscribe({
        error: (err) => {
          expect(err.message).toBe('API Error');
          done();
        }
      });
    });
  });

  describe('getInterdictionCodesForFilter', () => {
    it('should retrieve interdiction codes for filter without testId', (done) => {
      const mockResponse = { data: mockInterdictionCodes };
      apiService.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesForFilter().subscribe(result => {
        expect(result).toEqual(mockInterdictionCodes);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.APP_ADMIN_INTERDICTION_CODES_FILTER,
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should pass testId param when provided', (done) => {
      const mockResponse = { data: mockInterdictionCodes };
      apiService.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesForFilter('TST001').subscribe(result => {
        expect(result).toEqual(mockInterdictionCodes);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.APP_ADMIN_INTERDICTION_CODES_FILTER,
          jasmine.objectContaining({ params: jasmine.any(Object) })
        );
        done();
      });
    });

    it('should include testId in HttpParams when provided and omit when not', (done) => {
      const mockResponse = { data: mockInterdictionCodes };
      apiService.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesForFilter('TST001').subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.get('testId')).toBe('TST001');
        done();
      });
    });

    it('should not set testId param when not provided', (done) => {
      const mockResponse = { data: mockInterdictionCodes };
      apiService.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesForFilter().subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.has('testId')).toBe(false);
        done();
      });
    });

    it('should handle error when fetching interdiction codes for filter', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Filter API Error')));

      service.getInterdictionCodesForFilter().subscribe({
        error: (err) => {
          expect(err.message).toBe('Filter API Error');
          done();
        }
      });
    });

    it('should return empty array when response data is undefined', (done) => {
      apiService.get.and.returnValue(of({ data: undefined }));

      service.getInterdictionCodesForFilter().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getTestResults', () => {
    it('should retrieve and map test results', (done) => {
      const mockResponse = {
        data: [
          { resulT_CODE: 'POS', resulT_DESCRIPTION: 'Positive' },
          { resulT_CODE: 'NEG', resulT_DESCRIPTION: 'Negative' }
        ]
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTestResults().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].resultCode).toBe('POS');
        expect(result[0].resultDescription).toBe('Positive');
        expect(result[1].resultCode).toBe('NEG');
        expect(result[1].resultDescription).toBe('Negative');
        done();
      });
    });

    it('should call correct endpoint with chapterId param', (done) => {
      const mockResponse = { data: [] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTestResults().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.TEST_RESULTS,
          jasmine.any(Object)
        );
        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.get('chapterId')).toBe('TST');
        done();
      });
    });

    it('should return empty array when response data is undefined', (done) => {
      apiService.get.and.returnValue(of({ data: undefined }));

      service.getTestResults().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching test results', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Test Results Error')));

      service.getTestResults().subscribe({
        error: (err) => {
          expect(err.message).toBe('Test Results Error');
          done();
        }
      });
    });
  });

  describe('buildRequestBody - date params', () => {
    it('should include effectiveDatePeriod and effectiveDate', (done) => {
      const params: OverrideRuleRequestParams = {
        testId: 'TST001',
        effectiveDatePeriod: 'BEFORE' as any,
        effectiveDate: '2025-06-01'
      };
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(10, 0, params).subscribe(() => {
        const body = apiService.post.calls.mostRecent().args[1];
        expect(body.periodEffDate).toBe('BEFORE');
        expect(body.effectiveDate).toBe('2025-06-01');
        done();
      });
    });

    it('should include terminationDatePeriod and terminationDate', (done) => {
      const params: OverrideRuleRequestParams = {
        testId: 'TST001',
        terminationDatePeriod: 'AFTER' as any,
        terminationDate: '2025-12-31'
      };
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(10, 0, params).subscribe(() => {
        const body = apiService.post.calls.mostRecent().args[1];
        expect(body.periodTermDate).toBe('AFTER');
        expect(body.terminationDate).toBe('2025-12-31');
        done();
      });
    });

    it('should include chapterId in request body', (done) => {
      const params: OverrideRuleRequestParams = {
        testId: 'TST001',
        chapterId: 'CH01'
      };
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(10, 0, params).subscribe(() => {
        const body = apiService.post.calls.mostRecent().args[1];
        expect(body.chapterId).toBe('CH01');
        done();
      });
    });

    it('should return empty data and zero totalRecords when response has no data', (done) => {
      const params: OverrideRuleRequestParams = { testId: 'TST001' };
      const mockResponse = { data: undefined, total: undefined };
      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(10, 0, params).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should build body with all params and verify every field mapping', (done) => {
      const params: OverrideRuleRequestParams = {
        testId: 'TST001',
        chapterId: 'CH01',
        searchKeyword: 'POSITIVE',
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'before',
        effectiveDate: '2025-01-01',
        terminationDatePeriod: 'after',
        terminationDate: '2025-12-31',
        sort: 'TEST_ID_ASC'
      };
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(10, 0, params).subscribe(() => {
        const body = apiService.post.calls.mostRecent().args[1];
        expect(body.testId).toBe('TST001');
        expect(body.chapterId).toBe('CH01');
        expect(body.searchKeyword).toBe('POSITIVE');
        expect(body.overrideFlag).toBe('Y');
        expect(body.interCode).toBe('INT001');
        expect(body.periodEffDate).toBe('before');
        expect(body.effectiveDate).toBe('2025-01-01');
        expect(body.periodTermDate).toBe('after');
        expect(body.terminationDate).toBe('2025-12-31');
        expect(body.sort).toBe('TEST_ID_ASC');
        done();
      });
    });

    it('should build empty body when no optional params are provided', (done) => {
      const params: OverrideRuleRequestParams = {};
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.getOverrideRules(10, 0, params).subscribe(() => {
        const body = apiService.post.calls.mostRecent().args[1];
        expect(body.testId).toBeUndefined();
        expect(body.chapterId).toBeUndefined();
        expect(body.searchKeyword).toBeUndefined();
        expect(body.overrideFlag).toBeUndefined();
        expect(body.interCode).toBeUndefined();
        expect(body.periodEffDate).toBeUndefined();
        expect(body.effectiveDate).toBeUndefined();
        expect(body.periodTermDate).toBeUndefined();
        expect(body.terminationDate).toBeUndefined();
        expect(body.sort).toBeUndefined();
        done();
      });
    });
  });

  describe('getTestIds - empty response fallback', () => {
    it('should return empty array when response data is undefined', (done) => {
      apiService.get.and.returnValue(of({ data: undefined }));

      service.getTestIds().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getInterdictionCodes - empty response fallback', () => {
    it('should return empty array when response data is undefined', (done) => {
      apiService.get.and.returnValue(of({ data: undefined }));

      service.getInterdictionCodes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('saveBulkOverrideRules - user and chapter injection', () => {
    it('should add userId from loginService and chapterId from headerService to each rule', (done) => {
      const rulesToSave: any[] = [
        { testId: 'TST001', auditKey: 0 },
        { testId: 'TST002', auditKey: 1 }
      ];
      apiService.post.and.returnValue(of({ success: true }));

      service.saveBulkOverrideRules(rulesToSave).subscribe(() => {
        const payload = apiService.post.calls.mostRecent().args[1];
        expect(payload.length).toBe(2);
        expect(payload[0].userId).toBe('testUser');
        expect(payload[0].chapterId).toBe('TST');
        expect(payload[1].userId).toBe('testUser');
        expect(payload[1].chapterId).toBe('TST');
        expect(loginServiceSpy.getStoredUsername).toHaveBeenCalled();
        expect(headerServiceSpy.getCurrentChapterId).toHaveBeenCalled();
        done();
      });
    });
  });
});
