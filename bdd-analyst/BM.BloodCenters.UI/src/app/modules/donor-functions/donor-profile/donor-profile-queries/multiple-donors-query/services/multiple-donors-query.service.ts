import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  MultipleDonorsSearchRequest,
  MultipleDonorsQueryResponse,
  MaxRowsLimitResponse,
  DonorSearchResult,
} from '../models/multiple-donors-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class MultipleDonorsQueryService {
  private readonly apiService = inject(ApiService);

  searchDonors(
    params: MultipleDonorsSearchRequest,
    take: number,
    skip: number
  ): Observable<{ data: DonorSearchResult[]; totalRecords: number; message: string }> {
    const endpoint = API.DONOR.MULTIPLE_DONORS_QUERY_SEARCH(take, skip);

    return this.apiService.post<MultipleDonorsQueryResponse>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0,
        message: response.message || ''
      })),
      catchError(error => {
        const errorMsg = error?.error?.errorResponse?.error
          || error?.error?.message
          || error?.error?.error
          || '';
        return throwError(() => ({ ...error, displayMessage: errorMsg }));
      })
    );
  }

  getMaxRowsLimit(): Observable<number> {
    const endpoint = API.DONOR.MULTIPLE_DONORS_QUERY_MAX_ROWS;

    return this.apiService.get<MaxRowsLimitResponse>(endpoint).pipe(
      map(response => response.item || 200),
      catchError(() => of(200))
    );
  }
}
