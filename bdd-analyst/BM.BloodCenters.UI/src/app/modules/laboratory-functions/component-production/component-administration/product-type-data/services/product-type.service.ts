import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductType,
  CreateProductTypeDto,
  UpdateProductTypeDto,
  ProductTypeQueryDto,
  ApiResponse,
  ProductClassDropdown,
  ProductTypeDropdownOption,
  ProductTypeFilterOptions
} from '../models/product-type.model';

@Injectable({
  providedIn: 'root'
})
export class ProductTypeService {
  private apiService = inject(ApiService);

  getProductTypes(
    take: number,
    skip: number,
    params: ProductTypeQueryDto
  ): Observable<ApiResponse<ProductType[]>> {
    return this.apiService
      .post<ApiResponse<ProductType[]>>(API.PRODUCT_TYPES.LIST(take, skip), params)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product types:', error);
          return throwError(() => error);
        })
      );
  }

  getProductTypeById(productTypeCode: string): Observable<ApiResponse<ProductType>> {
    return this.apiService
      .get<ApiResponse<ProductType>>(API.PRODUCT_TYPES.GET_BY_ID(productTypeCode))
      .pipe(
        catchError((error) => {
          console.error('Error fetching product type by ID:', error);
          return throwError(() => error);
        })
      );
  }

  createProductType(data: CreateProductTypeDto): Observable<ApiResponse<unknown>> {
    return this.apiService
      .post<ApiResponse<unknown>>(API.PRODUCT_TYPES.CREATE, data)
      .pipe(
        catchError((error) => {
          console.error('Error creating product type:', error);
          return throwError(() => error);
        })
      );
  }

  updateProductType(
    productTypeCode: string,
    data: UpdateProductTypeDto
  ): Observable<ApiResponse<unknown>> {
    return this.apiService
      .put<ApiResponse<unknown>>(API.PRODUCT_TYPES.UPDATE(productTypeCode), data)
      .pipe(
        catchError((error) => {
          console.error('Error updating product type:', error);
          return throwError(() => error);
        })
      );
  }

  deleteProductType(productTypeCode: string): Observable<ApiResponse<boolean>> {
    return this.apiService
      .delete<ApiResponse<boolean>>(API.PRODUCT_TYPES.DELETE(productTypeCode))
      .pipe(
        catchError((error) => {
          console.error('Error deleting product type:', error);
          return throwError(() => error);
        })
      );
  }

  getProductTypesDropdown(): Observable<ApiResponse<ProductTypeDropdownOption[]>> {
    return this.apiService
      .get<ApiResponse<ProductTypeDropdownOption[]>>(API.PRODUCT_TYPES.PRODUCT_TYPES_DROPDOWN)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product types dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  getProductTypesLov(): Observable<ApiResponse<ProductTypeDropdownOption[]>> {
    return this.apiService
      .get<ApiResponse<ProductTypeDropdownOption[]>>(API.PRODUCT_TYPES.PRODUCT_TYPES_LOV)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product types LOV:', error);
          return throwError(() => error);
        })
      );
  }

  getProductClassesDropdown(): Observable<ApiResponse<ProductClassDropdown[]>> {
    return this.apiService
      .get<ApiResponse<ProductClassDropdown[]>>(API.PRODUCT_TYPES.PRODUCT_CLASSES_DROPDOWN)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product classes dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  getFilterOptions(): Observable<ApiResponse<ProductTypeFilterOptions[]>> {
    return this.apiService
      .get<ApiResponse<ProductTypeFilterOptions[]>>(API.PRODUCT_TYPES.FILTER_OPTIONS)
      .pipe(
        catchError((error) => {
          console.error('Error fetching filter options:', error);
          return throwError(() => error);
        })
      );
  }
}
