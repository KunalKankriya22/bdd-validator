import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WarehouseService } from './warehouse.service';
import { ApiService } from '@shared/services/api.service';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        WarehouseService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(WarehouseService);
  });

  it('should getWarehouses by userId', (done) => {
    mockApiService.get.and.returnValue(of([{ UserId: 'U1' }]));

    service.getWarehouses('U1').subscribe(result => {
      expect(result.length).toBe(1);
      expect(mockApiService.get).toHaveBeenCalled();
      done();
    });
  });

  it('should getUsersDropdown and map data', (done) => {
    mockApiService.get.and.returnValue(of({ data: [{ userId: 'U1', userName: 'User 1' }] }));

    service.getUsersDropdown().subscribe(result => {
      expect(result.length).toBe(1);
      done();
    });
  });

  it('should filterWarehouses via POST', (done) => {
    mockApiService.post.and.returnValue(of([{ UserId: 'U1' }]));

    service.filterWarehouses('U1', {}).subscribe(result => {
      expect(result.length).toBe(1);
      expect(mockApiService.post).toHaveBeenCalled();
      done();
    });
  });
});
