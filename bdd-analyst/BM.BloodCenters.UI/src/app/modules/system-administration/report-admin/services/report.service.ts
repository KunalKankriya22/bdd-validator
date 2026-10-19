import { inject, Injectable } from '@angular/core';
import { Report, ReportParameter } from '../models/report.model';
import { API } from 'src/app/core/constants/api.constants';
import { ApiService } from '@shared/services/api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiService = inject(ApiService);
  constructor() { }

  /**
   * Save a report configuration
   * @param report The report to save
   * @returns A promise that resolves when the save is complete
   */
  // public saveReport(report: Report): Promise<void> {
  //   // In a real application, this would make an API call
  //   console.log('Saving report:', report);
  //   return Promise.resolve();
  // }

  /**
   * Get available parameters for reports
   * @returns A list of available parameters
   */
  public getAvailableParameters(): Observable<ReportParameter[]> {
    return this.apiService.get<any[]>(API.SYSTEM_ADMIN.REPORT_PARAMETERS).pipe(
      map((data: any[]) =>
        data.map((param: any) => ({
          ...param,
          parameterType: this.normalizeParameterType(param.parameterType)
        }))
      )
    );
  }

  /**
   * Normalize parameter type to standard values
   * @param type The parameter type from the API
   * @returns Normalized type
   */
  private normalizeParameterType(type: string): 'CHAR' | 'NUMBER' | 'DATE' | 'DATETM' | 'ODATE' | 'LIST' {
    if (!type) return 'CHAR';
    const normalized = type.toUpperCase().trim();

    // Map variations to standard types
    if (normalized === 'NUM' || normalized === 'NUMERIC') return 'NUMBER';
    if (normalized === 'CHARACTER' || normalized === 'STRING') return 'CHAR';
    if (normalized === 'DATETIME') return 'DATETM';

    // Return as-is if it matches a standard type
    if (['CHAR', 'NUMBER', 'DATE', 'DATETM', 'ODATE', 'LIST'].includes(normalized)) {
      return normalized as 'CHAR' | 'NUMBER' | 'DATE' | 'DATETM' | 'ODATE' | 'LIST';
    }

    return 'CHAR'; // Default fallback
  }

public getReportNames(): Observable<Report[]> {
  return this.apiService
    .get<any[]>(API.SYSTEM_ADMIN.REPORT_NAMES)
    .pipe(
      map((data: any[]) =>
        data.map((r: any) => ({
          id: r.reportName,
          title: r.title ?? '',
          subtitle: r.subtitle ?? '',
          reportType: r.reportType ?? '',
          formType: r.formsType ?? '',
          batchQueue: r.batchQueue ?? '',
          parameters: []
        }))
      )
    );
}

  /**
   * Get report details by ID
   * @param reportId The report ID
   * @returns The report details
   */
  public getReportDetails(reportId: string): Observable<any> {
    return this.apiService.get<any>(API.SYSTEM_ADMIN.REPORT_DETAILS(reportId));
  }

  /**
   * Get report types (fixed values per FMB POST-CHANGE trigger validation)
   */
  public getReportTypes(): string[] {
    return ['SQL', 'RPT', 'PC', 'SRW'];
  }

  /**
   * Get form types from RPT_MASTER_CODES (code_type = 'FORM')
   */
  public getFormTypes(): Observable<string[]> {
    return this.apiService.get<any>(API.REPORTS.FORM_TYPES).pipe(
      map((result: any) => {
        const data = result?.data || result || [];
        return Array.isArray(data) ? data.map((item: any) => item.code) : [];
      }),
      catchError(() => of([]))
    );
  }

  public getParameterFilters(): Observable<{
  parameterTypes: string[];
  isListValues: boolean[];
  isUpperValues: boolean[];
}> {
  return this.apiService.get<any>(API.SYSTEM_ADMIN.REPORT_PARAMETER_FILTERS);
}

  /**
   * Save report parameter definitions
   * @param applicationId Application ID
   * @param reportName Report name
   * @param parameters Array of parameters to save
   * @returns Observable of the save response
   */
  public saveReportParameterDefinitions(
  applicationId: string,
  reportName: string,
  parameters: ReportParameter[]
): Observable<any> {

  const payload = parameters.map((param, index) => ({
    applicationID: applicationId,
    reportName: reportName,
    parameterNumber: index + 1,              // ← reflects drag/drop order
    parameterCode: param.parameterCode,
    listEntryFlag: param.isList ? 'Y' : 'N'
  }));

  return this.apiService.post<any>(
    API.SYSTEM_ADMIN.SAVE_REPORT_PARAMETER_DEFINITION,
    payload
  );
}

  public getAssignedParameters(reportName: string): Observable<any[]> {
  return this.apiService.get<any[]>(
    API.SYSTEM_ADMIN.GET_REPORT_PARAMETER_DEFINITION(reportName)
  ).pipe(
    catchError(error => {
      // 404 means no parameters assigned yet - return empty array
      if (error?.status === 404) {
        return of([]);
      }
      // Re-throw other errors to be handled by global error handler
      throw error;
    })
  );
}

  /**
   * Update report master details (Title, Subtitle, Report Type, Form Type, Batch Queue)
   * @param report The report to update
   * @returns Observable of the update response
   */
  public updateReportMaster(report: Report): Observable<any> {
    const payload = {
      title: report.title,
      subtitle: report.subtitle,
      reportType: report.reportType,
      formsType: report.formType,
      batchQueue: report.batchQueue
    };

    return this.apiService.put<any>(
      API.SYSTEM_ADMIN.UPDATE_REPORT(report.id),
      payload
    );
  }
}