import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  AvailableComponent,
  ValidateComponentRequest,
  ValidateComponentResponse,
  RecheckProcessRequest,
  RecheckResultResponse,
  ApiResponse,
} from '../models/recheck-products.model';

@Injectable({
  providedIn: 'root',
})
export class RecheckProductsService {
  private readonly apiService = inject(ApiService);

  validateUnit(request: ValidateUnitRequest): Observable<ValidateUnitResponse> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResponse>>(API.RECHECK_PRODUCTS_LAB.VALIDATE_UNIT, request)
      .pipe(
        map((response) => response?.item as ValidateUnitResponse),
        catchError((error) => throwError(() => error)),
      );
  }

  getAvailableComponents(unitId: string, collectionDate: string): Observable<AvailableComponent[]> {
    const url = API.RECHECK_PRODUCTS_LAB.AVAILABLE_COMPONENTS(unitId, collectionDate);
    return this.apiService.get<ApiResponse<AvailableComponent>>(url).pipe(
      map((response) => (response?.data as AvailableComponent[]) || []),
      catchError((error) => throwError(() => error)),
    );
  }

  validateComponent(request: ValidateComponentRequest): Observable<ValidateComponentResponse> {
    return this.apiService
      .post<ApiResponse<ValidateComponentResponse>>(
        API.RECHECK_PRODUCTS_LAB.VALIDATE_COMPONENT,
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.item as ValidateComponentResponse),
        catchError((error) => throwError(() => error)),
      );
  }

  processRecheck(request: RecheckProcessRequest): Observable<RecheckResultResponse> {
    return this.apiService
      .post<ApiResponse<RecheckResultResponse>>(API.RECHECK_PRODUCTS_LAB.PROCESS, request)
      .pipe(
        map((response) => response?.item as RecheckResultResponse),
        catchError((error) => throwError(() => error)),
      );
  }
}
