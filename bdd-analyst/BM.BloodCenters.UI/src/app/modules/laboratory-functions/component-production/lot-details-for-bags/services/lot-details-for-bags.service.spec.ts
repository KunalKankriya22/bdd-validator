import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { LotDetailsForBagsService } from './lot-details-for-bags.service';
import { ApiService } from '@shared/services/api.service';

describe('LotDetailsForBagsService', () => {
  let service: LotDetailsForBagsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        LotDetailsForBagsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(LotDetailsForBagsService);
  });

  describe('getValidLots', () => {
    it('should return lot data', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ lotNumber: 'LOT001', catalogNumber: 'CAT001', vendorName: 'Vendor A',
                 dateReceived: '2025-03-15T00:00:00', numberOfUnits: 100, numberOfCartons: 10,
                 spFlag: 'A', volumeTypeSet: 'VTS01', supplyCode: 'SUP01',
                 effDate: '2025-01-01T00:00:00', termDate: '2025-12-31T00:00:00', lastModifiedDate: null }],
        total: 1,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getValidLots(25, 0, {}).subscribe((result) => {
        expect(result.items.length).toBe(1);
        expect(result.items[0].lotNumber).toBe('LOT001');
        expect(result.totalRecords).toBe(1);
        done();
      });
    });

    it('should pass payload with filters', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: [] }));

      service.getValidLots(25, 0, { showExpired: true, searchKeyword: 'test', sortColumn: 'LOT_NUMBER', sortOrder: 'ASC' }).subscribe(() => {
        const payload = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(payload['showExpired']).toBeTrue();
        expect(payload['searchKeyword']).toBe('test');
        expect(payload['sortColumn']).toBe('LOT_NUMBER');
        expect(payload['sortOrder']).toBe('ASC');
        done();
      });
    });

    it('should use take/skip in URL', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: [] }));

      service.getValidLots(10, 20, {}).subscribe(() => {
        const url = apiServiceSpy.post.calls.mostRecent().args[0];
        expect(url).toContain('/10/20');
        done();
      });
    });

  });

  describe('createValidLot', () => {
    it('should create a lot', (done) => {
      const mockResponse = { success: true, message: 'Created', statusCode: 201, data: { lotNumber: 'LOT001' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createValidLot({ lotNumber: 'LOT001', catalogNumber: 'CAT001' }).subscribe((result) => {
        expect(result.success).toBeTrue();
        done();
      });
    });

  });

  describe('updateValidLot', () => {
    it('should update a lot', (done) => {
      const mockResponse = { success: true, message: 'Updated', statusCode: 200, data: { lotNumber: 'LOT001' } };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateValidLot('LOT001', 'CAT001', { lotNumber: 'LOT001', catalogNumber: 'CAT001', bagCode: '01', vendorName: 'Updated' }).subscribe((result) => {
        expect(result.success).toBeTrue();
        done();
      });
    });
  });
  describe('getVolumeTypeSets', () => {
    it('should return volume type sets', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [{ code: 'VTS01', description: 'Type 1' }] }));

      service.getVolumeTypeSets().subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });
  });

  describe('getSupplyCodes', () => {
    it('should return supply codes', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [{ code: 'SUP01', description: 'Supply 1' }] }));

      service.getSupplyCodes().subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });
  });
});
