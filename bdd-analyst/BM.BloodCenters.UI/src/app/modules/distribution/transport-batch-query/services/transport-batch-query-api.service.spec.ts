import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransportBatchQueryApiService } from './transport-batch-query-api.service';
import {
  TransportBatchQueryDto,
  TransportBatchQueryResponse,
  TransportBatchDetailResponse,
  WarehouseLookupResponse,
  BatchStatusLookupResponse,
  RecentBatchResponse
} from '../models/transport-batch-query.model';
import { environment } from 'src/environments/environment';

describe('TransportBatchQueryApiService', () => {
  let service: TransportBatchQueryApiService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransportBatchQueryApiService]
    });

    service = TestBed.inject(TransportBatchQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryBatches', () => {
    it('should send POST request with filters and return batch data', () => {
      const filters: TransportBatchQueryDto = {
        fromWarehouse: 'A',
        toWarehouse: 'B',
        batchId: 'BATCH001',
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        status: 'OPEN',
        take: 20,
        skip: 0
      };

      const mockResponse: TransportBatchQueryResponse = {
        success: true,
        data: [
          {
            batchId: 'BATCH001',
            createDate: '2024-01-15T10:30:00Z',
            batchName: 'January Transfer',
            fromWarehouse: 'A',
            toWarehouse: 'B',
            batchStatus: 'OPEN',
            checkoutTemp: 4.5,
            reconDate: null,
            reconUser: null
          }
        ],
        total: 1,
        message: 'Data retrieved successfully',
        statusCode: 200
      };

      service.queryBatches(filters).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0].batchId).toBe('BATCH001');
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/batches`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });


  });

  describe('getBatchDetails', () => {
    it('should send GET request for batch details', () => {
      const batchId = 'BATCH001';

      const mockResponse: TransportBatchDetailResponse = {
        success: true,
        data: [
          {
            unitId: '1234567890123',
            chkDigit: '45',
            productCode: 'RBC001',
            aliquot: '01',
            receiveWarehouse: 'B',
            receiveDate: '2024-01-16T08:00:00Z',
            receiveUser: 'USER01',
            reconReason: null,
            reconDetail: null
          },
          {
            unitId: '1234567890124',
            chkDigit: '67',
            productCode: 'PLT001',
            aliquot: '01',
            receiveWarehouse: 'B',
            receiveDate: '2024-01-16T08:15:00Z',
            receiveUser: 'USER01',
            reconReason: 'DISC',
            reconDetail: 'Unit damaged'
          }
        ],
        total: 2,
        message: 'Details retrieved successfully',
        statusCode: 200
      };

      service.getBatchDetails(batchId).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].unitId).toBe('1234567890123');
        expect(result.data[1].reconReason).toBe('DISC');
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/batches/${batchId}/details`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in batch ID', () => {
      const batchId = 'BATCH/001';

      const mockResponse: TransportBatchDetailResponse = {
        success: true,
        data: [],
        total: 0,
        message: 'Details retrieved',
        statusCode: 200
      };

      service.getBatchDetails(batchId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/batches/BATCH%2F001/details`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getWarehouses', () => {
    it('should send GET request and return warehouse lookup data', () => {
      const mockResponse: WarehouseLookupResponse = {
        success: true,
        data: [
          { code: 'A', description: 'Main Warehouse - Building A' },
          { code: 'B', description: 'Storage Facility B' },
          { code: 'C', description: 'Off-Site Storage C' }
        ],
        message: 'Warehouses retrieved successfully',
        statusCode: 200
      };

      service.getWarehouses().subscribe(warehouses => {
        expect(warehouses.length).toBe(3);
        expect(warehouses[0].code).toBe('A');
        expect(warehouses[0].description).toBe('Main Warehouse - Building A');
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/warehouses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getBatchStatuses', () => {
    it('should send GET request and return batch status lookup data', () => {
      const mockResponse: BatchStatusLookupResponse = {
        success: true,
        data: [
          { status: 'OPEN' },
          { status: 'CLOSED' },
          { status: 'RECON' },
          { status: 'VOID' }
        ],
        message: 'Statuses retrieved successfully',
        statusCode: 200
      };

      service.getBatchStatuses().subscribe(statuses => {
        expect(statuses.length).toBe(4);
        expect(statuses[0].status).toBe('OPEN');
        expect(statuses[2].status).toBe('RECON');
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/batch-statuses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getRecentBatches', () => {
    it('should send GET request with default take parameter', () => {
      const mockResponse: RecentBatchResponse = {
        success: true,
        data: [
          { batchId: 'BATCH12345', createDate: '2024-01-15T10:30:00Z' },
          { batchId: 'BATCH12344', createDate: '2024-01-14T09:00:00Z' }
        ],
        message: 'Recent batches retrieved successfully',
        statusCode: 200
      };

      service.getRecentBatches().subscribe(batches => {
        expect(batches.length).toBe(2);
        expect(batches[0].batchId).toBe('BATCH12345');
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/recent-batches?take=50`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('take')).toBe('50');
      req.flush(mockResponse);
    });


  });

  describe('Error Handling', () => {
    it('should propagate HTTP errors from queryBatches', () => {
      const filters: TransportBatchQueryDto = { take: 10, skip: 0 };

      service.queryBatches(filters).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/batches`);
      req.flush({ message: 'Invalid request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should propagate HTTP errors from getBatchDetails', () => {
      const batchId = 'INVALID';

      service.getBatchDetails(batchId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transport-batch-query/batches/${batchId}/details`);
      req.flush({ message: 'Batch not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
