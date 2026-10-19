import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  HlaCrossReactiveGroupModel,
  CreateHlaCrossReactiveGroupDto,
  UpdateHlaCrossReactiveGroupDto,
  HlaCrossReactiveGroupParamsDto,
  ApiResponse,
  PublicEpitopeOption,
  HlaStandardCodeDto,
  AssociatedEpitopeOption
} from '../models/hla-cross-reactive-groups.model';

/**
 * Service for HLA Cross-Reactive Groups (Valid HLA Epitopes) API operations
 * Handles all CRUD operations and dropdown data
 */
@Injectable({
  providedIn: 'root'
})
export class HlaCrossReactiveGroupsService {
  private apiService = inject(ApiService);

  /**
   * Get paginated HLA Cross-Reactive Groups with search, filter, and sort
   * Endpoint: POST /valid-hla-epitopes/{take}/{skip}
   * @param take Number of records to fetch
   * @param skip Number of records to skip
   * @param params Search, filter, and sort parameters
   */
  getHlaCrossReactiveGroups(
    take: number,
    skip: number,
    params: HlaCrossReactiveGroupParamsDto
  ): Observable<{ data: HlaCrossReactiveGroupModel[]; total: number }> {
    return this.apiService.post<ApiResponse<HlaCrossReactiveGroupModel[]>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.SEARCH(take, skip),
      params
    ).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0
      }))
    );
  }

  /**
   * Get a single HLA Cross-Reactive Group by composite key
   * Endpoint: GET /valid-hla-epitopes/{publicEpitopeId}/{associatedEpitopeId}
   * @param publicEpitopeId Public Epitope ID
   * @param associatedEpitopeId Associated Epitope ID
   */
  getHlaCrossReactiveGroupById(
    publicEpitopeId: string,
    associatedEpitopeId: string
  ): Observable<ApiResponse<HlaCrossReactiveGroupModel>> {
    return this.apiService.get<ApiResponse<HlaCrossReactiveGroupModel>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.GET_BY_ID(publicEpitopeId, associatedEpitopeId)
    );
  }

  /**
   * Create a new HLA Cross-Reactive Group
   * Endpoint: POST /valid-hla-epitopes
   * @param data HLA Cross-Reactive Group data
   */
  createHlaCrossReactiveGroup(
    data: CreateHlaCrossReactiveGroupDto
  ): Observable<ApiResponse<string>> {
    return this.apiService.post<ApiResponse<string>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.CREATE,
      data
    );
  }

  /**
   * Update an existing HLA Cross-Reactive Group
   * Endpoint: PUT /valid-hla-epitopes/{publicEpitopeId}/{associatedEpitopeId}
   * @param publicEpitopeId Public Epitope ID
   * @param associatedEpitopeId Associated Epitope ID
   * @param data Updated HLA Cross-Reactive Group data
   */
  updateHlaCrossReactiveGroup(
    publicEpitopeId: string,
    associatedEpitopeId: string,
    data: UpdateHlaCrossReactiveGroupDto
  ): Observable<ApiResponse<string>> {
    return this.apiService.put<ApiResponse<string>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.UPDATE(publicEpitopeId, associatedEpitopeId),
      data
    );
  }

  /**
   * Get public epitope codes
   * Endpoint: GET /valid-hla-epitopes/public-epitopes
   * Returns active public epitope codes (VALID_MASTER_CODES where CODE_TYPE='PBLEP')
   */
  getPublicEpitopes(): Observable<PublicEpitopeOption[]> {
    return this.apiService.get<ApiResponse<PublicEpitopeOption[]>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.PUBLIC_EPITOPES
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get HLA standard codes from VALID_MASTER_CODES table
   * Endpoint: GET /valid-hla-epitopes/hla-standards-from-master-code
   * Used by: Add/Edit panel dropdown
   * Returns active HLA standard codes (VALID_MASTER_CODES where CODE_TYPE='HLSTD')
   */
  getHlaStandardsFromMasterCode(): Observable<HlaStandardCodeDto[]> {
    return this.apiService.get<ApiResponse<HlaStandardCodeDto[]>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.HLA_STANDARDS_FROM_MASTER_CODE
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get HLA standard codes from VALID_HLA_EPITOPES table
   * Endpoint: GET /valid-hla-epitopes/hla-standards-from-epitopes
   * Used by: Filter panel dropdown
   * Returns distinct HLA standard codes from VALID_HLA_EPITOPES
   */
  getHlaStandardsFromEpitopes(): Observable<HlaStandardCodeDto[]> {
    return this.apiService.get<ApiResponse<HlaStandardCodeDto[]>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.HLA_STANDARDS_FROM_EPITOPES
    ).pipe(
      map(response => response.data || [])
    );
  }

  getAssociatedEpitopes(): Observable<AssociatedEpitopeOption[]> {
    return this.apiService.get<ApiResponse<AssociatedEpitopeOption[]>>(
      API.RECRUITMENT.HLA_CROSS_REACTIVE_GROUPS.ASSOCIATED_EPITOPES
    ).pipe(
      map(response => response.data || [])
    );
  }
}
