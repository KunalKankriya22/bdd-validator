import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  CheckInBatchDataDto,
  CheckInBatchDataQueryRequest,
  ProductTypeLov,
  CheckinUserLov,
} from '../models/check-in-batch-data-query.model';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class CheckInBatchDataQueryApiService {
  private readonly apiService = inject(ApiService);

  getCheckInBatchData(
    take: number,
    skip: number,
    body: CheckInBatchDataQueryRequest = {}
  ): Observable<{ data: CheckInBatchDataDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<CheckInBatchDataDto>>(
        API.CHECK_IN_BATCH_DATA.LIST(take, skip),
        body
      )
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          total: res.total ?? 0,
        })),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  getProductTypes(): Observable<ProductTypeLov[]> {
    return this.apiService
      .get<ReturnResult<ProductTypeLov>>(API.CHECK_IN_BATCH_DATA.PRODUCT_TYPES)
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  getCheckinUsers(): Observable<CheckinUserLov[]> {
    return this.apiService
      .get<ReturnResult<CheckinUserLov>>(API.CHECK_IN_BATCH_DATA.CHECKIN_USERS)
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }
}
