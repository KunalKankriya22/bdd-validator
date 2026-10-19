import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import moment from 'moment';

import { ProductStorageDefinitionService } from './product-storage-definition.service';
import { ApiService } from '@shared/services/api.service';
import { ProductStorageQueryDto, ReturnResult, LovOption } from '../models/product-storage-definition.model';

describe('ProductStorageDefinitionService', () => {
  let service: ProductStorageDefinitionService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockApiItem = {
    productType: 'RBC',
    warehouseId: 'A',
    deviceType: 'F',
    deviceNumber: '01',
    trayCapacity: 12,
    effectiveDate: '2028-01-15T00:00:00Z',
    termDate: '2027-06-30T00:00:00Z',
    chapterId: 'CH01',
    lastModifiedDate: '2028-05-01T10:00:00Z',
    productTypeDesc: 'Red Blood Cells',
    warehouseDesc: 'Main Warehouse',
    deviceDesc: 'Freezer',
    deviceDescription: 'Freezer Unit 01'
  };

  const emptyResult = <T>(): ReturnResult<T> => ({
    success: true, message: '', error: null, statusCode: 200, data: null, total: 0
  });

  const successResult = <T>(data: T[], total = data.length): ReturnResult<T> => ({
    success: true, message: 'OK', error: null, statusCode: 200, data, total
  });

  const mockSaveResult = {
    success: true, message: 'Saved', statusCode: 200, item: true,
    errorResponse: { errorCode: '', error: '' }
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ProductStorageDefinitionService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ProductStorageDefinitionService);
  });


  // ─── getProductStorageList ─────────────────────────────────────────────────

  describe('getProductStorageList()', () => {
    const query: ProductStorageQueryDto = {
      searchKeyword: null, sortColumn: 'ProductType', sortOrder: 'ASC',
      productType: null, warehouseId: null, deviceType: null,
      effectiveDate: null, effectiveDatePeriod: null,
      terminationDate: null, terminationDatePeriod: null
    };

    it('should POST to the list endpoint with take/skip', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('/api/v1/product-storage/25/0'), query
      );
    });

    it('should map deviceNumber → number', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].number).toBe('01');
      });
    });

    it('should map trayCapacity to string', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].trayCapacity).toBe('12');
      });
    });

    it('should map termDate → terminationDate in DD-MMM-YYYY format', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].terminationDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
        expect(result.data[0].terminationDate).toBe('30-JUN-2027');
      });
    });

    it('should map effectiveDate to DD-MMM-YYYY format', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].effectiveDate).toBe('15-JAN-2028');
      });
    });

    it('should map warehouseDesc → warehouseDescription', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].warehouseDescription).toBe('Main Warehouse');
      });
    });

    it('should map deviceDescription correctly', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem])));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].deviceDescription).toBe('Freezer Unit 01');
      });
    });





    it('should return totalRecords from res.total', () => {
      mockApiService.post.and.returnValue(of(successResult([mockApiItem, mockApiItem], 42)));

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.totalRecords).toBe(42);
      });
    });
  });

  // ─── createProductStorage ──────────────────────────────────────────────────

  describe('createProductStorage()', () => {
    it('should POST to the create endpoint', () => {
      mockApiService.post.and.returnValue(of(mockSaveResult));

      const dto = {
        productType: 'RBC', warehouseId: 'A', deviceType: 'F', deviceNumber: '01',
        trayCapacity: 12, effectiveDate: '2028-06-01', termDate: null
      };

      service.createProductStorage(dto).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('/api/v1/product-storage'), dto
      );
    });
  });

  // ─── updateProductStorage ──────────────────────────────────────────────────

  describe('updateProductStorage()', () => {
    it('should PUT to URL containing all composite key parts', () => {
      mockApiService.put.and.returnValue(of(mockSaveResult));

      const dto = { trayCapacity: 20, effectiveDate: '2028-01-15', termDate: '2027-12-31' };
      service.updateProductStorage('RBC', 'A', 'F', '01', dto).subscribe();

      const url: string = mockApiService.put.calls.mostRecent().args[0];
      expect(url).toContain('RBC');
      expect(url).toContain('A');
      expect(url).toContain('F');
      expect(url).toContain('01');
    });

    it('should pass the DTO body correctly', () => {
      mockApiService.put.and.returnValue(of(mockSaveResult));

      const dto = { trayCapacity: 20, effectiveDate: '2028-01-15', termDate: null };
      service.updateProductStorage('RBC', 'A', 'F', '01', dto).subscribe();

      expect(mockApiService.put.calls.mostRecent().args[1]).toEqual(dto);
    });
  });

  // ─── deleteProductStorage ──────────────────────────────────────────────────

  describe('deleteProductStorage()', () => {
    it('should DELETE to URL containing all composite key parts', () => {
      mockApiService.delete.and.returnValue(of(mockSaveResult));

      service.deleteProductStorage('RBC', 'A', 'F', '01').subscribe();

      const url: string = mockApiService.delete.calls.mostRecent().args[0];
      expect(url).toContain('RBC');
      expect(url).toContain('A');
      expect(url).toContain('F');
      expect(url).toContain('01');
    });
  });

  // ─── getProductTypeLov ─────────────────────────────────────────────────────

  describe('getProductTypeLov()', () => {
    it('should map productType/productTypeDesc to code/description', () => {
      mockApiService.get.and.returnValue(of(successResult([
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' }
      ])));

      service.getProductTypeLov().subscribe(res => {
        expect(res.data).toEqual([
          { code: 'RBC', description: 'Red Blood Cells' },
          { code: 'PLT', description: 'Platelets' }
        ]);
      });
    });
  });

  // ─── getWarehouseLov ───────────────────────────────────────────────────────

  describe('getWarehouseLov()', () => {
    it('should map warehouseId/codeDesc to code/description', () => {
      mockApiService.get.and.returnValue(of(successResult([
        { warehouseId: 'A', codeDesc: 'Main Warehouse' }
      ])));

      service.getWarehouseLov().subscribe(res => {
        expect(res.data).toEqual([{ code: 'A', description: 'Main Warehouse' }]);
      });
    });
  });

  // ─── getDeviceTypeLov ──────────────────────────────────────────────────────

  describe('getDeviceTypeLov()', () => {
    it('should map code/codeDesc to code/description', () => {
      mockApiService.get.and.returnValue(of(successResult([
        { code: 'F', codeDesc: 'Freezer' },
        { code: 'R', codeDesc: 'Refrigerator' }
      ])));

      service.getDeviceTypeLov().subscribe(res => {
        expect(res.data).toEqual([
          { code: 'F', description: 'Freezer' },
          { code: 'R', description: 'Refrigerator' }
        ]);
      });
    });
  });

  // ─── getDeviceNumbersLov ───────────────────────────────────────────────────

  describe('getDeviceNumbersLov()', () => {


    it('should map deviceNumber/deviceDescription to code/description', () => {
      mockApiService.get.and.returnValue(of(successResult([
        { deviceNumber: '01', deviceDescription: 'Freezer Unit 01' },
        { deviceNumber: '02', deviceDescription: 'Freezer Unit 02' }
      ])));

      service.getDeviceNumbersLov('A', 'F').subscribe(res => {
        expect(res.data).toEqual([
          { code: '01', description: 'Freezer Unit 01' },
          { code: '02', description: 'Freezer Unit 02' }
        ]);
      });
    });
  });

  // ─── Filter aliases ────────────────────────────────────────────────────────
  // ─── date formatting ───────────────────────────────────────────────────────

  describe('date formatting', () => {
    it('should format ISO date to DD-MMM-YYYY uppercase', () => {
      const item = { ...mockApiItem, effectiveDate: '2028-03-15T00:00:00Z', termDate: null };
      mockApiService.post.and.returnValue(of(successResult([item])));

      const query: ProductStorageQueryDto = {
        searchKeyword: null, sortColumn: 'ProductType', sortOrder: 'ASC',
        productType: null, warehouseId: null, deviceType: null,
        effectiveDate: null, effectiveDatePeriod: null,
        terminationDate: null, terminationDatePeriod: null
      };

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].effectiveDate).toBe('15-MAR-2028');
      });
    });

    it('should set effectiveDate to empty string for null/invalid dates', () => {
      const item = { ...mockApiItem, effectiveDate: null as any, termDate: null };
      mockApiService.post.and.returnValue(of(successResult([item])));

      const query: ProductStorageQueryDto = {
        searchKeyword: null, sortColumn: 'ProductType', sortOrder: 'ASC',
        productType: null, warehouseId: null, deviceType: null,
        effectiveDate: null, effectiveDatePeriod: null,
        terminationDate: null, terminationDatePeriod: null
      };

      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].effectiveDate).toBe('');
      });
    });
  
  // ─── branch: null data array ────────────────────────────────────────────────

  describe('getProductStorageList - null data branch', () => {
    const query = {
      searchKeyword: null, sortColumn: 'ProductType', sortOrder: 'ASC',
      productType: null, warehouseId: null, deviceType: null,
      effectiveDate: null, effectiveDatePeriod: null,
      terminationDate: null, terminationDatePeriod: null
    };

    it('should handle null data array gracefully', () => {
      mockApiService.post.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: null, total: 0 }));
      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
      });
    });

    it('should use totalCount when present', () => {
      mockApiService.post.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: [mockApiItem], total: 0, totalCount: 99 }));
      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.totalRecords).toBe(99);
      });
    });

    it('should handle null termDate gracefully', () => {
      const item = { ...mockApiItem, termDate: null };
      mockApiService.post.and.returnValue(of(successResult([item])));
      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].terminationDate).toBeNull();
      });
    });

    it('should handle null lastModifiedDate gracefully', () => {
      const item = { ...mockApiItem, lastModifiedDate: null };
      mockApiService.post.and.returnValue(of(successResult([item])));
      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].lastModifiedDate).toBeNull();
      });
    });

    it('should use deviceDesc fallback when deviceDescription is null', () => {
      const item = { ...mockApiItem, deviceDescription: null, deviceDesc: 'Fallback Desc' };
      mockApiService.post.and.returnValue(of(successResult([item])));
      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].deviceDescription).toBe('Fallback Desc');
      });
    });

    it('should use empty string when both deviceDescription and deviceDesc are null', () => {
      const item = { ...mockApiItem, deviceDescription: null, deviceDesc: null };
      mockApiService.post.and.returnValue(of(successResult([item])));
      service.getProductStorageList(25, 0, query).subscribe(result => {
        expect(result.data[0].deviceDescription).toBe('');
      });
    });
  });

  // ─── filter alias methods ────────────────────────────────────────────────────

  describe('filter alias methods', () => {
    it('getFilterProductTypes should delegate to getProductTypeLov', () => {
      mockApiService.get.and.returnValue(of(successResult([{ productType: 'RBC', productTypeDesc: 'Red Blood Cells' }])));
      service.getFilterProductTypes().subscribe(res => {
        expect(res.data![0].code).toBe('RBC');
      });
    });

    it('getFilterWarehouseCodes should delegate to getWarehouseLov', () => {
      mockApiService.get.and.returnValue(of(successResult([{ warehouseId: 'A', codeDesc: 'Main' }])));
      service.getFilterWarehouseCodes().subscribe(res => {
        expect(res.data![0].code).toBe('A');
      });
    });

    it('getFilterDeviceTypes should delegate to getDeviceTypeLov', () => {
      mockApiService.get.and.returnValue(of(successResult([{ code: 'F', codeDesc: 'Freezer' }])));
      service.getFilterDeviceTypes().subscribe(res => {
        expect(res.data![0].code).toBe('F');
      });
    });
  });

  // ─── deleteProductStorage ────────────────────────────────────────────────────

  describe('deleteProductStorage (explicit)', () => {
    it('should call delete on ApiService', () => {
      mockApiService.delete.and.returnValue(of(mockSaveResult));
      let called = false;
      service.deleteProductStorage('RBC', 'A', 'F', '01').subscribe(() => { called = true; });
      expect(mockApiService.delete).toHaveBeenCalled();
      expect(called).toBe(true);
    });
  });

});
});
