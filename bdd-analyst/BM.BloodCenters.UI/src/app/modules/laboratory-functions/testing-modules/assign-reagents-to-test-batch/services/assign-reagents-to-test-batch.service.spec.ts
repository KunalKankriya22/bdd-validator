import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AssignReagentsToTestBatchService } from './assign-reagents-to-test-batch.service';
import { ApiService } from '@shared/services/api.service';
import {
  TestBatchDetailDto,
  TestBatchUnitDto,
  AssignReagentRequestDto,
  ApiResponse,
  TestKitOption
} from '../models/assign-reagents-to-test-batch.model';

describe('AssignReagentsToTestBatchService', () => {
  let service: AssignReagentsToTestBatchService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockTestBatchId = 'TB20240530001';
  const mockTestId = 'ABO';

  const mockTests: TestBatchDetailDto[] = [
    {
      tbId: mockTestBatchId,
      testChapterId: 'TEST',
      testId: 'ABO',
      testKitId: null,
      testType: 'M',
      testingLabCode: '01',
      testDesc: 'ABO Blood Grouping',
      testGroup: 'BG'
    },
    {
      tbId: mockTestBatchId,
      testChapterId: 'TEST',
      testId: 'RH',
      testKitId: null,
      testType: 'M',
      testingLabCode: '01',
      testDesc: 'Rh Typing',
      testGroup: 'BG'
    }
  ];

  const mockUnits: TestBatchUnitDto[] = [
    {
      tbSeqNo: 1,
      unitId: 'U001234567890',
      chkDigit: '5'
    },
    {
      tbSeqNo: 2,
      unitId: 'U001234567891',
      chkDigit: '3'
    }
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AssignReagentsToTestBatchService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(AssignReagentsToTestBatchService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getTestsInBatch', () => {
    it('should retrieve tests successfully', (done) => {
      const mockResponse: ApiResponse<TestBatchDetailDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: mockTests,
        total: 2
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestsInBatch(mockTestBatchId).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockTests);
          expect(result.total).toBe(2);
          done();
        },
        error: done.fail
      });
    });


    it('should handle server error', (done) => {
      const errorResponse = { error: { statusCode: 500, message: 'Server error' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getTestsInBatch(mockTestBatchId).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.error.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('assignReagentToTest', () => {
    const mockRequest: AssignReagentRequestDto = { testKitId: 'KIT001' };

    it('should assign reagent successfully', (done) => {
      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Reagent assigned successfully',
        item: true
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.assignReagentToTest(mockTestBatchId, mockTestId, mockRequest).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Reagent assigned successfully');
          done();
        },
        error: done.fail
      });
    });

    it('should handle invalid test kit error', (done) => {
      const errorResponse = { error: { errorCode: '3110', message: 'Invalid test kit' } };
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.assignReagentToTest(mockTestBatchId, mockTestId, { testKitId: 'INVALIDKIT' }).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.error.errorCode).toBe('3110');
          done();
        }
      });
    });
  });

  describe('getUnitsInBatch', () => {
    it('should retrieve units successfully', (done) => {
      const mockResponse: ApiResponse<TestBatchUnitDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Units retrieved successfully',
        data: mockUnits,
        total: 2
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitsInBatch(mockTestBatchId).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockUnits);
          expect(result.total).toBe(2);
          done();
        },
        error: done.fail
      });
    });

  });

  describe('getTestKitOptions', () => {

    it('should handle empty test kit options', (done) => {
      const mockResponse: ApiResponse<TestKitOption[]> = {
        success: true,
        statusCode: 200,
        message: 'No test kits found',
        data: []
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestKitOptions(mockTestId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });
  });
});
