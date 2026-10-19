import { TestBed } from '@angular/core/testing';
import { RackDefinitionService } from './rack-definition.service';
import { ApiService } from '@shared/services/api.service';
import { of } from 'rxjs';

describe('RackDefinitionService', () => {
  let service: RackDefinitionService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        RackDefinitionService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(RackDefinitionService);
  });



  it('should call createRack', (done) => {
    mockApiService.post.and.returnValue(of({ success: true, message: 'Created', error: null, statusCode: 200, data: null, total: 0 }));
    service.createRack({} as any).subscribe(res => {
      expect(res.success).toBe(true);
      done();
    });
  });

  it('should call updateRack', (done) => {
    mockApiService.put.and.returnValue(of({ success: true, message: 'Updated', error: null, statusCode: 200, data: null, total: 0 }));
    service.updateRack({} as any).subscribe(res => {
      expect(res.success).toBe(true);
      done();
    });
  });








});
