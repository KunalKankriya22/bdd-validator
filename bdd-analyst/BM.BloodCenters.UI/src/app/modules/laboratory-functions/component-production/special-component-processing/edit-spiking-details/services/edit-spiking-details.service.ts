import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ComponentSpikingDto,
  UpdateComponentSpikingDto,
  ProcessCodeDropdownDto,
  SpikingTypeDropdownDto,
  ProductCodeDropdownDto,
  LotNumberDropdownDto,
  ComponentPrefixDropdownDto,
  UnitCollectionDateDto,
  ApiResponse,
} from '../models/edit-spiking-details.model';

@Injectable({
  providedIn: 'root',
})
export class EditSpikingDetailsService {
  private readonly apiService = inject(ApiService);

  getByKey(
    unitId: string,
    collDate: string,
    productCode: string,
    componentPrefix: string,
    processCode: string
  ): Observable<ComponentSpikingDto | null> {
    const params = new URLSearchParams({
      unitId,
      collDate,
      productCode,
      componentPrefix,
      processCode,
    });

    return this.apiService
      .get<ApiResponse<ComponentSpikingDto>>(`${API.EDIT_SPIKING_DETAILS.GET}?${params.toString()}`)
      .pipe(
        map((response) => response?.data || null),
        catchError((error) => throwError(() => error))
      );
  }

  update(
    unitId: string,
    collDate: string,
    productCode: string,
    componentPrefix: string,
    processCode: string,
    dto: UpdateComponentSpikingDto
  ): Observable<ApiResponse<ComponentSpikingDto>> {
    const params = new URLSearchParams({
      unitId,
      collDate,
      productCode,
      componentPrefix,
      processCode,
    });

    return this.apiService
      .put<ApiResponse<ComponentSpikingDto>>(`${API.EDIT_SPIKING_DETAILS.UPDATE}?${params.toString()}`, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getProcessCodes(): Observable<ProcessCodeDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<ProcessCodeDropdownDto[]>>(API.EDIT_SPIKING_DETAILS.PROCESS_CODES)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }

  getSpikingTypes(): Observable<SpikingTypeDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<SpikingTypeDropdownDto[]>>(API.EDIT_SPIKING_DETAILS.SPIKING_TYPES)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }

  getBagLotNumbers(): Observable<LotNumberDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<LotNumberDropdownDto[]>>(API.EDIT_SPIKING_DETAILS.BAG_LOT_NUMBERS)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }

  getFilterLotNumbers(): Observable<LotNumberDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<LotNumberDropdownDto[]>>(API.EDIT_SPIKING_DETAILS.FILTER_LOT_NUMBERS)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }

  getProductCodes(unitId: string, collDate: string, processCode: string, chapterId: string): Observable<ProductCodeDropdownDto[]> {
    const params = new URLSearchParams({
      unitId,
      collDate,
      processCode,
      chapterId,
    });

    return this.apiService
      .get<ApiResponse<ProductCodeDropdownDto[]>>(`${API.EDIT_SPIKING_DETAILS.PRODUCT_CODES}?${params.toString()}`)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }

  getComponentPrefixes(
    unitId: string,
    collDate: string,
    productCode: string,
    processCode: string
  ): Observable<ComponentPrefixDropdownDto[]> {
    const params = new URLSearchParams({
      unitId,
      collDate,
      productCode,
      processCode,
    });

    return this.apiService
      .get<ApiResponse<ComponentPrefixDropdownDto[]>>(`${API.EDIT_SPIKING_DETAILS.COMPONENT_PREFIXES}?${params.toString()}`)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }

  getUnitCollectionDates(unitId: string, processCode: string, chapterId: string): Observable<UnitCollectionDateDto[]> {
    const params = new URLSearchParams({
      unitId,
      processCode,
      chapterId,
    });

    return this.apiService
      .get<ApiResponse<UnitCollectionDateDto[]>>(`${API.EDIT_SPIKING_DETAILS.UNIT_COLLECTION_DATES}?${params.toString()}`)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([]))
      );
  }
}
