import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RejectUnitComponentService } from './reject-unit-component.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnitValidationResponseDto,
  RejectReasonDto,
  RejectableProductDto,
  ComponentForRejectionDto,
  CatalogNumberDto,
  ValidateProductCodeResponseDto,
  AboLabelDto,
  RejectComponentRequestDto,
  RejectComponentResponseDto,
  ReprintLabelRequestDto,
  ReprintLabelResponseDto,
  ApiResponse
} from '../models/reject-unit-component.model';

describe('RejectUnitComponentService', () => {
  let service: RejectUnitComponentService;
  let httpMock: HttpTestingController;

  const mockUnitValidation: UnitValidationResponseDto = {
    unitId: 'W4555-13-012401',
    collDate: '2026-06-15T00:00:00',
    chapterId: 'WAD',
    warehouseId: 'H',
    catalogNumber: '1TEP540004',
    abo: 'O+',
    isPheresisUnit: false,
    isBioHazard: false,
    codeScheme: 'C',
    rejectableComponentsCount: 3,
    unusedBagsCount: 1,
    rejectableProducts: [
      {
        productCode: 'E0701V00',
        productDescription: 'Red Blood Cells',
        productType: 'RBC',
        componentPrefix: '01',
        bagId: 'BAG001'
      }
    ]
  };

  const mockRejectReasons: RejectReasonDto[] = [
    { code: 'CLOT', description: 'Clotted component', interdictionCode: 'INFD' },
    { code: 'HEMOLYZ', description: 'Hemolyzed', interdictionCode: 'HEMO' }
  ];

  const mockProductCodes: RejectableProductDto[] = [
    { productCode: 'E0701V00', productDescription: 'Red Blood Cells', productType: 'RBC', componentPrefix: '01', bagId: 'BAG001' },
    { productCode: 'NONE', productDescription: 'Empty Bag', productType: '', componentPrefix: '', bagId: '' }
  ];

  const mockComponents: ComponentForRejectionDto[] = [
    {
      unitId: 'W4555-13-012401',
      collDate: '2026-06-15T00:00:00',
      productCode: 'E0701V00',
      productDescription: 'Red Blood Cells',
      componentPrefix: '01',
      rejectReasonCode: null,
      rejectReasonDescription: null,
      isRejected: false,
      catalogNumber: '1TEP540004'
    }
  ];

  const mockCatalogNumbers: CatalogNumberDto[] = [
    { catalogNumber: '1TEP540004' },
    { catalogNumber: '2TEP540005' }
  ];

  const mockValidateProduct: ValidateProductCodeResponseDto = {
    productCode: 'E0701V00',
    productDescription: 'Red Blood Cells',
    productType: 'RBC',
    pheresisFlag: 'N',
    isValid: true,
    errorCode: null,
    errorMessage: null
  };

  const mockAboLabels: AboLabelDto[] = [
    { aboLabel: 'O POS', aboShortName: 'O+' },
    { aboLabel: 'A NEG', aboShortName: 'A-' }
  ];

  const mockReprintLabel: ReprintLabelResponseDto = {
    unitId: 'W4555-13-012401',
    productCode: 'E0701V00',
    productDesc: 'Red Blood Cells',
    productType: 'RBC',
    collDate: '2026-06-15T00:00:00',
    expiryDate: '2026-07-15T00:00:00',
    cmvStatus: 'NEG',
    preprintedLabel: false,
    timeLimitWarning: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RejectUnitComponentService
      ]
    });

    service = TestBed.inject(RejectUnitComponentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── validateUnit ──

  describe('validateUnit', () => {
    it('should validate unit successfully', (done) => {
      const unitId = 'W4555-13-012401';

      service.validateUnit(unitId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnitValidation);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('validate-unit')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Unit validated successfully',
        data: [mockUnitValidation]
      } as ApiResponse<UnitValidationResponseDto>);
    });

    it('should not send chapterId/warehouseId as query params', (done) => {
      const unitId = 'W4555-13-012401';

      service.validateUnit(unitId).subscribe({ next: () => done() });

      const req = httpMock.expectOne((request) =>
        request.url.includes('validate-unit')
      );

      expect(req.request.params.keys().length).toBe(0);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [mockUnitValidation] } as ApiResponse<UnitValidationResponseDto>);
    });

    it('should throw error when no validation data returned', (done) => {
      service.validateUnit('W4555-13-012401').subscribe({
        error: (error) => {
          expect(error.message).toBe('No validation data returned');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('validate-unit'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [] } as ApiResponse<UnitValidationResponseDto>);
    });

    it('should propagate HTTP error', (done) => {
      service.validateUnit('INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('validate-unit'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── getProductCodes ──

  describe('getProductCodes', () => {
    it('should retrieve product codes successfully', (done) => {
      const unitId = 'W4555-13-012401';

      service.getProductCodes(unitId).subscribe({
        next: (products) => {
          expect(products).toEqual(mockProductCodes);
          expect(products.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('product-codes'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockProductCodes } as ApiResponse<RejectableProductDto>);
    });

    it('should return empty array when data is null', (done) => {
      service.getProductCodes('W4555-13-012401').subscribe({
        next: (products) => {
          expect(products).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('product-codes'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: null } as any);
    });

    it('should propagate HTTP error', (done) => {
      service.getProductCodes('INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('product-codes'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── getComponents ──

  describe('getComponents', () => {
    it('should retrieve components for a unit and product code', (done) => {
      service.getComponents('W4555-13-012401', 'E0701V00').subscribe({
        next: (components) => {
          expect(components).toEqual(mockComponents);
          expect(components.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('components'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockComponents } as ApiResponse<ComponentForRejectionDto>);
    });

    it('should return empty array when data is null', (done) => {
      service.getComponents('W4555-13-012401', 'E0701V00').subscribe({
        next: (components) => {
          expect(components).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('components'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: null } as any);
    });

    it('should propagate HTTP error', (done) => {
      service.getComponents('INVALID', 'INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('components'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── getRejectionReasons ──

  describe('getRejectionReasons', () => {
    it('should retrieve rejection reasons successfully', (done) => {
      service.getRejectionReasons().subscribe({
        next: (reasons) => {
          expect(reasons).toEqual(mockRejectReasons);
          expect(reasons.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('rejection-reasons'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockRejectReasons } as ApiResponse<RejectReasonDto>);
    });

    it('should return empty array when no reasons available', (done) => {
      service.getRejectionReasons().subscribe({
        next: (reasons) => {
          expect(reasons).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('rejection-reasons'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [] } as ApiResponse<RejectReasonDto>);
    });

    it('should propagate HTTP error', (done) => {
      service.getRejectionReasons().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('rejection-reasons'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── getCatalogNumbers ──

  describe('getCatalogNumbers', () => {
    it('should retrieve catalog numbers without optional params', (done) => {
      service.getCatalogNumbers('W4555-13-012401').subscribe({
        next: (catalogs) => {
          expect(catalogs).toEqual(mockCatalogNumbers);
          expect(catalogs.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('catalog-numbers'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockCatalogNumbers } as ApiResponse<CatalogNumberDto>);
    });

    it('should send productType query param when provided', (done) => {
      service.getCatalogNumbers('W4555-13-012401', 'RBC').subscribe({
        next: (catalogs) => {
          expect(catalogs).toEqual(mockCatalogNumbers);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('catalog-numbers'));
      expect(req.request.params.get('productType')).toBe('RBC');
      expect(req.request.params.has('productCode')).toBe(false);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockCatalogNumbers } as ApiResponse<CatalogNumberDto>);
    });

    it('should send productCode query param when provided', (done) => {
      service.getCatalogNumbers('W4555-13-012401', undefined, 'E0701V00').subscribe({
        next: (catalogs) => {
          expect(catalogs).toEqual(mockCatalogNumbers);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('catalog-numbers'));
      expect(req.request.params.has('productType')).toBe(false);
      expect(req.request.params.get('productCode')).toBe('E0701V00');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockCatalogNumbers } as ApiResponse<CatalogNumberDto>);
    });

    it('should send both productType and productCode when provided', (done) => {
      service.getCatalogNumbers('W4555-13-012401', 'RBC', 'E0701V00').subscribe({
        next: (catalogs) => {
          expect(catalogs).toEqual(mockCatalogNumbers);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('catalog-numbers'));
      expect(req.request.params.get('productType')).toBe('RBC');
      expect(req.request.params.get('productCode')).toBe('E0701V00');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockCatalogNumbers } as ApiResponse<CatalogNumberDto>);
    });

    it('should return empty array when data is null', (done) => {
      service.getCatalogNumbers('W4555-13-012401').subscribe({
        next: (catalogs) => {
          expect(catalogs).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('catalog-numbers'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: null } as any);
    });

    it('should propagate HTTP error', (done) => {
      service.getCatalogNumbers('INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('catalog-numbers'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── validateProductCode ──

  describe('validateProductCode', () => {
    it('should validate product code successfully', (done) => {
      service.validateProductCode('W4555-13-012401', 'E0701V00').subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidateProduct);
          expect(result.isValid).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('validate-product'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [mockValidateProduct] } as ApiResponse<ValidateProductCodeResponseDto>);
    });

    it('should throw error when no product validation data returned', (done) => {
      service.validateProductCode('W4555-13-012401', 'UNKNOWN').subscribe({
        error: (error) => {
          expect(error.message).toBe('No product validation data returned');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('validate-product'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [] } as ApiResponse<ValidateProductCodeResponseDto>);
    });

    it('should propagate HTTP error', (done) => {
      service.validateProductCode('INVALID', 'INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('validate-product'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── getAboLabels ──

  describe('getAboLabels', () => {
    it('should retrieve ABO labels with codeScheme param', (done) => {
      service.getAboLabels('C').subscribe({
        next: (labels) => {
          expect(labels).toEqual(mockAboLabels);
          expect(labels.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('abo-labels'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('codeScheme')).toBe('C');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockAboLabels } as ApiResponse<AboLabelDto>);
    });

    it('should return empty array when data is null', (done) => {
      service.getAboLabels('X').subscribe({
        next: (labels) => {
          expect(labels).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('abo-labels'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: null } as any);
    });

    it('should propagate HTTP error', (done) => {
      service.getAboLabels('INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('abo-labels'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── rejectComponent ──

  describe('rejectComponent', () => {
    const mockRequest: RejectComponentRequestDto = {
      unitId: 'W4555-13-012401',
      collDate: '2026-06-15T00:00:00',
      chapterId: 'WAD',
      productCode: 'E0701V00',
      componentPrefix: '01',
      rejectReasonCode: 'CLOT',
      catalogNumber: '1TEP540004',
      warehouseId: 'H',
      isNewProduct: false,
      systemLabelDecision: null
    };

    it('should reject component successfully', (done) => {
      service.rejectComponent(mockRequest).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.endsWith('/reject') || request.url.includes('/reject-component/reject')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Component rejected successfully',
        item: true,
        errorResponse: null
      } as any);
    });

    it('should handle rejection HTTP error', (done) => {
      service.rejectComponent({ ...mockRequest, productCode: 'INVALID' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.endsWith('/reject') || request.url.includes('/reject-component/reject')
      );
      req.flush(
        { success: false, statusCode: 400, errorResponse: { errorCode: 'VAL-003', error: 'Invalid product code' } },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should throw errorResponse.error when success is false and errorResponse exists', (done) => {
      service.rejectComponent(mockRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Unit already rejected');
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.endsWith('/reject') || request.url.includes('/reject-component/reject')
      );
      req.flush({
        success: false,
        statusCode: 200,
        message: 'Some message',
        item: false,
        errorResponse: { errorCode: 'REJ-001', error: 'Unit already rejected' }
      } as RejectComponentResponseDto);
    });

    it('should throw message when success is false and no errorResponse.error', (done) => {
      service.rejectComponent(mockRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Component cannot be rejected');
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.endsWith('/reject') || request.url.includes('/reject-component/reject')
      );
      req.flush({
        success: false,
        statusCode: 200,
        message: 'Component cannot be rejected',
        item: false,
        errorResponse: null
      } as any);
    });

    it('should throw default message when success is false with no error details', (done) => {
      service.rejectComponent(mockRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Rejection failed');
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.endsWith('/reject') || request.url.includes('/reject-component/reject')
      );
      req.flush({
        success: false,
        statusCode: 200,
        message: '',
        item: false,
        errorResponse: null
      } as any);
    });
  });

  // ── reprintLabel ──

  describe('reprintLabel', () => {
    const mockReprintRequest: ReprintLabelRequestDto = {
      unitId: 'W4555-13-012401',
      productCode: 'E0701V00',
      productType: 'RBC',
      collDate: '2026-06-15T00:00:00'
    };

    it('should reprint label successfully', (done) => {
      service.reprintLabel(mockReprintRequest).subscribe({
        next: (result) => {
          expect(result).toEqual(mockReprintLabel);
          expect(result.unitId).toBe('W4555-13-012401');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('reprint-label'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockReprintRequest);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [mockReprintLabel] } as ApiResponse<ReprintLabelResponseDto>);
    });

    it('should throw error when no label data returned', (done) => {
      service.reprintLabel(mockReprintRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('No label data returned');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('reprint-label'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [] } as ApiResponse<ReprintLabelResponseDto>);
    });

    it('should propagate HTTP error', (done) => {
      service.reprintLabel(mockReprintRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('reprint-label'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
