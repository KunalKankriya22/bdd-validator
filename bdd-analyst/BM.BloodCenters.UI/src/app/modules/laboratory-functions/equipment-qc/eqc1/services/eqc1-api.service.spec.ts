import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Eqc1ApiService } from './eqc1-api.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

import type {
  EquipmentType,
  EquipmentLookup,
  QcType,
  QcResult,
  QcControlDetail,
  QcHeaderResponse,
  QcDetailResponse,
  QcEvent,
  ReviewCode,
  BarcodeResponse,
  SystemUser,
  CreateQcRequest,
  CreateQcResponse,
  UpdateQcHeaderRequest,
  UpdateQcDetailsRequest,
  ApiResponse
} from '../models/eqc1.model';

describe('Eqc1ApiService', () => {
  let service: Eqc1ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Eqc1ApiService]
    });
    service = TestBed.inject(Eqc1ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getEquipmentTypes', () => {
    it('should return equipment types via GET', (done) => {
      const mockResponse: ApiResponse<EquipmentType[]> = {
        success: true,
        data: [
          { code: 'ALYX', description: 'Alyx Machine' },
          { code: 'CENT', description: 'Centrifuge' }
        ]
      };

      service.getEquipmentTypes().subscribe((types) => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('ALYX');
        expect(types[1].description).toBe('Centrifuge');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.EQUIPMENT_TYPES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getEquipmentIds', () => {
    it('should return equipment IDs for a given equipment type via GET', (done) => {
      const mockResponse: ApiResponse<EquipmentLookup[]> = {
        success: true,
        data: [
          { equipId: 'DEV001', equipReference: '' },
          { equipId: 'DEV002', equipReference: '' }
        ]
      };

      service.getEquipmentIds('ALYX').subscribe((ids) => {
        expect(ids.length).toBe(2);
        expect(ids[0].equipId).toBe('DEV001');
        done();
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}${API.EQUIPMENT_QC_ENTRY.EQUIPMENT_IDS}`
          && r.params.get('equipmentType') === 'ALYX'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getEquipmentReferences', () => {
    it('should return equipment references via GET with two params', (done) => {
      const mockResponse: ApiResponse<EquipmentLookup[]> = {
        success: true,
        data: [{ equipId: 'DEV001', equipReference: 'EQ-000292' }]
      };

      service.getEquipmentReferences('ALYX', 'DEV001').subscribe((refs) => {
        expect(refs.length).toBe(1);
        expect(refs[0].equipReference).toBe('EQ-000292');
        done();
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}${API.EQUIPMENT_QC_ENTRY.EQUIPMENT_REFERENCES}`
          && r.params.get('equipmentType') === 'ALYX'
          && r.params.get('equipmentId') === 'DEV001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getQcTypes', () => {
    it('should return QC types for equipment type via GET', (done) => {
      const mockResponse: ApiResponse<QcType[]> = {
        success: true,
        data: [{ qcType: 'QC', description: 'Quality Control' }]
      };

      service.getQcTypes('ALYX').subscribe((types) => {
        expect(types.length).toBe(1);
        expect(types[0].qcType).toBe('QC');
        expect(types[0].description).toBe('Quality Control');
        done();
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_TYPES}`
          && r.params.get('equipmentType') === 'ALYX'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getQcControlDetails', () => {
    it('should return QC control details via GET with equipmentType and qcType', (done) => {
      const mockResponse: ApiResponse<QcControlDetail[]> = {
        success: true,
        data: [
          { qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Check USB Port', qcUnits: 'CHAR', targetValue: 'GOOD', minAccept: '', maxAccept: '' },
          { qcId: 'QC001', refNumber: 'RF002', arrangeBy: 2, qcItem: 'Temperature', qcUnits: 'NUM', targetValue: '37.0', minAccept: '36.0', maxAccept: '38.0' }
        ]
      };

      service.getQcControlDetails('ALYX', 'QC').subscribe((details) => {
        expect(details.length).toBe(2);
        expect(details[0].qcItem).toBe('Check USB Port');
        expect(details[1].minAccept).toBe('36.0');
        done();
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_CONTROL_DETAILS}`
          && r.params.get('equipmentType') === 'ALYX'
          && r.params.get('qcType') === 'QC'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getQcResults', () => {
    it('should return QC results via GET', (done) => {
      const mockResponse: ApiResponse<QcResult[]> = {
        success: true,
        data: [
          { code: 'A', description: 'Acceptable' },
          { code: 'U', description: 'Unacceptable' }
        ]
      };

      service.getQcResults().subscribe((results) => {
        expect(results.length).toBe(2);
        expect(results[0].code).toBe('A');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_RESULTS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getQcHeader', () => {
    it('should return QC header by reference via GET', (done) => {
      const mockResponse: ApiResponse<QcHeaderResponse[]> = {
        success: true,
        data: [{
          equipReference: 'EQ-000292', equipmentType: 'ALYX', qcReference: 'QC-001',
          qcId: 'QC001', qcType: 'QC', qcTypeDescription: 'Quality Control',
          qcDate: '2026-06-17T08:00:00', qcTech1: 'JSMITH', qcTech2: null,
          qcResult1: 'A', qcResult1Description: 'Acceptable', qcResult2: null,
          qcResult2Description: null, qcStatus: 'A', qcStatusDescription: 'Acceptable',
          insertDate: '2026-06-17', lastModifiedDate: '2026-06-17', modifiedBy: 'JSMITH'
        }]
      };

      service.getQcHeader('QC-001').subscribe((headers) => {
        expect(headers.length).toBe(1);
        expect(headers[0].qcReference).toBe('QC-001');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_HEADER('QC-001')}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getQcDetails', () => {
    it('should return QC details by reference via GET', (done) => {
      const mockResponse: ApiResponse<QcDetailResponse[]> = {
        success: true,
        data: [{
          qcReference: 'QC-001', qcId: 'QC001', arrangeBy: 1,
          expectedValue: 'GOOD', minimumValue: '', maximumValue: '',
          actualValue: 'GOOD', interpretation: 'A', interpretation2: null,
          insertDate: '2026-06-17', insertedBy: 'JSMITH'
        }]
      };

      service.getQcDetails('QC-001').subscribe((details) => {
        expect(details.length).toBe(1);
        expect(details[0].actualValue).toBe('GOOD');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_DETAILS('QC-001')}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getQcEvents', () => {
    it('should return QC events for equipment reference via GET', (done) => {
      const mockResponse: ApiResponse<QcEvent[]> = {
        success: true,
        data: [{ qcReference: 'QC-001', qcType: 'QC', qcDate: '2026-06-17', qcStatus: 'A' }]
      };

      service.getQcEvents('EQ-000292').subscribe((events) => {
        expect(events.length).toBe(1);
        expect(events[0].qcReference).toBe('QC-001');
        done();
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_EVENTS}`
          && r.params.get('equipmentReference') === 'EQ-000292'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUsers', () => {
    it('should return system users via GET', (done) => {
      const mockResponse: ApiResponse<SystemUser[]> = {
        success: true,
        data: [{ userId: 'JSMITH', userName: 'John Smith' }]
      };

      service.getUsers().subscribe((users) => {
        expect(users.length).toBe(1);
        expect(users[0].userId).toBe('JSMITH');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.USERS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('parseBarcode', () => {
    it('should parse barcode via POST', (done) => {
      const mockResponse: ApiResponse<BarcodeResponse[]> = {
        success: true,
        data: [{ equipmentReference: 'EQ-000292', equipmentType: 'ALYX', equipmentId: 'DEV001', isValid: true }]
      };

      service.parseBarcode('ABC123').subscribe((result) => {
        expect(result.isValid).toBeTrue();
        expect(result.equipmentReference).toBe('EQ-000292');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.PARSE_BARCODE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ barcode: 'ABC123' });
      req.flush(mockResponse);
    });
  });

  describe('createQcHeader', () => {
    it('should create QC header via POST', (done) => {
      const request: CreateQcRequest = {
        equipmentReference: 'EQ-000292', equipmentType: 'ALYX', qcType: 'QC',
        qcTech1: 'JSMITH', qcDate: '2026-06-17T08:00:00', qcResult1: 'A',
        details: [{ qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, actualValue: 'GOOD', interpretation: null, interpretation2: null }]
      };

      const mockResponse: CreateQcResponse = {
        success: true, message: 'QC event created', statusCode: 200,
        item: { qcReference: 'QC-002', qcStatus: 'A' }
      };

      service.createQcHeader(request).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.item.qcReference).toBe('QC-002');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.CREATE_QC_HEADER}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('updateQcHeader', () => {
    it('should update QC header via PUT', (done) => {
      const request: UpdateQcHeaderRequest = {
        qcType: 'QC', qcDate: '2026-06-17T08:00:00', qcTech1: 'JSMITH', qcResult1: 'A'
      };

      const mockResponse: ApiResponse<{ qcReference: string; rowsAffected: number; qcStatus: string }> = {
        success: true,
        data: { qcReference: 'QC-001', rowsAffected: 1, qcStatus: 'A' }
      };

      service.updateQcHeader('QC-001', request).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.rowsAffected).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_HEADER('QC-001')}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('updateQcDetails', () => {
    it('should update QC details via PUT', (done) => {
      const request: UpdateQcDetailsRequest = {
        details: [{ qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, actualValue: 'FAIL', interpretation: 'N', interpretation2: null }]
      };

      const mockResponse: ApiResponse<unknown> = { success: true, data: null };

      service.updateQcDetails('QC-001', request).subscribe((response) => {
        expect(response.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_DETAILS('QC-001')}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });
});
