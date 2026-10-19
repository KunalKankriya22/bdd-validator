import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PheresisCountComponentDto,
  PagedResult,
  UpdateComponentCountRequestDto,
  ReturnResult,
} from '../models/pheresis-count.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  statusCode?: number;
  errorCode?: string;
  errorResponse?: any;
}

@Injectable({
  providedIn: 'root',
})
export class PheresisCountService {
  private readonly apiService = inject(ApiService);

  getComponentsByCollectionDate(
    take: number,
    skip: number,
    collectionDate: string,
    sortOrder: string = 'DESC',
    searchKeyword: string = ''
  ): Observable<PagedResult<PheresisCountComponentDto>> {
    return this.apiService
      .get<ApiResponse<PheresisCountComponentDto[]>>(
        API.PHERESIS_COUNT.COMPONENTS_BY_DATE(take, skip, collectionDate, sortOrder, searchKeyword)
      )
      .pipe(
        map((response) => ({
          data: response?.data ?? [],
          total: response?.total ?? 0,
        })),
        catchError((error) => {
          console.error('Error fetching pheresis count components:', error);
          return throwError(() => error);
        })
      );
  }

  updateComponentCount(request: UpdateComponentCountRequestDto): Observable<ReturnResult<boolean>> {
    return this.apiService
      .put<ReturnResult<boolean>>(
        API.PHERESIS_COUNT.UPDATE_COMPONENT_COUNT,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating component count:', error);
          return throwError(() => error);
        })
      );
  }

  validateCount(productCode: string, unitId: string, componentCount: number): Observable<ReturnResult<boolean>> {
    return this.apiService
      .get<ReturnResult<boolean>>(
        API.PHERESIS_COUNT.VALIDATE_COUNT(productCode, unitId, componentCount)
      )
      .pipe(
        catchError((error) => {
          console.error('Error validating component count:', error);
          return throwError(() => error);
        })
      );
  }

  updateComponentCounts(requests: UpdateComponentCountRequestDto[]): Observable<ReturnResult<boolean>> {
    return this.apiService
      .put<ReturnResult<boolean>>(
        API.PHERESIS_COUNT.UPDATE_COMPONENT_COUNTS,
        requests
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating component counts:', error);
          return throwError(() => error);
        })
      );
  }
}
