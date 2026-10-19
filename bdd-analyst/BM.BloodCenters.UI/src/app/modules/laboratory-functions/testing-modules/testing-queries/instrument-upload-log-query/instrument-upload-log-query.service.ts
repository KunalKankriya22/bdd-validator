import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  InstrumentUploadLogQueryParams,
  InstrumentUploadLogResponse,
  FilterOptionsResponse
} from './instrument-upload-log-query.model';

/**
 * Service for Instrument Upload Log Query API calls
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentUploadLogQueryService {
  private http = inject(HttpClient);

  /**
   * Query instrument upload logs with filters and pagination
   */
  getInstrumentUploadLogs(params: InstrumentUploadLogQueryParams): Observable<InstrumentUploadLogResponse> {
    let httpParams = new HttpParams()
      .set('readDate', params.readDate);

    if (params.tbId) {
      httpParams = httpParams.set('tbId', params.tbId);
    }
    if (params.testId) {
      httpParams = httpParams.set('testId', params.testId);
    }
    if (params.machineId) {
      httpParams = httpParams.set('machineId', params.machineId);
    }
    if (params.sortColumn) {
      httpParams = httpParams.set('sortColumn', params.sortColumn);
    }
    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    if (params.take !== undefined) {
      httpParams = httpParams.set('take', params.take.toString());
    }
    if (params.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }

    return this.http.get<InstrumentUploadLogResponse>(
      API.INSTRUMENT_UPLOAD_LOG.QUERY,
      { params: httpParams }
    );
  }

  /**
   * Get filter options for dropdowns
   */
  getFilterOptions(
    readDate?: string | null,
    tbId?: string | null,
    testId?: string | null
  ): Observable<FilterOptionsResponse> {
    let httpParams = new HttpParams();

    if (readDate) {
      httpParams = httpParams.set('readDate', readDate);
    }
    if (tbId) {
      httpParams = httpParams.set('tbId', tbId);
    }
    if (testId) {
      httpParams = httpParams.set('testId', testId);
    }

    return this.http.get<FilterOptionsResponse>(
      API.INSTRUMENT_UPLOAD_LOG.FILTER_OPTIONS,
      { params: httpParams }
    );
  }
}
