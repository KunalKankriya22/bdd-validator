import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ValidateUnitResponseDto,
  ValidProductDto,
  ComponentSystemInterdictionDto,
  ReleaseSystemInterdictionsRequestDto,
  ApiResponse,
} from '../models/release-component-system-interdiction.models';

@Injectable({
  providedIn: 'root',
})
export class ReleaseComponentSystemInterdictionService {
  private readonly apiService = inject(ApiService);
  private readonly base = API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.BASE;

  validateUnit(unitId: string, collDate?: string, chapterId?: string): Observable<ValidateUnitResponseDto> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResponseDto>>(
        `${this.base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.VALIDATE_UNIT}`,
        { unitId, collDate, chapterId },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item ?? {} as ValidateUnitResponseDto),
      );
  }

  getValidProducts(
    unitId: string,
    collDate: string,
    codeScheme?: string,
  ): Observable<ValidProductDto[]> {
    return this.apiService
      .post<ApiResponse<ValidProductDto[]>>(
        `${this.base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.VALID_PRODUCTS}`,
        { unitId, collDate, codeScheme },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item ?? []),
      );
  }

  getInterdictions(
    unitId: string,
    collDate: string,
    productCode: string,
    codeScheme?: string,
    interCode?: string,
  ): Observable<ComponentSystemInterdictionDto[]> {
    return this.apiService
      .post<ApiResponse<ComponentSystemInterdictionDto[]>>(
        `${this.base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.INTERDICTIONS}`,
        { unitId, collDate, productCode, codeScheme, interCode: interCode || null },
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map(response => response?.item ?? []),
      );
  }

  releaseInterdictions(request: ReleaseSystemInterdictionsRequestDto): Observable<ApiResponse<{ deletedCount: number }>> {
    return this.apiService
      .post<ApiResponse<{ deletedCount: number }>>(
        `${this.base}${API.RELEASE_COMPONENT_SYSTEM_INTERDICTION.RELEASE}`,
        request,
      );
  }
}
