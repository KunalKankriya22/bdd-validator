import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  LabInterdictionOverrideModel,
  LabInterdictionOverrideParamsDto,
  VerifyInterdictionRequest,
  VerifyInterdictionResponse,
  LabInterdictionFilterDropdownData
} from '../models/lab-interdiction-override.model';

interface SearchResponse {
  data: LabInterdictionOverrideModel[];
  totalCount: number;
}

interface FilterDropdownResponse {
  data: LabInterdictionFilterDropdownData[];
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LabInterdictionOverrideService {
  private readonly apiService = inject(ApiService);

  getLabInterdictionOverrides(
    params: LabInterdictionOverrideParamsDto
  ): Observable<{ data: LabInterdictionOverrideModel[]; totalRecords: number }> {
    return this.apiService
      .post<SearchResponse>(API.APPLICATION_ADMIN.LAB_INTERDICTION_OVERRIDE_TECH2.SEARCH, params)
      .pipe(
        map(response => ({
          data: response.data || [],
          totalRecords: response.totalCount || 0
        })),
        catchError(error => throwError(() => error))
      );
  }

  verifyInterdictions(request: VerifyInterdictionRequest): Observable<VerifyInterdictionResponse> {
    return this.apiService
      .post<VerifyInterdictionResponse>(API.APPLICATION_ADMIN.LAB_INTERDICTION_OVERRIDE_TECH2.VERIFY, request)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }

  getFilterDropdownOptions(): Observable<{ data: LabInterdictionFilterDropdownData[] }> {
    return this.apiService
      .get<FilterDropdownResponse>(API.APPLICATION_ADMIN.LAB_INTERDICTION_OVERRIDE_TECH2.FILTER_DROPDOWN)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }
}
