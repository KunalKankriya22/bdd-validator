import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DonorsByEventsQueryService } from './donors-by-events-query.service';
import { ApiService } from '@shared/services/api.service';

describe('DonorsByEventsQueryService', () => {
  let service: DonorsByEventsQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        DonorsByEventsQueryService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DonorsByEventsQueryService);
  });

  it('should getSearchTypes and map data', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ code: 'S1' }] }));

    service.getSearchTypes().subscribe(result => {
      expect(result.length).toBe(1);
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should searchDonors via POST', (done) => {
    mockApiService.post.and.returnValue(of({ data: [{ donorId: 'D1' }], total: 1 }));

    service.searchDonors({ searchType: 'S1', take: 10, skip: 0 } as any).subscribe(result => {
      expect(result.data.length).toBe(1);
      expect(mockApiService.post).toHaveBeenCalled();
      done();
    });
  });

  it('should getValueCodes with searchType', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ code: 'V1' }] }));

    service.getValueCodes('S1').subscribe(result => {
      expect(result.length).toBe(1);
      done();
    });
  });

  it('should getDrivesLov and map with description', (done) => {
    mockApiService.get.and.returnValue(of({
      data: [{ driveId: 'DR1', description: null, driveDate: '2024-01-01', sponsorName: 'Sponsor' }]
    }));

    service.getDrivesLov('CH1').subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].driveId).toBe('DR1');
      done();
    });
  });
});
