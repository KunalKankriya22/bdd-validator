import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DonorInterdictionsApiService } from './donor-interdictions-api.service';
import { ApiService } from '@shared/services/api.service';

describe('DonorInterdictionsApiService', () => {
  let service: DonorInterdictionsApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        DonorInterdictionsApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(DonorInterdictionsApiService);
  });

  it('getDonorDetails calls GET with donor-specific endpoint', (done) => {
    const details = { donorId: 'D1', name: 'Jane' };
    apiSpy.get.and.returnValue(of(details));

    service.getDonorDetails('D1').subscribe((result) => {
      expect(result).toEqual(details as any);
      expect(apiSpy.get).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('getDonorInterdictions passes showTerminated=false by default via HttpParams', (done) => {
    apiSpy.get.and.returnValue(of({ interdictions: [] }));

    service.getDonorInterdictions('D1').subscribe(() => {
      const opts = apiSpy.get.calls.mostRecent().args[1] as any;
      expect(opts.params.get('showTerminated')).toBe('false');
      done();
    });
  });

  it('getDonorInterdictions passes showTerminated=true when requested', (done) => {
    apiSpy.get.and.returnValue(of({ interdictions: [{ id: '1' }] }));

    service.getDonorInterdictions('D1', true).subscribe(() => {
      const opts = apiSpy.get.calls.mostRecent().args[1] as any;
      expect(opts.params.get('showTerminated')).toBe('true');
      done();
    });
  });
});
