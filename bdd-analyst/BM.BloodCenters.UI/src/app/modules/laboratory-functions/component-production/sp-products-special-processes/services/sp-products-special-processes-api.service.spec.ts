import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SpProductsSpecialProcessesApiService } from './sp-products-special-processes-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('SpProductsSpecialProcessesApiService', () => {
  let service: SpProductsSpecialProcessesApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SpProductsSpecialProcessesApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(SpProductsSpecialProcessesApiService);
  });

  describe('getProducts', () => {
    it('should post with default null params and map response', (done) => {
      // Arrange
      const items = [{ processCode: 'PC1' }];
      apiSpy.post.and.returnValue(of({ data: items, total: 1 }));

      // Act
      service.getProducts().subscribe((result) => {
        // Assert
        expect(result.data).toEqual(items as any);
        expect(result.totalRecords).toBe(1);
        expect(apiSpy.post).toHaveBeenCalledWith(API.PRODUCT_PROCESS.LIST, jasmine.objectContaining({
          processCode: null,
          productCode: null,
        }));
        done();
      });
    });

    it('should return empty data when response is null', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of(null));

      // Act
      service.getProducts().subscribe((result) => {
        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate errors', (done) => {
      // Arrange
      const error = new Error('fail');
      apiSpy.post.and.returnValue(throwError(() => error));

      // Act
      service.getProducts().subscribe({
        error: (err) => {
          // Assert
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getProcessCodes', () => {
    it('should map array response to LookUp list', (done) => {
      // Arrange
      const items = [{ code: 'PC1', codeDesc: 'Process 1' }];
      apiSpy.get.and.returnValue(of(items));

      // Act
      service.getProcessCodes().subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'PC1', name: 'Process 1' }]);
        expect(apiSpy.get).toHaveBeenCalledWith(API.PRODUCT_PROCESS.DROPDOWN_PROCESS_CODES);
        done();
      });
    });

    it('should handle wrapped response with data property', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: [{ code: 'PC1', description: 'Desc' }] }));

      // Act
      service.getProcessCodes().subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'PC1', name: 'Desc' }]);
        done();
      });
    });
  });

  describe('getProductCodes', () => {
    it('should map productCode and productDesc fields', (done) => {
      // Arrange
      const items = [{ productCode: 'PR1', productDesc: 'Product 1' }];
      apiSpy.get.and.returnValue(of(items));

      // Act
      service.getProductCodes().subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'PR1', name: 'Product 1' }]);
        done();
      });
    });
  });

  describe('getAttributeGroups', () => {
    it('should call endpoint with product code', (done) => {
      // Arrange
      const items = [{ code: 'AG1', codeDesc: 'Group 1' }];
      apiSpy.get.and.returnValue(of(items));

      // Act
      service.getAttributeGroups('PR1').subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'AG1', name: 'Group 1' }]);
        expect(apiSpy.get).toHaveBeenCalledWith(API.PRODUCT_PROCESS.DROPDOWN_ATTRIBUTE_GROUPS('PR1'));
        done();
      });
    });
  });

  describe('getAttributeCodes', () => {
    it('should call endpoint with product code and attrib group', (done) => {
      // Arrange
      const items = [{ attribCode: 'AC1', attribDesc: 'Attr 1' }];
      apiSpy.get.and.returnValue(of(items));

      // Act
      service.getAttributeCodes('PR1', 'AG1').subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'AC1', name: 'Attr 1' }]);
        expect(apiSpy.get).toHaveBeenCalledWith(API.PRODUCT_PROCESS.DROPDOWN_ATTRIBUTE_CODES('PR1', 'AG1'));
        done();
      });
    });
  });

  describe('createProduct', () => {
    it('should post create dto', (done) => {
      // Arrange
      const dto = { processCode: 'PC1', productCode: 'PR1' } as any;
      apiSpy.post.and.returnValue(of({ success: true }));

      // Act
      service.createProduct(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.post).toHaveBeenCalledWith(API.PRODUCT_PROCESS.CREATE, dto);
        done();
      });
    });
  });

  describe('updateProduct', () => {
    it('should put to update endpoint without query params', (done) => {
      // Arrange
      const dto = { description: 'Updated' } as any;
      apiSpy.put.and.returnValue(of({ success: true }));

      // Act
      service.updateProduct('PC1', 'PR1', dto).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.put).toHaveBeenCalledWith(API.PRODUCT_PROCESS.UPDATE('PC1', 'PR1'), dto);
        done();
      });
    });

    it('should append query params when attribGroup and attribCode are provided', (done) => {
      // Arrange
      const dto = { description: 'Updated' } as any;
      apiSpy.put.and.returnValue(of({ success: true }));

      // Act
      service.updateProduct('PC1', 'PR1', dto, 'AG1', 'AC1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        const expectedUrl = API.PRODUCT_PROCESS.UPDATE('PC1', 'PR1') +
          `?attribGroup=${encodeURIComponent('AG1')}&attribCode=${encodeURIComponent('AC1')}`;
        expect(apiSpy.put).toHaveBeenCalledWith(expectedUrl, dto);
        done();
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete without query params', (done) => {
      // Arrange
      apiSpy.delete.and.returnValue(of({ success: true }));

      // Act
      service.deleteProduct('PC1', 'PR1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        expect(apiSpy.delete).toHaveBeenCalledWith(API.PRODUCT_PROCESS.DELETE('PC1', 'PR1'));
        done();
      });
    });

    it('should append query params when attribGroup and attribCode are provided', (done) => {
      // Arrange
      apiSpy.delete.and.returnValue(of({ success: true }));

      // Act
      service.deleteProduct('PC1', 'PR1', 'AG1', 'AC1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true });
        const expectedUrl = API.PRODUCT_PROCESS.DELETE('PC1', 'PR1') +
          `?attribGroup=${encodeURIComponent('AG1')}&attribCode=${encodeURIComponent('AC1')}`;
        expect(apiSpy.delete).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });
  });
});
