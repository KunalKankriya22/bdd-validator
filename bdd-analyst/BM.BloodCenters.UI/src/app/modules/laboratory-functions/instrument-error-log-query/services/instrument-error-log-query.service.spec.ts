import { TestBed } from '@angular/core/testing';
import { InstrumentErrorLogQueryService } from './instrument-error-log-query.service';
import { ApiService } from '@shared/services/api.service';
import {
  InstrumentErrorLogSearchRequest,
  InstrumentErrorLogResponse,
} from '../models/instrument-error-log-query.model';
import { API } from 'src/app/core/constants/api.constants';
import { of, throwError } from 'rxjs';

describe('InstrumentErrorLogQueryService', () => {
  let service: InstrumentErrorLogQueryService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockFilters: InstrumentErrorLogSearchRequest = {
    startDate: '2026-06-01',
    endDate: '2026-06-13',
    sortColumn: 'ModuleName',
    sortOrder: 'ASC',
  };

  const mockResponse: InstrumentErrorLogResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        moduleName: 'TESTMOD',
        insertDats: '13-JUN-2026 10:30:00',
        userId: 'USER01',
        statementId: 'STMT001',
        errorKey: 'ERR-001',
        errorDesc: 'Test error description',
        expandKey: '0',
      },
    ],
    total: 1,
  };

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        InstrumentErrorLogQueryService,
        { provide: ApiService, useValue: apiService },
      ],
    });

    service = TestBed.inject(InstrumentErrorLogQueryService);
  });

  // ==================== Initialization ====================

  // ==================== queryErrorLogs() ====================

  describe('queryErrorLogs()', () => {
    it('should call API with correct endpoint and filters', (done) => {
      apiService.post.and.returnValue(of(mockResponse));

      service.queryErrorLogs(25, 0, mockFilters).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.INSTRUMENT_ERROR_LOG_QUERY(25, 0),
            mockFilters
          );
          done();
        },
      });
    });

    it('should return mapped data and total', (done) => {
      apiService.post.and.returnValue(of(mockResponse));

      service.queryErrorLogs(25, 0, mockFilters).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          expect(result.data[0].moduleName).toBe('TESTMOD');
          expect(result.data[0].userId).toBe('USER01');
          done();
        },
      });
    });

    it('should use custom pagination parameters', (done) => {
      apiService.post.and.returnValue(of(mockResponse));

      service.queryErrorLogs(50, 100, mockFilters).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.INSTRUMENT_ERROR_LOG_QUERY(50, 100),
            mockFilters
          );
          done();
        },
      });
    });




    it('should handle null total in response', (done) => {
      apiService.post.and.returnValue(of({ data: [], total: null }));

      service.queryErrorLogs(25, 0, mockFilters).subscribe({
        next: (result) => {
          expect(result.total).toBe(0);
          done();
        },
      });
    });

    it('should pass moduleName filter when provided', (done) => {
      const filtersWithModule: InstrumentErrorLogSearchRequest = {
        ...mockFilters,
        moduleName: 'TESTMOD',
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.queryErrorLogs(25, 0, filtersWithModule).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          expect(callArgs[1].moduleName).toBe('TESTMOD');
          done();
        },
      });
    });

    it('should propagate API error', (done) => {
      const error = { message: 'API error' };
      apiService.post.and.returnValue(throwError(() => error));

      service.queryErrorLogs(25, 0, mockFilters).subscribe({
        error: (err) => {
          expect(err.message).toBe('API error');
          done();
        },
      });
    });

  });
});
