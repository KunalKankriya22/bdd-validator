import { TestBed } from '@angular/core/testing';
import { StorageDeviceService } from './storage-device.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  StorageDeviceQueryDto,
  CreateStorageDeviceDto,
  UpdateStorageDeviceDto
} from '../models/storage-device.model';

describe('StorageDeviceService', () => {
  let service: StorageDeviceService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockQueryDto: StorageDeviceQueryDto = {
    warehouseId: 'WH01',
    searchKeyword: null,
    sortColumn: 'DeviceType',
    sortOrder: 'ASC',
    filterDeviceType: null,
    filterStatusCode: null,
    filterEffectiveDateAfter: null,
    filterEffectiveDateBefore: null,
    filterTermDateAfter: null,
    filterTermDateBefore: null
  };

  const mockListResponse = {
    success: true,
    message: '',
    error: null,
    statusCode: 200,
    data: [
      {
        deviceType: 'FRIDGE',
        deviceDescription: 'Main Fridge',
        deviceNumber: '01',
        deviceStatus: 'A',
        deviceStatusDescription: 'Active',
        rackCount: 5,
        installDate: '01-JAN-2024',
        lastServiceDate: null,
        nextServiceDate: null,
        lastTemperature: 4.5,
        tempReadDate: null,
        effectiveDate: '01-JAN-2024',
        terminationDate: null,
        lastModifiedDate: null
      }
    ],
    total: 1
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        StorageDeviceService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(StorageDeviceService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getStorageDevices', () => {
    it('should call post with correct URL and return mapped data', (done) => {
      apiService.post.and.returnValue(of(mockListResponse));

      service.getStorageDevices(25, 0, mockQueryDto).subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/storage-device/25/0',
          mockQueryDto
        );
        expect(result.data.length).toBe(1);
        expect(result.data[0].deviceType).toBe('FRIDGE');
        expect(result.totalRecords).toBe(1);
        done();
      });
    });


  });

  describe('createStorageDevice', () => {
    it('should call post with correct endpoint', (done) => {
      const dto: CreateStorageDeviceDto = {
        warehouseId: 'WH01',
        deviceType: 'FRIDGE',
        deviceDescription: 'Test',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 1,
        installDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
        lastTemperature: null,
        tempReadDate: null,
        effectiveDate: '2024-01-01',
        terminationDate: null
      };
      const saveResult = { success: true, message: 'Created', statusCode: 200, item: true, errorResponse: { errorCode: '', error: '' } };
      apiService.post.and.returnValue(of(saveResult));

      service.createStorageDevice(dto).subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith('/api/v1/storage-device', dto);
        expect(result.success).toBeTrue();
        done();
      });
    });
  });

  describe('updateStorageDevice', () => {
    it('should call put with correct endpoint', (done) => {
      const dto: UpdateStorageDeviceDto = {
        warehouseId: 'WH01',
        deviceType: 'FRIDGE',
        deviceDescription: 'Updated',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 2,
        installDate: null,
        lastServiceDate: null,
        nextServiceDate: null,
        lastTemperature: null,
        tempReadDate: null,
        effectiveDate: '2024-01-01',
        terminationDate: null
      };
      const saveResult = { success: true, message: 'Updated', statusCode: 200, item: true, errorResponse: { errorCode: '', error: '' } };
      apiService.put.and.returnValue(of(saveResult));

      service.updateStorageDevice(dto).subscribe((result) => {
        expect(apiService.put).toHaveBeenCalledWith('/api/v1/storage-device', dto);
        expect(result.success).toBeTrue();
        done();
      });
    });
  });

  describe('getWarehouseLov', () => {
    it('should call get with correct endpoint', (done) => {
      const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [{ code: 'WH01', description: 'Warehouse 1' }], total: 1 };
      apiService.get.and.returnValue(of(lovResponse));

      service.getWarehouseLov().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/storage-device/warehouse-lov');
        expect(result.data!.length).toBe(1);
        done();
      });
    });
  });

  describe('getDeviceTypeLov', () => {
    it('should call get with correct endpoint', (done) => {
      const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [{ code: 'FRIDGE', description: 'Fridge' }], total: 1 };
      apiService.get.and.returnValue(of(lovResponse));

      service.getDeviceTypeLov().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/storage-device/device-type-lov');
        expect(result.data!.length).toBe(1);
        done();
      });
    });
  });

  describe('getDeviceStatusLov', () => {
    it('should call get with correct endpoint', (done) => {
      const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [{ code: 'A', description: 'Active' }], total: 1 };
      apiService.get.and.returnValue(of(lovResponse));

      service.getDeviceStatusLov().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/storage-device/device-status-lov');
        expect(result.data!.length).toBe(1);
        done();
      });
    });
  });

  describe('getFilterDeviceTypes', () => {
    it('should call get with warehouse ID in URL', (done) => {
      const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [{ code: 'FRIDGE', description: 'Fridge' }], total: 1 };
      apiService.get.and.returnValue(of(lovResponse));

      service.getFilterDeviceTypes('WH01').subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/storage-device/filter/device-types?warehouseId=WH01');
        expect(result.data!.length).toBe(1);
        done();
      });
    });

    it('should encode special characters in warehouse ID', (done) => {
      const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [], total: 0 };
      apiService.get.and.returnValue(of(lovResponse));

      service.getFilterDeviceTypes('WH&01').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/storage-device/filter/device-types?warehouseId=WH%2601');
        done();
      });
    });
  });

  describe('getFilterStatusCodes', () => {
    it('should call get with warehouse ID in URL', (done) => {
      const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [{ code: 'A', description: 'Active' }], total: 1 };
      apiService.get.and.returnValue(of(lovResponse));

      service.getFilterStatusCodes('WH01').subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/storage-device/filter/status-codes?warehouseId=WH01');
        expect(result.data!.length).toBe(1);
        done();
      });
    });
  });
});
