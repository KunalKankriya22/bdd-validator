import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { WarehouseCheckInApiService } from './warehouse-checkin-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  WarehouseCheckInRequestDto,
  WarehouseCheckInResponseDto,
  ValidateAllRequestDto,
  ValidateAllResponseDto,
  UnitProductDto,
  ApiResponse,
  LocationLookupParams,
} from '../models/warehouse-checkin.model';

describe('WarehouseCheckInApiService', () => {
  let service: WarehouseCheckInApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        WarehouseCheckInApiService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(WarehouseCheckInApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================================
  // validateAll
  // =========================================================================

  describe('validateAll', () => {
    it('should POST to VALIDATE_ALL and return data[0] on success', (done) => {
      const request: ValidateAllRequestDto = { unitId: 'W633300000001', productCode: '69101000', temperature: -20 };

      const mockResponse: ApiResponse<ValidateAllResponseDto> = {
        success: true, statusCode: 200,
        message: 'Unit validated successfully',
        data: [{
          isValid: true, currentWarehouse: 'W1', stockState: 'TR',
          batchId: 'BATCH001', batchStatus: 'TRANS', destinationWarehouse: 'W2',
          collectionDate: '2026-05-25T00:00:00Z', productClass: 'Regular',
          tempInRange: true, warnings: [],
        }],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateAll(request).subscribe({
        next: (res) => {
          expect(res.isValid).toBeTrue();
          expect(res.currentWarehouse).toBe('W1');
          expect(res.batchId).toBe('BATCH001');
          expect(res.warnings.length).toBe(0);
          expect(apiServiceSpy.post).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });

    it('should pass the request body to apiService.post', (done) => {
      const request: ValidateAllRequestDto = { unitId: 'U1', productCode: 'P1', temperature: 5 };

      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{ isValid: true, tempInRange: true, warnings: [] }],
      }));

      service.validateAll(request).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe('/api/v1/warehouse-checkin/validate');
          expect(callArgs[1]).toEqual(request);
          expect(callArgs[2]?.context).toBeTruthy();
          done();
        },
      });
    });

    it('should return error 3728 when unit is already quarantined', (done) => {
      const request: ValidateAllRequestDto = { unitId: 'W633300000002', productCode: '69101000' };

      const mockResponse: ApiResponse<ValidateAllResponseDto> = {
        success: true, statusCode: 200,
        data: [{
          isValid: false, errorCode: '3728',
          errorMessage: 'Unit is already in quarantine',
          tempInRange: true, warnings: [],
        }],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateAll(request).subscribe({
        next: (res) => {
          expect(res.isValid).toBeFalse();
          expect(res.errorCode).toBe('3728');
          expect(res.errorMessage).toBe('Unit is already in quarantine');
          done();
        },
      });
    });

    it('should return error 0313 when unit is not found', (done) => {
      const request: ValidateAllRequestDto = { unitId: 'INVALID', productCode: '69101000', temperature: -20 };

      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{ isValid: false, errorCode: '0313', errorMessage: 'Unit not found in active products', tempInRange: true, warnings: [] }],
      }));

      service.validateAll(request).subscribe({
        next: (res) => {
          expect(res.isValid).toBeFalse();
          expect(res.errorCode).toBe('0313');
          done();
        },
      });
    });

    it('should carry 9928 temperature warning in warnings[]', (done) => {
      const request: ValidateAllRequestDto = { unitId: 'W633300000001', productCode: '69101000', temperature: 25 };

      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{
          isValid: true, tempInRange: false, minTemp: -30, maxTemp: 0,
          warnings: [{ code: '9928', message: 'Temperature 25 outside range (-30C - 0C).' }],
        }],
      }));

      service.validateAll(request).subscribe({
        next: (res) => {
          expect(res.isValid).toBeTrue();
          expect(res.tempInRange).toBeFalse();
          expect(res.warnings.length).toBe(1);
          expect(res.warnings[0].code).toBe('9928');
          done();
        },
      });
    });

    it('should carry 9925 no-batch warning in warnings[]', (done) => {
      const request: ValidateAllRequestDto = { unitId: 'W633300000001', productCode: '69101000' };

      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{
          isValid: true, tempInRange: true,
          warnings: [{ code: '9925', message: 'Unit has no associated warehouse transfer batch - unit will be quarantined.' }],
        }],
      }));

      service.validateAll(request).subscribe({
        next: (res) => {
          expect(res.isValid).toBeTrue();
          expect(res.warnings[0].code).toBe('9925');
          done();
        },
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ success: false, statusCode: 500, message: 'Server error' })));

      service.validateAll({ unitId: 'U', productCode: 'P' }).subscribe({
        error: (err) => {
          expect(err.statusCode).toBe(500);
          done();
        },
      });
    });
  });

  // =========================================================================
  // checkIn
  // =========================================================================

  describe('checkIn', () => {
    it('should POST to CHECK_IN and return data[0] on success', (done) => {
      const request: WarehouseCheckInRequestDto = {
        unitId: 'W633300000001', productCode: '69101000',
        locationId: 'WC100800T001', receiveTemp: -20, quarantineFlag: false,
      };

      const mockResponse: ApiResponse<WarehouseCheckInResponseDto> = {
        success: true, statusCode: 200,
        message: 'Unit checked in successfully',
        data: [{
          success: true,
          unitId: 'W633300000001', productCode: '69101000',
          stockState: 'AV', batchId: 'BATCH001', locationId: 'WC100800T001',
          receiveDate: '2026-06-12T00:00:00Z', receiveUser: 'NITOR1',
          batchReconciled: false, message: 'Unit checked in successfully',
        }],
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.checkIn(request).subscribe({
        next: (res) => {
          expect(res.unitId).toBe('W633300000001');
          expect(res.stockState).toBe('AV');
          expect(res.batchReconciled).toBeFalse();
          done();
        },
      });
    });

    it('should pass the request body and SKIP_ERROR_TOAST context to apiService.post', (done) => {
      const request: WarehouseCheckInRequestDto = {
        unitId: 'W633300000001', productCode: '69101000',
      };

      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{
          success: true, unitId: 'W633300000001', productCode: '69101000',
          stockState: 'AV', batchId: null, locationId: 'NONE',
          receiveDate: '2026-06-12T00:00:00Z', receiveUser: 'NITOR1',
          batchReconciled: false, message: 'OK',
        }],
      }));

      service.checkIn(request).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe('/api/v1/warehouse-checkin');
          expect(callArgs[1]).toEqual(request);
          expect(callArgs[2]?.context).toBeTruthy();
          done();
        },
      });
    });

    it('should return batchReconciled = true when last unit closes the batch', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{
          unitId: 'W633300000010', productCode: '69101000',
          stockState: 'AV', batchId: 'BATCH001', locationId: 'NONE',
          receiveDate: '2026-06-12T00:00:00Z', receiveUser: 'NITOR1',
          batchReconciled: true, message: 'Unit checked in. Batch BATCH001 reconciled.',
        }],
      }));

      service.checkIn({ unitId: 'W633300000010', productCode: '69101000' }).subscribe({
        next: (res) => {
          expect(res.batchReconciled).toBeTrue();
          expect(res.message).toContain('reconciled');
          done();
        },
      });
    });

    it('should return quarantine stockState when unit is quarantined', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true, statusCode: 200,
        data: [{
          success: true, unitId: 'W633300000005', productCode: '69101000',
          stockState: 'QU', batchId: null, locationId: 'NONE',
          receiveDate: '2026-06-12T00:00:00Z', receiveUser: 'NITOR1',
          batchReconciled: false, tempOutOfRange: true, warningCode: '9928',
          warningMessage: 'Temperature out of range', message: 'Unit quarantined',
        }],
      }));

      service.checkIn({ unitId: 'W633300000005', productCode: '69101000', quarantineFlag: true }).subscribe({
        next: (res) => {
          expect(res.stockState).toBe('QU');
          expect(res.tempOutOfRange).toBeTrue();
          expect(res.warningCode).toBe('9928');
          done();
        },
      });
    });

    it('should propagate checkIn HTTP errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({
        errorCode: '0313', message: 'Unit not found',
        errorResponse: { errorCode: '0313', error: 'Unit not found' },
      })));

      service.checkIn({ unitId: 'NOTFOUND', productCode: 'RBC' }).subscribe({
        error: (err) => {
          expect(err.errorCode).toBe('0313');
          done();
        },
      });
    });
  });

  // =========================================================================
  // getUnitProducts
  // =========================================================================

  describe('getUnitProducts', () => {
    it('should GET unit products and return the data array on success', (done) => {
      const mockProducts: UnitProductDto[] = [
        {
          productCode: '69101000', collDate: '2026-05-20T00:00:00Z',
          expDate: '2026-06-20T00:00:00Z', productType: 'RBC',
          inventoryClass: 'Regular', warehouseId: 'W1',
          bloodType: 'O+', storageClass: 'R',
        },
        {
          productCode: '69201000', collDate: '2026-05-20T00:00:00Z',
          expDate: '2026-05-25T00:00:00Z', productType: 'PLT',
          inventoryClass: 'Regular', warehouseId: 'W1',
          bloodType: 'O+', storageClass: 'F',
        },
      ];

      const mockResponse: ApiResponse<UnitProductDto> = {
        success: true, statusCode: 200, data: mockProducts,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitProducts('W633300000001').subscribe({
        next: (res) => {
          expect(res.length).toBe(2);
          expect(res[0].productCode).toBe('69101000');
          expect(res[0].productType).toBe('RBC');
          expect(res[1].productCode).toBe('69201000');
          expect(res[1].storageClass).toBe('F');
          done();
        },
      });
    });

    it('should call the correct URL with the encoded unitId', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getUnitProducts('W633300000001').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toContain('/api/v1/warehouse-checkin/unit/');
          expect(callArgs[0]).toContain('W633300000001');
          expect(callArgs[0]).toContain('/products');
          expect(callArgs[1]?.context).toBeTruthy();
          done();
        },
      });
    });

    it('should return empty array when response data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: null }));

      service.getUnitProducts('W633300000001').subscribe({
        next: (res) => {
          expect(res).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when response data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200 }));

      service.getUnitProducts('W633300000001').subscribe({
        next: (res) => {
          expect(res).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when unit has no products', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getUnitProducts('UNKNOWN').subscribe({
        next: (res) => {
          expect(res).toEqual([]);
          done();
        },
      });
    });

    it('should propagate getUnitProducts HTTP errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ message: 'Not found' })));

      service.getUnitProducts('BADUNIT').subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        },
      });
    });
  });

  // =========================================================================
  // getLocationLookup
  // =========================================================================

  describe('getLocationLookup', () => {
    it('should GET location options and map code/description to value/label', (done) => {
      const raw = {
        success: true, statusCode: 200,
        data: [{ level: 'warehouse', options: [{ code: 'W', description: 'Home Warehouse', itemCount: undefined }] }],
      };
      apiServiceSpy.get.and.returnValue(of(raw));

      service.getLocationLookup({ productCode: '69101000' }).subscribe({
        next: (opts) => {
          expect(opts.length).toBe(1);
          expect(opts[0].value).toBe('W');
          expect(opts[0].label).toBe('Home Warehouse');
          done();
        },
      });
    });

    it('should map all fields including deviceType, storageClass, bloodType, and itemCount', (done) => {
      const raw = {
        success: true, statusCode: 200,
        data: [{
          level: 'device',
          options: [{
            code: 'D10', description: 'Device 10', itemCount: 42,
            deviceType: 'C', storageClass: 'R', bloodType: 'O+',
          }],
        }],
      };
      apiServiceSpy.get.and.returnValue(of(raw));

      service.getLocationLookup({ warehouseId: 'W1' }).subscribe({
        next: (opts) => {
          expect(opts.length).toBe(1);
          expect(opts[0].value).toBe('D10');
          expect(opts[0].label).toBe('Device 10');
          expect(opts[0].itemCount).toBe(42);
          expect(opts[0].deviceType).toBe('C');
          expect(opts[0].storageClass).toBe('R');
          expect(opts[0].bloodType).toBe('O+');
          done();
        },
      });
    });

    it('should map multiple options correctly', (done) => {
      const raw = {
        success: true, statusCode: 200,
        data: [{
          level: 'rack',
          options: [
            { code: 'R01', description: 'Rack 01', itemCount: 10 },
            { code: 'R02', description: 'Rack 02', itemCount: 5 },
            { code: 'R03', description: 'Rack 03', itemCount: 0 },
          ],
        }],
      };
      apiServiceSpy.get.and.returnValue(of(raw));

      service.getLocationLookup({ warehouseId: 'W1', deviceNumber: '10' }).subscribe({
        next: (opts) => {
          expect(opts.length).toBe(3);
          expect(opts[0].value).toBe('R01');
          expect(opts[1].value).toBe('R02');
          expect(opts[2].value).toBe('R03');
          expect(opts[2].itemCount).toBe(0);
          done();
        },
      });
    });

    it('should return empty array when no options available', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [{ level: 'tray', options: [] }] }));

      service.getLocationLookup({}).subscribe({
        next: (opts) => {
          expect(opts).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when data[0] is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getLocationLookup({}).subscribe({
        next: (opts) => {
          expect(opts).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when data[0].options is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [{ level: 'warehouse' }] }));

      service.getLocationLookup({}).subscribe({
        next: (opts) => {
          expect(opts).toEqual([]);
          done();
        },
      });
    });

    it('should call with no query params when params is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getLocationLookup().subscribe({
        next: () => {
          const call = apiServiceSpy.get.calls.mostRecent();
          const params: HttpParams = call.args[1]?.params ?? new HttpParams();
          expect(params.keys().length).toBe(0);
          done();
        },
      });
    });

    it('should forward all params as query string', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getLocationLookup({
        productCode: '69101000', warehouseId: 'W', deviceNumber: '10',
        deviceType: 'C', rackNumber: '08', storageClass: 'R', bloodType: 'O',
      }).subscribe({ next: () => done() });

      const call = apiServiceSpy.get.calls.mostRecent();
      const params: HttpParams = call.args[1]?.params ?? new HttpParams();
      expect(params.get('productCode')).toBe('69101000');
      expect(params.get('warehouseId')).toBe('W');
      expect(params.get('deviceNumber')).toBe('10');
    });

    it('should forward chapterId and productType params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getLocationLookup({
        chapterId: 'CH001', productType: 'RBC',
      }).subscribe({ next: () => done() });

      const call = apiServiceSpy.get.calls.mostRecent();
      const params: HttpParams = call.args[1]?.params ?? new HttpParams();
      expect(params.get('chapterId')).toBe('CH001');
      expect(params.get('productType')).toBe('RBC');
    });

    it('should only include params that have truthy values', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getLocationLookup({
        productCode: '69101000',
        warehouseId: undefined,
        deviceNumber: '',
      }).subscribe({ next: () => done() });

      const call = apiServiceSpy.get.calls.mostRecent();
      const params: HttpParams = call.args[1]?.params ?? new HttpParams();
      expect(params.get('productCode')).toBe('69101000');
      expect(params.has('warehouseId')).toBeFalse();
      expect(params.has('deviceNumber')).toBeFalse();
    });

    it('should call the correct URL', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, data: [] }));

      service.getLocationLookup({ productCode: 'P' }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe('/api/v1/warehouse-checkin/location-lookup');
          done();
        },
      });
    });

    it('should propagate HTTP errors from getLocationLookup', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, message: 'Internal Server Error' })));

      service.getLocationLookup({ productCode: '69101000' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(err.message).toBe('Internal Server Error');
          done();
        },
      });
    });
  });

  // =========================================================================
  // getChapterWarehouses
  // =========================================================================

  describe('getChapterWarehouses', () => {
    it('should GET warehouses for a chapter and return the list', (done) => {
      const mockWarehouses = [
        { warehouseId: 'W1', warehouseName: 'Main Warehouse' },
        { warehouseId: 'W2', warehouseName: 'Satellite Warehouse' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockWarehouses));

      service.getChapterWarehouses('WAD').subscribe({
        next: (res) => {
          expect(res.length).toBe(2);
          expect(res[0].warehouseId).toBe('W1');
          expect(res[0].warehouseName).toBe('Main Warehouse');
          expect(res[1].warehouseId).toBe('W2');
          expect(res[1].warehouseName).toBe('Satellite Warehouse');
          done();
        },
      });
    });

    it('should call the correct URL with the chapterId', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.getChapterWarehouses('CH001').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toContain('CH001');
          expect(callArgs[0]).toContain('/warehouses');
          expect(callArgs[1]?.context).toBeTruthy();
          done();
        },
      });
    });

    it('should return single warehouse correctly', (done) => {
      apiServiceSpy.get.and.returnValue(of([
        { warehouseId: 'W1', warehouseName: 'Only Warehouse' },
      ]));

      service.getChapterWarehouses('SINGLE').subscribe({
        next: (res) => {
          expect(res.length).toBe(1);
          expect(res[0].warehouseId).toBe('W1');
          done();
        },
      });
    });

    it('should return empty array on HTTP error (silently)', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ message: 'Forbidden' })));

      service.getChapterWarehouses('WAD').subscribe({
        next: (res) => {
          expect(res).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array on 500 server error (silently)', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, message: 'Internal Server Error' })));

      service.getChapterWarehouses('WAD').subscribe({
        next: (res) => {
          expect(res).toEqual([]);
          done();
        },
      });
    });

    it('should not propagate errors to the error handler', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network Error')));

      service.getChapterWarehouses('WAD').subscribe({
        next: (res) => {
          expect(res).toEqual([]);
          done();
        },
        error: () => {
          fail('should not reach error handler');
        },
      });
    });
  });
});
