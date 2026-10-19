import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AttributeExpirationDateOverrideApiService } from './attribute-expiration-date-override-api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('AttributeExpirationDateOverrideApiService', () => {
  let service: AttributeExpirationDateOverrideApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AttributeExpirationDateOverrideApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AttributeExpirationDateOverrideApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAttributeExpirationDateOverrides', () => {
    it('should call POST with correct URL and payload', () => {
      // Arrange
      const params = {
        overrideAttribute: 'A001',
        sortColumn: 'attributeCode',
        sortOrder: 'ASC' as const
      };

      // Act
      service.getAttributeExpirationDateOverrides(10, 0, params).subscribe(result => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(100);
        expect(result.data[0].attributeCode).toBe('A001');
        expect(result.data[0].overrideAttribute).toBe('B002');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.ovrAttribCode).toBe('A001');
      expect(req.request.body.sortColumn).toBe('attributeCode');

      req.flush({
        success: true,
        data: [{
          attribCode: 'A001',
          ovrAttribCode: 'B002',
          attribDesc: 'Test Attribute',
          ovrAttribDesc: 'Override Attribute',
          effDate: '2028-01-01',
          termDate: '2028-12-31'
        }],
        total: 100
      });
    });

    it('should map API response fields to model correctly', () => {
      // Arrange
      const params = {};

      // Act
      service.getAttributeExpirationDateOverrides(10, 0, params).subscribe(result => {
        // Assert - Verify field mapping from API to model
        const record = result.data[0];
        expect(record.attributeCode).toBe('TEST123');
        expect(record.attributeDescription).toBe('Test Description');
        expect(record.overrideAttribute).toBe('OVR456');
        expect(record.overrideDescription).toBe('Override Description');
        expect(record.effDate).toBe('2028-01-15');
        expect(record.termDate).toBe('2028-12-31');
        expect(record.auditKey).toBe(12345);
        expect(record.programId).toBe('TEST_PROGRAM');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(10, 0));
      req.flush({
        success: true,
        data: [{
          attribCode: 'TEST123',
          attribDesc: 'Test Description',
          ovrAttribCode: 'OVR456',
          ovrAttribDesc: 'Override Description',
          effDate: '2028-01-15',
          termDate: '2028-12-31',
          modifiedDate: '2028-05-14T10:30:00Z',
          modifiedUser: 'testuser',
          auditKey: 12345,
          programId: 'TEST_PROGRAM'
        }],
        total: 1
      });
    });

    it('should use "total" field from API response for totalCount', () => {
      // Arrange
      const params = {};

      // Act
      service.getAttributeExpirationDateOverrides(25, 0, params).subscribe(result => {
        // Assert - Verify total is correctly mapped to totalCount
        expect(result.totalCount).toBe(250);
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(25, 0));
      req.flush({
        success: true,
        data: [],
        total: 250
      });
    });

    it('should fallback to "totalCount" if "total" is not present', () => {
      // Arrange
      const params = {};

      // Act
      service.getAttributeExpirationDateOverrides(25, 0, params).subscribe(result => {
        // Assert - Verify fallback to totalCount
        expect(result.totalCount).toBe(150);
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(25, 0));
      req.flush({
        success: true,
        data: [],
        totalCount: 150
      });
    });

    it('should default to data length if neither total nor totalCount is present', () => {
      // Arrange
      const params = {};

      // Act
      service.getAttributeExpirationDateOverrides(10, 0, params).subscribe(result => {
        // Assert - Verify fallback to data.length
        expect(result.totalCount).toBe(2);
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(10, 0));
      req.flush({
        success: true,
        data: [
          { attribCode: 'A001', ovrAttribCode: 'B001' },
          { attribCode: 'A002', ovrAttribCode: 'B002' }
        ]
      });
    });

    it('should include all filter parameters in request payload', () => {
      // Arrange
      const params = {
        overrideAttribute: 'A001',
        searchKeyword: 'test',
        effDate: '2028-01-01',
        effDatePeriod: 'before' as const,
        termDate: '2028-12-31',
        termDatePeriod: 'after' as const,
        sortColumn: 'attributeCode',
        sortOrder: 'DESC' as const
      };

      // Act
      service.getAttributeExpirationDateOverrides(10, 5, params).subscribe();

      // Assert
      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(10, 5));
      expect(req.request.body).toEqual({
        ovrAttribCode: 'A001',
        searchKeyword: 'test',
        effDate: '2028-01-01',
        effDatePeriod: 'before',
        termDate: '2028-12-31',
        termDatePeriod: 'after',
        sortColumn: 'attributeCode',
        sortOrder: 'DESC'
      });

      req.flush({ success: true, data: [], total: 0 });
    });
  });

  describe('getAttributeExpirationDateOverrideById', () => {
    it('should call GET with correct URL and map response', () => {
      // Arrange
      const attribCode = 'A001';
      const ovrAttribCode = 'B002';

      // Act
      service.getAttributeExpirationDateOverrideById(attribCode, ovrAttribCode).subscribe(result => {
        // Assert
        expect(result.attributeCode).toBe('A001');
        expect(result.overrideAttribute).toBe('B002');
        expect(result.attributeDescription).toBe('Test Attribute');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.GET_BY_ID(attribCode, ovrAttribCode));
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: [{
          attribCode: 'A001',
          ovrAttribCode: 'B002',
          attribDesc: 'Test Attribute',
          ovrAttribDesc: 'Override Description',
          effDate: '2028-01-01'
        }]
      });
    });

    it('should throw error if record not found', () => {
      // Arrange
      const attribCode = 'NONEXISTENT';
      const ovrAttribCode = 'NONE';

      // Act
      service.getAttributeExpirationDateOverrideById(attribCode, ovrAttribCode).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Assert
          expect(error.message).toBe('Record not found');
        }
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.GET_BY_ID(attribCode, ovrAttribCode));
      req.flush({ success: true, data: [] });
    });
  });

  describe('createAttributeExpirationDateOverride', () => {
    it('should call POST with correct payload', () => {
      // Arrange
      const dto = {
        attributeCode: 'A001',
        overrideAttribute: 'B002',
        effDate: '2028-06-01',
        termDate: '2028-12-31'
      };

      // Act
      service.createAttributeExpirationDateOverride(dto).subscribe(result => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.data.attributeCode).toBe('A001');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        attribCode: 'A001',
        ovrAttribCode: 'B002',
        effDate: '2028-06-01',
        termDate: '2028-12-31'
      });

      req.flush({
        success: true,
        statusCode: 201,
        data: {
          attribCode: 'A001',
          ovrAttribCode: 'B002',
          attribDesc: 'Test',
          ovrAttribDesc: 'Override',
          effDate: '2028-06-01',
          termDate: '2028-12-31'
        }
      });
    });
  });

  describe('updateAttributeExpirationDateOverride', () => {
    it('should call PUT with correct URL and payload', () => {
      // Arrange
      const attribCode = 'A001';
      const ovrAttribCode = 'B002';
      const dto = {
        effDate: '2028-07-01',
        termDate: '2027-01-31'
      };

      // Act
      service.updateAttributeExpirationDateOverride(attribCode, ovrAttribCode, dto).subscribe(result => {
        // Assert
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.UPDATE(attribCode, ovrAttribCode));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        effDate: '2028-07-01',
        termDate: '2027-01-31'
      });

      req.flush({
        success: true,
        statusCode: 200,
        data: {
          attribCode: 'A001',
          ovrAttribCode: 'B002',
          effDate: '2028-07-01',
          termDate: '2027-01-31'
        }
      });
    });
  });

  describe('deleteAttributeExpirationDateOverride', () => {
    it('should call DELETE with correct URL', () => {
      // Arrange
      const attribCode = 'A001';
      const ovrAttribCode = 'B002';

      // Act
      service.deleteAttributeExpirationDateOverride(attribCode, ovrAttribCode).subscribe(result => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.data).toBeTrue();
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.DELETE(attribCode, ovrAttribCode));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, statusCode: 200, data: true });
    });
  });

  describe('getAttributesDropdown', () => {
    it('should call GET and return attribute dropdown values', () => {
      // Arrange & Act
      service.getAttributesDropdown().subscribe(result => {
        // Assert
        expect(result.length).toBe(2);
        expect(result[0].attribCode).toBe('A001');
        expect(result[0].attribDesc).toBe('Attribute 1');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.ATTRIBUTES_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush([
        { attribCode: 'A001', attribDesc: 'Attribute 1' },
        { attribCode: 'A002', attribDesc: 'Attribute 2' }
      ]);
    });
  });

  describe('getFilterDropdown', () => {
    it('should call POST filter-dropdown endpoint and transform to filter format', () => {
      // Arrange & Act
      service.getFilterDropdown({ searchKeyword: 'test' }).subscribe(result => {
        // Assert
        expect(result.overrideAttributes.length).toBe(2);
        expect(result.overrideAttributes[0].key).toBe('A001');
        expect(result.overrideAttributes[0].value).toBe('A001');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.FILTER_DROPDOWN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.searchKeyword).toBe('test');
      req.flush([
        { attribCode: 'A001', attribDesc: 'Attribute 1' },
        { attribCode: 'A002', attribDesc: 'Attribute 2' }
      ]);
    });

    it('should handle errors from filter dropdown', () => {
      // Arrange & Act
      service.getFilterDropdown().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.FILTER_DROPDOWN);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAddDropdown', () => {
    it('should call getAttributesDropdown and transform to add/edit format', () => {
      // Arrange & Act
      service.getAddDropdown().subscribe(result => {
        // Assert
        expect(result.attributeCodes.length).toBe(2);
        expect(result.overrideAttributes.length).toBe(2);
        expect(result.attributeCodes[0].key).toBe('A001');
        expect(result.attributeCodes[0].value).toBe('A001');
        expect(result.attributeCodes[0].description).toBe('Attribute 1');
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.ATTRIBUTES_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush([
        { attribCode: 'A001', attribDesc: 'Attribute 1' },
        { attribCode: 'A002', attribDesc: 'Attribute 2' }
      ]);
    });

    it('should handle errors from attributes dropdown', () => {
      // Arrange & Act
      service.getAddDropdown().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.ATTRIBUTES_DROPDOWN);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
