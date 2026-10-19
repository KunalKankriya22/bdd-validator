import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';

import { StandingOrdersQueryApiService } from './standing-orders-query-api.service';

describe('StandingOrdersQueryApiService', () => {
  let service: StandingOrdersQueryApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        StandingOrdersQueryApiService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(StandingOrdersQueryApiService);
  });

  [
    { name: 'searchOrders', verb: 'post', args: [{}] },
    { name: 'getOrderItems', verb: 'get', args: ['C1', 'CS1', 'Mon'] },
    { name: 'getWeekDays', verb: 'get', args: [] },
    { name: 'getCustomerTypes', verb: 'get', args: [] },
    { name: 'getCustomers', verb: 'get', args: [] },
  ].forEach(({ name, verb, args }) => {
    it(`${name} should delegate to http.${verb}`, (done) => {
      (httpSpy as any)[verb].and.returnValue(of({ success: true, data: [] }));

      (service as any)[name](...args).subscribe(() => {
        expect((httpSpy as any)[verb]).toHaveBeenCalled();
        done();
      });
    });
  });

  it('getCustomers with customerType should include customerType in HttpParams', (done) => {
    httpSpy.get.and.returnValue(of({ success: true, data: [] }));
    service.getCustomers('RG').subscribe(() => {
      const callArgs = httpSpy.get.calls.mostRecent().args;
      const params: HttpParams = callArgs[1]?.params;
      expect(params instanceof HttpParams).toBeTrue();
      expect(params.get('customerType')).toBe('RG');
      done();
    });
  });

  it('getCustomers without customerType should not set params', (done) => {
    httpSpy.get.and.returnValue(of({ success: true, data: [] }));
    service.getCustomers().subscribe(() => {
      const callArgs = httpSpy.get.calls.mostRecent().args;
      const params: HttpParams = callArgs[1]?.params;
      expect(params instanceof HttpParams).toBeTrue();
      expect(params.get('customerType')).toBeNull();
      done();
    });
  });
});
