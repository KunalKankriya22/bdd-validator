import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BatchInProgressQueryApiService } from './batch-in-progress-query-api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  BatchInProgressDto,
  UnitInProgressDto,
  ContractDto,
  BatchLookupDto,
  BatchInProgressQueryDto,
} from '../models/batch-in-progress-query.model';

describe('BatchInProgressQueryApiService', () => {
  let service: BatchInProgressQueryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BatchInProgressQueryApiService],
    });

    service = TestBed.inject(BatchInProgressQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getContracts', () => {
    it('should retrieve contracts successfully', () => {
      const mockContracts: ContractDto[] = [
        { contractId: 'RC12345', company: 'Red Cross Blood Services' },
        { contractId: 'RC67890', company: 'Regional Blood Center' },
      ];

      const mockResponse: ReturnResult<ContractDto[]> = {
        success: true,
        message: 'Contracts retrieved successfully',
        statusCode: 200,
        data: mockContracts,
      };

      service.getContracts().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(2);
        expect(response.data?.[0].contractId).toBe('RC12345');
      });

      const req = httpMock.expectOne(API.BATCH_IN_PROGRESS_QUERY.CONTRACTS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving contracts', () => {
      const mockErrorResponse: ReturnResult<ContractDto[]> = {
        success: false,
        message: 'Failed to load contracts',
        statusCode: 500,
        data: null,
      };

      service.getContracts().subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.message).toBe('Failed to load contracts');
      });

      const req = httpMock.expectOne(API.BATCH_IN_PROGRESS_QUERY.CONTRACTS);
      req.flush(mockErrorResponse);
    });
  });

  describe('getBatchesLookup', () => {
    it('should retrieve batches for a contract successfully', () => {
      const contractId = 'RC12345';
      const mockBatches: BatchLookupDto[] = [
        {
          batchId: '060124RG01',
          receivedDate: '06-01-24',
          lastQcStatus: null,
          lastQcDate: null,
        },
        {
          batchId: '060224RG01',
          receivedDate: '06-02-24',
          lastQcStatus: 'Last QC',
          lastQcDate: '06-05-24 14:30',
        },
      ];

      const mockResponse: ReturnResult<BatchLookupDto[]> = {
        success: true,
        message: 'Batches retrieved successfully',
        statusCode: 200,
        data: mockBatches,
      };

      service.getBatchesLookup(contractId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(2);
        expect(response.data?.[0].batchId).toBe('060124RG01');
      });

      const req = httpMock.expectOne(
        `${API.BATCH_IN_PROGRESS_QUERY.BATCHES_LOOKUP}?contractId=${contractId}`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('contractId')).toBe(contractId);
      req.flush(mockResponse);
    });
  });

  describe('searchBatches', () => {
    it('should search for batches with query parameters', () => {
      const query: BatchInProgressQueryDto = {
        contractId: 'RC12345',
        batchId: null,
        includeNoTestResults: 'Y',
        queryMode: 'A',
        take: 10,
        skip: 0,
        sortColumn: 'BatchId',
        sortOrder: 'ASC',
      };

      const mockBatches: BatchInProgressDto[] = [
        {
          batchId: '060124RG01',
          chapterId: 'NCBB',
          receivedDate: '2024-06-01T00:00:00Z',
          collectionDate: '2024-06-01T00:00:00Z',
          age: 5,
          unitsCount: 15,
          resultsQcDate: null,
          contractId: 'RC12345',
          units: [],
        },
      ];

      const mockResponse: ReturnResult<BatchInProgressDto[]> = {
        success: true,
        message: 'Batches retrieved successfully',
        statusCode: 200,
        data: mockBatches,
        totalCount: 50,
      };

      service.searchBatches(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
        expect(response.totalCount).toBe(50);
        expect(response.data?.[0].batchId).toBe('060124RG01');
      });

      const req = httpMock.expectOne(API.BATCH_IN_PROGRESS_QUERY.SEARCH);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should search with specific batch ID', () => {
      const query: BatchInProgressQueryDto = {
        contractId: 'RC12345',
        batchId: '060124RG01',
        includeNoTestResults: 'N',
        queryMode: 'E',
        take: 25,
        skip: 0,
      };

      const mockResponse: ReturnResult<BatchInProgressDto[]> = {
        success: true,
        message: 'Batches retrieved successfully',
        statusCode: 200,
        data: [],
        totalCount: 0,
      };

      service.searchBatches(query).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data?.length).toBe(0);
      });

      const req = httpMock.expectOne(API.BATCH_IN_PROGRESS_QUERY.SEARCH);
      expect(req.request.body.batchId).toBe('060124RG01');
      expect(req.request.body.queryMode).toBe('E');
      req.flush(mockResponse);
    });
  });

  describe('getUnitsForBatch', () => {
    it('should retrieve units for a specific batch', () => {
      const batchId = '060124RG01';
      const contractId = 'RC12345';
      const includeNoTestResults = 'Y';
      const queryMode = 'A';

      const mockUnits: UnitInProgressDto[] = [
        {
          unitId: '12345678901234',
          checkDigit: '5',
          chapterId: 'NCBB',
          collDate: '2024-06-01T00:00:00Z',
          batchId: '060124RG01',
          skipReason: null,
          testBaseCount: 3,
          holdingTestCount: 1,
          testResults: [
            {
              unitId: '12345678901234',
              chapterId: 'NCBB',
              testId: 'HIV12O',
              testSeqNo: 1,
              resultStatus: 'PASS',
              resultDesc: 'Passed',
              interimResult: 'NR',
            },
          ],
          interdictions: [],
          unitTestBase: [
            {
              unitId: '12345678901234',
              chapterId: 'NCBB',
              collDate: '2024-06-01T00:00:00Z',
              testId: 'ABO',
              resultStatus: 'COMP',
              resultDesc: 'Complete',
            },
          ],
          holdingTests: [],
        },
      ];

      const mockResponse: ReturnResult<UnitInProgressDto[]> = {
        success: true,
        message: 'Units retrieved successfully',
        statusCode: 200,
        data: mockUnits,
      };

      service.getUnitsForBatch(batchId, contractId, includeNoTestResults, queryMode).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0].unitId).toBe('12345678901234');
        expect(response.data?.[0].testResults.length).toBe(1);
        expect(response.data?.[0].unitTestBase.length).toBe(1);
      });

      const expectedUrl = `${API.BATCH_IN_PROGRESS_QUERY.UNITS(batchId)}?contractId=${contractId}&includeNoTestResults=${includeNoTestResults}&queryMode=${queryMode}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('contractId')).toBe(contractId);
      expect(req.request.params.get('includeNoTestResults')).toBe(includeNoTestResults);
      expect(req.request.params.get('queryMode')).toBe(queryMode);
      req.flush(mockResponse);
    });

    it('should use default parameters when not provided', () => {
      const batchId = '060124RG01';
      const contractId = 'RC12345';

      const mockResponse: ReturnResult<UnitInProgressDto[]> = {
        success: true,
        message: 'Units retrieved successfully',
        statusCode: 200,
        data: [],
      };

      service.getUnitsForBatch(batchId, contractId).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        req => req.url.includes(API.BATCH_IN_PROGRESS_QUERY.UNITS(batchId)),
      );
      expect(req.request.params.get('includeNoTestResults')).toBe('Y');
      expect(req.request.params.get('queryMode')).toBe('A');
      req.flush(mockResponse);
    });

    it('should handle error when batch not found', () => {
      const batchId = 'INVALID';
      const contractId = 'RC12345';

      const mockErrorResponse: ReturnResult<UnitInProgressDto[]> = {
        success: false,
        message: 'Batch not found',
        statusCode: 404,
        data: null,
      };

      service.getUnitsForBatch(batchId, contractId).subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.message).toBe('Batch not found');
      });

      const req = httpMock.expectOne(
        req => req.url.includes(API.BATCH_IN_PROGRESS_QUERY.UNITS(batchId)),
      );
      req.flush(mockErrorResponse);
    });
  });
});
