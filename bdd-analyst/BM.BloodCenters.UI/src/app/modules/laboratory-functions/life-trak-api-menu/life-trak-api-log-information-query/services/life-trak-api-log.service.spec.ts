import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LifeTrakApiLogService } from './life-trak-api-log.service';
import { API } from '@core/constants/api.constants';
import {
  SourceCodeDto,
  ApiLogDto,
  ApiLogQueryDto,
  ApiLogSearchResponse,
  SourceCodeResponse
} from '../models/life-trak-api-log.model';

describe('LifeTrakApiLogService', () => {
  let service: LifeTrakApiLogService;
  let httpMock: HttpTestingController;

  const mockSourceCodes: SourceCodeDto[] = [
    { code: 'APP001', codeDesc: 'Application One' },
    { code: 'APP002', codeDesc: 'Application Two' }
  ];

  
  const mockApiLogs: ApiLogDto[] = [
    {
      internalId: 'INT001',
      externalId: 'EXT001',
      insertDate: '2026-06-17T10:30:00Z',
      logText: 'Test log message 1',
      sourceId: 'APP001'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LifeTrakApiLogService]
    });
    service = TestBed.inject(LifeTrakApiLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSourceCodes', () => {
    it('should retrieve source codes successfully', (done) => {
      const mockResponse: SourceCodeResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockSourceCodes
      };

      service.getSourceCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockSourceCodes);
          expect(codes.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SOURCE_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should throw error when response success is false', (done) => {
      const mockResponse: SourceCodeResponse = {
        success: false,
        message: 'Failed to retrieve source codes',
        statusCode: 400,
        data: []
      };

      service.getSourceCodes().subscribe({
        error: (error) => {
          expect(error.userMessage).toBeDefined();
          expect(error.userMessage).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SOURCE_CODES);
      req.flush(mockResponse);
    });

    it('should handle HTTP 500 error', (done) => {
      const errorMessage = 'Internal server error';

      service.getSourceCodes().subscribe({
        error: (error) => {
          expect(error.userMessage).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SOURCE_CODES);
      req.flush({ message: errorMessage }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP 400 validation error', (done) => {
      const errorMessage = 'Invalid request';

      service.getSourceCodes().subscribe({
        error: (error) => {
          expect(error.userMessage).toBe(errorMessage);
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SOURCE_CODES);
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });

  });

  describe('searchLogs', () => {
    it('should search logs successfully without dates', (done) => {
      const query: ApiLogQueryDto = {
        sourceId: 'APP001',
        fromDate: null,
        toDate: null,
        take: 25,
        skip: 0
      };

      const mockResponse: ApiLogSearchResponse = {
        success: true,
        message: 'Search completed',
        statusCode: 200,
        data: mockApiLogs,
        totalCount: 1
      };

      service.searchLogs(query).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data).toEqual(mockApiLogs);
          expect(response.totalCount).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        sourceId: 'APP001',
        fromDate: null,
        toDate: null,
        take: 25,
        skip: 0
      });
      req.flush(mockResponse);
    });

    it('should search logs with date range', (done) => {
      const fromDate = new Date('2026-06-01T00:00:00Z');
      const toDate = new Date('2026-06-17T23:59:59Z');

      const query: ApiLogQueryDto = {
        sourceId: 'APP001',
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        take: 25,
        skip: 0
      };

      const mockResponse: ApiLogSearchResponse = {
        success: true,
        message: 'Search completed',
        statusCode: 200,
        data: mockApiLogs,
        totalCount: 1
      };

      service.searchLogs(query).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      expect(req.request.body.fromDate).toBeTruthy();
      expect(req.request.body.toDate).toBeTruthy();
      req.flush(mockResponse);
    });


    it('should handle pagination parameters', (done) => {
      const query: ApiLogQueryDto = {
        sourceId: 'APP001',
        take: 50,
        skip: 100
      };

      const mockResponse: ApiLogSearchResponse = {
        success: true,
        message: 'Search completed',
        statusCode: 200,
        data: mockApiLogs,
        totalCount: 150
      };

      service.searchLogs(query).subscribe({
        next: (response) => {
          expect(response.totalCount).toBe(150);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      expect(req.request.body.take).toBe(50);
      expect(req.request.body.skip).toBe(100);
      req.flush(mockResponse);
    });


    it('should handle validation error from backend', (done) => {
      const query: ApiLogQueryDto = {
        sourceId: ''
      };

      service.searchLogs(query).subscribe({
        error: (error) => {
          expect(error.userMessage).toContain('Invalid search criteria');
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      req.flush(
        { message: 'Invalid search criteria' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle server error', (done) => {
      const query: ApiLogQueryDto = {
        sourceId: 'APP001'
      };

      service.searchLogs(query).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.userMessage).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      req.flush(
        { message: 'Database connection failed' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should handle network error during search', (done) => {
      const query: ApiLogQueryDto = {
        sourceId: 'APP001'
      };

      service.searchLogs(query).subscribe({
        error: (error) => {
          expect(error.userMessage).toContain('Unable to connect to server');
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('convertToISOString (private method testing via searchLogs)', () => {
    it('should convert Date object to ISO string', (done) => {
      const date = new Date('2026-06-17T10:30:00Z');
      const query: ApiLogQueryDto = {
        sourceId: 'APP001',
        fromDate: date.toISOString()
      };

      const mockResponse: ApiLogSearchResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        totalCount: 0
      };

      service.searchLogs(query).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      expect(req.request.body.fromDate).toBe(date.toISOString());
      req.flush(mockResponse);
    });

    it('should handle ISO string dates', (done) => {
      const isoString = '2026-06-17T10:30:00.000Z';
      const query: ApiLogQueryDto = {
        sourceId: 'APP001',
        fromDate: isoString
      };

      const mockResponse: ApiLogSearchResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        totalCount: 0
      };

      service.searchLogs(query).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      expect(req.request.body.fromDate).toBe(isoString);
      req.flush(mockResponse);
    });

  });

  describe('Error Handling', () => {

    it('should provide user-friendly error messages', (done) => {
      const technicalError = { error: 'ORA-00001: unique constraint violated' };

      service.searchLogs({ sourceId: 'APP001' }).subscribe({
        error: (error) => {
          expect(error.userMessage).toBeDefined();
          expect(error.userMessage).not.toContain('ORA-00001');
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SEARCH);
      req.flush(technicalError, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle client-side errors', (done) => {
      service.getSourceCodes().subscribe({
        error: (error) => {
          expect(error.userMessage).toContain('Network error');
          done();
        }
      });

      const req = httpMock.expectOne(API.LIFE_TRAK_API_LOG.SOURCE_CODES);
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Connection timeout'
      });
      req.error(errorEvent);
    });
  });
});
