import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ReportNameOption,
  ReportSubmissionDetail,
  SubmitReportPayload,
  ScheduleReportPayload,
  ReportInfoDto,
  ReportParmDefinitionDto,
  ReportParmIdDto,
  ReportParameterValueDto,
  SavedReportParametersDto,
  MasterCodeDto,
  SubmitReportRequestDto,
  SubmitReportResponseDto,
  ReportJobStatusDto,
  ReportSubmissionParameter,
  ParameterOption,
  ApiResponse,
  ParameterLovItemDto,
  GenerateParmIdResponse,
  ValidateParameterRequest,
  ValidateParameterResponse,
  ReportTypeDto,
  PaginatedLovResponse,
  DropdownPage,
} from '../models/report-submission.model';

@Injectable({
  providedIn: 'root',
})
export class ReportSubmissionService {
  private readonly http = inject(HttpClient);

  /**
   * Get distinct report types from RPT_REPORT_NAMES
   */
  getReportTypes(): Observable<ReportTypeDto[]> {
    return this.http.get<ApiResponse<ReportTypeDto>>(API.REPORTS.REPORT_TYPES).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load report types:', error);
        return of([]);
      })
    );
  }

  /**
   * Get list of available report names, optionally filtered by report type
   */
  getReportNames(reportType?: string): Observable<ReportNameOption[]> {
    let params = new HttpParams();
    if (reportType) {
      params = params.set('reportType', reportType);
    }
    return this.http.get<ReportNameOption[]>(API.REPORTS.REPORT_NAMES, { params });
  }

  /**
   * Generate a new PARM_ID using backend endpoint
   * Format: {USER_ID}_{MMddyy}_{SEQUENCE}
   */
  generateParmId(): Observable<string> {
    return this.http.post<ApiResponse<GenerateParmIdResponse>>(
      API.REPORTS.GENERATE_PARM_ID,
      {}
    ).pipe(
      map(response => response.item?.parmId || '')
    );
  }

  /**
   * Get report details including info and parameter definitions
   * Parameter definitions now include pre-loaded LOV items
   */
  getReportDetails(reportName: string): Observable<ReportSubmissionDetail> {
    return forkJoin({
      reportInfo: this.http.get<ApiResponse<ReportInfoDto>>(API.REPORTS.REPORT_INFO(reportName)),
      parmDefinitions: this.http.get<ApiResponse<ReportParmDefinitionDto>>(API.REPORTS.PARM_DEFINITIONS(reportName)),
    }).pipe(
      map(({ reportInfo, parmDefinitions }) => {
        const paramDefs = parmDefinitions.data || [];
        const parameters = paramDefs.map((def) => this.mapParameterDefinition(def));
        const info = reportInfo.item;

        return {
          reportName: info?.reportName || reportName,
          reportDescription: info?.title || '',
          title: info?.title || '',
          subTitle: info?.subtitle || '',
          printId: info?.printId,
          formsType: info?.formsType,
          parameters,
        } as ReportSubmissionDetail;
      })
    );
  }

  /**
   * Get LOV items for a parameter dynamically
   * @param parmCode Parameter code
   * @param searchTerm Optional search term (required if lovLimit = 'Y', min 3 chars)
   */
  getParameterLovItems(parmCode: string, searchTerm?: string): Observable<ParameterOption[]> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<ApiResponse<ParameterLovItemDto>>(
      API.REPORTS.PARM_LOV(parmCode),
      { params }
    ).pipe(
      map(response => {
        const items = response.data || [];
        return items.map((item: ParameterLovItemDto) => ({
          code: item.code,
          description: item.description || item.code // Use code as description if description is empty
        }));
      }),
      catchError(error => {
        console.error(`Failed to load LOV items for ${parmCode}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Get recent parameter sets for a report
   */
  getRecentParameterSets(reportName: string): Observable<ReportParmIdDto[]> {
    return this.http.get<ApiResponse<ReportParmIdDto>>(API.REPORTS.RECENT_PARM_IDS(reportName)).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get saved parameter values for a specific parameter set
   */
  getParameterValues(reportName: string, parmId: string): Observable<SavedReportParametersDto | null> {
    return this.http.get<ApiResponse<SavedReportParametersDto>>(API.REPORTS.PARM_VALUES(reportName, parmId)).pipe(
      map(response => response.item || null)
    );
  }

  /**
   * Get available printers
   */
  getPrinters(): Observable<MasterCodeDto[]> {
    return this.http.get<ApiResponse<MasterCodeDto>>(API.REPORTS.PRINTERS).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get available form types
   */
  getFormTypes(): Observable<MasterCodeDto[]> {
    return this.http.get<ApiResponse<MasterCodeDto>>(API.REPORTS.FORM_TYPES).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Submit report for processing
   */
  submitReport(payload: SubmitReportPayload): Observable<SubmitReportResponseDto> {
    const request: SubmitReportRequestDto = {
      reportName: payload.reportName,
      parmId: payload.parmId || null,
      printId: payload.printId || null,
      formsType: payload.formsType || null,
      submitFlag: 'Y',
      headerAndTrailerFlag: payload.printHeaderTrailer ? 'Y' : 'N',
      autoPrintFlag: payload.autoPrint ? 'Y' : 'N',
      deleteAfterPrintFlag: payload.deleteAfterPrint ? 'Y' : 'N',
      noOfCopies: payload.noOfCopies || 1,
      startTime: null,
      parameters: payload.parameters || null,
    };

    return this.http.post<ApiResponse<SubmitReportResponseDto>>(API.REPORTS.SUBMIT, request).pipe(
      map(response => response.item || { jobId: '', parmId: '', reportName: '', status: '', message: '' })
    );
  }

  /**
   * Schedule report for future submission
   */
  scheduleReport(payload: ScheduleReportPayload): Observable<SubmitReportResponseDto> {
    const request: SubmitReportRequestDto = {
      reportName: payload.reportName,
      parmId: payload.parmId || null,
      printId: payload.printId || null,
      formsType: payload.formsType || null,
      submitFlag: 'Y',
      headerAndTrailerFlag: payload.printHeaderTrailer ? 'Y' : 'N',
      autoPrintFlag: payload.autoPrint ? 'Y' : 'N',
      deleteAfterPrintFlag: payload.deleteAfterPrint ? 'Y' : 'N',
      noOfCopies: payload.noOfCopies || 1,
      startTime: payload.startTime,
      parameters: payload.parameters || null,
    };

    return this.http.post<ApiResponse<SubmitReportResponseDto>>(API.REPORTS.SUBMIT, request).pipe(
      map(response => response.item || { jobId: '', parmId: '', reportName: '', status: '', message: '' })
    );
  }

  /**
   * Delete a saved parameter set
   */
  deleteParameterSet(reportName: string, parmId: string): Observable<any> {
    return this.http.delete(API.REPORTS.DELETE_PARM(reportName, parmId));
  }

  /**
   * Get report job status
   */
  getReportStatus(reportName: string, parmId: string): Observable<ReportJobStatusDto> {
    return this.http.get<ApiResponse<ReportJobStatusDto>>(API.REPORTS.REPORT_STATUS(reportName, parmId)).pipe(
      map(response => response.item || { parmId: '', reportName: null, statusCode: null, statusMessage: null, queued: null })
    );
  }

  /**
   * Validate a parameter value (called on field blur)
   */
  validateParameter(parmCode: string, value: string, allowWildcard: boolean = false): Observable<ValidateParameterResponse> {
    const request: ValidateParameterRequest = { value, allowWildcard };
    return this.http.post<ApiResponse<ValidateParameterResponse>>(
      API.REPORTS.VALIDATE_PARAMETER(parmCode),
      request
    ).pipe(
      map(response => response.item || { isValid: false, message: 'Validation failed' })
    );
  }

  getParameterLovPaginated(
    parmCode: string,
    search: string,
    skip: number,
    take: number,
    includeSelected?: string[]
  ): Observable<DropdownPage> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());
    if (search) {
      params = params.set('searchTerm', search);
    }
    if (includeSelected?.length) {
      params = params.set('includeSelected', includeSelected.join(','));
    }

    return this.http.get<PaginatedLovResponse>(
      API.REPORTS.PARM_LOV(parmCode),
      { params }
    ).pipe(
      map(res => ({
        items: (res.items || []).map(i => ({ code: i.code, description: i.description || i.code })), // Use code as description if empty
        totalCount: res.totalCount,
        hasMore: res.hasMore,
        isPaginated: res.metadata?.isPaginated ?? true,
      })),
      catchError(error => {
        console.error(`Failed to load paginated LOV items for ${parmCode}:`, error);
        return of({ items: [], totalCount: 0, hasMore: false, isPaginated: false });
      })
    );
  }

  private mapParameterDefinition(def: ReportParmDefinitionDto): ReportSubmissionParameter {
    const codeType = this.normalizeCodeType(def.codeType);
    // Multi-select when listEntryFlag is 'Y' OR defaultValue is 'all' (case-insensitive)
    const isMultiSelect = def.listEntryFlag === 'Y' || (def.defaultValue || '').toLowerCase() === 'all';

    // Extract pre-loaded LOV items from definition
    const options: ParameterOption[] = (def.lovItems || []).map(item => ({
      code: item.code,
      description: item.description || item.code // Use code as description if description is empty
    }));

    return {
      parmNo: def.parmNo,
      parmCode: def.parmCode || '',
      parmPrompt: def.parmPrompt || '',
      codeType,
      isMultiSelect,
      listEntryFlag: def.listEntryFlag || 'N',
      options,
      defaultValue: def.defaultValue || '',
      value: null,
      refTable: def.refTable,
      refColumn: def.refColumn,
      refSql: def.refSql,
      totalLovCount: def.totalLovCount,
    };
  }

  /**
   * Normalize code type from API to UI model
   */
  private normalizeCodeType(codeType?: string | null): 'DATE' | 'TEXT' | 'NUMBER' | 'LIST' | 'CHAR' | 'DATETM' | 'ODATE' {
    const type = (codeType || '').toUpperCase();

    switch (type) {
      case 'DATE':
      case 'ODATE':
      case 'DATETM':
        return type as any;
      case 'NUMBER':
        return 'NUMBER';
      case 'LIST':
        return 'LIST';
      case 'CHAR':
        return 'CHAR';
      case 'TEXT':
      default:
        return 'TEXT';
    }
  }
}
