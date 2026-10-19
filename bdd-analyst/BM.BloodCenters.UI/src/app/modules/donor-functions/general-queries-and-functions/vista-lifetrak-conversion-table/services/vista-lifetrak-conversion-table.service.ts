import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { ValidMasterCodesService, MasterCodeItem } from '@shared/services/valid-master-codes.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  IdpConvRefValueDto,
  CreateIdpConvRefValueDto,
  UpdateIdpConvRefValueDto,
  IdpConvRefValueQueryDto,
  IdpConvLookupItemDto,
  IdpConvGridResponse,
} from '../models/vista-lifetrak-conversion-table.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
  totalCount?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

@Injectable({
  providedIn: 'root',
})
export class VistaLifeTrakConversionTableService {
  private readonly apiService = inject(ApiService);
  private readonly lookupService = inject(ValidMasterCodesService);

  getById(convRefId: number): Observable<IdpConvRefValueDto> {
    return this.apiService
      .get<ApiResponse<IdpConvRefValueDto>>(API.IDP_CONVERSION.GET_BY_ID(convRefId))
      .pipe(
        map((response) => response.data),
        catchError((error) => throwError(() => error))
      );
  }

  getConversionCodes(
    take: number,
    skip: number,
    params: IdpConvRefValueQueryDto
  ): Observable<IdpConvGridResponse> {
    const payload: Record<string, unknown> = {
      sourceId: params.sourceId,
      targetId: params.targetId,
    };
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;

    return this.apiService
      .post<ApiResponse<IdpConvRefValueDto[]>>(API.IDP_CONVERSION.LIST(take, skip), payload)
      .pipe(
        map((response) => ({
          data: response?.data || [],
          totalCount: response?.totalCount ?? 0,
        })),
        catchError((error) => throwError(() => error))
      );
  }

  create(dto: CreateIdpConvRefValueDto): Observable<ApiResponse<IdpConvRefValueDto>> {
    return this.apiService
      .post<ApiResponse<IdpConvRefValueDto>>(API.IDP_CONVERSION.CREATE, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  update(convRefId: number, dto: UpdateIdpConvRefValueDto): Observable<ApiResponse<IdpConvRefValueDto>> {
    return this.apiService
      .put<ApiResponse<IdpConvRefValueDto>>(API.IDP_CONVERSION.UPDATE(convRefId), dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getSourceIdLookup(): Observable<MasterCodeItem[]> {
    return this.lookupService.getByCodeType('IDPSR');
  }

  getTargetIdLookup(): Observable<MasterCodeItem[]> {
    return this.lookupService.getByCodeType('IDPTR');
  }

  getSourceTypeLookup(): Observable<MasterCodeItem[]> {
    return this.lookupService.getByCodeType('IDPTP');
  }

  getTargetTypeLookup(): Observable<MasterCodeItem[]> {
    return this.lookupService.getByCodeType('IDPTV');
  }

  getTargetValueLookups(targetCodeType: string): Observable<IdpConvLookupItemDto[]> {
    return this.apiService
      .get<ApiResponse<IdpConvLookupItemDto[]>>(API.IDP_CONVERSION.TARGET_VALUE_LOOKUPS(targetCodeType))
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }
}
