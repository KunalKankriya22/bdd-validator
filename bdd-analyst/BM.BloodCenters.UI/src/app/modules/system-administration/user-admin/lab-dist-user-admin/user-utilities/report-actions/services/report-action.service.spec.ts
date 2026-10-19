import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { ReportActionService } from './report-action.service';
import {
  ReportStatus,
  ReportActionQuery,
  LogReportRequest
} from '../models/report-action.model';
import { USER_ACCESS_LEVELS } from '../../../../../../../core/constants/validation.constants';

describe('ReportActionService', () => {
  let service: ReportActionService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ReportActionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    service = TestBed.inject(ReportActionService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ─── Helper data ───────────────────────────────────────────────

  const mockBackendItem = {
    ApplId: 'APP1',
    ReportName: 'TestReport',
    ParmId: 'P1',
    UserName: 'jdoe',
    SubmitDate: '2024-06-15T10:30:00Z',
    ReportStatus: 'C',
    RepJobId: 'JOB1',
    RepServer: 'SRV1',
    ChapterId: 'CH1',
    OutputFile: 'output.pdf',
    FileName: 'file.pdf',
    FormsType: 'PDF',
    StatusMessage: 'Done'
  };

  const mockBackendItemCamel = {
    applId: 'APP2',
    reportName: 'TestReport2',
    parmId: 'P2',
    userName: 'asmith',
    submitDate: '2024-07-01T12:00:00Z',
    reportStatus: 'S',
    repJobId: 'JOB2',
    repServer: 'SRV2',
    chapterId: 'CH2',
    outputFile: 'output2.pdf',
    fileName: 'file2.pdf',
    formsType: 'CSV',
    statusMessage: 'Queued'
  };

  const defaultQuery: ReportActionQuery = {
    isSupervisor: false
  };

  // ─── getStatusDisplay (existing tests preserved) ───────────────

  describe('getStatusDisplay', () => {
    it('should return "Completed" for status code "C"', () => {
      expect(service['getStatusDisplay']('C')).toBe('Completed');
    });

    it('should return "Submitted" for status code "S"', () => {
      expect(service['getStatusDisplay']('S')).toBe('Submitted');
    });

    it('should return "Executing" for status code "E"', () => {
      expect(service['getStatusDisplay']('E')).toBe('Executing');
    });

    it('should return "Error" for unknown status code', () => {
      expect(service['getStatusDisplay']('X')).toBe('Error');
    });

    it('should return "Error" for null status', () => {
      expect(service['getStatusDisplay'](null as any)).toBe('Error');
    });

    it('should return "Error" for undefined status', () => {
      expect(service['getStatusDisplay'](undefined as any)).toBe('Error');
    });

    it('should return "Error" for empty string status', () => {
      expect(service['getStatusDisplay']('')).toBe('Error');
    });

    it('should handle lowercase status codes as unknown (case-sensitive)', () => {
      expect(service['getStatusDisplay']('c')).toBe('Error');
      expect(service['getStatusDisplay']('s')).toBe('Error');
      expect(service['getStatusDisplay']('e')).toBe('Error');
    });
  });

  // ─── getReports ────────────────────────────────────────────────

  describe('getReports', () => {
    it('should call apiService.post with correct endpoint and body', () => {
      apiService.post.and.returnValue(of({ Data: [], Total: 0 }));
      service.getReports(10, 0, defaultQuery, 5).subscribe();

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('report-actions/10/0'),
        defaultQuery
      );
      expect(apiService.post.calls.first().args[0]).toContain('accessLevel=5');
    });

    it('should transform PascalCase response (Data/Total)', () => {
      apiService.post.and.returnValue(of({
        Data: [mockBackendItem],
        Total: 42
      }));

      service.getReports(10, 0, defaultQuery, 5).subscribe(result => {
        expect(result.totalRecords).toBe(42);
        expect(result.data.length).toBe(1);
        expect(result.data[0].applId).toBe('APP1');
        expect(result.data[0].reportName).toBe('TestReport');
        expect(result.data[0].parmId).toBe('P1');
        expect(result.data[0].userName).toBe('jdoe');
        expect(result.data[0].reportStatus).toBe('C');
        expect(result.data[0].displayStatus).toBe('Completed');
        expect(result.data[0].canReview).toBe(true);
        expect(result.data[0].canDelete).toBe(true);
        expect(result.data[0].canPrint).toBe(true);
      });
    });

    it('should transform camelCase response (data/total)', () => {
      apiService.post.and.returnValue(of({
        data: [mockBackendItemCamel],
        total: 7
      }));

      service.getReports(5, 0, defaultQuery, 3).subscribe(result => {
        expect(result.totalRecords).toBe(7);
        expect(result.data.length).toBe(1);
        expect(result.data[0].applId).toBe('APP2');
        expect(result.data[0].reportStatus).toBe('S');
        expect(result.data[0].displayStatus).toBe('Submitted');
        expect(result.data[0].canReview).toBe(false);
        expect(result.data[0].canDelete).toBe(false);
        expect(result.data[0].canPrint).toBe(false);
      });
    });

    it('should return empty data when response Data and data are undefined', () => {
      apiService.post.and.returnValue(of({ Total: 0 }));

      service.getReports(10, 0, defaultQuery, 5).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
      });
    });

    it('should return zero totalRecords when response Total and total are undefined', () => {
      apiService.post.and.returnValue(of({ Data: [] }));

      service.getReports(10, 0, defaultQuery, 5).subscribe(result => {
        expect(result.totalRecords).toBe(0);
      });
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('Network error');
      apiService.post.and.returnValue(throwError(() => error));

      service.getReports(10, 0, defaultQuery, 5).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should handle multiple items in response', () => {
      apiService.post.and.returnValue(of({
        Data: [
          mockBackendItem,
          { ...mockBackendItem, ReportStatus: 'E', ReportName: 'Report2' }
        ],
        Total: 2
      }));

      service.getReports(10, 0, defaultQuery, 5).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.data[0].displayStatus).toBe('Completed');
        expect(result.data[1].displayStatus).toBe('Executing');
      });
    });
  });

  // ─── getReport ─────────────────────────────────────────────────

  describe('getReport', () => {
    it('should call apiService.get with correct endpoint', () => {
      apiService.get.and.returnValue(of({ Item: mockBackendItem }));
      service.getReport('TestReport', 'P1', 'jdoe').subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('report-action/')
      );
    });

    it('should transform PascalCase response (Item)', () => {
      apiService.get.and.returnValue(of({ Item: mockBackendItem }));

      service.getReport('TestReport', 'P1', 'jdoe').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result!.applId).toBe('APP1');
        expect(result!.reportName).toBe('TestReport');
        expect(result!.displayStatus).toBe('Completed');
        expect(result!.canReview).toBe(true);
      });
    });

    it('should transform camelCase response (item)', () => {
      apiService.get.and.returnValue(of({ item: mockBackendItemCamel }));

      service.getReport('TestReport2', 'P2', 'asmith').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result!.applId).toBe('APP2');
        expect(result!.reportStatus).toBe('S');
        expect(result!.canReview).toBe(false);
      });
    });

    it('should return null when neither Item nor item is present', () => {
      apiService.get.and.returnValue(of({}));

      service.getReport('TestReport', 'P1', 'jdoe').subscribe(result => {
        expect(result).toBeNull();
      });
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('Not found');
      apiService.get.and.returnValue(throwError(() => error));

      service.getReport('TestReport', 'P1', 'jdoe').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── getReportUrl ──────────────────────────────────────────────

  describe('getReportUrl', () => {
    it('should call apiService.post with correct endpoint and body', () => {
      const mockResponse = { success: true, data: 'https://report.url' };
      apiService.post.and.returnValue(of(mockResponse));

      service.getReportUrl('P1', 'APP1', 'TestReport', 'jdoe').subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('report-action/url'),
        {
          parmId: 'P1',
          applId: 'APP1',
          reportName: 'TestReport',
          userName: 'jdoe'
        }
      );
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('URL fetch failed');
      apiService.post.and.returnValue(throwError(() => error));

      service.getReportUrl('P1', 'APP1', 'TestReport', 'jdoe').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── deleteReport ──────────────────────────────────────────────

  describe('deleteReport', () => {
    it('should call apiService.delete with correct endpoint', () => {
      const mockResponse = { success: true };
      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteReport('TestReport', 'P1', 'jdoe', 'APP1').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
      });

      expect(apiService.delete).toHaveBeenCalledWith(
        jasmine.stringContaining('report-action/')
      );
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('Delete failed');
      apiService.delete.and.returnValue(throwError(() => error));

      service.deleteReport('TestReport', 'P1', 'jdoe', 'APP1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── getFilterDropdowns ────────────────────────────────────────

  describe('getFilterDropdowns', () => {
    it('should call apiService.get with the dropdowns endpoint', () => {
      apiService.get.and.returnValue(of({
        users: [{ code: 'U1', name: 'User 1' }],
        statuses: [{ code: 'C', name: 'Completed' }],
        reportNames: [{ code: 'R1', name: 'Report 1' }]
      }));

      service.getFilterDropdowns().subscribe(result => {
        expect(result.users.length).toBe(1);
        expect(result.statuses.length).toBe(1);
        expect(result.reportNames.length).toBe(1);
      });

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('dropdowns')
      );
    });

    it('should use default statuses when response.statuses is missing', () => {
      apiService.get.and.returnValue(of({
        users: [],
        reportNames: []
      }));

      service.getFilterDropdowns().subscribe(result => {
        expect(result.statuses.length).toBe(3);
        expect(result.statuses[0]).toEqual({ code: 'C', name: 'Completed' });
        expect(result.statuses[1]).toEqual({ code: 'S', name: 'Submitted' });
        expect(result.statuses[2]).toEqual({ code: 'E', name: 'Executing' });
      });
    });

    it('should default to empty arrays when response fields are missing', () => {
      apiService.get.and.returnValue(of({}));

      service.getFilterDropdowns().subscribe(result => {
        expect(result.users).toEqual([]);
        expect(result.reportNames).toEqual([]);
        expect(result.statuses.length).toBe(3); // defaults
      });
    });

    it('should propagate error via throwError on failure', (done) => {
      const error = new Error('Dropdowns fetch failed');
      apiService.get.and.returnValue(throwError(() => error));

      service.getFilterDropdowns().subscribe({
        error: (err) => {
          expect(err.users).toEqual([]);
          expect(err.statuses.length).toBe(3);
          expect(err.reportNames).toEqual([]);
          done();
        }
      });
    });
  });

  // ─── getDistinctUsernames ──────────────────────────────────────

  describe('getDistinctUsernames', () => {
    it('should call apiService.get with distinct-usernames endpoint', () => {
      apiService.get.and.returnValue(of({ data: [] }));
      service.getDistinctUsernames().subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('distinct-usernames')
      );
    });

    it('should extract usernames from camelCase response (data)', () => {
      apiService.get.and.returnValue(of({
        data: [
          { userName: 'charlie' },
          { userName: 'alice' },
          { userName: 'bob' }
        ]
      }));

      service.getDistinctUsernames().subscribe(result => {
        expect(result).toEqual(['alice', 'bob', 'charlie']);
      });
    });

    it('should extract usernames from PascalCase response (Data)', () => {
      apiService.get.and.returnValue(of({
        Data: [
          { userName: 'zara' },
          { userName: 'mike' }
        ]
      }));

      service.getDistinctUsernames().subscribe(result => {
        expect(result).toEqual(['mike', 'zara']);
      });
    });

    it('should filter out falsy usernames', () => {
      apiService.get.and.returnValue(of({
        data: [
          { userName: 'alice' },
          { userName: '' },
          { userName: null },
          { userName: undefined },
          { userName: 'bob' }
        ]
      }));

      service.getDistinctUsernames().subscribe(result => {
        expect(result).toEqual(['alice', 'bob']);
      });
    });

    it('should sort usernames case-insensitively', () => {
      apiService.get.and.returnValue(of({
        data: [
          { userName: 'Zara' },
          { userName: 'alice' },
          { userName: 'Bob' }
        ]
      }));

      service.getDistinctUsernames().subscribe(result => {
        expect(result).toEqual(['alice', 'Bob', 'Zara']);
      });
    });

    it('should return empty array when data and Data are undefined', () => {
      apiService.get.and.returnValue(of({}));

      service.getDistinctUsernames().subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('Fetch usernames failed');
      apiService.get.and.returnValue(throwError(() => error));

      service.getDistinctUsernames().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── getUserDetails ────────────────────────────────────────────

  describe('getUserDetails', () => {
    it('should call apiService.get with user-details endpoint', () => {
      apiService.get.and.returnValue(of({
        item: { userId: 'U1', accPriv: 5 }
      }));
      service.getUserDetails('U1').subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('user-details/')
      );
    });

    it('should transform camelCase response correctly', () => {
      apiService.get.and.returnValue(of({
        item: {
          userId: 'U1',
          accPriv: 5,
          userName: 'John Doe',
          staffNo: 'S001',
          functionalGroup: 'Lab'
        }
      }));

      service.getUserDetails('U1').subscribe(result => {
        expect(result.userId).toBe('U1');
        expect(result.accessLevel).toBe(5);
        expect(result.userName).toBe('John Doe');
        expect(result.staffNo).toBe('S001');
        expect(result.functionalGroup).toBe('Lab');
        expect(result.isSupervisor).toBe(false);
      });
    });

    it('should transform PascalCase response correctly', () => {
      apiService.get.and.returnValue(of({
        Item: {
          UserId: 'U2',
          AccPriv: 10,
          UserName: 'Jane Smith',
          StaffNo: 'S002',
          FunctionalGroup: 'Distribution'
        }
      }));

      service.getUserDetails('U2').subscribe(result => {
        expect(result.userId).toBe('U2');
        expect(result.accessLevel).toBe(10);
        expect(result.userName).toBe('Jane Smith');
        expect(result.staffNo).toBe('S002');
        expect(result.functionalGroup).toBe('Distribution');
        expect(result.isSupervisor).toBe(true);
      });
    });

    it('should set isSupervisor to true when accessLevel >= SUPERVISOR_MINIMUM', () => {
      apiService.get.and.returnValue(of({
        item: { userId: 'U3', accPriv: USER_ACCESS_LEVELS.SUPERVISOR_MINIMUM }
      }));

      service.getUserDetails('U3').subscribe(result => {
        expect(result.isSupervisor).toBe(true);
      });
    });

    it('should set isSupervisor to false when accessLevel < SUPERVISOR_MINIMUM', () => {
      apiService.get.and.returnValue(of({
        item: { userId: 'U4', accPriv: USER_ACCESS_LEVELS.SUPERVISOR_MINIMUM - 1 }
      }));

      service.getUserDetails('U4').subscribe(result => {
        expect(result.isSupervisor).toBe(false);
      });
    });

    it('should default accessLevel to 0 when accPriv and AccPriv are missing', () => {
      apiService.get.and.returnValue(of({
        item: { userId: 'U5' }
      }));

      service.getUserDetails('U5').subscribe(result => {
        expect(result.accessLevel).toBe(0);
        expect(result.isSupervisor).toBe(false);
      });
    });

    it('should fallback to the raw response when neither item nor Item is present', () => {
      apiService.get.and.returnValue(of({
        userId: 'U6',
        accPriv: 3
      }));

      service.getUserDetails('U6').subscribe(result => {
        expect(result.userId).toBe('U6');
        expect(result.accessLevel).toBe(3);
      });
    });

    it('should use the passed userId when response userId is missing', () => {
      apiService.get.and.returnValue(of({
        item: { accPriv: 1 }
      }));

      service.getUserDetails('FALLBACK_ID').subscribe(result => {
        expect(result.userId).toBe('FALLBACK_ID');
      });
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('User details failed');
      apiService.get.and.returnValue(throwError(() => error));

      service.getUserDetails('U1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── getUsersByChapter ─────────────────────────────────────────

  describe('getUsersByChapter', () => {
    it('should call apiService.get with users-by-chapter endpoint', () => {
      apiService.get.and.returnValue(of([]));
      service.getUsersByChapter('CH1').subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringContaining('users-by-chapter/')
      );
    });

    it('should extract camelCase userId from user objects', () => {
      apiService.get.and.returnValue(of([
        { userId: 'U1' },
        { userId: 'U2' },
        { userId: 'U3' }
      ]));

      service.getUsersByChapter('CH1').subscribe(result => {
        expect(result).toEqual(['U1', 'U2', 'U3']);
      });
    });

    it('should extract PascalCase UserId from user objects', () => {
      apiService.get.and.returnValue(of([
        { UserId: 'U4' },
        { UserId: 'U5' }
      ]));

      service.getUsersByChapter('CH1').subscribe(result => {
        expect(result).toEqual(['U4', 'U5']);
      });
    });

    it('should filter out falsy user IDs', () => {
      apiService.get.and.returnValue(of([
        { userId: 'U1' },
        { userId: null },
        { userId: '' },
        { userId: 'U2' },
        {}
      ]));

      service.getUsersByChapter('CH1').subscribe(result => {
        expect(result).toEqual(['U1', 'U2']);
      });
    });

    it('should return empty array when API returns empty array', () => {
      apiService.get.and.returnValue(of([]));

      service.getUsersByChapter('CH1').subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('Users by chapter failed');
      apiService.get.and.returnValue(throwError(() => error));

      service.getUsersByChapter('CH1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── submitLogReport ───────────────────────────────────────────

  describe('submitLogReport', () => {
    const logRequest: LogReportRequest = {
      parmId: 'P1',
      userName: 'jdoe',
      reportName: 'TestReport',
      applId: 'APP1'
    };

    it('should call apiService.post with the show-log endpoint and request body', () => {
      apiService.post.and.returnValue(of({
        Item: {
          NewParmId: 'NP1',
          SessionId: 'SES1',
          OriginalParmId: 'OP1',
          JobId: 'J1',
          Status: 'Started',
          Message: 'OK'
        }
      }));

      service.submitLogReport(logRequest).subscribe();

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringContaining('report-action/show-log'),
        logRequest
      );
    });

    it('should transform PascalCase response fields', () => {
      apiService.post.and.returnValue(of({
        Item: {
          NewParmId: 'NP1',
          SessionId: 'SES1',
          OriginalParmId: 'OP1',
          JobId: 'J1',
          Status: 'Started',
          Message: 'OK'
        }
      }));

      service.submitLogReport(logRequest).subscribe(result => {
        expect(result.newParmId).toBe('NP1');
        expect(result.sessionId).toBe('SES1');
        expect(result.originalParmId).toBe('OP1');
        expect(result.jobId).toBe('J1');
        expect(result.status).toBe('Started');
        expect(result.message).toBe('OK');
      });
    });

    it('should transform camelCase response fields', () => {
      apiService.post.and.returnValue(of({
        item: {
          newParmId: 'NP2',
          sessionId: 'SES2',
          originalParmId: 'OP2',
          jobId: 'J2',
          status: 'Queued',
          message: 'Submitted'
        }
      }));

      service.submitLogReport(logRequest).subscribe(result => {
        expect(result.newParmId).toBe('NP2');
        expect(result.sessionId).toBe('SES2');
        expect(result.originalParmId).toBe('OP2');
        expect(result.jobId).toBe('J2');
        expect(result.status).toBe('Queued');
        expect(result.message).toBe('Submitted');
      });
    });

    it('should throw error when item is missing from response', (done) => {
      apiService.post.and.returnValue(of({ message: 'No item found' }));

      service.submitLogReport(logRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('No item found');
          done();
        }
      });
    });

    it('should throw generic error when item is missing and no message', (done) => {
      apiService.post.and.returnValue(of({}));

      service.submitLogReport(logRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to submit log report');
          done();
        }
      });
    });

    it('should propagate error from apiService', (done) => {
      const error = new Error('Submit log failed');
      apiService.post.and.returnValue(throwError(() => error));

      service.submitLogReport(logRequest).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ─── cleanupLogReport ─────────────────────────────────────────

  describe('cleanupLogReport', () => {
    it('should call apiService.delete with correct endpoint', () => {
      apiService.delete.and.returnValue(of({ success: true }));

      service.cleanupLogReport('SES1', 'P1').subscribe();

      expect(apiService.delete).toHaveBeenCalledWith(
        jasmine.stringContaining('log-cleanup/')
      );
    });

    it('should return response on success', () => {
      const response = { success: true, message: 'Cleaned' };
      apiService.delete.and.returnValue(of(response));

      service.cleanupLogReport('SES1', 'P1').subscribe(result => {
        expect(result).toEqual(response);
      });
    });

    it('should swallow error and return null', () => {
      apiService.delete.and.returnValue(throwError(() => new Error('Cleanup failed')));

      service.cleanupLogReport('SES1', 'P1').subscribe(result => {
        expect(result).toBeNull();
      });
    });
  });

  // ─── pollLogReportStatus ───────────────────────────────────────

  describe('pollLogReportStatus', () => {
    it('should poll and complete when report status is Completed', fakeAsync(() => {
      let callCount = 0;
      apiService.get.and.callFake(() => {
        callCount++;
        if (callCount >= 2) {
          return of({
            Item: {
              ...mockBackendItem,
              ReportStatus: 'C'
            }
          });
        }
        return of({
          Item: {
            ...mockBackendItem,
            ReportStatus: 'S'
          }
        });
      });

      let result: any;
      service.pollLogReportStatus('TestReport', 'P1', 'jdoe').subscribe(r => {
        result = r;
      });

      // Initial 3 second delay
      tick(3000);
      // First poll returns Submitted, still running
      tick(3000);
      // Second poll returns Completed, should finish

      expect(result).toBeTruthy();
      expect(result.reportStatus).toBe(ReportStatus.Completed);
    }));

    it('should use default report status when getReport returns null', fakeAsync(() => {
      let callCount = 0;
      apiService.get.and.callFake(() => {
        callCount++;
        if (callCount >= 2) {
          return of({
            Item: {
              ...mockBackendItem,
              ReportStatus: 'C'
            }
          });
        }
        return of({});  // Returns null item from getReport
      });

      let result: any;
      service.pollLogReportStatus('TestReport', 'P1', 'jdoe').subscribe(r => {
        result = r;
      });

      tick(3000);
      tick(3000);

      expect(result).toBeTruthy();
      expect(result.reportStatus).toBe(ReportStatus.Completed);
    }));

    it('should handle getReport errors during polling gracefully', fakeAsync(() => {
      let callCount = 0;
      apiService.get.and.callFake(() => {
        callCount++;
        if (callCount >= 2) {
          return of({
            Item: {
              ...mockBackendItem,
              ReportStatus: 'C'
            }
          });
        }
        return throwError(() => new Error('Temporary error'));
      });

      let result: any;
      service.pollLogReportStatus('TestReport', 'P1', 'jdoe').subscribe(r => {
        result = r;
      });

      tick(3000);
      tick(3000);

      expect(result).toBeTruthy();
      expect(result.reportStatus).toBe(ReportStatus.Completed);
    }));
  });

  // ─── transformReport (private, via bracket notation) ───────────

  describe('transformReport', () => {
    it('should set canReview/canDelete/canPrint to true for Completed status', () => {
      const item = { ...mockBackendItem, ReportStatus: 'C' };
      const result = service['transformReport'](item);

      expect(result.canReview).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.canPrint).toBe(true);
    });

    it('should set canReview/canDelete/canPrint to false for Submitted status', () => {
      const item = { ...mockBackendItem, ReportStatus: 'S' };
      const result = service['transformReport'](item);

      expect(result.canReview).toBe(false);
      expect(result.canDelete).toBe(false);
      expect(result.canPrint).toBe(false);
    });

    it('should set canReview/canDelete/canPrint to false for Executing status', () => {
      const item = { ...mockBackendItem, ReportStatus: 'E' };
      const result = service['transformReport'](item);

      expect(result.canReview).toBe(false);
      expect(result.canDelete).toBe(false);
      expect(result.canPrint).toBe(false);
    });

    it('should set displayStatus correctly', () => {
      expect(service['transformReport']({ ...mockBackendItem, ReportStatus: 'C' }).displayStatus).toBe('Completed');
      expect(service['transformReport']({ ...mockBackendItem, ReportStatus: 'S' }).displayStatus).toBe('Submitted');
      expect(service['transformReport']({ ...mockBackendItem, ReportStatus: 'E' }).displayStatus).toBe('Executing');
      expect(service['transformReport']({ ...mockBackendItem, ReportStatus: 'X' }).displayStatus).toBe('Error');
    });

    it('should parse submitDate as a Date object', () => {
      const result = service['transformReport'](mockBackendItem);
      expect(result.submitDate instanceof Date).toBe(true);
    });

    it('should map all backend fields (PascalCase)', () => {
      const result = service['transformReport'](mockBackendItem);
      expect(result.applId).toBe('APP1');
      expect(result.reportName).toBe('TestReport');
      expect(result.parmId).toBe('P1');
      expect(result.userName).toBe('jdoe');
      expect(result.repJobId).toBe('JOB1');
      expect(result.repServer).toBe('SRV1');
      expect(result.chapterId).toBe('CH1');
      expect(result.outputFile).toBe('output.pdf');
      expect(result.fileName).toBe('file.pdf');
      expect(result.formsType).toBe('PDF');
      expect(result.statusMessage).toBe('Done');
    });

    it('should map all backend fields (camelCase)', () => {
      const result = service['transformReport'](mockBackendItemCamel);
      expect(result.applId).toBe('APP2');
      expect(result.reportName).toBe('TestReport2');
      expect(result.parmId).toBe('P2');
      expect(result.userName).toBe('asmith');
      expect(result.repJobId).toBe('JOB2');
      expect(result.repServer).toBe('SRV2');
      expect(result.chapterId).toBe('CH2');
      expect(result.outputFile).toBe('output2.pdf');
      expect(result.fileName).toBe('file2.pdf');
      expect(result.formsType).toBe('CSV');
      expect(result.statusMessage).toBe('Queued');
    });

    it('should set localSubmitDate to the parsed submitDate', () => {
      const result = service['transformReport'](mockBackendItem);
      expect(result.localSubmitDate).toEqual(result.submitDate);
    });
  });

  // ─── transformReportsArray (private) ───────────────────────────

  describe('transformReportsArray', () => {
    it('should transform an array of items', () => {
      const items = [mockBackendItem, mockBackendItemCamel];
      const result = service['transformReportsArray'](items);

      expect(result.length).toBe(2);
      expect(result[0].applId).toBe('APP1');
      expect(result[1].applId).toBe('APP2');
    });

    it('should return empty array for empty input', () => {
      const result = service['transformReportsArray']([]);
      expect(result).toEqual([]);
    });
  });

  // ─── getDefaultStatuses (private) ──────────────────────────────

  describe('getDefaultStatuses', () => {
    it('should return three default status options', () => {
      const statuses = service['getDefaultStatuses']();
      expect(statuses.length).toBe(3);
    });

    it('should contain Completed, Submitted, and Executing', () => {
      const statuses = service['getDefaultStatuses']();
      expect(statuses).toEqual([
        { code: 'C', name: 'Completed' },
        { code: 'S', name: 'Submitted' },
        { code: 'E', name: 'Executing' }
      ]);
    });
  });
});
