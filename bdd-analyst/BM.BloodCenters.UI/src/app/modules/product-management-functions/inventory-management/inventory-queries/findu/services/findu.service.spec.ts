import { of, throwError } from 'rxjs';

import { FinduService } from './findu.service';
import { ApiService } from '@shared/services/api.service';
import {
  UnitProductDto,
  UnitProductQueryDto,
  ProductTypeLookupDto,
  AttributeGroupLookupDto,
  AttributeLookupDto,
  BloodTypeLookupDto,
  ApiResponse
} from '../models/findu.models';
import { API } from '@core/constants/api.constants';

describe('FinduService', () => {
  let service: FinduService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUnitData: UnitProductDto[] = [
    {
      unitId: '1234567890123',
      collectionDate: '2024-06-15T10:30:00Z',
      productCode: 'E0701V00',
      aboRh: 'O Positive',
      expirationDate: '2024-07-20T10:30:00Z',
      status: 'Available',
      componentPrefix: 'E0',
      checkDigit: '45'
    }
  ];

  const mockProductTypes: ProductTypeLookupDto[] = [
    { productType: 'RBC' },
    { productType: 'PLT' }
  ];

  const mockAttributes: AttributeLookupDto[] = [
    { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' },
    { attributeGroup: 'SPEC', attributeCode: 'IRR', description: 'Irradiated' }
  ];

  const mockBloodTypes: BloodTypeLookupDto[] = [
    { aboCode: 'O', description: 'O Positive' },
    { aboCode: 'A', description: 'A Positive' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

        service = new FinduService(apiServiceSpy as any);
  });

  describe('searchUnits', () => {
    it('should search units with query DTO and return data with total', (done) => {
      const queryDto: UnitProductQueryDto = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 25,
        skip: 0
      };

      const mockResponse: ApiResponse<UnitProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Successfully retrieved 1 units',
        data: mockUnitData,
        totalCount: 791
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchUnits(queryDto).subscribe(result => {
        expect(result.data).toEqual(mockUnitData);
        expect(result.total).toBe(791);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.FIND_UNITS_PRODUCTS.SEARCH,
          queryDto
        );
        done();
      });
    });

    it('should return empty array and 0 total when response data is null', (done) => {
      const queryDto: UnitProductQueryDto = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };

      const mockResponse: ApiResponse<UnitProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any,
        totalCount: undefined
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchUnits(queryDto).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const queryDto: UnitProductQueryDto = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };

      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));

      service.searchUnits(queryDto).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  describe('getProductTypes', () => {
    it('should retrieve product types', (done) => {
      const mockResponse: ApiResponse<ProductTypeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Product types retrieved successfully',
        data: mockProductTypes
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductTypes().subscribe(result => {
        expect(result).toEqual(mockProductTypes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.FIND_UNITS_PRODUCTS.PRODUCT_TYPES
        );
        done();
      });
    });

    it('should handle empty product types', (done) => {
      const mockResponse: ApiResponse<ProductTypeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No product types found',
        data: []
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when product types data is null', (done) => {
      const mockResponse: ApiResponse<ProductTypeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getAttributeGroups', () => {
    it('should retrieve attribute groups', (done) => {
      const mockAttributeGroups: AttributeGroupLookupDto[] = [
        { attributeGroup: 'SPEC' },
        { attributeGroup: 'TEST' }
      ];

      const mockResponse: ApiResponse<AttributeGroupLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attribute groups retrieved successfully',
        data: mockAttributeGroups
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeGroups().subscribe(result => {
        expect(result).toEqual(mockAttributeGroups);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.FIND_UNITS_PRODUCTS.ATTRIBUTE_GROUPS
        );
        done();
      });
    });

    it('should return empty array when attribute groups data is null', (done) => {
      const mockResponse: ApiResponse<AttributeGroupLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeGroups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getAttributes', () => {
    it('should retrieve attributes filtered by group', (done) => {
      const mockResponse: ApiResponse<AttributeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attributes retrieved successfully',
        data: mockAttributes
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributes('SPEC').subscribe(result => {
        expect(result).toEqual(mockAttributes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.FIND_UNITS_PRODUCTS.ATTRIBUTES}?attributeGroup=SPEC`
        );
        done();
      });
    });

    it('should return empty array when attributes data is null', (done) => {
      const mockResponse: ApiResponse<AttributeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributes('SPEC').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should URL-encode the attribute group parameter', (done) => {
      const mockResponse: ApiResponse<AttributeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: []
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributes('SP EC').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.FIND_UNITS_PRODUCTS.ATTRIBUTES}?attributeGroup=SP%20EC`
        );
        done();
      });
    });

    it('should handle special characters in attribute group', (done) => {
      const mockResponse: ApiResponse<AttributeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: []
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributes('A&B').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.FIND_UNITS_PRODUCTS.ATTRIBUTES}?attributeGroup=A%26B`
        );
        done();
      });
    });
  });

  describe('getBloodTypes', () => {
    it('should retrieve blood types', (done) => {
      const mockResponse: ApiResponse<BloodTypeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Blood types retrieved successfully',
        data: mockBloodTypes
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBloodTypes().subscribe(result => {
        expect(result).toEqual(mockBloodTypes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.FIND_UNITS_PRODUCTS.BLOOD_TYPES
        );
        done();
      });
    });

    it('should return empty array when blood types data is null', (done) => {
      const mockResponse: ApiResponse<BloodTypeLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBloodTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
