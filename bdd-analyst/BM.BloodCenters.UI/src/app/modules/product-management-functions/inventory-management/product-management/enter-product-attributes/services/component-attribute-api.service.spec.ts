import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentAttributeApiService } from './component-attribute-api.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ComponentAttributeDto,
  CreateComponentAttributeRequestDto,
  ComponentAttributeQueryDto,
  ValidateUnitRequestDto,
  ApiResponse,
  AttributeGroupDto,
  AttributeCodeDto,
} from '../models/component-attribute.model';

describe('ComponentAttributeApiService', () => {
  let service: ComponentAttributeApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComponentAttributeApiService],
    });

    service = TestBed.inject(ComponentAttributeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should retrieve all component attributes with pagination', () => {
      const mockResponse: ApiResponse<ComponentAttributeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [
          {
            unitId: 'UNIT123',
            collDate: '2024-05-28T00:00:00Z',
            chapterId: 'TEST',
            productCode: 'PROD001',
            productDescription: 'Red Blood Cells',
            attribGroup: 'ALERT',
            attribCode: 'AL01',
            attribDescription: 'CMV Negative',
            procDate: '2024-05-28T10:30:00Z',
            newExpDate: null,
            insertDate: '2024-05-28T10:35:00Z',
            insertUser: 'TUSER',
          },
        ],
        totalCount: 1,
      };

      const query: ComponentAttributeQueryDto = {
        unitId: 'UNIT123',
        sortColumn: 'insertDate',
        sortOrder: 'DESC',
      };

      service.getAll(10, 0, query).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
        expect(response.totalCount).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.GET_ALL(10, 0)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should handle empty query object', () => {
      const mockResponse: ApiResponse<ComponentAttributeDto[]> = {
        success: true,
        statusCode: 200,
        data: [],
        totalCount: 0,
      };

      service.getAll(25, 0).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.GET_ALL(25, 0)}`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getById', () => {
    it('should retrieve component attribute by composite key', () => {
      const mockResponse: ApiResponse<ComponentAttributeDto> = {
        success: true,
        statusCode: 200,
        message: 'Record retrieved successfully',
        data: {
          unitId: 'UNIT123',
          collDate: '2024-05-28T00:00:00Z',
          chapterId: 'TEST',
          productCode: 'PROD001',
          productDescription: 'Red Blood Cells',
          attribGroup: 'ALERT',
          attribCode: 'AL01',
          attribDescription: 'CMV Negative',
          procDate: '2024-05-28T10:30:00Z',
          newExpDate: null,
          insertDate: '2024-05-28T10:35:00Z',
          insertUser: 'TUSER',
        },
      };

      service.getById('UNIT123', '2024-05-28', 'PROD001', 'ALERT', 'AL01').subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.unitId).toBe('UNIT123');
      });

      const expectedUrl = `${baseUrl}${API.COMPONENT_ATTRIBUTES.GET_BY_ID('UNIT123', '2024-05-28', 'PROD001', 'ALERT', 'AL01')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('create', () => {
    it('should create component attribute successfully', () => {
      const createDto: CreateComponentAttributeRequestDto = {
        unitId: 'UNIT123',
        collDate: '2024-05-28',
        productCode: 'PROD001',
        attribGroup: 'ALERT',
        attribCode: 'AL01',
        procDate: '2024-05-28T10:30:00',
      };

      const mockResponse: ApiResponse<ComponentAttributeDto> = {
        success: true,
        statusCode: 201,
        message: 'Attribute successfully added',
        data: {
          unitId: 'UNIT123',
          collDate: '2024-05-28T00:00:00Z',
          chapterId: 'TEST',
          productCode: 'PROD001',
          productDescription: 'Red Blood Cells',
          attribGroup: 'ALERT',
          attribCode: 'AL01',
          attribDescription: 'CMV Negative',
          procDate: '2024-05-28T10:30:00Z',
          newExpDate: null,
          insertDate: '2024-05-28T10:35:00Z',
          insertUser: 'TUSER',
        },
      };

      service.create(createDto).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.CREATE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

  });

  describe('delete', () => {
    it('should delete component attribute successfully', () => {
      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
        data: true,
      };

      service.delete('UNIT123', '2024-05-28', 'PROD001', 'ALERT', 'AL01').subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
      });

      const expectedUrl = `${baseUrl}${API.COMPONENT_ATTRIBUTES.DELETE('UNIT123', '2024-05-28', 'PROD001', 'ALERT', 'AL01')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('validateUnit', () => {
    it('should validate unit successfully', () => {
      const dto: ValidateUnitRequestDto = { unitId: 'UNIT123' };
      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Unit validated successfully',
        data: {
          unitId: 'UNIT123',
          collDate: '2024-05-28T00:00:00Z',
          isValid: true,
          hasActiveComponents: true,
        },
      };

      service.validateUnit(dto).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data?.isValid).toBe(true);
        expect(response.data?.hasActiveComponents).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.VALIDATE_UNIT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should handle unit not found', () => {
      const dto: ValidateUnitRequestDto = { unitId: 'NOTFOUND' };
      const mockResponse: ApiResponse<any> = {
        success: false,
        statusCode: 404,
        message: 'Unit not found',
      };

      service.validateUnit(dto).subscribe((response) => {
        expect(response.success).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.VALIDATE_UNIT}`);
      req.flush(mockResponse);
    });

    it('should unwrap array data to single object', () => {
      const dto: ValidateUnitRequestDto = { unitId: 'UNIT123' };

      service.validateUnit(dto).subscribe((response) => {
        expect(response.data).toEqual({
          unitId: 'UNIT123', collDate: '2024-05-28T00:00:00Z', isValid: true, hasActiveComponents: true,
        });
        expect(Array.isArray(response.data)).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.VALIDATE_UNIT}`);
      req.flush({
        success: true, statusCode: 200,
        data: [{ unitId: 'UNIT123', collDate: '2024-05-28T00:00:00Z', isValid: true, hasActiveComponents: true }],
      });
    });

    it('should return null when array data is empty', () => {
      const dto: ValidateUnitRequestDto = { unitId: 'UNIT123' };

      service.validateUnit(dto).subscribe((response) => {
        expect(response.data).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.COMPONENT_ATTRIBUTES.VALIDATE_UNIT}`);
      req.flush({ success: true, statusCode: 200, data: [] });
    });
  });

  describe('getAttributeGroups', () => {
    it('should retrieve attribute groups from API', () => {
      const mockResponse: ApiResponse<AttributeGroupDto[]> = {
        success: true,
        statusCode: 200,
        data: [
          { code: 'ALERT', description: 'Alert Attributes' },
          { code: 'SP', description: 'Special Processing' },
        ],
      };

      service.getAttributeGroups('PROD001').subscribe((groups) => {
        expect(groups.length).toBe(2);
        expect(groups[0].code).toBe('ALERT');
        expect(groups[1].code).toBe('SP');
      });

      const req = httpMock.expectOne((r) => r.url.includes('attribute-groups'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response is not successful', () => {
      service.getAttributeGroups('PROD001').subscribe((groups) => {
        expect(groups).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('attribute-groups'));
      req.flush({ success: false, statusCode: 400 });
    });

    it('should return empty array when data is null', () => {
      service.getAttributeGroups('PROD001').subscribe((groups) => {
        expect(groups).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('attribute-groups'));
      req.flush({ success: true, statusCode: 200, data: null });
    });
  });

  describe('getAttributeCodes', () => {
    it('should retrieve attribute codes for a group', () => {
      const mockResponse: ApiResponse<AttributeCodeDto[]> = {
        success: true,
        statusCode: 200,
        data: [
          { attribCode: 'AL01', attribDescription: 'CMV Negative', attribGroup: 'ALERT', lifeSpan: null },
          { attribCode: 'AL02', attribDescription: 'Irradiated', attribGroup: 'ALERT', lifeSpan: 14 },
        ],
      };

      service.getAttributeCodes('ALERT', 'UNIT123', 'PROD001').subscribe((codes) => {
        expect(codes.length).toBe(2);
        expect(codes[0].attribGroup).toBe('ALERT');
      });

      const req = httpMock.expectOne((r) => r.url.includes('attribute-codes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response is not successful', () => {
      service.getAttributeCodes('ALERT', 'UNIT123', 'PROD001').subscribe((codes) => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('attribute-codes'));
      req.flush({ success: false, statusCode: 400 });
    });

    it('should return empty array when data is null', () => {
      service.getAttributeCodes('ALERT', 'UNIT123', 'PROD001').subscribe((codes) => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('attribute-codes'));
      req.flush({ success: true, statusCode: 200, data: null });
    });
  });

  describe('getProductsForUnit', () => {
    it('should map products from API response', () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        data: [
          { productCode: 'PROD001', productDescription: 'Red Blood Cells' },
          { productCode: 'PROD002', productDescription: 'Platelets' },
        ],
      };

      service.getProductsForUnit('UNIT123', '2024-05-28').subscribe((products) => {
        expect(products.length).toBe(2);
        expect(products[0].productCode).toBe('PROD001');
        expect(products[1].productCode).toBe('PROD002');
      });

      const req = httpMock.expectOne((r) => r.url.includes('product-codes'));
      req.flush(mockResponse);
    });

    it('should return empty array when response is not successful', () => {
      service.getProductsForUnit('UNIT123', '2024-05-28').subscribe((products) => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('product-codes'));
      req.flush({ success: false, statusCode: 400 });
    });

    it('should return empty array when data is null', () => {
      service.getProductsForUnit('UNIT123', '2024-05-28').subscribe((products) => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('product-codes'));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should prefer productDesc over productDescription', () => {
      service.getProductsForUnit('UNIT123', '2024-05-28').subscribe((products) => {
        expect(products[0].productDescription).toBe('From productDesc');
      });

      const req = httpMock.expectOne((r) => r.url.includes('product-codes'));
      req.flush({
        success: true, statusCode: 200,
        data: [{ productCode: 'P001', productDesc: 'From productDesc', productDescription: 'From productDescription' }],
      });
    });

    it('should fallback to productCode when no description fields exist', () => {
      service.getProductsForUnit('UNIT123', '2024-05-28').subscribe((products) => {
        expect(products[0].productDescription).toBe('P001');
      });

      const req = httpMock.expectOne((r) => r.url.includes('product-codes'));
      req.flush({
        success: true, statusCode: 200,
        data: [{ productCode: 'P001' }],
      });
    });
  });
});
