import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CancelTestBatchApiService } from './cancel-test-batch-api.service';

describe('CancelTestBatchApiService', () => {
  let service: CancelTestBatchApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        CancelTestBatchApiService,
        { provide: HttpClient, useValue: spy },
      ],
    });

    service = TestBed.inject(CancelTestBatchApiService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getWorksheets', () => {
    it('should call GET and return worksheets', (done) => {
      const mockResponse = { success: true, data: [{ tbId: 'TB1' }] };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getWorksheets().subscribe({
        next: (result) => {
          expect(result.data).toEqual([{ tbId: 'TB1' }] as any);
          expect(httpSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('cancelBatch', () => {
    it('should call POST with cancel request', (done) => {
      const mockResponse = { success: true, data: { message: 'Cancelled' } };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.cancelBatch({ tbId: 'TB1' } as any).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(httpSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
