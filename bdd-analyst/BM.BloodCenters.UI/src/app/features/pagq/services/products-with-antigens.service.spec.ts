import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsWithAntigensService } from './products-with-antigens.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductAntigenSearchRequest,
  ProductAntigenSearchResponse,
  ProductTypeOption,
  AboRhTypeOption,
  InventoryClassOption,
  AntigenGroupOption,
  WarehouseOption,
  ValidAntigenOption,
  AntigenGroupDetail
} from '../models/products-with-antigens.models';

describe('ProductsWithAntigensService', () => {
  let service: ProductsWithAntigensService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ProductsWithAntigensService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ProductsWithAntigensService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchProducts', () => {
    it('should call API with correct endpoint and return search results', (done) => {
      const mockRequest: ProductAntigenSearchRequest = {
        productType: 'RBC',
        take: 10,
        skip: 0
      };

      const mockResponse: ProductAntigenSearchResponse = {
        results: [
          {
            unitId: 'UNIT001',
            productCode: 'RBC',
            aboRhType: 'O POS',
            expirationDate: '2026-06-30T00:00:00',
            warehouseId: '1',
            antigenProfile: []
          }
        ],
        totalCount: 1,
        pageSize: 10,
        offset: 0
      };

      apiServiceSpy.post.and.returnValue(of({ data: mockResponse }));

      service.searchProducts(mockRequest).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.SEARCH,
          mockRequest
        );
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should unwrap array-wrapped response data', (done) => {
      const mockRequest: ProductAntigenSearchRequest = { productType: 'RBC' };
      const innerResponse: ProductAntigenSearchResponse = {
        results: [{ unitId: 'U1', productCode: 'RBC', aboRhType: 'O+', warehouseId: '1', antigenProfile: [] }],
        totalCount: 1,
        pageSize: 10,
        offset: 0
      };

      apiServiceSpy.post.and.returnValue(of({ data: [innerResponse] }));

      service.searchProducts(mockRequest).subscribe(result => {
        expect(result).toEqual(innerResponse);
        done();
      });
    });

    it('should return fallback response when data is null', (done) => {
      const mockRequest: ProductAntigenSearchRequest = { productType: 'RBC', take: 25, skip: 5 };

      apiServiceSpy.post.and.returnValue(of({ data: null }));

      service.searchProducts(mockRequest).subscribe(result => {
        expect(result).toEqual({
          results: [],
          totalCount: 0,
          pageSize: 25,
          offset: 5
        });
        done();
      });
    });

    it('should return fallback response with defaults when take/skip not provided', (done) => {
      const mockRequest: ProductAntigenSearchRequest = { productType: 'RBC' };

      apiServiceSpy.post.and.returnValue(of({ data: null }));

      service.searchProducts(mockRequest).subscribe(result => {
        expect(result.pageSize).toBe(10);
        expect(result.offset).toBe(0);
        done();
      });
    });

    it('should handle error in searchProducts', (done) => {
      const mockRequest: ProductAntigenSearchRequest = { productType: 'RBC' };
      const mockError = new Error('Server error');

      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.searchProducts(mockRequest).subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getProductTypes', () => {
    it('should fetch product types', (done) => {
      const mockData: ProductTypeOption[] = [
        { productType: 'RBC', description: 'Red Blood Cells' },
        { productType: 'PLT', description: 'Platelets' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getProductTypes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.PRODUCT_TYPES
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should unwrap nested array response', (done) => {
      const mockData: ProductTypeOption[] = [
        { productType: 'RBC', description: 'Red Blood Cells' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: [mockData] }));

      service.getProductTypes().subscribe(result => {
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getProductTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching product types', (done) => {
      const mockError = new Error('Network Error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getProductTypes().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getAboRhTypes', () => {
    it('should fetch ABO/Rh types', (done) => {
      const mockData: AboRhTypeOption[] = [
        { aboCode: 'O+', aboDescription: 'O Positive' },
        { aboCode: 'A+', aboDescription: 'A Positive' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getAboRhTypes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.ABO_RH_TYPES
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should unwrap nested array response', (done) => {
      const mockData: AboRhTypeOption[] = [{ aboCode: 'O+', aboDescription: 'O Positive' }];
      apiServiceSpy.get.and.returnValue(of({ data: [mockData] }));

      service.getAboRhTypes().subscribe(result => {
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getAboRhTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching ABO/Rh types', (done) => {
      const mockError = new Error('Network Error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getAboRhTypes().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getInventoryClasses', () => {
    it('should fetch inventory classes', (done) => {
      const mockData: InventoryClassOption[] = [
        { code: 'I1', description: 'Class 1' },
        { code: 'I2', description: 'Class 2' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getInventoryClasses().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.INVENTORY_CLASSES
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should unwrap nested array response', (done) => {
      const mockData: InventoryClassOption[] = [{ code: 'I1', description: 'Class 1' }];
      apiServiceSpy.get.and.returnValue(of({ data: [mockData] }));

      service.getInventoryClasses().subscribe(result => {
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getInventoryClasses().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching inventory classes', (done) => {
      const mockError = new Error('Network Error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getInventoryClasses().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getAntigenGroups', () => {
    it('should fetch antigen groups', (done) => {
      const mockData: AntigenGroupOption[] = [
        { code: 'RH', description: 'Rh Group', isRarityMatrix: false },
        { code: 'KELL', description: 'Kell Group', isRarityMatrix: true }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getAntigenGroups().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.ANTIGEN_GROUPS
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should unwrap nested array response', (done) => {
      const mockData: AntigenGroupOption[] = [{ code: 'RH', description: 'Rh', isRarityMatrix: false }];
      apiServiceSpy.get.and.returnValue(of({ data: [mockData] }));

      service.getAntigenGroups().subscribe(result => {
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getAntigenGroups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching antigen groups', (done) => {
      const mockError = new Error('Network Error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getAntigenGroups().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getWarehouses', () => {
    it('should fetch warehouses', (done) => {
      const mockData: WarehouseOption[] = [
        { code: '1', description: 'Main Warehouse' },
        { code: '2', description: 'Secondary Warehouse' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getWarehouses().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.WAREHOUSES
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should unwrap nested array response', (done) => {
      const mockData: WarehouseOption[] = [{ code: '1', description: 'Main' }];
      apiServiceSpy.get.and.returnValue(of({ data: [mockData] }));

      service.getWarehouses().subscribe(result => {
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getWarehouses().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching warehouses', (done) => {
      const mockError = new Error('Network Error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getWarehouses().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getValidAntigens', () => {
    it('should fetch valid antigens', (done) => {
      const mockData: ValidAntigenOption[] = [
        { testId: 'D', testDescription: 'D Antigen', testGroup: 'RH' },
        { testId: 'K', testDescription: 'K Antigen', testGroup: 'KELL' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getValidAntigens().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.VALID_ANTIGENS
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should unwrap nested array response', (done) => {
      const mockData: ValidAntigenOption[] = [{ testId: 'D', testDescription: 'D', testGroup: 'RH' }];
      apiServiceSpy.get.and.returnValue(of({ data: [mockData] }));

      service.getValidAntigens().subscribe(result => {
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getValidAntigens().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error when fetching valid antigens', (done) => {
      const mockError = new Error('Network Error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getValidAntigens().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });

  describe('getAntigenGroupDetail', () => {
    it('should fetch antigen group detail', (done) => {
      const groupCode = 'RH';
      const mockData: AntigenGroupDetail = {
        groupCode: 'RH',
        groupDescription: 'Rh Group',
        antigens: [
          { antigenId: 'D', result: 'P' },
          { antigenId: 'C', result: 'N' }
        ]
      };

      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getAntigenGroupDetail(groupCode).subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PRODUCTS_WITH_ANTIGENS.ANTIGEN_GROUP_DETAIL(groupCode)
        );
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return fallback when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getAntigenGroupDetail('RH').subscribe(result => {
        expect(result).toEqual({ groupCode: '', groupDescription: '', antigens: [] });
        done();
      });
    });

    it('should handle error when fetching antigen group detail', (done) => {
      const groupCode = 'RH';
      const mockError = new Error('Not Found');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getAntigenGroupDetail(groupCode).subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });
  });
});
