import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map, switchMap, catchError, of } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import type { UnitValidationApiResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';

@Injectable()
export class SampleTransferInUnitValidationService {
  private readonly api = inject(ApiService);

  validateUnitId(unitId: string, validateFfValue: string): Observable<UnitValidationApiResponse> {
    return this.api
      .post<UnitValidationApiResponse>(
        API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
        { unitId, validateFfValue },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        switchMap(donorLibResponse => {
          if (donorLibResponse.success && donorLibResponse.item) {
            return this.checkUnitTubeExistence(donorLibResponse.item.parsedUnitId, donorLibResponse);
          }
          return of(donorLibResponse);
        }),
        catchError(err => {
          const body = err?.error;
          const errorCode = body?.errorCode ?? body?.ErrorCode;

          if (errorCode === '9712') {
            return this.retryWithSkipCollectionCenter(unitId, validateFfValue);
          }

          return of({
            success: false,
            message: body?.errorResponse?.error || body?.message || 'Unit validation failed.',
            errorCode: errorCode ?? '1230',
            item: null,
          } as UnitValidationApiResponse);
        }),
      );
  }

  private checkUnitTubeExistence(
    parsedUnitId: string,
    donorLibResponse: UnitValidationApiResponse,
  ): Observable<UnitValidationApiResponse> {
    return this.api
      .get<any>(API.SAMPLE_TRANSFER_IN.VALIDATE_UNIT(parsedUnitId), {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(
        map(transferInResponse => {
          if (transferInResponse.success) {
            return donorLibResponse;
          }
          return {
            success: false,
            message: transferInResponse.message ?? 'Unit not found or not checked in.',
            errorCode: transferInResponse.errorCode ?? '1230',
            item: null,
          } as UnitValidationApiResponse;
        }),
        catchError(err => {
          const body = err?.error;
          return of({
            success: false,
            message: body?.errorResponse?.error || body?.message || 'Unit validation failed.',
            errorCode: body?.errorCode ?? '1230',
            item: null,
          } as UnitValidationApiResponse);
        }),
      );
  }

  private retryWithSkipCollectionCenter(
    unitId: string,
    validateFfValue: string,
  ): Observable<UnitValidationApiResponse> {
    return this.api
      .post<UnitValidationApiResponse>(
        API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
        { unitId, validateFfValue, skipCollectionCenter: true },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        switchMap(retryResponse => {
          if (retryResponse.success && retryResponse.item) {
            return this.checkUnitTubeExistence(retryResponse.item.parsedUnitId, retryResponse);
          }
          return of(retryResponse);
        }),
        catchError(retryErr => {
          const body = retryErr?.error;
          return of({
            success: false,
            message: body?.errorResponse?.error || body?.message || 'Unit validation failed.',
            errorCode: body?.errorCode ?? '1230',
            item: null,
          } as UnitValidationApiResponse);
        }),
      );
  }
}
