import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ParameterDefinitionDto,
  CreateParameterDefinitionDto,
  UpdateParameterDefinitionDto
} from '../interfaces/parameter-definition.interface';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | T | null;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParameterDefinitionService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all parameters for a process code
   */
  getParameters(processCode: string): Observable<ParameterDefinitionDto[]> {
    return this.apiService
      .get<ReturnResult<ParameterDefinitionDto>>(
        API.APPLICATION_ADMIN.PARAMETER_DEFINITION_GET(processCode)
      )
      .pipe(
        map(res => {
          // Handle both array and single object responses
          if (Array.isArray(res.data)) {
            return res.data;
          }
          return res.data ? [res.data] : [];
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new parameter
   */
  createParameter(payload: CreateParameterDefinitionDto): Observable<any> {
    return this.apiService.post(
      API.APPLICATION_ADMIN.PARAMETER_DEFINITION_CREATE,
      payload
    );
  }

  /**
   * Update existing parameter
   */
  updateParameter(
    processCode: string,
    parmNo: number,
    payload: UpdateParameterDefinitionDto
  ): Observable<any> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.PARAMETER_DEFINITION_UPDATE(processCode, parmNo),
      payload
    );
  }

  /**
   * Delete parameter
   */
  deleteParameter(processCode: string, parmNo: number): Observable<any> {
    return this.apiService.delete(
      API.APPLICATION_ADMIN.PARAMETER_DEFINITION_DELETE(processCode, parmNo)
    );
  }

  /**
   * Batch update parameters (for reordering parmNo)
   */
  batchUpdateParameters(
    processCode: string,
    parameters: UpdateParameterDefinitionDto[]
  ): Observable<any> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.PARAMETER_DEFINITION_BATCH(processCode),
      parameters
    );
  }
}
