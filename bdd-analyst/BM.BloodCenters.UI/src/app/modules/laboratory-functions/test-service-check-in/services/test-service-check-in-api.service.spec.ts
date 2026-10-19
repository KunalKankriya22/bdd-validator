import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TestServiceCheckInApiService } from './test-service-check-in-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('TestServiceCheckInApiService', () => {
  let service: TestServiceCheckInApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        TestServiceCheckInApiService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(TestServiceCheckInApiService);
  });

  describe('checkInBatch', () => {
    it('should POST batch check-in request', (done: DoneFn) => {
      const request = { batchId: 'NEW', units: [] } as any;
      const response = { batchId: 'B001', unitsProcessed: 1, testsScheduled: 2 };
      apiSpy.post.and.returnValue(of(response));

      service.checkInBatch(request).subscribe(result => {
        expect(result).toEqual(response);
        expect(apiSpy.post).toHaveBeenCalledWith(API.FIXED_PROFILE_TUBE_CHECKIN.CHECKIN, request);
        done();
      });
    });
  });

  describe('simple GET endpoints', () => {
    const cases = [
      { method: 'getContracts' as const, endpoint: API.FIXED_PROFILE_TUBE_CHECKIN.CONTRACTS, mock: [{ contractId: 'C1' }] },
      { method: 'getBatches' as const, endpoint: API.FIXED_PROFILE_TUBE_CHECKIN.BATCHES, mock: ['B1', 'B2'] }
    ];

    cases.forEach(({ method, endpoint, mock }) => {
      it(`${method} should GET from correct endpoint`, (done: DoneFn) => {
        apiSpy.get.and.returnValue(of(mock));

        service[method]().subscribe(result => {
          expect(result).toEqual(mock);
          expect(apiSpy.get).toHaveBeenCalledWith(endpoint);
          done();
        });
      });
    });
  });

  describe('getCheckedInUnits', () => {
    it('should POST with take/skip URL params', (done: DoneFn) => {
      const mock = { success: true, data: [], total: 0 };
      apiSpy.post.and.returnValue(of(mock));

      service.getCheckedInUnits(10, 5).subscribe(result => {
        expect(result).toEqual(mock as any);
        expect(apiSpy.post).toHaveBeenCalledWith(API.FIXED_PROFILE_TUBE_CHECKIN.LIST(10, 5), {});
        done();
      });
    });
  });

  describe('contract-by-id endpoints', () => {
    const cases = [
      { method: 'validateContract' as const, mock: { contractId: 'C1' } },
      { method: 'getContractTests' as const, mock: [{ testId: 'T1' }] }
    ];

    cases.forEach(({ method, mock }) => {
      it(`${method} should GET by contractId`, (done: DoneFn) => {
        apiSpy.get.and.returnValue(of(mock));

        service[method]('C1').subscribe(result => {
          expect(result).toEqual(mock as any);
          done();
        });
      });
    });
  });
});
