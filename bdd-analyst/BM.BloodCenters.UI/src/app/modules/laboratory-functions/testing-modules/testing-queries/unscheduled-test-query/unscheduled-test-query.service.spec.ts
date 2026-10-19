import { TestBed } from '@angular/core/testing';
import { UnscheduledTestQueryService } from './unscheduled-test-query.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnscheduledTestQueryService,
  UnscheduledTestQueryPayload,
} from './unscheduled-test-query.service';

describe('UnscheduledTestQueryService', () => {
  let service: UnscheduledTestQueryService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UnscheduledTestQueryService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(UnscheduledTestQueryService);
  });

  describe('getTestIds()', () => {
    it('should call GET with the test-ids endpoint', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        data: [
          { testId: 'HIV', testDescription: 'HIV 1/2 Plus O' },
          { testId: 'HCV', testDescription: 'Hepatitis C' },
        ],
      };
      apiSpy.get.and.returnValue(of(mockResponse));

      service.getTestIds().subscribe((res) => {
        expect(res.success).toBeTrue();
        expect(res.data.length).toBe(2);
        expect(res.data[0].testId).toBe('HIV');
        expect(apiSpy.get).toHaveBeenCalledWith(API.UNSCHEDULED_TEST_QUERY.TEST_IDS);
        done();
      });
    });

    it('should return empty data when no test IDs', (done) => {
      apiSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));

      service.getTestIds().subscribe((res) => {
        expect(res.data.length).toBe(0);
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      apiSpy.get.and.returnValue(throwError(() => ({ status: 500, error: 'Server error' })));

      service.getTestIds().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('search()', () => {
    const payload: UnscheduledTestQueryPayload = {
      testId: 'HIV',
      unitId: null,
      fromCollDate: '2025-01-01',
      toCollDate: '2025-01-31',
      ntsFlag: null,
      showCancel: null,
      reactive: null,
      take: 25,
      skip: 0,
    };

    it('should call POST with the search endpoint and payload', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        data: [{ unitId: 'U001', chkDigit: '1', testId: 'HIV', testSeqNo: 1, collDateExists: true }],
        total: 1,
      };
      apiSpy.post.and.returnValue(of(mockResponse));

      service.search(payload).subscribe((res) => {
        expect(res.success).toBeTrue();
        expect(res.data.length).toBe(1);
        expect(res.total).toBe(1);
        expect(apiSpy.post).toHaveBeenCalledWith(API.UNSCHEDULED_TEST_QUERY.SEARCH, payload);
        done();
      });
    });

    it('should return empty data for no results', (done) => {
      apiSpy.post.and.returnValue(of({ success: true, message: 'No records found', data: [], total: 0 }));

      service.search(payload).subscribe((res) => {
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(0);
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      apiSpy.post.and.returnValue(throwError(() => ({ status: 500, error: 'Server error' })));

      service.search(payload).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });

    it('should pass all filter fields in payload', (done) => {
      const fullPayload: UnscheduledTestQueryPayload = {
        testId: 'ALL',
        unitId: 'UNIT001',
        fromCollDate: '2025-01-01',
        toCollDate: '2025-06-30',
        ntsFlag: 'Y',
        showCancel: 'Y',
        reactive: 'Y',
        take: 50,
        skip: 100,
      };
      apiSpy.post.and.returnValue(of({ success: true, message: '', data: [], total: 0 }));

      service.search(fullPayload).subscribe(() => {
        const args = apiSpy.post.calls.mostRecent().args;
        expect(args[0]).toBe(API.UNSCHEDULED_TEST_QUERY.SEARCH);
        const sent = args[1] as UnscheduledTestQueryPayload;
        expect(sent.testId).toBe('ALL');
        expect(sent.unitId).toBe('UNIT001');
        expect(sent.ntsFlag).toBe('Y');
        expect(sent.showCancel).toBe('Y');
        expect(sent.reactive).toBe('Y');
        expect(sent.take).toBe(50);
        expect(sent.skip).toBe(100);
      done();
    });
  });

    it('should handle payload with null optional fields', (done) => {
      const minimalPayload: UnscheduledTestQueryPayload = {
        testId: null,
        unitId: null,
        fromCollDate: null,
        toCollDate: null,
        ntsFlag: null,
        showCancel: null,
        reactive: null,
        take: 25,
        skip: 0,
      };
      apiSpy.post.and.returnValue(of({ success: true, message: '', data: [], total: 0 }));

      service.search(minimalPayload).subscribe(() => {
        const sent = apiSpy.post.calls.mostRecent().args[1] as UnscheduledTestQueryPayload;
        expect(sent.testId).toBeNull();
        expect(sent.unitId).toBeNull();
        expect(sent.fromCollDate).toBeNull();
        expect(sent.toCollDate).toBeNull();
      done();
    });
  });
});
});
