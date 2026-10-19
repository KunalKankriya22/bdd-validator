import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReconcileTransportBatchApiService } from './reconcile-transport-batch-api.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  BatchHeaderDto,
  BatchReconciliationDto,
  ReasonCodeDto,
  ReconcileBatchRequestDto,
  ReconcileBatchResponseDto,
  ApiResponse,
} from '../models/reconcile-transport-batch.model';

describe('ReconcileTransportBatchApiService', () => {
  let service: ReconcileTransportBatchApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.RECONCILE_TRANSPORT_BATCH.BASE}`;

  const mockBatches: BatchHeaderDto[] = [
    {
      batchId: 'B001',
      createDate: '2026-05-20T10:30:00Z',
      toWarehouse: 'WH001',
      toWarehouseDescription: 'Main Warehouse',
    },
    {
      batchId: 'B002',
      createDate: '2026-05-22T14:15:00Z',
      toWarehouse: 'WH002',
      toWarehouseDescription: 'Secondary Warehouse',
    },
  ];

  const mockBatchDetails: BatchReconciliationDto = {
    batchId: 'B001',
    createDate: '2026-05-20T10:30:00Z',
    toWarehouse: 'WH001',
    toWarehouseDescription: 'Main Warehouse',
    currentWarehouse: 'Laboratory A',
    unreceivedUnits: [
      {
        unitId: 'U123456789',
        checkDigit: '01',
        productCode: 'RBC001',
        aliquot: '01',
        collectionDate: '2026-05-15',
        expirationDate: '2026-06-15T23:59:00Z',
        reconReason: null,
        reasonDescription: null,
        reconDetail: null,
      },
    ],
  };

  const mockReasonCodes: ReasonCodeDto[] = [
    { code: 'DMGD', description: 'Unit damaged during transport' },
    { code: 'LEAK', description: 'Leaking container' },
    { code: 'TEMP', description: 'Temperature out of range' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReconcileTransportBatchApiService],
    });

    service = TestBed.inject(ReconcileTransportBatchApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getBatches', () => {
    it('should retrieve closed batches', () => {
      service.getBatches().subscribe((batches) => {
        expect(batches).toEqual(mockBatches);
        expect(batches.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/batches`);
      expect(req.request.method).toBe('GET');

      const response: ApiResponse<BatchHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Closed batches retrieved successfully',
        data: mockBatches,
        total: 2,
      };

      req.flush(response);
    });

    it('should return empty array when no batches available', () => {
      service.getBatches().subscribe((batches) => {
        expect(batches).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/batches`);

      const response: ApiResponse<BatchHeaderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No batches found',
        data: [],
      };

      req.flush(response);
    });

  });

  describe('getBatchDetails', () => {
    it('should retrieve batch details with unreceived units', () => {
      const batchId = 'B001';

      service.getBatchDetails(batchId).subscribe((details) => {
        expect(details).toEqual(mockBatchDetails);
        expect(details?.unreceivedUnits.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(batchId)}`);
      expect(req.request.method).toBe('GET');

      const response: ApiResponse<BatchReconciliationDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Batch details retrieved successfully',
        data: [mockBatchDetails],
      };

      req.flush(response);
    });


    it('should encode batch ID in URL', () => {
      const batchId = 'B 001';

      service.getBatchDetails(batchId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(batchId)}`);
      expect(req.request.url).toContain('B%20001');

      const response: ApiResponse<BatchReconciliationDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockBatchDetails],
      };

      req.flush(response);
    });
  });

  describe('getReasonCodes', () => {
    it('should retrieve active reason codes', () => {
      service.getReasonCodes().subscribe((codes) => {
        expect(codes).toEqual(mockReasonCodes);
        expect(codes.length).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/reason-codes`);
      expect(req.request.method).toBe('GET');

      const response: ApiResponse<ReasonCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Reason codes retrieved successfully',
        data: mockReasonCodes,
        total: 3,
      };

      req.flush(response);
    });

    it('should return empty array when no reason codes available', () => {
      service.getReasonCodes().subscribe((codes) => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/reason-codes`);

      const response: ApiResponse<ReasonCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No reason codes found',
        data: [],
      };

      req.flush(response);
    });
  });

  describe('reconcileBatch', () => {
    it('should successfully reconcile batch units', () => {
      const batchId = 'B001';
      const request: ReconcileBatchRequestDto = {
        units: [
          {
            unitId: 'U123456789',
            productCode: 'RBC001',
            aliquot: '01',
            reconReason: 'DMGD',
            reconDetail: 'Container damaged',
          },
          {
            unitId: 'U987654321',
            productCode: 'PLT001',
            aliquot: '01',
          },
        ],
      };

      const expectedResponse: ReconcileBatchResponseDto = {
        batchId: 'B001',
        unitsReconciled: 2,
        unitsQuarantined: 1,
        batchStatus: 'RECON',
      };

      service.reconcileBatch(batchId, request).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.unitsReconciled).toBe(2);
        expect(response.unitsQuarantined).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(batchId)}/reconcile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);

      const apiResponse: ApiResponse<ReconcileBatchResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Batch reconciled successfully. 1 unit(s) quarantined, 1 unit(s) accepted.',
        data: expectedResponse,
      };

      req.flush(apiResponse);
    });

    it('should handle validation error (invalid reason code)', () => {
      const batchId = 'B001';
      const request: ReconcileBatchRequestDto = {
        units: [
          {
            unitId: 'U123456789',
            productCode: 'RBC001',
            aliquot: '01',
            reconReason: 'INVALID',
          },
        ],
      };

      service.reconcileBatch(batchId, request).subscribe(
        () => fail('Should have thrown an error'),
        (error) => {
          expect(error.message).toContain('Invalid reason code');
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(batchId)}/reconcile`);

      const errorResponse: ApiResponse<ReconcileBatchResponseDto> = {
        success: false,
        statusCode: 400,
        message: 'Invalid reason code',
        data: null as any,
      };

      req.flush(errorResponse);
    });

    it('should handle batch not closed error', () => {
      const batchId = 'B999';
      const request: ReconcileBatchRequestDto = {
        units: [],
      };

      service.reconcileBatch(batchId, request).subscribe(
        () => fail('Should have thrown an error'),
        (error) => {
          expect(error.message).toContain('Invalid batch ID');
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(batchId)}/reconcile`);

      const errorResponse: ApiResponse<ReconcileBatchResponseDto> = {
        success: false,
        statusCode: 400,
        message: 'Invalid batch ID or batch not closed',
        data: null as any,
      };

      req.flush(errorResponse);
    });

    it('should encode batch ID in URL for reconcile', () => {
      const batchId = 'B 001';
      const request: ReconcileBatchRequestDto = { units: [] };

      service.reconcileBatch(batchId, request).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(batchId)}/reconcile`);
      expect(req.request.url).toContain('B%20001');

      const response: ApiResponse<ReconcileBatchResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          batchId,
          unitsReconciled: 0,
          unitsQuarantined: 0,
          batchStatus: 'RECON',
        },
      };

      req.flush(response);
    });
  });
});
