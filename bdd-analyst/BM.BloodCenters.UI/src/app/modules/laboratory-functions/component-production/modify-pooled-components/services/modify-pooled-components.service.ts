import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ModifyPooledComponentsResponse,
  ModifyPooledComponentsRequest,
  ProcessCode,
  ValidProductConversion,
  ProductCodeOption,
  CatalogNumberOption,
  LotNumberOption,
  ValidAboOption,
} from '../models/modify-pooled-components.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  item: T;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ModifyPooledComponentsService {
  private readonly apiService = inject(ApiService);

  getPoolDetails(unitId: string): Observable<ModifyPooledComponentsResponse> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_POOL_DETAILS(unitId);
    return this.apiService.get<ApiResponse<ModifyPooledComponentsResponse>>(url).pipe(
      map((response) => (response?.item ?? response?.data) as ModifyPooledComponentsResponse),
      catchError((error) => throwError(() => error)),
    );
  }

  getProcessCodes(productCode: string): Observable<ProcessCode[]> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_PROCESS_CODES(productCode);
    return this.apiService.get<ApiResponse<ProcessCode[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  getValidProductConversions(
    sourceProductCode: string,
    codeScheme?: string,
  ): Observable<ValidProductConversion[]> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_VALID_CONVERSIONS(sourceProductCode, codeScheme);
    return this.apiService.get<ApiResponse<ValidProductConversion[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  getValidProducts(unitId: string): Observable<ProductCodeOption[]> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_VALID_PRODUCTS(unitId);
    return this.apiService.get<ApiResponse<ProductCodeOption[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  getValidCatalogNumbers(): Observable<CatalogNumberOption[]> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_VALID_CATALOG_NUMBERS;
    return this.apiService.get<ApiResponse<CatalogNumberOption[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  getValidLotNumbers(catalogNumber: string): Observable<LotNumberOption[]> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_VALID_LOT_NUMBERS(catalogNumber);
    return this.apiService.get<ApiResponse<LotNumberOption[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  getValidFilterLots(productType: string): Observable<LotNumberOption[]> {
    const url = API.MODIFY_POOLED_COMPONENTS.GET_VALID_FILTER_LOTS(productType);
    return this.apiService.get<ApiResponse<LotNumberOption[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  getValidAbo(): Observable<ValidAboOption[]> {
    const url = API.PREPARE_POOLED_COMPONENTS.BASE + '/valid-abo';
    return this.apiService.get<ApiResponse<ValidAboOption[]>>(url).pipe(
      map((response) => response?.item ?? response?.data ?? []),
      catchError((error) => throwError(() => error)),
    );
  }

  deriveProduct(
    productCode: string, processCode: string, productType: string, codeScheme: string,
  ): Observable<ValidProductConversion | null> {
    const url = API.MODIFY_POOLED_COMPONENTS.DERIVE_PRODUCT(productCode, processCode, productType, codeScheme);
    return this.apiService.get<ApiResponse<ValidProductConversion>>(url).pipe(
      map((response) => response?.item ?? null),
      catchError((error) => throwError(() => error)),
    );
  }

  save(request: ModifyPooledComponentsRequest): Observable<ApiResponse<unknown>> {
    const url = API.MODIFY_POOLED_COMPONENTS.SAVE;
    return this.apiService.post<ApiResponse<unknown>>(url, request).pipe(
      catchError((error) => throwError(() => error)),
    );
  }

  printLabel(unitId: string, productCode: string, codeScheme: string): Observable<ApiResponse<unknown>> {
    const url = API.MODIFY_POOLED_COMPONENTS.PRINT_LABEL;
    return this.apiService.post<ApiResponse<unknown>>(url, {
      unitId,
      productCode,
      codeScheme,
    }).pipe(
      catchError((error) => throwError(() => error)),
    );
  }
}
