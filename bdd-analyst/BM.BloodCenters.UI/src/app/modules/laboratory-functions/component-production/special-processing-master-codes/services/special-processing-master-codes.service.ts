import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SPMasterCodeDto,
  SPGroupedCodeTypeDto,
  CreateSPMasterCodeRequest,
  UpdateSPMasterCodeRequest,
  SPMasterCodeQueryParams,
  SPMasterCodeApiResponse,
  SPMasterCodePaginatedResponse,
  SPGroupedCodeTypePaginatedResponse,
} from '../models/special-processing-master-codes.model';

@Injectable({
  providedIn: 'root',
})
export class SpecialProcessingMasterCodesService {
  private readonly apiService = inject(ApiService);

  getList(
    take: number,
    skip: number,
    params: SPMasterCodeQueryParams,
  ): Observable<SPMasterCodePaginatedResponse> {
    const url = API.SPECIAL_PROCESSING_MASTER_CODES.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.codeType) payload['codeType'] = params.codeType;
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.effDate) payload['effDate'] = params.effDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;
    if (params.termDate) payload['termDate'] = params.termDate;

    return this.apiService
      .post<SPMasterCodeApiResponse<SPMasterCodeDto[]>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalRecords = response?.totalCount ?? data.length;
          return { items: data, totalRecords };
        }),
        catchError((error) => {
          console.error('Error fetching SP master codes:', error);
          return throwError(() => error);
        }),
      );
  }

  getGroupedList(
    take: number,
    skip: number,
    params: SPMasterCodeQueryParams,
  ): Observable<SPGroupedCodeTypePaginatedResponse> {
    const url = API.SPECIAL_PROCESSING_MASTER_CODES.GROUPED_LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.effDate) payload['effDate'] = params.effDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;
    if (params.termDate) payload['termDate'] = params.termDate;

    return this.apiService
      .post<SPMasterCodeApiResponse<SPGroupedCodeTypeDto[]>>(url, payload)
      .pipe(
        map((response) => {
          const data = response?.data || [];
          const totalRecords = response?.totalCount ?? data.length;
          return { items: data, totalRecords };
        }),
        catchError((error) => {
          console.error('Error fetching grouped SP master codes:', error);
          return throwError(() => error);
        }),
      );
  }

  getById(
    codeType: string,
    code: string,
  ): Observable<SPMasterCodeDto> {
    return this.apiService
      .get<SPMasterCodeApiResponse<SPMasterCodeDto>>(
        API.SPECIAL_PROCESSING_MASTER_CODES.GET_BY_ID(codeType, code),
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching SP master code:', error);
          return throwError(() => error);
        }),
      );
  }

  getCodeTypes(): Observable<string[]> {
    return this.apiService
      .get<SPMasterCodeApiResponse<string[]>>(
        API.SPECIAL_PROCESSING_MASTER_CODES.CODE_TYPES,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching code types:', error);
          return of([]);
        }),
      );
  }

  create(dto: CreateSPMasterCodeRequest): Observable<SPMasterCodeApiResponse<SPMasterCodeDto>> {
    return this.apiService
      .post<SPMasterCodeApiResponse<SPMasterCodeDto>>(
        API.SPECIAL_PROCESSING_MASTER_CODES.CREATE,
        dto,
      )
      .pipe(
        catchError((error) => {
          console.error('Error creating SP master code:', error);
          return throwError(() => error);
        }),
      );
  }

  update(
    codeType: string,
    code: string,
    dto: UpdateSPMasterCodeRequest,
  ): Observable<SPMasterCodeApiResponse<SPMasterCodeDto>> {
    return this.apiService
      .put<SPMasterCodeApiResponse<SPMasterCodeDto>>(
        API.SPECIAL_PROCESSING_MASTER_CODES.UPDATE(codeType, code),
        dto,
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating SP master code:', error);
          return throwError(() => error);
        }),
      );
  }
}
