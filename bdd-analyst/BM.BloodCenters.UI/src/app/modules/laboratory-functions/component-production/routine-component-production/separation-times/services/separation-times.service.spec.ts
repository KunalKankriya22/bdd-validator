import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SeparationTimesService } from './separation-times.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('SeparationTimesService', () => {
  let service: SeparationTimesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SeparationTimesService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(SeparationTimesService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getCentrifuges', () => {
    it('should extract centrifuge list from response data, defaulting to empty array', (done) => {
      const mockResponse = { data: [{ id: 'C1', name: 'Centrifuge A' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCentrifuges().subscribe(result => {
        expect(result).toEqual([{ id: 'C1', name: 'Centrifuge A' }] as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ROUTINE_SEPARATION_TIMES.CENTRIFUGES);
        done();
      });
    });
  });

  describe('recordSeparation', () => {
    it('should return first data element when separation response has data', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = { data: [{ success: true, message: 'Recorded' }] };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.recordSeparation(request).subscribe(result => {
        expect(result).toEqual({ success: true, message: 'Recorded' } as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ROUTINE_SEPARATION_TIMES.RECORD_SEPARATION,
          request
        );
        done();
      });
    });

    it('should throw error when response data is empty', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [] }));

      service.recordSeparation({} as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No data returned from separation API');
          done();
        }
      });
    });
  });
});
