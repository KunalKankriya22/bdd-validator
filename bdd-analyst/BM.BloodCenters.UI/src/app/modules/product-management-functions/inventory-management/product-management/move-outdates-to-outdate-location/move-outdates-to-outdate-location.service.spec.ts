import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MoveOutdatesToOutdateLocationService } from './move-outdates-to-outdate-location.service';
import { ApiService } from '@shared/services/api.service';

describe('MoveOutdatesToOutdateLocationService', () => {
  let service: MoveOutdatesToOutdateLocationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        MoveOutdatesToOutdateLocationService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(MoveOutdatesToOutdateLocationService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getOutdatedProducts', () => {
    it('should call POST and return paginated products', (done) => {
      const mockResponse = { success: true, data: [{ unitId: 'U1' }], total: 1 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getOutdatedProducts(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          done();
        },
      });
    });
  });

  describe('getProductById', () => {
    it('should call GET and return product', (done) => {
      const mockResponse = { success: true, data: { unitId: 'U1' }, statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.data).toBeTruthy();
          done();
        },
      });
    });
  });

  describe('moveProductToOutdate', () => {
    it('should call POST with DTO and return response', (done) => {
      const mockResponse = { success: true, data: { moved: true } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.moveProductToOutdate({ unitId: 'U1' } as any).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getWarehouses', () => {
    it('should call GET and return warehouses array', (done) => {
      const mockResponse = { success: true, data: [{ warehouseId: 'W1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getWarehouses().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('getDiscardCodes', () => {
    it('should call GET and return discard codes array', (done) => {
      const mockResponse = { success: true, data: [{ code: 'DC1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDiscardCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('validateUnit', () => {
    it('should call POST with unitId and pickSlipId', (done) => {
      const mockResponse = { success: true, data: [], statusCode: 200 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit('U1', 'PS1').subscribe({
        next: (result) => {
          expect(result).toBeTruthy();
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getPickSlips', () => {
    it('should call GET and return mapped pick slips', (done) => {
      const mockResponse = { success: true, data: [{ pickSlipId: 'PS1', dateAndTime: '2024-01-01', totalProduct: 5 }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPickSlips().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].pickSlipId).toBe('PS1');
          done();
        },
      });
    });
  });

  describe('getProductsOnPickSlip', () => {
    it('should call GET and return mapped products', (done) => {
      const mockResponse = { success: true, data: [{ unitId: 'U1', productId: 'P1', productType: 'RBC', checkDigit: '5' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductsOnPickSlip('PS1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].unitId).toBe('U1');
          done();
        },
      });
    });

    it('should map checkDigit from API response', (done) => {
      const mockResponse = { success: true, data: [{ unitId: 'U1', productId: 'P1', productType: 'RBC', checkDigit: '7' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductsOnPickSlip('PS1').subscribe({
        next: (result) => {
          expect(result[0].checkDigit).toBe('7');
          done();
        },
      });
    });

    it('should default checkDigit to empty string when absent from API response', (done) => {
      const mockResponse = { success: true, data: [{ unitId: 'U1', productId: 'P1', productType: 'RBC' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductsOnPickSlip('PS1').subscribe({
        next: (result) => {
          expect(result[0].checkDigit).toBe('');
          done();
        },
      });
    });
  });

  describe('getProductDropdown', () => {
    it('should call GET and return product dropdown items', (done) => {
      const mockResponse = { success: true, data: [{ productId: 'P1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductDropdown('PS1').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('normalizeResponse — ?? branch coverage', () => {
    it('getProductById should compute success=true from statusCode when success field is absent', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 200 }));
      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          done();
        },
      });
    });

    it('getProductById should compute success=false when statusCode is not 200', (done) => {
      apiServiceSpy.get.and.returnValue(of({ statusCode: 400 }));
      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          done();
        },
      });
    });

    it('getProductById should use item when data is null', (done) => {
      const item = { productId: 'U1' };
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null, item, statusCode: 200 }));
      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.data).toEqual(item as any);
          done();
        },
      });
    });

    it('getProductById should return null data when both data and item are absent', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200 }));
      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.data).toBeNull();
          done();
        },
      });
    });

    it('validateUnit should compute success from statusCode when success field is absent', (done) => {
      apiServiceSpy.post.and.returnValue(of({ statusCode: 200, data: [] }));
      service.validateUnit('U1', 'PS1').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          done();
        },
      });
    });
  });

  describe('normalizeArray — ?? branch coverage', () => {
    it('getWarehouses should use item array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, item: [{ warehouseId: 'W1' }] }));
      service.getWarehouses().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('getWarehouses should use items array when data and item are null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, item: null, items: [{ warehouseId: 'W2' }] }));
      service.getWarehouses().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });

    it('getWarehouses should return empty array when all fields are null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, item: null, items: null }));
      service.getWarehouses().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('getWarehouses should return empty array when data is not an array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: 'not-an-array' }));
      service.getWarehouses().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('getDiscardCodes should use item array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, item: [{ code: 'DC1' }] }));
      service.getDiscardCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('getProductsOnPickSlip null field coverage', () => {
    it('should default productType to empty string and trim product when productType is null', (done) => {
      apiServiceSpy.get.and.returnValue(
        of({ success: true, data: [{ unitId: 'U1', productId: 'P1', productType: null, checkDigit: null }] })
      );
      service.getProductsOnPickSlip('PS1').subscribe({
        next: (result) => {
          expect(result[0].checkDigit).toBe('');
          expect(result[0].product).toContain('P1');
          done();
        },
      });
    });
  });

  describe('getOutdatedProducts null response coverage', () => {
    it('should return empty data and zero total when response fields are null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: null, total: null }));
      service.getOutdatedProducts(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
      });
    });
  });

  describe('normalizeResponse — errorResponse branch coverage', () => {
    it('getProductById should be success=false when statusCode=200 but errorResponse has errorCode', (done) => {
      apiServiceSpy.get.and.returnValue(
        of({ statusCode: 200, errorResponse: { errorCode: 'ERR_VALIDATION' } })
      );
      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          done();
        },
      });
    });

    it('getProductById should be success=true when statusCode=200 and errorResponse.errorCode is null', (done) => {
      apiServiceSpy.get.and.returnValue(
        of({ statusCode: 200, errorResponse: { errorCode: null } })
      );
      service.getProductById('U1').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          done();
        },
      });
    });
  });
});
