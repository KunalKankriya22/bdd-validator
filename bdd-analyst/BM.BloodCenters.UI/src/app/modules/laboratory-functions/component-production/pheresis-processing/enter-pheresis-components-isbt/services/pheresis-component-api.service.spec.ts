import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PheresisComponentApiService } from './pheresis-component-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductTypeItem,
  AttributeItem,
  CatalogNumberItem,
  ProductCodeOption,
  ProductDeterminationResult,
  ComponentCreateRequest,
  ComponentCreateResponseData,
  ReprintLabelRequest,
  ReprintLabelResponseData,
  UnitValidationResult,
  ApiResponse,
} from '../models/pheresis-component.model';

describe('PheresisComponentApiService', () => {
  let service: PheresisComponentApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProductTypes: ProductTypeItem[] = [
    { productTypeCode: 'PLT', productTypeDesc: 'Platelets', weightRequired: 'N', attribFlag: 'N' },
    { productTypeCode: 'PLAS', productTypeDesc: 'Plasma', weightRequired: 'Y', attribFlag: 'Y' },
  ];

  const mockAttributes: AttributeItem[] = [
    { attribCode: 'LEUK', attribDesc: 'Leukoreduced' },
    { attribCode: 'IRAD', attribDesc: 'Irradiated' },
  ];

  const mockCatalogNumbers: CatalogNumberItem[] = [
    { catalogNumber: 'AHAAP30003' },
    { catalogNumber: 'AHAAP30004' },
  ];

  const mockProductCodes: ProductCodeOption[] = [
    { productCode: 'E0701V00', productDesc: 'Platelets Pheresis', productShortName: 'PLT PH', specificGravity: 1.03 },
    { productCode: 'E0702V00', productDesc: 'Platelets Pheresis LR', productShortName: 'PLT PH LR', specificGravity: 1.03 },
  ];

  const mockUnitValidation: UnitValidationResult = {
    unitId: 'W1234567890',
    collDate: '2024-06-01',
    buc: 1,
    bagCount: 3,
    addOnBags: 0,
    presentComponents: 1,
    totalComponents: 3,
    canAddComponent: true,
  };

  const mockDetermination: ProductDeterminationResult = {
    productCode: 'E0701V00',
    productDesc: 'Platelets Pheresis',
    productShortName: 'PLT PH',
    specificGravity: 1.03,
    isMultiple: false,
    labelPrintRequired: true,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PheresisComponentApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(PheresisComponentApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProductTypes', () => {
    it('should return product types from the API', (done) => {
      const mockResponse: ApiResponse<ProductTypeItem> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockProductTypes,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockProductTypes);
          expect(result.length).toBe(2);
          expect(result[0].productTypeCode).toBe('PLT');
          expect(result[1].productTypeCode).toBe('PLAS');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PHERESIS_COMPONENTS.PRODUCT_TYPES);
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getProductTypes().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getAttributes', () => {
    it('should return attributes for the given product type', (done) => {
      const mockResponse: ApiResponse<AttributeItem> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockAttributes,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributes('PLT').subscribe({
        next: (result) => {
          expect(result).toEqual(mockAttributes);
          expect(result.length).toBe(2);
          expect(result[0].attribCode).toBe('LEUK');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PHERESIS_COMPONENTS.ATTRIBUTES('PLT'));
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getAttributes('PLT').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('validateUnit', () => {
    it('should validate a unit ID', (done) => {
      const mockResponse: ApiResponse<UnitValidationResult> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockUnitValidation],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit('W1234567890', 'PLT').subscribe({
        next: (result) => {
          expect(result.collDate).toBe('2024-06-01');
          expect(result.buc).toBe(1);
          expect(result.canAddComponent).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.VALIDATE_UNIT,
            { unitId: 'W1234567890', productType: 'PLT' }
          );
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.validateUnit('W1234567890', 'PLT').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getCatalogNumbers', () => {
    it('should return catalog numbers for the given unit and product type', (done) => {
      const mockResponse: ApiResponse<CatalogNumberItem> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockCatalogNumbers,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCatalogNumbers('W1234567890', 'PLT').subscribe({
        next: (result) => {
          expect(result).toEqual(mockCatalogNumbers);
          expect(result.length).toBe(2);
          expect(result[0].catalogNumber).toBe('AHAAP30003');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.CATALOG_NUMBERS('PLT', 'W1234567890')
          );
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getCatalogNumbers('W1234567890', 'PLT').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getProductCodes', () => {
    it('should return product codes for the given unit and product type', (done) => {
      const mockResponse: ApiResponse<ProductCodeOption> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockProductCodes,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductCodes('W1234567890', 'PLT').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProductCodes);
          expect(result.length).toBe(2);
          expect(result[0].productCode).toBe('E0701V00');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.PRODUCT_CODES('W1234567890', 'PLT')
          );
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getProductCodes('W1234567890', 'PLT').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('determineProductCode', () => {
    it('should determine product code with required parameters', (done) => {
      const mockResponse: ApiResponse<ProductDeterminationResult> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockDetermination],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.determineProductCode('W1234567890', '2024-06-01', 'PLT', 'AHAAP30003').subscribe({
        next: (result) => {
          expect(result.productCode).toBe('E0701V00');
          expect(result.isMultiple).toBe(false);
          expect(result.labelPrintRequired).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.DETERMINE_PRODUCT,
            {
              unitId: 'W1234567890',
              collDate: '2024-06-01',
              productType: 'PLT',
              catalogNumber: 'AHAAP30003',
              attribCode: undefined,
            }
          );
          done();
        },
      });
    });

    it('should determine product code with optional attribCode', (done) => {
      const mockResponse: ApiResponse<ProductDeterminationResult> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockDetermination],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.determineProductCode('W1234567890', '2024-06-01', 'PLT', 'AHAAP30003', 'LEUK').subscribe({
        next: (result) => {
          expect(result.productCode).toBe('E0701V00');
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.DETERMINE_PRODUCT,
            {
              unitId: 'W1234567890',
              collDate: '2024-06-01',
              productType: 'PLT',
              catalogNumber: 'AHAAP30003',
              attribCode: 'LEUK',
            }
          );
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.determineProductCode('W1234567890', '2024-06-01', 'PLT', 'AHAAP30003').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('createComponent', () => {
    const mockRequest: ComponentCreateRequest = {
      unitId: 'W1234567890',
      collectionDate: '2024-06-01',
      productTypeCode: 'PLT',
      productCode: 'E0701V00',
      catalogNumber: 'AHAAP30003',
    };

    it('should create a component', (done) => {
      const mockResponse: ApiResponse<ComponentCreateResponseData> = {
        success: true,
        statusCode: 201,
        message: 'Component successfully added',
        data: [{ UnitId: 'W1234567890', ProductCode: 'E0701V00', CatalogNumber: 'AHAAP30003' }],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createComponent(mockRequest).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data[0].UnitId).toBe('W1234567890');
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.CREATE,
            mockRequest
          );
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createComponent(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('reprintLabel', () => {
    const mockRequest: ReprintLabelRequest = {
      unitId: 'W1234567890',
      productCode: 'E0701V00',
      productType: 'PLT',
      collDate: '2024-06-01',
    };

    it('should reprint a label', (done) => {
      const mockResponse: ApiResponse<ReprintLabelResponseData> = {
        success: true,
        statusCode: 200,
        message: 'Label reprinted',
        data: [{
          unitId: 'W1234567890',
          productCode: 'E0701V00',
          productType: 'PLT',
          collDate: '2024-06-01',
          expiryDate: '2024-06-06',
          preprintedLabel: false,
        }],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.reprintLabel(mockRequest).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data[0].unitId).toBe('W1234567890');
          expect(response.data[0].productCode).toBe('E0701V00');
          expect(response.data[0].preprintedLabel).toBe(false);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.PHERESIS_COMPONENTS.REPRINT_LABEL,
            mockRequest
          );
          done();
        },
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.reprintLabel(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });
});
