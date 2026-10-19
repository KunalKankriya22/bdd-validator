import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TransfusionStatusLogService } from './transfusion-status-log.service';
import { ApiService } from '@shared/services/api.service';

describe('TransfusionStatusLogService', () => {
  let service: TransfusionStatusLogService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        TransfusionStatusLogService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(TransfusionStatusLogService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchJobs', () => {
    it('should call POST with pagination and search params', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchJobs(10, 0, {} as any).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getOkUnits', () => {
    it('should call GET with jobId', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ unitId: 'U1' }], total: 1, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getOkUnits(42).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getErrorUnits', () => {
    it('should call GET with jobId', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ unitId: 'U2' }], total: 1, errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getErrorUnits(42).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
