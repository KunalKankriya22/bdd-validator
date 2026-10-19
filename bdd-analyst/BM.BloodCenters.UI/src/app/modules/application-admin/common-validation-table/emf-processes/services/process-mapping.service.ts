import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProcessMappingDto,
  CreateProcessMappingDto,
  UpdateProcessMappingDto,
  ProcessMappingQueryDto
} from '../interfaces/process-mapping.interface';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessMappingService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all mappings for a process code with pagination
   */
  getMappings(
    take: number,
    skip: number,
    query: ProcessMappingQueryDto
  ): Observable<{ data: ProcessMappingDto[]; totalRecords: number }> {
    return this.apiService
      .post<ReturnResult<ProcessMappingDto>>(
        API.APPLICATION_ADMIN.PROCESS_MAPPING(take, skip),
        query
      )
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        })),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get single mapping by composite key
   */
  getMappingById(processCode: string, mappingName: string): Observable<ProcessMappingDto> {
    return this.apiService
      .get<any>(API.APPLICATION_ADMIN.PROCESS_MAPPING_GET(processCode, mappingName))
      .pipe(
        map(res => {
          const data = res?.data?.[0] ?? res?.data;
          if (!data) {
            throw new Error('Mapping not found');
          }
          return data as ProcessMappingDto;
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new mapping
   */
  createMapping(payload: CreateProcessMappingDto): Observable<any> {
    return this.apiService.post(API.APPLICATION_ADMIN.PROCESS_MAPPING_CREATE, payload);
  }

  /**
   * Update existing mapping
   */
  updateMapping(
    processCode: string,
    mappingName: string,
    payload: UpdateProcessMappingDto
  ): Observable<any> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.PROCESS_MAPPING_UPDATE(processCode, mappingName),
      payload
    );
  }

  /**
   * Delete mapping (with dependency check)
   */
  deleteMapping(processCode: string, mappingName: string): Observable<any> {
    return this.apiService.delete(
      API.APPLICATION_ADMIN.PROCESS_MAPPING_DELETE(processCode, mappingName)
    );
  }

  /**
   * Check if mapping name is duplicate
   */
  checkDuplicateMappingName(
    processCode: string,
    mappingName: string,
    originalMappingName?: string
  ): Observable<boolean> {
    // If editing and name hasn't changed, it's not a duplicate
    if (originalMappingName && mappingName.toUpperCase() === originalMappingName.toUpperCase()) {
      return of(false);
    }

    return this.getMappings(1000, 0, { processCode, mappingName }).pipe(
      map(result => {
        // Check if any mapping exists with this exact name (case-insensitive)
        const isDuplicate = result.data.some(
          mapping => mapping.mappingName.toUpperCase() === mappingName.toUpperCase()
        );
        return isDuplicate;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Check if mapping is in use (referenced in emf_source_process)
   * Error Code: 24009 - Mapping is in use and cannot be deleted
   */
  checkMappingInUse(processCode: string, mappingName: string): Observable<boolean> {
    return this.apiService
      .get<{ data: { inUse: boolean } }>(API.APPLICATION_ADMIN.PROCESS_MAPPING_CHECK_USAGE(processCode, mappingName))
      .pipe(
        map(res => res?.data?.inUse ?? false),
        catchError(() => of(false))
      );
  }
}
