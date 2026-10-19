import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BoxCapacityModel,
  BoxCapacityParamsDto,
  BoxCapacityFilterLov,
  BoxCapacityDto,
  UpdateBoxCapacityDto
} from '../models/box-capacity.model';
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
export class BoxCapacityService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Box Capacity table data with pagination
   * POST /api/v1/admin/box-capacity/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getBoxCapacity(
    take: number,
    skip: number,
    params: BoxCapacityParamsDto
  ): Observable<{ data: BoxCapacityModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.BOX_CAPACITY(take, skip);

    return this.apiService.post<ReturnResult<BoxCapacityModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching box capacity data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values (LOV)
   * GET /api/v1/admin/box-capacity-filters
   * @returns Observable with filter options
   */
  getBoxCapacityFilters(): Observable<ReturnResult<BoxCapacityFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.BOX_CAPACITY_FILTERS;

    return this.apiService.get<ReturnResult<BoxCapacityFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching box capacity filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get lookups for add/edit form dropdowns (box types and inventory product types)
   * GET /api/v1/admin/box-capacity/lookups-get
   * @returns Observable with lookup options
   */
  getBoxCapacityLookups(): Observable<ReturnResult<BoxCapacityFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.BOX_CAPACITY_LOOKUPS;

    return this.apiService.get<ReturnResult<BoxCapacityFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching box capacity lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Box Capacity
   * POST /api/v1/admin/box-capacity
   * @param data - Box capacity data
   * @returns Observable with result
   */
  addBoxCapacity(data: BoxCapacityDto): Observable<ReturnResult<BoxCapacityModel>> {
    const endpoint = API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT;

    return this.apiService.post<ReturnResult<BoxCapacityModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error adding box capacity:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Box Capacity
   * PUT /api/v1/admin/box-capacity
   * @param data - Box capacity data
   * @returns Observable with result
   */
  updateBoxCapacity(data: UpdateBoxCapacityDto): Observable<ReturnResult<BoxCapacityModel>> {
    const endpoint = API.APPLICATION_ADMIN.BOX_CAPACITY_ADD_EDIT;

    return this.apiService.put<ReturnResult<BoxCapacityModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating box capacity:', error);
        return throwError(() => error);
      })
    );
  }
}
