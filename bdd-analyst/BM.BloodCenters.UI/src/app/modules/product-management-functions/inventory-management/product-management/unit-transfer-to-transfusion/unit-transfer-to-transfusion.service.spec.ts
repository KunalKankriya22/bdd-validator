import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UnitTransferToTransfusionService } from './unit-transfer-to-transfusion.service';
import { ApiService } from '@shared/services/api.service';

describe('UnitTransferToTransfusionService', () => {
  let service: UnitTransferToTransfusionService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        UnitTransferToTransfusionService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(UnitTransferToTransfusionService);
  });

  it('getFacilities calls GET and returns facility list', (done) => {
    const facilities = [{ code: 'F1', description: 'Main' }];
    apiSpy.get.and.returnValue(of(facilities));

    service.getFacilities().subscribe((result) => {
      expect(result).toEqual(facilities);
      expect(apiSpy.get).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('executeTransfer posts facilityId and passes SKIP_ERROR_TOAST context', (done) => {
    const response = { success: true, message: 'ok', statusCode: 200, data: [], total: 0 };
    apiSpy.post.and.returnValue(of(response));

    service.executeTransfer('F1').subscribe((result) => {
      expect(result).toEqual(response as any);
      const [, body, opts] = apiSpy.post.calls.mostRecent().args;
      expect(body).toEqual({ facilityId: 'F1' });
      expect(opts?.context).toBeTruthy();
      done();
    });
  });
});
