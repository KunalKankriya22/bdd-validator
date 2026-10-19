import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ApiService,
        { provide: HttpClient, useValue: spy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('normalizeEndpoint via HTTP methods', () => {
    it('should strip leading and trailing slashes from endpoint', (done) => {
      httpSpy.get.and.returnValue(of({ data: 'test' }));

      service.get('/api/v1/items/').subscribe(() => {
        expect(httpSpy.get).toHaveBeenCalledWith(
          `${environment.apiUrl}/api/v1/items`,
          undefined
        );
        done();
      });
    });
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
    describe(method, () => {
      it(`should delegate ${method.toUpperCase()} to HttpClient with baseUrl prepended`, (done) => {
        const mockResponse = { success: true };
        (httpSpy as any)[method].and.returnValue(of(mockResponse));

        const endpoint = 'api/v1/test';
        const body = { key: 'value' };
        const expectedUrl = `${environment.apiUrl}/${endpoint}`;

        const call$ = ['get', 'delete'].includes(method)
          ? (service as any)[method](endpoint)
          : (service as any)[method](endpoint, body);

        call$.subscribe((result: any) => {
          expect(result).toEqual({ success: true });

          if (['get', 'delete'].includes(method)) {
            expect((httpSpy as any)[method]).toHaveBeenCalledWith(expectedUrl, undefined);
          } else {
            expect((httpSpy as any)[method]).toHaveBeenCalledWith(expectedUrl, body, undefined);
          }
          done();
        });
      });
    });
  });
});
