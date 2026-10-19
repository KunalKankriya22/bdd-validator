import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductCombinationDto,
  CreateProductCombinationRequestDto,
  ProductTypeDetailDto,
  ProductTypeApiResponse,
  BagCodeDto,
  MatrixProductTypeDto,
  ApiResponse,
  ProductCombinationQueryDto
} from '../models/product-combinations.model';

/**
 * API Service for Product Combinations
 * Handles all HTTP requests for managing product combinations
 */
@Injectable({
  providedIn: 'root',
})
export class ProductCombinationsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Search Product Combinations with pagination and filters
   * POST /api/product-combinations/{take}/{skip}
   * @param take Number of records to return (page size)
   * @param skip Number of records to skip (offset)
   * @param filters Filter criteria (all optional)
   * @returns Observable with paginated array and total count
   */
  searchProductCombinations(
    take: number,
    skip: number,
    filters: ProductCombinationQueryDto
  ): Observable<ApiResponse<ProductCombinationDto[]>> {
    return this.apiService
      .post<ApiResponse<ProductCombinationDto[]>>(
        API.PRODUCT_COMBINATIONS.SEARCH(take, skip),
        filters
      )
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a specific Product Combination by ID
   * GET /api/product-combinations/{setId}
   * @param setId Unique SET_ID of the combination
   * @returns Observable with product combination details
   */
  getProductCombinationById(setId: number): Observable<ProductCombinationDto> {
    return this.apiService
      .get<ApiResponse<ProductCombinationDto>>(
        API.PRODUCT_COMBINATIONS.GET_BY_ID(setId)
      )
      .pipe(
        map((response) => response.data as ProductCombinationDto),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new Product Combination
   * POST /api/product-combinations
   * @param payload Create request payload
   * @returns Observable with created combination
   */
  createProductCombination(
    payload: CreateProductCombinationRequestDto
  ): Observable<ApiResponse<ProductCombinationDto>> {
    return this.apiService
      .post<ApiResponse<ProductCombinationDto>>(
        API.PRODUCT_COMBINATIONS.CREATE,
        payload
      )
      .pipe(
        map((response) => {
          // Check if API returned success: false even with HTTP 200
          if (response.success === false) {
            // Normalize error shape to match HttpErrorResponse structure
            // so downstream error handlers can consistently extract errorCode
            throw { error: response };
          }
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a Product Combination by ID
   * DELETE /api/product-combinations/{setId}
   * @param setId Unique SET_ID of the combination to delete
   * @returns Observable with void response
   */
  deleteProductCombination(setId: number): Observable<ApiResponse<void>> {
    return this.apiService
      .delete<ApiResponse<void>>(
        API.PRODUCT_COMBINATIONS.DELETE(setId)
      )
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get Active Product Types for dropdown selection
   * GET /api/v1/product-combinations/product-types
   * Returns only product types that are currently active
   * @returns Observable with array of active product types
   */
  getActiveProductTypes(): Observable<ProductTypeDetailDto[]> {
    return this.apiService
      .get<ProductTypeApiResponse[]>(
        API.PRODUCT_COMBINATIONS.PRODUCT_TYPES
      )
      .pipe(
        map((response) => {
          // The response is directly an array, not wrapped in ApiResponse
          const data = Array.isArray(response) ? response : [];
          // Map API response to ProductTypeDetailDto format
          const mapped = data.map(item => ({
            productTypeCode: item.productType,
            productTypeDesc: item.productTypeDesc
          }));
          return mapped;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get Bag Codes from PRODUCT_MATRIX table
   * GET /api/v1/product-combinations/bag-codes
   * @returns Observable with array of bag codes
   */
  getBagCodes(): Observable<string[]> {
    return this.apiService
      .get<BagCodeDto[]>(API.PRODUCT_COMBINATIONS.BAG_CODES)
      .pipe(
        map((response) => {
          const data = Array.isArray(response) ? response : [];
          return data.map(item => item.bagCode);
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get Matrix Product Types from PRODUCT_MATRIX table
   * GET /api/v1/product-combinations/matrix-product-types
   * @returns Observable with array of matrix product types
   */
  getMatrixProductTypes(): Observable<ProductTypeDetailDto[]> {
    return this.apiService
      .get<ProductTypeApiResponse[]>(API.PRODUCT_COMBINATIONS.MATRIX_PRODUCT_TYPES)
      .pipe(
        map((response) => {
          const data = Array.isArray(response) ? response : [];
          return data.map(item => ({
            productTypeCode: item.productType,
            productTypeDesc: item.productTypeDesc
          }));
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get next available set ID
   * GET /api/v1/product-combinations/next-set-id
   * @returns Observable with next set ID
   */
  getNextSetId(): Observable<number> {
    return this.apiService
      .get<{ codeSet: number }>(API.PRODUCT_COMBINATIONS.NEXT_SET_ID)
      .pipe(
        map((response) => response.codeSet),
        catchError((error) => {
          console.error('getNextSetId failed:', error);
          return throwError(() => error);
        })
      );
  }
}
