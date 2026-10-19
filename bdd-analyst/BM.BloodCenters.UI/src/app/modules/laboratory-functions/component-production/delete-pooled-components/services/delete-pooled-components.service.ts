import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PoolDetails,
  PooledComponentUnit,
  ApiResponse,
} from '../models/delete-pooled-components.model';

@Injectable({
  providedIn: 'root',
})
export class DeletePooledComponentsService {
  private readonly apiService = inject(ApiService);

  getPoolDetails(unitId: string): Observable<PoolDetails> {
    const url = API.DELETE_POOLED_COMPONENTS.GET_POOL_DETAILS(unitId);
    return this.apiService.get<ApiResponse<PoolDetails>>(url).pipe(
      map((response) => response?.data as PoolDetails),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  getPooledUnits(unitId: string): Observable<PooledComponentUnit[]> {
    const url = API.DELETE_POOLED_COMPONENTS.GET_POOLED_UNITS(unitId);
    return this.apiService.get<ApiResponse<PooledComponentUnit[]>>(url).pipe(
      map((response) => response?.data || []),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  deletePool(poolId: string): Observable<ApiResponse<unknown>> {
    const url = API.DELETE_POOLED_COMPONENTS.DELETE_POOL(poolId);
    return this.apiService.delete<ApiResponse<unknown>>(url).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }
}
