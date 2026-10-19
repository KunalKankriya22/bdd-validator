import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdditionalTestSchedulingApiService } from './additional-test-scheduling-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidTestDto,
  TestGroupDto,
  ExistingTestDto,
  ValidateUnitResponseDto,
  ScheduleTestResponseDto,
  ApiResponse
} from '../models/additional-test-scheduling.model';

describe('AdditionalTestSchedulingApiService', () => {
  let service: AdditionalTestSchedulingApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockValidTests: ValidTestDto[] = [
    {
      testId: 'COVID01',
      testDesc: 'COVID-19 Antibody Test',
      testGroup: 'TSTGRP1',
      testGroupDesc: 'Infectious Disease Tests',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      isActive: true
    },
    {
      testId: 'HCV001',
      testDesc: 'Hepatitis C Virus Test',
      testGroup: 'TSTGRP1',
      testGroupDesc: 'Infectious Disease Tests',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      isActive: true
    }
  ];

  const mockTestGroups: TestGroupDto[] = [
    { testGroup: 'TSTGRP1', description: 'Infectious Disease Tests' },
    { testGroup: 'TSTGRP2', description: 'Blood Type Tests' }
  ];

  const mockExistingTests: ExistingTestDto[] = [
    { testId: 'COVID01', status: 'Scheduled', testSeqNo: 1, result: null, testBatchId: 'TB001' },
    { testId: 'HCV001', status: 'Unscheduled', testSeqNo: 2, result: null, testBatchId: null }
  ];

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: 'UNIT001',
    catalogNumber: 'CAT001',
    collectionDate: '2024-01-15T00:00:00Z',
    chapterId: 'TEST',
    collDate: '2024-01-15T00:00:00Z',
    isValid: true,
    errorMessage: null,
    hasComponents: false,
    componentCount: 0
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AdditionalTestSchedulingApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AdditionalTestSchedulingApiService);
  });

  describe('getValidTests', () => {
    it('should fetch valid tests with pagination', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidTestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: mockValidTests,
        totalCount: 2
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getValidTests(10, 0).subscribe((result: { data: ValidTestDto[]; totalCount: number }) => {
        expect(result.data.length).toBe(2);
        expect(result.totalCount).toBe(2);
        expect(result.data[0].testId).toBe('COVID01');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.GET_TESTS(10, 0),
          jasmine.objectContaining({
            searchKeyword: null,
            sortColumn: null,
            sortOrder: null
          })
        );
        done();
      });
    });

    it('should apply filters when provided', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidTestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: [mockValidTests[0]],
        totalCount: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getValidTests(10, 0, {
        searchKeyword: 'COVID'
      }).subscribe((result: { data: ValidTestDto[]; totalCount: number }) => {
        expect(result.data.length).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.GET_TESTS(10, 0),
          jasmine.objectContaining({
            searchKeyword: 'COVID'
          })
        );
        done();
      });
    });

  });

  describe('getTestById', () => {
    it('should fetch a single test by ID', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidTestDto> = {
        success: true,
        statusCode: 200,
        message: 'Test retrieved successfully',
        data: mockValidTests[0]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestById('COVID01').subscribe((result: ValidTestDto) => {
        expect(result.testId).toBe('COVID01');
        expect(result.testDesc).toBe('COVID-19 Antibody Test');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.GET_TEST_BY_ID('COVID01')
        );
        done();
      });
    });

    it('should throw error when test not found', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidTestDto> = {
        success: true,
        statusCode: 200,
        message: 'Test not found',
        data: undefined
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestById('INVALID').subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Test not found');
          done();
        }
      });
    });
  });

  describe('getTestGroups', () => {
    it('should fetch test groups', (done: DoneFn) => {
      const mockResponse: ApiResponse<TestGroupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Test groups retrieved successfully',
        data: mockTestGroups
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestGroups().subscribe((result: TestGroupDto[]) => {
        expect(result.length).toBe(2);
        expect(result[0].testGroup).toBe('TSTGRP1');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.GET_TEST_GROUPS
        );
        done();
      });
    });

  });

  describe('getExistingTests', () => {
    it('should fetch existing tests for a unit', (done: DoneFn) => {
      const mockResponse: ApiResponse<ExistingTestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Existing tests retrieved successfully',
        data: mockExistingTests
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getExistingTests('UNIT001', 'TEST', ['COVID01', 'HCV001']).subscribe((result: ExistingTestDto[]) => {
        expect(result.length).toBe(2);
        expect(result[0].testId).toBe('COVID01');
        expect(result[0].testSeqNo).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.GET_EXISTING_TESTS,
          { unitId: 'UNIT001', chapterId: 'TEST', testIds: ['COVID01', 'HCV001'] },
          jasmine.any(Object)
        );
        done();
      });
    });
  });

  describe('validateUnit', () => {
    it('should validate a unit successfully', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidateUnitResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Unit validated successfully',
        data: mockUnitValidation
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit('UNIT001').subscribe((result: ValidateUnitResponseDto) => {
        expect(result.unitId).toBe('UNIT001');
        expect(result.isValid).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.VALIDATE_UNIT,
          { unitId: 'UNIT001' },
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should handle unit not found error', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidateUnitResponseDto> = {
        success: false,
        statusCode: 404,
        message: 'Unit not found for the specified chapter'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit('INVALID').subscribe({
        error: (error: { message: string; status: number; errorCode?: string }) => {
          expect(error.message).toContain('Unit not found');
          done();
        }
      });
    });
  });

  describe('getSampleTypes', () => {
    it('should fetch sample types', (done: DoneFn) => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        statusCode: 200,
        message: 'Sample types retrieved',
        data: [{ sampleType: 'SERUM', description: 'Blood Serum' }]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSampleTypes().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].sampleType).toBe('SERUM');
        done();
      });
    });

    it('should return empty array when no data', (done: DoneFn) => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        statusCode: 200,
        message: 'No sample types',
        data: undefined
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSampleTypes().subscribe((result) => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getValidTests edge cases', () => {
    it('should return empty data when response has no data', (done: DoneFn) => {
      const mockResponse: ApiResponse<ValidTestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No tests found',
        data: undefined,
        totalCount: 0
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getValidTests(10, 0).subscribe((result) => {
        expect(result.data.length).toBe(0);
        expect(result.totalCount).toBe(0);
        done();
      });
    });

    it('should handle API error in getValidTests', (done: DoneFn) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ message: 'Server error' })));

      service.getValidTests(10, 0).subscribe({
        error: (err) => {
          expect(err.message).toContain('Server error');
          done();
        }
      });
    });
  });

  describe('getExistingTests edge cases', () => {
    it('should return empty array when no existing tests', (done: DoneFn) => {
      const mockResponse: ApiResponse<ExistingTestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No tests',
        data: undefined
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getExistingTests('UNIT001', 'TEST', ['COVID01']).subscribe((result) => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('getTestGroups edge cases', () => {
    it('should return empty array on error', (done: DoneFn) => {
      const mockResponse: ApiResponse<TestGroupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: undefined
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestGroups().subscribe((result) => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('scheduleTest', () => {
    it('should schedule a test successfully', (done: DoneFn) => {
      const mockScheduleResponse: ScheduleTestResponseDto = {
        scheduled: true,
        message: 'Test scheduled successfully'
      };
      const mockResponse: ApiResponse<ScheduleTestResponseDto[]> = {
        success: true,
        statusCode: 201,
        message: 'Test scheduled successfully',
        data: [mockScheduleResponse]
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.scheduleTest('UNIT001', 'TEST', 'COVID01', 'TB001').subscribe((result: ScheduleTestResponseDto) => {
        expect(result.scheduled).toBe(true);
        expect(result.message).toBe('Test scheduled successfully');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ADDITIONAL_TEST_SCHEDULING.SCHEDULE,
          {
            unitId: 'UNIT001',
            chapterId: 'TEST',
            testId: 'COVID01',
            testBatchId: 'TB001'
          },
          jasmine.any(Object)
        );
        done();
      });
    });


    it('should handle duplicate test error', (done: DoneFn) => {
      const mockResponse: ApiResponse<ScheduleTestResponseDto[]> = {
        success: false,
        statusCode: 400,
        message: 'Duplicate test ID not allowed',
        errorCode: '1180'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.scheduleTest('UNIT001', 'TEST', 'COVID01').subscribe({
        error: (error: { message: string; status: number }) => {
          expect(error.message).toBe('Duplicate test ID not allowed');
          done();
        }
      });
    });
  });
});
