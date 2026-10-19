import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  EnterProductServiceCodesApiService,
  ApiResponse,
} from './enter-product-service-codes-api.service';
import {
  ProductServiceCodeDto,
  ProductServiceCodeQueryDto,
  UpdateProductServiceCodeDto,
  InventoryProductTypeLOV,
  ProductionProductTypeLOV,
  ProductCodeLOV,
  ServiceCodeLOV,
} from '../models/enter-product-service-codes.model';

describe('EnterProductServiceCodesApiService', () => {
  let service: EnterProductServiceCodesApiService;
  let httpMock: HttpTestingController;

  const baseUrl = '/api/v1/distributions';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EnterProductServiceCodesApiService]
    });

    service = TestBed.inject(EnterProductServiceCodesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // getProductServiceCodes
  // ---------------------------------------------------------------------------
  describe('getProductServiceCodes', () => {
    const query: ProductServiceCodeQueryDto = {
      searchKeyword: 'RBC',
      invProductType: 'WHOLE',
      sortColumn: 'productCode',
      sortOrder: 'ASC',
    };
    const take = 25;
    const skip = 0;
    const expectedUrl = `${baseUrl}/${take}/${skip}`;

    it('should POST and map data/totalCount to data/total', () => {
      const mockItems: ProductServiceCodeDto[] = [
        {
          productCode: 'PRD01',
          productDesc: 'Product 1',
          productType: 'TYPE1',
          invProductType: 'INV1',
          outOfStateFlag: 'N',
          returnable: 'Y',
          stdPrice: 100,
          serviceCode: 'SVC01',
        },
      ];

      const apiResponse: ApiResponse<ProductServiceCodeDto> = {
        data: mockItems,
        totalCount: 50,
        success: true,
      };

      service.getProductServiceCodes(query, take, skip).subscribe((result) => {
        expect(result.data).toEqual(mockItems);
        expect(result.total).toBe(50);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(apiResponse);
    });

    it('should default data to [] and total to 0 when response has nulls', () => {
      const apiResponse = {
        data: null,
        totalCount: null,
        success: true,
      };

      service.getProductServiceCodes(query, take, skip).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.getProductServiceCodes(query, take, skip).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            'Failed to load product service codes:',
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getProductServiceCode
  // ---------------------------------------------------------------------------
  describe('getProductServiceCode', () => {
    const productCode = 'PRD01';
    const expectedUrl = `${baseUrl}/${productCode}`;

    it('should GET and return the first item from data array', () => {
      const mockItem: ProductServiceCodeDto = {
        productCode: 'PRD01',
        productDesc: 'Product 1',
        productType: 'TYPE1',
        invProductType: 'INV1',
        outOfStateFlag: 'N',
        returnable: 'Y',
        stdPrice: 100,
        serviceCode: 'SVC01',
      };

      const apiResponse: ApiResponse<ProductServiceCodeDto> = {
        data: [mockItem],
        totalCount: 1,
        success: true,
      };

      service.getProductServiceCode(productCode).subscribe((result) => {
        expect(result).toEqual(mockItem);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return null when data array is empty', () => {
      const apiResponse: ApiResponse<ProductServiceCodeDto> = {
        data: [],
        totalCount: 0,
        success: true,
      };

      service.getProductServiceCode(productCode).subscribe((result) => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.getProductServiceCode(productCode).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            `Failed to load product ${productCode}:`,
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // updateProductServiceCode
  // ---------------------------------------------------------------------------
  describe('updateProductServiceCode', () => {
    const productCode = 'PRD01';
    const expectedUrl = `${baseUrl}/${productCode}`;
    const dto: UpdateProductServiceCodeDto = {
      serviceCode: 'SVC02',
      stdPrice: 250.5,
    };

    it('should PUT and return void on success', () => {
      const apiResponse: ApiResponse<void> = {
        data: [] as any,
        totalCount: 0,
        success: true,
        message: 'Updated successfully',
      };

      service.updateProductServiceCode(productCode, dto).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.updateProductServiceCode(productCode, dto).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            `Failed to update product ${productCode}:`,
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getInventoryProductTypes
  // ---------------------------------------------------------------------------
  describe('getInventoryProductTypes', () => {
    const expectedUrl = `${baseUrl}/inventory-product-types`;

    it('should GET and return inventory product types array', () => {
      const mockData: InventoryProductTypeLOV[] = [
        { productType: 'WHOLE', productTypeDesc: 'Whole Blood' },
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
      ];

      const apiResponse: ApiResponse<InventoryProductTypeLOV> = {
        data: mockData,
        totalCount: 2,
        success: true,
      };

      service.getInventoryProductTypes().subscribe((result) => {
        expect(result).toEqual(mockData);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.getInventoryProductTypes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            'Failed to load inventory product types:',
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getProductionProductTypes
  // ---------------------------------------------------------------------------
  describe('getProductionProductTypes', () => {
    const expectedUrl = `${baseUrl}/production-product-types`;

    it('should GET and return production product types array', () => {
      const mockData: ProductionProductTypeLOV[] = [
        { productType: 'CRYO' },
        { productType: 'PLATELET' },
      ];

      const apiResponse: ApiResponse<ProductionProductTypeLOV> = {
        data: mockData,
        totalCount: 2,
        success: true,
      };

      service.getProductionProductTypes().subscribe((result) => {
        expect(result).toEqual(mockData);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.getProductionProductTypes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            'Failed to load production product types:',
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getProductCodes
  // ---------------------------------------------------------------------------
  describe('getProductCodes', () => {
    const expectedUrl = `${baseUrl}/product-codes`;

    it('should GET and return product codes array', () => {
      const mockData: ProductCodeLOV[] = [
        { productCode: 'PRD01', productDesc: 'Product One' },
        { productCode: 'PRD02', productDesc: 'Product Two' },
      ];

      const apiResponse: ApiResponse<ProductCodeLOV> = {
        data: mockData,
        totalCount: 2,
        success: true,
      };

      service.getProductCodes().subscribe((result) => {
        expect(result).toEqual(mockData);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.getProductCodes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            'Failed to load product codes:',
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getServiceCodes
  // ---------------------------------------------------------------------------
  describe('getServiceCodes', () => {
    const expectedUrl = `${baseUrl}/service-codes`;

    it('should GET and return service codes array', () => {
      const mockData: ServiceCodeLOV[] = [
        { serviceCode: 'SVC01' },
        { serviceCode: 'SVC02' },
      ];

      const apiResponse: ApiResponse<ServiceCodeLOV> = {
        data: mockData,
        totalCount: 2,
        success: true,
      };

      service.getServiceCodes().subscribe((result) => {
        expect(result).toEqual(mockData);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should log error and rethrow on HTTP failure', () => {
      spyOn(console, 'error');

      service.getServiceCodes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith(
            'Failed to load service codes:',
            jasmine.anything()
          );
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
