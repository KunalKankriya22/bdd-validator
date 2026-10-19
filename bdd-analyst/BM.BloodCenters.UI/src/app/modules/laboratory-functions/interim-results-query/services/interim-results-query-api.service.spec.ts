import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { InterimResultsQueryApiService } from './interim-results-query-api.service';
import {
  InterimContractOption,
  InterimTestOption,
  InterimCodeOption,
  InterimBatchOption,
  InterimResultRecord,
  InterimResultsQueryRequest,
  InterimResultsQueryResponse
} from '../models/interim-results-query.model';

describe('InterimResultsQueryApiService', () => {
  let service: InterimResultsQueryApiService;
  let httpMock: HttpTestingController;
  let baseUrl: string;

  const mockContracts: InterimContractOption[] = [
    { contractId: 'RC12345', company: 'Regional Blood Center', centerId: 'C001' },
    { contractId: 'RC67890', company: 'Regional Testing Lab', centerId: 'C002' }
  ];

  const mockTests: InterimTestOption[] = [
    { testId: 'ABO', testDescription: 'ABO Blood Type' },
    { testId: 'RH', testDescription: 'Rh Factor' }
  ];

  const mockCodes: InterimCodeOption[] = [
    { code: 'INT01', codeDescription: 'Interim Code One' },
    { code: 'INT02', codeDescription: 'Interim Code Two' }
  ];

  const mockBatches: InterimBatchOption[] = [
    { batchId: 'BATCH001', unitCount: 5 },
    { batchId: 'BATCH002', unitCount: 3 }
  ];

  const mockResults: InterimResultRecord[] = [
    {
      unitId: 'U123456789012345',
      checkDigit: '2',
      testId: 'ABO',
      testSeqNo: 1,
      extractFlag: 'Y',
      firstExtractDate: '2026-06-01',
      lastExtractDate: '2026-06-02',
      resultCode: 'A',
      resultDescription: 'Type A'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InterimResultsQueryApiService]
    });

    service = TestBed.inject(InterimResultsQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
    baseUrl = environment.apiUrl;
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // getContracts
  // ---------------------------------------------------------------------------
  describe('getContracts', () => {
    it('should fetch contracts without search text', () => {
      service.getContracts().subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(2);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CONTRACTS) &&
          !request.url.includes('searchText')
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockContracts });
    });

    it('should fetch contracts with search text', () => {
      service.getContracts('regional').subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CONTRACTS) &&
          request.url.includes('searchText=regional')
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockContracts });
    });

    it('should return empty array when API returns no data', () => {
      service.getContracts().subscribe(contracts => {
        expect(contracts).toEqual([]);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CONTRACTS)
      );
      req.flush({ success: true });
    });

    it('should encode special characters in search text', () => {
      service.getContracts('test & co').subscribe();

      const req = httpMock.expectOne(
        request => request.url.includes('searchText=test%20%26%20co')
      );
      req.flush({ success: true, data: [] });
    });
  });

  // ---------------------------------------------------------------------------
  // getTestsForContract
  // ---------------------------------------------------------------------------
  describe('getTestsForContract', () => {
    it('should fetch tests for a given contract ID', () => {
      service.getTestsForContract('RC12345').subscribe(tests => {
        expect(tests).toEqual(mockTests);
        expect(tests.length).toBe(2);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/interim-results/tests/RC12345')
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTests });
    });

    it('should return empty array when no tests found', () => {
      service.getTestsForContract('UNKNOWN').subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/interim-results/tests/UNKNOWN')
      );
      req.flush({ success: true, data: [] });
    });

    it('should return empty array when API returns no data property', () => {
      service.getTestsForContract('RC12345').subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/interim-results/tests/RC12345')
      );
      req.flush({ success: true });
    });
  });

  // ---------------------------------------------------------------------------
  // getInterimCodes
  // ---------------------------------------------------------------------------
  describe('getInterimCodes', () => {
    it('should fetch interim codes', () => {
      service.getInterimCodes().subscribe(codes => {
        expect(codes).toEqual(mockCodes);
        expect(codes.length).toBe(2);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CODES)
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockCodes });
    });

    it('should return empty array when API returns no data', () => {
      service.getInterimCodes().subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CODES)
      );
      req.flush({ success: true });
    });
  });

  // ---------------------------------------------------------------------------
  // getBatchesForContract
  // ---------------------------------------------------------------------------
  describe('getBatchesForContract', () => {
    it('should fetch batches with contract ID only', () => {
      service.getBatchesForContract('RC12345').subscribe(batches => {
        expect(batches).toEqual(mockBatches);
        expect(batches.length).toBe(2);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_BATCHES)
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ contractId: 'RC12345' });
      req.flush({ success: true, data: mockBatches });
    });

    it('should fetch batches with contract ID and test ID', () => {
      service.getBatchesForContract('RC12345', 'ABO').subscribe(batches => {
        expect(batches).toEqual(mockBatches);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_BATCHES)
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ contractId: 'RC12345', testId: 'ABO' });
      req.flush({ success: true, data: mockBatches });
    });

    it('should fetch batches with all parameters', () => {
      service.getBatchesForContract('RC12345', 'ABO', 'INT01').subscribe(batches => {
        expect(batches).toEqual(mockBatches);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_BATCHES)
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ contractId: 'RC12345', testId: 'ABO', interimCode: 'INT01' });
      req.flush({ success: true, data: mockBatches });
    });

    it('should not include null testId or interimCode in body', () => {
      service.getBatchesForContract('RC12345', null, null).subscribe();

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_BATCHES)
      );

      expect(req.request.body).toEqual({ contractId: 'RC12345' });
      req.flush({ success: true, data: [] });
    });

    it('should return empty array when API returns no data', () => {
      service.getBatchesForContract('RC12345').subscribe(batches => {
        expect(batches).toEqual([]);
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_BATCHES)
      );
      req.flush({ success: true });
    });
  });

  // ---------------------------------------------------------------------------
  // queryResults
  // ---------------------------------------------------------------------------
  describe('queryResults', () => {
    it('should query results with correct POST body', () => {
      const request: InterimResultsQueryRequest = {
        contractId: 'RC12345',
        testId: 'ABO',
        interimCode: 'INT01',
        batchId: 'BATCH001',
        take: 100,
        skip: 0
      };

      const mockResponse: InterimResultsQueryResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResults,
        total: 1
      };

      service.queryResults(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(
        r => r.url.includes(API.LABORATORY.INTERIM_RESULTS_QUERY)
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should pass take and skip parameters in the request body', () => {
      const request: InterimResultsQueryRequest = {
        contractId: 'RC12345',
        batchId: 'BATCH001',
        take: 50,
        skip: 10
      };

      service.queryResults(request).subscribe();

      const req = httpMock.expectOne(
        r => r.url.includes(API.LABORATORY.INTERIM_RESULTS_QUERY)
      );
      expect(req.request.body.take).toBe(50);
      expect(req.request.body.skip).toBe(10);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [], total: 0 });
    });

    it('should return the full response object including total', () => {
      const request: InterimResultsQueryRequest = {
        contractId: 'RC12345',
        batchId: 'BATCH001',
        take: 100,
        skip: 0
      };

      const mockResponse: InterimResultsQueryResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResults,
        total: 42
      };

      service.queryResults(request).subscribe(response => {
        expect(response.total).toBe(42);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(200);
      });

      const req = httpMock.expectOne(
        r => r.url.includes(API.LABORATORY.INTERIM_RESULTS_QUERY)
      );
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // Error propagation
  // ---------------------------------------------------------------------------
  describe('Error Propagation', () => {
    it('should propagate HTTP errors for getContracts', () => {
      service.getContracts().subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CONTRACTS)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should propagate HTTP errors for getInterimCodes', () => {
      service.getInterimCodes().subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        request => request.url.includes(API.LABORATORY.INTERIM_RESULTS_CODES)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should propagate HTTP errors for queryResults', () => {
      const request: InterimResultsQueryRequest = {
        contractId: 'RC12345',
        batchId: 'BATCH001',
        take: 100,
        skip: 0
      };

      service.queryResults(request).subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(
        r => r.url.includes(API.LABORATORY.INTERIM_RESULTS_QUERY)
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });
});
