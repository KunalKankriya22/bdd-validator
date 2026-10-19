import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductTypeService } from './product-type.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ProductTypeService', () => {
  let service: ProductTypeService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }]
    });
    service = TestBed.inject(ProductTypeService);
  });

  // Group simple GET-no-args methods
  [
    { method: 'getProductTypesDropdown', endpoint: API.PRODUCT_TYPES.PRODUCT_TYPES_DROPDOWN },
    { method: 'getProductTypesLov', endpoint: API.PRODUCT_TYPES.PRODUCT_TYPES_LOV },
    { method: 'getProductClassesDropdown', endpoint: API.PRODUCT_TYPES.PRODUCT_CLASSES_DROPDOWN },
    { method: 'getFilterOptions', endpoint: API.PRODUCT_TYPES.FILTER_OPTIONS }
  ].forEach(({ method, endpoint }) => {
    it(`${method} should call apiService.get with correct endpoint`, (done) => {
      const mockResp = { success: true, data: [] };
      apiSpy.get.and.returnValue(of(mockResp));
      (service as any)[method]().subscribe((res: any) => {
        expect(res).toEqual(mockResp);
        expect(apiSpy.get).toHaveBeenCalledWith(endpoint);
        done();
      });
    });
  });

  it('getProductTypes should POST with take/skip params', (done) => {
    const mockResp = { success: true, data: [] };
    const params = { code: 'X' } as any;
    apiSpy.post.and.returnValue(of(mockResp));
    service.getProductTypes(10, 0, params).subscribe((res) => {
      expect(apiSpy.post).toHaveBeenCalledWith(API.PRODUCT_TYPES.LIST(10, 0), params);
      expect(res).toEqual(mockResp);
      done();
    });
  });

  it('getProductTypeById should GET by code', (done) => {
    const mockResp = { success: true, data: { code: 'A' } };
    apiSpy.get.and.returnValue(of(mockResp));
    service.getProductTypeById('A').subscribe((res) => {
      expect(apiSpy.get).toHaveBeenCalledWith(API.PRODUCT_TYPES.GET_BY_ID('A'));
      expect(res).toEqual(mockResp);
      done();
    });
  });

  it('createProductType should POST data', (done) => {
    const dto = { code: 'N' } as any;
    const mockResp = { success: true };
    apiSpy.post.and.returnValue(of(mockResp));
    service.createProductType(dto).subscribe((res) => {
      expect(apiSpy.post).toHaveBeenCalledWith(API.PRODUCT_TYPES.CREATE, dto);
      expect(res).toEqual(mockResp);
      done();
    });
  });

  it('updateProductType should PUT data', (done) => {
    const dto = { description: 'upd' } as any;
    const mockResp = { success: true };
    apiSpy.put.and.returnValue(of(mockResp));
    service.updateProductType('A', dto).subscribe((res) => {
      expect(apiSpy.put).toHaveBeenCalledWith(API.PRODUCT_TYPES.UPDATE('A'), dto);
      expect(res).toEqual(mockResp);
      done();
    });
  });

  it('deleteProductType should DELETE by code', (done) => {
    const mockResp = { success: true, data: true };
    apiSpy.delete.and.returnValue(of(mockResp));
    service.deleteProductType('A').subscribe((res) => {
      expect(apiSpy.delete).toHaveBeenCalledWith(API.PRODUCT_TYPES.DELETE('A'));
      expect(res).toEqual(mockResp);
      done();
    });
  });

  it('should propagate errors through catchError', (done) => {
    const err = new Error('fail');
    apiSpy.get.and.returnValue(throwError(() => err));
    service.getProductTypeById('X').subscribe({
      error: (e) => {
        expect(e).toBe(err);
        done();
      }
    });
  });
});
