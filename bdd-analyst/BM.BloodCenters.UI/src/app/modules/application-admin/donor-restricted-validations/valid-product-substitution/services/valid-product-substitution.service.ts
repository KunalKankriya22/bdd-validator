import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ValidProductSubstitutionModel,
  ValidProductSubstitutionParamsDto,
  ValidProductSubstitutionFilterLov,
  ValidProductSubstitutionDto,
  UpdateValidProductSubstitutionDto,
  ProductTypeLookup
} from '../models/valid-product-substitution.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ValidProductSubstitutionService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Valid Product Substitution table data with pagination
   * POST /api/v1/admin/inventory-product-type-substitution/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getValidProductSubstitution(
    take: number,
    skip: number,
    params: ValidProductSubstitutionParamsDto
  ): Observable<{ data: ValidProductSubstitutionModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION(take, skip);

    return this.apiService.post<ReturnResult<ValidProductSubstitutionModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching valid product substitution data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/inventory-product-type-substitution/filter-dropdown
   * @returns Observable with filter options (requestProductType[], compatibleProductType[])
   */
  getValidProductSubstitutionFilters(): Observable<ValidProductSubstitutionFilterLov> {
    const endpoint = API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION_FILTERS;

    return this.apiService.get<ValidProductSubstitutionFilterLov>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching valid product substitution filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get inventory product types for add/edit form dropdowns
   * GET /api/v1/admin/inventory-product-type-substitution/product-types
   * @returns Observable with list of inventory product types (code and description)
   */
  getInventoryProductTypes(): Observable<ProductTypeLookup[]> {
    const endpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES;

    return this.apiService.get<ProductTypeLookup[]>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching inventory product types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Valid Product Substitution
   * POST /api/v1/admin/inventory-product-type-substitution
   * @param data - Valid product substitution data
   * @returns Observable with result
   */
  addValidProductSubstitution(data: ValidProductSubstitutionDto): Observable<ReturnResult<ValidProductSubstitutionModel>> {
    const endpoint = API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION_ADD_EDIT;

    return this.apiService.post<ReturnResult<ValidProductSubstitutionModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding valid product substitution:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Valid Product Substitution
   * PUT /api/v1/admin/inventory-product-type-substitution
   * @param data - Valid product substitution data
   * @returns Observable with result
   */
  updateValidProductSubstitution(data: UpdateValidProductSubstitutionDto): Observable<ReturnResult<ValidProductSubstitutionModel>> {
    const endpoint = API.APPLICATION_ADMIN.VALID_PRODUCT_SUBSTITUTION_ADD_EDIT;

    return this.apiService.put<ReturnResult<ValidProductSubstitutionModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating valid product substitution:', error);
        return throwError(() => error);
      })
    );
  }
}
