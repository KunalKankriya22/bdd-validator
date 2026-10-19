import { TestBed } from '@angular/core/testing';
import { ApiLogQueryService } from './api-log-query.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('ApiLogQueryService', () => {
  let service: ApiLogQueryService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ApiLogQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ApiLogQueryService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getSourceIds', () => {
    it('should fetch source IDs successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { sourceId: 'SFA', description: 'Sales Force' },
          { sourceId: 'DRM', description: 'DRM' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSourceIds().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

  });

  describe('getDataSources', () => {
    it('should fetch data sources successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { dataSourceName: 'DN30127254 - donor_data_processor' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDataSources().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('queryApiLogs', () => {
    it('should query API logs successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            sourceId: 'SFA',
            dataSourceName: 'DN30127254 - donor_data_processor',
            programId: 'SFA',
            insertDate: '2025-11-23T02:15:03',
            logText: 'Log message'
          }
        ],
        total: 1
      };

      const filters = { sourceId: 'SFA' };
      apiService.post.and.returnValue(of(mockResponse));

      service.queryApiLogs(10, 0, filters).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockResponse.data);
          expect(result.total).toBe(1);
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
