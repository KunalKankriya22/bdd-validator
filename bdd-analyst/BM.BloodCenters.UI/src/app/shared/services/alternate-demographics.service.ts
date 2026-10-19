import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ValidMasterCodesService } from './valid-master-codes.service';
import { API } from '../../core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '../../core/constants/http-context.constants';
import {
  AlternateDemographicsModel,
  CityStateResult,
  ValidateAlternateDemographicsRequest
} from '../models/alternate-demographics.model';
import { ApiResponse } from '../interfaces/donor.interface';
import { CountryModel } from '../models/international-address.model';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  data?: T[];
  item?: T;
  statusCode?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlternateDemographicsService {
  private readonly apiService = inject(ApiService);
  private readonly validMasterCodesService = inject(ValidMasterCodesService);

  getByDonorId(donorId: string): Observable<AlternateDemographicsModel | null> {
    return this.apiService
      .get<ReturnResult<AlternateDemographicsModel>>(API.ALTERNATE_DEMOGRAPHICS.GET(donorId))
      .pipe(map(response => response.item ?? null));
  }

  update(donorId: string, data: AlternateDemographicsModel): Observable<ReturnResult<boolean>> {
    return this.apiService.put<ReturnResult<boolean>>(
      API.ALTERNATE_DEMOGRAPHICS.UPDATE(donorId),
      data
    );
  }

  getCityStateByZip(zip: string): Observable<CityStateResult[]> {
    return this.apiService
      .get<ReturnResult<CityStateResult>>(API.ALTERNATE_DEMOGRAPHICS.CITY_STATE, {
        params: new HttpParams().set('zip', zip)
      })
      .pipe(map(response => response.data ?? []));
  }

  getCountries(): Observable<CountryModel[]> {
    return this.validMasterCodesService.getCountries();
  }

  validate(data: ValidateAlternateDemographicsRequest): Observable<ReturnResult<boolean>> {
    return this.apiService.post<ReturnResult<boolean>>(
      API.ALTERNATE_DEMOGRAPHICS.VALIDATE,
      data
    );
  }

  getZipsByCity(city: string): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<ReturnResult<unknown>>(
      API.ADD_DONOR.LOOKUPS.ZIPS(city)
    ).pipe(
      map((res) => {
        let items = res?.data;
        if (Array.isArray(items) && items.length > 0 && Array.isArray(items[0])) {
          items = items[0];
        }
        if (!Array.isArray(items)) return [];
        return items.map((item: unknown) => {
          const rec = item as Record<string, string>;
          return {
            code: rec['value'] || rec['Value'] || rec['code'] || '',
            description: rec['label'] || rec['Label'] || rec['description'] || '',
          };
        });
      }),
      catchError(() => of([]))
    );
  }

  validateAreaCode(areaCode: string): Observable<boolean> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService.get<ReturnResult<unknown>>(
      API.LOOKUPS.VALIDATE('AREAC', areaCode),
      { context }
    ).pipe(
      map(response => response?.success === true),
      catchError(() => of(false))
    );
  }
}
