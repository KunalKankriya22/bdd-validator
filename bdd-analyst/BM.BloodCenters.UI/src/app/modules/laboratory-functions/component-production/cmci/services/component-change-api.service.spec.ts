import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentChangeApiService } from './component-change-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnitValidationResultDto,
  ValidAttributeDto,
  ProductTypeDto,
  ChangeAttributeRequestDto,
  ChangeAttributeResponseDto,
  ChangeProductCodeRequestDto,
  ChangeProductCodeResponseDto,
  ReprintLabelRequestDto,
  ReprintLabelResponseDto,
  ProductCodeOption,
  CatalogNumberOption,
  DeriveProductCodeRequestDto,
  DeriveProductCodeResponseDto,
  ApiResponse,
} from '../models/component-change.model';

describe('ComponentChangeApiService', () => {
  let service: ComponentChangeApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUnitValidation: UnitValidationResultDto = {
    isValid: true,
    isModifiable: true,
    unitId: 'W1234567890123456',
    productType: 'RBC',
    productCode: 'E1234',
    productShortName: 'RBC AS5',
    currentWarehouse: 'WH01',
    chapterId: 'CH001',
    collectionDate: '2026-01-01T00:00:00Z',
    componentInsertDate: '2026-01-02T00:00:00Z',
    bagId: null,
    hasInterdiction: false,
    interdictionReason: null,
    labelPrintRequired: false,
    errorCode: null,
    errorMessage: null,
  };

  const mockValidAttributes: ValidAttributeDto[] = [
    {
      attributeCode: 'CMV',
      attributeDescription: 'CMV Negative',
      attributeType: 'M',
      attributeGroup: 'SEROLOGY',
      productType: 'RBC',
      unitSchemeType: 'I',
      catalogNumberEnabled: false,
      exclusivityFlag: null,
    },
    {
      attributeCode: 'IRRAD',
      attributeDescription: 'Irradiated',
      attributeType: 'C',
      attributeGroup: 'PROCESS',
      productType: 'RBC',
      unitSchemeType: 'I',
      catalogNumberEnabled: true,
      exclusivityFlag: null,
    },
  ];

  const mockProductTypes: ProductTypeDto[] = [
    {
      productType: 'RBC',
      description: 'Red Blood Cells',
      effDate: '2020-01-01T00:00:00Z',
      termDate: null,
      isActive: true,
    },
    {
      productType: 'PLT',
      description: 'Platelets',
      effDate: '2020-01-01T00:00:00Z',
      termDate: null,
      isActive: true,
    },
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [ComponentChangeApiService, { provide: ApiService, useValue: apiServiceSpy }],
    });

    service = TestBed.inject(ComponentChangeApiService);
  });

  describe('validateUnit', () => {
    it('should validate unit and return result', (done) => {
      const unitId = 'W1234567890123456';
      const response: ApiResponse<UnitValidationResultDto> = {
        success: true,
        item: mockUnitValidation,
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.validateUnit(unitId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnitValidation);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.COMPONENT_CHANGES.VALIDATE_UNIT(unitId));
          done();
        },
      });
    });

    it('should handle error when validating unit', (done) => {
      const error = { error: 'Unit not found' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.validateUnit('INVALID_UNIT').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getValidAttributes', () => {
    it('should retrieve valid attributes for function and product type', (done) => {
      const functionName = 'CPICHNGE';
      const productType = 'RBC';
      const response: ApiResponse<ValidAttributeDto[]> = {
        success: true,
        data: mockValidAttributes,
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getValidAttributes(functionName, productType).subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidAttributes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.COMPONENT_CHANGES.ATTRIBUTES(functionName, productType),
          );
          done();
        },
      });
    });

    it('should return empty array when no attributes found', (done) => {
      const response: ApiResponse<ValidAttributeDto[]> = {
        success: true,
        data: [],
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getValidAttributes('CPICHNGE', 'PLT').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle error when fetching attributes', (done) => {
      const error = { error: 'Server error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getValidAttributes('CPICHNGE', 'RBC').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getValidProductTypes', () => {
    it('should retrieve valid product types', (done) => {
      const response: ApiResponse<ProductTypeDto[]> = {
        success: true,
        data: mockProductTypes,
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getValidProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockProductTypes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.COMPONENT_CHANGES.PRODUCT_TYPES);
          done();
        },
      });
    });

    it('should return empty array when no product types found', (done) => {
      const response: ApiResponse<ProductTypeDto[]> = {
        success: true,
        data: [],
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getValidProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle error when fetching product types', (done) => {
      const error = { error: 'Server error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getValidProductTypes().subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('changeAttribute', () => {
    it('should change component attribute successfully', (done) => {
      const request: ChangeAttributeRequestDto = {
        unitId: 'W1234567890123456',
        attributeCode: 'CMV',
        productType: 'RBC',
        attributeGroup: 'SEROLOGY',
        changeReason: 'Adding CMV negative attribute',
      };

      const mockResponse: ChangeAttributeResponseDto = {
        success: true,
        unitId: 'W1234567890123456',
        message: 'Attribute changed successfully',
        auditId: null,
        errorCode: null,
      };

      const response: ApiResponse<ChangeAttributeResponseDto> = {
        success: true,
        item: mockResponse,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.changeAttribute(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.COMPONENT_CHANGES.CHANGE_ATTRIBUTE, request);
          done();
        },
      });
    });

    it('should handle error when changing attribute', (done) => {
      const request: ChangeAttributeRequestDto = {
        unitId: 'W1234567890123456',
        attributeCode: 'INVALID',
        productType: 'RBC',
      };

      const error = { error: 'Attribute not configured' };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.changeAttribute(request).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('changeProductCode', () => {
    it('should change product code successfully', (done) => {
      const request: ChangeProductCodeRequestDto = {
        unitId: 'W1234567890123456',
        oldProductCode: 'E1234',
        newProductCode: 'E5678',
        productType: 'RBC',
        changeReason: 'Correcting product code',
      };

      const mockResponse: ChangeProductCodeResponseDto = {
        success: true,
        unitId: 'W1234567890123456',
        message: 'Product code changed successfully',
        auditId: null,
        errorCode: null,
      };

      const response: ApiResponse<ChangeProductCodeResponseDto> = {
        success: true,
        item: mockResponse,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.changeProductCode(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.COMPONENT_CHANGES.CHANGE_PRODUCT_CODE, request);
          done();
        },
      });
    });

    it('should handle error when changing product code', (done) => {
      const request: ChangeProductCodeRequestDto = {
        unitId: 'W1234567890123456',
        oldProductCode: 'E1234',
        newProductCode: 'INVALID',
        productType: 'RBC',
      };

      const error = { error: 'Invalid product code' };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.changeProductCode(request).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('reprintLabel', () => {
    it('should reprint label successfully', (done) => {
      const request: ReprintLabelRequestDto = {
        unitId: 'W1234567890123456',
        productCode: 'E1234',
        productType: 'RBC',
        oldProductCode: 'E0001',
      };

      const mockResponse: ReprintLabelResponseDto = {
        success: true,
        unitId: 'W1234567890123456',
        message: 'Label reprinted successfully',
        errorCode: null,
      };

      const response: ApiResponse<ReprintLabelResponseDto> = {
        success: true,
        item: mockResponse,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.reprintLabel(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.COMPONENT_CHANGES.REPRINT_LABEL, request);
          done();
        },
      });
    });

    it('should handle error when reprinting label', (done) => {
      const request: ReprintLabelRequestDto = {
        unitId: 'W1234567890123456',
        productCode: 'E1234',
        productType: 'RBC',
        oldProductCode: 'E0001',
      };

      const error = { error: 'Reprint failed' };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.reprintLabel(request).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getProductCodes', () => {
    it('should retrieve product codes for unit and product type', (done) => {
      const unitId = 'W1234567890123456';
      const productType = 'RBC';
      const mockProductCodes: ProductCodeOption[] = [
        { code: 'E1234', description: 'RBC AS5' },
        { code: 'E5678', description: 'RBC AS7' },
      ];
      const response: ApiResponse<ProductCodeOption[]> = {
        success: true,
        data: mockProductCodes,
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getProductCodes(unitId, productType).subscribe({
        next: (result) => {
          expect(result).toEqual(mockProductCodes);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.COMPONENT_CHANGES.PRODUCT_CODES(unitId, productType),
          );
          done();
        },
      });
    });

    it('should return empty array when no product codes found', (done) => {
      const response: ApiResponse<ProductCodeOption[]> = {
        success: true,
        data: [],
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getProductCodes('W1234567890123456', 'PLT').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle error when fetching product codes', (done) => {
      const error = { error: 'Server error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getProductCodes('W1234567890123456', 'RBC').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getCatalogNumbers', () => {
    it('should retrieve catalog numbers for unit and product type', (done) => {
      const unitId = 'W1234567890123456';
      const productType = 'RBC';
      const mockCatalogNumbers: CatalogNumberOption[] = [
        { catalogNumber: 'CAT001', description: 'Catalog Item 1' },
        { catalogNumber: 'CAT002', description: 'Catalog Item 2' },
      ];
      const response: ApiResponse<CatalogNumberOption[]> = {
        success: true,
        data: mockCatalogNumbers,
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getCatalogNumbers(unitId, productType).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCatalogNumbers);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.COMPONENT_CHANGES.CATALOG_NUMBERS(unitId, productType),
          );
          done();
        },
      });
    });

    it('should return empty array when no catalog numbers found', (done) => {
      const response: ApiResponse<CatalogNumberOption[]> = {
        success: true,
        data: [],
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getCatalogNumbers('W1234567890123456', 'PLT').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should handle error when fetching catalog numbers', (done) => {
      const error = { error: 'Server error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getCatalogNumbers('W1234567890123456', 'RBC').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('deriveProductCode', () => {
    it('should derive product code successfully', (done) => {
      const request: DeriveProductCodeRequestDto = {
        unitId: 'W1234567890123456',
        oldProductCode: 'E0385V00',
        attributeCode: 'CMV',
        productType: 'RBC',
      };

      const mockResponse: DeriveProductCodeResponseDto = {
        success: true,
        newProductCode: 'E0397V00',
        message: null,
      };

      const response: ApiResponse<DeriveProductCodeResponseDto> = {
        success: true,
        item: mockResponse,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.deriveProductCode(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.COMPONENT_CHANGES.DERIVE_PRODUCT_CODE, request);
          done();
        },
      });
    });

    it('should handle error when deriving product code', (done) => {
      const request: DeriveProductCodeRequestDto = {
        unitId: 'W1234567890123456',
        oldProductCode: 'E0385V00',
        attributeCode: 'INVALID',
        productType: 'RBC',
      };

      const error = { error: 'Failed to derive product code' };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.deriveProductCode(request).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });
});
