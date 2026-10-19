import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductConversionModel,
  ProductDropdownDto,
  ProductConversionQueryDto,
  CreateProductConversionDto,
  UpdateProductConversionDto,
  ReturnResult,
  ApiResponse,
} from '../models/product-conversions.model';

@Injectable({ providedIn: 'root' })
export class ProductConversionsService {
  private readonly apiService = inject(ApiService);

  getProductConversions(
    pageNumber: number,
    pageSize: number,
    params: ProductConversionQueryDto = {}
  ): Observable<{ data: ProductConversionModel[]; totalRecords: number }> {
    const take = pageSize;
    const skip = (pageNumber - 1) * pageSize;
    const endpoint = API.PRODUCT_CONVERSIONS.LIST(take, skip);

    const requestBody: ProductConversionQueryDto = {
      searchKeyword: params.searchKeyword || null,
      sortColumn: params.sortColumn || null,
      sortOrder: params.sortOrder || null,
      sourceProductCode: params.sourceProductCode || null,
      targetProductCode: params.targetProductCode || null,
      effDateFrom: params.effDateFrom || null,
      effDateTo: params.effDateTo || null,
    };

    return this.apiService.post<ReturnResult<ProductConversionModel>>(endpoint, requestBody).pipe(
      map(response => ({
        data: response?.data || [],
        totalRecords: response?.total || 0,
      })),
      catchError(error => throwError(() => error))
    );
  }

  getSourceProducts(): Observable<{ data: ProductDropdownDto[] }> {
    const endpoint = API.PRODUCT_CONVERSIONS.SOURCE_PRODUCTS;

    return this.apiService.get<ReturnResult<ProductDropdownDto>>(endpoint).pipe(
      map(response => ({
        data: response?.data || [],
      })),
      catchError(error => throwError(() => error))
    );
  }

  getTargetProducts(sourceProductCode: string): Observable<{ data: ProductDropdownDto[] }> {
    const endpoint = API.PRODUCT_CONVERSIONS.TARGET_PRODUCTS(sourceProductCode);

    return this.apiService.get<ReturnResult<ProductDropdownDto>>(endpoint).pipe(
      map(response => ({
        data: response?.data || [],
      })),
      catchError(error => throwError(() => error))
    );
  }

  createProductConversion(dto: CreateProductConversionDto): Observable<ApiResponse> {
    const endpoint = API.PRODUCT_CONVERSIONS.CREATE;

    return this.apiService.post<ApiResponse>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateProductConversion(
    sourceProductCode: string,
    targetProductCode: string,
    dto: UpdateProductConversionDto
  ): Observable<ApiResponse> {
    const endpoint = API.PRODUCT_CONVERSIONS.UPDATE(sourceProductCode, targetProductCode);

    return this.apiService.put<ApiResponse>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
