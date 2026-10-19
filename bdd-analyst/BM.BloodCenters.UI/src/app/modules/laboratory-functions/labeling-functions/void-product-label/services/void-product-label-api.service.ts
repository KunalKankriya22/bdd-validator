import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  VoidProductLabelRequestDto,
  VoidProductLabelResponseDto,
  ComponentDetailsDto,
  UnitComponentDto,
  OverrideCodeDto,
  ProductCodeDto,
  VoidProductLabelSearchRequest,
} from '../models/void-product-label.model';

@Injectable({ providedIn: 'root' })
export class VoidProductLabelApiService {
  private readonly apiService = inject(ApiService);

  search(
    request: VoidProductLabelSearchRequest,
    take: number,
    skip: number
  ): Observable<{ data: ComponentDetailsDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<ComponentDetailsDto>>(
        API.VOID_PRODUCT_LABEL.SEARCH(take, skip),
        request
      )
      .pipe(
        map((response) => ({
          data: response.data || [],
          total: response.total || 0,
        })),
        catchError((error) => throwError(() => error))
      );
  }

  getComponentDetails(
    unitId: string,
    productCode: string
  ): Observable<ComponentDetailsDto> {
    return this.apiService
      .get<ReturnResult<ComponentDetailsDto>>(
        API.VOID_PRODUCT_LABEL.GET_COMPONENT(unitId, productCode)
      )
      .pipe(
        map((response: any) => response.item ?? response.data),
        catchError((error) => throwError(() => error))
      );
  }

  voidProductLabel(
    request: VoidProductLabelRequestDto
  ): Observable<VoidProductLabelResponseDto> {
    return this.apiService
      .post<ReturnResult<VoidProductLabelResponseDto>>(
        API.VOID_PRODUCT_LABEL.VOID,
        request
      )
      .pipe(
        map((response) => response.item!),
        catchError((error) => throwError(() => error))
      );
  }

  getOverrideCodes(): Observable<OverrideCodeDto[]> {
    return this.apiService
      .get<ReturnResult<OverrideCodeDto>>(API.VOID_PRODUCT_LABEL.OVERRIDE_CODES)
      .pipe(
        map((response) =>
          (response.data || []).map((item: any) => ({
            code: item.overrideCode ?? item.code ?? '',
            description: item.description ?? '',
          })),
        ),
        catchError((error) => throwError(() => error))
      );
  }

  getUnitComponents(unitId: string): Observable<UnitComponentDto[]> {
    return this.apiService
      .get<ReturnResult<UnitComponentDto>>(
        API.VOID_PRODUCT_LABEL.UNIT_COMPONENTS(unitId)
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  printLabel(request: {
    unitId: string;
    productCode: string;
    componentPrefix: string;
    collDate: string;
  }): Observable<{ success: boolean; message?: string }> {
    return this.apiService
      .post<{ success: boolean; message?: string }>(
        API.VOID_PRODUCT_LABEL.PRINT_LABEL,
        request
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  getProductCodes(): Observable<ProductCodeDto[]> {
    return this.apiService
      .get<ReturnResult<ProductCodeDto>>(API.VOID_PRODUCT_LABEL.PRODUCT_CODES)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => throwError(() => error))
      );
  }
}
