import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReInterfaceDonorToLabApiService } from './re-interface-donor-to-lab-api.service';
import { ApiService } from '@shared/services/api.service';

describe('ReInterfaceDonorToLabApiService', () => {
  let service: ReInterfaceDonorToLabApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ReInterfaceDonorToLabApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(ReInterfaceDonorToLabApiService);
  });

  it('should get unit data and return item on success', (done) => {
    // Arrange
    const mockItem = { unitId: 'U1', donorId: 'D1' };
    apiSpy.get.and.returnValue(of({ success: true, item: mockItem }));

    // Act
    service.getUnitData('U1').subscribe((result) => {
      // Assert
      expect(result).toBe(mockItem as any);
      expect(apiSpy.get).toHaveBeenCalled();
      done();
    });
  });

  it('should delegate executeReInterface to apiService.post', (done) => {
    // Arrange
    const mockResponse = { success: true, message: 'Done' };
    apiSpy.post.and.returnValue(of(mockResponse));

    // Act
    service.executeReInterface({ unitId: 'U1' } as any).subscribe((result) => {
      // Assert
      expect(result).toEqual(mockResponse as any);
      expect(apiSpy.post).toHaveBeenCalled();
      done();
    });
  });
});
