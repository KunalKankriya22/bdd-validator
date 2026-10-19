import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DetachDonorFromDeferralService } from './detach-donor-from-deferral.service';
import { ApiService } from '@shared/services/api.service';

describe('DetachDonorFromDeferralService', () => {
  let service: DetachDonorFromDeferralService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        DetachDonorFromDeferralService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(DetachDonorFromDeferralService);
  });

  it('should fetch deferral details and apply camelCase mapping', (done) => {
    // Arrange
    const mockResponse = {
      success: true,
      data: [{ DeferralId: 'D1', DonorId: 'DN1' }],
      item: { DeferralId: 'D1', DonorId: 'DN1' },
    };
    apiSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getDeferralDetails('D1').subscribe((result) => {
      // Assert
      expect(apiSpy.get).toHaveBeenCalled();
      expect((result.item as any).deferralId).toBe('D1');
      done();
    });
  });

  it('should delegate executeDeferralDetach to apiService.post', (done) => {
    // Arrange
    const mockResponse = { success: true, data: [], item: null };
    apiSpy.post.and.returnValue(of(mockResponse));

    // Act
    service.executeDeferralDetach({ deferralId: 'D1' } as any).subscribe((result) => {
      // Assert
      expect(result).toEqual(mockResponse as any);
      expect(apiSpy.post).toHaveBeenCalled();
      done();
    });
  });
});
