import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TestResultReconciliationApiService } from './test-result-reconciliation-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  TestBatchDto,
  TestForReconciliationDto,
  ReconciliationUnitDto,
  ValidTestResultDto,
  ReconcileResultsRequestDto,
  ReconciliationSummaryDto,
  ApiResponse
} from '../models/test-result-reconciliation.model';

describe('TestResultReconciliationApiService', () => {
  let service: TestResultReconciliationApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockBatches: TestBatchDto[] = [
    {
      tbId: 'TB20260601001',
      insertDate: '2026-06-01T10:30:00Z',
      insertDateFormatted: '06-01-2026',
      pendingUnitCount: 15
    },
    {
      tbId: 'TB20260531002',
      insertDate: '2026-05-31T14:20:00Z',
      insertDateFormatted: '05-31-2026',
      pendingUnitCount: 8
    }
  ];

  const mockTests: TestForReconciliationDto[] = [
    {
      testId: 'HIV',
      testDesc: 'HIV 1/2 Antibody Test',
      pendingUnitCount: 5,
      antigenFlag: 'N',
      fullTech2: 'N'
    }
  ];

  const mockUnits: ReconciliationUnitDto[] = [
    {
      tbSeqNo: 1,
      unitId: '001234567890',
      checkDigit: '12',
      collDate: '2026-05-28T00:00:00Z',
      tempResult1: 'NEG',
      tempResult2: 'POS',
      resultCodeDesc1: 'Negative',
      resultCodeDesc2: 'Positive',
      tech1UserId: 'TECH01',
      tech1UserName: 'Smith, John',
      tech2UserId: 'TECH02',
      tech2UserName: 'Johnson, Mary',
      supervisorResult: null,
      resultStatDesc: null
    }
  ];

  const mockValidResults: ValidTestResultDto[] = [
    { resultStatus: 'NEG', codeDesc: 'Negative' },
    { resultStatus: 'POS', codeDesc: 'Positive' }
  ];

  const mockReconcileSummary: ReconciliationSummaryDto = {
    totalUnitsReconciled: 1,
    resultCounts: { NEG: 1 },
    message: 'Results Entered - 1:NEG'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        TestResultReconciliationApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(TestResultReconciliationApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getOpenBatches', () => {
    it('should return array of test batches', (done) => {
      const mockResponse: ApiResponse<TestBatchDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Batches retrieved successfully',
        data: mockBatches,
        total: 2
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getOpenBatches().subscribe({
        next: (batches) => {
          expect(batches).toEqual(mockBatches);
          expect(batches.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.TEST_RESULT_RECONCILIATION.BATCHES
          );
          done();
        }
      });
    });


  });

  describe('getTestsInBatch', () => {
    it('should return array of tests for a batch', (done) => {
      const tbId = 'TB20260601001';
      const mockResponse: ApiResponse<TestForReconciliationDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: mockTests,
        total: 1
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestsInBatch(tbId).subscribe({
        next: (tests) => {
          expect(tests).toEqual(mockTests);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.TEST_RESULT_RECONCILIATION.TESTS_IN_BATCH(tbId)
          );
          done();
        }
      });
    });

    it('should handle error when no tests found', (done) => {
      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'No units pending reconciliation',
        errorCode: '1233'
      };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getTestsInBatch('TB999').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getUnitsForReconciliation', () => {
    it('should return array of units for reconciliation', (done) => {
      const tbId = 'TB20260601001';
      const testId = 'HIV';
      const mockResponse: ApiResponse<ReconciliationUnitDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Units retrieved successfully',
        data: mockUnits,
        total: 1
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitsForReconciliation(tbId, testId).subscribe({
        next: (units) => {
          expect(units).toEqual(mockUnits);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.TEST_RESULT_RECONCILIATION.UNITS(tbId, testId)
          );
          done();
        }
      });
    });

  });

  describe('getValidResults', () => {
    it('should return array of valid result codes', (done) => {
      const testId = 'HIV';
      const mockResponse: ApiResponse<ValidTestResultDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Valid results retrieved successfully',
        data: mockValidResults,
        total: 2
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getValidResults(testId).subscribe({
        next: (results) => {
          expect(results).toEqual(mockValidResults);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.TEST_RESULT_RECONCILIATION.VALID_RESULTS(testId),
            jasmine.objectContaining({ params: jasmine.anything() })
          );
          done();
        }
      });
    });
  });

  describe('reconcileResults', () => {
    it('should submit reconciliation and return summary', (done) => {
      const request: ReconcileResultsRequestDto = {
        tbId: 'TB20260601001',
        testId: 'HIV',
        antigenFlag: 'N',
        units: [
          {
            tbSeqNo: 1,
            unitId: '001234567890',
            supervisorResult: 'NEG'
          }
        ]
      };

      const mockResponse: ApiResponse<ReconciliationSummaryDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Results Entered - 1:NEG',
        data: [mockReconcileSummary],
        total: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.reconcileResults(request).subscribe({
        next: (summary) => {
          expect(summary).toEqual(mockReconcileSummary);
          expect(summary.totalUnitsReconciled).toBe(1);
          expect(summary.resultCounts['NEG']).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.TEST_RESULT_RECONCILIATION.RECONCILE,
            request
          );
          done();
        }
      });
    });

    it('should handle validation error - no units', (done) => {
      const request: ReconcileResultsRequestDto = {
        tbId: 'TB20260601001',
        testId: 'HIV',
        antigenFlag: 'N',
        units: []
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'At least one unit must be provided for reconciliation'
      };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.reconcileResults(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('At least one unit must be provided for reconciliation');
          done();
        }
      });
    });

    it('should handle validation error - missing supervisor result', (done) => {
      const request: ReconcileResultsRequestDto = {
        tbId: 'TB20260601001',
        testId: 'HIV',
        antigenFlag: 'N',
        units: [
          {
            tbSeqNo: 1,
            unitId: '001234567890',
            supervisorResult: ''
          }
        ]
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Supervisor result must be entered for all units'
      };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.reconcileResults(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Supervisor result must be entered for all units');
          done();
        }
      });
    });

  });
});
