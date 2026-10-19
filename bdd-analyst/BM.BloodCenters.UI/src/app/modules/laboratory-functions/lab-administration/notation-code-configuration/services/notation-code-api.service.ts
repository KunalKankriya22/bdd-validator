import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  NotationCode,
  CreateNotationCodeDto,
  UpdateNotationCodeDto,
  NotationCodeQueryDto,
  ApiResponseWrapper,
  ValidTestLookup,
  NotationCodeLookupItem
} from '../models/notation-code.model';

@Injectable({
  providedIn: 'root',
})
export class NotationCodeApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Search/filter notation codes with pagination
   * POST /api/v1/notation-codes/{take}/{skip}
   * @param take Number of records to return (page size)
   * @param skip Number of records to skip (offset)
   * @param queryDto Filter and search criteria (all optional)
   * @returns Observable with paginated array and total count
   */
  searchNotationCodes(
    take: number,
    skip: number,
    queryDto: NotationCodeQueryDto
  ): Observable<ApiResponseWrapper<NotationCode[]>> {
    return this.apiService
      .post<ApiResponseWrapper<NotationCode[]>>(
        API.NOTATION_CODE.SEARCH(take, skip),
        queryDto
      )
      .pipe(
        catchError((error) => {
          console.error('searchNotationCodes failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a single notation code by code value
   * GET /api/v1/notation-codes/{notationCode}
   * @param notationCode Notation code identifier (case-insensitive)
   * @returns Observable with notation code record
   */
  getNotationCodeByCode(notationCode: string): Observable<NotationCode> {
    return this.apiService
      .get<ApiResponseWrapper<NotationCode[]>>(
        API.NOTATION_CODE.GET_BY_CODE(notationCode)
      )
      .pipe(
        map((response) => {
          if (response?.data && response.data.length > 0) {
            return response.data[0];
          }
          throw new Error('Notation code not found');
        }),
        catchError((error) => {
          console.error('getNotationCodeByCode failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new notation code
   * POST /api/v1/notation-codes
   * @param dto Create request payload
   * @returns Observable with created record response
   */
  createNotationCode(
    dto: CreateNotationCodeDto
  ): Observable<ApiResponseWrapper<null>> {
    return this.apiService
      .post<ApiResponseWrapper<null>>(
        API.NOTATION_CODE.CREATE,
        dto
      )
      .pipe(
        catchError((error) => {
          console.error('createNotationCode failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing notation code
   * PUT /api/v1/notation-codes/{notationCode}
   * Note: notationCode cannot be changed on update
   * @param notationCode Notation code identifier (case-insensitive)
   * @param dto Update request payload
   * @returns Observable with updated record response
   */
  updateNotationCode(
    notationCode: string,
    dto: UpdateNotationCodeDto
  ): Observable<ApiResponseWrapper<null>> {
    return this.apiService
      .put<ApiResponseWrapper<null>>(
        API.NOTATION_CODE.UPDATE(notationCode),
        dto
      )
      .pipe(
        catchError((error) => {
          console.error('updateNotationCode failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Soft delete a notation code (sets TERM_DATE to chapter-local date)
   * DELETE /api/v1/notation-codes/{notationCode}
   * @param notationCode Notation code identifier to delete
   * @returns Observable with delete operation result
   */
  deleteNotationCode(notationCode: string): Observable<ApiResponseWrapper<boolean[]>> {
    return this.apiService
      .delete<ApiResponseWrapper<boolean[]>>(
        API.NOTATION_CODE.DELETE(notationCode)
      )
      .pipe(
        catchError((error) => {
          console.error('deleteNotationCode failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get active notation codes for the filter LOV dropdown
   * GET /api/v1/notation-codes/lookups/notation-codes
   * Response uses "items" key (not "data")
   */
  getNotationCodeLookup(): Observable<NotationCodeLookupItem[]> {
    return this.apiService
      .get<ApiResponseWrapper<NotationCodeLookupItem[]>>(
        API.NOTATION_CODE.NOTATION_CODE_LOV
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getNotationCodeLookup failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get valid tests for TEST_ID autocomplete
   * GET /api/v1/notation-codes/lookups/valid-tests
   * @returns Observable with list of valid tests
   */
  getValidTests(): Observable<ValidTestLookup[]> {
    return this.apiService
      .get<ApiResponseWrapper<ValidTestLookup[]>>(
        API.NOTATION_CODE.VALID_TESTS
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('getValidTests failed:', error);
          return throwError(() => error);
        })
      );
  }
}
