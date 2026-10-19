import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { StandardTierPricingApiService } from './standard-tier-pricing-api.service';
import {
  ProductTypeDto,
  StandardTierPricingDto,
  StandardTierPricingQueryDto,
  CreateStandardTierPricingDto,
  UpdateStandardTierPricingDto,
  ApiSuccessResponse,
  StandardTierPricingErrorMessages
} from '../models/standard-tier-pricing.model';
import { API } from '@core/constants/api.constants';
import { environment } from 'src/environments/environment';

describe('StandardTierPricingApiService', () => {
  let service: StandardTierPricingApiService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  const mockProducts: ProductTypeDto[] = [
    { productType: 'RBC01', productTypeDesc: 'Red Blood Cells', lifeSpan: 42, lifeSpanInd: 'DY', stdPrice: null },
    { productType: 'PLT01', productTypeDesc: 'Platelets', lifeSpan: 5, lifeSpanInd: 'DY', stdPrice: null }
  ];

  const mockTier: StandardTierPricingDto = {
    productType: 'RBC01',
    tier: 1,
    fromDay: 1,
    toDay: 7,
    unitPrice: 200.00,
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-01-01T10:30:00Z',
    chapterId: '0001',
    customerId: 'STANDARD'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StandardTierPricingApiService]
    });

    service = TestBed.inject(StandardTierPricingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getActiveProducts', () => {
    it('should return products from API response data', (done: DoneFn) => {
      const response: ApiSuccessResponse<ProductTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockProducts
      };

      service.getActiveProducts().subscribe(products => {
        expect(products).toEqual(mockProducts);
        expect(products.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.PRODUCTS) && req.method === 'GET'
      );
      req.flush(response);
    });

    it('should return empty array when data is null', (done: DoneFn) => {
      const response: ApiSuccessResponse<ProductTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: undefined
      };

      service.getActiveProducts().subscribe(products => {
        expect(products).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.PRODUCTS) && req.method === 'GET'
      );
      req.flush(response);
    });

    it('should handle error response', (done: DoneFn) => {
      service.getActiveProducts().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.PRODUCTS)
      );
      req.flush(
        { errorCode: '0322', errorResponse: { errorCode: '0322', error: 'Invalid product type' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('searchTiers', () => {
    const queryDto: StandardTierPricingQueryDto = {
      productType: 'RBC01',
      sortColumn: 'Tier',
      sortOrder: 'ASC'
    };

    it('should POST with correct URL and return mapped response', (done: DoneFn) => {
      const response: ApiSuccessResponse<StandardTierPricingDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockTier],
        totalCount: 1
      };

      service.searchTiers(10, 0, queryDto).subscribe(result => {
        expect(result.data).toEqual([mockTier]);
        expect(result.totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.SEARCH(10, 0)) && req.method === 'POST'
      );
      expect(req.request.body).toEqual(queryDto);
      req.flush(response);
    });

    it('should default to empty array and zero count when response data is null', (done: DoneFn) => {
      const response: ApiSuccessResponse<StandardTierPricingDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success'
      };

      service.searchTiers(25, 50, queryDto).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.SEARCH(25, 50)) && req.method === 'POST'
      );
      req.flush(response);
    });

    it('should handle error response', (done: DoneFn) => {
      service.searchTiers(10, 0, queryDto).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid product type');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'POST');
      req.flush(
        { errorCode: '0322', errorResponse: { errorCode: '0322', error: 'Invalid product type' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('getTierById', () => {
    it('should GET with correct URL and return tier data', (done: DoneFn) => {
      const response: ApiSuccessResponse<StandardTierPricingDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockTier
      };

      service.getTierById('RBC01', 1).subscribe(tier => {
        expect(tier).toEqual(mockTier);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.GET_BY_ID('RBC01', 1)) && req.method === 'GET'
      );
      req.flush(response);
    });

    it('should throw error when data is null', (done: DoneFn) => {
      const response: ApiSuccessResponse<StandardTierPricingDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: undefined
      };

      service.getTierById('RBC01', 1).subscribe({
        error: (error) => {
          expect(error.message).toContain('Tier not found');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(response);
    });

    it('should handle HTTP error response', (done: DoneFn) => {
      service.getTierById('RBC01', 99).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTier', () => {
    const createDto: CreateStandardTierPricingDto = {
      productType: 'RBC01',
      tier: 2,
      fromDay: 8,
      toDay: 14,
      unitPrice: 150.00,
      effDate: '2024-06-01',
      termDate: null
    };

    it('should POST with correct URL and body', (done: DoneFn) => {
      const response: ApiSuccessResponse<any> = {
        success: true,
        statusCode: 201,
        message: 'Created'
      };

      service.createTier(createDto).subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.CREATE) && req.method === 'POST'
      );
      expect(req.request.body).toEqual(createDto);
      req.flush(response);
    });

    it('should handle duplicate tier error', (done: DoneFn) => {
      service.createTier(createDto).subscribe({
        error: (error) => {
          expect(error.message).toContain(StandardTierPricingErrorMessages['7318']);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'POST');
      req.flush(
        { errorCode: '7318', errorResponse: { errorCode: '7318', error: 'Tier is already defined' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle overlap error', (done: DoneFn) => {
      service.createTier(createDto).subscribe({
        error: (error) => {
          expect(error.message).toContain(StandardTierPricingErrorMessages['7315']);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'POST');
      req.flush(
        { errorCode: '7315', errorResponse: { errorCode: '7315', error: 'Overlap' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('updateTier', () => {
    const updateDto: UpdateStandardTierPricingDto = {
      fromDay: 1,
      toDay: 10,
      unitPrice: 250.00,
      effDate: '2024-01-01',
      termDate: '2025-12-31'
    };

    it('should PUT with correct URL and body', (done: DoneFn) => {
      const response: ApiSuccessResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Updated'
      };

      service.updateTier('RBC01', 1, updateDto).subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.UPDATE('RBC01', 1)) && req.method === 'PUT'
      );
      expect(req.request.body).toEqual(updateDto);
      req.flush(response);
    });

    it('should handle validation error', (done: DoneFn) => {
      service.updateTier('RBC01', 1, updateDto).subscribe({
        error: (error) => {
          expect(error.message).toContain(StandardTierPricingErrorMessages['7502']);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'PUT');
      req.flush(
        { errorCode: '7502', errorResponse: { errorCode: '7502', error: 'Max < Min' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('deleteTier', () => {
    it('should DELETE with correct URL', (done: DoneFn) => {
      const response: ApiSuccessResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Deleted'
      };

      service.deleteTier('RBC01', 1).subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(API.STANDARD_TIER_PRICING.DELETE('RBC01', 1)) && req.method === 'DELETE'
      );
      req.flush(response);
    });

    it('should handle error response', (done: DoneFn) => {
      service.deleteTier('RBC01', 1).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'DELETE');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('handleError', () => {
    it('should map known error code from nested errorResponse', (done: DoneFn) => {
      service.getActiveProducts().subscribe({
        error: (error) => {
          expect(error.message).toContain('Error 0322');
          expect(error.message).toContain(StandardTierPricingErrorMessages['0322']);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(
        { errorResponse: { errorCode: '0322', error: 'Invalid product type' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should map known error code from flat errorCode', (done: DoneFn) => {
      service.getActiveProducts().subscribe({
        error: (error) => {
          expect(error.message).toContain('Error 0500');
          expect(error.message).toContain(StandardTierPricingErrorMessages['0500']);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(
        { errorCode: '0500' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should use errorResponse.error when error code is not in mapping', (done: DoneFn) => {
      service.getActiveProducts().subscribe({
        error: (error) => {
          expect(error.message).toContain('Custom error message');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(
        { errorResponse: { errorCode: '9999', error: 'Custom error message' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should use errorResponse.error when no errorCode present', (done: DoneFn) => {
      service.getActiveProducts().subscribe({
        error: (error) => {
          expect(error.message).toContain('Some error message');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(
        { errorResponse: { error: 'Some error message' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should use default message when error body is not an object', (done: DoneFn) => {
      service.getActiveProducts().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(req => req.method === 'GET');
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });
});
