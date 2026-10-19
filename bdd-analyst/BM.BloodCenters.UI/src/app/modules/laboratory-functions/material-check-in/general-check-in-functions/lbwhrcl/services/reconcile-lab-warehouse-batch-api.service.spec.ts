import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReconcileLabWarehouseBatchApiService } from './reconcile-lab-warehouse-batch-api.service';
import {
  BatchHeaderDto,
  BatchDetailDto,
  ReasonCodeDto,
  ReconcileBatchRequestDto,
  ReconcileBatchResponseDto,
  ApiResponse,
  ApiResponseSingle,
} from '../models/reconcile-lab-warehouse-batch.model';
import { environment } from '../../../../../../../environments/environment';

describe('ReconcileLabWarehouseBatchApiService', () => {
  let service: ReconcileLabWarehouseBatchApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/reconcile-lab-warehouse-batch`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReconcileLabWarehouseBatchApiService],
    });
    service = TestBed.inject(ReconcileLabWarehouseBatchApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getBatches', () => {
    it('should return batch list when successful', (done) => {
      const mockBatches = [
        { batchId: 'BATCH001', createDate: '11-JAN-2026' },
        { batchId: 'BATCH002', createDate: '12-JAN-2026' },
      ];

      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Batches retrieved',
        data: [mockBatches],
        total: 2,
      };

      service.getBatches().subscribe((result) => {
        expect(result).toEqual(mockBatches);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batches`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response has no data', (done) => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'No batches',
        data: [],
        total: 0,
      };

      service.getBatches().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batches`);
      req.flush(mockResponse);
    });

    it('should return empty array when response is unsuccessful', (done) => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        statusCode: 500,
        message: 'Error',
        data: [],
      };

      service.getBatches().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batches`);
      req.flush(mockResponse);
    });
  });

  describe('getBatchHeader', () => {
    it('should return batch header data when found', (done) => {
      const mockBatchId = 'BATCH001';
      const mockBatchHeader: BatchHeaderDto = {
        batchId: 'BATCH001',
        createDate: '01-JAN-2024',
        toWarehouse: 'LAB01',
        toWhDesc: 'Lab Warehouse 01',
        batchStatus: 'CLOSE',
      };

      const mockResponse: ApiResponseSingle<BatchHeaderDto> = {
        success: true,
        statusCode: 200,
        message: 'Batch header retrieved successfully',
        data: [mockBatchHeader],
      };

      service.getBatchHeader(mockBatchId).subscribe((result) => {
        expect(result).toEqual(mockBatchHeader);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch-header/${mockBatchId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when batch header not found', (done) => {
      const mockResponse: ApiResponseSingle<BatchHeaderDto> = {
        success: true,
        statusCode: 200,
        message: 'Not found',
        data: [],
      };

      service.getBatchHeader('MISSING').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch-header/MISSING`);
      req.flush(mockResponse);
    });

    it('should return null when response is unsuccessful', (done) => {
      const mockResponse: ApiResponseSingle<BatchHeaderDto> = {
        success: false,
        statusCode: 404,
        message: 'Not found',
        data: [],
      };

      service.getBatchHeader('BATCH001').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch-header/BATCH001`);
      req.flush(mockResponse);
    });

    it('should encode batch ID in URL', () => {
      const mockBatchId = 'BATCH/001';
      service.getBatchHeader(mockBatchId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/batch-header/BATCH%2F001`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: '', data: [] });
    });
  });

  describe('getBatchDetails', () => {
    it('should return batch detail items', (done) => {
      const mockBatchId = 'BATCH001';
      const mockDetails: BatchDetailDto[] = [
        {
          batchId: 'BATCH001',
          unitId: 'UNIT001234567',
          chkDigit: '12',
          productCode: 'RBC00101',
          productCodeDesc: 'Red Blood Cells',
          aliquot: '01',
          reconReason: null,
          reasonCdDesc: null,
          reconDetail: null,
          collDate: '15-DEC-2023',
        },
        {
          batchId: 'BATCH001',
          unitId: 'UNIT002345678',
          chkDigit: '34',
          productCode: null,
          productCodeDesc: null,
          aliquot: null,
          reconReason: null,
          reasonCdDesc: null,
          reconDetail: null,
          collDate: '16-DEC-2023',
        },
      ];

      const mockResponse: ApiResponse<BatchDetailDto> = {
        success: true,
        statusCode: 200,
        message: 'Batch details retrieved successfully',
        data: [mockDetails],
        total: 2,
      };

      service.getBatchDetails(mockBatchId).subscribe((result) => {
        expect(result).toEqual(mockDetails);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch-details/${mockBatchId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no pending items', (done) => {
      const mockBatchId = 'BATCH002';
      const mockResponse: ApiResponse<BatchDetailDto> = {
        success: true,
        statusCode: 200,
        message: 'No pending reconciliation items found',
        data: [[]],
        total: 0,
      };

      service.getBatchDetails(mockBatchId).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch-details/${mockBatchId}`);
      req.flush(mockResponse);
    });

    it('should return empty array when response data is empty', (done) => {
      const mockResponse: ApiResponse<BatchDetailDto> = {
        success: true,
        statusCode: 200,
        message: '',
        data: [],
      };

      service.getBatchDetails('BATCH001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch-details/BATCH001`);
      req.flush(mockResponse);
    });

    it('should encode batch ID in URL', () => {
      service.getBatchDetails('BATCH/002').subscribe();
      const req = httpMock.expectOne(`${baseUrl}/batch-details/BATCH%2F002`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: '', data: [[]] });
    });
  });

  describe('getReasonCodes', () => {
    it('should return reason codes', (done) => {
      const mockReasonCodes: ReasonCodeDto[] = [
        { code: 'DMGD', codeDesc: 'Damaged during transport' },
        { code: 'EXPD', codeDesc: 'Expired product' },
        { code: 'LOST', codeDesc: 'Lost in transit' },
      ];

      const mockResponse: ApiResponse<ReasonCodeDto> = {
        success: true,
        statusCode: 200,
        message: 'Reason codes retrieved successfully',
        data: [mockReasonCodes],
        total: 3,
      };

      service.getReasonCodes().subscribe((result) => {
        expect(result).toEqual(mockReasonCodes);
        expect(result.length).toBe(3);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/reason-codes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no reason codes found', (done) => {
      const mockResponse: ApiResponse<ReasonCodeDto> = {
        success: true,
        statusCode: 200,
        message: 'No reason codes found',
        data: [[]],
        total: 0,
      };

      service.getReasonCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/reason-codes`);
      req.flush(mockResponse);
    });

    it('should return empty array when response data is missing', (done) => {
      const mockResponse: ApiResponse<ReasonCodeDto> = {
        success: false,
        statusCode: 500,
        message: 'Error',
        data: [],
      };

      service.getReasonCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/reason-codes`);
      req.flush(mockResponse);
    });
  });

  describe('reconcileBatch', () => {
    it('should reconcile batch successfully - all items reconciled', (done) => {
      const mockRequest: ReconcileBatchRequestDto = {
        batchId: 'BATCH001',
        details: [
          {
            unitId: 'UNIT001234567',
            productCode: 'RBC00101',
            aliquot: '01',
            reconReason: 'DMGD',
            reconDetail: 'Damaged container, visible cracks',
          },
          {
            unitId: 'UNIT002345678',
            productCode: null,
            aliquot: null,
            reconReason: 'LOST',
            reconDetail: 'Not found in shipment',
          },
        ],
      };

      const mockResponseData: ReconcileBatchResponseDto = {
        batchId: 'BATCH001',
        itemsReconciled: 2,
        pendingCount: 0,
      };

      const mockResponse: ApiResponseSingle<ReconcileBatchResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Batch reconciliation completed successfully',
        data: [mockResponseData],
      };

      service.reconcileBatch(mockRequest).subscribe((result) => {
        expect(result).toEqual(mockResponseData);
        expect(result.itemsReconciled).toBe(2);
        expect(result.pendingCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/reconcile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should reconcile batch successfully - partial reconciliation', (done) => {
      const mockRequest: ReconcileBatchRequestDto = {
        batchId: 'BATCH002',
        details: [
          {
            unitId: 'UNIT001234567',
            productCode: null,
            aliquot: null,
            reconReason: 'DMGD',
          },
        ],
      };

      const mockResponseData: ReconcileBatchResponseDto = {
        batchId: 'BATCH002',
        itemsReconciled: 1,
        pendingCount: 3,
      };

      const mockResponse: ApiResponseSingle<ReconcileBatchResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Batch reconciliation completed successfully',
        data: [mockResponseData],
      };

      service.reconcileBatch(mockRequest).subscribe((result) => {
        expect(result.pendingCount).toBe(3);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/reconcile`);
      req.flush(mockResponse);
    });

    it('should throw error when reconciliation fails', (done) => {
      const mockRequest: ReconcileBatchRequestDto = {
        batchId: 'BATCH999',
        details: [
          {
            unitId: 'UNIT001',
            productCode: null,
            aliquot: null,
            reconReason: 'INVALID',
          },
        ],
      };

      const mockResponse: ApiResponseSingle<ReconcileBatchResponseDto> = {
        success: false,
        statusCode: 400,
        message: 'Invalid reason code',
        data: [],
      };

      service.reconcileBatch(mockRequest).subscribe({
        next: () => fail('Should have thrown an error'),
        error: (error) => {
          expect(error.message).toBe('Invalid reason code');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/reconcile`);
      req.flush(mockResponse);
    });

    it('should throw default error when reconciliation fails without message', (done) => {
      const mockRequest: ReconcileBatchRequestDto = {
        batchId: 'BATCH999',
        details: [
          {
            unitId: 'UNIT001',
            productCode: null,
            aliquot: null,
            reconReason: 'INVALID',
          },
        ],
      };

      const mockResponse: ApiResponseSingle<ReconcileBatchResponseDto> = {
        success: false,
        statusCode: 500,
        message: '',
        data: [],
      };

      service.reconcileBatch(mockRequest).subscribe({
        next: () => fail('Should have thrown an error'),
        error: (error) => {
          expect(error.message).toBe('Reconciliation failed');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/reconcile`);
      req.flush(mockResponse);
    });
  });
});
