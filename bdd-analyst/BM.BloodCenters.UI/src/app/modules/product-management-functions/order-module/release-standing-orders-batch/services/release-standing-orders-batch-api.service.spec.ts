import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReleaseStandingOrdersBatchApiService } from './release-standing-orders-batch-api.service';
import {
  ReleaseStandingOrdersBatchRequestDto,
  ReleaseStandingOrdersBatchResponseDto,
  ApiResponseSingle,
} from '../models/release-standing-orders-batch.model';
import { API } from '@core/constants/api.constants';

describe('ReleaseStandingOrdersBatchApiService', () => {
  let service: ReleaseStandingOrdersBatchApiService;
  let httpMock: HttpTestingController;
  const baseUrl = API.RELEASE_STANDING_ORDERS_BATCH.BASE;

  const mockBatchResponse: ReleaseStandingOrdersBatchResponseDto = {
    processedCount: 3,
    generatedOrders: [
      {
        orderNo: '26146-0001',
        customerId: 'CUST001',
        contractId: 'CONT001',
        consigneeId: 'CONS001',
        itemCount: 5,
        orderStatus: 'OR',
        reportSubmitted: true,
      },
      {
        orderNo: '26146-0002',
        customerId: 'CUST002',
        contractId: 'CONT002',
        consigneeId: 'CONS002',
        itemCount: 3,
        orderStatus: 'HO',
        reportSubmitted: true,
      },
    ],
    failedOrders: [
      {
        contractId: 'CONT003',
        customerId: 'CUST003',
        consigneeId: 'CONS003',
        errorMessage: 'Database constraint violation',
        weekDay: 'MON',
      },
    ],
    processedAt: '2026-05-26T14:30:00Z',
    weekDay: 'MON',
  };

  const mockEmptyResponse: ReleaseStandingOrdersBatchResponseDto = {
    processedCount: 0,
    generatedOrders: [],
    failedOrders: [],
    processedAt: '2026-05-26T14:30:00Z',
    weekDay: 'WED',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReleaseStandingOrdersBatchApiService],
    });
    service = TestBed.inject(ReleaseStandingOrdersBatchApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {

    it('should have correct base URL using API constants', () => {
      expect((service as any).baseUrl).toBe('/api/v1/release-standing-orders');
    });
  });

  describe('processBatch', () => {
    it('should process batch successfully with includeReports true', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: true,
        message: 'Successfully released 3 standing orders',
        statusCode: 200,
        item: mockBatchResponse,
      };

      service.processBatch(request).subscribe((response) => {
        expect(response).toEqual(mockBatchResponse);
        expect(response.processedCount).toBe(3);
        expect(response.generatedOrders.length).toBe(2);
        expect(response.failedOrders.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.body.includeReports).toBeTrue();
      req.flush(apiResponse);
    });

    it('should handle 404 response (no standing orders found)', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: false,
        message: 'No standing orders found for today',
        statusCode: 404,
        item: mockEmptyResponse,
      };

      service.processBatch(request).subscribe((response) => {
        expect(response).toEqual(mockEmptyResponse);
        expect(response.processedCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });

    it('should throw error when API response is unsuccessful without 404', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: false,
        message: 'An error occurred while processing standing orders',
        statusCode: 500,
      };

      service.processBatch(request).subscribe({
        next: () => fail('Should have thrown an error'),
        error: (error) => {
          expect(error.message).toBe('An error occurred while processing standing orders');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });


    it('should handle partial success with failed orders', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const partialSuccessResponse: ReleaseStandingOrdersBatchResponseDto = {
        processedCount: 2,
        generatedOrders: [mockBatchResponse.generatedOrders[0]],
        failedOrders: [
          {
            contractId: 'CONT004',
            customerId: 'CUST004',
            consigneeId: 'CONS004',
            errorMessage: 'Invalid product type',
            weekDay: 'MON',
          },
        ],
        processedAt: '2026-05-26T14:30:00Z',
        weekDay: 'MON',
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: true,
        message: 'Successfully released 1 standing order, 1 failed',
        statusCode: 200,
        item: partialSuccessResponse,
      };

      service.processBatch(request).subscribe((response) => {
        expect(response.processedCount).toBe(2);
        expect(response.generatedOrders.length).toBe(1);
        expect(response.failedOrders.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });

    it('should handle missing item in successful response', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: true,
        message: 'Success but no item',
        statusCode: 200,
      };

      service.processBatch(request).subscribe({
        next: () => fail('Should have thrown an error'),
        error: (error) => {
          expect(error.message).toBe('Success but no item');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });

    it('should handle bad request (400) error', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      service.processBatch(request).subscribe({
        next: () => fail('Should have thrown an error'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush({ success: false, message: 'User context is required', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' });
    });

  });

  describe('Response Data Mapping', () => {
    it('should correctly map generated orders', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: mockBatchResponse,
      };

      service.processBatch(request).subscribe((response) => {
        expect(response.generatedOrders[0].orderNo).toBe('26146-0001');
        expect(response.generatedOrders[0].customerId).toBe('CUST001');
        expect(response.generatedOrders[0].contractId).toBe('CONT001');
        expect(response.generatedOrders[0].consigneeId).toBe('CONS001');
        expect(response.generatedOrders[0].itemCount).toBe(5);
        expect(response.generatedOrders[0].orderStatus).toBe('OR');
        expect(response.generatedOrders[0].reportSubmitted).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });

    it('should correctly map failed orders', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: mockBatchResponse,
      };

      service.processBatch(request).subscribe((response) => {
        expect(response.failedOrders[0].contractId).toBe('CONT003');
        expect(response.failedOrders[0].customerId).toBe('CUST003');
        expect(response.failedOrders[0].consigneeId).toBe('CONS003');
        expect(response.failedOrders[0].errorMessage).toBe('Database constraint violation');
        expect(response.failedOrders[0].weekDay).toBe('MON');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });

    it('should correctly map metadata fields', (done) => {
      const request: ReleaseStandingOrdersBatchRequestDto = {
        includeReports: true,
        previewOnly: false,
      };

      const apiResponse: ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: mockBatchResponse,
      };

      service.processBatch(request).subscribe((response) => {
        expect(response.processedCount).toBe(3);
        expect(response.processedAt).toBe('2026-05-26T14:30:00Z');
        expect(response.weekDay).toBe('MON');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      req.flush(apiResponse);
    });
  });
});
