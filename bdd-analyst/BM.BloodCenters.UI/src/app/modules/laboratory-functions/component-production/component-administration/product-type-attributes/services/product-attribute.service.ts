import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductAttribute,
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  ProductAttributeParamsDto,
  ApiResponse,
  ProductTypeDropdown,
  AttributeGroupDropdown,
  AttributeCodeDropdown
} from '../models/product-attribute.model';

/**
 * Service for Product Type Attributes (ISBT/Codabar) API operations
 * JIRA: MLT-14237
 */
@Injectable({
  providedIn: 'root'
})
export class ProductAttributeService {
  private apiService = inject(ApiService);

  /**
   * Get all product attributes with search, filter, sort, and pagination
   * @param take Number of records to return
   * @param skip Number of records to skip
   * @param params Query parameters for filtering and sorting
   */
  getProductAttributes(
    take: number,
    skip: number,
    params: ProductAttributeParamsDto
  ): Observable<ApiResponse<ProductAttribute[]>> {
    return this.apiService
      .post<ApiResponse<ProductAttribute[]>>(API.PRODUCT_ATTRIBUTES.LIST(take, skip), params)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product attributes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a single product attribute by its composite key
   * @param productType Product type code
   * @param attribGroup Attribute group code
   * @param attribCode Attribute code
   */
  getProductAttributeById(
    productType: string,
    attribGroup: string,
    attribCode: string
  ): Observable<ApiResponse<ProductAttribute>> {
    return this.apiService
      .get<ApiResponse<ProductAttribute>>(
        API.PRODUCT_ATTRIBUTES.GET_BY_ID(productType, attribGroup, attribCode)
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching product attribute by ID:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new product attribute
   * @param data Product attribute data to create
   */
  createProductAttribute(data: CreateProductAttributeDto): Observable<ApiResponse<unknown>> {
    return this.apiService
      .post<ApiResponse<unknown>>(API.PRODUCT_ATTRIBUTES.CREATE, data)
      .pipe(
        catchError((error) => {
          console.error('Error creating product attribute:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing product attribute
   * @param productType Product type code (primary key)
   * @param attribGroup Attribute group code (primary key)
   * @param attribCode Attribute code (primary key)
   * @param data Updated product attribute data
   */
  updateProductAttribute(
    productType: string,
    attribGroup: string,
    attribCode: string,
    data: UpdateProductAttributeDto
  ): Observable<ApiResponse<unknown>> {
    return this.apiService
      .put<ApiResponse<unknown>>(
        API.PRODUCT_ATTRIBUTES.UPDATE(productType, attribGroup, attribCode),
        data
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating product attribute:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a product attribute (soft delete - sets termination date)
   * @param productType Product type code
   * @param attribGroup Attribute group code
   * @param attribCode Attribute code
   */
  deleteProductAttribute(
    productType: string,
    attribGroup: string,
    attribCode: string
  ): Observable<ApiResponse<boolean>> {
    return this.apiService
      .delete<ApiResponse<boolean>>(
        API.PRODUCT_ATTRIBUTES.DELETE(productType, attribGroup, attribCode)
      )
      .pipe(
        catchError((error) => {
          console.error('Error deleting product attribute:', error);
          return throwError(() => error);
        })
      );
  }

  // ============ Dropdown/LOV Endpoints (For Forms) ============

  /**
   * Get all active product types for dropdown (Add/Edit forms)
   */
  getProductTypesDropdown(): Observable<ProductTypeDropdown[]> {
    return this.apiService
      .get<ProductTypeDropdown[]>(API.PRODUCT_ATTRIBUTES.PRODUCT_TYPES_DROPDOWN)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product types dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all active attribute groups for dropdown (Add/Edit forms)
   */
  getAttributeGroupsDropdown(): Observable<AttributeGroupDropdown[]> {
    return this.apiService
      .get<AttributeGroupDropdown[]>(API.PRODUCT_ATTRIBUTES.ATTRIBUTE_GROUPS_DROPDOWN)
      .pipe(
        catchError((error) => {
          console.error('Error fetching attribute groups dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all active attribute codes for a specific attribute group (Add/Edit forms)
   * @param attribGroup Attribute group code
   */
  getAttributeCodesDropdown(attribGroup: string): Observable<AttributeCodeDropdown[]> {
    return this.apiService
      .get<AttributeCodeDropdown[]>(API.PRODUCT_ATTRIBUTES.ATTRIBUTE_CODES_DROPDOWN(attribGroup))
      .pipe(
        catchError((error) => {
          console.error('Error fetching attribute codes dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get active product types excluding the current product type (for migration workflows)
   * @param currentProductType Current product type to exclude from results
   */
  getNewProductTypesDropdown(currentProductType: string): Observable<ProductTypeDropdown[]> {
    return this.apiService
      .get<ProductTypeDropdown[]>(
        API.PRODUCT_ATTRIBUTES.NEW_PRODUCT_TYPES_DROPDOWN(currentProductType)
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching new product types dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  // ============ Filter Endpoints (For UI Grid Filtering) ============

  /**
   * Get distinct product types for UI grid filtering (includes historical)
   */
  getProductTypesFilter(): Observable<ProductTypeDropdown[]> {
    return this.apiService
      .get<ProductTypeDropdown[]>(API.PRODUCT_ATTRIBUTES.FILTER_PRODUCT_TYPES)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product types filter:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get distinct attribute groups for UI grid filtering (includes historical)
   */
  getAttributeGroupsFilter(): Observable<AttributeGroupDropdown[]> {
    return this.apiService
      .get<AttributeGroupDropdown[]>(API.PRODUCT_ATTRIBUTES.FILTER_ATTRIBUTE_GROUPS)
      .pipe(
        catchError((error) => {
          console.error('Error fetching attribute groups filter:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get distinct attribute codes for UI grid filtering (includes historical)
   */
  getAttributeCodesFilter(): Observable<AttributeCodeDropdown[]> {
    return this.apiService
      .get<AttributeCodeDropdown[]>(API.PRODUCT_ATTRIBUTES.FILTER_ATTRIBUTE_CODES)
      .pipe(
        catchError((error) => {
          console.error('Error fetching attribute codes filter:', error);
          return throwError(() => error);
        })
      );
  }
}
