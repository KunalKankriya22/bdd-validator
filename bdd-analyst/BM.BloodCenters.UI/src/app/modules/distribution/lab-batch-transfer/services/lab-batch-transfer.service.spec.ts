import { TestBed } from '@angular/core/testing';
import { LabBatchTransferService } from './lab-batch-transfer.service';
import { ApiService } from '@shared/services/api.service';
import { of } from 'rxjs';

describe('LabBatchTransferService', () => {
  let service: LabBatchTransferService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        LabBatchTransferService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(LabBatchTransferService);
  });

  it('should call executeBatchTransfer and return result', (done) => {
    const mockResponse = {
      success: true,
      message: 'Transfer completed',
      error: null,
      statusCode: 200,
      data: {
        processStartTime: '2026-05-23T10:00:00',
        processEndTime: '2026-05-23T10:05:00'
      }
    };

    mockApiService.post.and.returnValue(of(mockResponse));

    service.executeBatchTransfer().subscribe(res => {
      expect(res.success).toBe(true);
      expect(res.data?.processStartTime).toBe('2026-05-23T10:00:00');
      expect(res.data?.processEndTime).toBe('2026-05-23T10:05:00');
      done();
    });
  });

});
