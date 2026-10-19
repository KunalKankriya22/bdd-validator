import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { PlateControlsQueryService } from './plate-controls-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('PlateControlsQueryService', () => {
  let service: PlateControlsQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        PlateControlsQueryService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(PlateControlsQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getTestIds', () => {
    it('should call GET and return test IDs', (done) => {
      const mockResponse = { success: true, message: '', data: [{ testId: 'T1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestIds().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0].testId).toBe('T1');
          done();
        },
      });
    });

    it('should call the correct API endpoint for test IDs', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));
      service.getTestIds().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PLATE_CONTROLS_QUERY.TEST_IDS);
    });

    it('should return empty data array when API returns no test IDs', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));
      service.getTestIds().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(0);
          done();
        },
      });
    });
  });

  describe('getTestBatchIds', () => {
    it('should call GET with testId param and return batch IDs', (done) => {
      const mockResponse = { success: true, message: '', data: [{ tbId: 'TB1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestBatchIds('T1').subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0].tbId).toBe('TB1');
          done();
        },
      });
    });

    it('should call the correct API endpoint for test batch IDs', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));
      service.getTestBatchIds('T1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.PLATE_CONTROLS_QUERY.TEST_BATCH_IDS,
        jasmine.objectContaining({ params: jasmine.any(HttpParams) })
      );
    });

    it('should pass testId as HTTP param when provided', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));
      service.getTestBatchIds('HBS').subscribe();

      const callArgs = apiServiceSpy.get.calls.mostRecent().args;
      const params = callArgs[1]?.params as HttpParams;
      expect(params.get('testId')).toBe('HBS');
    });

    it('should call GET without params when testId is not provided', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));
      service.getTestBatchIds().subscribe();

      const callArgs = apiServiceSpy.get.calls.mostRecent().args;
      expect(callArgs[1]?.params).toBeUndefined();
    });

    it('should return empty data array when API returns no batch IDs', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', data: [] }));
      service.getTestBatchIds('T1').subscribe({
        next: (result) => {
          expect(result.data.length).toBe(0);
          done();
        },
      });
    });
  });

  describe('query', () => {
    it('should call POST with payload and return plate controls', (done) => {
      const payload = { testId: 'T1', take: 10, skip: 0 } as any;
      const mockResponse = { success: true, message: '', data: [{ tbId: 'TB1', refControl: 'RC1' }], total: 1 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.query(payload).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should call the correct API endpoint for query', () => {
      const payload = { testId: 'T1', take: 10, skip: 0 } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', data: [], total: 0 }));
      service.query(payload).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PLATE_CONTROLS_QUERY.QUERY, payload);
    });

    it('should pass the full payload including sort parameters', (done) => {
      const payload = { testId: 'T1', tbId: 'TB1', take: 25, skip: 0, sortColumn: 'TbId', sortOrder: 'ASC' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', data: [], total: 0 }));

      service.query(payload).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PLATE_CONTROLS_QUERY.QUERY, payload);
          done();
        },
      });
    });

    it('should return total count from API response', (done) => {
      const payload = { testId: 'T1', take: 10, skip: 0 } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', data: [], total: 42 }));

      service.query(payload).subscribe({
        next: (result) => {
          expect(result.total).toBe(42);
          done();
        },
      });
    });
  });
});
