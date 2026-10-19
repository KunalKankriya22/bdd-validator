import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ZipCodeStateLookup,
  ZipCodeCountyLookup,
  ZipCodeCityLookup,
  ZipCodeApiResponse,
  CreateZipCodeRequest,
  UpdateZipCodeRequest,
  ZipCodeRecord,
} from './new-zip-code.model';

@Injectable({
  providedIn: 'root',
})
export class NewZipCodeService {
  private readonly apiService = inject(ApiService);

  getStates(): Observable<ZipCodeStateLookup[]> {
    return this.apiService
      .get<ZipCodeApiResponse<ZipCodeStateLookup[]>>(API.NEW_ZIP_CODE.STATES)
      .pipe(map((res) => res.data ?? []));
  }

  getCities(state: string): Observable<ZipCodeCityLookup[]> {
    return this.apiService
      .get<ZipCodeApiResponse<{ code: string }[]>>(API.NEW_ZIP_CODE.CITIES(state))
      .pipe(
        map((res) => (res.data ?? []).map((item) => ({ code: item.code, description: item.code })))
      );
  }

  getCounties(state: string): Observable<ZipCodeCountyLookup[]> {
    return this.apiService
      .get<ZipCodeApiResponse<{ code: string }[]>>(API.NEW_ZIP_CODE.COUNTIES(state))
      .pipe(
        map((res) => (res.data ?? []).map((item) => ({ code: item.code, description: item.code })))
      );
  }

  createZipCode(payload: CreateZipCodeRequest): Observable<ZipCodeRecord> {
    return this.apiService
      .post<ZipCodeApiResponse<ZipCodeRecord>>(
        API.NEW_ZIP_CODE.CREATE,
        payload,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(map((res) => res.data));
  }

  updateZipCode(uspsId: number, payload: UpdateZipCodeRequest): Observable<ZipCodeRecord> {
    return this.apiService
      .put<ZipCodeApiResponse<ZipCodeRecord>>(
        API.NEW_ZIP_CODE.UPDATE(uspsId),
        payload,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(map((res) => res.data));
  }
}
