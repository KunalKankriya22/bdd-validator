import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AntigenResultEntryService } from './antigen-result-entry.service';
import { environment } from '../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  WorksheetInfoDto,
  PendingUnitDto,
  UnitTestDto,
  SubmitResultsRequestDto,
  SubmitResultsResponseDto,
  CloseWorksheetResponseDto,
  ValidResultDto,
  PendingCountDto,
  ApiResponse,
} from '../models/antigen-result-entry.model';

describe('AntigenResultEntryService', () => {
  let service: AntigenResultEntryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AntigenResultEntryService],
    });

    service = TestBed.inject(AntigenResultEntryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateWorksheet', () => {
    it('should validate worksheet via GET with path param', () => {
      const tbId = 'WS20240601001';
      const mockResponse: ApiResponse<WorksheetInfoDto> = {
        success: true,
        statusCode: 200,
        message: 'Worksheet validated successfully',
        data: {
          tbId: 'WS20240601001',
          pendingUnitCount: 25,
          isValid: true,
        },
      };

      service.validateWorksheet(tbId).subscribe((result) => {
        expect(result).toEqual(mockResponse.data!);
        expect(result.isValid).toBe(true);
        expect(result.pendingUnitCount).toBe(25);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.VALIDATE_WORKSHEET(tbId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle validation error for invalid worksheet', () => {
      const tbId = 'INVALID_WS';
      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '1233',
        errorResponse: {
          errorCode: '1233',
          error: 'Invalid worksheet or no pending antigen tests',
        },
      };

      service.validateWorksheet(tbId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.errorCode).toBe('1233');
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.VALIDATE_WORKSHEET(tbId)}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getPendingUnits', () => {
    it('should retrieve pending units for worksheet', () => {
      const tbId = 'WS20240601001';
      const mockUnits: PendingUnitDto[] = [
        {
          unitId: 'AB12345678901234',
          tbId: 'WS20240601001',
          collDate: '2025-01-11T00:00:00',
          holdingStatus: null,
        },
        {
          unitId: 'AB12345678901235',
          tbId: 'WS20240601001',
          collDate: '2025-01-11T00:00:00',
          holdingStatus: null,
        },
      ];

      const mockResponse: ApiResponse<PendingUnitDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockUnits,
        totalCount: 2,
      };

      service.getPendingUnits(tbId).subscribe((result) => {
        expect(result).toEqual(mockUnits);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.PENDING_UNITS(tbId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUnitTests', () => {
    it('should retrieve tests for a specific unit', () => {
      const tbId = 'WS20240601001';
      const unitId = 'AB12345678901234';
      const mockTests: UnitTestDto[] = [
        { testId: 'C', testSeqNo: 1, unitId: 'AB12345678901234', resultStatus1: null, reagentLot1: null, resultDats: null },
        { testId: 'e', testSeqNo: 2, unitId: 'AB12345678901234', resultStatus1: 'N', reagentLot1: 'LOT001', resultDats: '2025-01-11T10:30:00' },
      ];

      const mockResponse: ApiResponse<UnitTestDto[]> = {
        success: true,
        statusCode: 200,
        data: mockTests,
      };

      service.getUnitTests(tbId, unitId).subscribe((result) => {
        expect(result).toEqual(mockTests);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.UNIT_TESTS(tbId, unitId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('submitResults', () => {
    it('should submit results successfully', () => {
      const request: SubmitResultsRequestDto = {
        tbId: 'WS20240601001',
        results: [
          {
            unitId: 'AB12345678901234',
            testId: '101',
            resultStatus1: 'NEG',
            reagentLot1: 'LOT123456',
          },
          {
            unitId: 'AB12345678901235',
            testId: '101',
            resultStatus1: 'POS',
            reagentLot1: 'LOT123456',
          },
        ],
      };

      const mockResponse: ApiResponse<SubmitResultsResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Results saved successfully. Worksheet reconciled.',
        data: {
          tbId: 'WS20240601001',
          unitsProcessed: 2,
          resultsSkipped: 0,
          reconciled: true,
          reconcileDate: '2026-06-01T14:30:00Z',
        },
      };

      service.submitResults(request).subscribe((result) => {
        expect(result).toEqual(mockResponse.data!);
        expect(result.unitsProcessed).toBe(2);
        expect(result.reconciled).toBe(true);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.SUBMIT_RESULTS}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle missing reagent error', () => {
      const request: SubmitResultsRequestDto = {
        tbId: 'WS20240601001',
        results: [
          {
            unitId: 'AB12345678901234',
            testId: '101',
            resultStatus1: 'POS',
            reagentLot1: '',
          },
        ],
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '1017',
        errorResponse: {
          errorCode: '1017',
          error: 'Reagent lot is required',
        },
      };

      service.submitResults(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.errorCode).toBe('1017');
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.SUBMIT_RESULTS}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('closeWorksheet', () => {
    it('should close worksheet successfully', () => {
      const tbId = 'WS20240601001';
      const mockResponse: ApiResponse<CloseWorksheetResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Worksheet closed successfully. 5 units marked as Not Tested.',
        data: {
          tbId: 'WS20240601001',
          unitsMarkedNT: 5,
        },
      };

      service.closeWorksheet(tbId).subscribe((result) => {
        expect(result).toEqual(mockResponse.data!);
        expect(result.unitsMarkedNT).toBe(5);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.CLOSE_WORKSHEET(tbId)}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getValidResults', () => {
    it('should retrieve valid results for a test', () => {
      const testId = 101;
      const mockResults: ValidResultDto[] = [
        { code: 'POS', description: 'Positive' },
        { code: 'NEG', description: 'Negative' },
        { code: 'IND', description: 'Indeterminate' },
        { code: 'NT', description: 'Not Tested' },
      ];

      const mockResponse: ApiResponse<ValidResultDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockResults,
      };

      service.getValidResults(testId).subscribe((result) => {
        expect(result).toEqual(mockResults);
        expect(result.length).toBe(4);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.VALID_RESULTS(testId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getWorksheets', () => {
    it('should retrieve worksheet options', () => {
      const mockWorksheets = [
        { tbId: '100216-TB 1021' },
        { tbId: '100216-TB 1022' },
      ];

      const mockResponse: ApiResponse<typeof mockWorksheets> = {
        success: true,
        statusCode: 200,
        data: mockWorksheets,
      };

      service.getWorksheets().subscribe((result) => {
        expect(result).toEqual(mockWorksheets);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.WORKSHEETS}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getPendingCount', () => {
    it('should retrieve pending count for a worksheet', () => {
      const tbId = 'WS20240601001';
      const mockCount: PendingCountDto = { tbId, pendingCount: 3 };
      const mockResponse: ApiResponse<PendingCountDto> = {
        success: true,
        statusCode: 200,
        data: mockCount,
      };

      service.getPendingCount(tbId).subscribe((result) => {
        expect(result).toEqual(mockCount);
        expect(result.pendingCount).toBe(3);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.PENDING_COUNT(tbId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
