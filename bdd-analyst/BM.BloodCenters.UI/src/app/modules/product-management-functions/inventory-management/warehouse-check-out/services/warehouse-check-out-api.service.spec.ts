import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WarehouseCheckOutApiService } from './warehouse-check-out-api.service';
import { ApiService } from '@shared/services/api.service';

describe('WarehouseCheckOutApiService', () => {
  let service: WarehouseCheckOutApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        WarehouseCheckOutApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(WarehouseCheckOutApiService);
  });

  // ── GETs returning r.data ?? [] ──────────────────────────────────────
  (['getBatches', 'getWarehouses'] as const).forEach((method) => {
    describe(method, () => {
      it('should return response.data', (done) => {
        const mockData = [{ id: '1' }];
        apiSpy.get.and.returnValue(of({ data: mockData }));

        (service[method]() as any).subscribe((result: any) => {
          expect(result).toEqual(mockData);
          done();
        });
      });

      it('should return empty array when data is null', (done) => {
        apiSpy.get.and.returnValue(of({ data: null }));

        (service[method]() as any).subscribe((result: any) => {
          expect(result).toEqual([]);
          done();
        });
      });

      it('should rethrow error', (done) => {
        apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

        (service[method]() as any).subscribe({ error: (e: any) => { expect(e).toBeTruthy(); done(); } });
      });
    });
  });

  describe('getBatchById', () => {
    it('should return response.item', (done) => {
      const mockItem = { batchId: 'B1', status: 'OPEN' };
      apiSpy.get.and.returnValue(of({ item: mockItem }));

      service.getBatchById('B1').subscribe((result) => {
        expect(result).toEqual(mockItem as any);
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getBatchById('B1').subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  describe('createBatch', () => {
    it('should POST request and return response', (done) => {
      const mockResponse = { data: [{ batchId: 'B1' }], success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.createBatch({ toWarehouse: 'W1', checkoutTemp: null, batchName: null }).subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.createBatch({ toWarehouse: 'W1', checkoutTemp: null, batchName: null }).subscribe({
        error: (e) => { expect(e).toBeTruthy(); done(); },
      });
    });
  });

  describe('updateBatch', () => {
    it('should PUT request and return response', (done) => {
      const mockResponse = { data: [], success: true };
      apiSpy.put.and.returnValue(of(mockResponse));

      service.updateBatch('B1', { checkoutTemp: 5, batchName: null }).subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.put.and.returnValue(throwError(() => new Error('fail')));

      service.updateBatch('B1', { checkoutTemp: 5, batchName: null }).subscribe({
        error: (e) => { expect(e).toBeTruthy(); done(); },
      });
    });
  });

  describe('addProduct', () => {
    it('should POST product to batch', (done) => {
      const mockResponse = { data: [], success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.addProduct('B1', { unitId: 'U1', productCode: 'PC1' }).subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.addProduct('B1', { unitId: 'U1', productCode: 'PC1' }).subscribe({
        error: (e) => { expect(e).toBeTruthy(); done(); },
      });
    });
  });

  describe('removeProduct', () => {
    it('should DELETE product with optional params', (done) => {
      const mockResponse = { data: [], success: true };
      apiSpy.delete.and.returnValue(of(mockResponse));

      service.removeProduct('B1', 'PC1', 'U1', 'A1').subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        const callArgs = apiSpy.delete.calls.mostRecent().args;
        expect(callArgs[1].params.get('unitId')).toBe('U1');
        expect(callArgs[1].params.get('aliquot')).toBe('A1');
        done();
      });
    });

    it('should DELETE without optional params', (done) => {
      const mockResponse = { data: [], success: true };
      apiSpy.delete.and.returnValue(of(mockResponse));

      service.removeProduct('B1', 'PC1').subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        const callArgs = apiSpy.delete.calls.mostRecent().args;
        expect(callArgs[1].params.has('unitId')).toBe(false);
        expect(callArgs[1].params.has('aliquot')).toBe(false);
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.delete.and.returnValue(throwError(() => new Error('fail')));

      service.removeProduct('B1', 'PC1').subscribe({
        error: (e) => { expect(e).toBeTruthy(); done(); },
      });
    });
  });

  describe('lookupUnit', () => {
    it('should return response.data', (done) => {
      apiSpy.get.and.returnValue(of({ data: [{ unitId: 'U1' }] }));

      service.lookupUnit('U1').subscribe((result) => {
        expect(result).toEqual([{ unitId: 'U1' }] as any);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.lookupUnit('U1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.lookupUnit('U1').subscribe({
        error: (e) => { expect(e).toBeTruthy(); done(); },
      });
    });
  });

  describe('commitBatch', () => {
    it('should POST null body', (done) => {
      const mockResponse = { data: [], success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.commitBatch('B1').subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post.calls.mostRecent().args[1]).toBeNull();
        done();
      });
    });

    it('should rethrow error', (done) => {
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.commitBatch('B1').subscribe({
        error: (e) => { expect(e).toBeTruthy(); done(); },
      });
    });
  });
});
