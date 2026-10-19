import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EditTestResultsApiService } from './edit-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  UnitTestResultDto,
  EditableTestDropdownDto,
  UpdateTestResultDto,
  ApiResponse,
  ValidationWithTestsResponse
} from '../models/edit-test-results.model';

describe('EditTestResultsApiService', () => {
  let service: EditTestResultsApiService;
  let httpMock: HttpTestingController;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditTestResultsApiService,
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(EditTestResultsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnitAndGetTests', () => {
    it('should validate unit successfully', (done) => {
      const unitId = 'TEST001';
      const mockResponse: ValidationWithTestsResponse = {
        success: true,
        statusCode: 200,
        message: 'Unit validated successfully',
        validation: [{
          unitId: 'TEST001',
          chapterId: '0001',
          collDate: '2024-01-15T00:00:00Z',
          recordCount: 1,
          exists: true,
          isLabeled: false,
          isExtracted: false
        }],
        tests: [],
        shiftedTests: [],
        unshiftedTests: [],
        shiftedCount: 0,
        unshiftedCount: 0,
        total: 1
      };

      service.validateUnitAndGetTests(unitId).subscribe({
        next: (result) => {
          expect(result).toBeTruthy();
          expect(result.validation[0].unitId).toBe('TEST001');
          expect(result.validation[0].exists).toBeTrue();
          expect(result.validation[0].isLabeled).toBeFalse();
          expect(result.validation[0].isExtracted).toBeFalse();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('/edit-test-results/validation/unit/TEST001')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle unit not found error (404)', (done) => {
      const unitId = 'NOTFOUND';
      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Unit not found in chapter',
        errorCode: '0179',
        error: 'Unit not found in chapter'
      };

      service.validateUnitAndGetTests(unitId).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('0179');
          expect(error.message).toContain('Unit not found in chapter');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('/edit-test-results/validation/unit/NOTFOUND')
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });

    it('should handle labeled unit error (400)', (done) => {
      const unitId = 'LABELED001';
      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Unit is labeled',
        errorCode: '9321',
        error: 'Unit is labeled'
      };

      service.validateUnitAndGetTests(unitId).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('9321');
          expect(error.message).toContain('Unit is labeled');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('/edit-test-results/validation/unit/LABELED001')
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getEditableTests', () => {
    it('should get editable tests without filter', (done) => {
      const unitId = 'TEST001';
      const mockResponse: ApiResponse<UnitTestResultDto> = {
        success: true,
        statusCode: 200,
        message: 'Editable tests retrieved successfully',
        data: [
          {
            unitId: 'TEST001',
            testId: 'TST01',
            testSeqNo: 1,
            resultStatus1: 'POS',
            resultStatus2: undefined,
            testDesc: 'HIV Antibody Test',
            tbId: 'TB12345',
            testChapterId: '0001',
            chapterId: '0001',
            collDate: '2024-01-15T00:00:00Z',
            cancelFlag: undefined
          }
        ],
        total: 1
      };

      service.getEditableTests(unitId).subscribe({
        next: (result) => {
          expect(result).toBeTruthy();
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('TST01');
          expect(result[0].resultStatus1).toBe('POS');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('/edit-test-results/editable-tests/TEST001') && request.method === 'GET'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get editable tests with testId filter', (done) => {
      const unitId = 'TEST001';
      const testId = 'TST01';
      const mockResponse: ApiResponse<UnitTestResultDto> = {
        success: true,
        statusCode: 200,
        message: 'Editable tests retrieved successfully',
        data: [
          {
            unitId: 'TEST001',
            testId: 'TST01',
            testSeqNo: 1,
            resultStatus1: 'NEG',
            testDesc: 'HIV Antibody Test',
            tbId: 'TB12345'
          } as UnitTestResultDto
        ],
        total: 1
      };

      service.getEditableTests(unitId, testId).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('TST01');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('/edit-test-results/editable-tests/TEST001')
          && request.url.includes('testId=TST01')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getEditableTestsDropdown', () => {
    it('should get dropdown data successfully', (done) => {
      const unitId = 'TEST001';
      const mockResponse: ApiResponse<EditableTestDropdownDto> = {
        success: true,
        statusCode: 200,
        message: 'Dropdown data retrieved successfully',
        data: [
          { testId: 'TST01', testDesc: 'HIV Antibody Test' },
          { testId: 'TST02', testDesc: 'HCV Antibody Test' }
        ]
      };

      service.getEditableTestsDropdown(unitId).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('TST01');
          expect(result[1].testId).toBe('TST02');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('/edit-test-results/editable-tests-dropdown/TEST001')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateTestResult', () => {
    it('should update test result successfully', (done) => {
      const unitId = 'TEST001';
      const testId = 'TST01';
      const dto: UpdateTestResultDto = {
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR',
        testSeqNo: 1
      };

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Test result updated successfully',
        data: [true],
        total: 1
      };

      service.updateTestResult(unitId, testId, dto).subscribe({
        next: (result) => {
          expect(result).toBeTrue();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`/edit-test-results/unit/${unitId}/test/${testId}`)
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should handle validation error (400)', (done) => {
      const unitId = 'TEST001';
      const testId = 'TST01';
      const dto: UpdateTestResultDto = {
        resultStatus1: '',
        voidReason: '',
        testSeqNo: 1
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Result status is required',
        item: false
      };

      service.updateTestResult(unitId, testId, dto).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Result status is required');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`/edit-test-results/unit/${unitId}/test/${testId}`)
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle test not editable error (404)', (done) => {
      const unitId = 'TEST001';
      const testId = 'NOTEDITABLE';
      const dto: UpdateTestResultDto = {
        resultStatus1: 'POS',
        voidReason: 'LAB_ERROR'
      };

      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Test result not found or not editable'
      };

      service.updateTestResult(unitId, testId, dto).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Test result not found or not editable');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`/edit-test-results/unit/${unitId}/test/${testId}`)
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });
});
