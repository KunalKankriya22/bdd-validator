import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReleaseSpecialProcessingService } from './release-special-processing.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../../../../core/constants/api.constants';
import {
  ProcessCodeDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ProductDto,
  AliquotDto,
  GetProductsRequestDto,
  GetAliquotsRequestDto,
  ReleaseComponentRequestDto,
  ReleaseComponentResponseDto,
  ApiResponse,
} from '../models/release-special-processing.models';

describe('ReleaseSpecialProcessingService', () => {
  let service: ReleaseSpecialProcessingService;
  let httpMock: HttpTestingController;

  const buildUrl = (endpoint: string): string => {
    const base = API.RELEASE_SPECIAL_PROCESSING.BASE;
    const fullPath = `${base}${endpoint}`.replace(/^\/+/, '');
    return `${environment.apiUrl}/${fullPath}`;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ReleaseSpecialProcessingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProcessCodes', () => {
    it('should fetch process codes', () => {
      const mockResponse: ApiResponse<ProcessCodeDto[]> = {
        success: true,
        message: 'Process codes retrieved successfully',
        statusCode: 200,
        data: [
          { processCode: 'FROZ', processCodeDesc: 'Freezing' },
          { processCode: 'CRYP', processCodeDesc: 'Cryoprecipitate Processing' },
        ],
      };

      service.getProcessCodes().subscribe((codes) => {
        expect(codes.length).toBe(2);
        expect(codes[0].processCode).toBe('FROZ');
        expect(codes[1].processCodeDesc).toBe('Cryoprecipitate Processing');
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.PROCESS_CODES));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching process codes', () => {
      service.getProcessCodes().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.PROCESS_CODES));
      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('validateUnit', () => {
    it('should validate unit successfully', () => {
      const request: ValidateUnitRequestDto = {
        unitId: 'W6333 19 030301-X',
        processCode: 'FROZ',
      };

      const mockResponse: ApiResponse<ValidateUnitResponseDto> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        data: {
          unitId: 'W6333 19 030301-X',
          collDate: '2024-05-10T00:00:00Z',
          isValid: true,
        },
      };

      service.validateUnit(request).subscribe((response) => {
        expect(response.unitId).toBe('W6333 19 030301-X');
        expect(response.isValid).toBe(true);
        expect(response.collDate).toBe('2024-05-10T00:00:00Z');
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.VALIDATE_UNIT));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle unit not found error', () => {
      const request: ValidateUnitRequestDto = {
        unitId: 'INVALID',
        processCode: 'FROZ',
      };

      service.validateUnit(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.VALIDATE_UNIT));
      req.flush('Unit not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getProducts', () => {
    it('should fetch products successfully', () => {
      const request: GetProductsRequestDto = {
        unitId: 'W6333 19 030301-X',
        collDate: '2024-05-10T00:00:00Z',
        chapterId: '0001',
        processCode: 'FROZ',
      };

      const mockResponse: ApiResponse<ProductDto[]> = {
        success: true,
        message: 'Products retrieved successfully',
        statusCode: 200,
        data: [
          { productCode: 'E0701V00', productDesc: 'Red Blood Cells | AS7/450mL/refg' },
          { productCode: 'E0701V01', productDesc: 'White Blood Cells | AS8/450mL/refg' },
        ],
      };

      service.getProducts(request).subscribe((products) => {
        expect(products.length).toBe(2);
        expect(products[0].productCode).toBe('E0701V00');
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.PRODUCTS));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

  });

  describe('getAliquots', () => {
    it('should fetch aliquots successfully', () => {
      const request: GetAliquotsRequestDto = {
        unitId: 'W6333 19 030301-X',
        collDate: '2024-05-10T00:00:00Z',
        chapterId: '0001',
        processCode: 'FROZ',
        productCode: 'E0701V00',
      };

      const mockResponse: ApiResponse<AliquotDto[]> = {
        success: true,
        message: 'Aliquots retrieved successfully',
        statusCode: 200,
        data: [
          { componentPrefix: '00' },
          { componentPrefix: '01' },
        ],
      };

      service.getAliquots(request).subscribe((aliquots) => {
        expect(aliquots.length).toBe(2);
        expect(aliquots[0].componentPrefix).toBe('00');
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.ALIQUOTS));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('releaseComponent', () => {
    it('should release component successfully', () => {
      const request: ReleaseComponentRequestDto = {
        unitId: 'W6333 19 030301-X',
        collDate: '2024-05-10T00:00:00Z',
        chapterId: '0001',
        processCode: 'FROZ',
        productCode: 'E0701V00',
        componentPrefix: '00',
      };

      const mockResponse: ApiResponse<ReleaseComponentResponseDto> = {
        success: true,
        message: 'Component released successfully',
        statusCode: 200,
        data: {
          success: true,
          message: 'Component released from special processing successfully',
          warningMessage: null,
        },
      };

      service.releaseComponent(request).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.warningMessage).toBeNull();
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.RELEASE));
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return warning message for THAW process', () => {
      const request: ReleaseComponentRequestDto = {
        unitId: 'W6333 19 030301-X',
        collDate: '2024-05-10T00:00:00Z',
        chapterId: '0001',
        processCode: 'THAW',
        productCode: 'E0701V00',
        componentPrefix: '00',
      };

      const mockResponse: ApiResponse<ReleaseComponentResponseDto> = {
        success: true,
        message: 'Component released successfully',
        statusCode: 200,
        data: {
          success: true,
          message: 'Component released from special processing successfully',
          warningMessage: 'Please make SURE that tests scheduled from thawing are cancelled.',
        },
      };

      service.releaseComponent(request).subscribe((response) => {
        expect(response.warningMessage).toContain('thawing are cancelled');
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.RELEASE));
      req.flush(mockResponse);
    });

    it('should handle release error', () => {
      const request: ReleaseComponentRequestDto = {
        unitId: 'W6333 19 030301-X',
        collDate: '2024-05-10T00:00:00Z',
        chapterId: '0001',
        processCode: 'FROZ',
        productCode: 'E0701V00',
        componentPrefix: '99',
      };

      service.releaseComponent(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(buildUrl(API.RELEASE_SPECIAL_PROCESSING.RELEASE));
      req.flush('No valid components for release', { status: 400, statusText: 'Bad Request' });
    });
  });
});
