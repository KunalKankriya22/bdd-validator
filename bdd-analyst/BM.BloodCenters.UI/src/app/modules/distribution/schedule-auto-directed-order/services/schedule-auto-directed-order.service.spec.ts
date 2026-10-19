import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ScheduleAutoDirectedOrderService } from './schedule-auto-directed-order.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

describe('ScheduleAutoDirectedOrderService', () => {
  let service: ScheduleAutoDirectedOrderService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ScheduleAutoDirectedOrderService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ScheduleAutoDirectedOrderService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getCustomerInfo', () => {
    it('should get customer info by id', (done) => {
      const mockResponse = { success: true, item: { customerId: 'C001', name: 'Hospital A' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCustomerInfo('C001').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.SCHEDULE_AUTO_DIRECTED_ORDER.CUSTOMER('C001')
        );
        done();
      });
    });
  });

  describe('getConsigneeInfo', () => {
    it('should get consignee info by id', (done) => {
      const mockResponse = { success: true, item: { consigneeId: 'CON01', name: 'Site A' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getConsigneeInfo('CON01').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.SCHEDULE_AUTO_DIRECTED_ORDER.CONSIGNEE('CON01')
        );
        done();
      });
    });
  });

  describe('getAvailableUnits', () => {
    it('should post query and return available units', (done) => {
      const query = { productType: 'RBC' } as any;
      const mockResponse = { success: true, data: [{ unitId: 'U001' }] };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAvailableUnits(query).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.SCHEDULE_AUTO_DIRECTED_ORDER.AVAILABLE_UNITS,
          query
        );
        done();
      });
    });
  });

  describe('createOrder', () => {
    it('should post create order request', (done) => {
      const request = { customerId: 'C001', items: [] } as any;
      const mockResponse = { success: true, item: { orderNo: 'ORD-001' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createOrder(request).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.SCHEDULE_AUTO_DIRECTED_ORDER.CREATE,
          request
        );
        done();
      });
    });
  });

  describe('getCustomersLookup', () => {
    it('should get customers lookup list', (done) => {
      const mockResponse = { success: true, data: [{ customerId: 'C001' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCustomersLookup().subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.SCHEDULE_AUTO_DIRECTED_ORDER.CUSTOMERS_LOOKUP
        );
        done();
      });
    });
  });

  describe('getConsigneesLookup', () => {
    it('should get consignees lookup for a customer', (done) => {
      const mockResponse = { success: true, data: [{ consigneeId: 'CON01' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getConsigneesLookup('C001').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.SCHEDULE_AUTO_DIRECTED_ORDER.CONSIGNEES_LOOKUP('C001')
        );
        done();
      });
    });
  });
});
