import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SpecialProcessingQueryApiService } from './special-processing-query-api.service';
import { ApiService } from '@shared/services/api.service';

describe('SpecialProcessingQueryApiService', () => {
  let service: SpecialProcessingQueryApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        SpecialProcessingQueryApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(SpecialProcessingQueryApiService);
  });

  it('should delegate search to apiService.post', (done) => {
    // Arrange
    const mockResponse = { success: true, data: { unitId: 'U1', records: [] } };
    apiSpy.post.and.returnValue(of(mockResponse));

    // Act
    service.search({ unitId: 'U1' } as any).subscribe((result) => {
      // Assert
      expect(result).toEqual(mockResponse as any);
      expect(apiSpy.post).toHaveBeenCalled();
      done();
    });
  });
});
