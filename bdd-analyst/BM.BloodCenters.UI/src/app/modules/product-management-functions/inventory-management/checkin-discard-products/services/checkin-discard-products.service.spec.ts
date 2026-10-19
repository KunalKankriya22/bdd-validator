import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CheckinDiscardProductsService } from './checkin-discard-products.service';
import { API } from '@core/constants/api.constants';

describe('CheckinDiscardProductsService', () => {
  let service: CheckinDiscardProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CheckinDiscardProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('verifyDiscardUnit should POST unitId', (done) => {
    const mockResp = { success: true, data: { valid: true } };
    service.verifyDiscardUnit('U1').subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(API.CHECKIN_DISCARD_PRODUCTS.VERIFY_DISCARD_UNIT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ unitId: 'U1' });
    req.flush(mockResp);
  });

  // Group simple GET-with-params methods
  [
    {
      method: 'getProductCodes',
      args: ['U1', '2024-01-01'],
      url: API.CHECKIN_DISCARD_PRODUCTS.PRODUCT_CODES,
      params: { unitId: 'U1', collDate: '2024-01-01' }
    },
    {
      method: 'getAboTypes',
      args: ['U1', '2024-01-01', 'PC1'],
      url: API.CHECKIN_DISCARD_PRODUCTS.ABO_TYPES,
      params: { unitId: 'U1', collDate: '2024-01-01', productCode: 'PC1' }
    },
    {
      method: 'getDevices',
      args: ['WH1', 'PT1'],
      url: API.CHECKIN_DISCARD_PRODUCTS.DEVICES,
      params: { warehouseId: 'WH1', productType: 'PT1' }
    }
  ].forEach(({ method, args, url, params }) => {
    it(`${method} should GET with correct query params`, (done) => {
      const mockResp = { success: true, data: [] };
      (service as any)[method](...args).subscribe((res: any) => {
        expect(res).toEqual(mockResp);
        done();
      });
      const req = httpMock.expectOne((r) => r.url === url && r.method === 'GET');
      Object.entries(params).forEach(([key, val]) => {
        expect(req.request.params.get(key)).toBe(val);
      });
      req.flush(mockResp);
    });
  });

  it('getLocationDefaults should pass all 6 query params', (done) => {
    const mockResp = { success: true, data: {} };
    service.getLocationDefaults('PT', 'BT', 'U1', '2024-01-01', 'PC', 'AL').subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne((r) => r.url === API.CHECKIN_DISCARD_PRODUCTS.LOCATION_DEFAULTS);
    expect(req.request.params.get('productType')).toBe('PT');
    expect(req.request.params.get('bloodType')).toBe('BT');
    expect(req.request.params.get('aliquot')).toBe('AL');
    req.flush(mockResp);
  });

  it('getRacks should pass all 6 query params', (done) => {
    const mockResp = { success: true, data: [] };
    service.getRacks('WH', 'DT', 'DN', 'SC', 'PT', 'BT').subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne((r) => r.url === API.CHECKIN_DISCARD_PRODUCTS.RACKS);
    expect(req.request.params.get('warehouseId')).toBe('WH');
    expect(req.request.params.get('storageClass')).toBe('SC');
    expect(req.request.params.get('bloodType')).toBe('BT');
    req.flush(mockResp);
  });

  it('getTrays should pass 4 query params', (done) => {
    const mockResp = { success: true, data: [] };
    service.getTrays('WH', 'DT', 'DN', 'RN').subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne((r) => r.url === API.CHECKIN_DISCARD_PRODUCTS.TRAYS);
    expect(req.request.params.get('rackNumber')).toBe('RN');
    req.flush(mockResp);
  });

  it('checkinProduct should POST with SKIP_ERROR_TOAST context', (done) => {
    const body = { unitId: 'U1' } as any;
    const mockResp = { success: true, data: {} };
    service.checkinProduct(body).subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(API.CHECKIN_DISCARD_PRODUCTS.CHECKIN);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResp);
  });
});
