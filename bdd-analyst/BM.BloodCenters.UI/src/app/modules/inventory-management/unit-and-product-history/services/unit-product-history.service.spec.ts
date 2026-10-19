import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UnitProductHistoryService } from './unit-product-history.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  UnitValidationDto,
  UnitProductDto,
  ProductHistoryDto,
  ApiResponse,
} from '../models/unit-product-history.model';

describe('UnitProductHistoryService', () => {
  let service: UnitProductHistoryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockValidationResponse: ApiResponse<UnitValidationDto[]> = {
    success: true,
    message: 'Unit validated successfully',
    statusCode: 200,
    data: [
      {
        unitId: '12345678901',
        collectionDate: '2024-01-15',
        source: 'COMPONENTS',
      },
    ],
  };

  const mockProductsResponse: ApiResponse<UnitProductDto[]> = {
    success: true,
    message: 'Products retrieved successfully',
    statusCode: 200,
    data: [
      {
        unitId: '12345678901',
        productCode: 'PRB',
        aliquot: '00',
        aboCodeDesc: 'O POS',
        expDate: '2024-02-14T23:59:00',
        productStatus: 'Available',
        inventoryClass: 'AV',
        disposition: 'Available',
        orderNumber: null,
        boxId: 'BOX-001',
      },
      {
        unitId: '12345678901',
        productCode: 'PLT',
        aliquot: '01',
        aboCodeDesc: 'O POS',
        expDate: '2024-01-20T23:59:00',
        productStatus: 'Shipped',
        inventoryClass: 'SH',
        disposition: 'Shipped',
        orderNumber: 'ORD-2024-001',
        boxId: null,
      },
    ],
    totalCount: 2,
  };

  const mockHistoryResponse: ApiResponse<ProductHistoryDto[]> = {
    success: true,
    message: 'History retrieved successfully',
    statusCode: 200,
    data: [
      {
        statusDescription: 'Component Production - Create Product',
        statusInd: 'AV',
        fromDate: '2024-01-15T10:30:00',
        personName: 'John Smith',
        destination: 'LAB-01',
        inventoryClass: 'AV',
        customerName: null,
        consigneeName: null,
      },
      {
        statusDescription: 'Distribution - Ship Product',
        statusInd: 'SH',
        fromDate: '2024-01-16T16:00:00',
        personName: 'Bob Wilson',
        destination: 'HOSP-A',
        inventoryClass: 'SH',
        customerName: 'HOSP-A',
        consigneeName: 'HOSP-A',
      },
    ],
    totalCount: 2,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        UnitProductHistoryService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(UnitProductHistoryService);
  });

  describe('validateUnit', () => {
    it('should validate unit successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockValidationResponse));

      service.validateUnit('12345678901').subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidationResponse.data[0]);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.VALIDATE('12345678901')
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should trim whitespace from unit ID', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockValidationResponse));

      service.validateUnit('  12345678901  ').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.VALIDATE('12345678901')
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should return error if unit ID is empty', (done) => {
      service.validateUnit('').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Unit ID is required');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should return error if unit ID exceeds 16 characters', (done) => {
      service.validateUnit('12345678901234567').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Unit ID cannot exceed 16 characters');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle API error response', (done) => {
      const errorResponse = {
        error: {
          success: false,
          message: 'Unit not found',
          statusCode: 404,
          errorCode: '0312',
        },
      };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.validateUnit('INVALID999').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Unit not found');
          done();
        },
      });
    });

    it('should handle unsuccessful API response', (done) => {
      const unsuccessfulResponse: ApiResponse<UnitValidationDto[]> = {
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        data: null as any,
      };
      apiServiceSpy.get.and.returnValue(of(unsuccessfulResponse));

      service.validateUnit('12345678901').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Validation failed');
          done();
        },
      });
    });

    it('should return first item when response contains multiple data items', (done) => {
      const multiItemResponse: ApiResponse<UnitValidationDto[]> = {
        success: true,
        message: 'Multiple matches found',
        statusCode: 200,
        data: [
          { unitId: 'FIRST', collectionDate: '2024-01-15', source: 'COMPONENTS' },
          { unitId: 'SECOND', collectionDate: '2024-01-16', source: 'PRODUCT_HISTORY' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(multiItemResponse));

      service.validateUnit('FIRST').subscribe({
        next: (result) => {
          expect(result.unitId).toBe('FIRST');
          expect(result.source).toBe('COMPONENTS');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('getProducts', () => {
    it('should retrieve products successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));

      service.getProducts('12345678901', '2024-01-15').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProductsResponse.data);
          expect(result.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.PRODUCTS('12345678901', '2024-01-15')
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should trim whitespace from unit ID', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));

      service.getProducts('  12345678901  ', '2024-01-15').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.PRODUCTS('12345678901', '2024-01-15')
          );
          done();
        },
        error: done.fail,
      });
    });


    it('should return error if unit ID is missing', (done) => {
      service.getProducts('', '2024-01-15').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Unit ID and collection date are required');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should return error if collection date is missing', (done) => {
      service.getProducts('12345678901', '').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Unit ID and collection date are required');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle API error response', (done) => {
      const errorResponse = {
        error: {
          success: false,
          message: 'Unit not found',
          statusCode: 404,
        },
      };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getProducts('INVALID999', '2024-01-15').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Unit not found');
          done();
        },
      });
    });

    it('should call API with trimmed values when whitespace-only unitId is provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));
      service.getProducts('   ', '2024-01-15').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.PRODUCTS('', '2024-01-15')
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('getProductHistory', () => {
    it('should retrieve product history successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockHistoryResponse));

      service.getProductHistory('12345678901', 'PRB', '00', '2024-01-15').subscribe({
        next: (result) => {
          expect(result).toEqual(mockHistoryResponse.data);
          expect(result.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.HISTORY(
              '12345678901',
              'PRB',
              '00',
              '2024-01-15'
            )
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should trim whitespace from parameters', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockHistoryResponse));

      service.getProductHistory('  12345678901  ', '  PRB  ', '  00  ', '2024-01-15').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.HISTORY(
              '12345678901',
              'PRB',
              '00',
              '2024-01-15'
            )
          );
          done();
        },
        error: done.fail,
      });
    });


    it('should return error if any parameter is missing', (done) => {
      service.getProductHistory('', 'PRB', '00', '2024-01-15').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('All parameters are required to fetch product history');
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle API error response for no history (error code 5326)', (done) => {
      const errorResponse = {
        error: {
          success: false,
          message: 'Product has no history',
          statusCode: 404,
          errorCode: '5326',
        },
      };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getProductHistory('12345678901', 'PLT', '99', '2024-01-15').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Product has no history');
          done();
        },
      });
    });

    it('should handle generic API errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getProductHistory('12345678901', 'PRB', '00', '2024-01-15').subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
          done();
        },
      });
    });

    it('should call API with trimmed values when whitespace-only params are provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockHistoryResponse));
      service.getProductHistory('   ', '   ', '   ', '2024-01-15').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.INVENTORY_MANAGEMENT.UNIT_PRODUCT_HISTORY.HISTORY('', '', '', '2024-01-15')
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data array in validation response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));
      service.validateUnit('12345678901').subscribe({
        error: (err) => {
          expect(err.message).toContain('Failed to validate unit');
          done();
        },
      });
    });

    it('should handle null data in validation response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));
      service.validateUnit('12345678901').subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
          done();
        },
      });
    });

    it('should handle unsuccessful response for getProducts', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Server error', statusCode: 500, data: null }));
      service.getProducts('12345678901', '2024-01-15').subscribe({
        error: (err) => {
          expect(err.message).toContain('Server error');
          done();
        },
      });
    });

    it('should return empty array when products data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));
      service.getProducts('12345678901', '2024-01-15').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle unsuccessful response for getProductHistory', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Not found', statusCode: 404, data: null }));
      service.getProductHistory('unit1', 'PRB', '00', '2024-01-15').subscribe({
        error: (err) => {
          expect(err.message).toContain('Not found');
          done();
        },
      });
    });

    it('should return empty array when history data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null }));
      service.getProductHistory('unit1', 'PRB', '00', '2024-01-15').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });
});
