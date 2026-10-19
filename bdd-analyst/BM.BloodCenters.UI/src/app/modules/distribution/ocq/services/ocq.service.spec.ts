import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OcqService } from './ocq.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CustomerOrderSearchRequest,
  CustomerOrderDto,
  OrderItemDetailDto,
  ApiResponse,
  CustomerLookupDto,
} from '../models/ocq.model';

describe('OcqService', () => {
  let service: OcqService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockOrders: CustomerOrderDto[] = [
    {
      orderNo: '17337-0019',
      customerId: 'HOSP001',
      customerName: 'Parkland Hospital',
      orderStatus: 'OP',
      orderStatusDesc: 'Ordered',
      orderType: 'TF',
      orderTypeDesc: 'Transfer',
      priority: 'STAT',
      orderDate: '2025-03-05T12:00:00Z',
      hoursOld: '25685',
      items: [
        {
          itemNo: 1,
          productType: 'POPLT',
          productTypeDesc: 'Pooled Plts Random',
          bloodType: 'O+',
          aboDesc: 'O Pos',
          itemStatus: 'OR',
          itemStatusDesc: 'Ordered',
          requiredQty: 1,
          allocatedQty: 0,
          canceledQty: 0,
          shippedQty: 0,
        },
      ],
    },
  ];

  const mockOrderItemDetail: OrderItemDetailDto = {
    orderNo: '17337-0019',
    itemNo: 1,
    productType: 'POPLT',
    productTypeDesc: 'Pooled Plts Random',
    bloodType: 'O+',
    aboDesc: 'O Pos',
    itemStatus: 'OR',
    itemStatusDesc: 'Ordered',
    requiredQty: 1,
    allocatedQty: 0,
    canceledQty: 0,
    shippedQty: 0,
    attributes: [
      {
        attribGroup: 'SP',
        attribCode: 'POOL',
        attribDesc: 'Pooling Fee',
      },
    ],
    antigens: [],
  };

  const mockPriorityOptions = [
    { code: 'STAT', description: 'Stat' },
    { code: 'ASAP', description: 'As Soon As Possible' },
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        OcqService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(OcqService);
  });

  describe('search', () => {
    it('should call correct API endpoint with request body', (done) => {
      const request: CustomerOrderSearchRequest = {
        customerId: 'HOSP001',
        orderClass: 'STAT',
        orderType: 'TF',
        orderStatus: 'OP',
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      };

      const apiResponse: ApiResponse<CustomerOrderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Orders retrieved successfully',
        data: mockOrders,
        total: 1,
      };

      mockApiService.post.and.returnValue(of(apiResponse));

      service.search(request).subscribe((orders) => {
        expect(mockApiService.post).toHaveBeenCalledWith(API.CUSTOMER_ORDERS_QUERY.SEARCH, request);
        expect(orders).toEqual(mockOrders);
        expect(orders.length).toBe(1);
        done();
      });
    });

    it('should handle minimal request with only customer ID', (done) => {
      const request: CustomerOrderSearchRequest = {
        customerId: 'HOSP001',
      };

      const apiResponse: ApiResponse<CustomerOrderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Orders retrieved successfully',
        data: mockOrders,
      };

      mockApiService.post.and.returnValue(of(apiResponse));

      service.search(request).subscribe((orders) => {
        expect(mockApiService.post).toHaveBeenCalledWith(API.CUSTOMER_ORDERS_QUERY.SEARCH, request);
        expect(orders).toEqual(mockOrders);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse: ApiResponse<CustomerOrderDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No orders',
        data: null as any,
      };

      mockApiService.post.and.returnValue(of(apiResponse));

      service.search({ customerId: 'X' }).subscribe((orders) => {
        expect(orders).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'No orders',
      } as any;

      mockApiService.post.and.returnValue(of(apiResponse));

      service.search({ customerId: 'X' }).subscribe((orders) => {
        expect(orders).toEqual([]);
        done();
      });
    });
  });

  describe('getOrderItemDetail', () => {
    it('should call correct API endpoint with order number and item number', (done) => {
      const orderNo = '17337-0019';
      const itemNo = 1;

      const apiResponse: ApiResponse<OrderItemDetailDto> = {
        success: true,
        statusCode: 200,
        message: 'Order item detail retrieved successfully',
        data: mockOrderItemDetail,
      };

      mockApiService.get.and.returnValue(of(apiResponse));

      service.getOrderItemDetail(orderNo, itemNo).subscribe((detail) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_ORDERS_QUERY.ITEM_DETAIL(orderNo, itemNo)
        );
        expect(detail).toEqual(mockOrderItemDetail);
        expect(detail.attributes.length).toBe(1);
        expect(detail.antigens.length).toBe(0);
        done();
      });
    });
  });

  describe('getAllCustomers', () => {
    const mockCustomers: CustomerLookupDto[] = [
      { customerId: 'HOSP001', name: 'Parkland Hospital' },
      { customerId: 'HOSP002', name: 'Memorial Hospital' },
    ];

    it('should call correct API endpoint with empty search', (done) => {
      const apiResponse: ApiResponse<CustomerLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Customers found',
        data: mockCustomers,
      };

      mockApiService.get.and.returnValue(of(apiResponse));

      service.getAllCustomers().subscribe((customers) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_ORDERS_QUERY.CUSTOMERS('')
        );
        expect(customers).toEqual(mockCustomers);
        done();
      });
    });

    it('should return empty array on API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getAllCustomers().subscribe((customers) => {
        expect(customers).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'No results',
        data: null,
      } as any;

      mockApiService.get.and.returnValue(of(apiResponse));

      service.getAllCustomers().subscribe((customers) => {
        expect(customers).toEqual([]);
        done();
      });
    });
  });

  describe('getPriorityOptions', () => {
    it('should fetch priority options from lookups endpoint', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockPriorityOptions,
      };

      mockApiService.get.and.returnValue(of(apiResponse));

      service.getPriorityOptions().subscribe((options) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_ORDERS_QUERY.LOOKUPS('ORCLS')
        );
        expect(options).toEqual(mockPriorityOptions);
        expect(options.length).toBe(2);
        done();
      });
    });

    it('should return empty array on API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getPriorityOptions().subscribe((options) => {
        expect(options).toEqual([]);
        done();
      });
    });
  });

  describe('getOrderTypeOptions', () => {
    it('should fetch order type options from lookups endpoint', (done) => {
      const expected = [
        { code: 'TF', description: 'Transfer' },
        { code: 'RG', description: 'Regular' },
      ];

      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: expected,
      };

      mockApiService.get.and.returnValue(of(apiResponse));

      service.getOrderTypeOptions().subscribe((options) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_ORDERS_QUERY.LOOKUPS('ORTYP')
        );
        expect(options).toEqual(expected);
        done();
      });
    });

    it('should return empty array on API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderTypeOptions().subscribe((options) => {
        expect(options).toEqual([]);
        done();
      });
    });
  });

  describe('getOrderStatusOptions', () => {
    it('should fetch order status options from lookups endpoint', (done) => {
      const expected = [
        { code: 'OP', description: 'Open' },
        { code: 'CL', description: 'Closed' },
        { code: 'CA', description: 'Canceled' },
      ];

      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: expected,
      };

      mockApiService.get.and.returnValue(of(apiResponse));

      service.getOrderStatusOptions().subscribe((options) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_ORDERS_QUERY.LOOKUPS('ORSTS')
        );
        expect(options).toEqual(expected);
        done();
      });
    });

    it('should return empty array on API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderStatusOptions().subscribe((options) => {
        expect(options).toEqual([]);
        done();
      });
    });
  });
});
