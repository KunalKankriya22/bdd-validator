import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { UnitValidationApiResponse } from '@shared/components/unit-id-field';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ValidateUnitResponseDto,
  UnitSystemInterdictionDto,
  ReleaseUnitSystemInterdictionsRequestDto,
  ApiResponse,
} from '../models/release-unit-system-interdiction.models';

@Injectable({
  providedIn: 'root',
})
export class ReleaseUnitSystemInterdictionService {
  private readonly apiService = inject(ApiService);
  private readonly base = API.RELEASE_UNIT_SYSTEM_INTERDICTION.BASE;

  validateUnit(unitId: string): Observable<ValidateUnitResponseDto> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResponseDto>>(
        `${this.base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.VALIDATE_UNIT}`,
        { unitId },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item ?? ({} as ValidateUnitResponseDto)),
      );
  }

  validateUnitForField(unitId: string): Observable<UnitValidationApiResponse> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResponseDto>>(
        `${this.base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.VALIDATE_UNIT}`,
        { unitId },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => {
          const dto = response?.item;
          if (!dto || !dto.isValid) {
            return {
              success: false,
              message: response?.message || 'No releasable system interdictions found for this unit.',
              errorCode: response?.errorCode ?? null,
              item: null,
            };
          }
          return {
            success: true,
            message: response.message ?? '',
            errorCode: null,
            item: {
              parsedUnitId: dto.parsedUnitId,
              checkDigit: dto.checkDigit,
              codeScheme: dto.codeScheme,
              manualUnitId: dto.manualUnitId,
              codabarUnitScheme: dto.codabarUnitScheme,
              entryMode: dto.entryMode,
              barcodeType: dto.barcodeType,
              chapterScheme: dto.chapterScheme,
              collectionDate: dto.collDate,
            },
          };
        }),
      );
  }

  getInterdictions(
    unitId: string,
    collDate: string,
  ): Observable<UnitSystemInterdictionDto[]> {
    return this.apiService
      .post<ApiResponse<UnitSystemInterdictionDto[]>>(
        `${this.base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.INTERDICTIONS}`,
        { unitId, collDate },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item ?? []),
      );
  }

  releaseInterdictions(request: ReleaseUnitSystemInterdictionsRequestDto): Observable<ApiResponse<boolean>> {
    return this.apiService
      .post<ApiResponse<boolean>>(
        `${this.base}${API.RELEASE_UNIT_SYSTEM_INTERDICTION.RELEASE}`,
        request,
      );
  }
}
