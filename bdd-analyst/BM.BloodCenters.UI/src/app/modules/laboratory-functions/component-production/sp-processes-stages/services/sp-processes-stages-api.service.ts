import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  Process,
  ProcessStageRecord,
  ProcessStageQueryDto,
  BulkUpsertRequest,
  BulkUpsertResponse,
  ReturnResult,
} from '../models/sp-processes-stages.model';

@Injectable({ providedIn: 'root' })
export class SpProcessesStagesApiService {
  private readonly apiService = inject(ApiService);

  getProcessCodes(): Observable<Process[]> {
    return this.apiService.get<ReturnResult<any>>(API.PROCESS_STAGES.PROCESS_CODES).pipe(
      map(response => {
        const items = Array.isArray(response?.data) ? response.data : [];
        return items.map((item: any) => ({
          code: item.code,
          description: item.codeDesc ?? item.description ?? '',
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getStageCodes(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<ReturnResult<any>>(API.PROCESS_STAGES.STAGE_CODES).pipe(
      map(response => {
        const items = Array.isArray(response?.data) ? response.data : [];
        return items.map((item: any) => ({
          code: item.code,
          description: item.codeDesc ?? item.description ?? '',
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getStages(
    params: ProcessStageQueryDto = {}
  ): Observable<{ data: ProcessStageRecord[]; totalRecords: number }> {
    const body: ProcessStageQueryDto = {
      processCode: params.processCode || null,
      stageCode: params.stageCode || null,
      searchKeyword: params.searchKeyword || null,
      sortColumn: params.sortColumn || null,
      sortOrder: params.sortOrder || null,
      activeOnly: params.activeOnly ?? true,
    };

    return this.apiService.post<ReturnResult<ProcessStageRecord>>(API.PROCESS_STAGES.LIST, body).pipe(
      map(response => ({
        data: Array.isArray(response?.data) ? response.data as ProcessStageRecord[] : [],
        totalRecords: response?.totalCount || 0,
      })),
      catchError(error => throwError(() => error))
    );
  }

  bulkUpsert(request: BulkUpsertRequest): Observable<BulkUpsertResponse> {
    return this.apiService.post<BulkUpsertResponse>(API.PROCESS_STAGES.BULK_UPSERT, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteStage(processCode: string, stageCode: string): Observable<any> {
    const endpoint = API.PROCESS_STAGES.DELETE(processCode, stageCode);
    return this.apiService.delete(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
