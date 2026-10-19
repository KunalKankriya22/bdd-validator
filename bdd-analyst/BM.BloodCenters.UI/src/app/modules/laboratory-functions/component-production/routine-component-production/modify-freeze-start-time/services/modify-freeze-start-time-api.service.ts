import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ValidateUnitDto,
  ProductForUnitDto,
  AliquotDto,
  ComponentFreezeDetailsDto,
  UpdateFreezeStartTimeRequestDto,
  UpdateFreezeStartTimeResponseDto,
  ApiItemResponse,
  ApiItemArrayResponse,
  ApiDataArrayResponse,
} from '../models/modify-freeze-start-time.model';

@Injectable({ providedIn: 'root' })
export class ModifyFreezeStartTimeApiService {
  private readonly apiService = inject(ApiService);

  validateUnit(unitId: string): Observable<ValidateUnitDto> {
    const url = API.MODIFY_FREEZE_START_TIME.VALIDATE_UNIT(unitId);
    return this.apiService.get<ApiItemResponse<ValidateUnitDto>>(url).pipe(
      map((response) => {
        if (!response.success || !response.item) {
          throw new Error('Unit not found');
        }
        return response.item;
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  getProducts(unitId: string, collDate: string, codeScheme: string): Observable<ProductForUnitDto[]> {
    const url = API.MODIFY_FREEZE_START_TIME.GET_PRODUCTS(unitId, collDate, codeScheme);
    return this.apiService.get<ApiItemArrayResponse<ProductForUnitDto>>(url).pipe(
      map((response) => response?.item || []),
      catchError(() => throwError(() => new Error('Failed to load products'))),
    );
  }

  getAliquots(unitId: string, productCode: string, collDate: string): Observable<AliquotDto[]> {
    const url = API.MODIFY_FREEZE_START_TIME.GET_ALIQUOTS(unitId, productCode, collDate);
    return this.apiService.get<ApiItemArrayResponse<AliquotDto>>(url).pipe(
      map((response) => response?.item || []),
      catchError(() => throwError(() => new Error('Failed to load aliquots'))),
    );
  }

  getComponentDetails(
    unitId: string,
    productCode: string,
    aliquot: string,
    collDate: string,
  ): Observable<ComponentFreezeDetailsDto> {
    const url = API.MODIFY_FREEZE_START_TIME.GET_COMPONENT_DETAILS(unitId, productCode, aliquot, collDate);
    return this.apiService.get<ApiItemResponse<ComponentFreezeDetailsDto>>(url).pipe(
      map((response) => {
        if (!response.success || !response.item) {
          throw new Error('Component details not found');
        }
        return response.item;
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  updateFreezeStartTime(
    request: UpdateFreezeStartTimeRequestDto,
  ): Observable<UpdateFreezeStartTimeResponseDto> {
    const url = API.MODIFY_FREEZE_START_TIME.UPDATE;
    return this.apiService.put<ApiDataArrayResponse<UpdateFreezeStartTimeResponseDto>>(url, request).pipe(
      map((response) => {
        if (!response.success || !response.data || response.data.length === 0) {
          throw new Error('Update failed');
        }
        return response.data[0];
      }),
      catchError((error) => throwError(() => error)),
    );
  }
}
