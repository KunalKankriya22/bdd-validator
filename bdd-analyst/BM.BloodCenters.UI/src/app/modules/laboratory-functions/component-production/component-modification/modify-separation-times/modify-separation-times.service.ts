import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  UnitValidationResult,
  CollectionDateOption,
  SeparationTimesData,
  CentrifugeOption,
  UpdateSeparationTimesPayload,
} from './modify-separation-times.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ModifySeparationTimesService {
  private readonly apiService = inject(ApiService);

  validateUnit(unitId: string): Observable<UnitValidationResult> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService
      .get<ApiResponse<UnitValidationResult>>(API.SEPARATION_TIMES.VALIDATE_UNIT, { params })
      .pipe(map(res => res.data));
  }

  getCollectionDates(unitId: string): Observable<CollectionDateOption[]> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService
      .get<ApiResponse<CollectionDateOption[]>>(API.SEPARATION_TIMES.COLLECTION_DATES, { params })
      .pipe(map(res => res.data ?? []));
  }

  getSeparationTimes(unitId: string, collDate: string): Observable<SeparationTimesData> {
    const params = new HttpParams().set('unitId', unitId).set('collDate', collDate);
    return this.apiService
      .get<ApiResponse<SeparationTimesData>>(API.SEPARATION_TIMES.GET, { params })
      .pipe(map(res => res.data));
  }

  getCentrifuges(): Observable<CentrifugeOption[]> {
    return this.apiService
      .get<ApiResponse<CentrifugeOption[]>>(API.SEPARATION_TIMES.CENTRIFUGES)
      .pipe(map(res => res.data ?? []));
  }

  updateSeparationTimes(
    unitId: string,
    collDate: string,
    payload: UpdateSeparationTimesPayload,
  ): Observable<SeparationTimesData> {
    const params = new HttpParams().set('unitId', unitId).set('collDate', collDate);
    return this.apiService
      .put<ApiResponse<SeparationTimesData>>(API.SEPARATION_TIMES.SAVE, payload, { params })
      .pipe(map(res => res.data));
  }
}
