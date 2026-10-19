import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ValidAdditionalTestsApiService, ApiResponse } from './valid-additional-tests-api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidAdditionalTestDto,
  CreateValidAdditionalTestRequestDto,
  UpdateValidAdditionalTestRequestDto,
  ValidAdditionalTestQueryDto,
  ValidTestDropdownDto,
} from '../models/valid-additional-tests.model';

describe('ValidAdditionalTestsApiService', () => {
  let service: ValidAdditionalTestsApiService;
  let httpMock: HttpTestingController;

  const mockValidTest: ValidAdditionalTestDto = {
    chapterId: '0001',
    testId: 'TEST001',
    testDesc: 'Hepatitis B Surface Antigen',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
  };

  const mockTestsDropdown: ValidTestDropdownDto[] = [
    { testId: 'TEST001', testDesc: 'Hepatitis B Surface Antigen' },
    { testId: 'TEST002', testDesc: 'HIV-1/2 Antibody' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ValidAdditionalTestsApiService]
    });
    service = TestBed.inject(ValidAdditionalTestsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should retrieve all valid additional tests with pagination', (done) => {
      const take = 25;
      const skip = 0;
      const params: ValidAdditionalTestQueryDto = {};

      const mockResponse: ApiResponse<ValidAdditionalTestDto[]> = {
        success: true,
        data: [mockValidTest],
        totalCount: 1
      };

      service.getAll(take, skip, params).subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].testId).toBe('TEST001');
          expect(response.totalCount).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.LIST(take, skip));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send filter parameters in request body', (done) => {
      const take = 25;
      const skip = 0;
      const params: ValidAdditionalTestQueryDto = {
        testId: 'TEST001',
        searchKeyword: 'hepatitis',
        sortColumn: 'TestId',
        sortOrder: 'ASC'
      };

      const mockResponse: ApiResponse<ValidAdditionalTestDto[]> = {
        success: true,
        data: [mockValidTest],
        totalCount: 1
      };

      service.getAll(take, skip, params).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.LIST(take, skip));
      expect(req.request.body).toEqual({
        testId: 'TEST001',
        searchKeyword: 'hepatitis',
        sortColumn: 'TestId',
        sortOrder: 'ASC'
      });
      req.flush(mockResponse);
    });
  });

  describe('getById', () => {
    it('should retrieve a single valid additional test by ID', (done) => {
      const testId = 'TEST001';

      const mockResponse: ApiResponse<ValidAdditionalTestDto> = {
        success: true,
        data: mockValidTest,
        item: mockValidTest
      };

      service.getById(testId).subscribe({
        next: (test) => {
          expect(test.testId).toBe('TEST001');
          expect(test.testDesc).toBe('Hepatitis B Surface Antigen');
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.GET_BY_ID(testId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTestsDropdown', () => {
    it('should retrieve active tests for dropdown', (done) => {
      const mockResponse: ApiResponse<ValidTestDropdownDto[]> = {
        success: true,
        data: mockTestsDropdown,
        totalCount: 2
      };

      service.getTestsDropdown().subscribe({
        next: (tests) => {
          expect(tests.length).toBe(2);
          expect(tests[0].testId).toBe('TEST001');
          expect(tests[1].testId).toBe('TEST002');
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.TESTS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should create a new valid additional test', (done) => {
      const createDto: CreateValidAdditionalTestRequestDto = {
        testId: 'TEST001',
        effDate: '2024-06-01',
        termDate: undefined
      };

      const mockResponse: ApiResponse<ValidAdditionalTestDto> = {
        success: true,
        statusCode: 201,
        message: 'Valid additional test created successfully.',
        item: mockValidTest,
        data: mockValidTest
      };

      service.create(createDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.statusCode).toBe(201);
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should update an existing valid additional test', (done) => {
      const testId = 'TEST001';
      const updateDto: UpdateValidAdditionalTestRequestDto = {
        effDate: '2024-06-01',
        termDate: '2024-12-31'
      };

      const mockResponse: ApiResponse<ValidAdditionalTestDto> = {
        success: true,
        statusCode: 200,
        message: 'Valid additional test updated successfully.',
        item: mockValidTest,
        data: mockValidTest
      };

      service.update(testId, updateDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.statusCode).toBe(200);
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.UPDATE(testId));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should soft delete a valid additional test', (done) => {
      const testId = 'TEST001';

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
        item: true,
        data: true
      };

      service.delete(testId).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.item).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.DELETE(testId));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle API errors properly', (done) => {
      const testId = 'INVALID';
      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Record not found',
        errorCode: null,
        error: 'Record not found'
      };

      service.getById(testId).subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Record not found');
          done();
        }
      });

      const req = httpMock.expectOne(API.VALID_ADDITIONAL_TESTS.GET_BY_ID(testId));
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });
});
