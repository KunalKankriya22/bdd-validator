import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ValidateUnitResponseDto,
  ValidProductDto,
  ComponentInterdictionDto,
  ReleaseInterdictionsRequestDto,
  ApiResponse,
} from '../models/release-component-interdiction.models';

@Injectable({
  providedIn: 'root',
})
export class ReleaseComponentInterdictionService {
  private readonly apiService = inject(ApiService);
  private readonly base = API.RELEASE_COMPONENT_INTERDICTION.BASE;

  validateUnit(unitId: string, collDate?: string, chapterId?: string): Observable<ValidateUnitResponseDto> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResponseDto>>(
        `${this.base}${API.RELEASE_COMPONENT_INTERDICTION.VALIDATE_UNIT}`,
        { unitId, collDate, chapterId },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response.item!),
        catchError(error => {
          console.error('Error validating unit:', error);
          return throwError(() => error);
        }),
      );
  }

  getValidProducts(
    unitId: string,
    collDate: string,
    codeScheme?: string,
  ): Observable<ValidProductDto[]> {
    return this.apiService
      .post<ApiResponse<ValidProductDto[]>>(
        `${this.base}${API.RELEASE_COMPONENT_INTERDICTION.VALID_PRODUCTS}`,
        { unitId, collDate, codeScheme },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item || []),
        catchError(error => {
          console.error('Error fetching valid products:', error);
          return throwError(() => error);
        }),
      );
  }

  getInterdictions(
    unitId: string,
    collDate: string,
    productCode: string,
    codeScheme?: string,
  ): Observable<ComponentInterdictionDto[]> {
    return this.apiService
      .post<ApiResponse<ComponentInterdictionDto[]>>(
        `${this.base}${API.RELEASE_COMPONENT_INTERDICTION.INTERDICTIONS}`,
        { unitId, collDate, productCode, codeScheme },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item || []),
        catchError(error => {
          console.error('Error fetching interdictions:', error);
          return throwError(() => error);
        }),
      );
  }

  releaseInterdictions(request: ReleaseInterdictionsRequestDto): Observable<ApiResponse<{ deletedCount: number }>> {
    return this.apiService
      .post<ApiResponse<{ deletedCount: number }>>(
        `${this.base}${API.RELEASE_COMPONENT_INTERDICTION.RELEASE}`,
        request,
      )
      .pipe(
        catchError(error => {
          console.error('Error releasing interdictions:', error);
          return throwError(() => error);
        }),
      );
  }
}
