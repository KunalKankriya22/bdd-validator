import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ProcessCode } from '../emf-processes';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  errorResponse?: { errorCode: string; error: string };
}

interface DetailResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: ProcessCode | null;
}

export interface EmfProcessesParamsDto {
  searchText?: string;
  effectiveDatePeriod?: string | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: string | null;
  terminationDate?: string | null;
  sort?: string;
}

export interface AddEditProcessCodeDto {
  procCode: string;
  procDesc: string;
  effDate: string | null;
  termDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EmfProcessesService {
  private readonly apiService = inject(ApiService);

  getProcessCodes(
    take: number,
    skip: number,
    params: EmfProcessesParamsDto = {}
  ): Observable<{ data: ProcessCode[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.EMF_PROCESSES(take, skip);

    return this.apiService
      .post<ReturnResult<ProcessCode>>(endpoint, params)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  addProcessCode(payload: AddEditProcessCodeDto): Observable<ApiResponse> {
    return this.apiService.post<ApiResponse>(API.APPLICATION_ADMIN.EMF_PROCESS_ADD_EDIT, payload);
  }

  updateProcessCode(payload: AddEditProcessCodeDto): Observable<ApiResponse> {
    return this.apiService.put<ApiResponse>(API.APPLICATION_ADMIN.EMF_PROCESS_ADD_EDIT, payload);
  }

  getProcessCodeById(procCode: string): Observable<ProcessCode> {
    const endpoint = API.APPLICATION_ADMIN.EMF_PROCESS_BY_ID(procCode);

    return this.apiService
      .get<DetailResponse>(endpoint)
      .pipe(
        map(res => {
          const detail = res?.item ?? res;
          if (!detail) {
            throw new Error('Process code not found');
          }
          return detail as ProcessCode;
        })
      );
  }
}
