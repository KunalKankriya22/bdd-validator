import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { DockingConfigurationDto } from '../models/sterile-docking-definition.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
  totalCount?: number;
  errorResponse?: { errorCode: string; error: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class SterileDockingDefinitionService {
  private readonly apiService = inject(ApiService);

  /**
   * Search sterile docking definitions with pagination and filters
   * @param filters Search filters
   * @param take Number of records to retrieve
   * @param skip Number of records to skip
   */
  search(
    filters: any,
    take: number = 25,
    skip: number = 0
  ): Observable<PaginatedResponse<any>> {
    return this.apiService.post<PaginatedResponse<any>>(
      API.STERILE_DOCKING_DEFINITION.SEARCH(take, skip),
      filters
    );
  }

  /**
   * Get a single sterile docking definition by composite key
   * @param sdcUsNumber SDC US Number
   * @param unitId Unit ID
   * @param collDate Collection Date
   * @param chapterId Chapter ID
   * @param itemInd Item Indicator
   */
  getByKey(
    sdcUsNumber: string,
    unitId: string,
    collDate: string,
    chapterId: string,
    itemInd: string
  ): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(
      API.STERILE_DOCKING_DEFINITION.GET_BY_KEY(sdcUsNumber, unitId, collDate, chapterId, itemInd)
    );
  }

  /**
   * Create a new sterile docking definition
   * @param dto Docking configuration data
   */
  create(dto: DockingConfigurationDto): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(
      API.STERILE_DOCKING_DEFINITION.CREATE,
      dto
    );
  }

  /**
   * Update an existing sterile docking definition
   * @param sdcUsNumber SDC US Number
   * @param unitId Unit ID
   * @param collDate Collection Date
   * @param chapterId Chapter ID
   * @param itemInd Item Indicator
   * @param dto Updated docking configuration data
   */
  update(
    sdcUsNumber: string,
    unitId: string,
    collDate: string,
    chapterId: string,
    itemInd: string,
    dto: DockingConfigurationDto
  ): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(
      API.STERILE_DOCKING_DEFINITION.UPDATE(sdcUsNumber, unitId, collDate, chapterId, itemInd),
      dto
    );
  }

  /**
   * Delete a sterile docking definition (hard delete)
   * @param sdcUsNumber SDC US Number
   * @param unitId Unit ID
   * @param collDate Collection Date
   * @param chapterId Chapter ID
   * @param itemInd Item Indicator
   */
  delete(
    sdcUsNumber: string,
    unitId: string,
    collDate: string,
    chapterId: string,
    itemInd: string
  ): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      API.STERILE_DOCKING_DEFINITION.DELETE(sdcUsNumber, unitId, collDate, chapterId, itemInd)
    );
  }
}

