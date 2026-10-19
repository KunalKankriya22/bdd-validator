import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { SkipResultsFromExtractionApiService } from './skip-results-from-extraction-api.service';
import {
  ApiResponse,
  ContractDto,
  ReasonCodeDto,
  SkippedUnitDto,
  UnitValidationResultDto,
  SkipUnitsResultDto,
  ResetUnitsResultDto,
} from '../models/skip-results-from-extraction.model';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';

describe('SkipResultsFromExtractionApiService', () => {
  let service: SkipResultsFromExtractionApiService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SkipResultsFromExtractionApiService],
    });
    service = TestBed.inject(SkipResultsFromExtractionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getContracts', () => {
    it('should fetch contracts successfully', () => {
      const mockContracts: ContractDto[] = [
        { contractId: 'RG001', company: 'Regional Blood Center', centerId: 'CENTER1' },
        { contractId: 'RG002', company: 'Another Blood Center', centerId: 'CENTER2' },
      ];

      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true,
        message: 'Contracts retrieved successfully',
        data: mockContracts,
        statusCode: 200,
      };

      service.getContracts().subscribe((contracts) => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.CONTRACTS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty contracts array', () => {
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true,
        message: 'No contracts found',
        data: [],
        statusCode: 200,
      };

      service.getContracts().subscribe((contracts) => {
        expect(contracts).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.CONTRACTS}`);
      req.flush(mockResponse);
    });

  });

  describe('getReasonCodes', () => {
    it('should fetch SSKIP reason codes', () => {
      const mockReasons: ReasonCodeDto[] = [
        { code: 'QAH', codeDesc: 'QA Hold' },
        { code: 'EXP', codeDesc: 'Expired Sample' },
      ];

      const mockResponse: ApiResponse<ReasonCodeDto[]> = {
        success: true,
        message: 'Reason codes retrieved successfully',
        data: mockReasons,
        statusCode: 200,
      };

      service.getReasonCodes('S').subscribe((reasons) => {
        expect(reasons).toEqual(mockReasons);
        expect(reasons.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.REASON_CODES}/S`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch RSKIP reason codes', () => {
      const mockReasons: ReasonCodeDto[] = [
        { code: 'RESOLVED', codeDesc: 'Issue Resolved' },
      ];

      const mockResponse: ApiResponse<ReasonCodeDto[]> = {
        success: true,
        message: 'Reason codes retrieved successfully',
        data: mockReasons,
        statusCode: 200,
      };

      service.getReasonCodes('R').subscribe((reasons) => {
        expect(reasons).toEqual(mockReasons);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.REASON_CODES}/R`);
      req.flush(mockResponse);
    });
  });

  describe('getSkippedUnits', () => {
    it('should fetch skipped units for a contract', () => {
      const mockUnits: SkippedUnitDto[] = [
        {
          unitId: 'W1234-18-031310-Z',
          osUnitId: 'W1234-18-031310-Z',
          collDate: '2019-10-10T10:40:00Z',
          skipFlag: 'S',
          reasonCode: 'QAH',
          reasonDescription: 'QA Hold',
          insertUserId: 'USER1',
          insertDate: '2019-10-10T10:40:00Z',
          resetDate: null,
        },
      ];

      const mockResponse: ApiResponse<SkippedUnitDto[]> = {
        success: true,
        message: 'Skipped units retrieved successfully',
        data: mockUnits,
        statusCode: 200,
      };

      service.getSkippedUnits({ contractId: 'RG001' }).subscribe((result) => {
        expect(result.data).toEqual(mockUnits);
        expect(result.data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIPPED_UNITS}/1000/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ contractId: 'RG001' });
      req.flush(mockResponse);
    });

    it('should fetch skipped units for a contract and batch', () => {
      const mockUnits: SkippedUnitDto[] = [];

      const mockResponse: ApiResponse<SkippedUnitDto[]> = {
        success: true,
        message: 'Skipped units retrieved successfully',
        data: mockUnits,
        statusCode: 200,
      };

      service.getSkippedUnits({ contractId: 'RG001', batchId: 'BATCH123' }).subscribe((result) => {
        expect(result.data).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIPPED_UNITS}/1000/0`);
      expect(req.request.body).toEqual({ contractId: 'RG001', batchId: 'BATCH123' });
      req.flush(mockResponse);
    });
  });

  describe('validateUnit', () => {
    it('should validate a unit successfully', () => {
      const mockValidation: UnitValidationResultDto = {
        isValid: true,
        unitId: 'W1234-18-031310-Z',
        osUnitId: 'W1234-18-031310-Z',
        collDate: '2019-10-10T10:40:00Z',
        errorMessage: null,
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: true,
        message: 'Unit is valid for skip',
        data: mockValidation,
        statusCode: 200,
      };

      service.validateUnit({ contractId: 'RG001', unitId: 'W1234-18-031310-Z' }).subscribe((result) => {
        expect(result.isValid).toBeTrue();
        expect(result.unitId).toBe('W1234-18-031310-Z');
        expect(result.errorMessage).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.VALIDATE_UNIT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ contractId: 'RG001', unitId: 'W1234-18-031310-Z' });
      req.flush(mockResponse);
    });

    it('should handle invalid unit validation', () => {
      const mockValidation: UnitValidationResultDto = {
        isValid: false,
        unitId: null,
        osUnitId: null,
        collDate: null,
        errorMessage: 'Unit not found or not eligible for skip',
      };

      const mockResponse: ApiResponse<UnitValidationResultDto> = {
        success: false,
        message: 'Unit not found or not eligible for skip',
        data: mockValidation,
        statusCode: 400,
      };

      service.validateUnit({ contractId: 'RG001', unitId: 'INVALID' }).subscribe((result) => {
        expect(result.isValid).toBeFalse();
        expect(result.errorMessage).toBe('Unit not found or not eligible for skip');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.VALIDATE_UNIT}`);
      req.flush(mockResponse);
    });
  });

  describe('skipUnits', () => {
    it('should skip units successfully', () => {
      const mockResult: SkipUnitsResultDto[] = [
        { successCount: 2, failureCount: 0 },
      ];

      const mockResponse: ApiResponse<SkipUnitsResultDto[]> = {
        success: true,
        message: 'Skipped 2 unit(s). Failed: 0',
        data: mockResult,
        statusCode: 200,
      };

      const request = {
        contractId: 'RG001',
        units: [
          { unitId: 'UNIT1', collDate: '2024-01-15T00:00:00Z', reasonCode: 'QAH' },
          { unitId: 'UNIT2', collDate: '2024-01-16T00:00:00Z', reasonCode: 'QAH' },
        ],
      };

      service.skipUnits(request).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.message).toContain('Skipped 2 unit(s)');
        expect(response.data[0].successCount).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIP}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should skip units with batch and reason', () => {
      const mockResult: SkipUnitsResultDto[] = [
        { successCount: 1, failureCount: 0 },
      ];

      const mockResponse: ApiResponse<SkipUnitsResultDto[]> = {
        success: true,
        message: 'Skipped 1 unit(s). Failed: 0',
        data: mockResult,
        statusCode: 200,
      };

      const request = {
        contractId: 'RG001',
        units: [{ unitId: 'UNIT1', collDate: '2024-01-15T00:00:00Z', reasonCode: 'QAH' }],
        batchId: 'BATCH123',
        reasonCode: 'QAH',
      };

      service.skipUnits(request).subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIP}`);
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle skip failure', () => {
      const mockResponse: ApiResponse<SkipUnitsResultDto[]> = {
        success: false,
        message: 'Contract ID is required',
        data: [],
        statusCode: 400,
      };

      service.skipUnits({ contractId: '', units: [] }).subscribe((response) => {
        expect(response.success).toBeFalse();
        expect(response.message).toContain('Contract ID is required');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIP}`);
      req.flush(mockResponse);
    });
  });

  describe('resetUnits', () => {
    it('should reset units successfully', () => {
      const mockResult: ResetUnitsResultDto[] = [
        { successCount: 1, failureCount: 0 },
      ];

      const mockResponse: ApiResponse<ResetUnitsResultDto[]> = {
        success: true,
        message: 'Reset 1 unit(s). Failed: 0',
        data: mockResult,
        statusCode: 200,
      };

      const request = {
        contractId: 'RG001',
        units: [{ unitId: 'UNIT1', collDate: '2024-01-15T00:00:00Z' }],
        reasonCode: 'RESOLVED',
      };

      service.resetUnits(request).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.message).toContain('Reset 1 unit(s)');
        expect(response.data[0].successCount).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.RESET}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle reset failure when reason code is missing', () => {
      const mockResponse: ApiResponse<ResetUnitsResultDto[]> = {
        success: false,
        message: 'Reason code is required',
        data: [],
        statusCode: 400,
      };

      service.resetUnits({ contractId: 'RG001', units: [], reasonCode: '' }).subscribe((response) => {
        expect(response.success).toBeFalse();
        expect(response.message).toContain('Reason code is required');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.RESET}`);
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors for getContracts', () => {
      service.getContracts().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.CONTRACTS}`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors for validateUnit', () => {
      service.validateUnit({ contractId: 'RG001', unitId: 'UNIT1' }).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.VALIDATE_UNIT}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
