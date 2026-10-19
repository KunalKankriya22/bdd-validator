import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReleaseReturnedProductQuarantineService } from './release-returned-product-quarantine.service';
import { API } from '@core/constants/api.constants';

import {
  ReturnAdviceHeaderDto,
  ReturnItemDto,
  RejectCodeDto,
  ProcessReturnItemsRequestDto,
  ApiResponse
} from '../models/release-returned-product-quarantine.model';

describe('ReleaseReturnedProductQuarantineService', () => {
  let service: ReleaseReturnedProductQuarantineService;
  let httpMock: HttpTestingController;

  const mockReturnAdviceHeader: ReturnAdviceHeaderDto = {
    returnAdviceId: 'RA001234567',
    customerName: 'ABC Hospital',
    returnUserId: 'USER01',
    returnDate: '2026-05-15T14:30:00Z',
    adviceStatus: 'OP',
    unmovedItemCount: 5
  };

  const mockReturnItems: ReturnItemDto[] = [
    {
      unitId: 'W1234567890123',
      displayUnitId: 'W123456789012345',
      collDate: '2026-05-01T00:00:00Z',
      productCode: 'RBC01',
      aliquot: '00',
      returnAdviceId: 'RA001234567',
      returnReasonCode: 'EXP01',
      returnReasonDescription: 'Expired product',
      expDate: '2026-06-01T12:00:00Z',
      locationId: null,
      moveDate: null,
      checkDigit: '45',
      bloodType: 'O+',
      aboDescription: 'O Positive',
      productType: 'RBC',
      inventoryClass: 'DI',
      warehouseId: 'A'
    }
  ];

  const mockRejectCodes: RejectCodeDto[] = [
    { code: 'EXP01', description: 'Expired product' },
    { code: 'DMG01', description: 'Product damaged' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReleaseReturnedProductQuarantineService]
    });
    service = TestBed.inject(ReleaseReturnedProductQuarantineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getReturnAdviceHeader', () => {
    it('should fetch return advice header', () => {
      const returnAdviceId = 'RA001234567';
      const warehouseId = 'A';

      service.getReturnAdviceHeader(returnAdviceId, warehouseId).subscribe((data) => {
        expect(data).toEqual(mockReturnAdviceHeader);
      });

      const expectedUrl = API.RELEASE_RETURNED_PRODUCT_QUARANTINE.HEADER(returnAdviceId, warehouseId);
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      const response: ApiResponse<ReturnAdviceHeaderDto> = {
        success: true,
        statusCode: 200,
        message: 'Return advice retrieved successfully',
        data: mockReturnAdviceHeader
      };
      req.flush(response);
    });

    it('should handle empty warehouseId', () => {
      const returnAdviceId = 'RA001234567';

      service.getReturnAdviceHeader(returnAdviceId).subscribe((data) => {
        expect(data).toEqual(mockReturnAdviceHeader);
      });

      const expectedUrl = API.RELEASE_RETURNED_PRODUCT_QUARANTINE.HEADER(returnAdviceId, '');
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: '', data: mockReturnAdviceHeader });
    });

    it('should return empty object when data is null', () => {
      service.getReturnAdviceHeader('RA001').subscribe((data) => {
        expect(data).toEqual({} as ReturnAdviceHeaderDto);
      });

      const req = httpMock.expectOne((r) => r.url.includes('RA001'));
      req.flush({ success: true, statusCode: 200, message: '', data: null });
    });

    it('should propagate HTTP error', (done) => {
      service.getReturnAdviceHeader('RA001', 'A').subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes('RA001'));
      req.flush({ error: 'Not found' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getReturnItems', () => {
    it('should fetch return items with parameters', () => {
      const returnAdviceId = 'RA001234567';
      const warehouseId = 'A';

      service.getReturnItems(returnAdviceId, warehouseId, 10, 0).subscribe((result) => {
        expect(result.items).toEqual(mockReturnItems);
        expect(result.totalCount).toBe(1);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/api/v1/release-returned-product-quarantine/return-items') &&
          request.url.includes('take=10') &&
          request.url.includes('skip=0') &&
          request.url.includes('returnAdviceId=RA001234567') &&
          request.url.includes('warehouseId=A');
      });

      expect(req.request.method).toBe('GET');

      const response: ApiResponse<ReturnItemDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Return items retrieved successfully',
        data: mockReturnItems,
        totalCount: 1
      };
      req.flush(response);
    });

    it('should fetch return items without optional parameters', () => {
      service.getReturnItems('', '', 10, 0).subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/api/v1/release-returned-product-quarantine/return-items') &&
          request.url.includes('take=10') &&
          request.url.includes('skip=0');
      });

      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: '', data: [], totalCount: 0 });
    });

    it('should fall back to response.total when totalCount is missing', () => {
      service.getReturnItems('RA001', 'A', 10, 0).subscribe((result) => {
        expect(result.totalCount).toBe(5);
      });

      const req = httpMock.expectOne((r) => r.url.includes('return-items'));
      req.flush({ success: true, statusCode: 200, message: '', data: mockReturnItems, total: 5 });
    });

    it('should return empty array when data is null', () => {
      service.getReturnItems('RA001', 'A', 10, 0).subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne((r) => r.url.includes('return-items'));
      req.flush({ success: true, statusCode: 200, message: '', data: null });
    });

    it('should propagate HTTP error', (done) => {
      service.getReturnItems('RA001', 'A').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes('return-items'));
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getRejectCodes', () => {
    it('should fetch reject codes', () => {
      service.getRejectCodes().subscribe((data) => {
        expect(data).toEqual(mockRejectCodes);
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.REJECT_CODES);
      expect(req.request.method).toBe('GET');

      const response: ApiResponse<RejectCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Reject codes retrieved successfully',
        data: mockRejectCodes
      };
      req.flush(response);
    });

    it('should return empty array when data is null', () => {
      service.getRejectCodes().subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.REJECT_CODES);
      req.flush({ success: true, statusCode: 200, message: '', data: null });
    });

    it('should propagate HTTP error', (done) => {
      service.getRejectCodes().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.REJECT_CODES);
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('validateProductForRestock', () => {
    it('should validate product successfully', () => {
      const request: ProcessReturnItemsRequestDto = {
        returnAdviceId: 'RA001',
        items: [{
          unitId: 'W123', collDate: '2026-01-01', productCode: 'RBC01',
          aliquot: '00', returnAdviceId: 'RA001', restockFlag: 'Y',
          warehouseId: 'A', deviceNumber: '01'
        }]
      };

      service.validateProductForRestock(request).subscribe((data) => {
        expect(data.isValid).toBe(true);
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.VALIDATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: '', data: { isValid: true } });
    });

    it('should return isValid false when data is null', () => {
      const request: ProcessReturnItemsRequestDto = { returnAdviceId: 'RA001', items: [] };

      service.validateProductForRestock(request).subscribe((data) => {
        expect(data).toEqual({ isValid: false });
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.VALIDATE);
      req.flush({ success: true, statusCode: 200, message: '', data: null });
    });

    it('should propagate HTTP error', (done) => {
      const request: ProcessReturnItemsRequestDto = { returnAdviceId: 'RA001', items: [] };

      service.validateProductForRestock(request).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.VALIDATE);
      req.flush({ error: 'Invalid' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('processReturnItems', () => {
    const request: ProcessReturnItemsRequestDto = {
      returnAdviceId: 'RA001234567',
      items: [{
        unitId: 'W1234567890123', collDate: '2026-05-01T00:00:00Z',
        productCode: 'RBC01', aliquot: '00', returnAdviceId: 'RA001234567',
        restockFlag: 'Y', warehouseId: 'A', deviceType: 'F',
        deviceNumber: '01', rackNumber: '01', trayId: 'T12345'
      }]
    };

    it('should process return items successfully', () => {
      const mockProcessResponse = {
        totalProcessed: 1, restockedCount: 1, discardedCount: 0, failedCount: 0,
        processedItems: [{ unitId: 'W1234567890123', action: 'RESTOCK' as const, success: true, locationId: 'AF010101T12345' }]
      };

      service.processReturnItems(request).subscribe((data) => {
        expect(data.totalProcessed).toBe(1);
        expect(data.restockedCount).toBe(1);
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.PROCESS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: '', data: mockProcessResponse });
    });

    it('should return defaults when data is null', () => {
      service.processReturnItems(request).subscribe((data) => {
        expect(data.totalProcessed).toBe(0);
        expect(data.failedCount).toBe(0);
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.PROCESS);
      req.flush({ success: true, statusCode: 200, message: '', data: null });
    });

    it('should propagate HTTP error', (done) => {
      service.processReturnItems(request).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(API.RELEASE_RETURNED_PRODUCT_QUARANTINE.PROCESS);
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDevices', () => {
    it('should fetch devices for a product type', () => {
      const mockDevices = [{ deviceNumber: '01', deviceType: 'F', description: 'Freezer 01' }];

      service.getDevices('RBC').subscribe((data) => {
        expect(data).toEqual(mockDevices);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes('/storage/devices') && r.url.includes('productType=RBC')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockDevices });
    });

    it('should return empty array when data is null', () => {
      service.getDevices('RBC').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/storage/devices'));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array on HTTP error', () => {
      service.getDevices('RBC').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/storage/devices'));
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getRacks', () => {
    it('should fetch racks with all parameters', () => {
      const mockRacks = [{ rackNumber: 'R01', description: 'Rack 01' }];

      service.getRacks('F', '01', 'RBC', 'O+', 'DI').subscribe((data) => {
        expect(data).toEqual(mockRacks);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes('/storage/racks') &&
        r.url.includes('deviceType=F') &&
        r.url.includes('deviceNumber=01') &&
        r.url.includes('productType=RBC') &&
        r.url.includes('bloodType=O%2B') &&
        r.url.includes('storageClass=DI')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockRacks });
    });

    it('should return empty array when data is null', () => {
      service.getRacks('F', '01', 'RBC', 'O+', 'DI').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/storage/racks'));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array on HTTP error', () => {
      service.getRacks('F', '01', 'RBC', 'O+', 'DI').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/storage/racks'));
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTrays', () => {
    it('should fetch trays with all parameters', () => {
      const mockTrays = [{ trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'N' }];

      service.getTrays('F', '01', 'R01', 'RBC', 'O+', 'DI').subscribe((data) => {
        expect(data).toEqual(mockTrays);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes('/storage/trays') &&
        r.url.includes('rackNumber=R01')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockTrays });
    });

    it('should return empty array when data is null', () => {
      service.getTrays('F', '01', 'R01', 'RBC', 'O+', 'DI').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/storage/trays'));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array on HTTP error', () => {
      service.getTrays('F', '01', 'R01', 'RBC', 'O+', 'DI').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('/storage/trays'));
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('searchReturnAdvices', () => {
    const mockAdvices = [
      { returnAdviceId: 'RA001234567', customerName: 'ABC Hospital', unmovedItemCount: 2 }
    ];

    it('should search return advices with parameters', () => {
      service.searchReturnAdvices('RA', 'A').subscribe((data) => {
        expect(data).toEqual(mockAdvices);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/api/v1/release-returned-product-quarantine/return-advices') &&
          request.url.includes('searchTerm=RA') &&
          request.url.includes('warehouseId=A');
      });
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockAdvices });
    });

    it('should search without parameters', () => {
      service.searchReturnAdvices().subscribe((data) => {
        expect(data).toEqual(mockAdvices);
      });

      const req = httpMock.expectOne((r) =>
        r.url === '/api/v1/release-returned-product-quarantine/return-advices'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockAdvices });
    });

    it('should return empty array when data is null', () => {
      service.searchReturnAdvices('RA', 'A').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('return-advices'));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array on HTTP error', () => {
      service.searchReturnAdvices('RA', 'A').subscribe((data) => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url.includes('return-advices'));
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
