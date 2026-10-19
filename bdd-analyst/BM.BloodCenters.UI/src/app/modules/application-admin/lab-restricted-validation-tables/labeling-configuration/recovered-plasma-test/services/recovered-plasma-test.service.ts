import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  RecoveredPlasmaTestModel,
  RecoveredPlasmaTestListBody,
  RecoveredPlasmaTestCreateDto,
  RecoveredPlasmaTestUpdateDto,
  LookupItem
} from '../models/recovered-plasma-test.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class RecoveredPlasmaTestService {
  private readonly apiService = inject(ApiService);

  /**
   * List / filter plasma tests config records
   * POST /lbl-plasma-tests-config/list
   * Returns all matching records (no server-side pagination)
   */
  getPlasmaTests(body: RecoveredPlasmaTestListBody): Observable<{ data: RecoveredPlasmaTestModel[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_LIST;

    return this.apiService.post<any>(endpoint, body).pipe(
      map(response => {
        if (!response) {
          return { data: [], total: 0 };
        }
        const data: RecoveredPlasmaTestModel[] = response.data || [];
        const total: number = response.total ?? data.length;
        return { data, total };
      }),
      catchError(error => {
        console.error('Error fetching plasma tests config data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get test ID lookup options
   * Reuses GET /lbl-barcode-config/lookups/test-ids
   * Response is a plain array: [{ code, description }]
   */
  getTestIdLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LOOKUP_TEST_IDS;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching test ID lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Plasma Tests Config record
   * POST /lbl-plasma-tests-config
   */
  createRecord(data: RecoveredPlasmaTestCreateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_ADD;

    return this.apiService.post<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating plasma tests config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing Plasma Tests Config record
   * PUT /lbl-plasma-tests-config/{testId}
   * Only sends editable fields (effDate, termDate)
   */
  updateRecord(testId: string, data: RecoveredPlasmaTestUpdateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_UPDATE(testId);

    return this.apiService.put<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating plasma tests config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a Plasma Tests Config record
   * DELETE /lbl-plasma-tests-config/{testId}
   */
  deleteRecord(testId: string): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_DELETE(testId);

    return this.apiService.delete<any>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting plasma tests config:', error);
        return throwError(() => error);
      })
    );
  }
}
