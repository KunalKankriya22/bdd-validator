import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CollectionStatisticsService } from './collection-statistics.service';
import { ApiService } from '@shared/services/api.service';

describe('CollectionStatisticsService', () => {
  let service: CollectionStatisticsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        CollectionStatisticsService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(CollectionStatisticsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // -- getReport -------------------------------------------------------------

  describe('getReport', () => {
    it('should return data when response is successful', (done: jest.DoneCallback) => {
      const mockData = { summary: [] };
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockData }));

      service.getReport({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw with response.message when success is false', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: false, message: 'bad request' }));

      service.getReport({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('bad request');
          done();
        },
      });
    });

    it('should throw with fallback message when success is false and message is absent', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: false }));

      service.getReport({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to retrieve collection statistics');
          done();
        },
      });
    });

    it('should propagate transport error', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('network')));

      service.getReport({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('network');
          done();
        },
      });
    });
  });

  // -- getDateDetail ---------------------------------------------------------

  describe('getDateDetail', () => {
    it('should return data when response is successful', (done: jest.DoneCallback) => {
      const mockData = { venipunctures: [] };
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockData }));

      service.getDateDetail({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw with fallback when success is false and message is absent', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: false }));

      service.getDateDetail({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to retrieve date detail');
          done();
        },
      });
    });

    it('should propagate transport error', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('network')));

      service.getDateDetail({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('network');
          done();
        },
      });
    });
  });

  // -- getUnits --------------------------------------------------------------

  describe('getUnits', () => {
    it('should return data array when response is successful', (done: jest.DoneCallback) => {
      const mockData = [{ unitId: 'U1' }];
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockData }));

      service.getUnits({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: null }));

      service.getUnits({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw when success is false', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: false }));

      service.getUnits({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to retrieve units');
          done();
        },
      });
    });
  });

  // -- getGoals --------------------------------------------------------------

  describe('getGoals', () => {
    it('should return data array when response is successful', (done: jest.DoneCallback) => {
      const mockData = [{ goalId: 'G1' }];
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockData }));

      service.getGoals({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockData as any);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: null }));

      service.getGoals({} as any).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw when success is false', (done: jest.DoneCallback) => {
      apiServiceSpy.post.and.returnValue(of({ success: false, message: 'no goals' }));

      service.getGoals({} as any).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('no goals');
          done();
        },
      });
    });
  });

  // -- getDonationTypes ------------------------------------------------------

  describe('getDonationTypes', () => {
    it('should map response data to DonationTypeLookup array', (done: jest.DoneCallback) => {
      const apiData = [{ code: 'WB', description: 'Whole Blood' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: apiData }));

      service.getDonationTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([{ code: 'WB', description: 'Whole Blood' }]);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getDonationTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw when success is false', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValue(of({ success: false }));

      service.getDonationTypes().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to load donation types');
          done();
        },
      });
    });

    it('should propagate transport error', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('network')));

      service.getDonationTypes().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('network');
          done();
        },
      });
    });
  });

  // -- getProcedureCodes -----------------------------------------------------

  describe('getProcedureCodes', () => {
    it('should map response data to ProcedureCodeLookup array', (done: jest.DoneCallback) => {
      const apiData = [{ code: 'PC1', description: 'Procedure 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: apiData }));

      service.getProcedureCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([{ code: 'PC1', description: 'Procedure 1' }]);
          done();
        },
        error: done.fail,
      });
    });

    it('should default to empty array when data is null', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getProcedureCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should throw when success is false', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValue(of({ success: false }));

      service.getProcedureCodes().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to load procedure codes');
          done();
        },
      });
    });
  });

  // -- loadLovs --------------------------------------------------------------

  describe('loadLovs', () => {
    it('should return forkJoin of donationTypes and procedureCodes', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValues(
        of({ success: true, data: [{ code: 'WB', description: 'Whole Blood' }] }),
        of({ success: true, data: [{ code: 'PC1', description: 'Proc 1' }] }),
      );

      service.loadLovs().subscribe({
        next: (result) => {
          expect(result.donationTypes.length).toBe(1);
          expect(result.procedureCodes.length).toBe(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should fail if either inner observable errors', (done: jest.DoneCallback) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('lov fail')));

      service.loadLovs().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('lov fail');
          done();
        },
      });
    });
  });
});
