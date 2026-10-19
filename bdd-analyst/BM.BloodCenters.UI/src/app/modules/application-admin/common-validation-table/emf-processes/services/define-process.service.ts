import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SourceProcess,
  SourceProcessDto,
  SourceProcessQueryDto,
  CreateSourceProcessRequestDto,
  UpdateSourceProcessRequestDto,
  TargetProcessDto,
  TargetProcessQueryDto,
  CreateTargetProcessRequestDto,
  UpdateTargetProcessRequestDto
} from '../interfaces/source-process.interface';

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
  error?: string;
}

export interface SqlStatement {
  processCode: string;
  processSeq: number;
  lookingFor: string;
  sqlStmt: string;
}

interface SqlViewResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SqlStatement[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DefineProcessService {
  private readonly apiService = inject(ApiService);

  // ==================== SOURCE PROCESS ENDPOINTS ====================

  getSourceProcesses(
    take: number,
    skip: number,
    params: SourceProcessQueryDto = {}
  ): Observable<{ data: SourceProcess[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.EMF_SOURCE_PROCESSES(take, skip);

    return this.apiService
      .post<ReturnResult<SourceProcess>>(endpoint, params)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  getSourceProcessById(
    processCode: string,
    processSeq: number
  ): Observable<SourceProcess> {
    const endpoint = API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_BY_ID(processCode, processSeq);
    return this.apiService.get<SourceProcess>(endpoint);
  }

  getSourceProcessWithDetails(
    processCode: string,
    processSeq: number
  ): Observable<SourceProcessDto> {
    const endpoint = API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_DETAILS(processCode, processSeq);
    return this.apiService.get<SourceProcessDto>(endpoint);
  }

  createSourceProcess(
    dto: CreateSourceProcessRequestDto
  ): Observable<ReturnResult<SourceProcess>> {
    return this.apiService.post<ReturnResult<SourceProcess>>(
      API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_CREATE,
      dto
    );
  }

  updateSourceProcess(
    processCode: string,
    processSeq: number,
    dto: UpdateSourceProcessRequestDto
  ): Observable<ReturnResult<SourceProcess>> {
    const endpoint = API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_UPDATE(processCode, processSeq);
    return this.apiService.put<ReturnResult<SourceProcess>>(endpoint, dto);
  }

  deleteSourceProcess(
    processCode: string,
    processSeq: number
  ): Observable<void> {
    const endpoint = API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_DELETE(processCode, processSeq);
    return this.apiService.delete<void>(endpoint);
  }

  // ==================== TARGET PROCESS ENDPOINTS ====================

  getTargetProcesses(
    take: number,
    skip: number,
    params: TargetProcessQueryDto = {}
  ): Observable<{ data: TargetProcessDto[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESSES(take, skip);

    return this.apiService
      .post<ReturnResult<TargetProcessDto>>(endpoint, params)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  getTargetProcessesBySource(
    processCode: string,
    take: number = 100,
    skip: number = 0
  ): Observable<{ data: TargetProcessDto[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESSES_BY_SOURCE(processCode);

    return this.apiService
      .get<ReturnResult<TargetProcessDto>>(`${endpoint}?take=${take}&skip=${skip}`)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  getTargetProcessById(
    processCode: string,
    actionSeq: string
  ): Observable<TargetProcessDto> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_BY_ID(processCode, actionSeq);
    return this.apiService.get<TargetProcessDto>(endpoint);
  }

  createTargetProcess(
    dto: CreateTargetProcessRequestDto
  ): Observable<ReturnResult<TargetProcessDto>> {
    return this.apiService.post<ReturnResult<TargetProcessDto>>(
      API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_CREATE,
      dto
    );
  }

  updateTargetProcess(
    processCode: string,
    actionSeq: string,
    dto: UpdateTargetProcessRequestDto
  ): Observable<ReturnResult<TargetProcessDto>> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_UPDATE(processCode, actionSeq);
    return this.apiService.put<ReturnResult<TargetProcessDto>>(endpoint, dto);
  }

  deleteTargetProcess(
    processCode: string,
    actionSeq: string
  ): Observable<void> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_DELETE(processCode, actionSeq);
    return this.apiService.delete<void>(endpoint);
  }

  getNextTargetSequence(
    processCode: string
  ): Observable<string> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_NEXT_SEQ(processCode);
    return this.apiService
      .get<{ nextSequence: string }>(endpoint)
      .pipe(map(res => res.nextSequence));
  }

  // ==================== SQL GENERATION ENDPOINTS ====================

  generateSql(processCode: string): Observable<ApiResponse> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_GENERATE_SQL(processCode);
    return this.apiService.post<ApiResponse>(endpoint, {});
  }

  viewSql(processCode: string): Observable<SqlStatement[]> {
    const endpoint = API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_VIEW_SQL(processCode);
    return this.apiService
      .get<SqlViewResponse>(endpoint)
      .pipe(map(res => res.data ?? []));
  }
}
