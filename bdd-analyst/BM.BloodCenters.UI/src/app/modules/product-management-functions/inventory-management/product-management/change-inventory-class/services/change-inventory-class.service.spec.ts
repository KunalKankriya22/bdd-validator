import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChangeInventoryClassService } from './change-inventory-class.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ChangeInventoryClassProductDto,
  ChangeInventoryClassRequestDto,
  ChangeInventoryClassApiResponse,
} from '../models/change-inventory-class.model';

describe('ChangeInventoryClassService', () => {
  let service: ChangeInventoryClassService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChangeInventoryClassService],
    });

    service = TestBed.inject(ChangeInventoryClassService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProducts', () => {
    it('should retrieve products for a unit ID', () => {
      const mockProducts: ChangeInventoryClassProductDto[] = [
        {
          unitId: 'W123418010301',
          productCode: 'E2807D00',
          productType: 'FFP',
          bloodType: '62',
          bloodTypeDesc: null,
          aliquot: '00',
          expDate: '2018-01-08T23:59:00',
          currentInvClass: 'AD',
          locationId: '111',
          collDate: '2018-01-03T00:00:00',
          warehouseId: 'H',
        },
      ];
      const mockResponse: ChangeInventoryClassApiResponse<ChangeInventoryClassProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Products retrieved successfully.',
        data: mockProducts,
      };

      service.getProducts('W123418010301').subscribe((products) => {
        expect(products.length).toBe(1);
        expect(products[0].unitId).toBe('W123418010301');
        expect(products[0].currentInvClass).toBe('AD');
      });

      const req = httpMock.expectOne((r) => r.url.includes('change-inventory-class/product/W123418010301'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });



  });

  describe('changeInventoryClass', () => {
    it('should send PUT request with correct payload', () => {
      const request: ChangeInventoryClassRequestDto = {
        newClass: 'RE',
        newLocation: '111',
        productCode: 'E2807D00',
        aliquot: '00',
        collDate: '2018-01-03T00:00:00',
      };
      const mockResponse: ChangeInventoryClassApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Inventory class changed successfully.',
        data: { unitId: 'W123418010301', oldClass: 'AD', newClass: 'RE' },
      };

      service.changeInventoryClass('W123418010301', request).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Inventory class changed successfully.');
      });

      const req = httpMock.expectOne((r) => r.url.includes('change-inventory-class/W123418010301'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });


    it('should handle server error', () => {
      const request: ChangeInventoryClassRequestDto = {
        newClass: 'SP',
        productCode: 'P001',
        aliquot: '01',
        collDate: '2025-01-01T00:00:00',
      };

      service.changeInventoryClass('U001', request).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('change-inventory-class/U001'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

  });

  describe('getInventoryClasses', () => {
    it('should retrieve inventory classes', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          { code: 'AD', description: 'Autologous' },
          { code: 'RE', description: 'Regular' },
          { code: 'SP', description: 'Special' },
        ],
      };

      service.getInventoryClasses().subscribe((classes) => {
        expect(classes.length).toBe(3);
        expect(classes[0].code).toBe('AD');
        expect(classes[2].code).toBe('SP');
      });

      const req = httpMock.expectOne((r) => r.url.includes('inventory-classes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getWarehouses', () => {
    it('should retrieve warehouses', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          { warehouseId: 'H', warehouseName: 'Home Warehouse' },
          { warehouseId: 'S', warehouseName: 'Satellite' },
        ],
      };

      service.getWarehouses().subscribe((warehouses) => {
        expect(warehouses.length).toBe(2);
        expect(warehouses[0].warehouseId).toBe('H');
      });

      const req = httpMock.expectOne((r) => r.url.includes('warehouses'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getDevices', () => {
    it('should retrieve devices for a warehouse', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          { deviceId: '01', deviceName: 'Refrigerator 1' },
        ],
      };

      service.getDevices('H').subscribe((devices) => {
        expect(devices.length).toBe(1);
        expect(devices[0].deviceId).toBe('01');
      });

      const req = httpMock.expectOne((r) => r.url.includes('devices'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getRacks', () => {
    it('should retrieve racks for a warehouse and device', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          { rackId: '04', rackName: 'Rack 4' },
        ],
      };

      service.getRacks('H', 'C', '01').subscribe((racks) => {
        expect(racks.length).toBe(1);
        expect(racks[0].rackId).toBe('04');
      });

      const req = httpMock.expectOne((r) => r.url.includes('racks'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTrays', () => {
    it('should retrieve trays for a rack', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [{ trayId: '100', trayName: 'Tray 100', itemCount: 2 }],
      };
      service.getTrays('H', 'C', '01', '04').subscribe((trays) => {
        expect(trays.length).toBe(1);
        expect(trays[0].trayId).toBe('100');
      });
      const req = httpMock.expectOne((r) => r.url.includes('trays'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass optional params as query string', () => {
      const mockResponse = { success: true, statusCode: 200, data: [] };
      service.getTrays('H', 'C', '01', '04', 'FFP', '62', 'I').subscribe();
      const req = httpMock.expectOne((r) =>
        r.url.includes('trays') && r.url.includes('productType=FFP') && r.url.includes('bloodType=62') && r.url.includes('codeScheme=I'));
      req.flush(mockResponse);
    });
  });

  describe('preCheckInterdiction', () => {
    it('should send POST request', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: null };
      service.preCheckInterdiction('U001', 'P001', '00', '2025-01-01T00:00:00').subscribe((response) => {
        expect(response.success).toBe(true);
      });
      const req = httpMock.expectOne((r) => r.url.includes('pre-check'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'U001', productCode: 'P001', aliquot: '00', collDate: '2025-01-01T00:00:00' });
      req.flush(mockResponse);
    });
  });

  describe('getRacks with newClass param', () => {
    it('should pass newClass as query param instead of storageClass', () => {
      const mockResponse = { success: true, statusCode: 200, data: [{ rackId: '04', rackName: 'Rack 4' }] };
      service.getRacks('H', 'C', '01', 'RE', 'FFP', '62').subscribe();
      const req = httpMock.expectOne((r) =>
        r.url.includes('racks') && r.url.includes('newClass=RE') && !r.url.includes('storageClass'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDevices with productType', () => {
    it('should pass productType as query param', () => {
      const mockResponse = { success: true, statusCode: 200, data: [{ deviceId: '01', deviceName: 'Dev 1' }] };
      service.getDevices('H', 'FFP').subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('devices') && r.url.includes('productType=FFP'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getProducts error handling', () => {
    it('should handle API error', () => {
      service.getProducts('U001').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
      const req = httpMock.expectOne((r) => r.url.includes('product/U001'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getInventoryClasses error handling', () => {
    it('should handle API error', () => {
      service.getInventoryClasses().subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
      const req = httpMock.expectOne((r) => r.url.includes('inventory-classes'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
