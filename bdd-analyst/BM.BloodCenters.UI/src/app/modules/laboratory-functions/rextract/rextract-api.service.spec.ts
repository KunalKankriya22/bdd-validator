import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RextractApiService } from './rextract-api.service';
import {
  ApiResponse,
  ResetUnderExtractDto,
  ResetUnderExtractRequestDto,
  ResetUnderExtractResult,
} from './rextract.model';

describe('RextractApiService', () => {
  let service: RextractApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/reset-under-extract';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RextractApiService]
    });
    service = TestBed.inject(RextractApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getEligibleRecords', () => {
    it('should return list of eligible records', (done) => {
      const mockRecords: ResetUnderExtractDto[] = [
        { resultParmId: 'RP001', batchId: 'BATCH001', insertDate: '2025-06-20T08:30:00', underExtractFlag: 'Y' },
        { resultParmId: 'RP002', batchId: null, insertDate: '2025-06-20T07:15:00', underExtractFlag: 'Y' },
      ];
      const mockResponse: ApiResponse<ResetUnderExtractDto[]> = {
        success: true, statusCode: 200, data: mockRecords, totalCount: 2
      };

      service.getEligibleRecords().subscribe(records => {
        expect(records).toEqual(mockRecords);
        expect(records.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no eligible records exist', (done) => {
      const mockResponse: ApiResponse<ResetUnderExtractDto[]> = {
        success: true, statusCode: 200, data: [], totalCount: 0
      };

      service.getEligibleRecords().subscribe(records => {
        expect(records).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

    it('should return empty array when success is false', (done) => {
      const mockResponse: ApiResponse<ResetUnderExtractDto[]> = {
        success: false, statusCode: 500
      };

      service.getEligibleRecords().subscribe(records => {
        expect(records).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });
  });

  describe('resetUnderExtract', () => {
    it('should post reset request and return result', (done) => {
      const request: ResetUnderExtractRequestDto = {
        items: [
          { resultParmId: 'RP001', batchId: 'BATCH001' },
          { resultParmId: 'RP002', batchId: null },
        ]
      };
      const mockResponse: ApiResponse<ResetUnderExtractResult> = {
        success: true, statusCode: 200,
        data: { successCount: 2, failureCount: 0, totalProcessed: 2 }
      };

      service.resetUnderExtract(request).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data?.successCount).toBe(2);
        expect(response.data?.failureCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/reset`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return 400 when no items provided', (done) => {
      const request: ResetUnderExtractRequestDto = { items: [] };
      const errorResponse: ApiResponse<ResetUnderExtractResult> = {
        success: false, statusCode: 400,
        errors: [{ code: '1056', message: 'At least one item must be selected for reset' }]
      };

      service.resetUnderExtract(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/reset`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

  });
});
