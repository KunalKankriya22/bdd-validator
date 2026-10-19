import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LinkTestResultsApiService } from './link-test-results-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('LinkTestResultsApiService', () => {
  let service: LinkTestResultsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        LinkTestResultsApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(LinkTestResultsApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  ['validate', 'transfer'].forEach(method => {
    const apiKey = method.toUpperCase() as 'VALIDATE' | 'TRANSFER';

    describe(method, () => {
      it(`should POST request to LINK_TEST_RESULTS.${apiKey} endpoint`, (done) => {
        const request = { unitId: 'U001' } as any;
        const mockResponse = { success: true };
        apiServiceSpy.post.and.returnValue(of(mockResponse));

        (service as any)[method](request).subscribe((result: any) => {
          expect(result).toEqual({ success: true });
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.LINK_TEST_RESULTS[apiKey],
            request
          );
          done();
        });
      });

      it(`should propagate errors from ${method} call`, (done) => {
        const request = { unitId: 'U001' } as any;
        const mockError = new Error('Server error');
        apiServiceSpy.post.and.returnValue(throwError(() => mockError));

        (service as any)[method](request).subscribe({
          next: () => fail('should have errored'),
          error: (err: any) => {
            expect(err).toBe(mockError);
            done();
          }
        });
      });
    });
  });
});
