import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  InterdictionQueryModel,
  InterdictionQueryParamsDto,
  AddInterdictionsAndDto,
  AddInterdictionsOrDto,
  UserInactiveClass,
  DonorInterdictionCode,
  OtherHold
} from '../models/interdiction-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InterdictionQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Interdiction Query list with filtering
   * POST /api/v1/donor-interdiction-query
   * @param params - Filter and search parameters
   * @returns Observable with table data
   */
  getInterdictions(
    params: InterdictionQueryParamsDto
  ): Observable<InterdictionQueryModel[]> {
    const endpoint = API.DONOR_FUNCTIONS.INTERDICTION_QUERY.GET;

    return this.apiService.post<ReturnResult<InterdictionQueryModel>>(endpoint, params).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching interdiction query data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add interdictions with AND logic
   * POST /api/v1/donor-interdiction-query/add-and
   * @param payload - Interdiction data to add
   * @returns Observable with API response
   */
  addInterdictionsAnd(payload: AddInterdictionsAndDto): Observable<any> {
    const endpoint = API.DONOR_FUNCTIONS.INTERDICTION_QUERY.ADD_AND;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding interdictions (AND):', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add interdictions with OR logic
   * POST /api/v1/donor-interdiction-query/add-or
   * @param payload - Interdiction data to add
   * @returns Observable with API response
   */
  addInterdictionsOr(payload: AddInterdictionsOrDto): Observable<any> {
    const endpoint = API.DONOR_FUNCTIONS.INTERDICTION_QUERY.ADD_OR;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding interdictions (OR):', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get list of User Inactive Classes for dropdown
   * GET /api/v1/donor-interdiction-query/user-inactive-classes
   * @returns Observable with user inactive class list
   */
  getUserInactiveClasses(): Observable<string[]> {
    const endpoint = API.DONOR_FUNCTIONS.INTERDICTION_QUERY.USER_INACTIVE_CLASSES;

    return this.apiService.get<ReturnResult<UserInactiveClass>>(endpoint).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((item: UserInactiveClass) => item.userInactiveClass);
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching user inactive classes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get list of Donor Interdiction Codes for dropdown
   * GET /api/v1/donor-interdiction-query/interdiction-codes
   * @returns Observable with donor interdiction code list
   */
  getDonorInterdictionCodes(): Observable<DonorInterdictionCode[]> {
    const endpoint = API.DONOR_FUNCTIONS.INTERDICTION_QUERY.INTERDICTION_CODES;

    return this.apiService.get<ReturnResult<DonorInterdictionCode>>(endpoint).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching donor interdiction codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get other holds for a specific transaction
   * POST /api/v1/donor-interdictions/other-holds
   * @param transactionId - Transaction ID to query (required)
   * @param showTerminated - Whether to include terminated holds (defaults to false)
   * @returns Observable with other holds data
   */
  getOtherHolds(transactionId: string, showTerminated: boolean = false): Observable<OtherHold[]> {
    const endpoint = API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.OTHER_HOLDS;

    const payload = {
      transactionId: transactionId,
      showTerminated: showTerminated
    };

    return this.apiService.post<ReturnResult<OtherHold>>(endpoint, payload).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching other holds:', error);
        return throwError(() => error);
      })
    );
  }
}
