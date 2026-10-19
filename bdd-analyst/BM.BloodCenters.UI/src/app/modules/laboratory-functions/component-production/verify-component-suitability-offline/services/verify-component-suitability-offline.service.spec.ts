import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VerifyComponentSuitabilityOfflineService } from './verify-component-suitability-offline.service';
import { ApiService } from '@shared/services/api.service';

describe('VerifyComponentSuitabilityOfflineService', () => {
  let service: VerifyComponentSuitabilityOfflineService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        VerifyComponentSuitabilityOfflineService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(VerifyComponentSuitabilityOfflineService);
  });

  it('should getProcessCodes and map data', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ code: 'PC1' }] }));

    service.getProcessCodes().subscribe(result => {
      expect(result.length).toBe(1);
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should getUnitDetails and map data', (done) => {
    mockApiService.get.and.returnValue(of({ data: { unitId: 'U1' } }));

    service.getUnitDetails('U1').subscribe(result => {
      expect(result.unitId).toBe('U1');
      done();
    });
  });

  it('should getEligibleComponents and map data', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ componentId: 'C1' }] }));

    service.getEligibleComponents('U1', 'PC1').subscribe(result => {
      expect(result.length).toBe(1);
      done();
    });
  });

  it('should verify and map response data', (done) => {
    mockApiService.post.and.returnValue(of({ data: { eligible: true } }));

    service.verify({} as any).subscribe(result => {
      expect(result.eligible).toBe(true);
      expect(mockApiService.post).toHaveBeenCalled();
      done();
    });
  });
});
