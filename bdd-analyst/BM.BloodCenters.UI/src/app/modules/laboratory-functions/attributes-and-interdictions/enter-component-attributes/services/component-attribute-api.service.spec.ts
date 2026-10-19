import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentAttributeApiService } from './component-attribute-api.service';
import {
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
  SaveComponentAttributeRequest,
} from '../models/component-attribute.model';

describe('ComponentAttributeApiService', () => {
  let service: ComponentAttributeApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/component-attributes';

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

  describe('getComponentAttributes', () => {
    it('should fetch component attributes for a unit/product', () => {
      const unitId = 'W4545 26 051302-1';
      const collDate = '2026-05-13T00:00:00';
      const productCode = 'E0701V00';
      const mockData: ComponentAttributeDto[] = [
        {
          unitId: unitId,
          collDate: '2026-05-13T00:00:00',
          chapterId: 'CH001',
          productCode: productCode,
          productDesc: 'Red Blood Cells',
          productType: 'RBC',
          attribGroup: 'IRR',
          attribCode: 'IRR25',
          attribDesc: 'Irradiated - 25 Gy',
          procDate: '2026-05-15T10:30:00',
          insertDate: new Date('2026-05-15T10:30:00'),
          insertUser: 'JSMITH',
          programId: 'COMPATT',
          expiryDate: '2026-07-13T00:00:00',
          newExpiryDate: '2026-07-27T00:00:00',
          interCode: null,
        },
      ];

      service.getComponentAttributes(unitId, collDate, productCode).subscribe((data) => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${unitId}/${collDate}/${productCode}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockData,
      });
    });

    it('should format date correctly (add time portion if missing)', () => {
      const unitId = 'W4545 26 051302-1';
      const collDate = '2026-05-13';
      const productCode = 'E0701V00';

      service.getComponentAttributes(unitId, collDate, productCode).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${unitId}/2026-05-13T00:00:00/${productCode}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: [] });
    });
  });

  describe('getProductsForUnit', () => {
    it('should fetch products for a validated unit', () => {
      const unitId = 'W4545 26 051302-1';
      const collDate = '2026-05-13T00:00:00';
      const mockProducts: ComponentProductDto[] = [
        {
          productCode: 'E0701V00',
          productDesc: 'Red Blood Cells',
          productType: 'RBC',
          expiryDate: '2026-07-15T00:00:00',
          componentStatus: 'Available',
        },
        {
          productCode: 'E0155V00',
          productDesc: 'Platelets',
          productType: 'PLT',
          expiryDate: '2026-06-10T00:00:00',
          componentStatus: 'Available',
        },
      ];

      service.getProductsForUnit(unitId, collDate).subscribe((data) => {
        expect(data).toEqual(mockProducts);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/products/${unitId}/${collDate}` &&
          request.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockProducts,
      });
    });
  });

  describe('getAttributeGroups', () => {
    it('should fetch attribute groups for a product type', () => {
      const productType = 'RBC';
      const productCode = 'E0701V00';
      const codeScheme = 'I';
      const mockGroups: AttributeGroupDto[] = [
        { code: 'IRR', codeDesc: 'Irradiation' },
        { code: 'WASH', codeDesc: 'Saline Wash' },
      ];

      service.getAttributeGroups(productType, productCode, codeScheme).subscribe((data) => {
        expect(data).toEqual(mockGroups);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/attribute-groups/${productType}` &&
          request.params.get('codeScheme') === codeScheme
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockGroups,
      });
    });
  });

  describe('getAttributeCodes', () => {
    it('should fetch attribute codes with query parameters', () => {
      const productType = 'RBC';
      const attribGroup = 'IRR';
      const unitId = 'W4545 26 051302-1';
      const collDate = '2026-05-13T00:00:00';
      const productCode = 'E0701V00';
      const mockCodes: AttributeCodeDto[] = [
        {
          attribCode: 'IRR25',
          attribDesc: 'Irradiated - 25 Gy',
          attribGroup: 'IRR',
          attribType: 'A',
          lifeSpan: null,
          lifeSpanInd: null,
          interCode: null,
          statusFlag: 'A',
          stopLabelFlag: 'N',
        },
      ];

      service
        .getAttributeCodes(productType, attribGroup, unitId, collDate, productCode)
        .subscribe((data) => {
          expect(data).toEqual(mockCodes);
          expect(data.length).toBe(1);
        });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/attribute-codes/${productType}/${attribGroup}` &&
          request.params.get('unitId') === unitId &&
          request.params.get('collDate') === '2026-05-13T00:00:00' &&
          request.params.get('productCode') === productCode
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockCodes,
      });
    });
  });

  describe('saveComponentAttribute', () => {
    it('should save a component attribute', () => {
      const request: SaveComponentAttributeRequest = {
        unitId: 'W4545 26 051302-1',
        collDate: '2026-05-13T00:00:00',
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
        procDate: '2026-05-15T10:30:00',
      };

      const mockResponse: ComponentAttributeDto = {
        unitId: request.unitId,
        collDate: request.collDate,
        chapterId: 'CH001',
        productCode: request.productCode,
        productDesc: 'Red Blood Cells',
        productType: 'RBC',
        attribGroup: request.attribGroup,
        attribCode: request.attribCode,
        attribDesc: 'Irradiated - 25 Gy',
        procDate: request.procDate || new Date().toISOString(),
        insertDate: new Date(),
        insertUser: 'TESTUSER',
        programId: 'COMPATT',
        expiryDate: '2026-07-15T00:00:00',
        newExpiryDate: '2026-07-20T00:00:00',
        interCode: null,
      };

      service.saveComponentAttribute(request).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, data: mockResponse });
    });
  });
});
