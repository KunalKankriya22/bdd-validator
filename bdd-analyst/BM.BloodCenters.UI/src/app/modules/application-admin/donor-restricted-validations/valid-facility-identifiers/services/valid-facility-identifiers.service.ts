import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ValidFacilityIdentifiersModel,
  ValidFacilityIdentifiersParamsDto,
  ValidFacilityIdentifiersDto,
  UpdateValidFacilityIdentifiersDto
} from '../models/valid-facility-identifiers.model';
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

interface ActiveChapter {
  chapterId: string;
  chapterName: string;
}

export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidFacilityIdentifiersService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Valid Facility Identifiers list with pagination, sorting, and filtering
   * POST /api/v1/valid-facility-identifiers/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getValidFacilityIdentifiers(
    take: number,
    skip: number,
    params: ValidFacilityIdentifiersParamsDto
  ): Observable<{ data: ValidFacilityIdentifiersModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_FACILITY_IDENTIFIERS(take, skip);

    return this.apiService.post<ReturnResult<ValidFacilityIdentifiersModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching valid facility identifiers data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new facility identifier
   * POST /api/v1/valid-facility-identifiers
   * @param payload - Facility identifier data to add
   * @returns Observable with API response
   */
  addFacilityIdentifier(payload: ValidFacilityIdentifiersDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ADD_VALID_FACILITY_IDENTIFIER;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding facility identifier:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing facility identifier
   * PUT /api/v1/valid-facility-identifiers
   * @param payload - Updated facility identifier data
   * @returns Observable with API response
   */
  updateFacilityIdentifier(payload: UpdateValidFacilityIdentifiersDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_VALID_FACILITY_IDENTIFIER;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating facility identifier:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get list of chapters for filter dropdown
   * GET /api/v1/valid-facility-identifiers/chapters
   * @returns Observable with chapter list
   */
  getChapters(): Observable<ChapterLookup[]> {
    const endpoint = API.APPLICATION_ADMIN.VALID_FACILITY_IDENTIFIERS_CHAPTERS;

    return this.apiService.get<ReturnResult<ActiveChapter>>(endpoint).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((item: ActiveChapter) => ({
            chapterId: item.chapterId,
            chapterName: item.chapterName || ''
          }));
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get list of active chapters for add/edit dropdown
   * GET /api/v1/valid-facility-identifiers/active-chapters
   * @returns Observable with active chapter list
   */
  getActiveChapters(): Observable<ChapterLookup[]> {
    const endpoint = API.APPLICATION_ADMIN.VALID_FACILITY_IDENTIFIERS_ACTIVE_CHAPTERS;

    return this.apiService.get<ReturnResult<ActiveChapter>>(endpoint).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((item: ActiveChapter) => ({
            chapterId: item.chapterId,
            chapterName: item.chapterName || ''
          }));
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
