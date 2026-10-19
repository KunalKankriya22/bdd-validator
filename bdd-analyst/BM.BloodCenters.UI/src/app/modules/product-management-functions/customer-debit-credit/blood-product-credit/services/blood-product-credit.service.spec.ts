import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BloodProductCreditService } from './blood-product-credit.service';
import { ApiService } from '@shared/services/api.service';

describe('BloodProductCreditService', () => {
  let service: BloodProductCreditService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        BloodProductCreditService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(BloodProductCreditService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // -- getCustomers ----------------------------------------------------------

  describe('getCustomers', () => {
    it('should return data array on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ id: 'C1' }] }));

      service.getCustomers().subscribe({
        next: (result) => {
          expect(result).toEqual([{ id: 'C1' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getCustomers().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- getReasonCodes --------------------------------------------------------

  describe('getReasonCodes', () => {
    it('should return data array on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'R1' }] }));

      service.getReasonCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([{ code: 'R1' }] as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getReasonCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });
  });

  // -- validateUnit ----------------------------------------------------------

  describe('validateUnit', () => {
    it('should return data when response is successful', (done) => {
      const mockData = { unitId: 'U1', eligible: true };
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockData }));

      service.validateUnit('U1', 'C1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw when success is false', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, error: 'not eligible' }));

      service.validateUnit('U1', 'C1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('not eligible');
          done();
        },
      });
    });

    it('should throw with fallback when success is false and error is absent', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false }));

      service.validateUnit('U1', 'C1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Unit not found or not eligible');
          done();
        },
      });
    });

    it('should throw when success is true but data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.validateUnit('U1', 'C1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Unit not found or not eligible');
          done();
        },
      });
    });

    it('should extract message from nested error object via apiError', (done) => {
      const httpError = { error: { message: 'server says no' } };
      apiServiceSpy.get.and.returnValue(throwError(() => httpError));

      service.validateUnit('U1', 'C1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('server says no');
          done();
        },
      });
    });
  });

  // -- getAll ----------------------------------------------------------------

  describe('getAll', () => {
    it('should return data and totalCount on success', (done) => {
      const mockItems = [{ unitId: 'U1' }];
      apiServiceSpy.get.and.returnValue(of({ data: mockItems, totalCount: 25 }));

      service.getAll('C1', 'CREDIT', 0, 10).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockItems as any);
          expect(result.totalCount).toBe(25);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty data and zero totalCount', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, totalCount: null }));

      service.getAll('C1', 'CREDIT').subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalCount).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should include optional sort params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [], totalCount: 0 }));

      service.getAll('C1', 'CREDIT', 0, 10, 'unitId', 'asc').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params;
          expect(params.get('sortColumn')).toBe('unitId');
          expect(params.get('sortOrder')).toBe('asc');
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through apiError', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ error: { message: 'load failed' } })));

      service.getAll('C1', 'CREDIT').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('load failed');
          done();
        },
      });
    });
  });

  // -- create ----------------------------------------------------------------

  describe('create', () => {
    it('should return first item from data array on success', (done) => {
      const mockItem = { unitId: 'U1' };
      apiServiceSpy.post.and.returnValue(of({ data: [mockItem] }));

      service.create({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockItem as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw when data array is empty', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [] }));

      service.create({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to create record');
          done();
        },
      });
    });

    it('should throw with response error when data is empty and error is present', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [], error: 'duplicate' }));

      service.create({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('duplicate');
          done();
        },
      });
    });

    it('should propagate transport error through apiError', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ message: 'network error' })));

      service.create({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('network error');
          done();
        },
      });
    });
  });

  // -- update ----------------------------------------------------------------

  describe('update', () => {
    it('should return undefined on success', (done) => {
      apiServiceSpy.put.and.returnValue(of({}));

      service.update('U1', {} as any).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through apiError', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => ({ error: { error: 'update err' } })));

      service.update('U1', {} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('update err');
          done();
        },
      });
    });
  });

  // -- delete ----------------------------------------------------------------

  describe('delete', () => {
    it('should return undefined on success', (done) => {
      apiServiceSpy.delete.and.returnValue(of({}));

      service.delete('U1').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through apiError', (done) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => ({ message: 'delete err' })));

      service.delete('U1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('delete err');
          done();
        },
      });
    });
  });

  // -- getNote ---------------------------------------------------------------

  describe('getNote', () => {
    it('should return noteText on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: { noteText: 'hello' } }));

      service.getNote('U1').subscribe({
        next: (result) => {
          expect(result).toBe('hello');
          done();
        },
        error: done.fail,
      });
    });

    it('should return null when data is absent', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getNote('U1').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should throw fixed message on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('any')));

      service.getNote('U1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to load note');
          done();
        },
      });
    });
  });

  // -- addNote ---------------------------------------------------------------

  describe('addNote', () => {
    it('should post noteText and return undefined on success', (done) => {
      apiServiceSpy.post.and.returnValue(of({}));

      service.addNote('U1', 'my note').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          const body = apiServiceSpy.post.calls.mostRecent().args[1];
          expect(body).toEqual({ noteText: 'my note' });
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through apiError', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { message: 'note fail' } })));

      service.addNote('U1', 'my note').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('note fail');
          done();
        },
      });
    });
  });

  // -- getProductHistory -----------------------------------------------------

  describe('getProductHistory', () => {
    it('should return data array on success', (done) => {
      const mockData = [{ unitId: 'U1' }];
      apiServiceSpy.get.and.returnValue(of({ data: mockData }));

      service.getProductHistory('U1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getProductHistory('U1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate error through apiError', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ message: 'history fail' })));

      service.getProductHistory('U1').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('history fail');
          done();
        },
      });
    });
  });
});
