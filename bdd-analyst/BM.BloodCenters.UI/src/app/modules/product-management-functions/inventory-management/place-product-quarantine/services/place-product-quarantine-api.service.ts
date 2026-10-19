import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  PlaceQuarantineRequestDto,
  UnitInfoDto,
  QuarantineReasonDto,
  QuarantineProductCodeDto,
  ApiResponse,
} from '../models/place-product-quarantine.model';

@Injectable({ providedIn: 'root' })
export class PlaceProductQuarantineApiService {
  private readonly http = inject(HttpClient);

  placeQuarantine(request: PlaceQuarantineRequestDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      API.PLACE_PRODUCT_QUARANTINE.PLACE_QUARANTINE,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  getUnitInfo(
    unitId: string,
    productCode: string,
    aliquot: string
  ): Observable<UnitInfoDto> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode)
      .set('aliquot', aliquot);

    return this.http
      .get<ApiResponse<UnitInfoDto>>(API.PLACE_PRODUCT_QUARANTINE.UNIT_INFO, {
        params,
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(map((response) => response.item ?? response.data?.[0]!));
  }

  getQuarantineReasons(): Observable<QuarantineReasonDto[]> {
    return this.http
      .get<ApiResponse<QuarantineReasonDto>>(API.PLACE_PRODUCT_QUARANTINE.QUARANTINE_REASONS)
      .pipe(map((response: any) => response.item ?? response.data ?? []));
  }

  getAliquots(unitId: string, productCode: string): Observable<string[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode);

    return this.http
      .get<ApiResponse<string>>(API.PLACE_PRODUCT_QUARANTINE.ALIQUOTS, { params })
      .pipe(map((response: any) => response.item ?? response.data ?? []));
  }

  getProductCodes(unitId: string, codeScheme: string): Observable<QuarantineProductCodeDto[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('codeScheme', codeScheme);

    return this.http
      .get<any>(API.PLACE_PRODUCT_QUARANTINE.PRODUCT_CODES, { params })
      .pipe(map((response) => {
        const raw = response.item ?? response.data ?? [];
        return Array.isArray(raw) ? raw.flat() : [];
      }));
  }
}
