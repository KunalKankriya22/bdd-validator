import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VistaLifeTrakErrorLogService } from './vista-lifetrak-error-log.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('VistaLifeTrakErrorLogService', () => {
  let service: VistaLifeTrakErrorLogService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        VistaLifeTrakErrorLogService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(VistaLifeTrakErrorLogService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getErrorLogs', () => {
    it('should POST query with pagination and map response with null-safe defaults', (done) => {
      const query = { startDate: '2024-01-01' } as any;
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null,
        total: null
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getErrorLogs(10, 0, query).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.VISTA_LIFETRAK_ERROR_LOG.LIST(10, 0),
          query,
          jasmine.objectContaining({ context: jasmine.anything() })
        );
        done();
      });
    });
  });
});
