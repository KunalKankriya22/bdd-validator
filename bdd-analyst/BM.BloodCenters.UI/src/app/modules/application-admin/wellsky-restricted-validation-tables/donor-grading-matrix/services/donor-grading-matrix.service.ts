import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DonorGradingMatrix,
  DonorGradingMatrixFilter,
  CreateDonorGradingMatrix,
  UpdateDonorGradingMatrix
} from '../models/donor-grading-matrix.model';
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
export class DonorGradingMatrixService {
  private readonly apiService = inject(ApiService);

  /**
   * Get donor grading matrix records with pagination and filters
   * POST /api/v1/donor-grading-matrix/{take}/{skip}
   */
  getDonorGradingMatrix(
    take: number,
    skip: number,
    params: DonorGradingMatrixFilter
  ): Observable<{ data: DonorGradingMatrix[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_GRADING_MATRIX(take, skip);

    return this.apiService.post<ReturnResult<DonorGradingMatrix>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching donor grading matrix data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new donor grading matrix record
   * POST /api/v1/donor-grading-matrix
   */
  addDonorGradingMatrix(data: CreateDonorGradingMatrix): Observable<ReturnResult<DonorGradingMatrix>> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_GRADING_MATRIX_ADD;

    return this.apiService.post<ReturnResult<DonorGradingMatrix>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding donor grading matrix record:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing donor grading matrix record
   * PUT /api/v1/donor-grading-matrix/{dgmId}
   */
  updateDonorGradingMatrix(dgmId: number, data: UpdateDonorGradingMatrix): Observable<ReturnResult<DonorGradingMatrix>> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_GRADING_MATRIX_UPDATE(dgmId);

    return this.apiService.put<ReturnResult<DonorGradingMatrix>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating donor grading matrix record:', error);
        return throwError(() => error);
      })
    );
  }
}
