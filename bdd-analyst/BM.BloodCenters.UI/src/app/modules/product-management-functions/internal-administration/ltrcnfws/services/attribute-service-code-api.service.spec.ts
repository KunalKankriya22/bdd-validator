import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AttributeServiceCodeApiService } from './attribute-service-code-api.service';
import {
  AttributeServiceCodeDto,
  UpdateAttributeServiceCodeDto,
  AttributeGroupDropdownDto,
  AttributeServiceCodeQueryDto,
  ApiResponse
} from '../models/attribute-service-code.model';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../../../../core/constants/api.constants';

describe('AttributeServiceCodeApiService', () => {
  let service: AttributeServiceCodeApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  const mockAttributeServiceCode: AttributeServiceCodeDto = {
    attribGroup: 'BLOOD',
    attribCode: '0001',
    attribDesc: 'Sample Attribute',
    attribCustom: 'Y',
    normalStockFlag: 'N',
    price: 125.50,
    serviceCode: 'SVC001',
    creditFlag: 'Y',
    lastModifiedDate: '2026-05-30T10:30:00Z',
    programId: 'SFIATTR'
  };

  const mockGroupsDropdown: AttributeGroupDropdownDto[] = [
    { code: 'BLOOD', description: 'Blood Product Attributes' },
    { code: 'LAB', description: 'Laboratory Attributes' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AttributeServiceCodeApiService]
    });

    service = TestBed.inject(AttributeServiceCodeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  describe('getAttributeServiceCodes', () => {
    it('should fetch attribute service codes with pagination', (done) => {
      const take = 10;
      const skip = 0;
      const queryParams: AttributeServiceCodeQueryDto = {
        attributeGroup: 'BLOOD',
        searchKeyword: 'test',
        sortColumn: 'AttribCode',
        sortOrder: 'ASC'
      };

      const mockResponse: ApiResponse<AttributeServiceCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockAttributeServiceCode],
        total: 1
      };

      service.getAttributeServiceCodes(take, skip, queryParams).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalCount).toBe(1);
        expect(response.data[0].attribGroup).toBe('BLOOD');
        expect(response.data[0].uniqueRowId).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.LIST(take, skip)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.attributeGroup).toBe('BLOOD');
      expect(req.request.body.searchKeyword).toBe('test');
      expect(req.request.body.sortColumn).toBe('AttribCode');
      expect(req.request.body.sortOrder).toBe('ASC');
      expect(req.request.body.filterPrice).toBeNull();
      expect(req.request.body.filterServiceCode).toBeNull();
      req.flush(mockResponse);
    });


    it('should handle null query params', (done) => {
      const mockResponse: ApiResponse<AttributeServiceCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockAttributeServiceCode],
        total: 1
      };

      service.getAttributeServiceCodes(10, 0).subscribe(response => {
        expect(response.data.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.LIST(10, 0)}`);
      expect(req.request.body.attributeGroup).toBeNull();
      expect(req.request.body.searchKeyword).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('getAttributeServiceCodeById', () => {
    it('should fetch single attribute service code by ID', (done) => {
      const attributeGroup = 'BLOOD';
      const attributeCode = '0001';

      const mockResponse: ApiResponse<AttributeServiceCodeDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockAttributeServiceCode
      };

      service.getAttributeServiceCodeById(attributeGroup, attributeCode).subscribe(data => {
        expect(data).toEqual(mockAttributeServiceCode);
        expect(data.attribGroup).toBe('BLOOD');
        expect(data.attribCode).toBe('0001');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.GET_BY_ID(attributeGroup, attributeCode)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 not found', (done) => {
      const attributeGroup = 'INVALID';
      const attributeCode = '9999';

      service.getAttributeServiceCodeById(attributeGroup, attributeCode).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne(
        `${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.GET_BY_ID(attributeGroup, attributeCode)}`
      );
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateAttributeServiceCode', () => {
    it('should update attribute service code', (done) => {
      const attributeGroup = 'BLOOD';
      const attributeCode = '0001';
      const updateDto: UpdateAttributeServiceCodeDto = {
        price: 150.00,
        serviceCode: 'SVC002',
        creditFlag: 'N'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Attribute service code updated successfully',
        data: {
          attributeGroup: 'BLOOD',
          attributeCode: '0001',
          price: 150.00,
          serviceCode: 'SVC002',
          creditFlag: 'N'
        }
      };

      service.updateAttributeServiceCode(attributeGroup, attributeCode, updateDto).subscribe(data => {
        expect(data.price).toBe(150.00);
        expect(data.serviceCode).toBe('SVC002');
        expect(data.creditFlag).toBe('N');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.UPDATE(attributeGroup, attributeCode)}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });

    it('should handle partial update (only price)', (done) => {
      const attributeGroup = 'BLOOD';
      const attributeCode = '0001';
      const updateDto: UpdateAttributeServiceCodeDto = {
        price: 200.00
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Updated successfully',
        data: { price: 200.00 }
      };

      service.updateAttributeServiceCode(attributeGroup, attributeCode, updateDto).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.UPDATE(attributeGroup, attributeCode)}`
      );
      expect(req.request.body.price).toBe(200.00);
      expect(req.request.body.serviceCode).toBeNull();
      expect(req.request.body.creditFlag).toBeNull();
      req.flush(mockResponse);
    });

  });

  describe('getAttributeGroupsDropdown', () => {
    it('should fetch attribute groups dropdown', (done) => {
      const mockResponse: ApiResponse<AttributeGroupDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Successfully fetched active attribute groups',
        data: mockGroupsDropdown
      };

      service.getAttributeGroupsDropdown().subscribe(groups => {
        expect(groups.length).toBe(2);
        expect(groups[0].code).toBe('BLOOD');
        expect(groups[1].code).toBe('LAB');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.GROUPS_DROPDOWN}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty dropdown', (done) => {
      const mockResponse: ApiResponse<AttributeGroupDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No groups found',
        data: []
      };

      service.getAttributeGroupsDropdown().subscribe(groups => {
        expect(groups.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.ATTRIBUTE_SERVICE_CODES.GROUPS_DROPDOWN}`);
      req.flush(mockResponse);
    });

  });
});
