import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ViewResponsesService } from './view-responses.service';
import { ApiService } from '@shared/services/api.service';

describe('ViewResponsesService', () => {
  let service: ViewResponsesService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ViewResponsesService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ViewResponsesService);
  });

  it('should getResponseSummary and map data', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ questionCode: 'Q1' }] }));

    service.getResponseSummary('CH1', 'T1').subscribe(result => {
      expect(result.data.length).toBe(1);
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should getResponseDonors with query params', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ donorId: 'D1' }] }));

    service.getResponseDonors('CH1', 'T1', 'Q1', 'A1').subscribe(result => {
      expect(result.data.length).toBe(1);
      done();
    });
  });

  it('should getResponseComments with questionCode param', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ comment: 'text' }] }));

    service.getResponseComments('CH1', 'T1', 'Q1').subscribe(result => {
      expect(result.data.length).toBe(1);
      done();
    });
  });
});
