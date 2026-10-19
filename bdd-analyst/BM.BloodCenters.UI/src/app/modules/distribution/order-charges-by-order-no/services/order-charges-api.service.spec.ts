import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrderChargesApiService } from './order-charges-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  OrderChargesSummary,
  OrderTypeDto,
  OrderListItemDto
} from '../models/order-charges.model';

describe('OrderChargesApiService', () => {
  let service: OrderChargesApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockOrderChargesSummary: OrderChargesSummary = {
    orderNo: 'ORDER12345',
    chapterId: '0001',
    orderType: 'PR',
    customerId: 'CUST001',
    customerName: 'Memorial Hospital',
    status: 'CO',
    statusDesc: 'Completed',
    orderBy: 'JSMITH',
    estArrivalTime: '2024-06-01T14:30:00Z',
    insertDate: '2024-05-30T08:00:00Z',
    products: [],
    antigens: [],
    attributes: [],
    otherCharges: [],
    adjustments: [],
    totals: {
      productsTotal: 505.50,
      antigensTotal: 27.50,
      attributesTotal: 70.00,
      otherDebitTotal: 23.00,
      otherCreditTotal: 15.00,
      grandTotal: 611.00
    }
  };

  const mockOrderTypes: OrderTypeDto[] = [
    { code: 'PR', description: 'Production Order' },
    { code: 'DI', description: 'Distribution Order' }
  ];

  const mockOrders: OrderListItemDto[] = [
    { orderNo: 'ORDER12345', orderType: 'PR', customerName: 'Memorial Hospital', insertDate: '2024-05-30' },
    { orderNo: 'ORDER12346', orderType: 'PR', customerName: 'City General Hospital', insertDate: '2024-06-01' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        OrderChargesApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(OrderChargesApiService);
  });

  describe('getOrderCharges', () => {
    it('should retrieve order charges for valid order number', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true, data: [mockOrderChargesSummary], statusCode: 200
      }));

      service.getOrderCharges('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual(mockOrderChargesSummary);
          done();
        }
      });
    });

    it('should handle single object data response', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true, data: mockOrderChargesSummary, statusCode: 200
      }));

      service.getOrderCharges('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual(mockOrderChargesSummary);
          done();
        }
      });
    });

    it('should throw error when orderNo is empty', (done) => {
      service.getOrderCharges('').subscribe({
        error: (error) => {
          expect(error.message).toContain('OrderNo is required');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should throw error when orderNo is whitespace only', (done) => {
      service.getOrderCharges('   ').subscribe({
        error: (error) => {
          expect(error.message).toContain('OrderNo is required');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle API error response', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: false, message: 'Order not found', statusCode: 404, data: null
      }));

      service.getOrderCharges('NOTFOUND').subscribe({
        error: (error) => {
          expect(error.message).toContain('Order not found');
          done();
        }
      });
    });

    it('should handle API error response with no message', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: false, message: '', statusCode: 500, data: null
      }));

      service.getOrderCharges('FAIL').subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to retrieve order charges');
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderCharges('ORDER12345').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getOrderTypes', () => {
    it('should retrieve active order types', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockOrderTypes }));

      service.getOrderTypes().subscribe({
        next: (data) => {
          expect(data).toEqual(mockOrderTypes);
          done();
        }
      });
    });

    it('should return empty array when no order types available', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getOrderTypes().subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getOrderTypes().subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should handle API error response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Failed', data: [] }));

      service.getOrderTypes().subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed');
          done();
        }
      });
    });

    it('should handle API error response with no message', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: '', data: [] }));

      service.getOrderTypes().subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to retrieve order types');
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderTypes().subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getOrders', () => {
    it('should retrieve orders without filter', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockOrders }));

      service.getOrders().subscribe({
        next: (data) => {
          expect(data).toEqual(mockOrders);
          done();
        }
      });
    });

    it('should retrieve orders filtered by order type', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockOrders }));

      service.getOrders('PR').subscribe({
        next: (data) => {
          expect(data).toEqual(mockOrders);
          done();
        }
      });
    });

    it('should use unfiltered endpoint for null orderType', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockOrders }));

      service.getOrders(null).subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should use unfiltered endpoint for empty string orderType', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockOrders }));

      service.getOrders('').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should use unfiltered endpoint for whitespace-only orderType', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockOrders }));

      service.getOrders('  ').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return empty array when no orders found', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getOrders('DI').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getOrders().subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should handle API error response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Server error', data: [] }));

      service.getOrders().subscribe({
        error: (error) => {
          expect(error.message).toContain('Server error');
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrders('PR').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getOrderedProducts', () => {
    it('should retrieve ordered products', (done) => {
      const mockProducts = [
        { orderNo: 'ORDER12345', itemNo: 1, productType: 'RBC', bloodType: 'O+', requiredQty: 10, allocatedQty: 10, canceledQty: 0, itemStatus: 'CL' }
      ];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockProducts }));

      service.getOrderedProducts('ORDER12345').subscribe({
        next: (data) => {
          expect(data.length).toBe(1);
          expect(data[0].productType).toBe('RBC');
          done();
        }
      });
    });

    it('should return empty array for non-array data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getOrderedProducts('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should handle API error response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Not found', data: null }));

      service.getOrderedProducts('ORDER12345').subscribe({
        error: (error) => {
          expect(error.message).toContain('Not found');
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderedProducts('ORDER12345').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getOrderNotes', () => {
    it('should retrieve order notes', (done) => {
      const mockNote = { noteId: 1, note: 'Rush order' };
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockNote }));

      service.getOrderNotes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual(mockNote as any);
          done();
        }
      });
    });

    it('should handle array data response for notes', (done) => {
      const mockNote = { noteId: 1, note: 'Rush order' };
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [mockNote] }));

      service.getOrderNotes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual(mockNote as any);
          done();
        }
      });
    });

    it('should return null when API returns success false', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, data: null }));

      service.getOrderNotes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toBeNull();
          done();
        }
      });
    });

    it('should return null when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getOrderNotes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toBeNull();
          done();
        }
      });
    });

    it('should return null when data is empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getOrderNotes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toBeNull();
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderNotes('ORDER12345').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit trail data', (done) => {
      const mockAudit = [
        { actionFunction: 'INSERT', actionDate: '2024-06-01T10:00:00', userName: 'JSMITH' },
        { actionFunction: 'UPDATE', actionDate: '2024-06-02T14:30:00', userName: 'ADOE' }
      ];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockAudit }));

      service.getAuditTrail('ORDER12345').subscribe({
        next: (data) => {
          expect(data.length).toBe(2);
          expect(data[0].actionFunction).toBe('INSERT');
          expect(data[1].userName).toBe('ADOE');
          done();
        }
      });
    });

    it('should return empty array when no audit trail', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getAuditTrail('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array for non-array data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getAuditTrail('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should handle API error response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Failed', data: null }));

      service.getAuditTrail('ORDER12345').subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed');
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getAuditTrail('ORDER12345').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getOrderedAntigens', () => {
    it('should retrieve ordered antigens', (done) => {
      const mockAntigens = [
        { itemNo: 1, antigenId: 'AG001', unitPrice: 15.00, resultStatus: 'POS' }
      ];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockAntigens }));

      service.getOrderedAntigens('ORDER12345').subscribe({
        next: (data) => {
          expect(data.length).toBe(1);
          expect(data[0].antigenId).toBe('AG001');
          done();
        }
      });
    });

    it('should return empty array when no antigens', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getOrderedAntigens('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array for non-array data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getOrderedAntigens('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderedAntigens('ORDER12345').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('getOrderedAttributes', () => {
    it('should retrieve ordered attributes', (done) => {
      const mockAttrs = [
        { itemNo: 1, attribGroup: 'GRP1', attribCode: 'XM', unitPrice: 40.00 }
      ];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockAttrs }));

      service.getOrderedAttributes('ORDER12345').subscribe({
        next: (data) => {
          expect(data.length).toBe(1);
          expect(data[0].attribCode).toBe('XM');
          done();
        }
      });
    });

    it('should return empty array when no attributes', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getOrderedAttributes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array for non-array data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getOrderedAttributes('ORDER12345').subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        }
      });
    });

    it('should handle HTTP transport error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOrderedAttributes('ORDER12345').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });
});
