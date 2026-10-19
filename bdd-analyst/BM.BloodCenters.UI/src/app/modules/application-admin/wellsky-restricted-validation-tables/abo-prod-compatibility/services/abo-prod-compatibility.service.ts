import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ABOProdCompatibilityModel,
  ABOProdCompatibilityParamsDto,
  ABOProdCompatibilityFilterOption,
  ABOProdCompatibilityDto,
  UpdateABOProdCompatibilityDto,
  ABOProdCompatibilityDropdownOptions,
  DropdownApiResponse
} from '../models/abo-prod-compatibility.model';
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
export class ABOProdCompatibilityService {
  private readonly apiService = inject(ApiService);

  /**
   * Get ABO-Prod-compatibility table data with pagination
   * POST /api/v1/admin/abo-prod-compatibility/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getABOProdCompatibility(
    take: number,
    skip: number,
    params: ABOProdCompatibilityParamsDto
  ): Observable<{ data: ABOProdCompatibilityModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY(take, skip);

    return this.apiService.post<ReturnResult<ABOProdCompatibilityModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching ABO-Prod-compatibility data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/abo-product-compatibility/filter-dropdown-values
   * @returns Observable with filter options (array of product type strings)
   */
  getABOProdCompatibilityFilters(): Observable<ABOProdCompatibilityFilterOption[]> {
    const endpoint = API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_FILTERS;

    return this.apiService.get<ABOProdCompatibilityFilterOption[]>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching ABO-Prod-compatibility filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get add/edit form dropdown values (inventory product types and ABO types)
   * GET /api/v1/admin/abo-product-compatibility/add-dropdown-values
   * @returns Observable with dropdown values for add/edit form
   */
  getAddDropdownValues(): Observable<DropdownApiResponse> {
    const endpoint = API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_ADD_DROPDOWN_VALUES;

    return this.apiService.get<DropdownApiResponse>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching add dropdown values:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new ABO-Prod-compatibility record
   * POST /api/v1/admin/abo-prod-compatibility
   * @param data - ABO-Prod-compatibility data
   * @returns Observable with result
   */
  addABOProdCompatibility(data: ABOProdCompatibilityDto): Observable<ReturnResult<ABOProdCompatibilityModel>> {
    const endpoint = API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_ADD_EDIT;

    return this.apiService.post<ReturnResult<ABOProdCompatibilityModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding ABO-Prod-compatibility:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing ABO-Prod-compatibility record
   * PUT /api/v1/admin/abo-prod-compatibility
   * @param data - ABO-Prod-compatibility data with current and new values
   * @returns Observable with result
   */
  updateABOProdCompatibility(data: UpdateABOProdCompatibilityDto): Observable<ReturnResult<ABOProdCompatibilityModel>> {
    const endpoint = API.APPLICATION_ADMIN.ABO_PRODUCT_COMPATIBILITY_ADD_EDIT;

    return this.apiService.put<ReturnResult<ABOProdCompatibilityModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating ABO-Prod-compatibility:', error);
        return throwError(() => error);
      })
    );
  }
}
