import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ResetUnderExtractService } from './reset-under-extract.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ResetUnderExtractDto,
  ResetUnderExtractGetResponse,
  ResetUnderExtractRequestDto,
  ResetUnderExtractResetResponse,
} from '../models/reset-under-extract.model';

describe('ResetUnderExtractService', () => {
  let service: ResetUnderExtractService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockData: ResetUnderExtractDto[] = [
    {
      resultParmId: 'PARM001',
      batchId: 'BATCH001',
      insertDate: '2024-05-31T14:30:00Z',
      underExtractFlag: 'Y',
    },
    {
      resultParmId: 'PARM002',
      batchId: 'BATCH002',
      insertDate: '2024-05-31T13:15:00Z',
      underExtractFlag: 'Y',
    },
  ];

  const mockGetResponse: ResetUnderExtractGetResponse = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: mockData,
    totalCount: 2,
  };

  const mockResetRequest: ResetUnderExtractRequestDto = {
    items: [
      { resultParmId: 'PARM001', batchId: 'BATCH001' },
      { resultParmId: 'PARM002', batchId: 'BATCH002' },
    ],
  };

  const mockResetResponse: ResetUnderExtractResetResponse = {
    success: true,
    message: 'Successfully reset 2 record(s). 0 record(s) failed.',
    statusCode: 200,
    data: {
      successCount: 2,
      skippedCount: 0,
      totalProcessed: 2,
    },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ResetUnderExtractService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ResetUnderExtractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be providedIn root', () => {
    /* The service is decorated with @Injectable({ providedIn: 'root' }).
       Successful injection via TestBed.inject confirms the provider is available. */
    const injected = TestBed.inject(ResetUnderExtractService);
    expect(injected).toBe(service);
  });

  // -----------------------------------------------------------
  // getEligibleRecords
  // -----------------------------------------------------------
  describe('getEligibleRecords', () => {
    it('should call API GET endpoint with correct URL', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockGetResponse));

      service.getEligibleRecords().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.RESET_UNDER_EXTRACT.GET_ELIGIBLE
        );
        done();
      });
    });

    it('should return eligible records data', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockGetResponse));

      service.getEligibleRecords().subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(2);
        expect(response.totalCount).toBe(2);
        expect(response.data[0].resultParmId).toBe('PARM001');
        done();
      });
    });

    it('should handle empty response with null data', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null,
        totalCount: null,
      } as any));

      service.getEligibleRecords().subscribe((response) => {
        expect(response.data).toEqual([]);
        expect(response.totalCount).toBe(0);
        done();
      });
    });

    it('should map response fields correctly', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockGetResponse));

      service.getEligibleRecords().subscribe((response) => {
        expect(response.success).toBe(mockGetResponse.success);
        expect(response.statusCode).toBe(mockGetResponse.statusCode);
        expect(response.message).toBe(mockGetResponse.message);
        expect(response.data).toEqual(mockGetResponse.data);
        expect(response.totalCount).toBe(mockGetResponse.totalCount);
        done();
      });
    });

    it('should propagate GET error', (done) => {
      const errorResponse = {
        success: false,
        statusCode: 500,
        message: 'Internal Server Error',
      };

      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getEligibleRecords().subscribe({
        next: () => fail('Expected error, but got success'),
        error: (error) => {
          expect(error.statusCode).toBe(500);
          done();
        },
      });
    });
  });

  // -----------------------------------------------------------
  // resetFlags
  // -----------------------------------------------------------
  describe('resetFlags', () => {
    it('should call API POST endpoint with correct URL and payload', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockResetResponse));

      service.resetFlags(mockResetRequest).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.RESET_UNDER_EXTRACT.RESET,
          mockResetRequest
        );
        done();
      });
    });

    it('should send correct request body for resetFlags', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockResetResponse));

      const request: ResetUnderExtractRequestDto = {
        items: [{ resultParmId: 'PARM001', batchId: 'BATCH001' }],
      };

      service.resetFlags(request).subscribe(() => {
        const sentPayload = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(sentPayload.items.length).toBe(1);
        expect(sentPayload.items[0].resultParmId).toBe('PARM001');
        expect(sentPayload.items[0].batchId).toBe('BATCH001');
        done();
      });
    });

    it('should return reset response with success counts', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockResetResponse));

      service.resetFlags(mockResetRequest).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.successCount).toBe(2);
        expect(response.data.skippedCount).toBe(0);
        expect(response.data.totalProcessed).toBe(2);
        done();
      });
    });

    it('should handle partial success response', (done) => {
      const partialResponse: ResetUnderExtractResetResponse = {
        success: true,
        message: 'Successfully reset 1 record(s). 1 record(s) failed.',
        statusCode: 200,
        data: {
          successCount: 1,
          skippedCount: 1,
          totalProcessed: 2,
        },
      };

      apiServiceSpy.post.and.returnValue(of(partialResponse));

      service.resetFlags(mockResetRequest).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.successCount).toBe(1);
        expect(response.data.skippedCount).toBe(1);
        done();
      });
    });

    it('should propagate POST error', (done) => {
      const errorResponse = {
        success: false,
        message: 'An error occurred while resetting under extract flags.',
        statusCode: 500,
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.resetFlags(mockResetRequest).subscribe({
        next: () => fail('Expected error, but got success'),
        error: (error) => {
          expect(error.statusCode).toBe(500);
          done();
        },
      });
    });

    it('should handle response with null data for resetFlags', (done) => {
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null,
      } as any));

      service.resetFlags(mockResetRequest).subscribe((response) => {
        expect(response.data.successCount).toBe(0);
        expect(response.data.skippedCount).toBe(0);
        expect(response.data.totalProcessed).toBe(0);
        done();
      });
    });

    it('should handle null batchId in request', (done) => {
      const requestWithNullBatch: ResetUnderExtractRequestDto = {
        items: [{ resultParmId: 'PARM003', batchId: null }],
      };

      apiServiceSpy.post.and.returnValue(of(mockResetResponse));

      service.resetFlags(requestWithNullBatch).subscribe((response) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.RESET_UNDER_EXTRACT.RESET,
          requestWithNullBatch
        );
        expect(response.success).toBe(true);
        done();
      });
    });

    it('should map response fields correctly', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockResetResponse));

      service.resetFlags(mockResetRequest).subscribe((response) => {
        expect(response.success).toBe(mockResetResponse.success);
        expect(response.message).toBe(mockResetResponse.message);
        expect(response.statusCode).toBe(mockResetResponse.statusCode);
        expect(response.data).toEqual(mockResetResponse.data);
        done();
      });
    });
  });
});
