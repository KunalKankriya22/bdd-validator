import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { CustomerPreferredTierService } from './customer-preferred-tier.service';
import { ApiService } from '@shared/services/api.service';
import {
  CustomerPreferredTierModel,
  CustomerPreferredTierQueryDto,
  CreateCustomerPreferredTierRequestDto,
  UpdateCustomerPreferredTierRequestDto,
  CustomerDropdownDto,
  ProductTypeDropdownDto,
  PricingTierDropdownDto
} from '../models/customer-preferred-tier.model';

describe('CustomerPreferredTierService', () => {
  let service: CustomerPreferredTierService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CustomerPreferredTierService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(CustomerPreferredTierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getAll ────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    const queryParams: CustomerPreferredTierQueryDto = {
      customerId: 'CUST001',
      productType: 'WB',
      searchKeyword: 'test',
      sortColumn: 'productType',
      sortOrder: 'A'
    };

    it('should return mapped data and totalRecords on success', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { productType: 'WB', customerId: 'CUST001', tier: 1 },
          { productType: 'RBC', customerId: 'CUST002', tier: 2 }
        ],
        total: 50
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getAll(queryParams).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(50);
        expect(result.data[0].productType).toBe('WB');
        expect(result.data[1].customerId).toBe('CUST002');
        done();
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('customer-preferred-tiers'),
        queryParams
      );
    });

    it('should return empty data array when response.data is undefined', (done) => {
      const mockResponse = { success: true, total: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getAll(queryParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should return empty data array when response.data is null', (done) => {
      const mockResponse = { success: true, data: null, total: 5 };
      mockApiService.post.and.returnValue(of(mockResponse as any));

      service.getAll(queryParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(5);
        done();
      });
    });

    it('should return totalRecords as 0 when response.total is undefined', (done) => {
      const mockResponse = { success: true, data: [{ productType: 'WB' }] };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getAll(queryParams).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should return totalRecords as 0 when response.total is null', (done) => {
      const mockResponse = { success: true, data: [{ productType: 'WB' }], total: null };
      mockApiService.post.and.returnValue(of(mockResponse as any));

      service.getAll(queryParams).subscribe(result => {
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      mockApiService.post.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getAll(queryParams).subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching customer preferred tier data:',
            errorResponse
          );
          done();
        }
      });
    });

    it('should handle empty query params', (done) => {
      const emptyParams: CustomerPreferredTierQueryDto = {};
      const mockResponse = { success: true, data: [], total: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getAll(emptyParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        jasmine.any(String),
        emptyParams
      );
    });
  });

  // ─── getById ───────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('should fetch by composite key and return first item', (done) => {
      const mockResponse = {
        success: true,
        data: [{ productType: 'WB', customerId: 'CUST001', tier: 1 }]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getById('CUST001', 'WB').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result?.productType).toBe('WB');
        expect(result?.customerId).toBe('CUST001');
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('customer-preferred-tiers/CUST001/WB')
      );
    });

    it('should return null when response.data is empty array', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getById('CUST001', 'WB').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response.data is undefined', (done) => {
      const mockResponse = { success: true };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getById('CUST001', 'WB').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response.data is null', (done) => {
      const mockResponse = { success: true, data: null };
      mockApiService.get.and.returnValue(of(mockResponse as any));

      service.getById('CUST001', 'WB').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return the first item when multiple items in data', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { productType: 'WB', customerId: 'CUST001', tier: 1 },
          { productType: 'WB', customerId: 'CUST001', tier: 2 }
        ]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getById('CUST001', 'WB').subscribe(result => {
        expect(result?.tier).toBe(1);
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 404, message: 'Not found' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getById('CUST001', 'WB').subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching customer preferred tier by ID:',
            errorResponse
          );
          done();
        }
      });
    });

    it('should encode special characters in customerId and productType', (done) => {
      const mockResponse = { success: true, data: [{ productType: 'W/B', customerId: 'C&1' }] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getById('C&1', 'W/B').subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('customer-preferred-tiers/')
      );
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto: CreateCustomerPreferredTierRequestDto = {
      productType: 'WB',
      tier: 1,
      effDate: '2024-01-01',
      termDate: '2024-12-31'
    };

    it('should create a new record successfully', (done) => {
      const mockResponse = { success: true, statusCode: 201, message: 'Created' };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.create('CUST001', createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.statusCode).toBe(201);
        done();
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('customer-preferred-tiers/CUST001'),
        createDto
      );
    });

    it('should create a record without termDate', (done) => {
      const dtoNoTerm: CreateCustomerPreferredTierRequestDto = {
        productType: 'RBC',
        tier: 2,
        effDate: '2024-06-01'
      };
      const mockResponse = { success: true, statusCode: 201 };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.create('CUST002', dtoNoTerm).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        jasmine.any(String),
        dtoNoTerm
      );
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 409, message: 'Duplicate record' };
      mockApiService.post.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.create('CUST001', createDto).subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error creating customer preferred tier:',
            errorResponse
          );
          done();
        }
      });
    });

    it('should handle server returning unsuccessful result', (done) => {
      const mockResponse = { success: false, statusCode: 400, message: 'Validation failed' };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.create('CUST001', createDto).subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.message).toBe('Validation failed');
        done();
      });
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto: UpdateCustomerPreferredTierRequestDto = {
      tier: 2,
      effDate: '2024-06-01',
      termDate: '2024-12-31'
    };

    it('should update existing record', (done) => {
      const mockResponse = { success: true, statusCode: 200, message: 'Record updated successfully' };
      mockApiService.put.and.returnValue(of(mockResponse));

      service.update('CUST001', 'WB', updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      expect(mockApiService.put).toHaveBeenCalledWith(
        jasmine.stringContaining('customer-preferred-tiers/CUST001/WB'),
        updateDto
      );
    });

    it('should update record without termDate', (done) => {
      const dtoNoTerm: UpdateCustomerPreferredTierRequestDto = {
        tier: 3,
        effDate: '2024-01-01'
      };
      const mockResponse = { success: true, statusCode: 200 };
      mockApiService.put.and.returnValue(of(mockResponse));

      service.update('CUST001', 'RBC', dtoNoTerm).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 500, message: 'Internal Server Error' };
      mockApiService.put.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.update('CUST001', 'WB', updateDto).subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error updating customer preferred tier:',
            errorResponse
          );
          done();
        }
      });
    });

    it('should handle server returning unsuccessful result', (done) => {
      const mockResponse = { success: false, statusCode: 404, message: 'Record not found' };
      mockApiService.put.and.returnValue(of(mockResponse));

      service.update('CUST001', 'WB', updateDto).subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.message).toBe('Record not found');
        done();
      });
    });
  });

  // ─── delete ────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete record and return true', (done) => {
      const mockResponse = { success: true, data: [true] };
      mockApiService.delete.and.returnValue(of(mockResponse));

      service.delete('CUST001', 'WB').subscribe(result => {
        expect(result).toBeTrue();
        done();
      });

      expect(mockApiService.delete).toHaveBeenCalledWith(
        jasmine.stringContaining('customer-preferred-tiers/CUST001/WB')
      );
    });

    it('should return false when data contains false', (done) => {
      const mockResponse = { success: true, data: [false] };
      mockApiService.delete.and.returnValue(of(mockResponse));

      service.delete('INVALID', 'XX').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false when data is empty array', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.delete.and.returnValue(of(mockResponse));

      service.delete('CUST001', 'WB').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false when data is undefined', (done) => {
      const mockResponse = { success: true };
      mockApiService.delete.and.returnValue(of(mockResponse));

      service.delete('CUST001', 'WB').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false when data is null', (done) => {
      const mockResponse = { success: true, data: null };
      mockApiService.delete.and.returnValue(of(mockResponse as any));

      service.delete('CUST001', 'WB').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      mockApiService.delete.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.delete('CUST001', 'WB').subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error deleting customer preferred tier:',
            errorResponse
          );
          done();
        }
      });
    });
  });

  // ─── getCustomersDropdown ──────────────────────────────────────────────────
  describe('getCustomersDropdown', () => {
    it('should fetch customers dropdown without search keyword', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { customerId: 'C1', customerName: 'Hospital A' },
          { customerId: 'C2', customerName: 'Hospital B' }
        ]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCustomersDropdown().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].customerId).toBe('C1');
        expect(result[1].customerName).toBe('Hospital B');
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('dropdowns/customers'),
        undefined
      );
    });

    it('should fetch customers dropdown with search keyword', (done) => {
      const mockResponse = {
        success: true,
        data: [{ customerId: 'C1', customerName: 'Hospital A' }]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCustomersDropdown('Hospital').subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('dropdowns/customers'),
        jasmine.objectContaining({ params: jasmine.any(HttpParams) })
      );
    });

    it('should pass search keyword as HttpParams', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCustomersDropdown('test').subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args;
        const options = callArgs[1] as { params: HttpParams };
        expect(options.params.get('searchKeyword')).toBe('test');
        done();
      });
    });

    it('should return empty array when response.data is undefined', (done) => {
      const mockResponse = { success: true };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCustomersDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      const mockResponse = { success: true, data: null };
      mockApiService.get.and.returnValue(of(mockResponse as any));

      service.getCustomersDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getCustomersDropdown().subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching customers dropdown:',
            errorResponse
          );
          done();
        }
      });
    });

    it('should pass undefined options when searchKeyword is empty string', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCustomersDropdown('').subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args;
        expect(callArgs[1]).toBeUndefined();
        done();
      });
    });
  });

  // ─── getProductTypesDropdown ───────────────────────────────────────────────
  describe('getProductTypesDropdown', () => {
    it('should fetch product types dropdown', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { productType: 'WB', productTypeDesc: 'Whole Blood' },
          { productType: 'RBC', productTypeDesc: 'Red Blood Cells' }
        ]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getProductTypesDropdown().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].productType).toBe('WB');
        expect(result[1].productTypeDesc).toBe('Red Blood Cells');
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('dropdowns/product-types')
      );
    });

    it('should return empty array when response.data is undefined', (done) => {
      const mockResponse = { success: true };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getProductTypesDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      const mockResponse = { success: true, data: null };
      mockApiService.get.and.returnValue(of(mockResponse as any));

      service.getProductTypesDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 503, message: 'Service Unavailable' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getProductTypesDropdown().subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching product types dropdown:',
            errorResponse
          );
          done();
        }
      });
    });
  });

  // ─── getFilterProductTypes ─────────────────────────────────────────────────
  describe('getFilterProductTypes', () => {
    it('should fetch filter product types with customerId param', (done) => {
      const mockResponse = {
        success: true,
        data: [{ productType: 'WB', productTypeDesc: 'Whole Blood' }]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getFilterProductTypes('CUST001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].productType).toBe('WB');
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('dropdowns/filter-product-types'),
        jasmine.objectContaining({ params: jasmine.any(HttpParams) })
      );
    });

    it('should pass customerId as HttpParams', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getFilterProductTypes('CUST999').subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args;
        const options = callArgs[1] as { params: HttpParams };
        expect(options.params.get('customerId')).toBe('CUST999');
        done();
      });
    });

    it('should return empty array when response.data is undefined', (done) => {
      const mockResponse = { success: true };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getFilterProductTypes('CUST001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      const mockResponse = { success: true, data: null };
      mockApiService.get.and.returnValue(of(mockResponse as any));

      service.getFilterProductTypes('CUST001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getFilterProductTypes('CUST001').subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching filter product types:',
            errorResponse
          );
          done();
        }
      });
    });
  });

  // ─── getPricingTiersDropdown ───────────────────────────────────────────────
  describe('getPricingTiersDropdown', () => {
    it('should fetch pricing tiers with productType only', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { tier: 1, fromDay: 0, toDay: 5, unitPrice: 100, lifeSpan: 42, lifeSpanInd: 'D' },
          { tier: 2, fromDay: 6, toDay: 10, unitPrice: 90, lifeSpan: 42, lifeSpanInd: 'D' }
        ]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getPricingTiersDropdown('WB').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].tier).toBe(1);
        expect(result[0].unitPrice).toBe(100);
        expect(result[1].toDay).toBe(10);
        done();
      });

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const options = callArgs[1] as { params: HttpParams };
      expect(options.params.get('productType')).toBe('WB');
      expect(options.params.has('customerId')).toBeFalse();
    });

    it('should fetch pricing tiers with productType and customerId', (done) => {
      const mockResponse = {
        success: true,
        data: [{ tier: 1, fromDay: 0, toDay: 5, unitPrice: 150, lifeSpan: 42, lifeSpanInd: 'D' }]
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getPricingTiersDropdown('RBC', 'CUST001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].unitPrice).toBe(150);
        done();
      });

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const options = callArgs[1] as { params: HttpParams };
      expect(options.params.get('productType')).toBe('RBC');
      expect(options.params.get('customerId')).toBe('CUST001');
    });

    it('should not include customerId param when customerId is undefined', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getPricingTiersDropdown('WB', undefined).subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args;
        const options = callArgs[1] as { params: HttpParams };
        expect(options.params.get('productType')).toBe('WB');
        expect(options.params.has('customerId')).toBeFalse();
        done();
      });
    });

    it('should not include customerId param when customerId is empty string', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getPricingTiersDropdown('WB', '').subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args;
        const options = callArgs[1] as { params: HttpParams };
        expect(options.params.has('customerId')).toBeFalse();
        done();
      });
    });

    it('should return empty array when response.data is undefined', (done) => {
      const mockResponse = { success: true };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getPricingTiersDropdown('WB').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      const mockResponse = { success: true, data: null };
      mockApiService.get.and.returnValue(of(mockResponse as any));

      service.getPricingTiersDropdown('WB').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getPricingTiersDropdown('WB').subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching pricing tiers dropdown:',
            errorResponse
          );
          done();
        }
      });
    });

    it('should call correct endpoint', (done) => {
      const mockResponse = { success: true, data: [] };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getPricingTiersDropdown('WB').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringContaining('dropdowns/pricing-tiers'),
          jasmine.any(Object)
        );
        done();
      });
    });
  });
});
