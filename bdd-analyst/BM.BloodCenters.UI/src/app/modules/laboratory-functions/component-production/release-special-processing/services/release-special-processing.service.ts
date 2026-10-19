import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ProcessCodeDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ProductDto,
  AliquotDto,
  GetProductsRequestDto,
  GetAliquotsRequestDto,
  ReleaseComponentRequestDto,
  ReleaseComponentResponseDto,
  ApiResponse,
} from '../models/release-special-processing.models';

@Injectable({
  providedIn: 'root',
})
export class ReleaseSpecialProcessingService {
  private readonly apiService = inject(ApiService);
  private readonly base = API.RELEASE_SPECIAL_PROCESSING.BASE;

  getProcessCodes(): Observable<ProcessCodeDto[]> {
    return this.apiService
      .get<ApiResponse<ProcessCodeDto[]>>(
        `${this.base}${API.RELEASE_SPECIAL_PROCESSING.PROCESS_CODES}`,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching process codes:', error);
          return throwError(() => error);
        }),
      );
  }

  validateUnit(request: ValidateUnitRequestDto): Observable<ValidateUnitResponseDto> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResponseDto>>(
        `${this.base}${API.RELEASE_SPECIAL_PROCESSING.VALIDATE_UNIT}`,
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error validating unit:', error);
          return throwError(() => error);
        }),
      );
  }

  getProducts(request: GetProductsRequestDto): Observable<ProductDto[]> {
    return this.apiService
      .post<ApiResponse<ProductDto[]>>(
        `${this.base}${API.RELEASE_SPECIAL_PROCESSING.PRODUCTS}`,
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching products:', error);
          return throwError(() => error);
        }),
      );
  }

  getAliquots(request: GetAliquotsRequestDto): Observable<AliquotDto[]> {
    return this.apiService
      .post<ApiResponse<AliquotDto[]>>(
        `${this.base}${API.RELEASE_SPECIAL_PROCESSING.ALIQUOTS}`,
        request,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching aliquots:', error);
          return throwError(() => error);
        }),
      );
  }

  releaseComponent(request: ReleaseComponentRequestDto): Observable<ReleaseComponentResponseDto> {
    return this.apiService
      .delete<ApiResponse<ReleaseComponentResponseDto>>(
        `${this.base}${API.RELEASE_SPECIAL_PROCESSING.RELEASE}`,
        { body: request },
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error releasing component:', error);
          return throwError(() => error);
        }),
      );
  }
}
