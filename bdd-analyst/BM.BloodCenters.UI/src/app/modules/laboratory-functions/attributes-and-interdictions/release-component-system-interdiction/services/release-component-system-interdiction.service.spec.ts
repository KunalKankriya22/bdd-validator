import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ReleaseComponentSystemInterdictionService } from './release-component-system-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidateUnitResponseDto,
  ValidProductDto,
  ComponentSystemInterdictionDto,
  ReleaseSystemInterdictionsRequestDto,
  ApiResponse,
} from '../models/release-component-system-interdiction.models';

describe('ReleaseComponentSystemInterdictionService', () => {
  let service: ReleaseComponentSystemInterdictionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const base = API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.BASE;

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: 'W123417070471',
    collDate: '2025-01-11T00:00:00Z',
    availableCollectionDates: ['2025-01-11T00:00:00Z'],
    isValid: true,
  };

  const mockProducts: ValidProductDto[] = [
    { productCode: 'E5165V00', productDesc: 'CRYPORECIPITATE|None/NS/<=-18C' },
    { productCode: 'E0385V00', productDesc: 'RED BLOOD CELLS AS/4' },
  ];

  const mockInterdictions: ComponentSystemInterdictionDto[] = [
    {
      unitId: 'W123417070471',
      collDate: '2025-01-11T00:00:00Z',
      chapterId: 'DAL',
      productCode: 'E0385V00',
      interCode: 'CMTI',
      interDesc: 'Time.Max. Allowable',
      interType: 'N',
      interTypeDesc: 'NFT',
      insertDate: '2025-01-11T10:00:00Z',
      insertUser: 'SYSTEM',
    },
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReleaseComponentSystemInterdictionService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ReleaseComponentSystemInterdictionService);
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

      service.validateUnit('W123417070471').subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnitValidation);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.VALIDATE_UNIT}`,
            jasmine.objectContaining({ unitId: 'W123417070471' }),
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
        message: 'Valid products retrieved successfully',
        statusCode: 200,
        item: mockProducts,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getValidProducts('W123417070471', '2025-01-11T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.VALID_PRODUCTS}`,
            jasmine.objectContaining({ unitId: 'W123417070471', collDate: '2025-01-11T00:00:00Z' }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

    it('should return empty array when no products found', (done) => {
      const response: ApiResponse<ValidProductDto[]> = {
        success: true,
        message: 'No products found',
        statusCode: 200,
        item: [],
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getValidProducts('W123417070471', '2025-01-11T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle product codes error', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { message: 'Failed to load products' } })));

      service.getValidProducts('W123417070471', '2025-01-11T00:00:00Z').subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Failed to load products');
          done();
        },
      });
    });
  });

  describe('getInterdictions', () => {
    it('should retrieve interdictions via POST', (done) => {
      const response: ApiResponse<ComponentSystemInterdictionDto[]> = {
        success: true,
        message: 'Interdictions retrieved successfully',
        statusCode: 200,
        item: mockInterdictions,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('W123417070471', '2025-01-11T00:00:00Z', 'E0385V00').subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictions);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.INTERDICTIONS}`,
            jasmine.objectContaining({ unitId: 'W123417070471', collDate: '2025-01-11T00:00:00Z', productCode: 'E0385V00', interCode: null }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

    it('should pass interCode filter when provided', (done) => {
      const response: ApiResponse<ComponentSystemInterdictionDto[]> = {
        success: true,
        message: 'Filtered',
        statusCode: 200,
        item: mockInterdictions,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('W123417070471', '2025-01-11T00:00:00Z', 'E0385V00', 'I', 'CMTI').subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.INTERDICTIONS}`,
            jasmine.objectContaining({ interCode: 'CMTI' }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

    it('should return empty array when no interdictions found', (done) => {
      const response: ApiResponse<ComponentSystemInterdictionDto[]> = {
        success: true,
        message: 'No interdictions found',
        statusCode: 200,
        item: [],
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('W123417070471', '2025-01-11T00:00:00Z', 'E0385V00').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle interdictions error', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { message: 'Product not found' } })));

      service.getInterdictions('W123417070471', '2025-01-11T00:00:00Z', 'INVALID').subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Product not found');
          done();
        },
      });
    });
  });

  describe('releaseInterdictions', () => {
    it('should release interdictions via POST', (done) => {
      const request: ReleaseSystemInterdictionsRequestDto = {
        unitId: 'W123417070471',
        collDate: '2025-01-11T00:00:00Z',
        productCode: 'E0385V00',
        interCodes: ['CMTI'],
      };

      const response: ApiResponse<{ deletedCount: number }> = {
        success: true,
        message: 'Released successfully',
        statusCode: 200,
        item: { deletedCount: 1 },
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.releaseInterdictions(request).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.item!.deletedCount).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.RELEASE}`,
            request,
          );
          done();
        },
      });
    });

    it('should handle release error', (done) => {
      const request: ReleaseSystemInterdictionsRequestDto = {
        unitId: 'W123417070471',
        collDate: '2025-01-11T00:00:00Z',
        productCode: 'E0385V00',
        interCodes: [],
      };

      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { message: 'No interdictions selected' } })));

      service.releaseInterdictions(request).subscribe({
        error: (error) => {
          expect(error.error.message).toBe('No interdictions selected');
          done();
        },
      });
    });
  });

  describe('Null Safety', () => {

    it('should return empty array when getValidProducts response has no item', (done) => {
      const response: ApiResponse<ValidProductDto[]> = {
        success: true,
        message: 'OK',
        statusCode: 200,
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.getValidProducts('TEST', '2025-01-11T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when getInterdictions response has no item', (done) => {
      const response: ApiResponse<ComponentSystemInterdictionDto[]> = {
        success: true,
        message: 'OK',
        statusCode: 200,
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('TEST', '2025-01-11T00:00:00Z', 'E0385V00').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });
});
