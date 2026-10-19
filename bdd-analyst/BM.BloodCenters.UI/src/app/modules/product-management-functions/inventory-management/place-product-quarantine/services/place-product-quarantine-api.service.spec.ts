import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PlaceProductQuarantineApiService } from './place-product-quarantine-api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  PlaceQuarantineRequestDto,
  UnitInfoDto,
  QuarantineReasonDto,
  QuarantineProductCodeDto,
  ApiResponse
} from '../models/place-product-quarantine.model';

describe('PlaceProductQuarantineApiService', () => {
  let service: PlaceProductQuarantineApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlaceProductQuarantineApiService]
    });

    service = TestBed.inject(PlaceProductQuarantineApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  describe('placeQuarantine', () => {
    it('should send POST request with correct payload', () => {
      const request: PlaceQuarantineRequestDto = {
        unitId: 'TEST001',
        productCode: 'PROD001',
        aliquot: '01',
        quarantineReasonCode: 'QR001'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Product successfully placed in quarantine',
        statusCode: 201
      };

      service.placeQuarantine(request).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API.PLACE_PRODUCT_QUARANTINE.PLACE_QUARANTINE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

  });

  describe('getUnitInfo', () => {
    it('should send GET request with correct query params and unwrap response', () => {
      const mockUnitInfo: UnitInfoDto = {
        aboDescription: 'A Positive',
        expirationDate: '2024-07-15T00:00:00Z',
        bloodType: 'A+'
      };

      service.getUnitInfo('TEST001', 'PROD001', '01').subscribe((info) => {
        expect(info).toEqual(mockUnitInfo);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.PLACE_PRODUCT_QUARANTINE.UNIT_INFO &&
          request.params.get('unitId') === 'TEST001' &&
          request.params.get('productCode') === 'PROD001' &&
          request.params.get('aliquot') === '01'
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: mockUnitInfo });
    });
  });

  describe('getQuarantineReasons', () => {
    it('should send GET request and unwrap data array', () => {
      const mockReasons: QuarantineReasonDto[] = [
        { code: 'QR001', description: 'Product contamination' },
        { code: 'QR002', description: 'Quality control failure' }
      ];

      service.getQuarantineReasons().subscribe((reasons) => {
        expect(reasons).toEqual(mockReasons);
        expect(reasons.length).toBe(2);
      });

      const req = httpMock.expectOne(API.PLACE_PRODUCT_QUARANTINE.QUARANTINE_REASONS);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReasons });
    });

    it('should return empty array when data is missing', () => {
      service.getQuarantineReasons().subscribe((reasons) => {
        expect(reasons).toEqual([]);
      });

      const req = httpMock.expectOne(API.PLACE_PRODUCT_QUARANTINE.QUARANTINE_REASONS);
      req.flush({ success: true });
    });
  });

  describe('getAliquots', () => {
    it('should send GET request and unwrap string array', () => {
      service.getAliquots('TEST001', 'PROD001').subscribe((aliquots) => {
        expect(aliquots).toEqual(['01', '02', '03']);
        expect(aliquots.length).toBe(3);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.PLACE_PRODUCT_QUARANTINE.ALIQUOTS &&
          request.params.get('unitId') === 'TEST001' &&
          request.params.get('productCode') === 'PROD001'
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: ['01', '02', '03'] });
    });

    it('should return empty array when no aliquots found', () => {
      service.getAliquots('INVALID', 'PROD001').subscribe((aliquots) => {
        expect(aliquots).toEqual([]);
      });

      const req = httpMock.expectOne(
        (request) => request.url === API.PLACE_PRODUCT_QUARANTINE.ALIQUOTS
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('getProductCodes', () => {
    it('should send GET request and unwrap data array', () => {
      const mockProducts: QuarantineProductCodeDto[] = [
        { code: 'PROD001', description: 'Whole Blood' },
        { code: 'PROD002', description: 'Red Blood Cells' }
      ];

      service.getProductCodes('TEST001', 'I').subscribe((products) => {
        expect(products).toEqual(mockProducts);
        expect(products.length).toBe(2);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.PLACE_PRODUCT_QUARANTINE.PRODUCT_CODES &&
          request.params.get('unitId') === 'TEST001' &&
          request.params.get('codeScheme') === 'I'
      );

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockProducts });
    });

    it('should return empty array when no products found', () => {
      service.getProductCodes('INVALID', 'I').subscribe((products) => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne(
        (request) => request.url === API.PLACE_PRODUCT_QUARANTINE.PRODUCT_CODES
      );
      req.flush({ success: true, data: [] });
    });
  });

  describe('getUnitInfo - data fallback', () => {
    it('should map response.data for getUnitInfo when item is null', () => {
      const mockInfo: UnitInfoDto = {
        aboDescription: 'B Negative',
        expirationDate: '2024-08-20T00:00:00Z',
        bloodType: 'B-'
      };

      service.getUnitInfo('TEST002', 'PROD002', '01').subscribe((info) => {
        expect(info).toEqual(mockInfo);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === API.PLACE_PRODUCT_QUARANTINE.UNIT_INFO &&
          request.params.get('unitId') === 'TEST002' &&
          request.params.get('productCode') === 'PROD002' &&
          request.params.get('aliquot') === '01'
      );

      req.flush({ success: true, data: [mockInfo] });
    });
  });

  describe('SKIP_ERROR_TOAST context', () => {
    it('should pass SKIP_ERROR_TOAST context on placeQuarantine', () => {
      const request: PlaceQuarantineRequestDto = {
        unitId: 'TEST001',
        productCode: 'PROD001',
        aliquot: '01',
        quarantineReasonCode: 'QR001'
      };

      service.placeQuarantine(request).subscribe();

      const req = httpMock.expectOne(API.PLACE_PRODUCT_QUARANTINE.PLACE_QUARANTINE);
      expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
      req.flush({ success: true });
    });

    it('should pass SKIP_ERROR_TOAST context on getUnitInfo', () => {
      service.getUnitInfo('TEST001', 'PROD001', '01').subscribe();

      const req = httpMock.expectOne(
        (request) => request.url === API.PLACE_PRODUCT_QUARANTINE.UNIT_INFO
      );
      expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
      req.flush({ success: true, item: {} });
    });
  });

  describe('getQuarantineReasons - item path', () => {
    it('should return item array from getQuarantineReasons when item is array', () => {
      const reasons: QuarantineReasonDto[] = [
        { code: 'QR001', description: 'Contamination' },
        { code: 'QR002', description: 'Quality failure' }
      ];

      service.getQuarantineReasons().subscribe((result) => {
        expect(result).toEqual(reasons);
      });

      const req = httpMock.expectOne(API.PLACE_PRODUCT_QUARANTINE.QUARANTINE_REASONS);
      req.flush({ item: reasons });
    });
  });

  describe('getProductCodes - nested arrays', () => {
    it('should flatten nested array from getProductCodes', () => {
      const product1: QuarantineProductCodeDto = { code: 'PROD001', description: 'Whole Blood' };
      const product2: QuarantineProductCodeDto = { code: 'PROD002', description: 'Red Blood Cells' };

      service.getProductCodes('TEST001', 'I').subscribe((products) => {
        expect(products).toEqual([product1, product2]);
      });

      const req = httpMock.expectOne(
        (request) => request.url === API.PLACE_PRODUCT_QUARANTINE.PRODUCT_CODES
      );
      req.flush({ data: [[product1], [product2]] });
    });

    it('should return empty array from getProductCodes for empty response', () => {
      service.getProductCodes('TEST001', 'I').subscribe((products) => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne(
        (request) => request.url === API.PLACE_PRODUCT_QUARANTINE.PRODUCT_CODES
      );
      req.flush({});
    });
  });

  describe('getAliquots - empty response', () => {
    it('should return empty array from getAliquots when response has no data', () => {
      service.getAliquots('TEST001', 'PROD001').subscribe((aliquots) => {
        expect(aliquots).toEqual([]);
      });

      const req = httpMock.expectOne(
        (request) => request.url === API.PLACE_PRODUCT_QUARANTINE.ALIQUOTS
      );
      req.flush({ success: true });
    });
  });
});
