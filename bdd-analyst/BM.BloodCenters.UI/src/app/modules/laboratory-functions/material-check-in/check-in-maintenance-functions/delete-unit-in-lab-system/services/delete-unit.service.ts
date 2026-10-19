
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  DeleteUnitRequest,
  DeleteUnitResponse
} from '../models/delete-unit.model';

@Injectable({
  providedIn: 'root'
})
export class DeleteUnitService {
  private readonly apiService = inject(ApiService);

  /**
   * Validate unit by ID
   * GET /api/v1/laboratory/delete-unit/validate/{unitId}
   * @param request - Contains unitId to validate
   * @returns Observable with validation response
   */
  validateUnit(request: ValidateUnitRequest): Observable<ValidateUnitResponse> {
    const endpoint = `/api/v1/laboratory/delete-unit/validate/${request.unitId}`;

    return this.apiService.get<ValidateUnitResponse>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete unit from all laboratory tables
   * DELETE /api/v1/laboratory/delete-unit
   * @param request - Contains unitId and confirmed flag
   * @returns Observable with delete response
   */
  deleteUnit(request: DeleteUnitRequest): Observable<DeleteUnitResponse> {
    const endpoint = '/api/v1/laboratory/delete-unit';

    return this.apiService.delete<DeleteUnitResponse>(endpoint, { body: request }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
