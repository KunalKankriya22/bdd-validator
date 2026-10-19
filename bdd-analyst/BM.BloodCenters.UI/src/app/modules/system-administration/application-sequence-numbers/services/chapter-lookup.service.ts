import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { LoggingService } from '../../../../shared/services/logging.service';
import { ChapterLookup } from '../interfaces/application-sequence-number.interface';

/**
 * Service for fetching chapter lookup data
 */
@Injectable({
  providedIn: 'root'
})
export class ChapterLookupService {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  /**
   * Get active chapters for lookup/autocomplete
   * GET /api/v1/chapters/active/lookup
   * Returns only chapters that are currently active (based on effective/termination dates)
   *
   * API returns array directly: [{ chapterId, chapterName }, ...]
   */
  getChapters(): Observable<ChapterLookup[]> {
    const endpoint = '/api/v1/chapters/active/lookup';

    this.loggingService.log('Fetching chapter lookup data');

    return this.apiService.get<ChapterLookup[]>(endpoint).pipe(
      map(response => {
        // API returns array directly, not wrapped in {success, data}
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from chapters API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully fetched chapters', { 
          count: response.length 
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error fetching chapters', error);
        
        // Return empty array instead of throwing to prevent form from breaking
        // The error will be logged but the form will still be usable
        return of([]);
      })
    );
  }
}