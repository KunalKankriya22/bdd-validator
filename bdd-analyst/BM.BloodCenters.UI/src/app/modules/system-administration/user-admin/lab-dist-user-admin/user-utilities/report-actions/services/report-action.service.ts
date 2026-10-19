import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError, timer, exhaustMap, takeWhile, last, timeout, of } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../../core/constants/api.constants';
import { USER_ACCESS_LEVELS } from '../../../../../../../core/constants/validation.constants';
import {
  ReportAction,
  ReportActionQuery,
  ReportActionResponse,
  ReportActionDropdowns,
  ReportStatus,
  UserDetails,
  DistinctUsername,
  LogReportRequest,
  LogReportResponse
} from '../models/report-action.model';

/**
 * Service for Report Actions operations
 * Handles API integration for viewing, reviewing, printing, and deleting reports
 */
@Injectable({
  providedIn: 'root'
})
export class ReportActionService {
  private readonly apiService = inject(ApiService);
  /**
   * Get paginated list of reports with optional filtering
   * @param take Number of records to fetch
   * @param skip Number of records to skip
   * @param requestBody Request body for filtering
   * @param accessLevel Access level as query parameter
   * @returns Observable of reports data with total count
   */
  getReports(
    take: number,
    skip: number,
    requestBody: ReportActionQuery,
    accessLevel: number
  ): Observable<{ data: ReportAction[]; totalRecords: number }> {
    const endpoint = `${API.USER_UTILITIES.REPORT_ACTIONS(take, skip)}?accessLevel=${accessLevel}`;

    return this.apiService
      .post<ReportActionResponse<any>>(endpoint, requestBody)
      .pipe(
        map(response => ({
          data: this.transformReportsArray(response.Data || response.data || []),
          totalRecords: response.Total || response.total || 0
        })),
        catchError(error => {
          console.error('Error fetching reports:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get single report by key
   * @param reportName Report name
   * @param parmId Parameter ID
   * @param userName User name
   * @returns Observable of single report
   */
  getReport(
    reportName: string,
    parmId: string,
    userName: string
  ): Observable<ReportAction | null> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTION_BY_KEY(
      reportName,
      parmId,
      userName
    );

    return this.apiService.get<ReportActionResponse<any>>(endpoint).pipe(
      map(response => {
        const item = response.Item || response.item;
        return item ? this.transformReport(item) : null;
      }),
      catchError(error => {
        console.error('Error fetching report:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get report URL for viewing/downloading
   * @param parmId Parameter ID
   * @param applId Application ID
   * @param reportName Report name
   * @param userName User name
   * @returns Observable with report URL
   */
  getReportUrl(
    parmId: string,
    applId: string,
    reportName: string,
    userName: string
  ): Observable<ReportActionResponse<any>> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTION_URL;

    const requestBody = {
      parmId,
      applId,
      reportName,
      userName
    };

    return this.apiService
      .post<ReportActionResponse<any>>(endpoint, requestBody)
      .pipe(
        catchError(error => {
          console.error('Error getting report URL:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete report
   * @param reportName Report name
   * @param parmId Parameter ID
   * @param userName User name
   * @param applId Application ID
   * @returns Observable of delete response
   */
  deleteReport(
    reportName: string,
    parmId: string,
    userName: string,
    applId: string
  ): Observable<ReportActionResponse<any>> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTION_DELETE(
      reportName,
      parmId,
      userName,
      applId
    );

    return this.apiService.delete<ReportActionResponse<any>>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting report:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get dropdown options for filters
   * @returns Observable of dropdown data
   */
  getFilterDropdowns(): Observable<ReportActionDropdowns> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTIONS_DROPDOWNS;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => ({
        users: response.users || [],
        statuses: response.statuses || this.getDefaultStatuses(),
        reportNames: response.reportNames || []
      })),
      catchError(error => {
        console.warn('Error fetching dropdowns, using defaults:', error);
        return throwError(() => ({
          users: [],
          statuses: this.getDefaultStatuses(),
          reportNames: []
        }));
      })
    );
  }

  /**
   * Get distinct usernames for filter dropdown
   * @returns Observable of username strings
   */
  getDistinctUsernames(): Observable<string[]> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTIONS_DISTINCT_USERNAMES;

    return this.apiService.get<ReportActionResponse<DistinctUsername>>(endpoint).pipe(
      map(response => {
        const items: DistinctUsername[] = response.data || response.Data || [];
        return items
          .map(item => item.userName)
          .filter(name => !!name)
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      }),
      catchError(error => {
        console.error('Error fetching distinct usernames:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user details by user ID
   * @param userId User ID
   * @returns Observable of user details
   */
  getUserDetails(userId: string): Observable<UserDetails> {
    const endpoint = API.USER_UTILITIES.USER_DETAILS(userId);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const item = response.item || response.Item || response;
        const accessLevel = item.accPriv || item.AccPriv || 0;
        return {
          userId: item.userId || item.UserId || userId,
          accessLevel: accessLevel,
          userName: item.userName || item.UserName,
          staffNo: item.staffNo || item.StaffNo,
          functionalGroup: item.functionalGroup || item.FunctionalGroup,
          isSupervisor: accessLevel >= USER_ACCESS_LEVELS.SUPERVISOR_MINIMUM
        };
      }),
      catchError(error => {
        console.error('Error fetching user details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get users by chapter ID
   * @param chapterId Chapter ID
   * @returns Observable of user IDs array
   */
  getUsersByChapter(chapterId: string): Observable<string[]> {
    const endpoint = API.USER_UTILITIES.USERS_BY_CHAPTER(chapterId);

    return this.apiService.get<any[]>(endpoint).pipe(
      map(users => users.map(user => user.userId || user.UserId).filter(Boolean)),
      catchError(error => {
        console.error('Error fetching users by chapter:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Submit a log report for generation (GERLOGREP)
   */
  submitLogReport(request: LogReportRequest): Observable<LogReportResponse> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTION_SHOW_LOG;

    return this.apiService
      .post<ReportActionResponse<any>>(endpoint, request)
      .pipe(
        map(response => {
          const item = response.Item || response.item;
          if (!item) {
            throw new Error(response.message || 'Failed to submit log report');
          }
          return {
            newParmId: item.NewParmId || item.newParmId,
            sessionId: item.SessionId || item.sessionId,
            originalParmId: item.OriginalParmId || item.originalParmId,
            jobId: item.JobId || item.jobId,
            status: item.Status || item.status,
            message: item.Message || item.message
          } as LogReportResponse;
        }),
        catchError(error => {
          console.error('Error submitting log report:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Poll for log report completion using the UserUtilities endpoint
   */
  pollLogReportStatus(reportName: string, parmId: string, userName: string): Observable<ReportAction> {
    return timer(3000, 3000).pipe(
      exhaustMap(() =>
        this.getReport(reportName, parmId, userName).pipe(
          catchError(() => of(null))
        )
      ),
      map(report => report || { reportStatus: ReportStatus.Submitted } as ReportAction),
      takeWhile(report => report.reportStatus !== ReportStatus.Completed, true),
      last(),
      timeout(120000)
    );
  }

  /**
   * Cleanup log entries after viewing
   */
  cleanupLogReport(sessionId: string, parmId: string): Observable<any> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTION_LOG_CLEANUP(sessionId, parmId);

    return this.apiService.delete<any>(endpoint).pipe(
      catchError(error => {
        console.warn('Log cleanup failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Get auto-refresh interval from VALID_PARAMETERS (PRINTTIMER)
   * @returns Observable of interval in seconds (0 = disabled)
   */
  getAutoRefreshInterval(): Observable<number> {
    const endpoint = API.USER_UTILITIES.REPORT_ACTIONS_AUTO_REFRESH_INTERVAL;

    return this.apiService.get<{ intervalSeconds: number }>(endpoint).pipe(
      map(response => response.intervalSeconds || 0),
      catchError(() => of(0)) // Default: no auto-refresh
    );
  }

  /**
   * Transform array of reports from backend format to frontend model
   * @param items Backend report items
   * @returns Transformed reports array
   */
  private transformReportsArray(items: any[]): ReportAction[] {
    return items.map(item => this.transformReport(item));
  }

  /**
   * Transform single report from backend format to frontend model
   * @param item Backend report item
   * @returns Transformed report
   */
  private transformReport(item: any): ReportAction {
    // API returns SUBMIT_DATE already converted to chapter-local time
    // via UTIL.LIFETRACK_TIMEZONE_CONVERT.get_local_time() in the SQL query.
    // Parse without 'Z' suffix to avoid UTC reinterpretation.
    const submitDateStr = item.SubmitDate || item.submitDate;
    const submitDate = new Date(submitDateStr);
    const reportStatus = (item.ReportStatus || item.reportStatus) as ReportStatus;

    return {
      applId: item.ApplId || item.applId,
      reportName: item.ReportName || item.reportName,
      parmId: item.ParmId || item.parmId,
      userName: item.UserName || item.userName,
      submitDate: submitDate,
      reportStatus: reportStatus,
      repJobId: item.RepJobId || item.repJobId,
      repServer: item.RepServer || item.repServer,
      chapterId: item.ChapterId || item.chapterId,
      outputFile: item.OutputFile || item.outputFile,
      fileName: item.FileName || item.fileName,
      formsType: item.FormsType || item.formsType,
      statusMessage: item.StatusMessage || item.statusMessage,

      // UI-specific fields
      displayStatus: this.getStatusDisplay(reportStatus),
      localSubmitDate: submitDate, // Already in chapter-local time from backend
      canReview: reportStatus === ReportStatus.Completed,
      canDelete: reportStatus === ReportStatus.Completed,
      canPrint: reportStatus === ReportStatus.Completed
    };
  }

  /**
   * Get friendly status display text
   * @param status Report status code
   * @returns Display text
   */
  private getStatusDisplay(status: ReportStatus | string): string {
    const statusMap: Record<string, string> = {
      C: 'Completed',
      S: 'Submitted',
      E: 'Executing'
    };
    return statusMap[status] || 'Error';
  }

  /**
   * Get default status options
   * @returns Default statuses array
   */
  private getDefaultStatuses(): { code: string; name: string }[] {
    return [
      { code: 'C', name: 'Completed' },
      { code: 'S', name: 'Submitted' },
      { code: 'E', name: 'Executing' }
    ];
  }
}
