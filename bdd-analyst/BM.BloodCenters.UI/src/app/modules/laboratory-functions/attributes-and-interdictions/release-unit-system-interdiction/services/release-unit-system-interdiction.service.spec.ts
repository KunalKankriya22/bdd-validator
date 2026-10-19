import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ReleaseUnitSystemInterdictionService } from './release-unit-system-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidateUnitResponseDto,
  UnitSystemInterdictionDto,
  ReleaseUnitSystemInterdictionsRequestDto,
  ApiResponse,
} from '../models/release-unit-system-interdiction.models';

describe('ReleaseUnitSystemInterdictionService', () => {
  let service: ReleaseUnitSystemInterdictionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const base = API.RELEASE_UNIT_SYSTEM_INTERDICTION.BASE;

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: '001234567890123',
    collDate: '2024-01-15T00:00:00Z',
    isValid: true,
    parsedUnitId: '001234567890123',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: '00123-45-678901-2',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  const mockInterdictions: UnitSystemInterdictionDto[] = [
    {
      unitId: '001234567890123',
      collDate: '2024-01-15T00:00:00Z',
      interCode: '0010',
      interDesc: 'Reactive Donor Screening',
      interType: 'N',
      interTypeDesc: 'NFT',
      chapterId: '0001',
      insertDate: '2024-01-15T00:00:00Z',
      insertUser: 'SYSTEM',
    },
    {
      unitId: '001234567890123',
      collDate: '2024-01-15T00:00:00Z',
      interCode: '0020',
      interDesc: 'Equipment Malfunction',
      interType: 'M',
      interTypeDesc: 'Misc',
      chapterId: '0001',
      insertDate: '2024-01-15T10:00:00Z',
      insertUser: 'TESTUSER',
    },
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReleaseUnitSystemInterdictionService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ReleaseUnitSystemInterdictionService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // -- validateUnit --------------------------------------------------------

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
            `${base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.VALIDATE_UNIT}`,
            jasmine.objectContaining({ unitId: '001234567890123' }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

    it('should return empty object when response item is null', (done) => {
      const response: ApiResponse<ValidateUnitResponseDto> = {
        success: true,
        message: 'No data',
        statusCode: 200,
        item: undefined,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.validateUnit('001234567890123').subscribe({
        next: (result) => {
          expect(result).toEqual({} as ValidateUnitResponseDto);
          done();
        },
      });
    });

  });

  // -- getInterdictions ----------------------------------------------------

  describe('getInterdictions', () => {
    it('should retrieve interdictions via POST', (done) => {
      const response: ApiResponse<UnitSystemInterdictionDto[]> = {
        success: true,
        message: 'Interdictions retrieved successfully',
        statusCode: 200,
        item: mockInterdictions,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictions);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.INTERDICTIONS}`,
            jasmine.objectContaining({ unitId: '001234567890123', collDate: '2024-01-15T00:00:00Z' }),
            jasmine.any(Object),
          );
          done();
        },
      });
    });

    it('should return empty array when no interdictions found', (done) => {
      const response: ApiResponse<UnitSystemInterdictionDto[]> = {
        success: true,
        message: 'No interdictions found',
        statusCode: 200,
        item: [],
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when response item is null', (done) => {
      const response: ApiResponse<UnitSystemInterdictionDto[]> = {
        success: true,
        message: 'No data',
        statusCode: 200,
        item: undefined,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getInterdictions('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle interdictions error', (done) => {
      const errorResponse = {
        error: { message: 'Failed to load interdictions' },
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getInterdictions('001234567890123', '2024-01-15T00:00:00Z').subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Failed to load interdictions');
          done();
        },
      });
    });
  });

  // -- releaseInterdictions ------------------------------------------------

  describe('releaseInterdictions', () => {
    it('should release interdictions via POST', (done) => {
      const request: ReleaseUnitSystemInterdictionsRequestDto = {
        unitId: '001234567890123',
        collDate: '2024-01-15T00:00:00Z',
        interCodes: ['0010'],
      };

      const response: ApiResponse<boolean> = {
        success: true,
        message: '1 interdiction(s) released successfully',
        statusCode: 200,
        item: true,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.releaseInterdictions(request).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.item).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.RELEASE}`,
            request,
          );
          done();
        },
      });
    });

    it('should release multiple interdictions', (done) => {
      const request: ReleaseUnitSystemInterdictionsRequestDto = {
        unitId: '001234567890123',
        collDate: '2024-01-15T00:00:00Z',
        interCodes: ['0010', '0020'],
      };

      const response: ApiResponse<boolean> = {
        success: true,
        message: '2 interdiction(s) released successfully',
        statusCode: 200,
        item: true,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.releaseInterdictions(request).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          done();
        },
      });
    });

    it('should handle release error', (done) => {
      const request: ReleaseUnitSystemInterdictionsRequestDto = {
        unitId: '001234567890123',
        collDate: '2024-01-15T00:00:00Z',
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
  });
});
