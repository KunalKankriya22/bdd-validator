import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CryoMethodDto,
  CryoMethodQueryParamsDto,
  CreateCryoMethodRequestDto,
  UpdateCryoMethodRequestDto
} from '../models/cryo-methods.model';

interface ReturnResult<T = unknown> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
  totalCount?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CryoMethodsService {
  private readonly apiService = inject(ApiService);

  /**
   * Gets all cryo methods with pagination and filtering
   * @param take Number of records to retrieve
   * @param skip Number of records to skip
   * @param params Query parameters for filtering and sorting
   * @returns Observable with data and totalRecords
   */
  getCryoMethods(
    take: number,
    skip: number,
    params: CryoMethodQueryParamsDto
  ): Observable<{ data: CryoMethodDto[]; totalRecords: number }> {
    const endpoint = API.CRYO_METHODS.LIST(take, skip);

    return this.apiService.post<ReturnResult<CryoMethodDto>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.totalCount || response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets a single cryo method by thaw method code
   * @param thawMethod Thaw method code
   * @returns Observable with CryoMethodDto
   */
  getCryoMethodById(thawMethod: string): Observable<CryoMethodDto | null> {
    const endpoint = API.CRYO_METHODS.GET_BY_ID(thawMethod);

    return this.apiService.get<ReturnResult<CryoMethodDto>>(endpoint).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a new cryo method
   * @param dto Create request DTO
   * @returns Observable with ReturnResult
   */
  createCryoMethod(dto: CreateCryoMethodRequestDto): Observable<ReturnResult> {
    const endpoint = API.CRYO_METHODS.CREATE;

    return this.apiService.post<ReturnResult>(endpoint, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates an existing cryo method
   * @param thawMethod Thaw method code
   * @param dto Update request DTO
   * @returns Observable with ReturnResult
   */
  updateCryoMethod(
    thawMethod: string,
    dto: UpdateCryoMethodRequestDto
  ): Observable<ReturnResult> {
    const endpoint = API.CRYO_METHODS.UPDATE(thawMethod);

    return this.apiService.put<ReturnResult>(endpoint, dto).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes a cryo method (soft delete - sets TERM_DATE to today)
   * @param thawMethod Thaw method code
   * @returns Observable with ReturnResult
   */
  deleteCryoMethod(thawMethod: string): Observable<ReturnResult> {
    const endpoint = API.CRYO_METHODS.DELETE(thawMethod);

    return this.apiService.delete<ReturnResult>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
