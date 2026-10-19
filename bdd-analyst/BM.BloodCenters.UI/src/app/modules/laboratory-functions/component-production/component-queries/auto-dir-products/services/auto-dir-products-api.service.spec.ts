import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AutoDirProductsApiService } from './auto-dir-products-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  AutoDirProductsSearchRequestDto,
  AutoDirProductsUnitDto,
  ApiResponse
} from '../models/auto-dir-products.model';

describe('AutoDirProductsApiService', () => {
  let service: AutoDirProductsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUnit: AutoDirProductsUnitDto = {
    unitId: 'UNIT001',
    checkDigit: '12',
    collectionDate: new Date('2024-05-15'),
    donorDecisionDisplay: 'AU',
    patientId: 'PAT001',
    patientName: 'Doe, John',
    hospitalId: 'HOSP001',
    hospitalShortName: 'Test Hospital',
    needByDate: new Date('2024-06-15'),
    surgeryDate: new Date('2024-06-20'),
    surgeryId: 'SURG001',
    comments: 'Pre-surgical autologous donation',
    productTypes: ['RBC', 'PLT'],
    components: [
      {
        productType: 'RBC',
        productCode: 'E0100',
        productDescription: 'Red Blood Cells',
        expiryDate: new Date('2024-06-14'),
        shipProduct: 'Y'
      }
    ]
  };

  const mockSearchResponse: ApiResponse<AutoDirProductsUnitDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [mockUnit],
    total: 1
  };

  const mockGetByIdResponse: ApiResponse<AutoDirProductsUnitDto> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: mockUnit
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        AutoDirProductsApiService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(AutoDirProductsApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchProducts', () => {
    it('should search products with all filter criteria', (done) => {
      const request: AutoDirProductsSearchRequestDto = {
        unitId: 'UNIT001',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        needByDate: '2024-06-15',
        surgeryDate: '2024-06-20',
        hospitalId: 'HOSP001',
        patientId: 'PAT001',
        orderBy: 'UNIT',
        take: 50,
        skip: 0
      };

      apiServiceSpy.post.and.returnValue(of(mockSearchResponse));

      service.searchProducts(request).subscribe({
        next: (response) => {
          expect(response.data).toEqual([mockUnit]);
          expect(response.total).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.objectContaining({
              unitId: 'UNIT001',
              fromDate: '2024-01-01',
              toDate: '2024-12-31',
              needByDate: '2024-06-15',
              surgeryDate: '2024-06-20',
              hospitalId: 'HOSP001',
              patientId: 'PAT001',
              sort: 'A'
            })
          );
          done();
        }
      });
    });



    it('should use default total if not provided in response', (done) => {
      const responseWithoutTotal: ApiResponse<AutoDirProductsUnitDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockUnit]
      };

      apiServiceSpy.post.and.returnValue(of(responseWithoutTotal));

      const request: AutoDirProductsSearchRequestDto = {
        unitId: 'UNIT001'
      };

      service.searchProducts(request).subscribe({
        next: (response) => {
          expect(response.total).toBe(1); // Should default to data.length
          done();
        }
      });
    });

    it('should handle validation error - no criteria', (done) => {
      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          message: 'At least one search criterion is required'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      const request: AutoDirProductsSearchRequestDto = {};

      service.searchProducts(request).subscribe({
        error: (error) => {
          expect(error.error.statusCode).toBe(400);
          expect(error.error.message).toContain('At least one search criterion is required');
          done();
        }
      });
    });

    it('should handle validation error - invalid date range', (done) => {
      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          message: 'To date cannot be before From date'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      const request: AutoDirProductsSearchRequestDto = {
        fromDate: '2024-12-31',
        toDate: '2024-01-01'
      };

      service.searchProducts(request).subscribe({
        error: (error) => {
          expect(error.error.statusCode).toBe(400);
          expect(error.error.message).toContain('To date cannot be before From date');
          done();
        }
      });
    });

    it('should handle validation error - invalid surgery date', (done) => {
      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          message: 'Surgery date cannot be before Need By date'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      const request: AutoDirProductsSearchRequestDto = {
        unitId: 'TEST001',
        needByDate: '2024-06-20',
        surgeryDate: '2024-06-15'
      };

      service.searchProducts(request).subscribe({
        error: (error) => {
          expect(error.error.statusCode).toBe(400);
          expect(error.error.message).toContain('Surgery date cannot be before Need By date');
          done();
        }
      });
    });

    it('should handle validation error - invalid order by', (done) => {
      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          message: "OrderBy must be 'UNIT' or 'COLL'"
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      const request: AutoDirProductsSearchRequestDto = {
        unitId: 'TEST001',
        orderBy: 'INVALID' as any
      };

      service.searchProducts(request).subscribe({
        error: (error) => {
          expect(error.error.statusCode).toBe(400);
          expect(error.error.message).toContain("OrderBy must be 'UNIT' or 'COLL'");
          done();
        }
      });
    });

  });

  describe('getByUnitId', () => {
    it('should get unit by ID successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockGetByIdResponse));

      service.getByUnitId('UNIT001').subscribe({
        next: (unit) => {
          expect(unit).toEqual(mockUnit);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.any(String));
          done();
        }
      });
    });


    it('should handle empty unit ID error', (done) => {
      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          message: 'Unit ID is required'
        }
      };

      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getByUnitId('').subscribe({
        error: (error) => {
          expect(error.error.statusCode).toBe(400);
          expect(error.error.message).toContain('Unit ID is required');
          done();
        }
      });
    });

  });
});
