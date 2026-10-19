import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { ReportParameter } from '../models/report-parameter.model';
import { ReportParameterFilterMeta } from '../models/report-parameter-filter-meta.model';
import { CodeType } from '../models/code-type.model';

@Injectable({
  providedIn: 'root'
})

/**
 * Service for Report Parameters based on RMREPCD specifications.
 * Handles all API calls to /system-admin/report-parameters endpoints.
 */
export class ReportParameterService {

  private readonly base = 'api/v1/system-admin/report-parameters';

  constructor(private api: ApiService) { }

  /** GET ALL */
  getReportParameters(): Observable<ReportParameter[]> {
    return this.api.get<ReportParameter[]>(this.base);
  }

  /** GET PARAMETER TYPES (for filtering) */
  getParameterTypes(): Observable<ReportParameterFilterMeta> {
    return this.api.get<ReportParameterFilterMeta>(
      `${this.base}/parameter-types`
    );
  }

  /**
   * GET CODE TYPES - RMREPCD CODE_TYPE LOV
   * Returns the 5 valid code types: CHAR, DATE, DATETM, NUMBER, ODATE
   * GET /system-admin/report-parameters/code-types
   */
  getCodeTypes(): Observable<CodeType[]> {
    return this.api.get<CodeType[]>(`${this.base}/code-types`);
  }

  /** SEARCH / FILTER PARAMETERS */
  search(params: {
    keyword?: string;
    parameterType?: string;
    isUpper?: boolean | null;
    isList?: boolean | null;
  }): Observable<ReportParameter[]> {

    const cleanParams: any = {};

    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    });

    return this.api.get<ReportParameter[]>(
      `${this.base}/search`,
      { params: cleanParams }
    );
  }


  /**
   * CREATE NEW PARAMETER
   * POST /system-admin/report-parameters
   * Includes RMREPCD validation on backend
   */
  create(payload: ReportParameter): Observable<ReportParameter> {
    return this.api.post<ReportParameter>(this.base, payload);
  }

  /**
   * UPDATE EXISTING PARAMETER
   * PUT /system-admin/report-parameters/{parameterCode}
   * Includes RMREPCD validation on backend
   */
  update(
    parameterCode: string,
    payload: ReportParameter
  ): Observable<ReportParameter> {
    return this.api.put<ReportParameter>(
      `${this.base}/${parameterCode}`,
      payload
    );
  }

  /**
   * DELETE PARAMETER - RMREPCD DELETE VALIDATION
   * DELETE /system-admin/report-parameters/{parameterCode}
   * Validates that parameter is not referenced by reports before deletion
   */
  delete(parameterCode: string, applicationId: string = 'DON'): Observable<void> {
    return this.api.delete<void>(
      `${this.base}/${parameterCode}?applicationId=${applicationId}`
    );
  }

}
