import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AvailableProductsQueryService,
  AvailableProductsQueryRequest,
  ApiResponse,
  AvailableProduct,
  ProductAntigen,
  ProductAttribute,
  LookupItem,
  LookupsResponse,
} from './available-products-query.service';

describe('AvailableProductsQueryService', () => {
  let service: AvailableProductsQueryService;
  let httpMock: HttpTestingController;

  const BASE_URL = '/api/v1/inventory-management/available-products';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [AvailableProductsQueryService],
    });
    service = TestBed.inject(AvailableProductsQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getLookups', () => {
    it('should GET lookups without attributeGroup', () => {
      const mockResponse: LookupsResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          warehouses: [{ code: 'WH01', description: 'Warehouse 1' }],
          inventoryClasses: [{ code: 'BLD', description: 'Blood' }],
          productTypes: [{ code: 'RBC', description: 'Red Blood Cells' }],
          productCodes: [],
          bloodTypes: [{ code: 'O+', description: 'O Positive' }],
          attributeGroups: [{ code: 'CMV', description: 'CMV Status' }],
          attributeCodes: [],
        },
      };

      service.getLookups().subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.item.warehouses.length).toBe(1);
      });

      const req = httpMock.expectOne(`${BASE_URL}/lookups`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should GET lookups with attributeGroup parameter', () => {
      service.getLookups('CMV').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/lookups?attributeGroup=CMV`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: {} });
    });

    it('should call snackBar and rethrow on HTTP error', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.getLookups().subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/lookups`);
      req.flush({ message: 'Server unavailable' }, { status: 503, statusText: 'Service Unavailable' });

      expect(snackBar.open).toHaveBeenCalledWith('Server unavailable', 'Close', jasmine.any(Object));
      expect(errorCaught).toBeTrue();
    });

    it('should fall back to err.message when body has no message property', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');

      service.getLookups().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${BASE_URL}/lookups`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should use default message when body and err.message are both absent', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');

      service.getLookups().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${BASE_URL}/lookups`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('getProductCodes', () => {
    it('should GET product codes filtered by product type', () => {
      const mockResponse: ApiResponse<LookupItem> = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [{ code: 'E0070', description: 'Packed RBC' }],
        total: 1,
      };

      service.getProductCodes('RBC').subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].code).toBe('E0070');
      });

      const req = httpMock.expectOne(`${BASE_URL}/lookups/product-codes?productType=RBC`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call snackBar and rethrow on HTTP error', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.getProductCodes('RBC').subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/lookups/product-codes?productType=RBC`);
      req.flush({ message: 'Error loading product codes' }, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
      expect(errorCaught).toBeTrue();
    });
  });

  describe('getAttributeCodes', () => {
    it('should GET attribute codes filtered by attribute group', () => {
      const mockResponse: ApiResponse<LookupItem> = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [{ code: 'NEG', description: 'Negative' }],
        total: 1,
      };

      service.getAttributeCodes('CMV').subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].code).toBe('NEG');
      });

      const req = httpMock.expectOne(`${BASE_URL}/lookups/attribute-codes?attributeGroup=CMV`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call snackBar and rethrow on HTTP error', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.getAttributeCodes('CMV').subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/lookups/attribute-codes?attributeGroup=CMV`);
      req.flush({ message: 'Error loading attribute codes' }, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
      expect(errorCaught).toBeTrue();
    });
  });

  describe('queryProducts', () => {
    const mockRequest: AvailableProductsQueryRequest = {
      chapterId: 'CH01',
      warehouseId: 'WH01',
      inventoryClass: 'BLD',
      productType: 'RBC',
    };

    it('should POST to /query/{take}/{skip} with the provided request body', () => {
      const mockResponse: ApiResponse<AvailableProduct> = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          {
            unitId: 'U001',
            checkDigit: '3',
            productCode: 'E0070',
            aliquot: '01',
            bloodType: 'O+',
            bloodTypeDesc: 'O Positive',
            expDate: '2026-06-15T14:30:00',
            collDate: '2026-06-01T10:00:00',
            daysToExpiration: 1,
            warehouseId: 'WH01',
            inventoryClass: 'BLD',
            productType: 'RBC',
          },
        ],
        total: 1,
      };

      service.queryProducts(mockRequest, 25, 0).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(`${BASE_URL}/query/25/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should include optional filters in the request body when provided', () => {
      const requestWithOptionals: AvailableProductsQueryRequest = {
        ...mockRequest,
        productCode: 'E0070',
        bloodType: 'O+',
        attributeGroup: 'CMV',
        attributeCode: 'NEG',
      };

      service.queryProducts(requestWithOptionals, 10, 0).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/query/10/0`);
      expect(req.request.body.productCode).toBe('E0070');
      expect(req.request.body.bloodType).toBe('O+');
      expect(req.request.body.attributeGroup).toBe('CMV');
      expect(req.request.body.attributeCode).toBe('NEG');
      req.flush({
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [],
        total: 0,
      });
    });

    it('should open snackBar when error has no errors array', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.queryProducts(mockRequest, 25, 0).subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/query/25/0`);
      req.flush({ message: 'Query failed' }, { status: 400, statusText: 'Bad Request' });

      expect(snackBar.open).toHaveBeenCalledWith('Query failed', 'Close', jasmine.any(Object));
      expect(errorCaught).toBeTrue();
    });

    it('should NOT open snackBar when error body contains an errors array', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.queryProducts(mockRequest, 25, 0).subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/query/25/0`);
      req.flush({ errors: [{ errorCode: '0350' }] }, { status: 400, statusText: 'Bad Request' });

      expect(snackBar.open).not.toHaveBeenCalled();
      expect(errorCaught).toBeTrue();
    });

    it('should use fallback message when error body has no message and no errors', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');

      service.queryProducts(mockRequest, 25, 0).subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${BASE_URL}/query/25/0`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should use default take=10 and skip=0 when not supplied', () => {
      service.queryProducts(mockRequest).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/query/10/0`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'OK', statusCode: 200, data: [], total: 0 });
    });
  });

  describe('getProductAttributes', () => {
    it('should GET attributes for the given unitId', () => {
      const unitId = 'U001';
      const mockResponse: ApiResponse<ProductAttribute> = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [{ attributeGroup: 'CMV', attributeCode: 'NEG', description: 'CMV Negative', level: '1' }],
        total: 1,
      };

      service.getProductAttributes(unitId).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].attributeCode).toBe('NEG');
      });

      const req = httpMock.expectOne(`${BASE_URL}/${unitId}/attributes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should open snackBar and rethrow on HTTP error', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.getProductAttributes('U001').subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/U001/attributes`);
      req.flush(
        { message: 'Error fetching product attributes' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error fetching product attributes',
        'Close',
        jasmine.any(Object),
      );
      expect(errorCaught).toBeTrue();
    });

    it('should use fallback message when error body has no message', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');

      service.getProductAttributes('U001').subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${BASE_URL}/U001/attributes`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('getProductAntigens', () => {
    it('should GET antigens for the given unitId', () => {
      const unitId = 'U001';
      const mockResponse: ApiResponse<ProductAntigen> = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [{ antigenCode: 'C', antigenDescription: 'C antigen', result: 'POS' }],
        total: 1,
      };

      service.getProductAntigens(unitId).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].antigenCode).toBe('C');
      });

      const req = httpMock.expectOne(`${BASE_URL}/${unitId}/antigens`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should open snackBar and rethrow on HTTP error', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');
      let errorCaught = false;

      service.getProductAntigens('U001').subscribe({ error: () => (errorCaught = true) });

      const req = httpMock.expectOne(`${BASE_URL}/U001/antigens`);
      req.flush(
        { message: 'Error fetching antigen test results' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error fetching antigen test results',
        'Close',
        jasmine.any(Object),
      );
      expect(errorCaught).toBeTrue();
    });

    it('should use fallback message when antigen error body has no message', () => {
      const snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'open');

      service.getProductAntigens('U001').subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${BASE_URL}/U001/antigens`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalled();
    });
  });
});
