import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { ResultsExtractQueryApiService } from './results-extract-query-api.service';
import {
  ApiResponse,
  BatchDetailRequest,
  BatchDetailResponse,
  ContractOption,
  ResultsExtractData,
  ResultsExtractQueryRequest
} from '../models/results-extract-query.model';

describe('ResultsExtractQueryApiService', () => {
  let service: ResultsExtractQueryApiService;
  let httpMock: HttpTestingController;
  let baseUrl: string;

  const mockContracts: ContractOption[] = [
    { contractId: 'RC12345', company: 'Regional Blood Center', centerId: 'C001' },
    { contractId: 'RC67890', company: 'Regional Testing Lab', centerId: 'C002' }
  ];

  const mockResultsData: ResultsExtractData = {
    contractInfo: {
      contractId: 'RC12345',
      company: 'Regional Blood Center',
      centerId: 'C001',
      chapterId: '0001'
    },
    totalBatches: 2,
    batches: [
      {
        batchId: 'BATCH20260601',
        chapterId: '0001',
        unitCount: 5,
        extractDateTimeGmt: '2026-06-01T14:30:00',
        extractDateTime: '2026-06-01T14:30:00',
        resultParmId: 'PARM001',
        insertUser: 'LABTECH',
        units: [
          {
            unitId: 'U123456789012345',
            checkDigit: '2',
            collectionDate: '2026-05-30',
            qcTestDate: '2026-06-01',
            testResults: [
              {
                testId: 'ABO',
                testSeqNo: 1,
                resultStatus1: 'A',
                interimResult: null
              }
            ]
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResultsExtractQueryApiService]
    });

    service = TestBed.inject(ResultsExtractQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
    baseUrl = `${environment.apiUrl}${API.LABORATORY.RESULTS_EXTRACT_QUERY}`;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchContracts', () => {
    it('should fetch contracts with search term', () => {
      const searchTerm = 'regional';
      const take = 20;

      service.searchContracts(searchTerm, take).subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(2);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/contracts') &&
          request.url.includes('searchTerm=regional') &&
          request.url.includes('take=20')
      );

      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockContracts,
        totalCount: 2
      } as ApiResponse<ContractOption[]>);
    });

    it('should fetch contracts with default parameters', () => {
      service.searchContracts().subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/contracts') &&
          request.url.includes('take=50')
      );

      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockContracts
      } as ApiResponse<ContractOption[]>);
    });

    it('should return empty array when no contracts found', () => {
      service.searchContracts('nonexistent').subscribe(contracts => {
        expect(contracts).toEqual([]);
      });

      const req = httpMock.expectOne(request => request.url.includes('/contracts'));
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: []
      } as ApiResponse<ContractOption[]>);
    });

  });

  describe('queryResults', () => {
    it('should query results with all parameters', () => {
      const request: ResultsExtractQueryRequest = {
        contractId: 'RC12345',
        fromDate: '2026-05-01',
        toDate: '2026-06-02',
        batchId: 'BATCH20260601',
        take: 10,
        skip: 0
      };

      service.queryResults(request).subscribe(data => {
        expect(data).toEqual(mockResultsData);
        expect(data.batches.length).toBe(1);
        expect(data.contractInfo.contractId).toBe('RC12345');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);

      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockResultsData,
        totalCount: 2
      } as ApiResponse<ResultsExtractData>);
    });

    it('should query results with minimal parameters', () => {
      const request: ResultsExtractQueryRequest = {
        contractId: 'RC12345'
      };

      service.queryResults(request).subscribe(data => {
        expect(data).toEqual(mockResultsData);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);

      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockResultsData
      } as ApiResponse<ResultsExtractData>);
    });

    it('should handle error response for invalid contract', () => {
      const request: ResultsExtractQueryRequest = {
        contractId: 'INVALID'
      };

      service.queryResults(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        {
          success: false,
          statusCode: 404,
          errorCode: '1147',
          errorResponse: {
            errorCode: '1147',
            error: 'Contract not found'
          }
        },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle error response for invalid date range', () => {
      const request: ResultsExtractQueryRequest = {
        contractId: 'RC12345',
        fromDate: '2026-06-02',
        toDate: '2026-05-01'
      };

      service.queryResults(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        {
          success: false,
          statusCode: 400,
          errorCode: '2102',
          errorResponse: {
            errorCode: '2102',
            error: 'To date is less than From date'
          }
        },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('queryResultsWithCount', () => {
    it('should return data with total count', () => {
      const request: ResultsExtractQueryRequest = {
        contractId: 'RC12345',
        take: 10,
        skip: 0
      };

      service.queryResultsWithCount(request).subscribe(response => {
        expect(response.data).toEqual(mockResultsData);
        expect(response.totalCount).toBe(2);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');

      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockResultsData,
        totalCount: 2
      } as ApiResponse<ResultsExtractData>);
    });

    it('should default totalCount to 0 if not provided', () => {
      const dataWithoutCount = { ...mockResultsData, totalBatches: 0 };
      const request: ResultsExtractQueryRequest = {
        contractId: 'RC12345'
      };

      service.queryResultsWithCount(request).subscribe(response => {
        expect(response.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: dataWithoutCount
      } as ApiResponse<ResultsExtractData>);
    });
  });

  describe('getBatchDetail', () => {
    const batchDetailUrl = `${environment.apiUrl}${API.LABORATORY.RESULTS_EXTRACT_QUERY_BATCH_DETAIL}`;

    const mockBatchDetail: BatchDetailResponse = {
      batchId: 'BATCH20260601',
      units: [
        {
          unitId: 'U123456789012345',
          checkDigit: '2',
          collectionDate: '2026-05-30',
          qcTestDate: '2026-06-01',
          testResults: [
            { testId: 'ABO', testSeqNo: 1, resultStatus1: 'A', interimResult: null }
          ]
        }
      ]
    };

    it('should fetch batch detail with POST', () => {
      const request: BatchDetailRequest = {
        contractId: 'RC12345',
        batchId: 'BATCH20260601',
        extractDateTime: '2026-06-01T14:30:00'
      };

      service.getBatchDetail(request).subscribe(detail => {
        expect(detail).toEqual(mockBatchDetail);
        expect(detail.units.length).toBe(1);
      });

      const req = httpMock.expectOne(batchDetailUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);

      req.flush({
        success: true,
        statusCode: 200,
        message: 'Batch details retrieved successfully',
        item: mockBatchDetail
      } as ApiResponse<BatchDetailResponse>);
    });

  });
});
