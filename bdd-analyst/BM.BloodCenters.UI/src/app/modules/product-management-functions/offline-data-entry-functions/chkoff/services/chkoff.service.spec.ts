import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChkOffService } from './chkoff.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  ProductCheckInDto,
  CheckInResultDto,
  UnitValidationDto,
  InventoryClassDto,
  AliquotDto,
  ProductCodeDto,
  AboTypeDto,
  WarehouseDto,
  StorageDeviceDto,
  RackDto,
  TrayDto
} from '../models/chkoff.model';

describe('ChkOffService', () => {
  let service: ChkOffService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChkOffService]
    });

    service = TestBed.inject(ChkOffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getInventoryClasses', () => {
    it('should fetch inventory classes successfully', (done) => {
      const mockResponse: ReturnResult<InventoryClassDto> = {
        success: true,
        message: 'Successfully fetched active inventory classes.',
        statusCode: 200,
        data: [
          {
            code: 'RE',
            codeDesc: 'Regular',
            effDate: '2020-01-01T00:00:00Z',
            termDate: null
          },
          {
            code: 'SP',
            codeDesc: 'Special',
            effDate: '2020-01-01T00:00:00Z',
            termDate: null
          },
          {
            code: 'AD',
            codeDesc: 'Autologous-Directed',
            effDate: '2020-01-01T00:00:00Z',
            termDate: null
          }
        ]
      };

      service.getInventoryClasses().subscribe(classes => {
        expect(classes.length).toBe(3);
        expect(classes[0].code).toBe('RE');
        expect(classes[1].code).toBe('SP');
        expect(classes[2].code).toBe('AD');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.INVENTORY_CLASSES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse: ReturnResult<InventoryClassDto> = {
        success: true,
        message: 'No data',
        statusCode: 200
      };

      service.getInventoryClasses().subscribe(classes => {
        expect(classes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.INVENTORY_CLASSES}`);
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      service.getInventoryClasses().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.INVENTORY_CLASSES}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getProductCodes', () => {
    const unitId = 'UNIT-001';

    it('should fetch product codes for a unit', (done) => {
      const mockResponse: ReturnResult<ProductCodeDto> = {
        success: true,
        message: 'Product codes fetched',
        statusCode: 200,
        data: [
          {
            productCode: 'RBC',
            productType: 'R',
            storageProductType: 'R',
            poolProductCode: '',
            lifeSpan: 42,
            lifeSpanInd: 'D'
          },
          {
            productCode: 'PLT',
            productType: 'P',
            storageProductType: null,
            poolProductCode: 'PPLT',
            lifeSpan: 5,
            lifeSpanInd: 'D'
          }
        ]
      };

      service.getProductCodes(unitId).subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].productCode).toBe('RBC');
        expect(codes[1].productCode).toBe('PLT');
        expect(codes[0].lifeSpan).toBe(42);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.PRODUCT_CODES(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse: ReturnResult<ProductCodeDto> = {
        success: true,
        message: 'No data',
        statusCode: 200
      };

      service.getProductCodes(unitId).subscribe(codes => {
        expect(codes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.PRODUCT_CODES(unitId)}`);
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      service.getProductCodes(unitId).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.PRODUCT_CODES(unitId)}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getAboTypes', () => {
    const unitId = 'UNIT-001';
    const productCode = 'RBC';
    const aliquot = '00';

    it('should fetch ABO types for a unit/product/aliquot combination', (done) => {
      const mockResponse: ReturnResult<AboTypeDto> = {
        success: true,
        message: 'ABO types fetched',
        statusCode: 200,
        data: [
          { aboCode: 'O+', aboDescription: 'O Positive' },
          { aboCode: 'A+', aboDescription: 'A Positive' }
        ]
      };

      service.getAboTypes(unitId, productCode, aliquot).subscribe(types => {
        expect(types.length).toBe(2);
        expect(types[0].aboCode).toBe('O+');
        expect(types[0].aboDescription).toBe('O Positive');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ABO_TYPES(unitId, productCode, aliquot)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse: ReturnResult<AboTypeDto> = {
        success: true,
        message: 'No data',
        statusCode: 200
      };

      service.getAboTypes(unitId, productCode, aliquot).subscribe(types => {
        expect(types).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ABO_TYPES(unitId, productCode, aliquot)}`
      );
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      service.getAboTypes(unitId, productCode, aliquot).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ABO_TYPES(unitId, productCode, aliquot)}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAliquots', () => {
    const unitId = 'UNIT-001';
    const productCode = 'RBC';

    it('should fetch aliquots for a unit/product combination', (done) => {
      const mockResponse: ReturnResult<AliquotDto> = {
        success: true,
        message: 'Aliquots fetched',
        statusCode: 200,
        data: [
          { aliquot: '00' },
          { aliquot: '01' }
        ]
      };

      service.getAliquots(unitId, productCode).subscribe(aliquots => {
        expect(aliquots.length).toBe(2);
        expect(aliquots[0].aliquot).toBe('00');
        expect(aliquots[1].aliquot).toBe('01');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ALIQUOTS(unitId, productCode)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse: ReturnResult<AliquotDto> = {
        success: true,
        message: 'No data',
        statusCode: 200
      };

      service.getAliquots(unitId, productCode).subscribe(aliquots => {
        expect(aliquots).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ALIQUOTS(unitId, productCode)}`
      );
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      service.getAliquots(unitId, productCode).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.ALIQUOTS(unitId, productCode)}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('validateUnit', () => {
    it('should validate unit successfully when unit found via item', (done) => {
      const unitId = 'TEST-001';
      const mockResponse: ReturnResult<UnitValidationDto> = {
        success: true,
        message: 'Unit found',
        statusCode: 200,
        item: {
          unitId: 'TEST-001',
          collDate: new Date().toISOString(),
          chapterId: '0001',
          isValid: true,
          message: 'Unit found'
        }
      };

      service.validateUnit(unitId).subscribe(result => {
        expect(result.isValid).toBe(true);
        expect(result.unitId).toBe('TEST-001');
        expect(result.collDate).toBeTruthy();
        expect(result.chapterId).toBe('0001');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return isValid false when unit not found', (done) => {
      const unitId = 'NOTEXIST';
      const mockResponse: ReturnResult<UnitValidationDto> = {
        success: false,
        message: 'Unit not found in system for this chapter',
        statusCode: 404,
        item: {
          unitId: 'NOTEXIST',
          collDate: null,
          chapterId: null,
          isValid: false,
          message: 'Unit not found in system for this chapter'
        }
      };

      service.validateUnit(unitId).subscribe(result => {
        expect(result.isValid).toBe(false);
        expect(result.unitId).toBe('NOTEXIST');
        expect(result.collDate).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      req.flush(mockResponse);
    });

    it('should fall back to data array when item is not present', (done) => {
      const unitId = 'DATA-001';
      const mockResponse: ReturnResult<UnitValidationDto> = {
        success: true,
        message: 'Unit found',
        statusCode: 200,
        data: [
          {
            unitId: 'DATA-001',
            collDate: '2025-01-15T00:00:00Z',
            chapterId: '0002',
            isValid: true,
            message: 'Unit found via data array'
          }
        ]
      };

      service.validateUnit(unitId).subscribe(result => {
        expect(result.isValid).toBe(true);
        expect(result.unitId).toBe('DATA-001');
        expect(result.chapterId).toBe('0002');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      req.flush(mockResponse);
    });

    it('should return default error result when neither item nor data is present', (done) => {
      const unitId = 'EMPTY-001';
      const mockResponse: ReturnResult<UnitValidationDto> = {
        success: false,
        message: 'No records found',
        statusCode: 200
      };

      service.validateUnit(unitId).subscribe(result => {
        expect(result.isValid).toBe(false);
        expect(result.unitId).toBe('EMPTY-001');
        expect(result.collDate).toBeNull();
        expect(result.chapterId).toBeNull();
        expect(result.message).toBe('No records found');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      req.flush(mockResponse);
    });

    it('should use default message when response has no message and no data', (done) => {
      const unitId = 'NOMSG-001';
      const mockResponse: ReturnResult<UnitValidationDto> = {
        success: false,
        message: '',
        statusCode: 200
      };

      service.validateUnit(unitId).subscribe(result => {
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Unit not found');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      req.flush(mockResponse);
    });

    it('should propagate error with error.error.message on HTTP failure', (done) => {
      const unitId = 'ERR-001';

      service.validateUnit(unitId).subscribe({
        error: (err) => {
          expect(err.isValid).toBe(false);
          expect(err.unitId).toBe('ERR-001');
          expect(err.message).toBe('Server validation error');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      req.flush({ message: 'Server validation error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should use fallback message when error.error.message is absent', (done) => {
      const unitId = 'ERR-002';

      service.validateUnit(unitId).subscribe({
        error: (err) => {
          expect(err.isValid).toBe(false);
          expect(err.unitId).toBe('ERR-002');
          expect(err.message).toBe('Unit validation failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.VALIDATE_UNIT(unitId)}`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('checkInProduct', () => {
    it('should check in product successfully', (done) => {
      const payload: ProductCheckInDto = {
        inventoryClass: 'RE',
        receivedDate: new Date().toISOString(),
        unitId: 'TEST-001',
        productCode: 'RBC',
        aliquot: '00',
        bloodType: 'O+',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expirationTime: '23:59:00'
      };

      const mockResponse: ReturnResult<CheckInResultDto> = {
        success: true,
        statusCode: 201,
        message: 'Product checked in successfully',
        item: {
          unitId: 'TEST-001',
          productCode: 'RBC',
          aliquot: '00',
          warnings: []
        }
      };

      service.checkInProduct(payload).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
        expect(response.item?.unitId).toBe('TEST-001');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.CHECKIN}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should propagate error on check-in failure', (done) => {
      const payload: ProductCheckInDto = {
        inventoryClass: 'RE',
        receivedDate: new Date().toISOString(),
        unitId: 'DUP-001',
        productCode: 'RBC',
        aliquot: '00',
        bloodType: 'O+',
        expirationDate: '2025-12-31'
      };

      service.checkInProduct(payload).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.CHECKIN}`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Duplicate product' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('getWarehouses', () => {
    it('should fetch warehouses successfully', (done) => {
      const mockResponse: ReturnResult<WarehouseDto> = {
        success: true,
        message: 'Warehouses fetched',
        statusCode: 200,
        data: [
          { warehouseId: '1', warehouseDesc: 'Home Warehouse' },
          { warehouseId: '2', warehouseDesc: 'Mobile Unit' }
        ]
      };

      service.getWarehouses().subscribe(warehouses => {
        expect(warehouses.length).toBe(2);
        expect(warehouses[0].warehouseId).toBe('1');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.WAREHOUSES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse: ReturnResult<WarehouseDto> = {
        success: true,
        message: 'No warehouses',
        statusCode: 200
      };

      service.getWarehouses().subscribe(warehouses => {
        expect(warehouses).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.WAREHOUSES}`);
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      service.getWarehouses().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.WAREHOUSES}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDevices', () => {
    it('should fetch devices for a warehouse', (done) => {
      const warehouseId = '1';
      const mockResponse: ReturnResult<StorageDeviceDto> = {
        success: true,
        message: 'Devices fetched',
        statusCode: 200,
        data: [
          { deviceNumber: '50', deviceType: 'F', deviceDesc: 'Freezer 50' }
        ]
      };

      service.getDevices(warehouseId).subscribe(devices => {
        expect(devices.length).toBe(1);
        expect(devices[0].deviceNumber).toBe('50');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.DEVICES(warehouseId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch devices with productType parameter', (done) => {
      const warehouseId = '1';
      const productType = 'R';
      const mockResponse: ReturnResult<StorageDeviceDto> = {
        success: true,
        message: 'Devices fetched',
        statusCode: 200,
        data: [
          { deviceNumber: '10', deviceType: 'R', deviceDesc: 'Refrigerator 10' }
        ]
      };

      service.getDevices(warehouseId, productType).subscribe(devices => {
        expect(devices.length).toBe(1);
        expect(devices[0].deviceType).toBe('R');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.DEVICES(warehouseId, productType)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const warehouseId = '1';
      const mockResponse: ReturnResult<StorageDeviceDto> = {
        success: true,
        message: 'No devices',
        statusCode: 200
      };

      service.getDevices(warehouseId).subscribe(devices => {
        expect(devices).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.DEVICES(warehouseId)}`);
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      const warehouseId = '1';

      service.getDevices(warehouseId).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.DEVICES(warehouseId)}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getRacks', () => {
    it('should fetch racks for a warehouse/device', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';
      const mockResponse: ReturnResult<RackDto> = {
        success: true,
        message: 'Racks fetched',
        statusCode: 200,
        data: [
          { rackNumber: '20', rackDesc: 'Rack 20' }
        ]
      };

      service.getRacks(warehouseId, deviceNumber).subscribe(racks => {
        expect(racks.length).toBe(1);
        expect(racks[0].rackNumber).toBe('20');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.RACKS(warehouseId, deviceNumber)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch racks with optional parameters', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';
      const deviceType = 'F';
      const productType = 'R';
      const bloodType = 'O+';
      const mockResponse: ReturnResult<RackDto> = {
        success: true,
        message: 'Racks fetched',
        statusCode: 200,
        data: [
          { rackNumber: '30', rackDesc: 'Rack 30' }
        ]
      };

      service.getRacks(warehouseId, deviceNumber, deviceType, productType, bloodType).subscribe(racks => {
        expect(racks.length).toBe(1);
        expect(racks[0].rackNumber).toBe('30');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.RACKS(warehouseId, deviceNumber, deviceType, productType, bloodType)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';
      const mockResponse: ReturnResult<RackDto> = {
        success: true,
        message: 'No racks',
        statusCode: 200
      };

      service.getRacks(warehouseId, deviceNumber).subscribe(racks => {
        expect(racks).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.RACKS(warehouseId, deviceNumber)}`);
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';

      service.getRacks(warehouseId, deviceNumber).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.RACKS(warehouseId, deviceNumber)}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTrays', () => {
    it('should fetch trays for a warehouse/device/rack', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';
      const rackNumber = '20';
      const mockResponse: ReturnResult<TrayDto> = {
        success: true,
        message: 'Trays fetched',
        statusCode: 200,
        data: [
          { trayId: '1028', maxCapacity: 50, currentCount: 25 }
        ]
      };

      service.getTrays(warehouseId, deviceNumber, rackNumber).subscribe(trays => {
        expect(trays.length).toBe(1);
        expect(trays[0].trayId).toBe('1028');
        expect(trays[0].currentCount).toBe(25);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.TRAYS(warehouseId, deviceNumber, rackNumber)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';
      const rackNumber = '20';
      const mockResponse: ReturnResult<TrayDto> = {
        success: true,
        message: 'No trays',
        statusCode: 200
      };

      service.getTrays(warehouseId, deviceNumber, rackNumber).subscribe(trays => {
        expect(trays).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.TRAYS(warehouseId, deviceNumber, rackNumber)}`
      );
      req.flush(mockResponse);
    });

    it('should propagate error on failure', (done) => {
      const warehouseId = '1';
      const deviceNumber = '50';
      const rackNumber = '20';

      service.getTrays(warehouseId, deviceNumber, rackNumber).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.OFFLINE_PRODUCT_CHECKIN.TRAYS(warehouseId, deviceNumber, rackNumber)}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
