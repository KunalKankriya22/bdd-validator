import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TemporaryDriveQueryService } from './temporary-drive-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('TemporaryDriveQueryService', () => {
  let service: TemporaryDriveQueryService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }]
    });
    service = TestBed.inject(TemporaryDriveQueryService);
  });

  it('searchTemporaryDrives should POST params and map response', (done) => {
    const params = { fromDate: '2024-01-01' } as any;
    const apiResp = { data: [{ id: '1' }], total: 1, message: 'ok' };
    apiSpy.post.and.returnValue(of(apiResp));
    service.searchTemporaryDrives(params).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.totalRecords).toBe(1);
      expect(res.message).toBe('ok');
      expect(apiSpy.post).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY, params
      );
      done();
    });
  });

  it('getDetail should map item from response', (done) => {
    const apiResp = { item: { tempdrId: 'TD1', description: 'Test' } };
    apiSpy.get.and.returnValue(of(apiResp));
    service.getDetail('TD1').subscribe((res) => {
      expect(res.data.tempdrId).toBe('TD1');
      expect(apiSpy.get).toHaveBeenCalledWith(
        API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_DETAIL('TD1')
      );
      done();
    });
  });

  it('getSponsors should pass fromDate/toDate as HttpParams', (done) => {
    const apiResp = { data: [{ id: 'S1' }] };
    apiSpy.get.and.returnValue(of(apiResp));
    service.getSponsors('2024-01-01', '2024-12-31').subscribe((res) => {
      expect(res.data.length).toBe(1);
      const callArgs = apiSpy.get.calls.mostRecent().args;
      expect(callArgs[0]).toBe(API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_SPONSORS);
      expect(callArgs[1].params.get('fromDate')).toBe('2024-01-01');
      expect(callArgs[1].params.get('toDate')).toBe('2024-12-31');
      done();
    });
  });

  // Group simple GET-no-args lookups
  [
    { method: 'getRecruiters', endpoint: API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_RECRUITERS },
    { method: 'getFilterRecruiters', endpoint: API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_FILTER_RECRUITERS },
    { method: 'getFilterSponsors', endpoint: API.DONOR_FUNCTIONS.TEMPORARY_DRIVE_QUERY_FILTER_SPONSORS }
  ].forEach(({ method, endpoint }) => {
    it(`${method} should GET and map data array`, (done) => {
      const apiResp = { data: [{ name: 'Test' }] };
      apiSpy.get.and.returnValue(of(apiResp));
      (service as any)[method]().subscribe((res: any) => {
        expect(res.data.length).toBe(1);
        expect(apiSpy.get).toHaveBeenCalledWith(endpoint);
        done();
      });
    });
  });

  it('should propagate errors through catchError', (done) => {
    const err = new Error('fail');
    apiSpy.get.and.returnValue(throwError(() => err));
    service.getRecruiters().subscribe({
      error: (e) => {
        expect(e).toBe(err);
        done();
      }
    });
  });
});
