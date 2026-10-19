import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CheckInFromLabService } from './check-in-from-lab.service';
import { API } from 'src/app/core/constants/api.constants';

describe('CheckInFromLabService', () => {
  let service: CheckInFromLabService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CheckInFromLabService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CheckInFromLabService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── Inventory Classes ────────────────────────────────────────────────

  describe('getInventoryClasses', () => {
    it('should return inventory classes array', () => {
      const mockData = { data: [{ code: 'RE', description: 'Regular' }] };
      service.getInventoryClasses().subscribe((result) => {
        expect(result).toEqual([{ code: 'RE', description: 'Regular' }]);
      });
      const req = httpMock.expectOne((r) => r.url.includes('inventory-classes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should return empty array when no data', () => {
      service.getInventoryClasses().subscribe((result) => {
        expect(result).toEqual([]);
      });
      const req = httpMock.expectOne((r) => r.url.includes('inventory-classes'));
      req.flush({ data: null });
    });
  });

  // ─── Validate Unit ─────────────────────────────────────────────────────

  describe('validateUnit', () => {
    it('should POST and return normalized response on success', () => {
      const mockRes = { success: true, statusCode: 200, data: { unitId: 'U001', collDate: '2026-01-01' } };
      service.validateUnit({ unitId: 'U001' }).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.data.unitId).toBe('U001');
      });
      const req = httpMock.expectOne((r) => r.url.includes('validate-unit'));
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);
    });

    it('should normalize item to data when data is missing', () => {
      const mockRes = { statusCode: 200, item: { unitId: 'U001', collDate: '2026-01-01' } };
      service.validateUnit({ unitId: 'U001' }).subscribe((result) => {
        expect(result.data).toBeTruthy();
        expect(result.data.unitId).toBe('U001');
      });
      const req = httpMock.expectOne((r) => r.url.includes('validate-unit'));
      req.flush(mockRes);
    });
  });

  // ─── Validate Product ──────────────────────────────────────────────────

  describe('validateProduct', () => {
    it('should POST and return validated product', () => {
      const mockRes = { success: true, statusCode: 200, data: { productCode: 'P001', isPoolProduct: false } };
      service.validateProduct({ unitId: 'U1', productCode: 'P001', collDate: '2026-01-01' })
        .subscribe((result) => {
          expect(result.success).toBeTrue();
          expect(result.data.productCode).toBe('P001');
        });
      const req = httpMock.expectOne((r) => r.url.includes('validate-product'));
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);
    });
  });

  // ─── Validate Receive Date ─────────────────────────────────────────────

  describe('validateReceiveDate', () => {
    it('should POST and return validation result', () => {
      const mockRes = { success: true, statusCode: 200, data: { isValid: true } };
      service.validateReceiveDate({ receiveDate: '07-27-26 14:30' }).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.data.isValid).toBeTrue();
      });
      const req = httpMock.expectOne((r) => r.url.includes('validate-receive-date'));
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);
    });
  });

  // ─── Validate ABO ──────────────────────────────────────────────────────

  describe('validateAbo', () => {
    it('should POST and return ABO validation', () => {
      const mockRes = { success: true, statusCode: 200, data: { isValid: true } };
      service.validateAbo({ unitId: 'U1', productCode: 'P1', bloodType: 'A+', collDate: '2026-01-01' })
        .subscribe((result) => {
          expect(result.success).toBeTrue();
        });
      const req = httpMock.expectOne((r) => r.url.includes('validate-abo'));
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);
    });
  });

  // ─── Validate Component ────────────────────────────────────────────────

  describe('validateComponent', () => {
    it('should POST and return component validation', () => {
      const mockRes = { success: true, statusCode: 200, data: { isCleared: true } };
      service.validateComponent({ unitId: 'U1', productCode: 'P1', collDate: '2026-01-01' })
        .subscribe((result) => {
          expect(result.data.isCleared).toBeTrue();
        });
      const req = httpMock.expectOne((r) => r.url.includes('validate-component'));
      req.flush(mockRes);
    });
  });

  // ─── Validate Expiry ───────────────────────────────────────────────────

  describe('validateExpiry', () => {
    it('should POST and return expiry validation', () => {
      const mockRes = { success: true, statusCode: 200, data: { isValid: true } };
      service.validateExpiry({ unitId: 'U1', productCode: 'P1', collDate: '2026-01-01', expDate: '2027-01-01' })
        .subscribe((result) => {
          expect(result.data.isValid).toBeTrue();
        });
      const req = httpMock.expectOne((r) => r.url.includes('validate-expiry'));
      req.flush(mockRes);
    });
  });

  // ─── Validate Location ─────────────────────────────────────────────────

  describe('validateLocation', () => {
    it('should POST and return location validation', () => {
      const mockRes = { success: true, statusCode: 200, data: { isValid: true, locationId: 'WH01', availableCapacity: 10 } };
      service.validateLocation({ warehouseId: 'W' }).subscribe((result) => {
        expect(result.data.locationId).toBe('WH01');
      });
      const req = httpMock.expectOne((r) => r.url.includes('validate-location'));
      req.flush(mockRes);
    });
  });

  // ─── Check In (Create) ─────────────────────────────────────────────────

  describe('checkIn', () => {
    it('should POST check-in data and return result', () => {
      const dto = { unitId: 'U1', productCode: 'P1', aliquot: '01', bloodType: 'A+', inventoryClass: 'RE' };
      const mockRes = { success: true, statusCode: 201, data: { unitId: 'U1' } };
      service.checkIn(dto).subscribe((result) => {
        expect(result.success).toBeTrue();
      });
      const req = httpMock.expectOne((r) => r.url.includes('check-in-from-lab') && r.method === 'POST' && !r.url.includes('validate') && !r.url.includes('list'));
      req.flush(mockRes);
    });
  });

  // ─── Devices ───────────────────────────────────────────────────────────

  describe('getDevices', () => {
    it('should return devices for a warehouse', () => {
      const mockData = { data: [{ deviceId: 'D1', deviceName: 'Fridge' }] };
      service.getDevices('W1').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].deviceId).toBe('D1');
      });
      const req = httpMock.expectOne((r) => r.url.includes('devices/W1'));
      req.flush(mockData);
    });
  });

  // ─── Racks ─────────────────────────────────────────────────────────────

  describe('getRacks', () => {
    it('should return racks with query params', () => {
      const mockData = { data: [{ rackId: 'R1', rackName: 'Rack 1' }] };
      service.getRacks('W1', 'D1', 'RE', 'WB', 'A+').subscribe((result) => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne((r) => r.url.includes('racks/W1/D1'));
      expect(req.request.params.get('storageClass')).toBe('RE');
      expect(req.request.params.get('productType')).toBe('WB');
      expect(req.request.params.get('bloodType')).toBe('A+');
      req.flush(mockData);
    });
  });

  // ─── Trays ─────────────────────────────────────────────────────────────

  describe('getTrays', () => {
    it('should return trays', () => {
      const mockData = { data: [{ trayId: 'T1', trayName: 'Tray 1', capacity: 10, used: 5, available: 5 }] };
      service.getTrays('W1', 'D1', 'R1').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].trayId).toBe('T1');
      });
      const req = httpMock.expectOne((r) => r.url.includes('trays/W1/D1/R1'));
      req.flush(mockData);
    });
  });

  // ─── Products ──────────────────────────────────────────────────────────

  describe('getProducts', () => {
    it('should return products for a unit', () => {
      const mockData = { data: [{ productCode: 'E0701', productType: 'WB' }] };
      service.getProducts('U1', '2026-01-01').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].productCode).toBe('E0701');
      });
      const req = httpMock.expectOne((r) => r.url.includes('products/U1'));
      expect(req.request.params.get('collDate')).toBe('2026-01-01');
      req.flush(mockData);
    });
  });

  // ─── Aliquots ──────────────────────────────────────────────────────────

  describe('getAliquots', () => {
    it('should return aliquots for unit and product', () => {
      const mockData = { data: [{ aliquot: '01' }, { aliquot: '02' }] };
      service.getAliquots('U1', 'P1', '2026-01-01').subscribe((result) => {
        expect(result.length).toBe(2);
      });
      const req = httpMock.expectOne((r) => r.url.includes('aliquots/U1/P1'));
      expect(req.request.params.get('collDate')).toBe('2026-01-01');
      req.flush(mockData);
    });
  });

  // ─── ABO Types ─────────────────────────────────────────────────────────

  describe('getAboTypes', () => {
    it('should return ABO types', () => {
      const mockData = { data: [{ aboCode: 'A+', aboDescription: 'A Positive' }] };
      service.getAboTypes().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].aboCode).toBe('A+');
      });
      const req = httpMock.expectOne((r) => r.url.includes('abo-types'));
      req.flush(mockData);
    });

    it('should pass query params when provided', () => {
      service.getAboTypes({ unitId: 'U1', productCode: 'P1', collDate: '2026-01-01' }).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('abo-types'));
      expect(req.request.params.get('unitId')).toBe('U1');
      expect(req.request.params.get('productCode')).toBe('P1');
      req.flush({ data: [] });
    });
  });

  // ─── Base ABO Value ────────────────────────────────────────────────────

  describe('getBaseAboValue', () => {
    it('should return base ABO value', () => {
      const mockData = { data: { aboValue: '62', baseAboValue: 'A' } };
      service.getBaseAboValue('62').subscribe((result) => {
        expect(result.baseAboValue).toBe('A');
      });
      const req = httpMock.expectOne((r) => r.url.includes('base-abo-value/62'));
      req.flush(mockData);
    });

    it('should return null when not found', () => {
      service.getBaseAboValue('XX').subscribe((result) => {
        expect(result).toBeNull();
      });
      const req = httpMock.expectOne((r) => r.url.includes('base-abo-value/XX'));
      req.flush({ data: null });
    });
  });

  // ─── Warehouses ────────────────────────────────────────────────────────

  describe('getWarehouses', () => {
    it('should return warehouses', () => {
      const mockData = { data: [{ warehouseId: 'W1', warehouseName: 'Main' }] };
      service.getWarehouses().subscribe((result) => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne((r) => r.url.includes('warehouses'));
      req.flush(mockData);
    });
  });

  // ─── List ──────────────────────────────────────────────────────────────

  describe('getList', () => {
    it('should POST and return list with total', () => {
      const mockRes = { data: [{ unitId: 'U1' }], total: 1 };
      service.getList(25, 0, {}).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
      });
      const req = httpMock.expectOne((r) => r.url.includes('list/25/0'));
      expect(req.request.method).toBe('POST');
      req.flush(mockRes);
    });
  });

  // ─── Get By Key ────────────────────────────────────────────────────────

  describe('getByKey', () => {
    it('should GET a specific record', () => {
      const mockRes = { data: { unitId: 'U1', productCode: 'P1' } };
      service.getByKey('U1', 'P1', '01').subscribe((result) => {
        expect(result.unitId).toBe('U1');
      });
      const req = httpMock.expectOne((r) => r.url.includes('check-in-from-lab/U1/P1/01'));
      expect(req.request.method).toBe('GET');
      req.flush(mockRes);
    });
  });

  // ─── Update ────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should PUT update data', () => {
      const dto = { locationId: 'LOC01' };
      const mockRes = { success: true, statusCode: 200 };
      service.update('U1', 'P1', '01', dto).subscribe((result) => {
        expect(result.success).toBeTrue();
      });
      const req = httpMock.expectOne((r) => r.url.includes('check-in-from-lab/U1/P1/01') && r.method === 'PUT');
      req.flush(mockRes);
    });
  });
});
