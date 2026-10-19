import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';

import { LabWarehouseTransferQueryApiService } from './lab-warehouse-transfer-query-api.service';
import {
  LabWhTransHdrDto,
  LabWhTransQueryDto,
  LabWhTransQueryResponse,
  LabWhTransCompleteDto,
  WarehouseLookupDto
} from '../models/lab-warehouse-transfer-query.model';

describe('LabWarehouseTransferQueryApiService', () => {
  let service: LabWarehouseTransferQueryApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.LAB_WAREHOUSE_TRANSFER_QUERY.BASE}`;

  const mockHeader: LabWhTransHdrDto = {
    batchId: 'BATCH001',
    createDate: '2024-01-15T10:30:00Z',
    batchName: 'Morning Transfer',
    fromWarehouse: 'A',
    fromWarehouseDesc: 'Warehouse A',
    toWarehouse: 'B',
    toWarehouseDesc: 'Warehouse B',
    batchStatus: 'OPEN',
    checkoutTemp: 4.5,
    reconDate: null,
    reconUser: null,
    unitCount: 5
  };

  const mockWarehouses: WarehouseLookupDto[] = [
    { code: 'A', description: 'Warehouse A' },
    { code: 'B', description: 'Warehouse B' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LabWarehouseTransferQueryApiService]
    });

    service = TestBed.inject(LabWarehouseTransferQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryTransfers', () => {
    it('should query warehouse transfers with filters', (done) => {
      const query: LabWhTransQueryDto = {
        fromWarehouse: 'A',
        toWarehouse: 'B',
        status: 'OPEN'
      };
      const take = 10;
      const skip = 0;

      const mockResponse: LabWhTransQueryResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockHeader],
        total: 1
      };

      service.queryTransfers(query, take, skip).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should use default pagination values', (done) => {
      const query: LabWhTransQueryDto = {};

      const mockResponse: LabWhTransQueryResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [],
        total: 0
      };

      service.queryTransfers(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/100/0`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle query with all filter fields', (done) => {
      const query: LabWhTransQueryDto = {
        fromWarehouse: 'A',
        toWarehouse: 'B',
        batchId: 'BATCH001',
        unitId: 'UNIT001',
        status: 'OPEN',
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        searchKeyword: 'test',
        sortColumn: 'CreateDate',
        sortOrder: 'DESC'
      };

      const mockResponse: LabWhTransQueryResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockHeader],
        total: 1
      };

      service.queryTransfers(query, 50, 10).subscribe(response => {
        expect(response.data.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/50/10`);
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

  });

  describe('getHeader', () => {
    it('should get single warehouse transfer header', (done) => {
      const batchId = 'BATCH001';

      service.getHeader(batchId).subscribe(header => {
        expect(header).toEqual(mockHeader);
        expect(header.batchId).toBe(batchId);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/header/${encodeURIComponent(batchId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHeader);
    });

    it('should encode special characters in batch ID', (done) => {
      const batchId = 'BATCH/001';

      service.getHeader(batchId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/header/${encodeURIComponent(batchId)}`);
      expect(req.request.url).toContain(encodeURIComponent(batchId));
      req.flush(mockHeader);
    });

    it('should handle 404 error when batch not found', (done) => {
      const batchId = 'NOTFOUND';

      service.getHeader(batchId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/header/${encodeURIComponent(batchId)}`);
      req.flush(
        { message: 'Batch not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('getComplete', () => {
    it('should get complete warehouse transfer with details', (done) => {
      const batchId = 'BATCH001';

      const mockComplete: LabWhTransCompleteDto = {
        header: mockHeader,
        details: [
          {
            unitId: 'UNIT001',
            chkDigit: '12',
            productCode: 'RBC001',
            aliquot: '01',
            receiveWarehouse: 'B',
            receiveDate: '2024-01-15T11:00:00Z',
            receiveUser: 'USER01',
            receiveTemp: 4.2,
            reconReason: null,
            reconDetail: null
          }
        ]
      };

      service.getComplete(batchId).subscribe(complete => {
        expect(complete).toEqual(mockComplete);
        expect(complete.header.batchId).toBe(batchId);
        expect(complete.details.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/complete/${encodeURIComponent(batchId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockComplete);
    });

    it('should handle batch with no details', (done) => {
      const batchId = 'BATCH002';

      const mockComplete: LabWhTransCompleteDto = {
        header: mockHeader,
        details: []
      };

      service.getComplete(batchId).subscribe(complete => {
        expect(complete.details.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/complete/${encodeURIComponent(batchId)}`);
      req.flush(mockComplete);
    });
  });

  describe('getWarehouses', () => {
    it('should get warehouse lookup values', (done) => {
      service.getWarehouses().subscribe(warehouses => {
        expect(warehouses).toEqual(mockWarehouses);
        expect(warehouses.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/warehouses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockWarehouses);
    });


    it('should handle error when loading warehouses', (done) => {
      service.getWarehouses().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/warehouses`);
      req.flush(
        { error: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });
});
