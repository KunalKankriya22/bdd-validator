import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VoidTestBatchApiService } from './void-test-batch-api.service';
import { ApiService } from '@shared/services/api.service';

describe('VoidTestBatchApiService', () => {
  let service: VoidTestBatchApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        VoidTestBatchApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(VoidTestBatchApiService);
  });

  describe('GET methods mapping response.data', () => {
    const cases: { method: keyof VoidTestBatchApiService; args: any[]; mockData: any }[] = [
      { method: 'getTestBatches', args: ['LAB1'], mockData: [{ tbId: '1' }] },
      { method: 'getTestsInBatch', args: ['TB1'], mockData: [{ testId: 'T1' }] },
      { method: 'getUnitsInBatch', args: ['TB1', 'T1'], mockData: [{ unitId: 'U1' }] },
      { method: 'getTechMode', args: [], mockData: { mode: 'TECH' } },
      { method: 'getVoidReasonCodes', args: [], mockData: [{ code: 'V1' }] },
      { method: 'checkQcUnits', args: ['TB1'], mockData: true },
    ];

    cases.forEach(({ method, args, mockData }) => {
      it(`${method} should return response.data`, (done) => {
        apiSpy.get.and.returnValue(of({ data: mockData }));

        (service[method] as Function)(...args).subscribe((result: any) => {
          expect(result).toEqual(mockData);
          done();
        });
      });
    });
  });

  it('voidTestBatch should POST and return response.data', (done) => {
    const mockResponse = { success: true };
    apiSpy.post.and.returnValue(of({ data: mockResponse }));

    service.voidTestBatch({ tbId: '1' } as any).subscribe((result) => {
      expect(result).toEqual(mockResponse as any);
      done();
    });
  });

  describe('Error Handling', () => {
    it('getTestBatches should propagate error on failure', (done) => {
      apiSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getTestBatches().subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
    });

    it('voidTestBatch should propagate error on failure', (done) => {
      apiSpy.post.and.returnValue(throwError(() => ({ error: { errorCode: '1204' } })));

      service.voidTestBatch({ tbId: '1' } as any).subscribe({
        error: (err) => {
          expect(err.error.errorCode).toBe('1204');
          done();
        },
      });
    });
  });

  describe('Query Parameters', () => {
    it('getTestBatches should include testingLabCode query param', (done) => {
      apiSpy.get.and.returnValue(of({ data: [] }));

      service.getTestBatches('LAB1').subscribe(() => {
        const url = apiSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('testingLabCode=LAB1');
        done();
      });
    });

    it('getTestBatches should include techMode query param', (done) => {
      apiSpy.get.and.returnValue(of({ data: [] }));

      service.getTestBatches(undefined, '2').subscribe(() => {
        const url = apiSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('techMode=2');
        done();
      });
    });

    it('getTestsInBatch should include techMode query param', (done) => {
      apiSpy.get.and.returnValue(of({ data: [] }));

      service.getTestsInBatch('TB001', '1').subscribe(() => {
        const url = apiSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('techMode=1');
        done();
      });
    });
  });
});
