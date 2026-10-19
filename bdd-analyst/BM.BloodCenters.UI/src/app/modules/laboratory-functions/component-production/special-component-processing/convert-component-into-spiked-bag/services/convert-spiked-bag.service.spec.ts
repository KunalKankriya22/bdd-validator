import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConvertSpikedBagService } from './convert-spiked-bag.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ProcessCode,
  ProductType,
  AttributeGroup,
  AttributeCode,
  CatalogNumber,
  UnitValidationResponse,
  DeriveProductRequest,
  DeriveProductResponse,
  VerifyProductRequest,
  ConvertComponentRequest,
  ConvertComponentResponse,
  ReprintLabelRequest,
  ProductProcessAttributeResponse,
  ProductProcessAttribute,
  ProductOption,
} from '../models/convert-spiked-bag.model';
import { ApiResponse } from '@features/dcattr/dcattr.models';

describe('ConvertSpikedBagService', () => {
  let service: ConvertSpikedBagService;
  let httpMock: HttpTestingController;

  const mockProcessCodes: ProcessCode[] = [
    { processCode: 'REG', processCodeDesc: 'Regular Processing' },
    { processCode: 'IRRAD', processCodeDesc: 'Irradiation' },
    { processCode: 'SPIKE', processCodeDesc: 'Spiking Process' },
  ];

  const mockProductTypes: ProductType[] = [
    { productType: 'RBC', description: 'Red Blood Cells' },
    { productType: 'PLT', description: 'Platelets' },
    { productType: 'FFP', description: 'Fresh Frozen Plasma' },
  ];

  const mockAttributeGroups: AttributeGroup[] = [
    { attribGroup: 'AG1', description: 'Attribute Group 1' },
    { attribGroup: 'AG2', description: 'Attribute Group 2' },
  ];

  const mockAttributeCodes: AttributeCode[] = [
    { attribCode: 'AC1', description: 'Attribute Code 1' },
    { attribCode: 'AC2', description: 'Attribute Code 2' },
  ];

  const mockCatalogNumbers: CatalogNumber[] = [
    { catalogNumber: 'CAT001', lotNumber: 'LOT001' },
    { catalogNumber: 'CAT002', lotNumber: 'LOT002' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConvertSpikedBagService],
    });

    service = TestBed.inject(ConvertSpikedBagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProcessCodes', () => {
    it('should fetch process codes successfully with nested data structure', (done) => {
      const mockResponse = {
        success: true,
        data: {
          data: mockProcessCodes,
        },
        message: 'Success',
      };

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockProcessCodes);
          expect(result.length).toBe(3);
          expect(result[0].processCode).toBe('REG');
          expect(result[0].processCodeDesc).toBe('Regular Processing');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PROCESS_CODES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle single-level data structure', (done) => {
      const mockResponse = {
        success: true,
        data: mockProcessCodes,
        message: 'Success',
      };

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockProcessCodes);
          expect(result.length).toBe(3);
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PROCESS_CODES}`);
      req.flush(mockResponse);
    });


  });

  describe('getProductTypes', () => {
    it('should fetch product types successfully', (done) => {
      const mockResponse: ApiResponse<ProductType[]> = {
        success: true,
        data: mockProductTypes,
        message: 'Success',
        statusCode: 200,
      };

      service.getProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockProductTypes);
          expect(result.length).toBe(3);
          expect(result[0].productType).toBe('RBC');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PRODUCT_TYPES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('validateUnit', () => {
    it('should validate unit successfully', (done) => {
      const unitId = 'U123456789012';
      const mockValidationResponse: UnitValidationResponse = {
        success: true,
        message: 'Unit validated successfully',
        collectionDate: '2026-05-10',
        productCode: 'RBC001',
        productDesc: 'Red Blood Cells',
        attributeGroup: 'AG1',
        attributeCode: 'AC1',
        suitabilityCheckDate: '2026-05-15',
      };

      const mockResponse: ApiResponse<UnitValidationResponse> = {
        success: true,
        data: mockValidationResponse,
        message: 'Success',
        statusCode: 200,
      };

      service.validateUnit(unitId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidationResponse);
          expect(result.success).toBeTrue();
          expect(result.collectionDate).toBe('2026-05-10');
          expect(result.productCode).toBe('RBC001');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALIDATE_UNIT(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should encode special characters in unitId', (done) => {
      const unitId = 'U123/456';
      const mockResponse: ApiResponse<UnitValidationResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          collectionDate: '2026-05-10',
          productCode: 'RBC001',
          productDesc: 'Red Blood Cells',
        },
        message: 'Success',
        statusCode: 200,
      };

      service.validateUnit(unitId).subscribe({
        next: () => {
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('convert-spiked-bags/validate/')
      );
      expect(req.request.url).toContain(encodeURIComponent(unitId));
      req.flush(mockResponse);
    });
  });

  describe('getProducts', () => {
    it('should fetch products with correct query parameters', (done) => {
      const unitId = 'U123456789012';
      const collDate = '2026-05-10';
      const processCode = 'REG';

      const mockProducts = [
        {
          productCode: 'RBC001',
          productDesc: 'Red Blood Cells',
          componentPrefix: 'CP001',
          productType: 'RBC',
        },
        {
          productCode: 'PLT001',
          productDesc: 'Platelets',
          componentPrefix: 'CP002',
          productType: 'PLT',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockProducts,
        message: 'Success',
      };

      service.getProducts(unitId, collDate, processCode).subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          expect(result.length).toBe(2);
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PRODUCTS}` &&
          request.params.get('unitId') === unitId &&
          request.params.get('collDate') === collDate &&
          request.params.get('processCode') === processCode
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getAttributes', () => {
    it('should fetch attributes with groups and codes', (done) => {
      const functionName = 'CONVERT';
      const productType = 'RBC';

      const mockAttributesResponse = {
        groups: mockAttributeGroups,
        codes: mockAttributeCodes,
      };

      const mockResponse: ApiResponse<{ groups: AttributeGroup[]; codes: AttributeCode[] }> = {
        success: true,
        data: mockAttributesResponse,
        message: 'Success',
        statusCode: 200,
      };

      service.getAttributes(functionName, productType).subscribe({
        next: (result) => {
          expect(result.groups).toEqual(mockAttributeGroups);
          expect(result.codes).toEqual(mockAttributeCodes);
          expect(result.groups.length).toBe(2);
          expect(result.codes.length).toBe(2);
          done();
        },
        error: () => fail('should not fail'),
      });

      const expectedUrl = `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTES(functionName, productType)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty groups and codes when data is null', (done) => {
      const mockResponse: ApiResponse<{ groups: AttributeGroup[]; codes: AttributeCode[] }> = {
        success: true,
        data: null as any,
        message: 'No attributes found',
        statusCode: 200,
      };

      service.getAttributes('CONVERT', 'RBC').subscribe({
        next: (result) => {
          expect(result).toEqual({ groups: [], codes: [] });
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('attributes/CONVERT/RBC')
      );
      req.flush(mockResponse);
    });

    it('should encode special characters in function name and product type', (done) => {
      const functionName = 'CONVERT TEST';
      const productType = 'RBC/TYPE';

      const mockResponse: ApiResponse<{ groups: AttributeGroup[]; codes: AttributeCode[] }> = {
        success: true,
        data: { groups: [], codes: [] },
        message: 'Success',
        statusCode: 200,
      };

      service.getAttributes(functionName, productType).subscribe({
        next: () => {
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => request.url.includes('attributes/'));
      expect(req.request.url).toContain(encodeURIComponent(functionName));
      expect(req.request.url).toContain(encodeURIComponent(productType));
      req.flush(mockResponse);
    });
  });

  describe('getValidCatalogs', () => {
    it('should fetch valid catalog numbers with nested data structure', (done) => {
      const productType = 'RBC';
      const unitId = 'U123456789012';

      const mockResponse = {
        success: true,
        data: {
          data: mockCatalogNumbers,
        },
        message: 'Success',
      };

      service.getValidCatalogs(productType, unitId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCatalogNumbers);
          expect(result.length).toBe(2);
          expect(result[0].catalogNumber).toBe('CAT001');
          expect(result[0].lotNumber).toBe('LOT001');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALID_CATALOGS}` &&
          request.params.get('productType') === productType &&
          request.params.get('unitId') === unitId
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle single-level data structure', (done) => {
      const mockResponse = {
        success: true,
        data: mockCatalogNumbers,
        message: 'Success',
      };

      service.getValidCatalogs('RBC', 'U123').subscribe({
        next: (result) => {
          expect(result).toEqual(mockCatalogNumbers);
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.CONVERT_SPIKED_BAG.VALID_CATALOGS)
      );
      req.flush(mockResponse);
    });


  });

  describe('deriveProduct', () => {
    it('should derive product successfully with single match', (done) => {
      const request: DeriveProductRequest = {
        oldProductCode: 'RBCAS001',
        processCode: 'SPIKE',
        productType: 'RBC',
        attributeType: 'SPIKE',
      };

      const mockResponse: DeriveProductResponse = {
        success: true,
        newProductCode: 'RBCAS002',
        newProductDesc: 'Red Blood Cells - Spiked',
        productFormula: 'RBC+SPIKE',
        hasMultipleMatches: false,
      };

      service.deriveProduct(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(result.success).toBeTrue();
          expect(result.newProductCode).toBe('RBCAS002');
          expect(result.hasMultipleMatches).toBeFalse();
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.DERIVE_PRODUCT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle multiple product matches', (done) => {
      const request: DeriveProductRequest = {
        oldProductCode: 'RBCAS001',
        processCode: 'SPIKE',
        productType: 'RBC',
        attributeType: 'SPIKE',
      };

      const mockProductOptions: ProductOption[] = [
        {
          productCode: 'RBCAS',
          productDesc: 'Red Blood Cells Option 1',
          productFormula: 'RBC+SPIKE+A',
          completeProductCode: 'RBCAS002',
          modifierCode: 'A',
        },
        {
          productCode: 'RBCAS',
          productDesc: 'Red Blood Cells Option 2',
          productFormula: 'RBC+SPIKE+B',
          completeProductCode: 'RBCAS003',
          modifierCode: 'B',
        },
      ];

      const mockResponse: DeriveProductResponse = {
        success: true,
        hasMultipleMatches: true,
        isMultiple: true,
        multipleProducts: mockProductOptions,
        productOptions: mockProductOptions,
      };

      service.deriveProduct(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.hasMultipleMatches).toBeTrue();
          expect(result.multipleProducts?.length).toBe(2);
          expect(result.productOptions?.length).toBe(2);
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.DERIVE_PRODUCT}`);
      req.flush(mockResponse);
    });

    it('should handle derive product error', (done) => {
      const request: DeriveProductRequest = {
        oldProductCode: 'INVALID',
        processCode: 'SPIKE',
        productType: 'RBC',
        attributeType: 'SPIKE',
      };

      const mockResponse: DeriveProductResponse = {
        success: false,
        hasMultipleMatches: false,
        errorMessage: 'Invalid product code',
      };

      service.deriveProduct(request).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.errorMessage).toBe('Invalid product code');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.DERIVE_PRODUCT}`);
      req.flush(mockResponse);
    });

  });

  describe('verifyProduct', () => {
    it('should verify product successfully', (done) => {
      const request: VerifyProductRequest = {
        unitId: 'U123456789012',
        newProductCode: 'RBCAS002',
        chapterId: 'CH001',
      };

      const mockResponse = {
        success: true,
        message: 'Product verified successfully',
      };

      service.verifyProduct(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Product verified successfully');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VERIFY_PRODUCT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle verification failure', (done) => {
      const request: VerifyProductRequest = {
        unitId: 'U123456789012',
        newProductCode: 'INVALID',
      };

      const mockResponse = {
        success: false,
        message: 'Product verification failed',
      };

      service.verifyProduct(request).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.message).toBe('Product verification failed');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VERIFY_PRODUCT}`);
      req.flush(mockResponse);
    });

  });

  describe('convertComponent', () => {
    it('should convert component successfully', (done) => {
      const request: ConvertComponentRequest = {
        unitId: 'U123456789012',
        oldProductCode: 'RBCAS001',
        newProductCode: 'RBCAS002',
        processCode: 'SPIKE',
        processDate: '2026-05-10T10:30:00Z',
        attributeGroup: 'AG1',
        attributeCode: 'AC1',
        catalogNumber: 'CAT001',
        verifyProductCode: 'RBCAS002',
        chapterId: 'CH001',
        userId: 'USER001',
      };

      const mockResponse: ConvertComponentResponse = {
        success: true,
        message: 'Component converted successfully',
        statusCode: 200,
        data: [
          {
            unitId: 'U123456789012',
            productCode: 'RBCAS001',
            catalogNumber: 'CAT001',
            processDateTime: '2026-05-10T10:30:00Z',
            attributeGroup: 'AG1',
            attributeType: 'AC1',
            newProduct: 'RBCAS002',
          },
        ],
      };

      service.convertComponent(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Component converted successfully');
          expect(result.statusCode).toBe(200);
          expect(result.data?.length).toBe(1);
          expect(result.data![0].unitId).toBe('U123456789012');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.CONVERT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle conversion failure', (done) => {
      const request: ConvertComponentRequest = {
        unitId: 'U123456789012',
        oldProductCode: 'RBCAS001',
        newProductCode: 'RBCAS002',
        processCode: 'SPIKE',
        processDate: '2026-05-10T10:30:00Z',
        attributeGroup: 'AG1',
        attributeCode: 'AC1',
        catalogNumber: 'CAT001',
      };

      const mockResponse: ConvertComponentResponse = {
        success: false,
        message: 'Conversion failed: Invalid catalog number',
        statusCode: 400,
      };

      service.convertComponent(request).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.message).toContain('Conversion failed');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.CONVERT}`);
      req.flush(mockResponse);
    });

  });

  describe('reprintLabel', () => {
    it('should reprint label successfully', (done) => {
      const request: ReprintLabelRequest = {
        unitId: 'U123456789012',
        productCode: 'RBCAS002',
        chapterId: 'CH001',
      };

      const mockResponse = {
        success: true,
        message: 'Label reprinted successfully',
      };

      service.reprintLabel(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Label reprinted successfully');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.REPRINT_LABEL}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle reprint failure', (done) => {
      const request: ReprintLabelRequest = {
        unitId: 'U123456789012',
        productCode: 'RBCAS002',
      };

      const mockResponse = {
        success: false,
        message: 'Printer not available',
      };

      service.reprintLabel(request).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.message).toBe('Printer not available');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.REPRINT_LABEL}`);
      req.flush(mockResponse);
    });

  });

  describe('getAttributesForProcess', () => {
    it('should fetch attributes for process successfully', (done) => {
      const oldProductCode = 'RBCAS001';
      const processCode = 'IRRAD';
      const unitId = 'U123456789012';
      const unitSchemeType = 'I';

      const mockAttribute: ProductProcessAttribute = {
        attributeGroup: 'AG1',
        attributeGroupDesc: 'Attribute Group 1',
        attributeCode: 'AC1',
        attributeCodeDesc: 'Attribute Code 1',
        attributeType: 'C',
        suitabilityCheckDate: '2026-05-15',
        oldProductCode: 'RBCAS001',
        processCode: 'IRRAD',
      };

      const mockResponse: ProductProcessAttributeResponse = {
        success: true,
        statusCode: 200,
        message: 'Attributes retrieved successfully',
        item: mockAttribute,
      };

      service.getAttributesForProcess(oldProductCode, processCode, unitId, unitSchemeType).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.item).toEqual(mockAttribute);
          expect(result.item?.attributeGroup).toBe('AG1');
          expect(result.item?.attributeCode).toBe('AC1');
          expect(result.item?.attributeType).toBe('C');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTES_FOR_PROCESS}` &&
          request.params.get('oldProductCode') === oldProductCode &&
          request.params.get('processCode') === processCode &&
          request.params.get('unitId') === unitId &&
          request.params.get('unitSchemeType') === unitSchemeType
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default unitSchemeType when not provided', (done) => {
      const mockResponse: ProductProcessAttributeResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        item: null,
      };

      service.getAttributesForProcess('RBCAS001', 'REG', 'U123').subscribe({
        next: () => {
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return request.params.get('unitSchemeType') === 'I';
      });
      req.flush(mockResponse);
    });

    it('should handle null item in response', (done) => {
      const mockResponse: ProductProcessAttributeResponse = {
        success: true,
        statusCode: 200,
        message: 'No attributes found',
        item: null,
      };

      service.getAttributesForProcess('RBCAS001', 'REG', 'U123').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.item).toBeNull();
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.CONVERT_SPIKED_BAG.ATTRIBUTES_FOR_PROCESS)
      );
      req.flush(mockResponse);
    });

  });

  describe('getAttributeGroupsForProduct', () => {
    it('should fetch attribute groups for a product successfully', (done) => {
      const oldProductCode = 'RBCAS001';
      const mockAttributeGroups = [
        { code: 'LEUK', codeDesc: 'Leukocyte Reduction' },
        { code: 'IRRAD', codeDesc: 'Irradiation' },
      ];

      const mockResponse = {
        success: true,
        data: mockAttributeGroups,
        message: 'Success',
      };

      service.getAttributeGroupsForProduct(oldProductCode).subscribe({
        next: (result) => {
          expect(result).toEqual(mockAttributeGroups);
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('LEUK');
          expect(result[0].codeDesc).toBe('Leukocyte Reduction');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTE_GROUPS}` &&
          request.params.get('oldProductCode') === oldProductCode
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getAttributeTypesForProduct', () => {
    it('should fetch attribute types for a product with all required parameters', (done) => {
      const oldProductCode = 'RBCAS001';
      const attributeGroup = 'LEUK';
      const unitId = 'U123456789012';
      const collectionDate = '2026-05-10';
      const productType = 'RBC';
      const unitSchemeType = 'I';

      const mockAttributeTypes = [
        { attribCode: 'LR', attribDesc: 'Leukocytes Reduced' },
        { attribCode: 'LR2', attribDesc: 'Leukocytes Reduced Type 2' },
      ];

      const mockResponse = {
        success: true,
        data: mockAttributeTypes,
        message: 'Success',
      };

      service.getAttributeTypesForProduct(
        oldProductCode,
        attributeGroup,
        unitId,
        collectionDate,
        productType,
        unitSchemeType
      ).subscribe({
        next: (result) => {
          expect(result).toEqual(mockAttributeTypes);
          expect(result.length).toBe(2);
          expect(result[0].attribCode).toBe('LR');
          expect(result[0].attribDesc).toBe('Leukocytes Reduced');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTE_TYPES}` &&
          request.params.get('oldProductCode') === oldProductCode &&
          request.params.get('attributeGroup') === attributeGroup &&
          request.params.get('unitId') === unitId &&
          request.params.get('collectionDate') === collectionDate &&
          request.params.get('productType') === productType &&
          request.params.get('unitSchemeType') === unitSchemeType
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default unitSchemeType when not provided', (done) => {
      const mockResponse = {
        success: true,
        data: [],
        message: 'Success',
      };

      service.getAttributeTypesForProduct(
        'RBCAS001',
        'LEUK',
        'U123',
        '2026-05-10',
        'RBC'
      ).subscribe({
        next: () => {
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return request.params.get('unitSchemeType') === 'I';
      });
      req.flush(mockResponse);
    });



    it('should encode special characters in parameters', (done) => {
      const oldProductCode = 'RBC/AS001';
      const attributeGroup = 'LEUK GROUP';
      const unitId = 'U123/456';
      const collectionDate = '2026-05-10';
      const productType = 'RBC TYPE';

      const mockResponse = {
        success: true,
        data: [],
        message: 'Success',
      };

      service.getAttributeTypesForProduct(
        oldProductCode,
        attributeGroup,
        unitId,
        collectionDate,
        productType
      ).subscribe({
        next: () => {
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTE_TYPES}` &&
          request.params.get('oldProductCode') === oldProductCode &&
          request.params.get('attributeGroup') === attributeGroup &&
          request.params.get('unitId') === unitId &&
          request.params.get('productType') === productType
        );
      });
      req.flush(mockResponse);
    });
  });

  describe('validateCatalogNumber', () => {
    it('should validate catalog number successfully', (done) => {
      const catalogNumber = 'CAT001';
      const productType = 'RBC';
      const unitId = 'U123456789012';

      const mockResponse = {
        success: true,
        message: 'Catalog number is valid',
      };

      service.validateCatalogNumber(catalogNumber, productType, unitId).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Catalog number is valid');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALIDATE_CATALOG}` &&
          request.params.get('catalogNumber') === catalogNumber &&
          request.params.get('productType') === productType &&
          request.params.get('unitId') === unitId
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle invalid catalog number', (done) => {
      const catalogNumber = 'INVALID';
      const productType = 'RBC';
      const unitId = 'U123456789012';

      const mockResponse = {
        success: false,
        message: 'Catalog number not found or expired',
      };

      service.validateCatalogNumber(catalogNumber, productType, unitId).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.message).toContain('not found');
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.CONVERT_SPIKED_BAG.VALIDATE_CATALOG)
      );
      req.flush(mockResponse);
    });


    it('should encode special characters in parameters', (done) => {
      const catalogNumber = 'CAT/001';
      const productType = 'RBC TYPE';
      const unitId = 'U123/456';

      const mockResponse = {
        success: true,
        message: 'Valid',
      };

      service.validateCatalogNumber(catalogNumber, productType, unitId).subscribe({
        next: () => {
          done();
        },
        error: () => fail('should not fail'),
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALIDATE_CATALOG}` &&
          request.params.get('catalogNumber') === catalogNumber &&
          request.params.get('productType') === productType &&
          request.params.get('unitId') === unitId
        );
      });
      req.flush(mockResponse);
    });
  });
});
