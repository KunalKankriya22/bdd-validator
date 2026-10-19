import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DefineDurationBetweenProceduresService } from './define-duration-between-procedures.service';
import { ApiService } from '@shared/services/api.service';

describe('DefineDurationBetweenProceduresService', () => {
  let service: DefineDurationBetweenProceduresService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DefineDurationBetweenProceduresService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(DefineDurationBetweenProceduresService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // -- getDefineDurationBetweenProcedures ------------------------------------

  describe('getDefineDurationBetweenProcedures', () => {
    it('should map response to data and totalRecords', (done: DoneFn) => {
      const mockResponse = { data: [{ id: 1 }], total: 42 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getDefineDurationBetweenProcedures(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([{ id: 1 }] as any);
          expect(result.totalRecords).toBe(42);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array and zero when data/total are absent', (done: DoneFn) => {
      apiServiceSpy.post.and.returnValue(of({}));

      service.getDefineDurationBetweenProcedures(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('server error')));

      service.getDefineDurationBetweenProcedures(10, 0, {} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('server error');
          done();
        },
      });
    });
  });

  // -- getDefineDurationFilters ----------------------------------------------

  describe('getDefineDurationFilters', () => {
    it('should return filter data on success', (done: DoneFn) => {
      const mockResponse = { data: [{ key: 'val' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDefineDurationFilters().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getDefineDurationFilters().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });

  // -- getDonationTypes ------------------------------------------------------

  describe('getDonationTypes', () => {
    it('should return donation types on success', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'WB' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getDonationTypes().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });

  // -- getProcedureCodes -----------------------------------------------------

  describe('getProcedureCodes', () => {
    it('should return procedure codes on success', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'P1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcedureCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getProcedureCodes().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });

  // -- addDefineDuration -----------------------------------------------------

  describe('addDefineDuration', () => {
    it('should post data and return result', (done: DoneFn) => {
      const mockResponse = { success: true, item: { id: 1 } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.addDefineDuration({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.addDefineDuration({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });

  // -- updateDefineDuration --------------------------------------------------

  describe('updateDefineDuration', () => {
    it('should put data and return result', (done: DoneFn) => {
      const mockResponse = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateDefineDuration({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('fail')));

      service.updateDefineDuration({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });

  // -- deleteDefineDuration --------------------------------------------------

  describe('deleteDefineDuration', () => {
    it('should build query string and return result on success', (done: DoneFn) => {
      const mockResponse = { success: true };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteDefineDuration('WB', 'P1', 'P2', '2024-01-01').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          const endpoint: string = apiServiceSpy.delete.calls.mostRecent().args[0];
          expect(endpoint).toContain('currDonationType=WB');
          expect(endpoint).toContain('procedureCode=P1');
          expect(endpoint).toContain('prevProcedureCode=P2');
          expect(endpoint).toContain('effectiveDate=2024-01-01');
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => new Error('fail')));

      service.deleteDefineDuration('WB', 'P1', 'P2', '2024-01-01').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('fail');
          done();
        },
      });
    });
  });
});
