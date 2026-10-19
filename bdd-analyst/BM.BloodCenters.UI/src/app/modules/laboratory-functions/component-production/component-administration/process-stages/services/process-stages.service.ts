import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProcessStageDto,
  DropdownDto,
  ProcessStageQueryDto,
  CreateProcessStageRequestDto,
  UpdateProcessStageRequestDto,
  ReturnResult,
  ApiResponse,
} from '../models/process-stages.model';

@Injectable({ providedIn: 'root' })
export class ProcessStagesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get paginated list of process stages with optional filtering and sorting
   * @param pageNumber Page number (1-indexed)
   * @param pageSize Number of records per page
   * @param params Query parameters for filtering/sorting
   * @returns Observable with data and totalRecords
   */
  getProcessStages(
    params: ProcessStageQueryDto = {}
  ): Observable<{ data: ProcessStageDto[]; totalRecords: number }> {
    const requestBody: ProcessStageQueryDto = {
      searchKeyword: params.searchKeyword || null,
      sortColumn: params.sortColumn || null,
      sortOrder: params.sortOrder || null,
      processCode: params.processCode || null,
      stageCode: params.stageCode || null,
    };

    return this.apiService.post<ReturnResult<ProcessStageDto>>(API.PROCESS_STAGES.LIST, requestBody).pipe(
      map(response => ({
        data: response?.data || [],
        totalRecords: response?.total || 0,
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get a single process stage by composite key
   * @param processCode Process code (max 5 chars)
   * @param stageCode Stage code (max 5 chars)
   * @returns Observable with process stage data
   */
  getProcessStageById(
    processCode: string,
    stageCode: string
  ): Observable<ProcessStageDto> {
    const endpoint = API.PROCESS_STAGES.GET_BY_ID(processCode, stageCode);

    return this.apiService.get<ApiResponse>(endpoint).pipe(
      map(response => response?.data as ProcessStageDto),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get active process codes for dropdown (LOV)
   * @returns Observable with array of process code dropdown items
   */
  getProcessCodes(): Observable<{ data: DropdownDto[] }> {
    const endpoint = API.PROCESS_STAGES.PROCESS_CODES;

    return this.apiService.get<ReturnResult<any>>(endpoint).pipe(
      map(response => ({
        data: (response?.data || []).map((item: any) => ({
          code: item.code,
          description: item.codeDesc ?? item.description ?? '',
        })),
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get active stage codes for dropdown (LOV)
   * @returns Observable with array of stage code dropdown items
   */
  getStageCodes(): Observable<{ data: DropdownDto[] }> {
    const endpoint = API.PROCESS_STAGES.STAGE_CODES;

    return this.apiService.get<ReturnResult<DropdownDto>>(endpoint).pipe(
      map(response => ({
        data: response?.data || [],
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create a new process stage via bulk upsert (auditKey = null)
   */
  createProcessStage(dto: CreateProcessStageRequestDto): Observable<ApiResponse> {
    const endpoint = API.PROCESS_STAGES.BULK_UPSERT;
    const request = {
      records: [{
        auditKey: null,
        processCode: dto.processCode,
        stageCode: dto.stageCode,
        effDate: dto.effDate,
        termDate: dto.termDate || null,
      }]
    };

    return this.apiService.post<ApiResponse>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing process stage via bulk upsert (auditKey from record)
   */
  updateProcessStage(
    processCode: string,
    stageCode: string,
    dto: UpdateProcessStageRequestDto
  ): Observable<ApiResponse> {
    const endpoint = API.PROCESS_STAGES.BULK_UPSERT;
    const request = {
      records: [{
        auditKey: (dto as any).auditKey || null,
        processCode,
        stageCode,
        effDate: dto.effDate,
        termDate: dto.termDate || null,
      }]
    };

    return this.apiService.post<ApiResponse>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Soft delete a process stage (sets termination date to current date)
   * @param processCode Process code
   * @param stageCode Stage code
   * @returns Observable with API response
   */
  deleteProcessStage(
    processCode: string,
    stageCode: string
  ): Observable<ApiResponse> {
    const endpoint = API.PROCESS_STAGES.DELETE(processCode, stageCode);

    return this.apiService.delete<ApiResponse>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
