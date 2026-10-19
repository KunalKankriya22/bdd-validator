import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CheckInDetailsService } from './check-in-details.service';

describe('CheckInDetailsService', () => {
  let service: CheckInDetailsService;
  let httpMock: HttpTestingController;

  const BASE = '/api/v1/check-in-details';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CheckInDetailsService,
      ],
    });
    service  = TestBed.inject(CheckInDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDriveDescription', () => {
    it('should GET drive-description and map siteName + groupSiteId', () => {
      service.getDriveDescription('DRV-001', '21-MAY-2026').subscribe(res => {
        expect(res.siteName).toBe('Main Center');
        expect(res.groupSiteId).toBe('GS-001');
      });

      const req = httpMock.expectOne(r => r.url.includes('drive-description'));
      expect(req.request.method).toBe('GET');
      req.flush({ item: { siteName: 'Main Center', groupSiteId: 'GS-001' } });
    });

  });

  describe('validateUnit', () => {
    it('should POST to validate-unit and return the item', () => {
      const mockResult = {
        unitId: 'U-001', parsedUnitId: 'U-001', alreadyCheckedIn: false, hasTubeData: false,
      };

      service.validateUnit('U-001', '21-MAY-2026', 'DRV-001').subscribe(res => {
        expect(res.unitId).toBe('U-001');
        expect(res.alreadyCheckedIn).toBeFalse();
      });

      const req = httpMock.expectOne(`${BASE}/validate-unit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'U-001', collDate: '21-MAY-2026', driveId: 'DRV-001' });
      req.flush({ item: mockResult });
    });
  });
  describe('getAttributeGroups', () => {
    it('should GET attribute-groups and map to DropdownOption', () => {
      service.getAttributeGroups().subscribe(opts => {
        expect(opts.length).toBe(1);
        expect(opts[0].value).toBe('DON');
        expect(opts[0].label).toContain('Donation');
      });

      const req = httpMock.expectOne(`${BASE}/attribute-groups`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ group: 'DON', description: 'Donation' }] });
    });

    it('should return empty array when data is absent', () => {
      service.getAttributeGroups().subscribe(opts => {
        expect(opts).toEqual([]);
      });

      const req = httpMock.expectOne(`${BASE}/attribute-groups`);
      req.flush({});
    });
  });

  describe('getAttributeCodes', () => {
    it('should GET attribute-codes and map requiresEquipment flag', () => {
      service.getAttributeCodes('DON', 'CH01').subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].value).toBe('27');
        expect(codes[0].requiresEquipment).toBeFalse();
        expect(codes[0].parmCode).toBe('');
      });

      const req = httpMock.expectOne(r => r.url.includes('attribute-codes'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ code: '27', description: 'Sample', requiresEquipment: 'N', parmCode: '' }] });
    });

    it('should set requiresEquipment true when flag is Y', () => {
      service.getAttributeCodes('PHER', 'CH01').subscribe(codes => {
        expect(codes[0].requiresEquipment).toBeTrue();
        expect(codes[0].parmCode).toBe('P001');
      });

      const req = httpMock.expectOne(r => r.url.includes('attribute-codes'));
      req.flush({ data: [{ code: 'A1', description: 'Apheresis', requiresEquipment: 'Y', parmCode: 'P001' }] });
    });
  });

  describe('getMachines', () => {
    it('should GET machines and map to MachineOption', () => {
      service.getMachines('PHER', 'A1').subscribe(machines => {
        expect(machines.length).toBe(1);
        expect(machines[0].value).toBe('EQ-001');
        expect(machines[0].donorCue).toBe('Centrifuge');
        expect(machines[0].serialNumber).toBe('SN001');
        expect(machines[0].equipType).toBe('CENT');
      });

      const req = httpMock.expectOne(r => r.url.includes('machines'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ equipType: 'CENT', description: 'Centrifuge', serialNumber: 'SN001', equipReference: 'EQ-001' }] });
    });

    it('should return empty array when data is absent', () => {
      service.getMachines('GRP', 'CODE').subscribe(m => expect(m).toEqual([]));
      const req = httpMock.expectOne(r => r.url.includes('machines'));
      req.flush({});
    });
  });

  describe('getAboValues', () => {
    it('should GET abo-values and map to DropdownOption', () => {
      service.getAboValues().subscribe(opts => {
        expect(opts.length).toBe(1);
        expect(opts[0].value).toBe('O+');
        expect(opts[0].label).toContain('O Positive');
      });

      const req = httpMock.expectOne(`${BASE}/abo-values`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ code: 'O+', description: 'O Positive' }] });
    });
  });

  describe('getChapterConfig', () => {
    it('should GET chapter-config and return maxBleedTime + slowBleedTime', () => {
      service.getChapterConfig().subscribe(cfg => {
        expect(cfg.maxBleedTime).toBe(60);
        expect(cfg.slowBleedTime).toBe(45);
      });

      const req = httpMock.expectOne(`${BASE}/chapter-config`);
      expect(req.request.method).toBe('GET');
      req.flush({ item: { maxBleedTime: 60, slowBleedTime: 45 } });
    });

  });

  describe('save', () => {
    it('should POST to check-in and return success true', () => {
      const payload = { unitId: 'U-001', collDate: '21-MAY-2026', driveId: 'DRV-001' } as any;

      service.save(payload).subscribe(res => {
        expect(res.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${BASE}/check-in`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true });
    });

    it('should return success false when response success is not true', () => {
      service.save({} as any).subscribe(res => {
        expect(res.success).toBeFalse();
      });

      const req = httpMock.expectOne(`${BASE}/check-in`);
      req.flush({ success: false });
    });

    it('should return message from API response when present', () => {
      service.save({} as any).subscribe(res => {
        expect(res.success).toBeTrue();
        expect(res.message).toBe('TRANSACTION COMMITTED');
      });

      const req = httpMock.expectOne(`${BASE}/check-in`);
      req.flush({ success: true, message: 'TRANSACTION COMMITTED' });
    });


    it('should map errorCode from API error field', () => {
      service.save({} as any).subscribe(res => {
        expect(res.success).toBeFalse();
        expect(res.errorCode).toBe('9211');
      });

      const req = httpMock.expectOne(`${BASE}/check-in`);
      req.flush({ success: false, error: '9211', message: 'Slow bleed detected.' });
    });

  });
});
