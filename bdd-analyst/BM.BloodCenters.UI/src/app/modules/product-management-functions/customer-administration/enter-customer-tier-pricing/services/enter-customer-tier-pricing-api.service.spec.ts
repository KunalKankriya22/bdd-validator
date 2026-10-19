import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EnterCustomerTierPricingApiService } from './enter-customer-tier-pricing-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CreateCustomerTierPricingRequest,
  UpdateCustomerTierPricingDto,
  CustomerTierPricingFilterRequest,
} from '../models/enter-customer-tier-pricing.model';

describe('EnterCustomerTierPricingApiService', () => {
  let service: EnterCustomerTierPricingApiService;
  let apiServiceMock: Record<string, jest.Mock>;

  beforeEach(() => {
    apiServiceMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EnterCustomerTierPricingApiService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(EnterCustomerTierPricingApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getDropdownValues ────────────────────────────────────────────────

  describe('getDropdownValues', () => {
    const mockApiResponse = {
      customers: [
        { customerId: 'C001', customerName: 'Customer One', phoneNo: '555-1234' },
        { customerId: 'C002', customerName: 'Customer Two' },
      ],
      productTypes: [
        {
          productType: 'PT001',
          description: 'Red Blood Cells',
          lifeSpan: 42,
          lifeSpanIndicator: 'Days',
          standardPrice: 250.50,
          standardTiers: [
            {
              customer: 'STANDARD',
              tier: 1,
              minimumAge: 0,
              maximumAge: 10,
              tierDay: 10,
              unitPrice: 250.50,
              effectiveDate: '2026-01-01',
              terminationDate: null,
            },
          ],
        },
      ],
    };

    it('should call apiService.get with the correct endpoint', (done) => {
      apiServiceMock.get.mockReturnValue(of(mockApiResponse));

      service.getDropdownValues().subscribe(() => {
        expect(apiServiceMock.get).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.DROPDOWN_VALUES
        );
        done();
      });
    });

    it('should map customers with customerId, customerName, and phoneNo', (done) => {
      apiServiceMock.get.mockReturnValue(of(mockApiResponse));

      service.getDropdownValues().subscribe((result) => {
        expect(result.customers).toEqual([
          { customerId: 'C001', customerName: 'Customer One', phoneNo: '555-1234' },
          { customerId: 'C002', customerName: 'Customer Two', phoneNo: undefined },
        ]);
        done();
      });
    });

    it('should map productTypes with productTypeId from productType field', (done) => {
      apiServiceMock.get.mockReturnValue(of(mockApiResponse));

      service.getDropdownValues().subscribe((result) => {
        expect(result.productTypes.length).toBe(1);
        expect(result.productTypes[0].productTypeId).toBe('PT001');
        expect(result.productTypes[0].productTypeDesc).toBe('Red Blood Cells');
        expect(result.productTypes[0].lifeSpan).toBe(42);
        expect(result.productTypes[0].lifeSpanIndicator).toBe('Days');
        expect(result.productTypes[0].standardPrice).toBe(250.50);
        expect(result.productTypes[0].standardTiers).toEqual(mockApiResponse.productTypes[0].standardTiers);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Network error');
      apiServiceMock.get.mockReturnValue(throwError(() => error));

      service.getDropdownValues().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getCustomerTierPricing ───────────────────────────────────────────

  describe('getCustomerTierPricing', () => {
    const mockResponse = {
      success: true,
      data: [
        {
          customer: 'C001',
          tier: 1,
          minimumAge: 0,
          maximumAge: 10,
          tierDay: 10,
          unitPrice: 275.00,
          effectiveDate: '2026-01-01',
          terminationDate: '2026-12-31',
        },
      ],
      total: 1,
    };

    it('should call apiService.get with the correct endpoint', (done) => {
      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.getCustomerTierPricing('C001', 'PT001').subscribe(() => {
        expect(apiServiceMock.get).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.GET('C001', 'PT001')
        );
        done();
      });
    });

    it('should map response to data and total', (done) => {
      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.getCustomerTierPricing('C001', 'PT001').subscribe((result) => {
        expect(result.data).toEqual(mockResponse.data);
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done) => {
      apiServiceMock.get.mockReturnValue(of({ success: true, data: null, total: null }));

      service.getCustomerTierPricing('C001', 'PT001').subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should default total to 0 when response.total is falsy', (done) => {
      apiServiceMock.get.mockReturnValue(of({ success: true, data: [], total: 0 }));

      service.getCustomerTierPricing('C001', 'PT001').subscribe((result) => {
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Server error');
      apiServiceMock.get.mockReturnValue(throwError(() => error));

      service.getCustomerTierPricing('C001', 'PT001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── searchCustomerTierPricing ────────────────────────────────────────

  describe('searchCustomerTierPricing', () => {
    const mockFilters: CustomerTierPricingFilterRequest = {
      effectiveDatePeriod: 'After',
      effectiveDate: '2026-01-01',
      terminationDatePeriod: 'Before',
      terminationDate: '2026-12-31',
    };

    const mockResponse = {
      success: true,
      data: [
        {
          customer: 'C001',
          tier: 1,
          minimumAge: 0,
          maximumAge: 10,
          tierDay: 10,
          unitPrice: 275.00,
          effectiveDate: '2026-01-01',
          terminationDate: '2026-12-31',
        },
      ],
      total: 1,
    };

    it('should call apiService.post with the correct endpoint and filters', (done) => {
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.searchCustomerTierPricing('C001', 'PT001', mockFilters).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.SEARCH('C001', 'PT001'),
          mockFilters
        );
        done();
      });
    });

    it('should map response to data and total', (done) => {
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.searchCustomerTierPricing('C001', 'PT001', mockFilters).subscribe((result) => {
        expect(result.data).toEqual(mockResponse.data);
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done) => {
      apiServiceMock.post.mockReturnValue(of({ success: true, data: null, total: null }));

      service.searchCustomerTierPricing('C001', 'PT001', mockFilters).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Search failed');
      apiServiceMock.post.mockReturnValue(throwError(() => error));

      service.searchCustomerTierPricing('C001', 'PT001', mockFilters).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── createCustomerTierPricing ────────────────────────────────────────

  describe('createCustomerTierPricing', () => {
    const mockRequest: CreateCustomerTierPricingRequest = {
      customerId: 'C001',
      productType: 'PT001',
      tierPricingItems: [
        {
          tier: 1,
          fromDay: 0,
          toDay: 10,
          unitPrice: 300.00,
          effectiveDate: '2026-01-01',
          terminationDate: '2026-12-31',
        },
      ],
    };

    const mockResponse = { success: true, message: 'Created successfully', total: 1 };

    it('should call apiService.post with CREATE endpoint and dto', (done) => {
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.createCustomerTierPricing(mockRequest).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.CREATE,
          mockRequest
        );
        done();
      });
    });

    it('should return the API response on success', (done) => {
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.createCustomerTierPricing(mockRequest).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Created successfully');
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Create failed');
      apiServiceMock.post.mockReturnValue(throwError(() => error));

      service.createCustomerTierPricing(mockRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── updateCustomerTierPricing ────────────────────────────────────────

  describe('updateCustomerTierPricing', () => {
    const mockDto: UpdateCustomerTierPricingDto = {
      unitPrice: 350.00,
      terminationDate: '2027-06-30',
    };

    const mockResponse = { success: true, message: 'Updated successfully', total: 1 };

    it('should call apiService.put with UPDATE endpoint and dto', (done) => {
      apiServiceMock.put.mockReturnValue(of(mockResponse));

      service.updateCustomerTierPricing('C001', 'PT001', 1, mockDto).subscribe(() => {
        expect(apiServiceMock.put).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.UPDATE('C001', 'PT001', 1),
          mockDto
        );
        done();
      });
    });

    it('should return the API response on success', (done) => {
      apiServiceMock.put.mockReturnValue(of(mockResponse));

      service.updateCustomerTierPricing('C001', 'PT001', 1, mockDto).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Updated successfully');
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Update failed');
      apiServiceMock.put.mockReturnValue(throwError(() => error));

      service.updateCustomerTierPricing('C001', 'PT001', 1, mockDto).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── deleteCustomerTierPricing ────────────────────────────────────────

  describe('deleteCustomerTierPricing', () => {
    const mockResponse = { success: true, message: 'Deleted successfully', total: 0 };

    it('should call apiService.delete with DELETE endpoint', (done) => {
      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      service.deleteCustomerTierPricing('C001', 'PT001', 1).subscribe(() => {
        expect(apiServiceMock.delete).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.DELETE('C001', 'PT001', 1)
        );
        done();
      });
    });

    it('should return the API response on success', (done) => {
      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      service.deleteCustomerTierPricing('C001', 'PT001', 1).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Deleted successfully');
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Delete failed');
      apiServiceMock.delete.mockReturnValue(throwError(() => error));

      service.deleteCustomerTierPricing('C001', 'PT001', 1).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should use correct URL encoding for special characters', (done) => {
      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      service.deleteCustomerTierPricing('C/001', 'PT/001', 2).subscribe(() => {
        expect(apiServiceMock.delete).toHaveBeenCalledWith(
          API.ENTER_CUSTOMER_TIER_PRICING.DELETE('C/001', 'PT/001', 2)
        );
        done();
      });
    });
  });
});
