import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  PathogenReductionProcessConfiguration,
  PathogenReductionProcessConfigurationFilter,
  CreatePathogenReductionProcessConfiguration,
  UpdatePathogenReductionProcessConfiguration,
  LookupValue
} from '../models/pathogen-reduction-process-configuration.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode?: string;
    error?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PathogenReductionProcessConfigurationService {
  private readonly apiService = inject(ApiService);

  /**
   * Get pathogen reduction configurations with pagination and filters
   * POST /api/v1/pathogen-reduction-config/{take}/{skip}
   */
  getConfigurations(
    take: number,
    skip: number,
    params: PathogenReductionProcessConfigurationFilter
  ): Observable<{ data: PathogenReductionProcessConfiguration[]; totalRecords: number }> {
    const endpoint = API.PATHOGEN_REDUCTION.LIST(take, skip);

    return this.apiService.post<ReturnResult<PathogenReductionProcessConfiguration>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new pathogen reduction configuration
   * POST /api/v1/pathogen-reduction-config
   */
  createConfiguration(data: CreatePathogenReductionProcessConfiguration): Observable<ReturnResult<PathogenReductionProcessConfiguration>> {
    const endpoint = API.PATHOGEN_REDUCTION.CREATE;

    return this.apiService.post<ReturnResult<PathogenReductionProcessConfiguration>>(endpoint, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing pathogen reduction configuration
   * PUT /api/v1/pathogen-reduction-config/{volumeTypeSet}
   */
  updateConfiguration(
    volumeTypeSet: string,
    data: UpdatePathogenReductionProcessConfiguration
  ): Observable<ReturnResult<PathogenReductionProcessConfiguration>> {
    const endpoint = API.PATHOGEN_REDUCTION.UPDATE(volumeTypeSet);

    return this.apiService.put<ReturnResult<PathogenReductionProcessConfiguration>>(endpoint, data).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get configuration by volume type set
   * GET /api/v1/pathogen-reduction-config/{volumeTypeSet}
   */
  getConfigurationById(volumeTypeSet: string): Observable<PathogenReductionProcessConfiguration[]> {
    const endpoint = API.PATHOGEN_REDUCTION.GET_BY_ID(volumeTypeSet);

    return this.apiService.get<ReturnResult<PathogenReductionProcessConfiguration>>(endpoint).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get volume type sets for dropdown
   * GET /api/v1/pathogen-reduction-config/lookups/volume-type-sets
   */
  getVolumeTypeSets(): Observable<LookupValue[]> {
    const endpoint = API.PATHOGEN_REDUCTION.VOLUME_TYPE_SETS;

    return this.apiService.get<ReturnResult<LookupValue>>(endpoint).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get suspension types for dropdown
   * GET /api/v1/pathogen-reduction-config/lookups/suspension-types
   */
  getSuspensionTypes(): Observable<LookupValue[]> {
    const endpoint = API.PATHOGEN_REDUCTION.SUSPENSION_TYPES;

    return this.apiService.get<ReturnResult<LookupValue>>(endpoint).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get equipment types for dropdown
   * GET /api/v1/pathogen-reduction-config/equipment-types
   */
  getEquipmentTypes(): Observable<LookupValue[]> {
    const endpoint = API.PATHOGEN_REDUCTION.EQUIPMENT_TYPES;

    return this.apiService.get<ReturnResult<LookupValue>>(endpoint).pipe(
      map(response => response.data ?? []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
