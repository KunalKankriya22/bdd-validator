import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  BagBatch,
  BagUnit,
  BagValidateUnitResponse,
  BagCatalog,
  BagLot,
  BagCheckInRequest,
  BagCheckInResponse,
  TubeFormat,
  TubeCheckInSubmitRequest,
  TubeCheckInSubmitResponse,
  TubeCheckInEntry,
  TubeValidateUnitRequest,
  TubeValidateUnitResponse,
} from '../models/bag-check-in.model';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class BagCheckInService {
  private readonly apiService = inject(ApiService);

  getBatches(): Observable<BagBatch[]> {
    return this.apiService
      .get<ApiResponse<BagBatch>>(API.BAG_CHECKIN.GET_BATCHES)
      .pipe(map(res => res.data ?? []));
  }

  getBatchDetail(batchId: string): Observable<BagBatch | null> {
    return this.apiService
      .get<ApiResponse<BagBatch>>(API.BAG_CHECKIN.GET_BATCH_DETAIL(batchId))
      .pipe(map(res => res.item ?? null));
  }

  getBatchUnits(batchId: string, sortColumn?: string, sortOrder?: string): Observable<BagUnit[]> {
    let url = API.BAG_CHECKIN.GET_BATCH_UNITS(batchId);
    if (sortColumn) {
      url += `?sortColumn=${encodeURIComponent(sortColumn)}&sortOrder=${encodeURIComponent(sortOrder ?? 'ASC')}`;
    }
    return this.apiService
      .get<ApiResponse<BagUnit>>(url)
      .pipe(map(res => res.data ?? []));
  }

  validateUnit(unitId: string): Observable<BagValidateUnitResponse> {
    return this.apiService
      .get<ApiResponse<BagValidateUnitResponse>>(API.BAG_CHECKIN.VALIDATE_UNIT(unitId))
      .pipe(map(res => res.item!));
  }

  getCatalogNumbers(): Observable<BagCatalog[]> {
    return this.apiService
      .get<ApiResponse<BagCatalog>>(API.BAG_CHECKIN.GET_CATALOG_NUMBERS)
      .pipe(map(res => res.data ?? []));
  }

  validateCatalog(catalogNumber: string): Observable<boolean> {
    return this.apiService
      .get<ApiResponse<unknown>>(API.BAG_CHECKIN.VALIDATE_CATALOG(catalogNumber))
      .pipe(map(res => res.success === true));
  }

  getLotNumbers(catalogNumber: string): Observable<BagLot[]> {
    return this.apiService
      .get<ApiResponse<BagLot>>(`${API.BAG_CHECKIN.GET_LOT_NUMBERS}?catalogNumber=${encodeURIComponent(catalogNumber)}`)
      .pipe(map(res => res.data ?? []));
  }

  checkIn(request: BagCheckInRequest): Observable<BagCheckInResponse> {
    return this.apiService
      .post<ApiResponse<BagCheckInResponse>>(API.BAG_CHECKIN.CHECK_IN, request)
      .pipe(map(res => res.item!));
  }

  getTubeFormats(): Observable<TubeFormat[]> {
    return this.apiService
      .get<ApiResponse<TubeFormat>>(API.TUBE_CHECKIN.GET_FORMATS)
      .pipe(map(res => res.data ?? []));
  }

  getTubeEntries(sortColumn?: string, sortOrder?: string): Observable<TubeCheckInEntry[]> {
    let url = API.TUBE_CHECKIN.GET_ENTRIES;
    if (sortColumn) {
      url += `?sortColumn=${encodeURIComponent(sortColumn)}&sortOrder=${encodeURIComponent(sortOrder ?? 'ASC')}`;
    }
    return this.apiService
      .get<ApiResponse<TubeCheckInEntry>>(url)
      .pipe(map(res => res.data ?? []));
  }

  /** POST /tube-checkin/validate-unit — checks error 0150 (already checked in) and 0160 (duplicate) */
  validateTubeUnit(unitId: string, tubeType: string): Observable<TubeValidateUnitResponse> {
    const body: TubeValidateUnitRequest = { unitId, tubeType };
    return this.apiService
      .post<ApiResponse<TubeValidateUnitResponse>>(API.TUBE_CHECKIN.VALIDATE_UNIT, body)
      .pipe(map(res => res.item ?? { alreadyCheckedIn: false }));
  }

  submitTubeCheckIn(request: TubeCheckInSubmitRequest): Observable<TubeCheckInSubmitResponse> {
    return this.apiService
      .post<ApiResponse<TubeCheckInSubmitResponse>>(API.TUBE_CHECKIN.SUBMIT, request)
      .pipe(map(res => res.item!));
  }
}
