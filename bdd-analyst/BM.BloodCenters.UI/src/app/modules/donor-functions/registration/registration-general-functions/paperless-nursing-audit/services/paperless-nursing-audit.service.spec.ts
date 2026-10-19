import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { PaperlessNursingAuditService } from './paperless-nursing-audit.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  ReturnResult,
  AuditOptionDto,
  NursingAuditResponse,
  NursingAuditRecordDto,
} from '../models/paperless-nursing-audit.model';

describe('PaperlessNursingAuditService', () => {
  let service: PaperlessNursingAuditService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockRecord: NursingAuditRecordDto = {
    sessionId: '26050914302355',
    chapterId: 'CH01',
    idType: 'Donation',
    idValue: 'W12345678',
    displayIdValue: 'W12345678',
    collDate: '2026-03-15T00:00:00',
    donorId: 'D001234',
    status: 'OK',
    reason: null,
    excludeFlag: null,
    driveId: 'DRV001',
  };

  const mockAuditResponse: NursingAuditResponse = {
    sessionId: '26050914302355',
    records: [mockRecord],
    summary: { totalCount: 1, okCount: 1, holdCount: 0 },
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PaperlessNursingAuditService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(PaperlessNursingAuditService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getOptions', () => {
    it('should return audit options on success', (done) => {
      const mockOptions: AuditOptionDto[] = [
        { code: 'Donation', description: 'Donation' },
        { code: 'Deferral', description: 'Deferral' },
      ];
      const response: ReturnResult<AuditOptionDto[]> = {
        success: true,
        message: null,
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [mockOptions],
        item: null,
        total: 2,
        errorResponse: null,
      };
      apiService.get.and.returnValue(of(response));

      service.getOptions().subscribe((options) => {
        expect(options).toEqual(mockOptions);
        expect(apiService.get).toHaveBeenCalledWith(API.PAPERLESS_NURSING_AUDIT.OPTIONS);
        done();
      });
    });


    it('should propagate HTTP errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getOptions().subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        },
      });
    });
  });

  describe('startAudit', () => {
    it('should return audit response on success', (done) => {
      const response: ReturnResult<NursingAuditResponse> = {
        success: true,
        message: 'Audit process started successfully',
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [mockAuditResponse],
        item: null,
        total: 1,
        errorResponse: null,
      };
      apiService.post.and.returnValue(of(response));

      const request = {
        idType: 'Donation',
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-05-09T00:00:00',
      };
      service.startAudit(request).subscribe((result) => {
        expect(result).toEqual(mockAuditResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.PAPERLESS_NURSING_AUDIT.START, request);
        done();
      });
    });

    it('should throw error when success is false', (done) => {
      const response: ReturnResult<NursingAuditResponse> = {
        success: false,
        message: 'No records found',
        error: null,
        errorCode: '9188',
        statusCode: 404,
        data: null,
        item: null,
        total: 0,
        errorResponse: null,
      };
      apiService.post.and.returnValue(of(response));

      service
        .startAudit({ idType: 'Donation', fromDate: '2026-01-01T00:00:00', toDate: '2026-05-09T00:00:00' })
        .subscribe({
          error: (err) => {
            expect(err.message).toBe('No records found');
            done();
          },
        });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('Server error')));

      service
        .startAudit({ idType: 'Donation', fromDate: '2026-01-01T00:00:00', toDate: '2026-05-09T00:00:00' })
        .subscribe({
          error: (err) => {
            expect(err.message).toBe('Server error');
            done();
          },
        });
    });
  });

  describe('getRecords', () => {
    it('should return records for a session', (done) => {
      const response: ReturnResult<NursingAuditResponse> = {
        success: true,
        message: null,
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [mockAuditResponse],
        item: null,
        total: 1,
        errorResponse: null,
      };
      apiService.get.and.returnValue(of(response));

      service.getRecords('26050914302355').subscribe((result) => {
        expect(result).toEqual(mockAuditResponse);
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.PAPERLESS_NURSING_AUDIT.GET_RECORDS}/26050914302355`,
        );
        done();
      });
    });

    it('should throw error when no records found', (done) => {
      const response: ReturnResult<NursingAuditResponse> = {
        success: false,
        message: 'No records found for this session',
        error: null,
        errorCode: null,
        statusCode: 404,
        data: null,
        item: null,
        total: 0,
        errorResponse: null,
      };
      apiService.get.and.returnValue(of(response));

      service.getRecords('INVALID').subscribe({
        error: (err) => {
          expect(err.message).toBe('No records found for this session');
          done();
        },
      });
    });
  });

  describe('updateExcludeFlags', () => {
    it('should return true on success', (done) => {
      const response: ReturnResult<boolean> = {
        success: true,
        message: 'Exclude flags updated successfully',
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [true],
        item: null,
        total: null,
        errorResponse: null,
      };
      apiService.put.and.returnValue(of(response));

      const items = [{ idValue: 'W12345678', excludeFlag: 'X' as string | null }];
      service.updateExcludeFlags('26050914302355', items).subscribe((result) => {
        expect(result).toBeTrue();
        expect(apiService.put).toHaveBeenCalledWith(
          `${API.PAPERLESS_NURSING_AUDIT.EXCLUDE}/26050914302355/exclude`,
          { items },
        );
        done();
      });
    });

    it('should throw error on invalid exclude flag', (done) => {
      const response: ReturnResult<boolean> = {
        success: false,
        message: "Exclude flag must be 'X' or blank",
        error: null,
        errorCode: '23011',
        statusCode: 400,
        data: null,
        item: null,
        total: null,
        errorResponse: null,
      };
      apiService.put.and.returnValue(of(response));

      service
        .updateExcludeFlags('26050914302355', [{ idValue: 'W12345678', excludeFlag: 'Y' }])
        .subscribe({
          error: (err) => {
            expect(err.message).toContain('X');
            done();
          },
        });
    });
  });

  describe('commitAudit', () => {
    it('should return success message on commit', (done) => {
      const response: ReturnResult<string> = {
        success: true,
        message: 'Audit committed successfully',
        error: null,
        errorCode: '16116',
        statusCode: 200,
        data: ['Audit committed successfully'],
        item: null,
        total: null,
        errorResponse: null,
      };
      apiService.post.and.returnValue(of(response));

      service.commitAudit('26050914302355').subscribe((result) => {
        expect(result).toBe('Audit committed successfully');
        expect(apiService.post).toHaveBeenCalledWith(
          `${API.PAPERLESS_NURSING_AUDIT.COMMIT}/26050914302355/commit`,
          {},
        );
        done();
      });
    });

    it('should throw error on commit failure', (done) => {
      const response: ReturnResult<string> = {
        success: false,
        message: 'Commit failed with status: ERROR',
        error: null,
        errorCode: '23014',
        statusCode: 500,
        data: null,
        item: null,
        total: null,
        errorResponse: null,
      };
      apiService.post.and.returnValue(of(response));

      service.commitAudit('26050914302355').subscribe({
        error: (err) => {
          expect(err.message).toContain('Commit failed');
          done();
        },
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('Connection lost')));

      service.commitAudit('26050914302355').subscribe({
        error: (err) => {
          expect(err.message).toBe('Connection lost');
          done();
        },
      });
    });
  });
});
