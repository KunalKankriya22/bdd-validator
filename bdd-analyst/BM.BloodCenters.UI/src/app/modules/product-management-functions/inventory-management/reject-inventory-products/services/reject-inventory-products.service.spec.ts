import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RejectInventoryProductsService } from './reject-inventory-products.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';

describe('RejectInventoryProductsService', () => {
  let service: RejectInventoryProductsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RejectInventoryProductsService]
    });
    service = TestBed.inject(RejectInventoryProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  describe('validateUnit', () => {
    it('should validate a unit successfully', () => {
      const request = { unitId: 'W633325111901' };
      const mockResponse = {
        success: true,
        message: null,
        statusCode: 200,
        item: {
          unitId: 'W633325111901',
          collDate: '2026-05-23T00:00:00',
          isValid: true
        }
      };

      service.validateUnit(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.unitId).toBe('W633325111901');
        expect(response.item?.isValid).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.VALIDATE_UNIT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle validation error response', () => {
      const request = { unitId: 'INVALID' };
      const mockError = {
        success: false,
        message: 'Unit not found',
        statusCode: 400,
        errorCode: '0701'
      };

      service.validateUnit(request).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.errorCode).toBe('0701');
        expect(response.message).toBe('Unit not found');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.VALIDATE_UNIT}`);
      req.flush(mockError);
    });


  });

  describe('getProductCodes', () => {
    it('should fetch product codes with default code scheme', () => {
      const unitId = 'W633325111901';
      const collDate = '2026-05-23T00:00:00';
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: [
          { productCode: 'E0701V00', productDesc: 'FRESH FROZEN PLASMA' },
          { productCode: 'E2807V00', productDesc: 'PLATELETS' }
        ]
      };

      service.getProductCodes(unitId, collDate).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.length).toBe(2);
        expect(response.item?.[0].productCode).toBe('E0701V00');
      });

      const req = httpMock.expectOne(request =>
        request.url === `${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.PRODUCT_CODES}` &&
        request.params.get('unitId') === unitId &&
        request.params.get('collDate') === collDate &&
        request.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch product codes with custom code scheme', () => {
      const unitId = 'W633325111901';
      const collDate = '2026-05-23';
      const codeScheme = 'CUSTOM';
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: []
      };

      service.getProductCodes(unitId, collDate, codeScheme).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.length).toBe(0);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.PRODUCT_CODES}` &&
        request.params.get('codeScheme') === codeScheme
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should include all query parameters', () => {
      const unitId = 'W633325111901';
      const collDate = '2026-05-23T00:00:00';
      const codeScheme = 'X';

      service.getProductCodes(unitId, collDate, codeScheme).subscribe();

      const req = httpMock.expectOne(request =>
        request.params.get('unitId') === unitId &&
        request.params.get('collDate') === collDate &&
        request.params.get('codeScheme') === codeScheme
      );
      req.flush({ success: true, statusCode: 200, item: [] });
    });
  });

  describe('getRejectionCodes', () => {
    it('should fetch rejection codes successfully', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: [
          { code: 'RJ01', codeDesc: 'Damaged Product' },
          { code: 'BROK', codeDesc: 'Broken Bag' }
        ]
      };

      service.getRejectionCodes().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.length).toBe(2);
        expect(response.item?.[0].code).toBe('RJ01');
        expect(response.item?.[0].codeDesc).toBe('Damaged Product');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECTION_CODES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });



    it('should use GET method', () => {
      service.getRejectionCodes().subscribe();

      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECTION_CODES}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, item: [] });
    });
  });

  describe('rejectInventoryProduct', () => {
    it('should reject product successfully', () => {
      const request = {
        unitId: 'W633325111901',
        productCode: 'E0701V00',
        rejectCode: 'RJ01',
        codeScheme: 'I'
      };

      const mockResponse = {
        success: true,
        message: 'Product rejected successfully',
        statusCode: 200,
        item: {
          unitId: 'W633325111901',
          productCode: 'E0701V00',
          rejectionCode: 'RJ01',
          rejectionReason: 'Damaged Product',
          aboRh: '17',
          expirationDate: '2026-06-15',
          location: 'DISCARD-BIN'
        }
      };

      service.rejectInventoryProduct(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Product rejected successfully');
        if (response.item) {
          expect(response.item.unitId).toBe('W633325111901');
          expect(response.item.productCode).toBe('E0701V00');
          expect(response.item.rejectionCode).toBe('RJ01');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });



    it('should send correct request body', () => {
      const request = {
        unitId: 'TEST123',
        productCode: 'PROD001',
        rejectCode: 'REJECT1',
        codeScheme: 'X'
      };

      service.rejectInventoryProduct(request).subscribe();

      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECT}`);
      expect(req.request.body.unitId).toBe('TEST123');
      expect(req.request.body.productCode).toBe('PROD001');
      expect(req.request.body.rejectCode).toBe('REJECT1');
      expect(req.request.body.codeScheme).toBe('X');
      req.flush({ success: true, statusCode: 200, item: {} as any });
    });
  });

  describe('searchRejectedInventory', () => {
    it('should search with all criteria', () => {
      const criteria = {
        unitId: 'W633325111901',
        productCode: 'E0701V00',
        rejectionCode: 'RJ01'
      };
      const pageIndex = 0;
      const pageSize = 10;

      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          items: [
            {
              unitId: 'W633325111901',
              productCode: 'E0701V00',
              rejectionCode: 'RJ01',
              rejectionReason: 'Damaged',
              aboRh: '17',
              expirationDate: '2026-06-15',
              location: 'BIN'
            }
          ],
          totalRecords: 1,
          pageIndex: 0,
          pageSize: 10
        }
      };

      service.searchRejectedInventory(criteria, pageIndex, pageSize).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item?.items.length).toBe(1);
        expect(response.item?.totalRecords).toBe(1);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.SEARCH}` &&
        request.params.get('unitId') === criteria.unitId &&
        request.params.get('productCode') === criteria.productCode &&
        request.params.get('rejectionCode') === criteria.rejectionCode &&
        request.params.get('pageIndex') === pageIndex.toString() &&
        request.params.get('pageSize') === pageSize.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should search with partial criteria', () => {
      const criteria = {
        unitId: 'W633325111901'
      };

      service.searchRejectedInventory(criteria).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === `${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.SEARCH}` &&
        request.params.get('unitId') === 'W633325111901' &&
        !request.params.has('productCode') &&
        !request.params.has('rejectionCode')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, item: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 10 } });
    });

    it('should search with default pagination', () => {
      const criteria = {};

      service.searchRejectedInventory(criteria).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === `${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.SEARCH}` &&
        request.params.get('pageIndex') === '0' &&
        request.params.get('pageSize') === '10'
      );
      req.flush({ success: true, statusCode: 200, item: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 10 } });
    });

    it('should search with custom pagination', () => {
      const criteria = {};
      const pageIndex = 2;
      const pageSize = 25;

      service.searchRejectedInventory(criteria, pageIndex, pageSize).subscribe();

      const req = httpMock.expectOne(request =>
        request.params.get('pageIndex') === '2' &&
        request.params.get('pageSize') === '25'
      );
      req.flush({ success: true, statusCode: 200, item: { items: [], totalRecords: 0, pageIndex: 2, pageSize: 25 } });
    });


  });

  describe('HTTP Methods', () => {
    it('should use POST for validateUnit', () => {
      service.validateUnit({ unitId: 'TEST' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.VALIDATE_UNIT}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200 });
    });

    it('should use GET for getProductCodes', () => {
      service.getProductCodes('TEST', '2026-05-23').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/product-codes'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, item: [] });
    });

    it('should use GET for getRejectionCodes', () => {
      service.getRejectionCodes().subscribe();
      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECTION_CODES}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, item: [] });
    });

    it('should use POST for rejectInventoryProduct', () => {
      service.rejectInventoryProduct({
        unitId: 'TEST',
        productCode: 'TEST',
        rejectCode: 'TEST',
        codeScheme: 'I'
      }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECT}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200, item: {} as any });
    });

    it('should use GET for searchRejectedInventory', () => {
      service.searchRejectedInventory({}).subscribe();
      const req = httpMock.expectOne(r => r.url.includes(API.REJECT_INVENTORY_PRODUCTS.SEARCH));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, item: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 10 } });
    });
  });
});
