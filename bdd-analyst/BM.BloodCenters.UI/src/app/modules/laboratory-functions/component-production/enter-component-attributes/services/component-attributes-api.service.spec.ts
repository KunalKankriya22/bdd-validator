import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../../../environments/environment';

import { ComponentAttributesApiService } from './component-attributes-api.service';
import {
  AddComponentAttributeRequestDto,
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
  ApiResponse,
} from '../models/component-attributes.model';

describe('ComponentAttributesApiService', () => {
  let service: ComponentAttributesApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/component-attributes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComponentAttributesApiService],
    });

    service = TestBed.inject(ComponentAttributesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('addComponentAttribute', () => {
    it('should add a component attribute via POST', () => {
      const request: AddComponentAttributeRequestDto = {
        unitId: 'A123456789',
        collDate: '2024-05-15T00:00:00Z',
        productCode: 'E1234',
        attribGroup: 'ATTR',
        attribCode: 'CMV',
        procDate: '2024-05-20T14:30:00Z',
      };

      const mockResponse: ApiResponse<ComponentAttributeDto> = {
        success: true,
        statusCode: 200,
        message: 'Component attribute added successfully',
        item: {
          unitId: 'A123456789',
          collDate: '2024-05-15T00:00:00Z',
          chapterId: 'CHAP',
          productCode: 'E1234',
          attribGroup: 'ATTR',
          attribCode: 'CMV',
          attribDesc: 'CMV Negative',
          procDate: '2024-05-20T14:30:00Z',
          insertDate: '2024-05-20T15:00:00Z',
          insertUser: 'USER01',
          programId: 'CPIATTR',
          interCode: 'CMVI',
        },
      };

      service.addComponentAttribute(request).subscribe((result) => {
        expect(result).toEqual(mockResponse.item!);
        expect(result.attribCode).toBe('CMV');
        expect(result.interCode).toBe('CMVI');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

  });

  describe('getAttributesForComponent', () => {
    it('should retrieve attributes for a component via GET', () => {
      const unitId = 'A123456789';
      const collDate = '2024-05-15T00:00:00';
      const productCode = 'E1234';

      const mockResponse: ApiResponse<ComponentAttributeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attributes retrieved successfully',
        data: [
          {
            unitId,
            collDate: '2024-05-15T00:00:00Z',
            chapterId: 'CHAP',
            productCode,
            attribGroup: 'ATTR',
            attribCode: 'CMV',
            attribDesc: 'CMV Negative',
            procDate: '2024-05-20T14:30:00Z',
            insertDate: '2024-05-20T15:00:00Z',
            insertUser: 'USER01',
            interCode: 'CMVI',
          },
        ],
        total: 1,
      };

      service.getAttributesForComponent(unitId, collDate, productCode).subscribe((result) => {
        expect(result).toEqual(mockResponse.data!);
        expect(result.length).toBe(1);
        expect(result[0].attribCode).toBe('CMV');
      });

      const expectedUrl = `${baseUrl}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no attributes found', () => {
      const mockResponse: ApiResponse<ComponentAttributeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No attributes found',
        data: [],
        total: 0,
      };

      service.getAttributesForComponent('A123', '2024-05-15T00:00:00', 'E1234').subscribe((result) => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/component-attributes/'));
      req.flush(mockResponse);
    });
  });

  describe('getProductsForUnit', () => {
    it('should retrieve products for a unit via GET', () => {
      const unitId = 'A123456789';
      const collDate = '2024-05-15T00:00:00';

      const mockResponse: ApiResponse<ComponentProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: [
          {
            productCode: 'E1234',
            productDesc: 'Red Blood Cells Leukoreduced',
            productType: 'RBC',
            expiryDate: '2024-06-15T23:59:59Z',
            componentStatus: 'L',
          },
          {
            productCode: 'P5678',
            productDesc: 'Platelets Apheresis',
            productType: 'PLT',
            expiryDate: '2024-05-20T23:59:59Z',
            componentStatus: 'L',
          },
        ],
        total: 2,
      };

      service.getProductsForUnit(unitId, collDate).subscribe((result) => {
        expect(result).toEqual(mockResponse.data!);
        expect(result.length).toBe(2);
        expect(result[0].productType).toBe('RBC');
      });

      const expectedUrl = `${baseUrl}/products/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAttributeGroups', () => {
    it('should retrieve attribute groups for a product type via GET', () => {
      const productType = 'RBC';

      const mockResponse: ApiResponse<AttributeGroupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attribute groups retrieved successfully',
        data: [
          { code: 'ATTR', codeDesc: 'Component Attributes' },
          { code: 'PROC', codeDesc: 'Processing Attributes' },
          { code: 'TEST', codeDesc: 'Test Results' },
        ],
        total: 3,
      };

      service.getAttributeGroups(productType).subscribe((result) => {
        expect(result).toEqual(mockResponse.data!);
        expect(result.length).toBe(3);
        expect(result[0].code).toBe('ATTR');
      });

      const expectedUrl = `${baseUrl}/attribute-groups/${encodeURIComponent(productType)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAttributeCodes', () => {
    it('should retrieve attribute codes with query parameters via GET', () => {
      const productType = 'RBC';
      const attribGroup = 'ATTR';
      const unitId = 'A123456789';
      const collDate = '2024-05-15T00:00:00';
      const productCode = 'E1234';

      const mockResponse: ApiResponse<AttributeCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attribute codes retrieved successfully',
        data: [
          {
            attribCode: 'CMV',
            attribDesc: 'CMV Negative',
            interCode: 'CMVI',
            statusFlag: 'A',
            stopLabelFlag: 'Y',
            lifeSpan: 5,
            lifeSpanInd: 'D',
          },
          {
            attribCode: 'IRR',
            attribDesc: 'Irradiated',
            interCode: undefined,
            statusFlag: 'A',
            stopLabelFlag: 'N',
          },
        ],
        total: 2,
      };

      service
        .getAttributeCodes(productType, attribGroup, unitId, collDate, productCode)
        .subscribe((result) => {
          expect(result).toEqual(mockResponse.data!);
          expect(result.length).toBe(2);
          expect(result[0].attribCode).toBe('CMV');
          expect(result[0].lifeSpan).toBe(5);
        });

      const req = httpMock.expectOne((request) => {
        return (
          request.url.includes(`/attribute-codes/${productType}/${attribGroup}`) &&
          request.params.has('unitId') &&
          request.params.has('collDate') &&
          request.params.has('productCode')
        );
      });

      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('unitId')).toBe(unitId);
      expect(req.request.params.get('collDate')).toBe(collDate);
      expect(req.request.params.get('productCode')).toBe(productCode);
      req.flush(mockResponse);
    });

  });
  describe('URL Encoding', () => {
    it('should properly encode URL parameters with special characters', () => {
      const unitId = 'A123/456';
      const collDate = '2024-05-15T00:00:00';
      const productCode = 'E1234';

      service.getAttributesForComponent(unitId, collDate, productCode).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url.includes(encodeURIComponent(unitId));
      });

      expect(req.request.url).toContain('A123%2F456');
      req.flush({ success: true, data: [] });
    });
  });
});
