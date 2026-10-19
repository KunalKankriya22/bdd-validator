import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  SystemParameterModel,
  SystemParameterParamsDto,
  SystemParameterCreateDto,
  SystemParameterUpdateDto,
  ParameterOption
} from '../interfaces/view-system-parameter.interface';
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
export class ViewSystemParameterService {
  private readonly apiService = inject(ApiService);

  getSystemParameters(
    take: number,
    skip: number,
    params: SystemParameterParamsDto
  ): Observable<{ data: SystemParameterModel[]; totalRecords: number }> {
    const endpoint = `${API.SYSTEM_PARAMETER.GET}/${take}/${skip}`;

    return this.apiService.post<ReturnResult<SystemParameterModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  createSystemParameter(payload: SystemParameterCreateDto): Observable<any> {
    return this.apiService.post(
      API.SYSTEM_PARAMETER.POST,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateSystemParameter(parameterCode: string, payload: SystemParameterUpdateDto): Observable<any> {
    const endpoint = `${API.SYSTEM_PARAMETER.PUT}/${parameterCode}`;

    return this.apiService.put(endpoint, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getParameterLookup(): Observable<ParameterOption[]> {
    const endpoint = `${API.SYSTEM_PARAMETER.GET}/10000/0`;

    return this.apiService.post<ReturnResult<SystemParameterModel>>(endpoint, {}).pipe(
      map(response => {
        const data = response.data || [];
        const seen = new Set<string>();
        return data
          .filter(item => {
            if (seen.has(item.parameterCode)) return false;
            seen.add(item.parameterCode);
            return true;
          })
          .map(item => ({
            parameterCode: item.parameterCode,
            description: item.description
          }))
          .sort((a, b) => a.parameterCode.localeCompare(b.parameterCode));
      }),
      catchError(error => throwError(() => error))
    );
  }
}
