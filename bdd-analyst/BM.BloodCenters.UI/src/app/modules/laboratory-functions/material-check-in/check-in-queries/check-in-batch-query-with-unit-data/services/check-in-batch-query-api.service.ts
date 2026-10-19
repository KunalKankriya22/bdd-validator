import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  BatchIdLovItem,
  BatchUnitDto,
  BatchUnitsResponse,
  ReturnResult,
} from '../models/check-in-batch-query.model';

@Injectable({ providedIn: 'root' })
export class CheckInBatchQueryApiService {
  private readonly apiService = inject(ApiService);

  getBatchIdsLov(): Observable<BatchIdLovItem[]> {
    return this.apiService
      .get<ReturnResult<BatchIdLovItem>>(API.APPLICATION_ADMIN.QC_BATCH_UNITS_BATCH_IDS_LOV)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('getBatchIdsLov failed:', error);
          return of([]);
        })
      );
  }

  getUnitsByBatchId(batchId: string): Observable<BatchUnitsResponse> {
    return this.apiService
      .get<ReturnResult<BatchUnitDto>>(API.APPLICATION_ADMIN.QC_BATCH_UNITS_BY_BATCH(batchId))
      .pipe(
        map((response) => ({
          units: response.data || [],
          unitCount: response.total || 0,
        })),
        catchError((error) => throwError(() => error))
      );
  }
}
