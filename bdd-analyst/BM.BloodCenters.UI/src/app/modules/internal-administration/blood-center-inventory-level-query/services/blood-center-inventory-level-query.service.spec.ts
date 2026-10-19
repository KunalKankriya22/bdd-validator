import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BloodCenterInventoryLevelQueryService } from './blood-center-inventory-level-query.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  InventoryLevelQueryDto,
  InventoryLevelResultDto,
  InventoryClassDto,
  ProductTypeDto,
  BloodTypeDto,
  AttributeGroupDto,
  AttributeCodeDto,
  ApiResponse
} from '../interfaces/inventory-level.interface';

describe('BloodCenterInventoryLevelQueryService', () => {
  let service: BloodCenterInventoryLevelQueryService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BloodCenterInventoryLevelQueryService]
    });

    service = TestBed.inject(BloodCenterInventoryLevelQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryInventoryLevels', () => {
    it('should POST query and return inventory results', () => {
      const queryDto: InventoryLevelQueryDto = {
        inventoryClass: 'DO',
        productType: 'PLAS',
        bloodType: null,
        attributeGroup: null,
        attributeCode: null
      };

      const mockResults: InventoryLevelResultDto[] = [
        {
          productType: 'PLAS',
          productDescription: 'Plasma',
          bloodType: 'ON',
          bloodTypeDescription: 'O Negative',
          actualCount: 125,
          minLevel: 100,
          optimalLevel: 150,
          customerAlphaKey: 'STANDARD'
        }
      ];

      const mockResponse: ApiResponse<InventoryLevelResultDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Inventory levels retrieved successfully',
        data: mockResults,
        total: 1
      };

      service.queryInventoryLevels(queryDto).subscribe(results => {
        expect(results).toEqual(mockResults);
        expect(results.length).toBe(1);
        expect(results[0].productType).toBe('PLAS');
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.QUERY}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush(mockResponse);
    });

    it('should return empty array when no data in response', () => {
      const queryDto: InventoryLevelQueryDto = {
        inventoryClass: 'DO'
      };

      const mockResponse: ApiResponse<InventoryLevelResultDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No inventory levels found',
        data: [],
        total: 0
      };

      service.queryInventoryLevels(queryDto).subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.QUERY}`);
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const queryDto: InventoryLevelQueryDto = { inventoryClass: 'DO' };

      service.queryInventoryLevels(queryDto).subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.QUERY}`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, total: 0 });
    });
  });

  describe('getInventoryClasses', () => {
    it('should GET inventory classes', () => {
      const mockClasses: InventoryClassDto[] = [
        { code: 'DO', description: 'Donor' },
        { code: 'OP', description: 'Operating Room' }
      ];

      const mockResponse: ApiResponse<InventoryClassDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Inventory classes retrieved successfully',
        data: mockClasses,
        total: 2
      };

      service.getInventoryClasses().subscribe(classes => {
        expect(classes).toEqual(mockClasses);
        expect(classes.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.INVENTORY_CLASSES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      service.getInventoryClasses().subscribe(classes => {
        expect(classes).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.INVENTORY_CLASSES}`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, total: 0 });
    });
  });

  describe('getProductTypes', () => {
    it('should GET product types with default params', () => {
      const mockTypes: ProductTypeDto[] = [
        { code: 'PLAS', description: 'Plasma' },
        { code: 'PRBC', description: 'Red Blood Cells' }
      ];

      const mockResponse: ApiResponse<ProductTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Product types retrieved successfully',
        data: mockTypes,
        total: 2
      };

      service.getProductTypes().subscribe(types => {
        expect(types).toEqual(mockTypes);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.PRODUCT_TYPES}` &&
        request.params.has('inventoryType') &&
        request.params.get('inventoryType') === 'MI'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should GET product types with custom params', () => {
      const mockResponse: ApiResponse<ProductTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Product types retrieved successfully',
        data: [],
        total: 0
      };

      service.getProductTypes('CUSTOM', 'CUST123').subscribe();

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.PRODUCT_TYPES}` &&
        request.params.get('inventoryType') === 'CUSTOM' &&
        request.params.get('customerId') === 'CUST123'
      );
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      service.getProductTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.PRODUCT_TYPES}`
      );
      req.flush({ success: true, statusCode: 200, message: '', data: null, total: 0 });
    });
  });

  describe('getBloodTypes', () => {
    it('should GET blood types with default params', () => {
      const mockTypes: BloodTypeDto[] = [
        { code: 'ON', description: 'O Negative' },
        { code: 'OP', description: 'O Positive' }
      ];

      const mockResponse: ApiResponse<BloodTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Blood types retrieved successfully',
        data: mockTypes,
        total: 2
      };

      service.getBloodTypes().subscribe(types => {
        expect(types).toEqual(mockTypes);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.BLOOD_TYPES}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should GET blood types with product type filter', () => {
      const mockResponse: ApiResponse<BloodTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Blood types retrieved successfully',
        data: [],
        total: 0
      };

      service.getBloodTypes('MI', 'PLAS').subscribe();

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.BLOOD_TYPES}` &&
        request.params.get('productType') === 'PLAS'
      );
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      service.getBloodTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.BLOOD_TYPES}`
      );
      req.flush({ success: true, statusCode: 200, message: '', data: null, total: 0 });
    });
  });

  describe('getAttributeGroups', () => {
    it('should GET attribute groups', () => {
      const mockGroups: AttributeGroupDto[] = [
        { code: 'CMV' },
        { code: 'IRRAD' }
      ];

      const mockResponse: ApiResponse<AttributeGroupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attribute groups retrieved successfully',
        data: mockGroups,
        total: 2
      };

      service.getAttributeGroups().subscribe(groups => {
        expect(groups).toEqual(mockGroups);
        expect(groups.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.ATTRIBUTE_GROUPS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      service.getAttributeGroups().subscribe(groups => {
        expect(groups).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.ATTRIBUTE_GROUPS}`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, total: 0 });
    });
  });

  describe('getAttributeCodes', () => {
    it('should GET attribute codes for a specific group', () => {
      const attributeGroup = 'CMV';
      const mockCodes: AttributeCodeDto[] = [
        { code: 'NEG', description: 'Negative' },
        { code: 'POS', description: 'Positive' }
      ];

      const mockResponse: ApiResponse<AttributeCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attribute codes retrieved successfully',
        data: mockCodes,
        total: 2
      };

      service.getAttributeCodes(attributeGroup).subscribe(codes => {
        expect(codes).toEqual(mockCodes);
        expect(codes.length).toBe(2);
      });

      const expectedUrl = `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.ATTRIBUTE_CODES(attributeGroup)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in attribute group', () => {
      const attributeGroup = 'TEST GROUP';

      const mockResponse: ApiResponse<AttributeCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Attribute codes retrieved successfully',
        data: [],
        total: 0
      };

      service.getAttributeCodes(attributeGroup).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes(encodeURIComponent(attributeGroup))
      );
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const attributeGroup = 'CMV';

      service.getAttributeCodes(attributeGroup).subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const expectedUrl = `${apiUrl}${API.BLOOD_CENTER_INVENTORY_LEVELS.ATTRIBUTE_CODES(attributeGroup)}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush({ success: true, statusCode: 200, message: '', data: null, total: 0 });
    });
  });
});
