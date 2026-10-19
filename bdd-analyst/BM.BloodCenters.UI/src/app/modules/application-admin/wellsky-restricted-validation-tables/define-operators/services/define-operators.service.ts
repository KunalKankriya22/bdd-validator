import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ValidOperator,
  ValidOperatorFilter,
  CreateValidOperator,
  UpdateValidOperator
} from '../models/define-operators.model';
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
export class DefineOperatorsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get valid operators with pagination and filters
   * POST /api/v1/valid-operators/{take}/{skip}
   */
  getValidOperators(
    take: number,
    skip: number,
    params: ValidOperatorFilter
  ): Observable<{ data: ValidOperator[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_OPERATORS(take, skip);

    return this.apiService.post<ReturnResult<ValidOperator>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching valid operators data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new valid operator
   * POST /api/v1/valid-operators
   */
  addValidOperator(data: CreateValidOperator): Observable<ReturnResult<ValidOperator>> {
    const endpoint = API.APPLICATION_ADMIN.VALID_OPERATORS_ADD;

    return this.apiService.post<ReturnResult<ValidOperator>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding valid operator:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing valid operator
   * PUT /api/v1/valid-operators/{operatorCode}
   */
  updateValidOperator(operatorCode: string, data: UpdateValidOperator): Observable<ReturnResult<ValidOperator>> {
    const endpoint = API.APPLICATION_ADMIN.VALID_OPERATORS_UPDATE(operatorCode);

    return this.apiService.put<ReturnResult<ValidOperator>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating valid operator:', error);
        return throwError(() => error);
      })
    );
  }
}
