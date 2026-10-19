import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CustomerProductTierPricingApiService } from './customer-product-tier-pricing-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CustomerProductTierPricingQueryDto,
  CustomerProductSummaryDto,
  CustomerProductTierPricingDto,
  ApiResponse,
} from '../models/customer-product-tier-pricing.model';

describe('CustomerProductTierPricingApiService', () => {
  let service: CustomerProductTierPricingApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSummaryResponse: ApiResponse<CustomerProductSummaryDto> = {
    success: true,
    statusCode: 200,
    message: 'Customer product summaries retrieved successfully',
    data: [
      {
        customerId: 'CUST001',
        shortName: 'Test Hospital',
        productType: 'RBC',
        productTypeDesc: 'Red Blood Cells',
        lifespan: 35,
        lifespanInd: 'Days',
        stdPrice: 150.0,
      },
      {
        customerId: 'CUST002',
        shortName: 'Memorial Hospital',
        productType: 'PLT',
        productTypeDesc: 'Platelets',
        lifespan: 5,
        lifespanInd: 'Days',
        stdPrice: 200.0,
      },
    ],
    total: 2,
  };

  const mockTierResponse: ApiResponse<CustomerProductTierPricingDto> = {
    success: true,
    statusCode: 200,
    message: 'Pricing tiers retrieved successfully',
    data: [
      {
        customerId: 'CUST001',
        chapterId: 'ALL',
        productType: 'RBC',
        tier: 1,
        fromDay: 0,
        toDay: 35,
        unitPrice: 150.0,
        effectiveDate: '2024-01-01',
        terminationDate: null,
        shortName: 'Test Hospital',
        productTypeDesc: 'Red Blood Cells',
        lifespan: 35,
        lifespanInd: 'Days',
        stdPrice: 150.0,
      },
      {
        customerId: 'CUST001',
        chapterId: 'ALL',
        productType: 'RBC',
        tier: 2,
        fromDay: 36,
        toDay: 42,
        unitPrice: 125.0,
        effectiveDate: '2024-01-01',
        terminationDate: null,
        shortName: 'Test Hospital',
        productTypeDesc: 'Red Blood Cells',
        lifespan: 35,
        lifespanInd: 'Days',
        stdPrice: 150.0,
      },
    ],
    total: 2,
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        CustomerProductTierPricingApiService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(CustomerProductTierPricingApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getCustomerProductSummaries', () => {
    it('should call API with correct endpoint and query', (done) => {
      const query: CustomerProductTierPricingQueryDto = {
        customerId: null,
        productType: 'RBC',
        sortOrder: 'ASC',
        skip: 0,
        take: 25,
      };

      apiServiceSpy.post.and.returnValue(of(mockSummaryResponse));

      service.getCustomerProductSummaries(query).subscribe({
        next: (result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.CUSTOMER_PRODUCT_TIER_PRICING.CUSTOMERS,
            query
          );
          expect(result.data.length).toBe(2);
          expect(result.total).toBe(2);
          expect(result.data[0].customerId).toBe('CUST001');
          done();
        },
      });
    });


    it('should handle errors gracefully', (done) => {
      const query: CustomerProductTierPricingQueryDto = {
        customerId: null,
        productType: null,
        sortOrder: null,
        skip: 0,
        take: 25,
      };

      const errorResponse = {
        success: false,
        statusCode: 500,
        message: 'Internal server error',
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getCustomerProductSummaries(query).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.statusCode).toBe(500);
          done();
        },
      });
    });
  });

  describe('getTiersByCustomerAndProduct', () => {
    it('should call API with correct endpoint and parameters', (done) => {
      const customerId = 'CUST001';
      const productType = 'RBC';

      apiServiceSpy.get.and.returnValue(of(mockTierResponse));

      service.getTiersByCustomerAndProduct(customerId, productType).subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_PRODUCT_TIER_PRICING.TIERS(customerId, productType)
          );
          expect(result.length).toBe(2);
          expect(result[0].tier).toBe(1);
          expect(result[1].tier).toBe(2);
          done();
        },
      });
    });

    it('should return empty array when no tiers found', (done) => {
      const customerId = 'CUST999';
      const productType = 'XXX';

      const emptyResponse: ApiResponse<CustomerProductTierPricingDto> = {
        success: false,
        statusCode: 404,
        message: 'No pricing tiers found for the specified customer and product',
        data: [],
        total: 0,
      };

      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getTiersByCustomerAndProduct(customerId, productType).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle errors gracefully', (done) => {
      const customerId = 'CUST001';
      const productType = 'RBC';

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Customer ID is required',
      };

      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getTiersByCustomerAndProduct(customerId, productType).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.statusCode).toBe(400);
          done();
        },
      });
    });

    it('should return empty array when res.data is null (covers ?? [] branch)', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: null, total: 0 }));

      service.getTiersByCustomerAndProduct('CUST001', 'RBC').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getCustomerProductSummaries — ?? branch coverage', () => {
    it('should return empty data array when res.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 200, data: null, total: 5 }));

      service.getCustomerProductSummaries({ customerId: null, productType: null, sortOrder: 'ASC', skip: 0, take: 25 }).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(5);
          done();
        },
      });
    });

    it('should return zero total when res.total is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 200, data: [], total: null }));

      service.getCustomerProductSummaries({ customerId: null, productType: null, sortOrder: 'ASC', skip: 0, take: 25 }).subscribe({
        next: (result) => {
          expect(result.total).toBe(0);
          done();
        },
      });
    });
  });
});
