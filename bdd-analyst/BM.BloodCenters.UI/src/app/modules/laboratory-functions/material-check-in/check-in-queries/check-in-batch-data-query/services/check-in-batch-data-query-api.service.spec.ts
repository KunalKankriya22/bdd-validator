import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckInBatchDataQueryApiService } from './check-in-batch-data-query-api.service';
import { ApiService } from '@shared/services/api.service';

describe('CheckInBatchDataQueryApiService', () => {
  let service: CheckInBatchDataQueryApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        CheckInBatchDataQueryApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(CheckInBatchDataQueryApiService);
  });

  it('should getCheckInBatchData and map response', (done) => {
    mockApiService.post.and.returnValue(of({ data: [{ id: 1 }], total: 1 }));

    service.getCheckInBatchData(10, 0).subscribe(result => {
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(mockApiService.post).toHaveBeenCalled();
      done();
    });
  });

  ['getProductTypes', 'getCheckinUsers'].forEach(method => {
    it(`should call ${method} and return mapped array`, (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ id: '1' }] }));

      (service as any)[method]().subscribe((result: any[]) => {
        expect(result.length).toBe(1);
        expect(mockApiService.get).toHaveBeenCalled();
        done();
      });
    });
  });
});
