import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SearchForDonorService } from './search-for-donor.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('SearchForDonorService', () => {
  let service: SearchForDonorService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        SearchForDonorService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(SearchForDonorService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDonors', () => {
    it('should map response to data and total with null-safe defaults', (done) => {
      const criteria = { lastName: 'Smith' } as any;
      const mockResponse = { data: null, total: null };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(criteria).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.SEARCH_FOR_DONOR.SEARCH,
          criteria,
          jasmine.objectContaining({ context: jasmine.anything() })
        );
        done();
      });
    });
  });

  describe('validateDeferralId', () => {
    it('should POST deferral id wrapped in an object for validation', (done) => {
      const mockResponse = { valid: true };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateDeferralId('DEF-001').subscribe(result => {
        expect(result).toEqual({ valid: true });
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.SEARCH_FOR_DONOR.VALIDATE_DEFERRAL_ID,
          { deferralId: 'DEF-001' },
          jasmine.objectContaining({ context: jasmine.anything() })
        );
        done();
      });
    });
  });
});
