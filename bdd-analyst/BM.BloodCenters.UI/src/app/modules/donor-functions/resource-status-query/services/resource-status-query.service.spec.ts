import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResourceStatusQueryService } from './resource-status-query.service';
import { ApiService } from '@shared/services/api.service';

describe('ResourceStatusQueryService', () => {
  let service: ResourceStatusQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ResourceStatusQueryService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ResourceStatusQueryService);
  });

  it('should searchResourceStatus and map response', (done) => {
    mockApiService.post.and.returnValue(of({ data: [{ id: 1 }], total: 1, message: 'OK' }));

    service.searchResourceStatus(10, 0, {} as any).subscribe(result => {
      expect(result.data.length).toBe(1);
      expect(result.totalRecords).toBe(1);
      expect(result.message).toBe('OK');
      expect(mockApiService.post).toHaveBeenCalled();
      done();
    });
  });

  it('should getResources with date params and map response', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ resourceId: 'R1' }] }));

    service.getResources('2024-01-01', '2024-12-31').subscribe(result => {
      expect(result.data.length).toBe(1);
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });
});
