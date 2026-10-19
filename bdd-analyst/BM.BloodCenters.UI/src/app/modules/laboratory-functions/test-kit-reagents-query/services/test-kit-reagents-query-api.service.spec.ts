import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TestKitReagentsQueryApiService } from './test-kit-reagents-query-api.service';
import { ApiService } from '../../../../shared/services/api.service';

describe('TestKitReagentsQueryApiService', () => {
  let service: TestKitReagentsQueryApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        TestKitReagentsQueryApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(TestKitReagentsQueryApiService);
  });

  // -----------------------------------------------------------------------
  // getTestKits
  // -----------------------------------------------------------------------
  describe('getTestKits', () => {
    it('returns data with all optional params', (done) => {
      const data = [{ testKitId: 'TK1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getTestKits({
        testId: 'T1',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        testKitId: 'TK1',
      }).subscribe(result => {
        expect(result).toEqual(data as any);
        const url: string = apiSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('testId=T1');
        expect(url).toContain('fromDate=2024-01-01');
        expect(url).toContain('toDate=2024-12-31');
        expect(url).toContain('testKitId=TK1');
        done();
      });
    });

    it('builds URL with only required testId', (done) => {
      apiSpy.get.and.returnValue(of({ data: [] }));

      service.getTestKits({ testId: 'T1' }).subscribe(result => {
        const url: string = apiSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('testId=T1');
        expect(url).not.toContain('fromDate');
        expect(url).not.toContain('toDate');
        expect(url).not.toContain('testKitId');
        done();
      });
    });

    it('returns empty array when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.getTestKits({ testId: 'T1' }).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('re-throws on error', (done) => {
      spyOn(console, 'error');
      const error = new Error('Network error');
      apiSpy.get.and.returnValue(throwError(() => error));

      service.getTestKits({ testId: 'T1' }).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // getReagentDetails
  // -----------------------------------------------------------------------
  describe('getReagentDetails', () => {
    it('returns reagent details', (done) => {
      const data = [{ reagentCode: 'R1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getReagentDetails('TK1', 'T1').subscribe(result => {
        expect(result).toEqual(data as any);
        const url: string = apiSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('testId=T1');
        done();
      });
    });

    it('re-throws on error', (done) => {
      spyOn(console, 'error');
      const error = new Error('fail');
      apiSpy.get.and.returnValue(throwError(() => error));

      service.getReagentDetails('TK1', 'T1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('returns empty array when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.getReagentDetails('TK1', 'T1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getBatchDetails
  // -----------------------------------------------------------------------
  describe('getBatchDetails', () => {
    it('returns batch details', (done) => {
      const data = [{ batchId: 'B1' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getBatchDetails('TK1').subscribe(result => {
        expect(result).toEqual(data as any);
        done();
      });
    });

    it('re-throws on error', (done) => {
      spyOn(console, 'error');
      const error = new Error('fail');
      apiSpy.get.and.returnValue(throwError(() => error));

      service.getBatchDetails('TK1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('returns empty array when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.getBatchDetails('TK1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getTestIdsLov
  // -----------------------------------------------------------------------
  describe('getTestIdsLov', () => {
    it('returns test ID list', (done) => {
      const data = [{ testId: 'T1', testDescription: 'Test One' }];
      apiSpy.get.and.returnValue(of({ data }));

      service.getTestIdsLov().subscribe(result => {
        expect(result).toEqual(data);
        done();
      });
    });

    it('re-throws on error', (done) => {
      spyOn(console, 'error');
      const error = new Error('fail');
      apiSpy.get.and.returnValue(throwError(() => error));

      service.getTestIdsLov().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });

    it('returns empty array when data is null', (done) => {
      apiSpy.get.and.returnValue(of({ data: null }));

      service.getTestIdsLov().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
