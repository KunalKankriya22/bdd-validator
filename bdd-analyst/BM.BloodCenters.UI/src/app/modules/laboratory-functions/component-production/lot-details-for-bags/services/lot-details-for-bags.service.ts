import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidLotDto,
  CreateValidLotDto,
  UpdateValidLotDto,
  CatalogDropdownDto,
  MasterCodeDropdownDto,
  ValidLotQueryParams,
  ValidLotApiResponse,
  ValidLotPaginatedResponse,
} from '../models/lot-details-for-bags.model';

@Injectable({
  providedIn: 'root',
})
export class LotDetailsForBagsService {
  private readonly apiService = inject(ApiService);

  getValidLots(take: number, skip: number, params: ValidLotQueryParams): Observable<ValidLotPaginatedResponse> {
    const url = API.VALID_LOTS.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.catalogNumber) payload['catalogNumber'] = params.catalogNumber;
    if (params.showExpired !== undefined) payload['showExpired'] = params.showExpired;
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;
    if (params.effDate) payload['effDate'] = params.effDate;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.termDate) payload['termDate'] = params.termDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;

    return this.apiService.post<ValidLotApiResponse<ValidLotDto[]> & { total?: number }>(url, payload).pipe(
      map((response) => {
        const data = response?.data || [];
        const totalRecords = response?.total ?? 0;
        return { items: data, totalRecords } as ValidLotPaginatedResponse;
      }),
      catchError((error) => {
        console.error('Error fetching valid lots:', error);
        return throwError(() => error);
      }),
    );
  }

  createValidLot(dto: CreateValidLotDto): Observable<ValidLotApiResponse<ValidLotDto>> {
    return this.apiService
      .post<ValidLotApiResponse<ValidLotDto>>(API.VALID_LOTS.CREATE, dto)
      .pipe(
        catchError((error) => {
          console.error('Error creating valid lot:', error);
          return throwError(() => error);
        }),
      );
  }

  updateValidLot(
    lotNumber: string,
    catalogNumber: string,
    dto: UpdateValidLotDto,
  ): Observable<ValidLotApiResponse<ValidLotDto>> {
    return this.apiService
      .put<ValidLotApiResponse<ValidLotDto>>(
        API.VALID_LOTS.UPDATE(lotNumber, catalogNumber),
        dto,
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating valid lot:', error);
          return throwError(() => error);
        }),
      );
  }

  getCatalogs(): Observable<CatalogDropdownDto[]> {
    return this.apiService
      .get<ValidLotApiResponse<CatalogDropdownDto[]>>(API.VALID_LOTS.CATALOGS)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching catalogs:', error);
          return of([]);
        }),
      );
  }

  getCmcCodes(): Observable<MasterCodeDropdownDto[]> {
    return this.apiService
      .get<ValidLotApiResponse<MasterCodeDropdownDto[]>>(API.VALID_LOTS.CMC_CODES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching CMC codes:', error);
          return of([]);
        }),
      );
  }

  getVolumeTypeSets(): Observable<MasterCodeDropdownDto[]> {
    return this.apiService
      .get<ValidLotApiResponse<MasterCodeDropdownDto[]>>(API.VALID_LOTS.VOLUME_TYPE_SETS)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching volume type sets:', error);
          return of([]);
        }),
      );
  }

  getSupplyCodes(): Observable<MasterCodeDropdownDto[]> {
    return this.apiService
      .get<ValidLotApiResponse<MasterCodeDropdownDto[]>>(API.VALID_LOTS.SUPPLY_CODES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching supply codes:', error);
          return of([]);
        }),
      );
  }
}
