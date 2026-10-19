import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { InventoryProductTypesService } from './inventory-product-types.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  InventoryProductTypeModel,
  InventoryProductTypeParamsDto,
  InventoryProductTypeCreateDto,
  InventoryProductTypeUpdateDto
} from '../models/inventory-product-types.model';

describe('InventoryProductTypesService', () => {
  let service: InventoryProductTypesService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InventoryProductTypesService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(InventoryProductTypesService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getInventoryProductTypes', () => {
    it('should fetch inventory product types with pagination and return transformed data', (done) => {
      const mockResponse = {
        Data: [
          {
            ProductType: 'RBC',
            ShortName: 'Red Blood Cells',
            Description: 'Red blood cells for transfusion',
            StandardPrice: 250.00,
            LifeSpan: 42,
            LifeSpanIndicator: 'D',
            SortSequence: 1,
            ProductGrouping: 'RB',
            AboOnly: true,
            ShipAnyRh: false,
            AboFlag: true,
            PoolProduct: false,
            SpecialProductType: false,
            MaximumTemp: 6,
            MinimumTemp: 1,
            EffectiveDate: '2024-01-01',
            TerminationDate: null,
            LastModifiedDate: '2024-02-15'
          }
        ],
        Total: 1
      };

      const params: InventoryProductTypeParamsDto = {
        SearchKeyword: 'RBC'
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getInventoryProductTypes(10, 0, params).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(result.data[0].productType).toBe('RBC');
          expect(result.data[0].price).toBe(250.00);
          expect(result.data[0].pooledProduct).toBe(false);
          done();
        },
        error: done.fail
      });
    });



    it('should call correct endpoint with parameters', (done) => {
      const mockResponse = { Data: [], Total: 0 };
      const params: InventoryProductTypeParamsDto = {
        SearchKeyword: 'test',
        ProductGrouping: 'RB',
        SpecialInventory: true
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getInventoryProductTypes(25, 50, params).subscribe({
        next: () => {
          const expectedEndpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_LIST(25, 50);
          expect(apiService.post).toHaveBeenCalledWith(expectedEndpoint, params);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getInventoryProductTypeByCode', () => {
    it('should fetch a single inventory product type by code and transform to camelCase', (done) => {
      const mockResponse = {
        ProductType: 'PLT',
        ShortName: 'Platelets',
        Description: 'Platelet concentrate',
        StandardPrice: 450.00,
        LifeSpan: 5,
        LifeSpanIndicator: 'D',
        SortSequence: 2,
        ProductGrouping: 'PL',
        AboOnly: false,
        ShipAnyRh: true,
        AboFlag: false,
        PoolProduct: true,
        SpecialProductType: true,
        MaximumTemp: 24,
        MinimumTemp: 20,
        EffectiveDate: '2024-01-01',
        TerminationDate: null,
        LastModifiedDate: '2024-02-15'
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypeByCode('PLT').subscribe({
        next: (result) => {
          expect(result.productType).toBe('PLT');
          expect(result.shortName).toBe('Platelets');
          expect(result.price).toBe(450.00);
          expect(result.pooledProduct).toBe(true);
          expect(result.specialInventory).toBe(true);
          expect(result.rhRequired).toBe(true);
          expect(result.importAllowed).toBe(false);
          done();
        },
        error: done.fail
      });
    });



    it('should return empty object if no data found', (done) => {
      const mockResponse = {};

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypeByCode('INVALID').subscribe({
        next: (result) => {
          expect(result).toEqual({} as InventoryProductTypeModel);
          done();
        },
        error: done.fail
      });
    });


    it('should call correct endpoint', (done) => {
      const mockResponse = { ProductType: 'RBC' };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypeByCode('RBC').subscribe({
        next: () => {
          const expectedEndpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_BY_CODE('RBC');
          expect(apiService.get).toHaveBeenCalledWith(expectedEndpoint);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getInventoryProductTypeFilters', () => {
    it('should fetch filter dropdown options', (done) => {
      const mockResponse = {
        Item: {
          ProductGrouping: ['RB-Red Blood Cells', 'PL-Platelets', 'PS-Plasma'],
          LifeSpanIndicator: ['D', 'H', 'M']
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypeFilters().subscribe({
        next: (result) => {
          expect(result.Item).toBeDefined();
          expect(result.Item?.ProductGrouping).toBeDefined();
          expect(result.Item?.LifeSpanIndicator).toBeDefined();
          done();
        },
        error: done.fail
      });
    });


    it('should call correct endpoint', (done) => {
      const mockResponse = { Item: {} };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypeFilters().subscribe({
        next: () => {
          const expectedEndpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_FILTERS;
          expect(apiService.get).toHaveBeenCalledWith(expectedEndpoint);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('createInventoryProductType', () => {
    it('should create a new inventory product type', (done) => {
      const mockResponse = { Success: true, Message: 'Created successfully' };
      const payload: InventoryProductTypeCreateDto = {
        productType: 'TEST',
        shortName: 'Test Product',
        description: 'Test description',
        standardPrice: 100.00,
        lifeSpan: 30,
        lifeSpanIndicator: 'D',
        sortSequence: 10,
        productGrouping: 'TE',
        aboOnly: false,
        poolProduct: false,
        specialProductType: false,
        shipAnyRh: false,
        aboFlag: false,
        maximumTemp: 10,
        minimumTemp: 2,
        effectiveDate: '2024-01-01',
        terminationDate: undefined
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createInventoryProductType(payload).subscribe({
        next: (result) => {
          expect(result.Success).toBe(true);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_CREATE,
            payload
          );
          done();
        },
        error: done.fail
      });
    });


    it('should handle server errors', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };
      const payload = {} as InventoryProductTypeCreateDto;

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.createInventoryProductType(payload).subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('updateInventoryProductType', () => {
    it('should update an existing inventory product type', (done) => {
      const mockResponse = { Success: true, Message: 'Updated successfully' };
      const payload: InventoryProductTypeUpdateDto = {
        productType: 'RBC',
        shortName: 'Updated Name',
        description: 'Updated description',
        standardPrice: 275.00,
        lifeSpan: 42,
        lifeSpanIndicator: 'D',
        sortSequence: 1,
        productGrouping: 'RB',
        aboOnly: true,
        poolProduct: false,
        specialProductType: false,
        shipAnyRh: false,
        aboFlag: true,
        maximumTemp: 6,
        minimumTemp: 1,
        effectiveDate: '2024-01-01',
        terminationDate: undefined
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateInventoryProductType('RBC', payload).subscribe({
        next: (result) => {
          expect(result.Success).toBe(true);
          expect(apiService.put).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_UPDATE,
            payload
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle not found errors', (done) => {
      const errorResponse = { status: 404, message: 'Record not found' };
      const payload = {} as InventoryProductTypeUpdateDto;

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateInventoryProductType('INVALID', payload).subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });
    });

  });

  describe('deleteInventoryProductType', () => {
    it('should delete an inventory product type', (done) => {
      const mockResponse = { Success: true, Message: 'Deleted successfully' };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteInventoryProductType('TEST').subscribe({
        next: (result) => {
          expect(result.Success).toBe(true);
          const expectedEndpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_DELETE('TEST');
          expect(apiService.delete).toHaveBeenCalledWith(expectedEndpoint);
          done();
        },
        error: done.fail
      });
    });

    it('should handle not found errors', (done) => {
      const errorResponse = { status: 404, message: 'Record not found' };

      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteInventoryProductType('INVALID').subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });
    });

    it('should handle server errors', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };

      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteInventoryProductType('TEST').subscribe({
        next: () => done.fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('transformToCamelCase', () => {
    it('should correctly transform all fields from PascalCase to camelCase', (done) => {
      const mockResponse = {
        ProductType: 'RBC',
        ShortName: 'Red Blood Cells',
        Description: 'Description',
        StandardPrice: 250.00,
        LifeSpan: 42,
        LifeSpanIndicator: 'D',
        SortSequence: 1,
        ProductGrouping: 'RB',
        AboOnly: true,
        ShipAnyRh: false,
        AboFlag: true,
        PoolProduct: false,
        SpecialProductType: false,
        MaximumTemp: 6,
        MinimumTemp: 1,
        EffectiveDate: '2024-01-01',
        TerminationDate: '2024-12-31',
        LastModifiedDate: '2024-02-15'
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInventoryProductTypeByCode('RBC').subscribe({
        next: (result) => {
          expect(result.productType).toBe('RBC');
          expect(result.shortName).toBe('Red Blood Cells');
          expect(result.description).toBe('Description');
          expect(result.price).toBe(250.00);
          expect(result.lifeSpan).toBe(42);
          expect(result.lifeSpanInd).toBe('D');
          expect(result.sortSequence).toBe(1);
          expect(result.productGrouping).toBe('RB');
          expect(result.aboOnly).toBe(true);
          expect(result.rhRequired).toBe(false);
          expect(result.importAllowed).toBe(true);
          expect(result.pooledProduct).toBe(false);
          expect(result.specialInventory).toBe(false);
          expect(result.tempMax).toBe(6);
          expect(result.tempMin).toBe(1);
          expect(result.effectiveDate).toBe('2024-01-01');
          expect(result.terminationDate).toBe('2024-12-31');
          expect(result.modificationDate).toBe('2024-02-15');
          done();
        },
        error: done.fail
      });
    });
  });
});
