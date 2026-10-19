import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';

import {
  StrongReactivityModel,
  StrongReactivityResponse,
  StrongReactivityParamsDto,
  CreateStrongReactivityDto,
  UpdateStrongReactivityDto,
  EpitopeDropdownItem
} from '../models/strong-reactivity.model';

@Injectable()
export class StrongReactivityService {
  private readonly apiService = inject(ApiService);
  private readonly baseUrl = 'api/v1/strong-reactivity';  // No leading slash!

  /**
   * Get list of strong reactivity records with server-side pagination
   * @param take Number of records to fetch (max 100)
   * @param skip Number of records to skip
   * @param filters Filter criteria
   */
  getStrongReactivities(
    take: number = 25,
    skip: number = 0,
    filters?: StrongReactivityParamsDto
  ): Observable<{ data: StrongReactivityModel[]; total: number }> {
    return this.apiService.post<any>(
      `${this.baseUrl}/${take}/${skip}`,
      filters || {}
    ).pipe(
      map(response => {
        // Handle different response structures
        let records: any[] = [];

        if (response.data) {
          // Check if data is wrapped in an array
          if (Array.isArray(response.data)) {
            // If first element is an array, unwrap it
            if (response.data.length > 0 && Array.isArray(response.data[0])) {
              records = response.data[0];
            } else {
              // Direct array
              records = response.data;
            }
          } else {
            records = [response.data];
          }
        }

        return {
          data: records,
          total: response.total || response.totalRecords || records.length || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get list of valid epitopes from VALID_HLA_LOCUS for dropdown selection
   */
  getEpitopesDropdown(): Observable<EpitopeDropdownItem[]> {
    return this.apiService.get<any>(`${this.baseUrl}/epitopes-dropdown`).pipe(
      map(response => {
        let epitopes: any[] = [];

        if (response.data) {
          if (Array.isArray(response.data)) {
            // If first element is an array, unwrap it
            if (response.data.length > 0 && Array.isArray(response.data[0])) {
              epitopes = response.data[0];
            } else {
              epitopes = response.data;
            }
          } else {
            epitopes = [response.data];
          }
        }

        return epitopes;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Get a single strong reactivity association by composite key
   * @param epitopeId1 First epitope ID
   * @param epitopeId2 Second epitope ID
   */
  getByIds(epitopeId1: string, epitopeId2: string): Observable<StrongReactivityModel> {
    return this.apiService.get<any>(`${this.baseUrl}/${epitopeId1}/${epitopeId2}`).pipe(
      map(response => response.data || null),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new strong reactivity association
   * @param data Strong reactivity data
   */
  create(data: CreateStrongReactivityDto): Observable<any> {
    return this.apiService.post<any>(this.baseUrl, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing strong reactivity association
   * @param epitopeId1 First epitope ID
   * @param epitopeId2 Second epitope ID
   * @param data Update data
   */
  update(epitopeId1: string, epitopeId2: string, data: UpdateStrongReactivityDto): Observable<any> {
    return this.apiService.put<any>(`${this.baseUrl}/${epitopeId1}/${epitopeId2}`, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Soft delete a strong reactivity association by setting TERM_DATE
   * @param epitopeId1 First epitope ID
   * @param epitopeId2 Second epitope ID
   */
  delete(epitopeId1: string, epitopeId2: string): Observable<any> {
    return this.apiService.delete<any>(`${this.baseUrl}/${epitopeId1}/${epitopeId2}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Batch update - used for saving multiple records from edit mode
   * Processes creates and updates individually
   * @param records Array of records to update/create
   */
  batchUpdate(records: any[]): Observable<any> {
    const operations = records.map(record => {
      // Get values from FormGroup if available, otherwise use row model
      const epitopeId1 = record._formGroup?.get('epitopeId1')?.value || record.epitopeId1;
      const epitopeId2 = record._formGroup?.get('epitopeId2')?.value || record.epitopeId2;
      const bound = record._formGroup?.get('bound')?.value || record.bound;
      const effDate = record._formGroup?.get('effDate')?.value || record.effectiveDate;
      const termDate = record._formGroup?.get('termDate')?.value || record.terminationDate;

      // Format dates for API
      const formattedEffDate = this.formatDateForAPI(effDate);
      const formattedTermDate = this.formatDateForAPI(termDate);

      const data: any = {
        epitopeId1: epitopeId1,
        epitopeId2: epitopeId2,
        bond: bound,  // API expects 'bond' not 'bound'
        effDate: formattedEffDate,  // API expects 'effDate' not 'effectiveDate'
        termDate: formattedTermDate  // API expects 'termDate' not 'terminationDate'
      };

      // Remove null date fields for API submission
      if (data.effDate === null) {
        delete data.effDate;
      }
      if (data.termDate === null) {
        delete data.termDate;
      }

      if (record._isNew) {
        return this.create(data);
      } else {
        // Use original IDs to find the record, send new values in the payload
        const lookupId1 = record._originalEpitopeId1 || record.epitopeId1;
        const lookupId2 = record._originalEpitopeId2 || record.epitopeId2;
        return this.update(lookupId1, lookupId2, data);
      }
    });

    // Execute all operations in parallel using forkJoin
    return operations.length > 0 ?
      new Observable(observer => {
        let completed = 0;
        let hasError = false;

        operations.forEach(op => {
          op.subscribe({
            next: () => {
              completed++;
              if (completed === operations.length && !hasError) {
                observer.next({ success: true });
                observer.complete();
              }
            },
            error: (error) => {
              if (!hasError) {
                hasError = true;
                observer.error(error);
              }
            }
          });
        });
      }) :
      of({ success: true });
  }

  private formatDateForAPI(date: Date | string | null | any): string | null {
    if (!date) return null;

    // Handle Moment objects from Material Datepicker
    if (date && typeof date === 'object' && 'isValid' in date) {
      if (!date.isValid()) return null;
      return date.format('YYYY-MM-DD');
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
