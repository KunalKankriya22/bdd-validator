import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { FinanceInterfaceDetailsApiService } from './finance-interface-details-api.service';
import { API } from '@core/constants/api.constants';

describe('FinanceInterfaceDetailsApiService', () => {
  let service: FinanceInterfaceDetailsApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        FinanceInterfaceDetailsApiService,
        { provide: HttpClient, useValue: spy }
      ]
    });

    service = TestBed.inject(FinanceInterfaceDetailsApiService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getOrders', () => {
    it('should GET orders from the finance interface endpoint', (done) => {
      const mockResult = { data: [{ orderNo: 'ORD-1' }] };
      httpSpy.get.and.returnValue(of(mockResult));

      service.getOrders().subscribe(result => {
        expect(result).toEqual(mockResult as any);
        expect(httpSpy.get).toHaveBeenCalledWith(API.FINANCE_INTERFACE_DETAILS.ORDERS);
        done();
      });
    });
  });

  describe('getInsertDates', () => {
    it('should GET insert dates passing orderNo to the URL builder', (done) => {
      const mockResult = { data: [{ insertDate: '2024-01-01' }] };
      httpSpy.get.and.returnValue(of(mockResult));

      service.getInsertDates('ORD-1').subscribe(result => {
        expect(result).toEqual(mockResult as any);
        expect(httpSpy.get).toHaveBeenCalledWith(
          API.FINANCE_INTERFACE_DETAILS.INSERT_DATES('ORD-1')
        );
        done();
      });
    });
  });

  describe('search', () => {
    it('should POST search request and return finance interface results', (done) => {
      const request = { orderNo: 'ORD-1' } as any;
      const mockResult = { data: [{ amount: 100 }] };
      httpSpy.post.and.returnValue(of(mockResult));

      service.search(request).subscribe(result => {
        expect(result).toEqual(mockResult as any);
        expect(httpSpy.post).toHaveBeenCalledWith(
          API.FINANCE_INTERFACE_DETAILS.SEARCH,
          request
        );
        done();
      });
    });
  });
});
