import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UnitAttributeApiService } from './unit-attribute-api.service';
import {
  UnitValidationResult,
  UnitAttributeRow,
  AttributeGroupOption,
  AttributeCodeOption,
  CreateUnitAttributeRequest,
} from '../models/unit-attribute.model';

describe('UnitAttributeApiService', () => {
  let service: UnitAttributeApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/unit-attributes';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UnitAttributeApiService],
    });
    service = TestBed.inject(UnitAttributeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnit', () => {
    it('should validate a unit and return validation result', () => {
      const mockResult: UnitValidationResult = {
        unitId: 'W123456789012',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'HQ01',
        contractId: 'INTERNAL',
        contractName: 'Internal Blood Collection',
        hasCueCompleted: true,
        hasLabeledComponents: false,
        alertSpFlag: 'Y',
      };

      service.validateUnit('W123456789012').subscribe((data) => {
        expect(data).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit/W123456789012`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: [mockResult] });
    });

    it('should encode special characters in unit ID', () => {
      service.validateUnit('W1234/5678').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/validate-unit/W1234%2F5678`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: [{}] });
    });
  });

  describe('getAttributes', () => {
    it('should fetch attributes with pagination parameters', () => {
      const mockData: UnitAttributeRow[] = [
        {
          attribGroup: 'ALERT',
          attribGroupDesc: 'Alert Codes',
          attribCode: 'HBSA',
          attribCodeDesc: 'HBsAg Reactive',
          statusFlag: 'Q',
          stopLabelFlag: 'Y',
          insertDate: '2024-01-15T00:00:00',
          insertUserId: 'USER01',
        },
      ];

      service.getAttributes('W123456789012', '2024-01-15', 'I', 25, 0).subscribe((result) => {
        expect(result.data).toEqual(mockData);
        expect(result.totalRecords).toBe(1);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/W123456789012/25/0` &&
          request.params.get('collDate') === '2024-01-15' &&
          request.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockData, total: 1 });
    });

  });

  describe('getAttributeGroups', () => {
    it('should fetch attribute groups', () => {
      const mockGroups: AttributeGroupOption[] = [
        { code: 'ALERT', description: 'Alert Codes' },
        { code: 'SP', description: 'Special Handling' },
      ];

      service.getAttributeGroups().subscribe((data) => {
        expect(data).toEqual(mockGroups);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/attribute-groups`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockGroups });
    });
  });

  describe('getAttributeCodes', () => {
    it('should fetch attribute codes with alertSpFlag', () => {
      const mockCodes: AttributeCodeOption[] = [
        { code: 'HBSA', description: 'HBsAg Reactive' },
      ];

      service.getAttributeCodes('ALERT', 'Y', 'I').subscribe((data) => {
        expect(data).toEqual(mockCodes);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/attribute-codes/ALERT` &&
          request.params.get('codeScheme') === 'I' &&
          request.params.get('alertSpFlag') === 'Y'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockCodes });
    });

    it('should fetch attribute codes without alertSpFlag when null', () => {
      service.getAttributeCodes('SP', null, 'C').subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/attribute-codes/SP` &&
          request.params.get('codeScheme') === 'C' &&
          !request.params.has('alertSpFlag')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: [] });
    });
  });

  describe('createAttribute', () => {
    it('should create a unit attribute', () => {
      const dto: CreateUnitAttributeRequest = {
        unitId: 'W123456789012',
        collDate: '2024-01-15',
        attribGroup: 'ALERT',
        attribCode: 'HBSA',
      };

      service.createAttribute(dto, 'I').subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === baseUrl &&
          request.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true, statusCode: 201, data: { created: true } });
    });
  });

  describe('deleteAttribute', () => {
    it('should delete a unit attribute', () => {
      service.deleteAttribute('W123456789012', 'ALERT', 'HBSA', '2024-01-15').subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${baseUrl}/W123456789012/ALERT/HBSA` &&
          request.params.get('collDate') === '2024-01-15'
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, statusCode: 200, data: true });
    });
  });
});
