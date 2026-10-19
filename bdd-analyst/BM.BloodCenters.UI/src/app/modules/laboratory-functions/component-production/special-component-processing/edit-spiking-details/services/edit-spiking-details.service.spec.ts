import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EditSpikingDetailsService } from './edit-spiking-details.service';
import { ApiService } from '@shared/services/api.service';

describe('EditSpikingDetailsService', () => {
  let service: EditSpikingDetailsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        EditSpikingDetailsService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(EditSpikingDetailsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // -- getByKey --------------------------------------------------------------

  describe('getByKey', () => {
    it('should return data when response contains data', (done: DoneFn) => {
      const mockDto = { unitId: 'U1', spikingType: 'A' };
      apiServiceSpy.get.and.returnValue(of({ data: mockDto }));

      service.getByKey('U1', '2024-01-01', 'PC1', 'CP1', 'PR1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDto as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return null when response data is absent', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getByKey('U1', '2024-01-01', 'PC1', 'CP1', 'PR1').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('not found')));

      service.getByKey('U1', '2024-01-01', 'PC1', 'CP1', 'PR1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('not found');
          done();
        },
      });
    });
  });

  // -- update ----------------------------------------------------------------

  describe('update', () => {
    it('should put data and return response', (done: DoneFn) => {
      const mockResponse = { success: true, data: {} };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('U1', '2024-01-01', 'PC1', 'CP1', 'PR1', {} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('update failed')));

      service.update('U1', '2024-01-01', 'PC1', 'CP1', 'PR1', {} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('update failed');
          done();
        },
      });
    });
  });

  // -- getProcessCodes -------------------------------------------------------

  describe('getProcessCodes', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'PC' }] }));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([{ code: 'PC' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is absent', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getSpikingTypes -------------------------------------------------------

  describe('getSpikingTypes', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ type: 'S' }] }));

      service.getSpikingTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([{ type: 'S' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getSpikingTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getBagLotNumbers ------------------------------------------------------

  describe('getBagLotNumbers', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ lotNumber: 'L1' }] }));

      service.getBagLotNumbers().subscribe({
        next: (result) => {
          expect(result).toEqual([{ lotNumber: 'L1' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getBagLotNumbers().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getFilterLotNumbers ---------------------------------------------------

  describe('getFilterLotNumbers', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ lotNumber: 'F1' }] }));

      service.getFilterLotNumbers().subscribe({
        next: (result) => {
          expect(result).toEqual([{ lotNumber: 'F1' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getFilterLotNumbers().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getProductCodes -------------------------------------------------------

  describe('getProductCodes', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ productCode: 'P1' }] }));

      service.getProductCodes('U1', '2024-01-01', 'PR1', 'CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([{ productCode: 'P1' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getProductCodes('U1', '2024-01-01', 'PR1', 'CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getComponentPrefixes --------------------------------------------------

  describe('getComponentPrefixes', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ prefix: 'CP' }] }));

      service.getComponentPrefixes('U1', '2024-01-01', 'PC1', 'PR1').subscribe({
        next: (result) => {
          expect(result).toEqual([{ prefix: 'CP' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getComponentPrefixes('U1', '2024-01-01', 'PC1', 'PR1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getUnitCollectionDates ------------------------------------------------

  describe('getUnitCollectionDates', () => {
    it('should return data array on success', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ collDate: '2024-01-01' }] }));

      service.getUnitCollectionDates('U1', 'PR1', 'CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([{ collDate: '2024-01-01' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should return empty array on error', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getUnitCollectionDates('U1', 'PR1', 'CH1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });
});
