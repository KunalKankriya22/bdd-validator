import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  InstrumentErrorLogRecord,
  InstrumentErrorLogSearchRequest,
  InstrumentErrorLogResponse,
} from '../models/instrument-error-log-query.model';

@Injectable({
  providedIn: 'root',
})
export class InstrumentErrorLogQueryService {
  private readonly apiService = inject(ApiService);

  queryErrorLogs(
    take: number,
    skip: number,
    filters: InstrumentErrorLogSearchRequest
  ): Observable<{ data: InstrumentErrorLogRecord[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.INSTRUMENT_ERROR_LOG_QUERY(take, skip);

    return this.apiService.post<InstrumentErrorLogResponse>(endpoint, filters).pipe(
      map((response) => ({
        data: response?.data || [],
        total: response?.total || 0,
      })),
      catchError((error) => throwError(() => error))
    );
  }
}
