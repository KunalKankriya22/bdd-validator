import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import moment from 'moment';

import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  CheckInExceptionQueryResponse,
  CheckInExceptionResult,
  CheckInExceptionQueryRequest
} from '../models/check-in-exception-query.model';

@Injectable({
  providedIn: 'root'
})
export class CheckInExceptionQueryService {
  private readonly apiService = inject(ApiService);

  queryCheckInExceptions(request: CheckInExceptionQueryRequest): Observable<CheckInExceptionResult> {
    const params = new URLSearchParams({
      fromDate: request.fromDate,
      toDate: request.toDate
    });

    const url = `${API.LAB_MATERIAL_CHECK_IN.CHECK_IN_EXCEPTION_QUERY}?${params.toString()}`;

    return this.apiService.get<CheckInExceptionQueryResponse>(url).pipe(
      map(response => {
        if (!response.success) {
          throw { error: response };
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  formatDateForApi(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('YYYY-MM-DD');
  }
}
