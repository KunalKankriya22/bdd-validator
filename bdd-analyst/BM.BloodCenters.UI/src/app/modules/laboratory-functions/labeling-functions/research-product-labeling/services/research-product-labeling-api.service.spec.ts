import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResearchProductLabelingApiService } from './research-product-labeling-api.service';
import {
  ValidateUnitResponse,
  ValidateProductRequest,
  ValidateProductResponse,
  ResearchTypeDto,
  ResearchProductDto,
  LabeledProductDto,
  ValidateResearchProductRequest,
  CatalogNumberDto,
  ValidateCatalogRequest,
  BiohazardCheckRequest,
  BiohazardCheckResponse,
  CalculateExpiryRequest,
  CalculateExpiryResponse,
  LabelPreviewRequest,
  LabelPreviewResponse,
  GenerateLabelRequest,
  CompleteRelabelingRequest,
  CompleteRelabelingResponse,
  ChapterConfigDto,
} from '../models/research-product-labeling.model';

describe('ResearchProductLabelingApiService', () => {
  let service: ResearchProductLabelingApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/research-product-labeling';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResearchProductLabelingApiService],
    });
    service = TestBed.inject(ResearchProductLabelingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnit', () => {
    const unitId = 'W633321061401';
    const mockUnit: ValidateUnitResponse = {
      unitId: unitId,
      catalogNumber: 'CAT001',
      collectionDate: '2021-06-14T00:00:00',
      chapterId: 'DAL',
      isValid: true,
      errorMessage: null,
      collDate: '2021-06-14T00:00:00',
      hasComponents: true,
      componentCount: 2,
    };

    it('should validate a unit with GET request', () => {
      service.validateUnit(unitId).subscribe((res) => {
        expect(res.success).toBeTrue();
        expect(res.data).toEqual(mockUnit);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${baseUrl}/validate-unit/${unitId}`) &&
          !request.params.has('warehouseId'),
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockUnit });
    });

    it('should include warehouseId param when provided', () => {
      service.validateUnit(unitId, 'WH01').subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${baseUrl}/validate-unit/${unitId}`) &&
          request.params.get('warehouseId') === 'WH01',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockUnit });
    });
  });

  describe('validateProduct', () => {
    it('should validate a product with POST request', () => {
      const request: ValidateProductRequest = {
        unitId: 'W633321061401',
        productCode: 'E0385V00',
        collectionDate: '2021-06-14T00:00:00',
        chapterId: 'DAL',
      };
      const mockResponse: ValidateProductResponse = {
        productCode: 'E0385V00',
        catalogNumber: 'CAT001',
        componentStatus: 'Available',
        isValid: true,
        isLabeled: false,
        errorMessage: null,
      };

      service.validateProduct(request).subscribe((res) => {
        expect(res.success).toBeTrue();
        expect(res.data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/validate-product`),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });

  describe('getResearchTypes', () => {
    it('should fetch research types with GET request', () => {
      const mockTypes: ResearchTypeDto[] = [
        { code: 'R', description: 'Research' },
        { code: 'Q', description: 'QC' },
      ];

      service.getResearchTypes().subscribe((res) => {
        expect(res.success).toBeTrue();
        expect(res.data.length).toBe(2);
        expect(res.data[0].code).toBe('R');
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/research-types`),
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockTypes });
    });
  });
  describe('validateResearchProduct', () => {
    it('should validate research product with POST request', () => {
      const request: ValidateResearchProductRequest = {
        unitId: 'W633321061401',
        productCode: 'E0385V00',
        researchProductCode: 'E0388',
        collectionDate: '2021-06-14T00:00:00',
        chapterId: 'DAL',
      };
      const mockResponse: ResearchProductDto = {
        productCode: 'E0388',
        productDesc: 'RBC Research',
        productType: 'RBC',
        unitSchemeType: 'I',
      };

      service.validateResearchProduct(request).subscribe((res) => {
        expect(res.data.productCode).toBe('E0388');
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/validate-research-product`),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });
  describe('validateCatalog', () => {
    it('should validate catalog with POST request', () => {
      const request: ValidateCatalogRequest = {
        unitId: 'W633321061401',
        productCode: 'E0385V00',
        catalogNumber: 'BAG001',
        productType: 'RBC',
        chapterId: 'DAL',
      };

      service.validateCatalog(request).subscribe((res) => {
        expect(res.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/validate-catalog`),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, data: null });
    });
  });

  describe('checkBiohazard', () => {
    it('should check biohazard with POST request', () => {
      const request: BiohazardCheckRequest = {
        unitId: 'W633321061401',
        collectionDate: '2021-06-14T00:00:00',
        productCode: 'E0385V00',
        chapterId: 'DAL',
      };
      const mockResponse: BiohazardCheckResponse = {
        hasBiohazard: false,
        interdictionCode: null,
        interdictionType: null,
      };

      service.checkBiohazard(request).subscribe((res) => {
        expect(res.data.hasBiohazard).toBeFalse();
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/check-biohazard`),
      );
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });

    it('should return biohazard data when interdiction found', () => {
      const request: BiohazardCheckRequest = {
        unitId: 'W633321061401',
        collectionDate: '2021-06-14T00:00:00',
      };
      const mockResponse: BiohazardCheckResponse = {
        hasBiohazard: true,
        interdictionCode: 'BH01',
        interdictionType: 'Biohazard',
      };

      service.checkBiohazard(request).subscribe((res) => {
        expect(res.data.hasBiohazard).toBeTrue();
        expect(res.data.interdictionCode).toBe('BH01');
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/check-biohazard`),
      );
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });

  describe('calculateExpiry', () => {
    it('should calculate expiry with POST request', () => {
      const request: CalculateExpiryRequest = {
        unitId: 'W633321061401',
        collectionDate: '2021-06-14T00:00:00',
        productCode: 'E0385V00',
        productType: 'RBC',
        chapterId: 'DAL',
      };
      const mockResponse: CalculateExpiryResponse = {
        expirationDate: '2021-07-26T23:59:00',
        lifeSpan: 42,
        lifeSpanIndicator: 'D',
        source: 'VALID_PRODUCTS',
      };

      service.calculateExpiry(request).subscribe((res) => {
        expect(res.data.expirationDate).toBe('2021-07-26T23:59:00');
        expect(res.data.lifeSpan).toBe(42);
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/calculate-expiry`),
      );
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });

  describe('getLabelPreview', () => {
    it('should get label preview with POST request', () => {
      const request: LabelPreviewRequest = {
        unitId: 'W633321061401',
        productCode: 'E0385V00',
        researchTypeCode: 'R',
        researchProductCode: 'E0388',
        collectionDate: '2021-06-14T00:00:00',
        chapterId: 'DAL',
      };
      const mockResponse: LabelPreviewResponse = {
        line1: 'Mr',
        line2: 'FOR LABORATORY',
        line3: null,
        line4: 'RESEARCH USE ONLY',
        testMessage: '',
        isTestMessageTooLong: false,
      };

      service.getLabelPreview(request).subscribe((res) => {
        expect(res.data.line1).toBe('Mr');
        expect(res.data.line4).toBe('RESEARCH USE ONLY');
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/label-preview`),
      );
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });

  describe('generateLabel', () => {
    it('should generate label with POST request', () => {
      const request: GenerateLabelRequest = {
        unitId: 'W633321061401',
        productCode: 'E0385V00',
        researchTypeCode: 'R',
        researchProductCode: 'E0388',
        collectionDate: '2021-06-14T00:00:00',
        catalogNumber: 'BAG001',
      };

      service.generateLabel(request).subscribe((res) => {
        expect(res.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/label`),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, data: null });
    });
  });

  describe('completeRelabeling', () => {
    it('should complete relabeling with POST request', () => {
      const request: CompleteRelabelingRequest = {
        unitId: 'W633321061401',
        collectionDate: '2021-06-14T00:00:00',
        productCode: 'E0385V00',
        researchProductCode: 'E0388',
        researchTypeCode: 'R',
        catalogNumber: 'BAG001',
        expirationDate: '2021-07-26T23:59:00',
        chapterId: 'DAL',
      };
      const mockResponse: CompleteRelabelingResponse = {
        success: true,
        message: 'Relabeling completed',
        unitId: 'W633321061401',
        researchProductCode: 'E0388',
      };

      service.completeRelabeling(request).subscribe((res) => {
        expect(res.data.success).toBeTrue();
        expect(res.data.researchProductCode).toBe('E0388');
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/complete-relabeling`),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });

    it('should handle failed relabeling response', () => {
      const request: CompleteRelabelingRequest = {
        unitId: 'W633321061401',
        collectionDate: '2021-06-14T00:00:00',
        researchProductCode: 'E0388',
        researchTypeCode: 'R',
        expirationDate: '2021-07-26T23:59:00',
      };
      const mockResponse: CompleteRelabelingResponse = {
        success: false,
        message: 'UpdateUser parameter missing',
        unitId: null,
        researchProductCode: null,
      };

      service.completeRelabeling(request).subscribe((res) => {
        expect(res.data.success).toBeFalse();
        expect(res.data.message).toContain('UpdateUser');
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/complete-relabeling`),
      );
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });
});
