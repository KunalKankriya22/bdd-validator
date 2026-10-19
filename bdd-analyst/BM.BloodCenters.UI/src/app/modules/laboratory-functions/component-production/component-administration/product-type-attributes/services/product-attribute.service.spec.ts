import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProductAttributeService } from './product-attribute.service';
import {
  ProductAttribute,
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  ProductAttributeParamsDto,
  ApiResponse,
  ProductTypeDropdown,
  AttributeGroupDropdown,
  AttributeCodeDropdown
} from '../models/product-attribute.model';
import { API } from 'src/app/core/constants/api.constants';

describe('ProductAttributeService', () => {
  let service: ProductAttributeService;
  let httpMock: HttpTestingController;

  const mockProductAttribute: ProductAttribute = {
    productType: 'RBC',
    attribGroup: 'ISBT',
    attribCode: 'E0001',
    attribCodeDesc: 'ABO Group',
    labelFlag: 'Y',
    lifeSpanInd: 'D',
    lifeSpan: '42',
    effDate: new Date('2024-01-01'),
    termDate: null,
    lastModifiedDate: new Date('2024-01-15'),
    auditKey: 12345,
    programId: 'VPRDATTR'
  };

  const mockApiResponse: ApiResponse<ProductAttribute[]> = {
    success: true,
    data: [mockProductAttribute],
    total: 1,
    statusCode: 200,
    message: 'Data retrieved successfully'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductAttributeService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductAttributeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProductAttributes', () => {
    it('should fetch product attributes with pagination and filters', () => {
      const take = 25;
      const skip = 0;
      const params: ProductAttributeParamsDto = {
        productType: 'RBC',
        sortColumn: 'ProductType',
        sortOrder: 'ASC'
      };

      service.getProductAttributes(take, skip, params).subscribe(response => {
        expect(response).toEqual(mockApiResponse);
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.LIST(take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockApiResponse);
    });

    it('should handle errors when fetching product attributes', () => {
      const take = 25;
      const skip = 0;
      const params: ProductAttributeParamsDto = {};

      service.getProductAttributes(take, skip, params).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.LIST(take, skip));
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getProductAttributeById', () => {
    it('should fetch a single product attribute by composite key', () => {
      const productType = 'RBC';
      const attribGroup = 'ISBT';
      const attribCode = 'E0001';

      const mockResponse: ApiResponse<ProductAttribute> = {
        success: true,
        data: mockProductAttribute,
        statusCode: 200,
        message: 'Record retrieved successfully'
      };

      service.getProductAttributeById(productType, attribGroup, attribCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.productType).toBe(productType);
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.GET_BY_ID(productType, attribGroup, attribCode)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 when product attribute not found', () => {
      const productType = 'INVALID';
      const attribGroup = 'INVALID';
      const attribCode = 'INVALID';

      service.getProductAttributeById(productType, attribGroup, attribCode).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.GET_BY_ID(productType, attribGroup, attribCode)
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createProductAttribute', () => {
    it('should create a new product attribute', () => {
      const createDto: CreateProductAttributeDto = {
        productType: 'RBC',
        attribGroup: 'ISBT',
        attribCode: 'E0001',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        lifeSpan: '42',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      };

      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: null,
        statusCode: 201,
        message: 'Record created successfully'
      };

      service.createProductAttribute(createDto).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

    it('should handle validation errors when creating', () => {
      const createDto: CreateProductAttributeDto = {
        productType: 'INVALID',
        attribGroup: 'INVALID',
        attribCode: 'INVALID',
        labelFlag: 'Y',
        lifeSpanInd: 'D',
        lifeSpan: '42',
        effDate: '2024-01-01',
        termDate: null,
        newProductType: null
      };

      service.createProductAttribute(createDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.CREATE);
      req.flush('Validation Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateProductAttribute', () => {
    it('should update an existing product attribute', () => {
      const productType = 'RBC';
      const attribGroup = 'ISBT';
      const attribCode = 'E0001';
      const updateDto: UpdateProductAttributeDto = {
        labelFlag: 'N',
        lifeSpan: '35'
      };

      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: null,
        statusCode: 200,
        message: 'Record updated successfully'
      };

      service.updateProductAttribute(productType, attribGroup, attribCode, updateDto).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.UPDATE(productType, attribGroup, attribCode)
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });

    it('should handle errors when updating a product attribute', () => {
      const productType = 'RBC';
      const attribGroup = 'ISBT';
      const attribCode = 'E0001';
      const updateDto: UpdateProductAttributeDto = {
        labelFlag: 'N',
        lifeSpan: '35'
      };

      service.updateProductAttribute(productType, attribGroup, attribCode, updateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.UPDATE(productType, attribGroup, attribCode)
      );
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('deleteProductAttribute', () => {
    it('should delete a product attribute', () => {
      const productType = 'RBC';
      const attribGroup = 'ISBT';
      const attribCode = 'E0001';

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        data: true,
        statusCode: 200,
        message: 'Record deleted successfully'
      };

      service.deleteProductAttribute(productType, attribGroup, attribCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data).toBeTrue();
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.DELETE(productType, attribGroup, attribCode)
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle errors when deleting a product attribute', () => {
      const productType = 'RBC';
      const attribGroup = 'ISBT';
      const attribCode = 'E0001';

      service.deleteProductAttribute(productType, attribGroup, attribCode).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.DELETE(productType, attribGroup, attribCode)
      );
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('Dropdown/LOV Endpoints', () => {
    it('should fetch product types dropdown', () => {
      const mockDropdown: ProductTypeDropdown[] = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' }
      ];

      service.getProductTypesDropdown().subscribe(response => {
        expect(response).toEqual(mockDropdown);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.PRODUCT_TYPES_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockDropdown);
    });

    it('should fetch attribute groups dropdown', () => {
      const mockDropdown: AttributeGroupDropdown[] = [
        { code: 'ISBT', codeDesc: 'ISBT Attributes' },
        { code: 'CDBR', codeDesc: 'Codabar Attributes' }
      ];

      service.getAttributeGroupsDropdown().subscribe(response => {
        expect(response).toEqual(mockDropdown);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.ATTRIBUTE_GROUPS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockDropdown);
    });

    it('should fetch attribute codes dropdown for a specific group', () => {
      const attribGroup = 'ISBT';
      const mockDropdown: AttributeCodeDropdown[] = [
        { attribCode: 'E0001', attribDesc: 'ABO Group' },
        { attribCode: 'E0002', attribDesc: 'Rh Type' }
      ];

      service.getAttributeCodesDropdown(attribGroup).subscribe(response => {
        expect(response).toEqual(mockDropdown);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.ATTRIBUTE_CODES_DROPDOWN(attribGroup));
      expect(req.request.method).toBe('GET');
      req.flush(mockDropdown);
    });

    it('should fetch new product types dropdown excluding current', () => {
      const currentProductType = 'RBC';
      const mockDropdown: ProductTypeDropdown[] = [
        { productType: 'PLT', productTypeDesc: 'Platelets' },
        { productType: 'FFP', productTypeDesc: 'Fresh Frozen Plasma' }
      ];

      service.getNewProductTypesDropdown(currentProductType).subscribe(response => {
        expect(response).toEqual(mockDropdown);
        expect(response.length).toBe(2);
        expect(response.some(d => d.productType === 'RBC')).toBeFalse();
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.NEW_PRODUCT_TYPES_DROPDOWN(currentProductType)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockDropdown);
    });

    it('should handle errors when fetching product types dropdown', () => {
      service.getProductTypesDropdown().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.PRODUCT_TYPES_DROPDOWN);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle errors when fetching attribute groups dropdown', () => {
      service.getAttributeGroupsDropdown().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.ATTRIBUTE_GROUPS_DROPDOWN);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle errors when fetching attribute codes dropdown', () => {
      const attribGroup = 'ISBT';

      service.getAttributeCodesDropdown(attribGroup).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.ATTRIBUTE_CODES_DROPDOWN(attribGroup));
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle errors when fetching new product types dropdown', () => {
      const currentProductType = 'RBC';

      service.getNewProductTypesDropdown(currentProductType).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        API.PRODUCT_ATTRIBUTES.NEW_PRODUCT_TYPES_DROPDOWN(currentProductType)
      );
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('Filter Endpoints', () => {
    it('should fetch product types for filtering', () => {
      const mockFilter: ProductTypeDropdown[] = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' }
      ];

      service.getProductTypesFilter().subscribe(response => {
        expect(response).toEqual(mockFilter);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.FILTER_PRODUCT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockFilter);
    });

    it('should fetch attribute groups for filtering', () => {
      const mockFilter: AttributeGroupDropdown[] = [
        { code: 'ISBT', codeDesc: 'ISBT Attributes' }
      ];

      service.getAttributeGroupsFilter().subscribe(response => {
        expect(response).toEqual(mockFilter);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.FILTER_ATTRIBUTE_GROUPS);
      expect(req.request.method).toBe('GET');
      req.flush(mockFilter);
    });

    it('should fetch attribute codes for filtering', () => {
      const mockFilter: AttributeCodeDropdown[] = [
        { attribCode: 'E0001', attribDesc: 'ABO Group' }
      ];

      service.getAttributeCodesFilter().subscribe(response => {
        expect(response).toEqual(mockFilter);
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.FILTER_ATTRIBUTE_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockFilter);
    });

    it('should handle errors when fetching product types filter', () => {
      service.getProductTypesFilter().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.FILTER_PRODUCT_TYPES);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle errors when fetching attribute groups filter', () => {
      service.getAttributeGroupsFilter().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.FILTER_ATTRIBUTE_GROUPS);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle errors when fetching attribute codes filter', () => {
      service.getAttributeCodesFilter().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PRODUCT_ATTRIBUTES.FILTER_ATTRIBUTE_CODES);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
