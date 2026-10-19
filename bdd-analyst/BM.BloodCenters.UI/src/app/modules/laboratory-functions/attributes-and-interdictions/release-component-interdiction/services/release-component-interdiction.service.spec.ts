import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ReleaseComponentInterdictionService } from './release-component-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidateUnitResponseDto,
  ValidProductDto,
  ComponentInterdictionDto,
  ReleaseInterdictionsRequestDto,
  ApiResponse,
} from '../models/release-component-interdiction.models';

describe('ReleaseComponentInterdictionService', () => {
  let service: ReleaseComponentInterdictionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const base = API.RELEASE_COMPONENT_INTERDICTION.BASE;

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: '001234567890123',
    collDate: '2024-01-15T00:00:00Z',
    availableCollectionDates: ['2024-01-15T00:00:00Z'],
    isValid: true,
  };

  const mockProducts: ValidProductDto[] = [
    { productCode: 'RBC01', productDesc: 'Red Blood Cells Leukoreduced' },
  ];

  const mockInterdictions: ComponentInterdictionDto[] = [
    {
      unitId: '001234567890123',
      collDate: '2024-01-15T00:00:00Z',
      chapterId: '0001',
      productCode: 'RBC01',
      interCode: '0010',
      interDesc: 'Reactive Donor Screening',
      interType: 'NFT',
      interTypeDesc: null,
      insertDate: '2024-01-15T00:00:00Z',
      insertUser: 'SYSTEM',
    },
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReleaseComponentInterdictionService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ReleaseComponentInterdictionService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should validate unit via POST and return data', (done) => {
      const response: ApiResponse<ValidateUnitResponseDto> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        item: mockUnitValidation,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.validateUnit('001234567890123').subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnitValidation);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_INTERDICTION.VALIDATE_UNIT}`,
            jasmine.objectContaining({ unitId: '001234567890123' }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

  });

  describe('getValidProducts', () => {
    it('should retrieve valid products via POST', (done) => {
      const response: ApiResponse<ValidProductDto[]> = {
        success: true,
        message: 'Product codes retrieved successfully',
        statusCode: 200,
        item: mockProducts,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getValidProducts('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_INTERDICTION.VALID_PRODUCTS}`,
            jasmine.objectContaining({ unitId: '001234567890123', collDate: '2024-01-15T00:00:00Z' }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

    it('should return empty array when no products found', (done) => {
      const response: ApiResponse<ValidProductDto[]> = {
        success: true,
        message: 'No product codes found',
        statusCode: 200,
        item: [],
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getValidProducts('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle product codes error', (done) => {
      const errorResponse = {
        error: { message: 'Failed to load products' },
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getValidProducts('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Failed to load products');
          done();
        },
      });
    });
  });

  describe('getInterdictions', () => {
    it('should retrieve interdictions for a product via POST', (done) => {
      const response: ApiResponse<ComponentInterdictionDto[]> = {
        success: true,
        message: 'Interdictions retrieved successfully',
        statusCode: 200,
        item: mockInterdictions,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service
        .getInterdictions('001234567890123', '2024-01-15T00:00:00Z', 'RBC01')
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockInterdictions);
            expect(apiServiceSpy.post).toHaveBeenCalledWith(
              `${base}${API.RELEASE_COMPONENT_INTERDICTION.INTERDICTIONS}`,
              jasmine.objectContaining({ unitId: '001234567890123', collDate: '2024-01-15T00:00:00Z', productCode: 'RBC01' }),
              jasmine.any(Object),
            );
            done();
          },
        });
    });

    it('should return empty array when no interdictions found', (done) => {
      const response: ApiResponse<ComponentInterdictionDto[]> = {
        success: true,
        message: 'No interdictions found',
        statusCode: 200,
        item: [],
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service
        .getInterdictions('001234567890123', '2024-01-15T00:00:00Z', 'RBC01')
        .subscribe({
          next: (result) => {
            expect(result).toEqual([]);
            done();
          },
        });
    });

    it('should handle interdictions error', (done) => {
      const errorResponse = {
        error: { message: 'Product not found' },
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service
        .getInterdictions('001234567890123', '2024-01-15T00:00:00Z', 'INVALID')
        .subscribe({
          error: (error) => {
            expect(error.error.message).toBe('Product not found');
            done();
          },
        });
    });
  });

  describe('releaseInterdictions', () => {
    it('should release interdictions via POST', (done) => {
      const request: ReleaseInterdictionsRequestDto = {
        unitId: '001234567890123',
        collDate: '2024-01-15T00:00:00Z',
        productCode: 'RBC01',
        interCodes: ['0010'],
      };

      const response: ApiResponse<{ deletedCount: number }> = {
        success: true,
        message: '1 interdiction(s) released successfully',
        statusCode: 200,
        item: { deletedCount: 1 },
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.releaseInterdictions(request).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.item!.deletedCount).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_INTERDICTION.RELEASE}`,
            request,
          );
          done();
        },
      });
    });

    it('should handle release error', (done) => {
      const request: ReleaseInterdictionsRequestDto = {
        unitId: '001234567890123',
        collDate: '2024-01-15T00:00:00Z',
        productCode: 'RBC01',
        interCodes: [],
      };

      const errorResponse = {
        error: { message: 'No interdictions selected for release' },
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.releaseInterdictions(request).subscribe({
        error: (error) => {
          expect(error.error.message).toBe('No interdictions selected for release');
          done();
        },
      });
    });

    it('should release multiple interdictions', (done) => {
      const request: ReleaseInterdictionsRequestDto = {
        unitId: '001234567890123',
        collDate: '2024-01-15T00:00:00Z',
        productCode: 'RBC01',
        interCodes: ['0010', '0020'],
      };

      const response: ApiResponse<{ deletedCount: number }> = {
        success: true,
        message: '2 interdiction(s) released successfully',
        statusCode: 200,
        item: { deletedCount: 2 },
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.releaseInterdictions(request).subscribe({
        next: (result) => {
          expect(result.item!.deletedCount).toBe(2);
          done();
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should log and rethrow errors in validateUnit', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Test error' };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.validateUnit('TEST').subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error validating unit:', errorResponse);
          done();
        },
      });
    });

    it('should log and rethrow errors in getValidProducts', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Test error' };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getValidProducts('TEST', '2024-01-15T00:00:00Z').subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error fetching valid products:', errorResponse);
          done();
        },
      });
    });

    it('should log and rethrow errors in getInterdictions', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Test error' };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getInterdictions('TEST', '2024-01-15T00:00:00Z', 'RBC01').subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error fetching interdictions:', errorResponse);
          done();
        },
      });
    });

    it('should log and rethrow errors in releaseInterdictions', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Test error' };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.releaseInterdictions({
        unitId: 'TEST',
        collDate: '2024-01-15T00:00:00Z',
        productCode: 'RBC01',
        interCodes: ['0010'],
      }).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error releasing interdictions:', errorResponse);
          done();
        },
      });
    });
  });
});
