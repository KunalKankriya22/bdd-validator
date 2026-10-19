import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DriveEquipmentParametersService } from './drive-equipment-parameters.service';
import {
  MasterCodeModel,
  DriveProfileCreateDto,
  DriveProfileUpdateDto,
  QcParametersCreateDto,
  QcParametersUpdateDto,
  QcDependencyCreateDto,
  QcDependencyUpdateDto,
  PhysicalEquipmentCreateDto,
  PhysicalEquipmentUpdateDto
} from '../models/drive-equipment-parameters.model';
import { ApiService } from '@shared/services/api.service';
import { ValidMasterCodesService } from '@shared/services/valid-master-codes.service';

describe('DriveEquipmentParametersService', () => {
  let service: DriveEquipmentParametersService;
  let httpMock: HttpTestingController;
  let mockMasterCodesService: jasmine.SpyObj<ValidMasterCodesService>;

  beforeEach(() => {
    mockMasterCodesService = jasmine.createSpyObj('ValidMasterCodesService', ['getByCodeType']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DriveEquipmentParametersService,
        ApiService,
        { provide: ValidMasterCodesService, useValue: mockMasterCodesService }
      ]
    });

    service = TestBed.inject(DriveEquipmentParametersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─────────────────────────────────────────────────────────
  // DRIVE PROFILE
  // ─────────────────────────────────────────────────────────

  describe('getDriveProfiles', () => {
    it('should POST to correct paginated endpoint and return mapped data', (done) => {
      const mockResponse = {
        data: [
          {
            deviceType: 'EQUIP',
            driveProfileType: 'TYPE1',
            driveProfileTypeDescription: 'Type One',
            code: 'C1',
            codeDescription: 'Code One',
            effectiveDate: '2026-01-01',
            terminationDate: null,
            modificationDate: '2026-02-01'
          }
        ],
        total: 1
      };

      service.getDriveProfiles(25, 0, { searchKeyword: 'test' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].deviceType).toBe('EQUIP');
        expect(result.data[0].driveProfileType).toBe('TYPE1');
        expect(result.data[0].driveProfileTypeDescription).toBe('Type One');
        expect(result.data[0].code).toBe('C1');
        expect(result.data[0].codeDescription).toBe('Code One');
        expect(result.data[0].effectiveDate).toBe('2026-01-01');
        expect(result.data[0].terminationDate).toBeFalsy();
        expect(result.data[0].modificationDate).toBe('2026-02-01');
        expect(result.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile/25/0') && req.method === 'POST'
      );
      expect(req.request.body).toEqual({ searchKeyword: 'test' });
      req.flush(mockResponse);
    });

    it('should transform PascalCase response fields to camelCase', (done) => {
      const mockResponse = {
        data: [
          {
            DeviceType: 'SUPLY',
            DriveProfileType: 'TYPE2',
            DriveProfileTypeDescription: 'Type Two',
            Code: 'C2',
            CodeDescription: 'Code Two',
            EffectiveDate: '2026-03-01',
            TerminationDate: '2027-01-01',
            LastModifiedDate: '2026-04-01'
          }
        ],
        total: 1
      };

      service.getDriveProfiles(10, 5, {}).subscribe(result => {
        expect(result.data[0].deviceType).toBe('SUPLY');
        expect(result.data[0].driveProfileType).toBe('TYPE2');
        expect(result.data[0].driveProfileTypeDescription).toBe('Type Two');
        expect(result.data[0].code).toBe('C2');
        expect(result.data[0].codeDescription).toBe('Code Two');
        expect(result.data[0].effectiveDate).toBe('2026-03-01');
        expect(result.data[0].terminationDate).toBe('2027-01-01');
        expect(result.data[0].modificationDate).toBe('2026-04-01');
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile/10/5') && req.method === 'POST'
      );
      req.flush(mockResponse);
    });

    it('should use driveProfileCode fallback for driveProfileType', (done) => {
      const mockResponse = {
        data: [{ driveProfileCode: 'FALLBACK_CODE' }],
        total: 1
      };

      service.getDriveProfiles(10, 0, {}).subscribe(result => {
        expect(result.data[0].driveProfileType).toBe('FALLBACK_CODE');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile'));
      req.flush(mockResponse);
    });

    it('should handle response with no data property', (done) => {
      service.getDriveProfiles(10, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(0);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile'));
      req.flush({});
    });

    it('should handle empty data array', (done) => {
      service.getDriveProfiles(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile'));
      req.flush({ data: [], total: 0 });
    });

    it('should propagate HTTP error', (done) => {
      service.getDriveProfiles(10, 0, {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createDriveProfile', () => {
    it('should send POST to correct endpoint with payload', (done) => {
      const dto: DriveProfileCreateDto = {
        deviceType: 'EQUIP',
        driveProfileType: 'TYPE1',
        code: 'C1',
        effectiveDate: '2026-01-01'
      };

      service.createDriveProfile(dto).subscribe(res => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile') && req.method === 'POST'
      );
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });

    it('should include optional terminationDate when provided', (done) => {
      const dto: DriveProfileCreateDto = {
        deviceType: 'EQUIP',
        driveProfileType: 'TYPE1',
        code: 'C1',
        effectiveDate: '2026-01-01',
        terminationDate: '2027-12-31'
      };

      service.createDriveProfile(dto).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile') && req.method === 'POST'
      );
      expect(req.request.body.terminationDate).toBe('2027-12-31');
      req.flush({ success: true });
    });

    it('should propagate HTTP error', (done) => {
      service.createDriveProfile({
        deviceType: 'X', driveProfileType: 'Y', code: 'Z', effectiveDate: '2026-01-01'
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(409);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile') && req.method === 'POST'
      );
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateDriveProfile', () => {
    it('should send PUT to correct endpoint with payload', (done) => {
      const dto: DriveProfileUpdateDto = {
        OriginalCode: 'C1',
        originalEffectiveDate: '2026-01-01',
        deviceType: 'EQUIP',
        driveProfileType: 'TYPE1',
        code: 'C1_UPDATED',
        effectiveDate: '2026-02-01'
      };

      service.updateDriveProfile(dto).subscribe(res => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile') && req.method === 'PUT'
      );
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });

    it('should include optional terminationDate when provided', (done) => {
      const dto: DriveProfileUpdateDto = {
        OriginalCode: 'C1',
        originalEffectiveDate: '2026-01-01',
        deviceType: 'EQUIP',
        driveProfileType: 'TYPE1',
        code: 'C1',
        effectiveDate: '2026-01-01',
        terminationDate: '2027-06-30'
      };

      service.updateDriveProfile(dto).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile') && req.method === 'PUT'
      );
      expect(req.request.body.terminationDate).toBe('2027-06-30');
      req.flush({ success: true });
    });

    it('should propagate HTTP error', (done) => {
      service.updateDriveProfile({
        OriginalCode: 'C1', originalEffectiveDate: '2026-01-01',
        deviceType: 'X', driveProfileType: 'Y', code: 'Z', effectiveDate: '2026-01-01'
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile') && req.method === 'PUT'
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDeviceTypes', () => {
    it('should return string array of device types', (done) => {
      const mockResponse = { data: ['EQUIP', 'SUPLY'] };

      service.getDeviceTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types).toContain('EQUIP');
        expect(types).toContain('SUPLY');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/device-types'));
      req.flush(mockResponse);
    });

    it('should handle empty device types', (done) => {
      service.getDeviceTypes().subscribe(types => {
        expect(types.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/device-types'));
      req.flush({ data: [] });
    });

    it('should handle response without data property', (done) => {
      service.getDeviceTypes().subscribe(types => {
        expect(types).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/device-types'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getDeviceTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(503);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/device-types'));
      req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('getDriveProfileTypes', () => {
    it('should fetch and map drive profile types with camelCase response', (done) => {
      const mockResponse = {
        data: [
          { code: 'DPT1', description: 'Drive Profile Type 1', codeType: 'DPTYPE', effectiveDate: '2026-01-01' },
          { code: 'DPT2', description: 'Drive Profile Type 2', codeType: 'DPTYPE', effectiveDate: '2026-01-01' }
        ]
      };

      service.getDriveProfileTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('DPT1');
        expect(types[0].description).toBe('Drive Profile Type 1');
        expect(types[0].codeType).toBe('DPTYPE');
        expect(types[0].effectiveDate).toBe('2026-01-01');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/types'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map PascalCase response to camelCase', (done) => {
      const mockResponse = {
        data: [
          { Code: 'DPT1', Description: 'Drive Profile Type 1', CodeType: 'DPTYPE', EffectiveDate: '2026-02-01' }
        ]
      };

      service.getDriveProfileTypes().subscribe(types => {
        expect(types[0].code).toBe('DPT1');
        expect(types[0].description).toBe('Drive Profile Type 1');
        expect(types[0].codeType).toBe('DPTYPE');
        expect(types[0].effectiveDate).toBe('2026-02-01');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/types'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getDriveProfileTypes().subscribe(types => {
        expect(types).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/types'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getDriveProfileTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/types'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getCodes', () => {
    it('should fetch codes without deviceType filter', (done) => {
      const mockResponse = {
        data: [
          { code: 'CODE1', description: 'Code 1', codeType: 'CT', effectiveDate: '2026-01-01' }
        ]
      };

      service.getCodes().subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].code).toBe('CODE1');
        expect(codes[0].description).toBe('Code 1');
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile/codes') && !req.params.has('deviceType')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch codes with deviceType filter', (done) => {
      const mockResponse = {
        data: [
          { code: 'CODE2', description: 'Code 2', codeType: 'CT', effectiveDate: '2026-01-01' }
        ]
      };

      service.getCodes('EQUIP').subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].code).toBe('CODE2');
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/drive-profile/codes') && req.params.get('deviceType') === 'EQUIP'
      );
      req.flush(mockResponse);
    });

    it('should map PascalCase response to camelCase', (done) => {
      const mockResponse = {
        data: [
          { Code: 'C3', Description: 'Code Three', CodeType: 'CTYPE', EffectiveDate: '2026-05-01' }
        ]
      };

      service.getCodes().subscribe(codes => {
        expect(codes[0].code).toBe('C3');
        expect(codes[0].description).toBe('Code Three');
        expect(codes[0].codeType).toBe('CTYPE');
        expect(codes[0].effectiveDate).toBe('2026-05-01');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/codes'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getCodes().subscribe(codes => {
        expect(codes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/codes'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getCodes('EQUIP').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/codes'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // QC PARAMETERS
  // ─────────────────────────────────────────────────────────

  describe('getQcParameters', () => {
    it('should POST to paginated endpoint and return mapped data', (done) => {
      const mockResponse = {
        data: [
          {
            deviceType: 'EQUIP',
            equipmentSupply: 'ALYX',
            sortSequence: 1,
            qcParameterCode: 'TEMP',
            qcParameterDescription: 'Temperature',
            qcCheckCode: 'KRNG',
            qcCheckDescription: 'Range Check',
            dataType: 'N',
            qcTargetValue: '100',
            qcTargetValueDescription: 'Target 100',
            childSequence: 2,
            rangeFlag: 'Y',
            rangeDetailsValue: 5,
            scanRequest: 'N',
            scanWhat: null,
            scanWhatDescription: null,
            equipmentType: 'E1',
            effectiveDate: '2026-01-01',
            terminationDate: null,
            auditKey: 42,
            programId: 'PGM1',
            insertUser: 'admin',
            insertDate: '2026-01-01'
          }
        ],
        total: 1
      };

      service.getQcParameters(25, 0, { deviceType: 'EQUIP' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        const item = result.data[0];
        expect(item.deviceType).toBe('EQUIP');
        expect(item.equipmentSupply).toBe('ALYX');
        expect(item.sortSequence).toBe(1);
        expect(item.qcParameterCode).toBe('TEMP');
        expect(item.qcParameterDescription).toBe('Temperature');
        expect(item.qcCheckCode).toBe('KRNG');
        expect(item.dataType).toBe('N');
        expect(item.qcTargetValue).toBe('100');
        expect(item.childSequence).toBe(2);
        expect(item.rangeFlag).toBe('Y');
        expect(item.rangeDetailsValue).toBe(5);
        expect(item.scanRequest).toBe('N');
        expect(item.equipmentType).toBe('E1');
        expect(item.auditKey).toBe(42);
        expect(item.programId).toBe('PGM1');
        expect(item.insertUser).toBe('admin');
        expect(result.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-parameters/25/0') && req.method === 'POST'
      );
      expect(req.request.body).toEqual({ deviceType: 'EQUIP' });
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcParameters(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/10/0'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcParameters(10, 0, {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/10/0'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcParameterCodes', () => {
    it('should fetch QC parameter codes', (done) => {
      const mockResponse = {
        data: [
          { code: 'TEMP', description: 'Temperature', codeType: 'QC', effectiveDate: '2026-01-01' },
          { code: 'PRES', description: 'Pressure', codeType: 'QC', effectiveDate: '2026-01-01' }
        ],
        total: 2
      };

      service.getQcParameterCodes().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].code).toBe('TEMP');
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-parameter-codes'));
      req.flush(mockResponse);
    });

    it('should fall back to data.length when total is missing', (done) => {
      const mockResponse = {
        data: [
          { code: 'TEMP', description: 'Temperature', codeType: 'QC', effectiveDate: '2026-01-01' }
        ]
      };

      service.getQcParameterCodes().subscribe(response => {
        expect(response.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-parameter-codes'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcParameterCodes().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-parameter-codes'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcParameterCodes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-parameter-codes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcCheckCodes', () => {
    it('should fetch QC check codes', (done) => {
      const mockResponse = {
        data: [
          { code: 'KRNG', description: 'Range Check' },
          { code: 'KVAL', description: 'Value Check' }
        ]
      };

      service.getQcCheckCodes().subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].code).toBe('KRNG');
        expect(codes[0].description).toBe('Range Check');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-check-codes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcCheckCodes().subscribe(codes => {
        expect(codes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-check-codes'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcCheckCodes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-check-codes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getEquipmentSupplyCodes', () => {
    it('should fetch equipment supply codes with deviceType param', (done) => {
      const mockResponse = {
        data: [
          { code: 'ALYX', description: 'Alyx' },
          { code: 'TRMA', description: 'Trima' }
        ]
      };

      service.getEquipmentSupplyCodes('EQUIP').subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].code).toBe('ALYX');
        expect(codes[1].code).toBe('TRMA');
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-parameters/equipment-supply') &&
        req.params.get('deviceType') === 'EQUIP'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getEquipmentSupplyCodes('EQUIP').subscribe(codes => {
        expect(codes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/equipment-supply'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getEquipmentSupplyCodes('EQUIP').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/equipment-supply'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getQcDataTypes', () => {
    it('should return MasterCodeModel array', (done) => {
      const mockResponse = {
        data: [
          { code: 'C', description: 'Character' },
          { code: 'D', description: 'Date' },
          { code: 'N', description: 'Number' }
        ]
      };

      service.getQcDataTypes().subscribe(types => {
        expect(types.length).toBe(3);
        expect(types[0].code).toBe('C');
        expect(types[0].description).toBe('Character');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/data-types'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcDataTypes().subscribe(types => {
        expect(types.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/data-types'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcDataTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/data-types'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcValueTypes', () => {
    it('should fetch and map QC value types with total', (done) => {
      const mockResponse = {
        data: [
          { code: 'VT1', description: 'Value Type 1', codeType: 'QCVT', effectiveDate: '2026-01-01' },
          { code: 'VT2', description: 'Value Type 2', codeType: 'QCVT', effectiveDate: '2026-01-01' }
        ],
        total: 2
      };

      service.getQcValueTypes().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].code).toBe('VT1');
        expect(response.data[0].description).toBe('Value Type 1');
        expect(response.data[0].codeType).toBe('QCVT');
        expect(response.data[0].effectiveDate).toBe('2026-01-01');
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/value-types'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data.length when total is missing', (done) => {
      const mockResponse = {
        data: [
          { code: 'VT1', description: 'Value Type 1', codeType: 'QCVT', effectiveDate: '2026-01-01' }
        ]
      };

      service.getQcValueTypes().subscribe(response => {
        expect(response.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/value-types'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcValueTypes().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/value-types'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcValueTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/value-types'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcTargetValues', () => {
    it('should fetch QC target values', (done) => {
      const mockResponse = {
        data: [
          { code: 'TV1', description: 'Target Value 1' },
          { code: 'TV2', description: 'Target Value 2' }
        ]
      };

      service.getQcTargetValues().subscribe(values => {
        expect(values.length).toBe(2);
        expect(values[0].code).toBe('TV1');
        expect(values[0].description).toBe('Target Value 1');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-target-values'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcTargetValues().subscribe(values => {
        expect(values).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-target-values'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcTargetValues().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/qc-target-values'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcEquipmentTypes', () => {
    it('should fetch and map QC equipment types with total', (done) => {
      const mockResponse = {
        data: [
          { code: 'ET1', description: 'Equipment Type 1', codeType: 'QCET', effectiveDate: '2026-01-01' },
          { code: 'ET2', description: 'Equipment Type 2', codeType: 'QCET', effectiveDate: '2026-01-01' }
        ],
        total: 2
      };

      service.getQcEquipmentTypes().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].code).toBe('ET1');
        expect(response.data[0].description).toBe('Equipment Type 1');
        expect(response.data[0].codeType).toBe('QCET');
        expect(response.data[0].effectiveDate).toBe('2026-01-01');
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/equipment-types'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data.length when total is missing', (done) => {
      const mockResponse = {
        data: [
          { code: 'ET1', description: 'Equipment Type 1', codeType: 'QCET', effectiveDate: '2026-01-01' },
          { code: 'ET2', description: 'Equipment Type 2', codeType: 'QCET', effectiveDate: '2026-01-01' },
          { code: 'ET3', description: 'Equipment Type 3', codeType: 'QCET', effectiveDate: '2026-01-01' }
        ]
      };

      service.getQcEquipmentTypes().subscribe(response => {
        expect(response.totalRecords).toBe(3);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/equipment-types'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcEquipmentTypes().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/equipment-types'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcEquipmentTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters/equipment-types'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createQcParameters', () => {
    it('should send POST request with correct payload', (done) => {
      const mockDto: QcParametersCreateDto = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        dataType: 'N',
        qcTargetValue: '100',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: '2026-03-14'
      };

      const mockResponse = { success: true, message: 'Created' };

      service.createQcParameters(mockDto).subscribe(response => {
        expect(response.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters') && req.method === 'POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockResponse);
    });

    it('should handle creation with optional fields', (done) => {
      const mockDto: QcParametersCreateDto = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        dataType: 'C',
        rangeFlag: 'Y',
        rangeDetailsValue: 5,
        scanRequest: 'Y',
        scanWhat: 'BARCODE',
        equipmentType: 'E1',
        effectiveDate: '2026-03-14',
        terminationDate: '2026-12-31'
      };

      const mockResponse = { success: true, message: 'Created' };

      service.createQcParameters(mockDto).subscribe(response => {
        expect(response.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters') && req.method === 'POST');
      expect(req.request.body.rangeDetailsValue).toBe(5);
      expect(req.request.body.scanWhat).toBe('BARCODE');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.createQcParameters({
        deviceType: 'X', equipmentSupply: 'Y', qcParameterCode: 'Z',
        qcCheckCode: 'W', dataType: 'N', rangeFlag: 'N', scanRequest: 'N',
        effectiveDate: '2026-01-01'
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(409);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters') && req.method === 'POST');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateQcParameters', () => {
    it('should send PUT request with correct payload', (done) => {
      const mockDto: QcParametersUpdateDto = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        sortSequence: 2,
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        dataType: 'C',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: '2026-03-14',
        terminationDate: '2026-12-31',
        auditKey: 123
      };

      const mockResponse = { success: true, message: 'Updated' };

      service.updateQcParameters(mockDto).subscribe(response => {
        expect(response.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters') && req.method === 'PUT');
      expect(req.request.body.auditKey).toBe(123);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.updateQcParameters({
        deviceType: 'X', equipmentSupply: 'Y', sortSequence: 1,
        qcParameterCode: 'Z', qcCheckCode: 'W', dataType: 'N',
        rangeFlag: 'N', scanRequest: 'N', effectiveDate: '2026-01-01', auditKey: 1
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-parameters') && req.method === 'PUT');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // QC DEPENDENCY
  // ─────────────────────────────────────────────────────────

  describe('getQcDependencies', () => {
    it('should POST to paginated endpoint and return mapped data', (done) => {
      const mockResponse = {
        data: [
          {
            deviceType: 'EQUIP',
            equipmentSupplyCode: 'ALYX',
            sourceParamCode: 'SRC1',
            sourceParamDescription: 'Source One',
            dependentCode: 'DEP1',
            dependentDescription: 'Dependent One',
            effectiveDate: '2026-01-01',
            terminationDate: null,
            auditKey: 10,
            programId: 'PGM1',
            insertUser: 'admin',
            insertDate: '2026-01-01'
          }
        ],
        total: 1
      };

      service.getQcDependencies(25, 0, { deviceType: 'EQUIP' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        const item = result.data[0];
        expect(item.deviceType).toBe('EQUIP');
        expect(item.equipmentSupplyCode).toBe('ALYX');
        expect(item.sourceParamCode).toBe('SRC1');
        expect(item.sourceParamDescription).toBe('Source One');
        expect(item.dependentCode).toBe('DEP1');
        expect(item.dependentDescription).toBe('Dependent One');
        expect(item.auditKey).toBe(10);
        expect(item.programId).toBe('PGM1');
        expect(item.insertUser).toBe('admin');
        expect(result.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency/25/0') && req.method === 'POST'
      );
      expect(req.request.body).toEqual({ deviceType: 'EQUIP' });
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcDependencies(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/10/0'));
      req.flush({});
    });

    it('should handle empty data array', (done) => {
      service.getQcDependencies(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/10/0'));
      req.flush({ data: [], total: 0 });
    });

    it('should propagate HTTP error', (done) => {
      service.getQcDependencies(10, 0, {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/10/0'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcDependencySourceParamCodes', () => {
    it('should fetch and map source param codes with total', (done) => {
      const mockResponse = {
        data: [
          { code: 'SRC1', description: 'Source 1', codeType: 'QCSP', effectiveDate: '2026-01-01' },
          { code: 'SRC2', description: 'Source 2', codeType: 'QCSP', effectiveDate: '2026-01-01' }
        ],
        total: 2
      };

      service.getQcDependencySourceParamCodes().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].code).toBe('SRC1');
        expect(response.data[0].description).toBe('Source 1');
        expect(response.data[0].codeType).toBe('QCSP');
        expect(response.data[0].effectiveDate).toBe('2026-01-01');
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/source-param-codes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data.length when total is missing', (done) => {
      const mockResponse = {
        data: [
          { code: 'SRC1', description: 'Source 1', codeType: 'QCSP', effectiveDate: '2026-01-01' }
        ]
      };

      service.getQcDependencySourceParamCodes().subscribe(response => {
        expect(response.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/source-param-codes'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcDependencySourceParamCodes().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/source-param-codes'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcDependencySourceParamCodes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/source-param-codes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcDependencyDependentParamCodes', () => {
    it('should fetch and map dependent param codes with total', (done) => {
      const mockResponse = {
        data: [
          { code: 'DEP1', description: 'Dependent 1', codeType: 'QCDP', effectiveDate: '2026-01-01' },
          { code: 'DEP2', description: 'Dependent 2', codeType: 'QCDP', effectiveDate: '2026-01-01' }
        ],
        total: 2
      };

      service.getQcDependencyDependentParamCodes().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].code).toBe('DEP1');
        expect(response.data[0].description).toBe('Dependent 1');
        expect(response.data[0].codeType).toBe('QCDP');
        expect(response.data[0].effectiveDate).toBe('2026-01-01');
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/dependent-param-codes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data.length when total is missing', (done) => {
      const mockResponse = {
        data: [
          { code: 'DEP1', description: 'Dependent 1', codeType: 'QCDP', effectiveDate: '2026-01-01' },
          { code: 'DEP2', description: 'Dependent 2', codeType: 'QCDP', effectiveDate: '2026-01-01' }
        ]
      };

      service.getQcDependencyDependentParamCodes().subscribe(response => {
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/dependent-param-codes'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getQcDependencyDependentParamCodes().subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/dependent-param-codes'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getQcDependencyDependentParamCodes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/qc-dependency/dependent-param-codes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createQcDependency', () => {
    it('should send POST to correct endpoint with payload', (done) => {
      const dto: QcDependencyCreateDto = {
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'SRC1',
        dependentCode: 'DEP1',
        effectiveDate: '2026-01-01'
      };

      service.createQcDependency(dto).subscribe(res => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency') && req.method === 'POST'
      );
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });

    it('should include optional terminationDate when provided', (done) => {
      const dto: QcDependencyCreateDto = {
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'SRC1',
        dependentCode: 'DEP1',
        effectiveDate: '2026-01-01',
        terminationDate: '2027-12-31'
      };

      service.createQcDependency(dto).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency') && req.method === 'POST'
      );
      expect(req.request.body.terminationDate).toBe('2027-12-31');
      req.flush({ success: true });
    });

    it('should propagate HTTP error', (done) => {
      service.createQcDependency({
        deviceType: 'X', equipmentSupplyCode: 'Y',
        sourceParamCode: 'Z', dependentCode: 'W', effectiveDate: '2026-01-01'
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(409);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency') && req.method === 'POST'
      );
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateQcDependency', () => {
    it('should send PUT to correct endpoint with payload', (done) => {
      const dto: QcDependencyUpdateDto = {
        auditKey: 42,
        sourceParamCode: 'SRC1',
        dependentCode: 'DEP1',
        effectiveDate: '2026-01-01'
      };

      service.updateQcDependency(dto).subscribe(res => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency') && req.method === 'PUT'
      );
      expect(req.request.body).toEqual(dto);
      expect(req.request.body.auditKey).toBe(42);
      req.flush({ success: true });
    });

    it('should include optional terminationDate when provided', (done) => {
      const dto: QcDependencyUpdateDto = {
        auditKey: 42,
        sourceParamCode: 'SRC1',
        dependentCode: 'DEP1',
        effectiveDate: '2026-01-01',
        terminationDate: '2027-06-30'
      };

      service.updateQcDependency(dto).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency') && req.method === 'PUT'
      );
      expect(req.request.body.terminationDate).toBe('2027-06-30');
      req.flush({ success: true });
    });

    it('should propagate HTTP error', (done) => {
      service.updateQcDependency({
        auditKey: 1, sourceParamCode: 'X', dependentCode: 'Y', effectiveDate: '2026-01-01'
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/qc-dependency') && req.method === 'PUT'
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // PHYSICAL EQUIPMENT
  // ─────────────────────────────────────────────────────────

  describe('getPhysicalEquipment', () => {
    it('should map auditKey from API response', (done) => {
      const mockResponse = {
        data: [
          {
            physicalCode: 'ARMCK',
            physicalCodeDescription: 'Arm Check',
            equipmentType: 'BPT',
            equipmentTypeDescription: 'BP, Pulse, Temp',
            effectiveDate: '2026-01-01',
            terminationDate: null,
            auditKey: 99
          }
        ],
        total: 1
      };

      service.getPhysicalEquipment(25, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].auditKey).toBe(99);
        expect(result.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment/25/0') && req.method === 'POST'
      );
      req.flush(mockResponse);
    });

    it('should include all core fields in mapped response', (done) => {
      const mockResponse = {
        data: [{
          physicalCode: 'PULSE',
          physicalCodeDescription: 'Pulse',
          equipmentType: 'THER',
          equipmentTypeDescription: 'Thermometer',
          effectiveDate: '2026-03-01',
          terminationDate: '2027-12-31',
          auditKey: 7
        }],
        total: 1
      };

      service.getPhysicalEquipment(10, 0, {}).subscribe(result => {
        const item = result.data[0];
        expect(item.physicalCode).toBe('PULSE');
        expect(item.equipmentType).toBe('THER');
        expect(item.terminationDate).toBe('2027-12-31');
        expect(item.auditKey).toBe(7);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/physical-equipment'));
      req.flush(mockResponse);
    });

    it('should handle response without data property', (done) => {
      service.getPhysicalEquipment(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/physical-equipment'));
      req.flush({});
    });

    it('should propagate HTTP error', (done) => {
      service.getPhysicalEquipment(10, 0, {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/physical-equipment'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getPhysicalEquipmentFilters', () => {
    it('should GET physical equipment filter options', (done) => {
      const mockResponse = {
        Success: true,
        Data: [{ code: 'F1', description: 'Filter 1' }],
        Total: 1
      };

      service.getPhysicalEquipmentFilters().subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/physical-equipment/filters'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getPhysicalEquipmentFilters().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/physical-equipment/filters'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // Physical Equipment - dropdowns via ValidMasterCodesService
  // ─────────────────────────────────────────────────────────
  describe('getPhysicalCodes', () => {
    it('should call getByCodeType with PHYCD', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(of([
        { code: 'ARMCK', description: 'Arm Check' },
        { code: 'PULSE', description: 'Pulse' }
      ]));

      service.getPhysicalCodes().subscribe(codes => {
        expect(mockMasterCodesService.getByCodeType).toHaveBeenCalledWith('PHYCD');
        expect(codes.length).toBe(2);
        done();
      });
    });

    it('should map items to PhysicalCodeOption with codeType PHYCD', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(of([
        { code: 'ARMCK', description: 'Arm Check' }
      ]));

      service.getPhysicalCodes().subscribe(codes => {
        expect(codes[0].code).toBe('ARMCK');
        expect(codes[0].description).toBe('Arm Check');
        expect(codes[0].codeType).toBe('PHYCD');
        done();
      });
    });

    it('should handle empty array from ValidMasterCodesService', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(of([]));

      service.getPhysicalCodes().subscribe(codes => {
        expect(codes).toEqual([]);
        done();
      });
    });

    it('should propagate error from ValidMasterCodesService', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(throwError(() => ({ status: 500 })));

      service.getPhysicalCodes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );
    });
  });

  describe('getEquipmentTypesForPhysical', () => {
    it('should call getByCodeType with DREQP', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(of([
        { code: 'BPT', description: 'BP, Pulse, Temp' }
      ]));

      service.getEquipmentTypesForPhysical().subscribe(types => {
        expect(mockMasterCodesService.getByCodeType).toHaveBeenCalledWith('DREQP');
        expect(types.length).toBe(1);
        done();
      });
    });

    it('should map items to EquipmentTypeOption with codeType DREQP', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(of([
        { code: 'THER', description: 'Thermometer' }
      ]));

      service.getEquipmentTypesForPhysical().subscribe(types => {
        expect(types[0].code).toBe('THER');
        expect(types[0].description).toBe('Thermometer');
        expect(types[0].codeType).toBe('DREQP');
        done();
      });
    });

    it('should handle empty array from ValidMasterCodesService', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(of([]));

      service.getEquipmentTypesForPhysical().subscribe(types => {
        expect(types).toEqual([]);
        done();
      });
    });

    it('should propagate error from ValidMasterCodesService', (done) => {
      mockMasterCodesService.getByCodeType.and.returnValue(throwError(() => ({ status: 503 })));

      service.getEquipmentTypesForPhysical().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(503);
          done();
        }
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // Physical Equipment - create (equipType, no chapterId)
  // ─────────────────────────────────────────────────────────
  describe('createPhysicalEquipment', () => {
    it('should send POST to /api/v1/admin/physical-equipment', (done) => {
      const dto: PhysicalEquipmentCreateDto = {
        physicalCode: 'ARMCK',
        equipType: 'BPT',
        effectiveDate: '2026-05-01'
      };

      service.createPhysicalEquipment(dto).subscribe(res => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment') && req.method === 'POST'
      );
      expect(req.request.body.equipType).toBe('BPT');
      expect(req.request.body.equipmentType).toBeUndefined();
      expect(req.request.body.chapterId).toBeUndefined();
      req.flush({ success: true });
    });

    it('should include optional terminationDate when provided', (done) => {
      const dto: PhysicalEquipmentCreateDto = {
        physicalCode: 'PULSE',
        equipType: 'THER',
        effectiveDate: '2026-01-01',
        terminationDate: '2027-12-31'
      };

      service.createPhysicalEquipment(dto).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment') && req.method === 'POST'
      );
      expect(req.request.body.terminationDate).toBe('2027-12-31');
      req.flush({ success: true });
    });

    it('should propagate HTTP error', (done) => {
      service.createPhysicalEquipment({
        physicalCode: 'X',
        equipType: 'Y',
        effectiveDate: '2026-01-01'
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(409);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment') && req.method === 'POST'
      );
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // Physical Equipment - update (equipType, no effectiveDate)
  // ─────────────────────────────────────────────────────────
  describe('updatePhysicalEquipment', () => {
    it('should send PUT with equipType and auditKey', (done) => {
      const dto: PhysicalEquipmentUpdateDto = {
        physicalCode: 'ARMCK',
        equipType: 'THER',
        auditKey: 42
      };

      service.updatePhysicalEquipment(dto).subscribe(res => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment') && req.method === 'PUT'
      );
      expect(req.request.body.equipType).toBe('THER');
      expect(req.request.body.auditKey).toBe(42);
      expect(req.request.body.equipmentType).toBeUndefined();
      expect(req.request.body.effectiveDate).toBeUndefined();
      req.flush({ success: true });
    });

    it('should include optional terminationDate when provided', (done) => {
      const dto: PhysicalEquipmentUpdateDto = {
        physicalCode: 'ARMCK',
        equipType: 'BPT',
        auditKey: 10,
        terminationDate: '2026-12-31'
      };

      service.updatePhysicalEquipment(dto).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment') && req.method === 'PUT'
      );
      expect(req.request.body.terminationDate).toBe('2026-12-31');
      req.flush({ success: true });
    });

    it('should propagate HTTP error', (done) => {
      service.updatePhysicalEquipment({
        physicalCode: 'X', equipType: 'Y', auditKey: 1
      }).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment') && req.method === 'PUT'
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // Physical Equipment - delete
  // ─────────────────────────────────────────────────────────
  describe('deletePhysicalEquipment', () => {
    it('should send DELETE to /api/v1/admin/physical-equipment/{auditKey}', (done) => {
      service.deletePhysicalEquipment(99).subscribe(() => done());

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment/99') && req.method === 'DELETE'
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should propagate HTTP error on delete failure', (done) => {
      service.deletePhysicalEquipment(55).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne(req =>
        req.url.includes('/api/v1/admin/physical-equipment/55') && req.method === 'DELETE'
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ─────────────────────────────────────────────────────────
  // Error Handling (general)
  // ─────────────────────────────────────────────────────────
  describe('Error Handling', () => {
    it('should handle 404 errors', (done) => {
      service.getDeviceTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/admin/drive-profile/device-types'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
