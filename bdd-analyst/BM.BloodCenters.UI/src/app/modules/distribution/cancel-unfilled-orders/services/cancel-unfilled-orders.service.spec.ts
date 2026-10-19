import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CancelUnfilledOrdersService } from './cancel-unfilled-orders.service';
import {
  OrderSearchCriteriaDto,
  OrderDetailDto,
  CancelOrderRequestDto,
  EligibleOrderLovDto,
  OrderTypeLookupDto,
  OrderClassLookupDto,
  OrderItemAttributeDto,
  ReturnResult
} from '../models/cancel-unfilled-orders.model';
import { API } from '@core/constants/api.constants';

describe('CancelUnfilledOrdersService', () => {
  let service: CancelUnfilledOrdersService;
  let httpMock: HttpTestingController;

  const mockOrderDetail: OrderDetailDto = {
    chapterId: 'TEST',
    orderNo: 'ORD-001',
    customerId: 'CUST001',
    customerName: 'Test Hospital',
    orderType: 'RG',
    orderTypeDesc: 'Regular',
    orderClass: 'ST',
    orderClassDesc: 'Standard',
    orderStatus: 'OR',
    contractId: 'CONTRACT-123',
    consigneeId: 'CONS001',
    standingOrderFlag: 'N',
    insertDate: '2024-01-15T10:30:00Z',
    estArrivalTime: '2024-01-16T14:00:00Z',
    ageInHours: 100,
    hasUnfilledItems: true,
    orderItems: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CancelUnfilledOrdersService]
    });

    service = TestBed.inject(CancelUnfilledOrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Service Initialization ────────────────────────────────────────────

  // ── searchEligibleOrders ──────────────────────────────────────────────

  describe('searchEligibleOrders', () => {
    it('should search with hoursOld parameter', (done) => {
      const criteria: OrderSearchCriteriaDto = { hoursOld: 24 };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [mockOrderDetail],
        message: 'Found 1 eligible order(s)',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: (orders) => {
          expect(orders).toEqual([mockOrderDetail]);
          expect(orders.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH &&
        r.params.get('hoursOld') === '24'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search with orderNo parameter', (done) => {
      const criteria: OrderSearchCriteriaDto = { orderNo: 'ORD-001' };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [mockOrderDetail],
        message: 'Found 1 eligible order(s)',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: (orders) => {
          expect(orders).toEqual([mockOrderDetail]);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH &&
        r.params.get('orderNo') === 'ORD-001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should trim orderNo before sending', (done) => {
      const criteria: OrderSearchCriteriaDto = { orderNo: '  ORD-001  ' };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [mockOrderDetail],
        message: '',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH &&
        r.params.get('orderNo') === 'ORD-001'
      );
      req.flush(mockResponse);
    });

    it('should search with both hoursOld and orderNo', (done) => {
      const criteria: OrderSearchCriteriaDto = { hoursOld: 24, orderNo: 'ORD-001' };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [mockOrderDetail],
        message: '',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: (orders) => {
          expect(orders.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH &&
        r.params.get('hoursOld') === '24' &&
        r.params.get('orderNo') === 'ORD-001'
      );
      req.flush(mockResponse);
    });

    it('should not set hoursOld param when null', (done) => {
      const criteria: OrderSearchCriteriaDto = { hoursOld: null as any };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [],
        message: '',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH &&
        !r.params.has('hoursOld')
      );
      req.flush(mockResponse);
    });

    it('should not set orderNo param when empty string', (done) => {
      const criteria: OrderSearchCriteriaDto = { orderNo: '' };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [],
        message: '',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH &&
        !r.params.has('orderNo')
      );
      req.flush(mockResponse);
    });

    it('should return empty array when no orders found', (done) => {
      const criteria: OrderSearchCriteriaDto = { hoursOld: 100 };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        data: [],
        message: 'No eligible orders found',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: (orders) => {
          expect(orders).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH);
      req.flush(mockResponse);
    });

    it('should return empty array when data is null in response', (done) => {
      const criteria: OrderSearchCriteriaDto = { hoursOld: 24 };
      const mockResponse = {
        success: true,
        data: null,
        message: '',
        statusCode: 200
      };

      service.searchEligibleOrders(criteria).subscribe({
        next: (orders) => {
          expect(orders).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      const criteria: OrderSearchCriteriaDto = { hoursOld: 24 };

      service.searchEligibleOrders(criteria).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url === API.CANCEL_UNFILLED_ORDERS.SEARCH);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── getEligibleOrdersLov ──────────────────────────────────────────────

  describe('getEligibleOrdersLov', () => {
    it('should get eligible orders with hoursOld', (done) => {
      const mockLov: EligibleOrderLovDto[] = [
        { orderNo: 'ORD-001', customerId: 'CUST001', customerName: 'Test Hospital', orderStatus: 'OR', ageInHours: 100 }
      ];
      const mockResponse: ReturnResult<EligibleOrderLovDto> = {
        success: true,
        data: mockLov,
        message: '',
        statusCode: 200
      };

      service.getEligibleOrdersLov(24).subscribe({
        next: (orders) => {
          expect(orders.length).toBe(1);
          expect(orders[0].orderNo).toBe('ORD-001');
          expect(orders[0].customerName).toBe('Test Hospital');
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.LOV &&
        r.params.get('hoursOld') === '24'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should not set hoursOld param when null', (done) => {
      const mockResponse: ReturnResult<EligibleOrderLovDto> = {
        success: true,
        data: [],
        message: '',
        statusCode: 200
      };

      service.getEligibleOrdersLov(null as any).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(r =>
        r.url === API.CANCEL_UNFILLED_ORDERS.LOV &&
        !r.params.has('hoursOld')
      );
      req.flush(mockResponse);
    });

    it('should return multiple orders', (done) => {
      const mockLov: EligibleOrderLovDto[] = [
        { orderNo: 'ORD-001', customerId: 'CUST001', customerName: 'Hospital A', orderStatus: 'OR', ageInHours: 100 },
        { orderNo: 'ORD-002', customerId: 'CUST002', customerName: 'Hospital B', orderStatus: 'BO', ageInHours: 48 }
      ];
      const mockResponse: ReturnResult<EligibleOrderLovDto> = {
        success: true,
        data: mockLov,
        message: '',
        statusCode: 200
      };

      service.getEligibleOrdersLov(48).subscribe({
        next: (orders) => {
          expect(orders.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url === API.CANCEL_UNFILLED_ORDERS.LOV);
      req.flush(mockResponse);
    });
  });

  // ── getOrderTypes ─────────────────────────────────────────────────────

  describe('getOrderTypes', () => {
    it('should get order type lookups', (done) => {
      const mockTypes: OrderTypeLookupDto[] = [
        { orderType: 'RE', orderTypeDesc: 'Regular Order' },
        { orderType: 'SP', orderTypeDesc: 'Special Order' }
      ];
      const mockResponse: ReturnResult<OrderTypeLookupDto> = {
        success: true,
        data: mockTypes,
        message: '',
        statusCode: 200
      };

      service.getOrderTypes().subscribe({
        next: (types) => {
          expect(types.length).toBe(2);
          expect(types[0].orderType).toBe('RE');
          expect(types[1].orderTypeDesc).toBe('Special Order');
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ORDER_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no types', (done) => {
      const mockResponse: ReturnResult<OrderTypeLookupDto> = {
        success: true,
        data: [],
        message: '',
        statusCode: 200
      };

      service.getOrderTypes().subscribe({
        next: (types) => {
          expect(types).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ORDER_TYPES);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getOrderTypes().subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ORDER_TYPES);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  // ── getOrderClasses ───────────────────────────────────────────────────

  describe('getOrderClasses', () => {
    it('should get order class lookups', (done) => {
      const mockClasses: OrderClassLookupDto[] = [
        { orderClass: 'RE', orderClassDesc: 'Routine' },
        { orderClass: 'ER', orderClassDesc: 'EMERGENCY' }
      ];
      const mockResponse: ReturnResult<OrderClassLookupDto> = {
        success: true,
        data: mockClasses,
        message: '',
        statusCode: 200
      };

      service.getOrderClasses().subscribe({
        next: (classes) => {
          expect(classes.length).toBe(2);
          expect(classes[0].orderClass).toBe('RE');
          expect(classes[1].orderClassDesc).toBe('EMERGENCY');
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ORDER_CLASSES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no classes', (done) => {
      const mockResponse: ReturnResult<OrderClassLookupDto> = {
        success: true,
        data: [],
        message: '',
        statusCode: 200
      };

      service.getOrderClasses().subscribe({
        next: (classes) => {
          expect(classes).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ORDER_CLASSES);
      req.flush(mockResponse);
    });
  });

  // ── getOrderDetails ───────────────────────────────────────────────────

  describe('getOrderDetails', () => {
    it('should get order details by orderNo', (done) => {
      const orderNo = 'ORD-001';
      const mockOrderWithItems: OrderDetailDto = {
        ...mockOrderDetail,
        orderItems: [
          {
            chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
            productType: 'RBC', productTypeDesc: 'Red Blood Cells',
            bloodType: 'OPOS', aboDesc: 'O Positive', tier: 1,
            requiredQty: 10, allocatedQty: 5,
            canceledQty: 0, systemCancelQty: 0,
            shippedQty: 5, itemStatus: 'PA', unfilledQty: 5
          }
        ]
      };
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        item: mockOrderWithItems,
        message: 'Order details retrieved successfully',
        statusCode: 200
      };

      service.getOrderDetails(orderNo).subscribe({
        next: (order) => {
          expect(order).toEqual(mockOrderWithItems);
          expect(order.orderItems.length).toBe(1);
          expect(order.orderNo).toBe('ORD-001');
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.GET_DETAILS(orderNo));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle order with no items', (done) => {
      const orderNo = 'ORD-002';
      const mockResponse: ReturnResult<OrderDetailDto> = {
        success: true,
        item: mockOrderDetail,
        message: '',
        statusCode: 200
      };

      service.getOrderDetails(orderNo).subscribe({
        next: (order) => {
          expect(order.orderItems).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.GET_DETAILS(orderNo));
      req.flush(mockResponse);
    });

    it('should propagate HTTP 404 error', (done) => {
      const orderNo = 'ORD-NONEXISTENT';

      service.getOrderDetails(orderNo).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.GET_DETAILS(orderNo));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── getItemAttributes ─────────────────────────────────────────────────

  describe('getItemAttributes', () => {
    it('should get item attributes by orderNo and itemNo', (done) => {
      const orderNo = 'ORD-001';
      const itemNo = 1;
      const mockAttrs: OrderItemAttributeDto[] = [
        { orderNo: 'ORD-001', itemNo: 1, attribGroup: 'SP', attribCode: 'XM', attribDesc: 'Crossmatch - IS', chapterId: 'TEST' }
      ];
      const mockResponse: ReturnResult<OrderItemAttributeDto> = {
        success: true,
        data: mockAttrs,
        message: '',
        statusCode: 200
      };

      service.getItemAttributes(orderNo, itemNo).subscribe({
        next: (attrs) => {
          expect(attrs.length).toBe(1);
          expect(attrs[0].attribCode).toBe('XM');
          expect(attrs[0].attribDesc).toBe('Crossmatch - IS');
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ITEM_ATTRIBUTES(orderNo, itemNo));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no attributes', (done) => {
      const orderNo = 'ORD-001';
      const itemNo = 2;
      const mockResponse: ReturnResult<OrderItemAttributeDto> = {
        success: true,
        data: [],
        message: '',
        statusCode: 200
      };

      service.getItemAttributes(orderNo, itemNo).subscribe({
        next: (attrs) => {
          expect(attrs).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.ITEM_ATTRIBUTES(orderNo, itemNo));
      req.flush(mockResponse);
    });

  });

  // ── cancelUnfilledOrder ───────────────────────────────────────────────

  describe('cancelUnfilledOrder', () => {
    it('should cancel order with confirmation Y', (done) => {
      const orderNo = 'ORD-001';
      const request: CancelOrderRequestDto = { Confirmation: 'Y' };
      const cancelResult = {
        orderNo: 'ORD-001',
        message: 'Successfully canceled unfilled portions. 2 item(s) updated.',
        itemsUpdated: 2,
        success: true
      };
      const mockResponse: ReturnResult<typeof cancelResult> = {
        success: true,
        item: cancelResult,
        message: '',
        statusCode: 200
      };

      service.cancelUnfilledOrder(orderNo, request).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.itemsUpdated).toBe(2);
          expect(response.message).toContain('Successfully canceled');
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.CANCEL(orderNo));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return response with updatedOrder', (done) => {
      const orderNo = 'ORD-001';
      const request: CancelOrderRequestDto = { Confirmation: 'Y' };
      const updatedOrder: OrderDetailDto = {
        ...mockOrderDetail,
        hasUnfilledItems: false,
        orderItems: []
      };
      const cancelResult = {
        orderNo: 'ORD-001',
        message: 'Transaction committed',
        itemsUpdated: 1,
        success: true,
        updatedOrder
      };
      const mockResponse = {
        success: true,
        item: cancelResult,
        message: '',
        statusCode: 200
      };

      service.cancelUnfilledOrder(orderNo, request).subscribe({
        next: (response) => {
          expect(response.updatedOrder).toBeDefined();
          expect(response.updatedOrder?.hasUnfilledItems).toBeFalse();
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.CANCEL(orderNo));
      req.flush(mockResponse);
    });


    it('should handle 500 server error', (done) => {
      const orderNo = 'ORD-001';
      const request: CancelOrderRequestDto = { Confirmation: 'Y' };

      service.cancelUnfilledOrder(orderNo, request).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.CANCEL(orderNo));
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should use correct URL with encoded orderNo', (done) => {
      const orderNo = 'ORD/001';
      const request: CancelOrderRequestDto = { Confirmation: 'Y' };
      const cancelResult = {
        orderNo: 'ORD/001',
        message: 'Done',
        itemsUpdated: 1,
        success: true
      };
      const mockResponse = {
        success: true,
        item: cancelResult,
        message: '',
        statusCode: 200
      };

      service.cancelUnfilledOrder(orderNo, request).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(API.CANCEL_UNFILLED_ORDERS.CANCEL(orderNo));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
