import { TestBed } from '@angular/core/testing';
import { ProductConversionsService } from './product-conversions.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { API } from 'src/app/core/constants/api.constants';

describe('ProductConversionsService', () => {
  let service: ProductConversionsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ProductConversionsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ProductConversionsService);
  });

  describe('getProductConversions', () => {
    it('should call POST with correct endpoint and return mapped data', () => {
      const mockResponse = {
        data: [{ sourceProductCode: '00150', targetProductCode: '04900' }],
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getProductConversions(1, 10, { searchKeyword: 'test' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.PRODUCT_CONVERSIONS.LIST(10, 0),
        jasmine.objectContaining({ searchKeyword: 'test' })
      );
    });


  });

  describe('getSourceProducts', () => {
    it('should call GET and return mapped data', () => {
      const mockResponse = {
        data: [{ productCode: '00150', productDesc: 'CPD Whole Blood' }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSourceProducts().subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].productCode).toBe('00150');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PRODUCT_CONVERSIONS.SOURCE_PRODUCTS);
    });
  });

  describe('getTargetProducts', () => {
    it('should call GET with source product code in URL', () => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getTargetProducts('00150').subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.PRODUCT_CONVERSIONS.TARGET_PRODUCTS('00150')
      );
    });
  });

  describe('createProductConversion', () => {
    it('should call POST with dto', () => {
      const dto = {
        sourceProductCode: '00150',
        targetProductCode: '04900',
        effDate: '2026-05-23',
        termDate: null,
      };
      apiServiceSpy.post.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      service.createProductConversion(dto).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PRODUCT_CONVERSIONS.CREATE, dto);
    });
  });

  describe('updateProductConversion', () => {
    it('should call PUT with composite key in URL', () => {
      const dto = { effDate: '2026-05-23', termDate: null };
      apiServiceSpy.put.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

      service.updateProductConversion('00150', '04900', dto).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        API.PRODUCT_CONVERSIONS.UPDATE('00150', '04900'),
        dto
      );
    });
  });
});
