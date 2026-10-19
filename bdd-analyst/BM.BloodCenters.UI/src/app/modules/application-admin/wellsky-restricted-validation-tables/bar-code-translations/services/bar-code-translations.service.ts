import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BarCodeTranslation,
  BarCodeTranslationFilter
} from '../models/bar-code-translations.model';
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
export class BarCodeTranslationsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get bar code translations with pagination and filters
   * POST /api/v1/bar-code-translations/{take}/{skip}
   */
  getBarCodeTranslations(
    take: number,
    skip: number,
    params: BarCodeTranslationFilter
  ): Observable<{ data: BarCodeTranslation[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.BAR_CODE_TRANSLATIONS(take, skip);

    return this.apiService.post<ReturnResult<BarCodeTranslation>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching bar code translations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get used machine codes for dropdown filtering
   * GET /api/v1/bar-code-translations/machine-codes
   */
  getUsedMachineCodes(): Observable<string[]> {
    const endpoint = API.APPLICATION_ADMIN.BAR_CODE_TRANSLATIONS_MACHINE_CODES;

    return this.apiService.get<ReturnResult<string>>(endpoint).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        console.error('Error fetching used machine codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get eye read translations for dropdown filtering
   * GET /api/v1/bar-code-translations/eye-read-translations
   */
  getEyeReadTranslations(): Observable<string[]> {
    const endpoint = API.APPLICATION_ADMIN.BAR_CODE_TRANSLATIONS_EYE_READ;

    return this.apiService.get<ReturnResult<string>>(endpoint).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        console.error('Error fetching eye read translations:', error);
        return throwError(() => error);
      })
    );
  }
}
