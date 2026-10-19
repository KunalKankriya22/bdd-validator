import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { API } from '../../../../core/constants/api.constants';
import { UI } from '../../../../core/constants/ui.constants';
import { ApiService } from '../../../../shared/services/api.service';
import { LoggingService } from '../../../../shared/services/logging.service';
import { ApplicationSequenceNumber, CreateSequenceNumberPayload, SingleSequenceNumberApiResponse, ApplicationSequenceNumberParamsDto, ApplicationSequenceNumberFilterDropdownDto } from '../interfaces/application-sequence-number.interface';

/**
 * API Response structure from backend (matching Valid Product Substitution pattern)
 */
interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

/**
 * Service for managing Application Sequence Numbers API operations
 * Handles API calls with proper error handling and logging
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationSequenceNumbersApiService {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private snackBar = inject(MatSnackBar);

  /**
   * Get application sequence numbers with server-side pagination (matching Valid Product Substitution pattern)
   * POST /api/v1/system-admin/application-sequence-numbers/{take}/{skip}
   *
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getApplicationSequenceNumbers(
    take: number,
    skip: number,
    params: ApplicationSequenceNumberParamsDto
  ): Observable<{ data: ApplicationSequenceNumber[]; totalRecords: number }> {
    const endpoint = API.SYSTEM_ADMIN.APPLICATION_SEQUENCE_NUMBERS(take, skip);

    this.loggingService.log('Fetching application sequence numbers', { take, skip, params });

    return this.apiService.post<ReturnResult<ApplicationSequenceNumber>>(endpoint, params).pipe(
      map(response => {
        // Parse dates from string to Date objects
        const parsedData = (response.data || []).map(item => ({
          ...item,
          lastResetDate: item.lastResetDate ? new Date(item.lastResetDate) : null
        }));

        this.loggingService.log('Successfully fetched application sequence numbers', {
          count: parsedData.length,
          total: response.total || 0
        });

        return {
          data: parsedData,
          totalRecords: response.total || 0
        };
      }),
      catchError(error => {
        // Log error
        this.loggingService.error('Error fetching application sequence numbers', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new application sequence number
   * POST /api/v1/system-admin/application-sequence-number
   * 
   * @param payload - Sequence number data
   * @returns Observable of created sequence number
   */
  createSequenceNumber(payload: CreateSequenceNumberPayload): Observable<SingleSequenceNumberApiResponse> {
    const endpoint = API.SYSTEM_ADMIN.ADD_APPLICATION_SEQUENCE_NUMBER;

    this.loggingService.log('Creating application sequence number', payload);

    return this.apiService.post<SingleSequenceNumberApiResponse>(endpoint, payload).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || response.message || 'Failed to create sequence number');
        }

        this.loggingService.log('Successfully created application sequence number');

        return {
          ...response,
          item: {
            ...response.item,
            lastResetDate: response.item.lastResetDate ? new Date(response.item.lastResetDate) : null
          }
        };
      }),
      catchError(error => {
        this.loggingService.error('Error creating application sequence number', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing application sequence number
   * PUT /api/v1/system-admin/application-sequence-number/{chapterId}/{numberType}
   * 
   * @param chapterId - Original chapter ID
   * @param numberType - Original number type
   * @param payload - Updated sequence number data
   * @returns Observable of updated sequence number
   */
  updateSequenceNumber(
    chapterId: string,
    numberType: string,
    payload: CreateSequenceNumberPayload
  ): Observable<SingleSequenceNumberApiResponse> {
    const endpoint = API.SYSTEM_ADMIN.UPDATE_APPLICATION_SEQUENCE_NUMBER(chapterId, numberType);

    this.loggingService.log('Updating application sequence number', { chapterId, numberType, payload });

    return this.apiService.put<SingleSequenceNumberApiResponse>(endpoint, payload).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || response.message || 'Failed to update sequence number');
        }

        this.loggingService.log('Successfully updated application sequence number');

        return {
          ...response,
          item: {
            ...response.item,
            lastResetDate: response.item.lastResetDate ? new Date(response.item.lastResetDate) : null
          }
        };
      }),
      catchError(error => {
        this.loggingService.error('Error updating application sequence number', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get DISTINCT filter dropdown values from backend
   * Returns separate arrays for each filterable field
   * GET /api/v1/system-admin/application-sequence-numbers/filter-dropdown-values
   *
   * @returns Observable with filter dropdown values
   */
  getFilterDropdownValues(): Observable<ApplicationSequenceNumberFilterDropdownDto> {
    const endpoint = API.SYSTEM_ADMIN.APPLICATION_SEQUENCE_NUMBERS_FILTER_DROPDOWN;

    this.loggingService.log('Fetching filter dropdown values for application sequence numbers');

    return this.apiService.get<ApplicationSequenceNumberFilterDropdownDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log('Successfully fetched filter dropdown values', {
          chapterIdsCount: response.chapterIds?.length || 0,
          chapterNamesCount: response.chapterNames?.length || 0,
          numberTypesCount: response.numberTypes?.length || 0,
          cyclesCount: response.cycles?.length || 0
        });
        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error fetching filter dropdown values', error);
        return throwError(() => error);
      })
    );
  }
}