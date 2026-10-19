import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiResponse,
  PickSlipDropdownDto,
  PickSlipSummaryDto,
  PickSlipProductDto,
  RemoveProductRequestDto,
  ProductRemovalResultDto,
} from '../models/odtoff.model';

@Injectable({
  providedIn: 'root',
})
export class OdtoffApiService {
  private readonly apiService = inject(ApiService);

  getActivePickSlips(): Observable<PickSlipDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<PickSlipDropdownDto[]>>(API.ODTOFF.ACTIVE_PICK_SLIPS)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getPickSlipSummary(pickSlipId: string): Observable<ApiResponse<PickSlipSummaryDto>> {
    return this.apiService
      .get<ApiResponse<PickSlipSummaryDto>>(API.ODTOFF.PICK_SLIP_SUMMARY(pickSlipId))
      .pipe(catchError((error) => throwError(() => error)));
  }

  getPickSlipProducts(pickSlipId: string): Observable<PickSlipProductDto[]> {
    return this.apiService
      .get<ApiResponse<PickSlipProductDto[]>>(API.ODTOFF.PICK_SLIP_PRODUCTS(pickSlipId))
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getPickSlipProductsPaged(pickSlipId: string, take: number, skip: number, sortColumn?: string | null, sortOrder?: string | null): Observable<ApiResponse<PickSlipProductDto[]>> {
    return this.apiService
      .get<ApiResponse<PickSlipProductDto[]>>(API.ODTOFF.PICK_SLIP_PRODUCTS_PAGED(pickSlipId, take, skip, sortColumn, sortOrder))
      .pipe(catchError((error) => throwError(() => error)));
  }

  removeProduct(request: RemoveProductRequestDto): Observable<ApiResponse<ProductRemovalResultDto>> {
    return this.apiService
      .post<ApiResponse<ProductRemovalResultDto>>(API.ODTOFF.REMOVE_PRODUCT, request)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
