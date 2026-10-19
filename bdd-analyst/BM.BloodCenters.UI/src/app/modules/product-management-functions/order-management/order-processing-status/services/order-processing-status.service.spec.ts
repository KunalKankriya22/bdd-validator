import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderProcessingStatusService, ApiResponse } from './order-processing-status.service';
import { API } from '@core/constants/api.constants';
import {
  OrderProcessingStatusResponseDto,
  OrderProcessingStatusQueryDto,
  OrderStatusCodeDto
} from '../models/order-processing-status.model';

describe('OrderProcessingStatusService', () => {
  let service: OrderProcessingStatusService;
  let httpMock: HttpTestingController;

  const mockOrderData: OrderProcessingStatusResponseDto = {
    statOrders: [
      {
        orderNo: 'ORD001',
        orderClass: 'ST',
        orderStatus: 'OP',
        insertDate: '2024-06-01T08:30:00Z',
        chapterId: 'CH001',
        orderAge: 24
      }
    ],
    asapOrders: [
      {
        orderNo: 'ORD002',
        orderClass: 'AS',
        orderStatus: 'PE',
        insertDate: '2024-06-01T10:15:00Z',
        chapterId: 'CH001',
        orderAge: 18
      }
    ],
    routineOrders: [],
    standingOrders: [],
    statCount: 1,
    asapCount: 1,
    routineCount: 0,
    standingCount: 0
  };

  const mockStatusCodes: OrderStatusCodeDto[] = [
    { code: 'AL', codeDesc: 'Allocated' },
    { code: 'BO', codeDesc: 'Backorder' },
    { code: 'OP', codeDesc: 'Open' },
    { code: 'PE', codeDesc: 'Pending' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderProcessingStatusService]
    });

    service = TestBed.inject(OrderProcessingStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOrderProcessingStatus', () => {
    it('should fetch order processing status with all filters', (done) => {
      const query: OrderProcessingStatusQueryDto = {
        age: 24,
        orderStatus: 'OP',
        fromDate: '2024-06-01',
        toDate: '2024-06-30',
        take: 10,
        skip: 0
      };

      service.getOrderProcessingStatus(query).subscribe(result => {
        expect(result).toEqual(mockOrderData);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.ORDER_PROCESSING_STATUS.GET_ORDERS);
      });

      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('age')).toBe('24');
      expect(req.request.params.get('orderStatus')).toBe('OP');
      expect(req.request.params.get('fromDate')).toBe('2024-06-01');
      expect(req.request.params.get('toDate')).toBe('2024-06-30');
      expect(req.request.params.get('take')).toBe('10');
      expect(req.request.params.get('skip')).toBe('0');

      const response: ApiResponse<OrderProcessingStatusResponseDto[]> = {
        success: true,
        data: [mockOrderData],
        statusCode: 200
      };

      req.flush(response);
    });

    it('should fetch order processing status without optional filters', (done) => {
      const query: OrderProcessingStatusQueryDto = {
        take: 10,
        skip: 0
      };

      service.getOrderProcessingStatus(query).subscribe(result => {
        expect(result).toEqual(mockOrderData);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.ORDER_PROCESSING_STATUS.GET_ORDERS);
      });

      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('age')).toBeNull();
      expect(req.request.params.get('orderStatus')).toBeNull();
      expect(req.request.params.get('fromDate')).toBeNull();
      expect(req.request.params.get('toDate')).toBeNull();
      expect(req.request.params.get('take')).toBe('10');
      expect(req.request.params.get('skip')).toBe('0');

      const response: ApiResponse<OrderProcessingStatusResponseDto[]> = {
        success: true,
        data: [mockOrderData],
        statusCode: 200
      };

      req.flush(response);
    });

    it('should return empty structure when no data is returned', (done) => {
      const query: OrderProcessingStatusQueryDto = {
        take: 10,
        skip: 0
      };

      service.getOrderProcessingStatus(query).subscribe(result => {
        expect(result.statOrders).toEqual([]);
        expect(result.asapOrders).toEqual([]);
        expect(result.routineOrders).toEqual([]);
        expect(result.standingOrders).toEqual([]);
        expect(result.statCount).toBe(0);
        expect(result.asapCount).toBe(0);
        expect(result.routineCount).toBe(0);
        expect(result.standingCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.ORDER_PROCESSING_STATUS.GET_ORDERS);
      });

      const response: ApiResponse<OrderProcessingStatusResponseDto[]> = {
        success: true,
        data: [],
        statusCode: 200
      };

      req.flush(response);
    });

    it('should handle age filter of 0', (done) => {
      const query: OrderProcessingStatusQueryDto = {
        age: 0,
        take: 10,
        skip: 0
      };

      service.getOrderProcessingStatus(query).subscribe(result => {
        expect(result).toEqual(mockOrderData);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.ORDER_PROCESSING_STATUS.GET_ORDERS);
      });

      expect(req.request.params.get('age')).toBe('0');

      const response: ApiResponse<OrderProcessingStatusResponseDto[]> = {
        success: true,
        data: [mockOrderData],
        statusCode: 200
      };

      req.flush(response);
    });
  });

  describe('getOrderStatusCodes', () => {
    it('should fetch order status codes', (done) => {
      service.getOrderStatusCodes().subscribe(result => {
        expect(result).toEqual(mockStatusCodes);
        expect(result.length).toBe(4);
        expect(result[0].code).toBe('AL');
        expect(result[0].codeDesc).toBe('Allocated');
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.ORDER_PROCESSING_STATUS.GET_STATUS_CODES);
      });

      expect(req.request.method).toBe('GET');

      const response: ApiResponse<OrderStatusCodeDto[]> = {
        success: true,
        data: mockStatusCodes,
        statusCode: 200
      };

      req.flush(response);
    });

    it('should return empty array when no data is returned', (done) => {
      service.getOrderStatusCodes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.ORDER_PROCESSING_STATUS.GET_STATUS_CODES);
      });

      const response: ApiResponse<OrderStatusCodeDto[]> = {
        success: true,
        data: undefined,
        statusCode: 200
      };

      req.flush(response);
    });
  });
});
