import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductCombinationsApiService } from './product-combinations-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductCombinationDto,
  CreateProductCombinationRequestDto,
  ApiResponse,
  ProductCombinationQueryDto,
  ProductTypeDetailDto,
  MatrixProductTypeDto
} from '../models/product-combinations.model';

describe('ProductCombinationsApiService', () => {
  let service: ProductCombinationsApiService;
  let httpMock: HttpTestingController;

  const mockMatrixProductTypes: MatrixProductTypeDto[] = [
    { bagCode: '2', setId: 1, productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { bagCode: '2', setId: 1, productType: 'PLT', productTypeDesc: 'Platelets' }
  ];

  const mockProductTypes: ProductTypeDetailDto[] = [
    { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
  ];

  const mockCombination: ProductCombinationDto = {
    setId: 1,
    bagCode: '2',
    productTypes: mockMatrixProductTypes
  };

  const mockApiResponse: ApiResponse<ProductCombinationDto[]> = {
    success: true,
    message: 'Data retrieved successfully',
    statusCode: 200,
    data: [mockCombination],
    totalCount: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProductCombinationsApiService,
        ApiService
      ]
    });

    service = TestBed.inject(ProductCombinationsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchProductCombinations', () => {
    it('should search product combinations with filters', (done) => {
      const take = 25;
      const skip = 0;
      const filters: ProductCombinationQueryDto = {
        bagCode: '2',
        productType: 'RBC'
      };

      service.searchProductCombinations(take, skip, filters).subscribe((response) => {
        expect(response.data).toEqual([mockCombination]);
        expect(response.totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.SEARCH(take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockApiResponse);
    });

    it('should handle search error', (done) => {
      const take = 25;
      const skip = 0;
      const filters: ProductCombinationQueryDto = {};

      service.searchProductCombinations(take, skip, filters).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.SEARCH(take, skip));
      req.flush(
        { success: false, message: 'Internal server error', statusCode: 500 },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getProductCombinationById', () => {
    it('should get product combination by ID', (done) => {
      const setId = 1;
      const response: ApiResponse<ProductCombinationDto> = {
        success: true,
        message: 'Product combination retrieved successfully',
        statusCode: 200,
        data: mockCombination
      };

      service.getProductCombinationById(setId).subscribe((data) => {
        expect(data).toEqual(mockCombination);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.GET_BY_ID(setId));
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('should handle 404 error', (done) => {
      const setId = 999;

      service.getProductCombinationById(setId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.GET_BY_ID(setId));
      req.flush(
        { success: false, message: 'Product combination not found', statusCode: 404 },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('createProductCombination', () => {
    it('should create product combination', (done) => {
      const payload: CreateProductCombinationRequestDto = {
        numberOfBags: 2,
        productTypes: ['RBC', 'PLT']
      };
      const response: ApiResponse<ProductCombinationDto> = {
        success: true,
        message: 'Product combination created successfully',
        statusCode: 201,
        data: mockCombination
      };

      service.createProductCombination(payload).subscribe((result) => {
        expect(result.data).toEqual(mockCombination);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(response);
    });

    it('should throw error when API returns success:false', (done) => {
      const payload: CreateProductCombinationRequestDto = {
        numberOfBags: 2,
        productTypes: ['RBC', 'PLT']
      };
      const response: ApiResponse<ProductCombinationDto> = {
        success: false,
        message: 'Combination already exists',
        statusCode: 400
      };

      service.createProductCombination(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.success).toBe(false);
          expect(error.error.message).toBe('Combination already exists');
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.CREATE);
      req.flush(response);
    });
  });

  describe('deleteProductCombination', () => {
    it('should delete product combination', (done) => {
      const setId = 1;
      const response: ApiResponse<void> = {
        success: true,
        message: 'Product combination deleted successfully',
        statusCode: 200
      };

      service.deleteProductCombination(setId).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.DELETE(setId));
      expect(req.request.method).toBe('DELETE');
      req.flush(response);
    });

    it('should handle 404 error on delete', (done) => {
      const setId = 999;

      service.deleteProductCombination(setId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.DELETE(setId));
      req.flush(
        { success: false, message: 'Product combination not found', statusCode: 404 },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('getActiveProductTypes', () => {
    it('should get active product types', (done) => {
      // API returns array directly, not wrapped in ApiResponse
      const response = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' }
      ];

      service.getActiveProductTypes().subscribe((data) => {
        expect(data).toEqual(mockProductTypes);
        expect(data.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.PRODUCT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('should handle empty product types', (done) => {
      const response: any[] = [];

      service.getActiveProductTypes().subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.PRODUCT_TYPES);
      req.flush(response);
    });

    it('should handle error when loading product types', (done) => {
      service.getActiveProductTypes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.PRODUCT_TYPES);
      req.flush(
        { success: false, message: 'Internal server error', statusCode: 500 },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getBagCodes', () => {
    it('should get bag codes', (done) => {
      const response = [
        { bagCode: '1' },
        { bagCode: '2' },
        { bagCode: '3' }
      ];

      service.getBagCodes().subscribe((data) => {
        expect(data).toEqual(['1', '2', '3']);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.BAG_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('should handle error when loading bag codes', (done) => {
      service.getBagCodes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.BAG_CODES);
      req.flush(
        { success: false, message: 'Internal server error', statusCode: 500 },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getMatrixProductTypes', () => {
    it('should get matrix product types', (done) => {
      const response = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' }
      ];

      service.getMatrixProductTypes().subscribe((data) => {
        expect(data).toEqual(mockProductTypes);
        expect(data.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.MATRIX_PRODUCT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('should handle error when loading matrix product types', (done) => {
      service.getMatrixProductTypes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.MATRIX_PRODUCT_TYPES);
      req.flush(
        { success: false, message: 'Internal server error', statusCode: 500 },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getNextSetId', () => {
    it('should get next set ID', (done) => {
      const response = { codeSet: 42 };

      service.getNextSetId().subscribe((data) => {
        expect(data).toBe(42);
        done();
      });

      const req = httpMock.expectOne(API.PRODUCT_COMBINATIONS.NEXT_SET_ID);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });
});
