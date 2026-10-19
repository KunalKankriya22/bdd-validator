import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PackodApiService } from './packod-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  DiscardProductDto,
  DiscardProductQueryDto,
  AddProductToBoxRequestDto,
  CloseBoxRequestDto,
} from '../models/packod.model';

describe('PackodApiService', () => {
  let service: PackodApiService;
  let httpMock: HttpTestingController;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProduct: DiscardProductDto = {
    unitId: 'UNIT123456789',
    pickSlipId: null,
    collDate: '2026-06-10T00:00:00Z',
    productCode: 'PRBC',
    productType: 'RBC',
    bloodType: 'OP',
    productStatus: 'CK',
    expDate: '2026-07-15T23:59:00Z',
    aliquot: '001',
    boxId: null,
    chkDigit: '12',
    aboDesc: 'O Positive',
    productDesc: 'Packed RBC',
  };

  const mockApiResponse: ApiResponse<DiscardProductDto[]> = {
    success: true, statusCode: 200, message: 'OK', data: [mockProduct], total: 1,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PackodApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(PackodApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAvailableProducts', () => {
    it('should post with correct URL and query', (done) => {
      const query: DiscardProductQueryDto = { productType: 'RBC', sortColumn: 'UnitId', sortOrder: 'ASC' };
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getAvailableProducts(10, 0, query).subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data).toEqual([mockProduct]);
          expect(res.total).toBe(1);
          done();
        },
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.PACK_INV_REJECTS.PRODUCTS(10, 0), query, jasmine.any(Object)
      );
    });

    it('should normalize missing success/total fields', (done) => {
      apiServiceSpy.post.and.returnValue(of({ statusCode: 200, data: [mockProduct] }));

      service.getAvailableProducts(10, 0, {}).subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.total).toBe(0);
          done();
        },
      });
    });

    it('should default data to empty array when missing', (done) => {
      apiServiceSpy.post.and.returnValue(of({ statusCode: 200 }));

      service.getAvailableProducts(10, 0, {}).subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getConsignees', () => {
    it('should get consignees with SKIP context', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [{ consigneeId: 'C1' }] }));

      service.getConsignees().subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data?.length).toBe(1);
          done();
        },
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_INV_REJECTS.CONSIGNEES, jasmine.any(Object));
    });

    it('should normalize missing fields', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getConsignees().subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getOrders', () => {
    it('should pass consigneeId and customerId as query params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [{ orderNo: 'O1' }] }));

      service.getOrders('CONS01', 'CUST01').subscribe({ next: () => done() });

      const url = apiServiceSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('consigneeId=CONS01');
      expect(url).toContain('customerId=CUST01');
    });

    it('should normalize response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getOrders('C', 'D').subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getProductTypes', () => {
    it('should pass consigneeId and customerId', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));
      service.getProductTypes('CONS01', 'CUST01').subscribe({ next: () => done() });

      const url = apiServiceSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('consigneeId=CONS01');
      expect(url).toContain('customerId=CUST01');
    });
  });

  describe('getBoxes', () => {
    it('should pass all optional params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));
      service.getBoxes('CONS01', 'RBC', 'WH01').subscribe({ next: () => done() });

      const url = apiServiceSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('consigneeId=CONS01');
      expect(url).toContain('productType=RBC');
      expect(url).toContain('warehouseId=WH01');
    });

    it('should omit optional params when not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));
      service.getBoxes('CONS01').subscribe({ next: () => done() });

      const url = apiServiceSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('consigneeId=CONS01');
      expect(url).not.toContain('productType');
      expect(url).not.toContain('warehouseId');
    });
  });

  describe('getBoxContents', () => {
    it('should get contents for box', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));
      service.getBoxContents('BOX0001').subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data).toEqual([mockProduct]);
          done();
        },
      });
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.PACK_INV_REJECTS.BOX_CONTENTS('BOX0001'), jasmine.any(Object)
      );
    });

    it('should handle empty box', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [], total: 0 }));
      service.getBoxContents('BOX0002').subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('should propagate error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 404 })));
      service.getBoxContents('INVALID').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });
    });
  });

  describe('addProductToBox', () => {
    it('should post request without SKIP context', (done) => {
      const req: AddProductToBoxRequestDto = { unitId: 'UNIT123', productCode: 'PRBC', boxId: 'BOX001' };
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 200, data: { boxId: 'BOX001' } }));

      service.addProductToBox(req).subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          done();
        },
      });

      const args = apiServiceSpy.post.calls.mostRecent().args;
      expect(args[0]).toBe(API.PACK_INV_REJECTS.ADD_PRODUCT);
      expect(args.length).toBe(2);
    });

    it('should propagate error', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { message: 'Restricted' } })));
      service.addProductToBox({ unitId: 'U', productCode: 'P', boxId: 'B' }).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Restricted');
          done();
        },
      });
    });
  });

  describe('closeBox', () => {
    it('should put with correct URL', (done) => {
      const req: CloseBoxRequestDto = { allProperlyPacked: true, qcFlag: 'Y' };
      apiServiceSpy.put.and.returnValue(of({ success: true, statusCode: 200, data: { boxId: 'BOX0001', closedDate: '2026-06-18' } }));

      service.closeBox('BOX0001', req).subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data?.boxId).toBe('BOX0001');
          done();
        },
      });

      expect(apiServiceSpy.put).toHaveBeenCalledWith(API.PACK_INV_REJECTS.CLOSE_BOX('BOX0001'), req);
    });

    it('should propagate error', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => ({ status: 404 })));
      service.closeBox('INVALID', { allProperlyPacked: true }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });
    });
  });

  describe('getCheckDigit', () => {
    it('should get check digit for unit', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: '12' }));
      service.getCheckDigit('UNIT123').subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data).toBe('12');
          done();
        },
      });
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.PACK_INV_REJECTS.CHECK_DIGIT('UNIT123'), jasmine.any(Object)
      );
    });
  });

  describe('getProductCodesForUnit', () => {
    it('should pass optional customerId and consigneeId', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [{ productCode: 'PRBC', productDesc: 'RBC' }] }));
      service.getProductCodesForUnit('UNIT123', 'CUST01', 'CONS01').subscribe({ next: () => done() });

      const url = apiServiceSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('UNIT123');
      expect(url).toContain('customerId=CUST01');
      expect(url).toContain('consigneeId=CONS01');
    });

    it('should work without optional params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));
      service.getProductCodesForUnit('UNIT123').subscribe({ next: () => done() });

      const url = apiServiceSpy.get.calls.mostRecent().args[0];
      expect(url).toContain('UNIT123');
      expect(url).not.toContain('customerId');
    });

    it('should normalize missing data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getProductCodesForUnit('U').subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getBloodTypesForProduct', () => {
    it('should call correct URL', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [{ bloodType: 'OP', aboDesc: 'O+', expDate: null }] }));
      service.getBloodTypesForProduct('UNIT123', 'PRBC').subscribe({
        next: (res) => {
          expect(res.data?.length).toBe(1);
          done();
        },
      });
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.PACK_INV_REJECTS.BLOOD_TYPES('UNIT123', 'PRBC'), jasmine.any(Object)
      );
    });

    it('should normalize missing data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getBloodTypesForProduct('U', 'P').subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          done();
        },
      });
    });
  });

  describe('unpackProduct', () => {
    it('should post unpack request', (done) => {
      const dto = { unitId: 'UNIT123', productCode: 'PRBC', aliquot: '001', expDate: '2026-07-15T00:00:00Z' };
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 200 }));

      service.unpackProduct(dto).subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          done();
        },
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PACK_INV_REJECTS.UNPACK, dto);
    });

    it('should propagate error', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { message: 'Not packed' } })));
      service.unpackProduct({ unitId: 'U', productCode: 'P', aliquot: null, expDate: null }).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Not packed');
          done();
        },
      });
    });
  });

  describe('SKIP_ERROR_TOAST context', () => {
    it('should use SKIP context on getAvailableProducts', () => {
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));
      service.getAvailableProducts(10, 0, {}).subscribe();
      expect(apiServiceSpy.post.calls.mostRecent().args[2]?.context).toBeDefined();
    });

    it('should use SKIP context on getBoxContents', () => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));
      service.getBoxContents('B').subscribe();
      expect(apiServiceSpy.get.calls.mostRecent().args[1]?.context).toBeDefined();
    });

    it('should NOT use SKIP context on addProductToBox', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 200 }));
      service.addProductToBox({ unitId: 'U', productCode: 'P', boxId: 'B' }).subscribe();
      expect(apiServiceSpy.post.calls.mostRecent().args.length).toBe(2);
    });

    it('should NOT use SKIP context on closeBox', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true, statusCode: 200 }));
      service.closeBox('B', { allProperlyPacked: true }).subscribe();
      expect(apiServiceSpy.put.calls.mostRecent().args.length).toBe(2);
    });

    it('should NOT use SKIP context on unpackProduct', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 200 }));
      service.unpackProduct({ unitId: 'U', productCode: 'P', aliquot: null, expDate: null }).subscribe();
      expect(apiServiceSpy.post.calls.mostRecent().args.length).toBe(2);
    });
  });

  describe('Response normalization edge cases', () => {
    it('getConsignees should handle false success with statusCode != 200', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, statusCode: 500, data: null }));
      service.getConsignees().subscribe({
        next: (res) => {
          expect(res.success).toBeFalse();
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('getOrders should set success from statusCode when missing', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getOrders('C', 'D').subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('getProductTypes should set success from statusCode', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getProductTypes('C', 'D').subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('getBoxes should normalize missing data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getBoxes('C').subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('getBoxContents should normalize with null total', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200, data: null }));
      service.getBoxContents('B').subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          expect(res.total).toBe(0);
          done();
        },
      });
    });

    it('getCheckDigit should normalize success from statusCode', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200, data: '99' }));
      service.getCheckDigit('U').subscribe({
        next: (res) => {
          expect(res.success).toBeTrue();
          done();
        },
      });
    });

    it('getProductCodesForUnit should normalize from non-200 statusCode', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 500, success: false }));
      service.getProductCodesForUnit('U').subscribe({
        next: (res) => {
          expect(res.success).toBeFalse();
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('getBloodTypesForProduct should normalize from non-200 statusCode', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 500, success: false }));
      service.getBloodTypesForProduct('U', 'P').subscribe({
        next: (res) => {
          expect(res.success).toBeFalse();
          expect(res.data).toEqual([]);
          done();
        },
      });
    });

    it('getAvailableProducts should normalize with null total and null data', (done) => {
      apiServiceSpy.post.and.returnValue(of({ statusCode: 200, success: true, data: null, total: null }));
      service.getAvailableProducts(10, 0, {}).subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          expect(res.total).toBe(0);
          done();
        },
      });
    });
  });
});

