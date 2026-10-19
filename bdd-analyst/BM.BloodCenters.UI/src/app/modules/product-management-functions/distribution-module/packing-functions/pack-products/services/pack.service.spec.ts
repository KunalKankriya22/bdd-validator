import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpContext } from '@angular/common/http';
import { PackService, LookupOption } from './pack.service';
import {
  PackProductRequestDto,
  CreateBoxRequestDto,
  ValidateUnitRequestDto,
  ApiResponse,
  OrderDetailDto,
  OrderSearchDto,
  OrderItemDto,
  PickSlipDto,
  ActiveBoxDto,
  BoxTypeDto,
  PackedProductDto,
  BoxContentsDto,
  PackStatusItemDto,
  UnpackProductRequestDto,
  QuarantineProductRequestDto
} from '../models/pack.models';

describe('PackService', () => {
  let service: PackService;
  let httpMock: HttpTestingController;
  const base = '/api/v1/pack-products';
  const offlineBase = '/api/v1/offline-packing';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PackService]
    });
    service = TestBed.inject(PackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── Orders ────────────────────────────────────────────────────────────────────

  describe('getAllOrders', () => {
    it('should GET all packable orders', () => {
      const mock: ApiResponse<OrderSearchDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.getAllOrders().subscribe(r => expect(r.success).toBeTrue());
      const req = httpMock.expectOne(`${base}/orders`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });
  });

  describe('searchOrders', () => {
    it('should GET orders with search param when searchTerm is provided', () => {
      const searchTerm = 'ORD-100';
      const mock: ApiResponse<OrderSearchDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.searchOrders(searchTerm).subscribe(r => expect(r.success).toBeTrue());
      const req = httpMock.expectOne(r => r.url === `${base}/orders/search`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe(searchTerm);
      req.flush(mock);
    });

    it('should GET orders without search param when searchTerm is undefined', () => {
      const mock: ApiResponse<OrderSearchDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.searchOrders().subscribe(r => expect(r.success).toBeTrue());
      const req = httpMock.expectOne(r => r.url === `${base}/orders/search`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('search')).toBeFalse();
      req.flush(mock);
    });

    it('should GET orders without search param when searchTerm is empty string', () => {
      const mock: ApiResponse<OrderSearchDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.searchOrders('').subscribe(r => expect(r.success).toBeTrue());
      const req = httpMock.expectOne(r => r.url === `${base}/orders/search`);
      expect(req.request.params.has('search')).toBeFalse();
      req.flush(mock);
    });

    it('should return matching orders from search', () => {
      const results: OrderSearchDto[] = [{ orderNo: 'ORD-100' } as OrderSearchDto];
      const mock: ApiResponse<OrderSearchDto[]> = { success: true, statusCode: 200, message: '', data: results };
      service.searchOrders('ORD-100').subscribe(r => {
        expect(r.data?.length).toBe(1);
        expect(r.data![0].orderNo).toBe('ORD-100');
      });
      httpMock.expectOne(r => r.url === `${base}/orders/search`).flush(mock);
    });
  });

  describe('getOrderDetails', () => {
    it('should GET order details for given order number', () => {
      const orderNo = 'ORD-001';
      const mock: ApiResponse<OrderDetailDto> = {
        success: true, statusCode: 200, message: '',
        data: { orderNo, items: [], shipToAddress: 'Test', estArrivalTime: null }
      };
      service.getOrderDetails(orderNo).subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.data?.orderNo).toBe(orderNo);
      });
      const req = httpMock.expectOne(`${base}/orders/${orderNo}`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('should handle order not found', () => {
      const orderNo = 'NOTEXIST';
      const mock: ApiResponse<OrderDetailDto> = { success: false, statusCode: 404, message: 'Not found' };
      service.getOrderDetails(orderNo).subscribe(r => expect(r.success).toBeFalse());
      httpMock.expectOne(`${base}/orders/${orderNo}`).flush(mock);
    });
  });

  describe('getOrderItems', () => {
    it('should GET order items for a given order number', () => {
      const orderNo = 'ORD-001';
      const items: OrderItemDto[] = [
        { itemNo: 1, productType: 'RBC', productDescription: 'Red Blood Cells', remainingQty: 5 },
        { itemNo: 2, productType: 'PLT', productDescription: 'Platelets', remainingQty: 3 }
      ];
      const mock: ApiResponse<OrderItemDto[]> = { success: true, statusCode: 200, message: '', data: items };
      service.getOrderItems(orderNo).subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.data?.length).toBe(2);
        expect(r.data![0].itemNo).toBe(1);
        expect(r.data![1].productType).toBe('PLT');
      });
      const req = httpMock.expectOne(`${base}/orders/${orderNo}/items`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('should handle empty items list', () => {
      const orderNo = 'ORD-EMPTY';
      const mock: ApiResponse<OrderItemDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.getOrderItems(orderNo).subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.data?.length).toBe(0);
      });
      httpMock.expectOne(`${base}/orders/${orderNo}/items`).flush(mock);
    });

    it('should handle error response for order items', () => {
      const orderNo = 'BAD-ORDER';
      const mock: ApiResponse<OrderItemDto[]> = { success: false, statusCode: 404, message: 'Order not found' };
      service.getOrderItems(orderNo).subscribe(r => expect(r.success).toBeFalse());
      httpMock.expectOne(`${base}/orders/${orderNo}/items`).flush(mock);
    });
  });

  describe('getPickSlipsForOrder', () => {
    it('should GET pick slips for an order', () => {
      const orderNo = 'ORD-001';
      const mock: ApiResponse<PickSlipDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.getPickSlipsForOrder(orderNo).subscribe(r => expect(r.success).toBeTrue());
      httpMock.expectOne(`${base}/orders/${orderNo}/pick-slips`).flush(mock);
    });
  });

  // ── Boxes ─────────────────────────────────────────────────────────────────────

  describe('getActiveBoxes', () => {
    it('should GET active open boxes', () => {
      const mock: ApiResponse<ActiveBoxDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.getActiveBoxes().subscribe(r => expect(r.success).toBeTrue());
      httpMock.expectOne(`${base}/boxes/active`).flush(mock);
    });
  });

  describe('getBoxTypes', () => {
    it('should GET valid box types', () => {
      const mock: ApiResponse<BoxTypeDto[]> = {
        success: true, statusCode: 200, message: '',
        data: [{ code: 'CO', description: 'Cooler' }]
      };
      service.getBoxTypes().subscribe(r => expect(r.data?.length).toBe(1));
      httpMock.expectOne(`${base}/box-types`).flush(mock);
    });
  });

  describe('createBox', () => {
    it('should POST to create a new box and return box ID', () => {
      const req: CreateBoxRequestDto = { boxType: 'CO' };
      const mock: ApiResponse<string> = { success: true, statusCode: 201, message: '', data: 'BOX-001' };
      service.createBox(req).subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.data).toBe('BOX-001');
      });
      const http = httpMock.expectOne(`${base}/boxes`);
      expect(http.request.method).toBe('POST');
      http.flush(mock);
    });
  });

  describe('closeBox', () => {
    it('should PUT to close a box', () => {
      const boxId = 'BOX-001';
      const mock: ApiResponse<boolean> = { success: true, statusCode: 200, message: 'Box closed' };
      service.closeBox(boxId).subscribe(r => expect(r.success).toBeTrue());
      const req = httpMock.expectOne(`${base}/boxes/${boxId}/close`);
      expect(req.request.method).toBe('PUT');
      req.flush(mock);
    });
  });

  describe('getBoxContents', () => {
    it('should GET box contents returning BoxContentsDto', () => {
      const boxId = 'BOX-001';
      const mock: ApiResponse<BoxContentsDto> = {
        success: true, statusCode: 200, message: '',
        data: { boxId, products: [{ unitId: 'U1', productCode: 'P1' } as PackedProductDto] }
      };
      service.getBoxContents(boxId).subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.data?.products?.length).toBe(1);
      });
      httpMock.expectOne(`${base}/boxes/${boxId}/contents`).flush(mock);
    });
  });

  // ── Packing ───────────────────────────────────────────────────────────────────

  describe('packProduct', () => {
    it('should POST pack product request', () => {
      const req: PackProductRequestDto = {
        orderNo: 'ORD-001', pickSlipId: 'PS-001', boxId: 'BOX-001',
        itemNo: 1, unitId: 'W123', productCode: 'E0385V00',
        aliquot: '00', bloodType: '51', expDate: '2026-12-31T23:59:00', qcCheck: 'Y'
      };
      const mock: ApiResponse<boolean> = { success: true, statusCode: 200, message: 'Packed' };
      service.packProduct(req).subscribe(r => expect(r.success).toBeTrue());
      const http = httpMock.expectOne(`${base}/pack`);
      expect(http.request.method).toBe('POST');
      http.flush(mock);
    });

    it('should return validation error from BE', () => {
      const req: PackProductRequestDto = {
        orderNo: 'X', pickSlipId: 'Y', boxId: 'Z', itemNo: 1,
        unitId: 'U', productCode: 'P'
      };
      const mock: ApiResponse<boolean> = { success: false, statusCode: 400, message: 'Unit not available (0312)' };
      service.packProduct(req).subscribe(r => expect(r.success).toBeFalse());
      httpMock.expectOne(`${base}/pack`).flush(mock);
    });
  });

  describe('unpackProduct', () => {
    it('should POST to unpack a product', () => {
      const req: UnpackProductRequestDto = { pickSlipId: 'PS-001', unitId: 'W123', productCode: 'E0385V00' };
      const mock: ApiResponse<boolean> = { success: true, statusCode: 200, message: 'Unpacked' };
      service.unpackProduct(req).subscribe(r => expect(r.success).toBeTrue());
      const http = httpMock.expectOne(`${base}/unpack`);
      expect(http.request.method).toBe('POST');
      http.flush(mock);
    });
  });

  describe('quarantineProduct', () => {
    it('should POST quarantine request', () => {
      const req: QuarantineProductRequestDto = {
        orderNo: 'ORD-001', pickSlipId: 'PS-001',
        unitId: 'W123', productCode: 'E0385V00',
        aliquot: '00', reason: 'QC failed'
      };
      const mock: ApiResponse<boolean> = { success: true, statusCode: 200, message: 'Quarantined' };
      service.quarantineProduct(req).subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.message).toBe('Quarantined');
      });
      const http = httpMock.expectOne(`${base}/quarantine`);
      expect(http.request.method).toBe('POST');
      expect(http.request.body).toEqual(req);
      http.flush(mock);
    });

    it('should handle quarantine failure response', () => {
      const req: QuarantineProductRequestDto = {
        orderNo: 'ORD-001', unitId: 'W123',
        productCode: 'E0385V00', reason: 'QC failed'
      };
      const mock: ApiResponse<boolean> = { success: false, statusCode: 400, message: 'Unit already quarantined' };
      service.quarantineProduct(req).subscribe(r => {
        expect(r.success).toBeFalse();
        expect(r.message).toBe('Unit already quarantined');
      });
      httpMock.expectOne(`${base}/quarantine`).flush(mock);
    });
  });

  describe('getPackedProducts', () => {
    it('should GET packed products for a pick slip', () => {
      const pickSlipId = 'PS-001';
      const mock: ApiResponse<PackedProductDto[]> = {
        success: true, statusCode: 200, message: '',
        data: [{ unitId: 'W123', productCode: 'E0385V00' } as PackedProductDto]
      };
      service.getPackedProducts(pickSlipId).subscribe(r => expect(r.data?.length).toBe(1));
      httpMock.expectOne(`${base}/pick-slips/${pickSlipId}/products`).flush(mock);
    });
  });

  describe('getPackStatus', () => {
    it('should GET pack status items for a pick slip', () => {
      const pickSlipId = 'PS-001';
      const mock: ApiResponse<PackStatusItemDto[]> = { success: true, statusCode: 200, message: '', data: [] };
      service.getPackStatus(pickSlipId).subscribe(r => expect(r.success).toBeTrue());
      httpMock.expectOne(`${base}/pack-status/${pickSlipId}`).flush(mock);
    });
  });

  // ── Validation ────────────────────────────────────────────────────────────────

  describe('validateExpiry', () => {
    it('should POST expiry validation request', () => {
      const payload = { unitId: 'W123', productCode: 'E0385V00', aliquot: '00', expiryDate: '31-DEC-2026 23:59' };
      const mock: ApiResponse<boolean> = { success: true, statusCode: 200, message: 'Valid' };
      service.validateExpiry(payload).subscribe(r => expect(r.success).toBeTrue());
      const req = httpMock.expectOne(`${base}/validate-expiry`);
      expect(req.request.method).toBe('POST');
      req.flush(mock);
    });
  });

  describe('getUnitExpiry', () => {
    it('should GET expiry date for unit+product+aliquot', () => {
      const mock = { success: true, data: '31-DEC-2026 23:59' };
      service.getUnitExpiry('W123', 'E0385V00', '00').subscribe(r => {
        expect(r.success).toBeTrue();
        expect(r.data).toBe('31-DEC-2026 23:59');
      });
      const req = httpMock.expectOne(r => r.url.includes('/units/W123/expiry'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('productCode')).toBe('E0385V00');
      expect(req.request.params.get('aliquot')).toBe('00');
      req.flush(mock);
    });

  });

  describe('validateUnit', () => {
    it('should POST validate-unit request', () => {
      const req: ValidateUnitRequestDto = { scannedValue: 'W123', orderNo: 'ORD-001', itemNo: 1 };
      const mock: ApiResponse<boolean> = { success: true, statusCode: 200, message: 'Valid' };
      service.validateUnit(req).subscribe(r => expect(r.success).toBeTrue());
      const http = httpMock.expectOne(`${base}/validate-unit`);
      expect(http.request.method).toBe('POST');
      http.flush(mock);
    });
  });

  // ── Lookups (cascade: Unit -> Product Codes -> Aliquots -> Blood Types) ──────

  describe('getProductCodes', () => {
    it('should GET product codes for a given unitId', () => {
      const unitId = 'W123';
      const mock: LookupOption[] = [
        { value: 'E0385V00', label: 'Red Blood Cells' },
        { value: 'E0700V00', label: 'Platelets' }
      ];
      service.getProductCodes(unitId).subscribe(r => {
        expect(r.length).toBe(2);
        expect(r[0].value).toBe('E0385V00');
        expect(r[1].label).toBe('Platelets');
      });
      const req = httpMock.expectOne(`${offlineBase}/lookups/product-codes/${unitId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('should return empty array when no product codes exist', () => {
      const unitId = 'UNKNOWN';
      service.getProductCodes(unitId).subscribe(r => {
        expect(r.length).toBe(0);
      });
      httpMock.expectOne(`${offlineBase}/lookups/product-codes/${unitId}`).flush([]);
    });
  });

  describe('getAliquots', () => {
    it('should GET aliquots for a given unitId and productCode', () => {
      const unitId = 'W123';
      const productCode = 'E0385V00';
      const mock: LookupOption[] = [
        { value: '00', label: 'Primary' },
        { value: '01', label: 'Split 1' }
      ];
      service.getAliquots(unitId, productCode).subscribe(r => {
        expect(r.length).toBe(2);
        expect(r[0].value).toBe('00');
        expect(r[1].value).toBe('01');
      });
      const req = httpMock.expectOne(`${offlineBase}/lookups/aliquots/${unitId}/${productCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('should return empty array when no aliquots exist', () => {
      const unitId = 'W123';
      const productCode = 'NONE';
      service.getAliquots(unitId, productCode).subscribe(r => {
        expect(r.length).toBe(0);
      });
      httpMock.expectOne(`${offlineBase}/lookups/aliquots/${unitId}/${productCode}`).flush([]);
    });
  });

  describe('getBloodTypes', () => {
    it('should GET blood types for a given unitId and productCode', () => {
      const unitId = 'W123';
      const productCode = 'E0385V00';
      const mock: LookupOption[] = [
        { value: '51', label: 'O Positive' },
        { value: '52', label: 'O Negative' }
      ];
      service.getBloodTypes(unitId, productCode).subscribe(r => {
        expect(r.length).toBe(2);
        expect(r[0].value).toBe('51');
        expect(r[1].label).toBe('O Negative');
      });
      const req = httpMock.expectOne(`${offlineBase}/lookups/blood-types/${unitId}/${productCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('should return empty array when no blood types exist', () => {
      const unitId = 'W123';
      const productCode = 'NONE';
      service.getBloodTypes(unitId, productCode).subscribe(r => {
        expect(r.length).toBe(0);
      });
      httpMock.expectOne(`${offlineBase}/lookups/blood-types/${unitId}/${productCode}`).flush([]);
    });
  });
});
