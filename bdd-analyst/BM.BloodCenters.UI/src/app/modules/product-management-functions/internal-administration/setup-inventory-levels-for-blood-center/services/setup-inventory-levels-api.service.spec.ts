import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SetupInventoryLevelsApiService } from './setup-inventory-levels-api.service';
import { ApiService } from 'src/app/shared/services/api.service';
import {
  SetInventoryLevelDto,
  CreateSetInventoryLevelDto,
  UpdateSetInventoryLevelDto,
  SetInventoryLevelQueryDto,
  ApiResponse
} from '../models/setup-inventory-levels.model';

describe('SetupInventoryLevelsApiService', () => {
  let service: SetupInventoryLevelsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockInventoryLevel: SetInventoryLevelDto = {
    chapterId: 'CH1',
    customerId: 'C1',
    inventoryClass: 'WB',
    inventoryType: 'MI',
    productType: 'PT01',
    productTypeDesc: 'Product One',
    bloodType: 'A+',
    bloodTypeDesc: 'A Positive',
    attribGroup: 'AG1',
    attribCode: 'AC1',
    tier: null,
    qty: 10,
    effDate: '2025-01-15',
    termDate: null,
    lastModifiedDate: null
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SetupInventoryLevelsApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(SetupInventoryLevelsApiService);
  });

  describe('getInventoryLevels', () => {
    it('should return inventory levels data', (done) => {
      const response: ApiResponse<SetInventoryLevelDto[]> = {
        success: true,
        message: null,
        statusCode: 200,
        data: [mockInventoryLevel],
        totalCount: 1
      };
      apiServiceSpy.post.and.returnValue(of(response));

      const query: SetInventoryLevelQueryDto = {};
      service.getInventoryLevels('WB', query, 25, 0).subscribe(result => {
        expect(result.data).toEqual([mockInventoryLevel]);
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should handle empty data array', (done) => {
      const response: ApiResponse<SetInventoryLevelDto[]> = {
        success: true,
        message: null,
        statusCode: 200,
        data: null as any,
        totalCount: 0
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.getInventoryLevels('WB', {}, 25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should use data length as total when totalCount is missing', (done) => {
      const response = {
        success: true,
        message: null,
        statusCode: 200,
        data: [mockInventoryLevel]
      } as any;
      apiServiceSpy.post.and.returnValue(of(response));

      service.getInventoryLevels('WB', {}, 25, 0).subscribe(result => {
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('API Error')));

      service.getInventoryLevels('WB', {}, 25, 0).subscribe({
        error: (err) => {
          expect(err.message).toBe('API Error');
          done();
        }
      });
    });

    it('should call POST with correct URL', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [], totalCount: 0, success: true, message: null, statusCode: 200 }));
      service.getInventoryLevels('WB', {}, 25, 0).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/distributions/set-inventory-levels/WB/25/0',
        jasmine.any(Object)
      );
    });
  });

  describe('getInventoryLevel', () => {
    it('should return a single inventory level', (done) => {
      const response: ApiResponse<SetInventoryLevelDto> = {
        success: true,
        message: null,
        statusCode: 200,
        data: mockInventoryLevel
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getInventoryLevel('WB', 'MI', 'PT01', 'A+').subscribe(result => {
        expect(result).toEqual(mockInventoryLevel);
        done();
      });
    });

    it('should return null when data is null', (done) => {
      const response: ApiResponse<SetInventoryLevelDto> = {
        success: true,
        message: null,
        statusCode: 200,
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getInventoryLevel('WB', 'MI', 'PT01', null).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getInventoryLevel('WB', 'MI', 'PT01', null).subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        }
      });
    });

    it('should not log when suppressErrorNotification is true', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not found')));
      const consoleSpy = spyOn(console, 'error');

      service.getInventoryLevel('WB', 'MI', 'PT01', null, true).subscribe({
        error: () => {
          expect(consoleSpy).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should include bloodType param when provided', () => {
      apiServiceSpy.get.and.returnValue(of({ data: mockInventoryLevel, success: true, message: null, statusCode: 200 }));
      service.getInventoryLevel('WB', 'MI', 'PT01', 'A+').subscribe();
      const callArgs = apiServiceSpy.get.calls.mostRecent().args;
      expect(callArgs[1]?.params?.get('bloodType')).toBe('A+');
    });

    it('should not include bloodType param when null', () => {
      apiServiceSpy.get.and.returnValue(of({ data: mockInventoryLevel, success: true, message: null, statusCode: 200 }));
      service.getInventoryLevel('WB', 'MI', 'PT01', null).subscribe();
      const callArgs = apiServiceSpy.get.calls.mostRecent().args;
      expect(callArgs[1]?.params?.has('bloodType')).toBeFalse();
    });
  });

  describe('createInventoryLevel', () => {
    it('should create an inventory level', (done) => {
      const response: ApiResponse<SetInventoryLevelDto> = {
        success: true,
        message: null,
        statusCode: 201,
        data: mockInventoryLevel
      };
      apiServiceSpy.post.and.returnValue(of(response));

      const dto: CreateSetInventoryLevelDto = {
        inventoryType: 'MI',
        productType: 'PT01',
        bloodType: 'A+',
        qty: 10,
        effDate: '2025-01-15'
      };

      service.createInventoryLevel('WB', dto).subscribe(result => {
        expect(result).toEqual(mockInventoryLevel);
        done();
      });
    });

    it('should propagate create errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Create failed')));

      const dto: CreateSetInventoryLevelDto = {
        inventoryType: 'MI',
        productType: 'PT01',
        bloodType: null,
        qty: 10,
        effDate: '2025-01-15'
      };

      service.createInventoryLevel('WB', dto).subscribe({
        error: (err) => {
          expect(err.message).toBe('Create failed');
          done();
        }
      });
    });
  });

  describe('updateInventoryLevel', () => {
    it('should update an inventory level', (done) => {
      const response: ApiResponse<SetInventoryLevelDto> = {
        success: true,
        message: null,
        statusCode: 200,
        data: mockInventoryLevel
      };
      apiServiceSpy.put.and.returnValue(of(response));

      const dto: UpdateSetInventoryLevelDto = {
        qty: 15,
        effDate: '2025-01-15'
      };

      service.updateInventoryLevel('WB', 'MI', 'PT01', 'A+', 'AG1', 'AC1', '2025-01-15', dto).subscribe(result => {
        expect(result).toEqual(mockInventoryLevel);
        done();
      });
    });

    it('should include inventoryType when provided', () => {
      apiServiceSpy.put.and.returnValue(of({ data: mockInventoryLevel, success: true, message: null, statusCode: 200 }));
      const dto: UpdateSetInventoryLevelDto = { qty: 15, effDate: '2025-01-15' };

      service.updateInventoryLevel('WB', 'MI', 'PT01', null, null, null, '2025-01-15', dto).subscribe();
      const callArgs = apiServiceSpy.put.calls.mostRecent().args;
      expect(callArgs[2]?.params?.get('inventoryType')).toBe('MI');
    });

    it('should not include inventoryType when null', () => {
      apiServiceSpy.put.and.returnValue(of({ data: mockInventoryLevel, success: true, message: null, statusCode: 200 }));
      const dto: UpdateSetInventoryLevelDto = { qty: 15, effDate: '2025-01-15' };

      service.updateInventoryLevel('WB', null, 'PT01', null, null, null, '2025-01-15', dto).subscribe();
      const callArgs = apiServiceSpy.put.calls.mostRecent().args;
      expect(callArgs[2]?.params?.has('inventoryType')).toBeFalse();
    });

    it('should include optional params when provided', () => {
      apiServiceSpy.put.and.returnValue(of({ data: mockInventoryLevel, success: true, message: null, statusCode: 200 }));
      const dto: UpdateSetInventoryLevelDto = { qty: 15, effDate: '2025-01-15' };

      service.updateInventoryLevel('WB', 'MI', 'PT01', 'A+', 'AG1', 'AC1', '2025-01-15', dto).subscribe();
      const callArgs = apiServiceSpy.put.calls.mostRecent().args;
      expect(callArgs[2]?.params?.get('bloodType')).toBe('A+');
      expect(callArgs[2]?.params?.get('attribGroup')).toBe('AG1');
      expect(callArgs[2]?.params?.get('attribCode')).toBe('AC1');
    });

    it('should propagate update errors', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Update failed')));

      const dto: UpdateSetInventoryLevelDto = { qty: 15, effDate: '2025-01-15' };
      service.updateInventoryLevel('WB', 'MI', 'PT01', null, null, null, '2025-01-15', dto).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        }
      });
    });
  });

  describe('deleteInventoryLevel', () => {
    it('should delete an inventory level', (done) => {
      apiServiceSpy.delete.and.returnValue(of(undefined as any));

      service.deleteInventoryLevel('WB', 'MI', 'PT01', 'A+', 'AG1', 'AC1', '2025-01-15').subscribe(() => {
        expect(apiServiceSpy.delete).toHaveBeenCalled();
        done();
      });
    });

    it('should include all params', () => {
      apiServiceSpy.delete.and.returnValue(of(undefined as any));
      service.deleteInventoryLevel('WB', 'MI', 'PT01', 'A+', 'AG1', 'AC1', '2025-01-15').subscribe();

      const callArgs = apiServiceSpy.delete.calls.mostRecent().args;
      expect(callArgs[1]?.params?.get('inventoryType')).toBe('MI');
      expect(callArgs[1]?.params?.get('productType')).toBe('PT01');
      expect(callArgs[1]?.params?.get('effDate')).toBe('2025-01-15');
      expect(callArgs[1]?.params?.get('bloodType')).toBe('A+');
    });

    it('should not include null optional params', () => {
      apiServiceSpy.delete.and.returnValue(of(undefined as any));
      service.deleteInventoryLevel('WB', 'MI', 'PT01', null, null, null, '2025-01-15').subscribe();

      const callArgs = apiServiceSpy.delete.calls.mostRecent().args;
      expect(callArgs[1]?.params?.has('bloodType')).toBeFalse();
      expect(callArgs[1]?.params?.has('attribGroup')).toBeFalse();
    });

    it('should propagate delete errors', (done) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      service.deleteInventoryLevel('WB', 'MI', 'PT01', null, null, null, '2025-01-15').subscribe({
        error: (err) => {
          expect(err.message).toBe('Delete failed');
          done();
        }
      });
    });
  });

  describe('LOV endpoints', () => {
    it('should get inventory classes', (done) => {
      const response = { success: true, message: null, statusCode: 200, data: [{ code: 'WB', codeDesc: 'Whole Blood' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getInventoryClasses().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('WB');
        done();
      });
    });

    it('should handle null data in inventory classes', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true, message: null, statusCode: 200 }));
      service.getInventoryClasses().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate inventory classes error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));
      service.getInventoryClasses().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed');
          done();
        }
      });
    });

    it('should get inventory types', (done) => {
      const response = { success: true, message: null, statusCode: 200, data: [{ code: 'MI', codeDesc: 'Minimal' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getInventoryTypes().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should handle null data in inventory types', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true, message: null, statusCode: 200 }));
      service.getInventoryTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate inventory types error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));
      service.getInventoryTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed');
          done();
        }
      });
    });

    it('should get product types', (done) => {
      const response = { success: true, message: null, statusCode: 200, data: [{ productType: 'PT01', productTypeDesc: 'Desc' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getProductTypes().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should handle null data in product types', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true, message: null, statusCode: 200 }));
      service.getProductTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate product types error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));
      service.getProductTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed');
          done();
        }
      });
    });

    it('should get blood types', (done) => {
      const response = { success: true, message: null, statusCode: 200, data: [{ aboCode: 'A+', aboDesc: 'A Positive' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getBloodTypes().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should handle null data in blood types', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true, message: null, statusCode: 200 }));
      service.getBloodTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate blood types error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));
      service.getBloodTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed');
          done();
        }
      });
    });

    it('should get attribute groups', (done) => {
      const response = { success: true, message: null, statusCode: 200, data: [{ attribGroup: 'AG1' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getAttributeGroups().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should handle null data in attribute groups', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true, message: null, statusCode: 200 }));
      service.getAttributeGroups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate attribute groups error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));
      service.getAttributeGroups().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed');
          done();
        }
      });
    });

    it('should get attribute codes for a group', (done) => {
      const response = { success: true, message: null, statusCode: 200, data: [{ attribCode: 'AC1', attribDesc: 'Code 1' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getAttributeCodes('AG1').subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should handle null data in attribute codes', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true, message: null, statusCode: 200 }));
      service.getAttributeCodes('AG1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate attribute codes error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));
      service.getAttributeCodes('AG1').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed');
          done();
        }
      });
    });

    it('should use correct URL for attribute codes', () => {
      apiServiceSpy.get.and.returnValue(of({ data: [], success: true, message: null, statusCode: 200 }));
      service.getAttributeCodes('AG1').subscribe();
      const callArgs = apiServiceSpy.get.calls.mostRecent().args;
      expect(callArgs[0]).toBe('/api/v1/distributions/set-inventory-levels/attribute-codes/AG1');
    });
  });
});
