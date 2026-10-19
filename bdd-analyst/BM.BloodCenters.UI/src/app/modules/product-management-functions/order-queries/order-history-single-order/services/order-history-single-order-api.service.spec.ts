import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderHistorySingleOrderApiService } from './order-history-single-order-api.service';
import { API } from '@core/constants/api.constants';

describe('OrderHistorySingleOrderApiService', () => {
  let service: OrderHistorySingleOrderApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderHistorySingleOrderApiService],
    });
    service = TestBed.inject(OrderHistorySingleOrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchOrders', () => {
    it('should call GET without query param when no query provided', () => {
      service.searchOrders().subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.SEARCH);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('q')).toBeFalse();
      req.flush({ success: true, item: [] });
    });

    it('should call GET with query param when query is provided', () => {
      service.searchOrders('ORD').subscribe();

      const req = httpMock.expectOne(r => r.url === API.ORDER_HISTORY.SEARCH && r.params.get('q') === 'ORD');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: [] });
    });

    it('should return search results on success', (done) => {
      const mockResults = [
        { orderNo: 'ORD-001', customerId: 'C1', customerName: 'Hospital A' },
        { orderNo: 'ORD-002', customerId: 'C2', customerName: 'Hospital B' },
      ];

      service.searchOrders().subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item).toEqual(mockResults as any);
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.SEARCH);
      req.flush({ success: true, item: mockResults });
    });

    it('should handle empty string query without setting param', () => {
      service.searchOrders('').subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.SEARCH);
      expect(req.request.params.has('q')).toBeFalse();
      req.flush({ success: true, item: [] });
    });

    it('should propagate HTTP error', (done) => {
      service.searchOrders().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.SEARCH);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getOrderHistory', () => {
    it('should call GET with encoded order number', () => {
      const orderNo = 'ORD-001';
      service.getOrderHistory(orderNo).subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.GET(orderNo));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: {} });
    });

    it('should return order history data on success', (done) => {
      const mockOrder = {
        orderNo: 'ORD-001',
        orderedBy: 'Dr. Smith',
        customerId: 'C1',
        items: [{ itemNo: 1, productType: 'RBC', required: 5, allocated: 3, hasNotes: false }],
        history: [],
        orderNotes: [],
      };

      service.getOrderHistory('ORD-001').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item).toEqual(mockOrder as any);
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.GET('ORD-001'));
      req.flush({ success: true, item: mockOrder });
    });

    it('should return error response when order not found', (done) => {
      service.getOrderHistory('INVALID').subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.message).toBe('Order not found');
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.GET('INVALID'));
      req.flush({ success: false, message: 'Order not found', statusCode: 404 });
    });

    it('should encode special characters in order number', () => {
      service.getOrderHistory('ORD/001').subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.GET('ORD/001'));
      expect(req.request.url).toContain(encodeURIComponent('ORD/001'));
      req.flush({ success: true, item: {} });
    });
  });

  describe('getItemNotes', () => {
    it('should call GET with order number and item number', () => {
      service.getItemNotes('ORD-001', 1).subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.ITEM_NOTES('ORD-001', 1));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: [] });
    });

    it('should return notes array on success', (done) => {
      const mockNotes = [{ note: 'Urgent' }, { note: 'Handle with care' }];

      service.getItemNotes('ORD-001', 1).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item).toEqual(mockNotes as any);
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.ITEM_NOTES('ORD-001', 1));
      req.flush({ success: true, item: mockNotes });
    });

    it('should handle different item numbers', () => {
      service.getItemNotes('ORD-001', 5).subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.ITEM_NOTES('ORD-001', 5));
      expect(req.request.url).toContain('/items/5/notes');
      req.flush({ success: true, item: [] });
    });
  });

  describe('getOrderedAttributesAntigens', () => {
    it('should call GET with order number and item number', () => {
      service.getOrderedAttributesAntigens('ORD-001', 1).subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.ITEM_ATTRIBUTES_ANTIGENS('ORD-001', 1));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: {} });
    });

    it('should return attributes and antigens data', (done) => {
      const mockData = {
        itemNo: 1,
        attributes: [{ group: 'Blood Type', code: 'BT-001' }],
        antigens: [{ id: 'AG-001', description: 'Kell' }],
      };

      service.getOrderedAttributesAntigens('ORD-001', 1).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.ITEM_ATTRIBUTES_ANTIGENS('ORD-001', 1));
      req.flush({ success: true, item: mockData });
    });

    it('should propagate HTTP error', (done) => {
      service.getOrderedAttributesAntigens('ORD-001', 1).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.ITEM_ATTRIBUTES_ANTIGENS('ORD-001', 1));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getShippedProducts', () => {
    it('should call GET with order number', () => {
      service.getShippedProducts('ORD-001').subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.SHIPPED_PRODUCTS('ORD-001'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: { products: [] } });
    });

    it('should return shipped products data', (done) => {
      const mockProducts = {
        products: [
          { unitId: 'U1', product: 'RBC', expirationDate: '2025-12-31', shipment: 'S1', price: 100 },
        ],
      };

      service.getShippedProducts('ORD-001').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item!.products.length).toBe(1);
        expect(response.item!.products[0].unitId).toBe('U1');
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.SHIPPED_PRODUCTS('ORD-001'));
      req.flush({ success: true, item: mockProducts });
    });

    it('should propagate HTTP error', (done) => {
      service.getShippedProducts('ORD-001').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.SHIPPED_PRODUCTS('ORD-001'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getShippedAttributesAntigens', () => {
    it('should call GET with order number', () => {
      service.getShippedAttributesAntigens('ORD-001').subscribe();

      const req = httpMock.expectOne(API.ORDER_HISTORY.SHIPPED_ATTRIBUTES_ANTIGENS('ORD-001'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: { antigens: [], attributes: [] } });
    });

    it('should return antigens and attributes data', (done) => {
      const mockData = {
        antigens: [{ unitId: 'U1', product: 'RBC', testId: 'T1', result: 'Positive' }],
        attributes: [{ unitId: 'U1', product: 'RBC', attributeGroup: 'Blood', attributeCode: 'XM' }],
      };

      service.getShippedAttributesAntigens('ORD-001').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item!.antigens.length).toBe(1);
        expect(response.item!.attributes.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.SHIPPED_ATTRIBUTES_ANTIGENS('ORD-001'));
      req.flush({ success: true, item: mockData });
    });

    it('should propagate HTTP error', (done) => {
      service.getShippedAttributesAntigens('ORD-001').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(API.ORDER_HISTORY.SHIPPED_ATTRIBUTES_ANTIGENS('ORD-001'));
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
