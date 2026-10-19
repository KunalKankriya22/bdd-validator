import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TestTypesApiService } from './test-types-api.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  MultipleObservationTestTypeDto,
  CreateMultipleObservationTestTypeDto,
  UpdateMultipleObservationTestTypeDto,
  ApiResponse
} from '../models/test-types.model';

describe('TestTypesApiService', () => {
  let service: TestTypesApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  const mockTestType: MultipleObservationTestTypeDto = {
    testId: 'ABORH',
    testType: 'GAMMA',
    testTypeDesc: 'Gamma',
    defaultControlValue: 'Yes',
    resUpdate: 'N',
    othBnd: 'N',
    fullTechTwo: 'N',
    effDate: '2025-01-11T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2025-01-11T10:30:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestTypesApiService]
    });

    service = TestBed.inject(TestTypesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestTypes', () => {
    it('should retrieve test types for a test ID', (done) => {
      const testId = 'ABORH';
      const mockResponse: ApiResponse<MultipleObservationTestTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockTestType],
        total: 1
      };

      service.getTestTypes(testId).subscribe(result => {
        expect(result).toEqual([mockTestType]);
        expect(result.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.TEST_TYPES.GET_ALL(testId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include query parameters when provided', (done) => {
      const testId = 'ABORH';
      const params = {
        includeInactive: true,
        take: 25,
        skip: 10
      };

      service.getTestTypes(testId, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(
        request =>
          request.url === `${baseUrl}${API.TEST_TYPES.GET_ALL(testId)}` &&
          request.params.get('includeInactive') === 'true' &&
          request.params.get('take') === '25' &&
          request.params.get('skip') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

  });

  describe('getTestTypesCount', () => {
    it('should retrieve total count', (done) => {
      const testId = 'ABORH';
      const mockResponse: ApiResponse<MultipleObservationTestTypeDto[]> = {
        success: true,
        statusCode: 200,
        data: [],
        total: 42
      };

      service.getTestTypesCount(testId).subscribe(count => {
        expect(count).toBe(42);
        done();
      });

      const req = httpMock.expectOne(
        request =>
          request.url === `${baseUrl}${API.TEST_TYPES.GET_ALL(testId)}` &&
          request.params.get('take') === '1' &&
          request.params.get('skip') === '0'
      );
      req.flush(mockResponse);
    });
  });

  describe('getTestTypeById', () => {
    it('should retrieve a specific test type', (done) => {
      const testId = 'ABORH';
      const testType = 'GAMMA';
      const mockResponse: ApiResponse<MultipleObservationTestTypeDto[]> = {
        success: true,
        statusCode: 200,
        data: [mockTestType]
      };

      service.getTestTypeById(testId, testType).subscribe(result => {
        expect(result).toEqual(mockTestType);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.TEST_TYPES.GET_BY_ID(testId, testType)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('createTestType', () => {
    it('should create a new test type', (done) => {
      const createDto: CreateMultipleObservationTestTypeDto = {
        testId: 'ABORH',
        testType: 'NEWTYPE',
        testTypeDesc: 'New Test Type',
        defaultControlValue: 'Yes',
        resUpdate: 'Y',
        othBnd: 'N',
        fullTechTwo: 'N',
        effDate: '2026-06-15'
      };

      const mockResponse: ApiResponse<{ testId: string; testType: string }[]> = {
        success: true,
        statusCode: 201,
        message: 'Record created successfully',
        data: [{ testId: 'ABORH', testType: 'NEWTYPE' }]
      };

      service.createTestType(createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.statusCode).toBe(201);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.TEST_TYPES.CREATE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('updateTestType', () => {
    it('should update an existing test type', (done) => {
      const testId = 'ABORH';
      const testType = 'GAMMA';
      const updateDto: UpdateMultipleObservationTestTypeDto = {
        testTypeDesc: 'Updated Description',
        defaultControlValue: 'No',
        resUpdate: 'N',
        othBnd: 'Y',
        fullTechTwo: 'N',
        effDate: '2026-01-01'
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Record updated successfully'
      };

      service.updateTestType(testId, testType, updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.statusCode).toBe(200);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.TEST_TYPES.UPDATE(testId, testType)}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('deleteTestType', () => {
    it('should soft delete a test type', (done) => {
      const testId = 'ABORH';
      const testType = 'GAMMA';
      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
        data: true
      };

      service.deleteTestType(testId, testType).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.data).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.TEST_TYPES.DELETE(testId, testType)}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getTestsLookup', () => {
    it('should retrieve tests for dropdown', (done) => {
      const mockTests = [
        { testId: 'ABORH', testDesc: 'ABO and Rh Blood Grouping' },
        { testId: 'ANTSC', testDesc: 'Antibody Screen' }
      ];

      const mockResponse = {
        success: true,
        data: mockTests
      };

      service.getTestsLookup().subscribe(result => {
        expect(result).toEqual(mockTests);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.TEST_TYPES.LOOKUP_TESTS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('getControlValues', () => {
    it('should retrieve control values for a test', (done) => {
      const testId = 'ABORH';
      const mockControlValues = [
        { result: 'POS', resultDesc: 'Positive' },
        { result: 'NEG', resultDesc: 'Negative' }
      ];

      const mockResponse = {
        success: true,
        data: mockControlValues
      };

      service.getControlValues(testId).subscribe(result => {
        expect(result).toEqual(mockControlValues);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.TEST_TYPES.LOOKUP_CONTROL_VALUES(testId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
