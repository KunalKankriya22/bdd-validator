import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ReleaseStandingOrdersBatchRequestDto,
  ReleaseStandingOrdersBatchResponseDto,
  ApiResponseSingle,
} from '../models/release-standing-orders-batch.model';

@Injectable({
  providedIn: 'root',
})
export class ReleaseStandingOrdersBatchApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API.RELEASE_STANDING_ORDERS_BATCH.BASE;

  processBatch(request: ReleaseStandingOrdersBatchRequestDto): Observable<ReleaseStandingOrdersBatchResponseDto> {
    return this.http.post<ApiResponseSingle<ReleaseStandingOrdersBatchResponseDto>>(`${this.baseUrl}/batch`, request).pipe(
      map((response) => {
        if (response.success && response.item) {
          return response.item;
        }
        if (response.statusCode === 404 && response.item) {
          return response.item;
        }
        throw new Error(response.message || 'Batch processing failed');
      })
    );
  }
}
