import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ModifyPooledComponentsService } from './modify-pooled-components.service';
import { ApiService } from '@shared/services/api.service';
import {
  ModifyPooledComponentsResponse,
  ModifyPooledComponentsRequest,
  ProcessCode,
  ValidProductConversion,
  ProductCodeOption,
  CatalogNumberOption,
  LotNumberOption,
  ValidAboOption,
} from '../models/modify-pooled-components.model';

describe('ModifyPooledComponentsService', () => {
  let service: ModifyPooledComponentsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ModifyPooledComponentsService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ModifyPooledComponentsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getPoolDetails', () => {
    it('should return pool details from response item', (done) => {
      // Arrange
      const mockDetails = { unitId: 'U001' } as ModifyPooledComponentsResponse;
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockDetails, data: null }));

      // Act
      service.getPoolDetails('U001').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockDetails);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getProcessCodes', () => {
    it('should return process codes array', (done) => {
      // Arrange
      const mockCodes: ProcessCode[] = [{ code: 'P1', description: 'Process 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockCodes, data: null }));

      // Act
      service.getProcessCodes('PROD1').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockCodes);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getValidProductConversions', () => {
    it('should return valid product conversions', (done) => {
      // Arrange
      const mockConversions: ValidProductConversion[] = [{ targetProductCode: 'T1', productDescription: 'Target 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockConversions, data: null }));

      // Act
      service.getValidProductConversions('SRC1', 'ISBT').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockConversions);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getValidProducts', () => {
    it('should return product code options', (done) => {
      // Arrange
      const mockProducts: ProductCodeOption[] = [{ productCode: 'PC1', productDescription: 'Product 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockProducts, data: null }));

      // Act
      service.getValidProducts('U001').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockProducts);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getValidCatalogNumbers', () => {
    it('should return catalog number options', (done) => {
      // Arrange
      const mockCatalogs: CatalogNumberOption[] = [{ catalogNumber: 'CAT1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockCatalogs, data: null }));

      // Act
      service.getValidCatalogNumbers().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockCatalogs);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getValidLotNumbers', () => {
    it('should return lot number options', (done) => {
      // Arrange
      const mockLots: LotNumberOption[] = [{ lotNumber: 'LOT1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockLots, data: null }));

      // Act
      service.getValidLotNumbers('CAT1').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockLots);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getValidFilterLots', () => {
    it('should return filter lot options', (done) => {
      // Arrange
      const mockLots: LotNumberOption[] = [{ lotNumber: 'FLOT1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockLots, data: null }));

      // Act
      service.getValidFilterLots('RBC').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockLots);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getValidAbo', () => {
    it('should return valid ABO options', (done) => {
      // Arrange
      const mockAbo: ValidAboOption[] = [{ code: 'A', description: 'A Positive' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockAbo, data: null }));

      // Act
      service.getValidAbo().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockAbo);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('deriveProduct', () => {
    it('should return derived product conversion', (done) => {
      // Arrange
      const mockConversion: ValidProductConversion = { targetProductCode: 'T1', productDescription: 'Derived' };
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, item: mockConversion, data: null }));

      // Act
      service.deriveProduct('PC1', 'PROC1', 'RBC', 'ISBT').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockConversion);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('save', () => {
    it('should post save request and return response', (done) => {
      // Arrange
      const request = { unitId: 'U001', productCode: 'PC1', processCode: 'P1', newBag: 'Y', newProductCode: 'NPC1' } as ModifyPooledComponentsRequest;
      const mockResponse = { success: true, message: 'Saved', statusCode: 200, item: null, data: null };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.save(request).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });
});
