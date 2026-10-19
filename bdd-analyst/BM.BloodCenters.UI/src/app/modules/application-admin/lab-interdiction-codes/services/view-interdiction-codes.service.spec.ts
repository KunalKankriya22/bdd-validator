import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ViewInterdictionCodeService } from './view-interdiction-codes.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('ViewInterdictionCodeService', () => {
  let service: ViewInterdictionCodeService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        ViewInterdictionCodeService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ViewInterdictionCodeService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getInterdictionCodes', () => {
    it('should POST payload and return data with totalCount', (done) => {
      const payload = { page: 1, pageSize: 10 } as any;
      const mockResponse = {
        data: [{ code: 'IC01', description: 'Hold' }],
        totalCount: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getInterdictionCodes(payload).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.LAB_INTERDICTION_CODES.GET,
          payload
        );
        done();
      });
    });
  });
});
