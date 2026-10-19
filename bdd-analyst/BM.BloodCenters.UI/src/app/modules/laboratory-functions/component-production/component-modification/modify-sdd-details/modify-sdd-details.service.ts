import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ProductCodeOption,
  LotNumberOption,
  WaferLotOption,
  MachineOption,
  SddFormData,
  SaveSddPayload,
} from './modify-sdd-details.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ModifySddDetailsService {
  private readonly apiService = inject(ApiService);

  getProductsByUnit(unitId: string): Observable<ProductCodeOption[]> {
    return this.apiService
      .get<ApiResponse<ProductCodeOption[]>>(API.MODIFY_SDD_DETAILS.PRODUCTS_BY_UNIT(unitId))
      .pipe(map(res => res.data ?? []));
  }

  getFormData(unitId: string, productCode: string): Observable<SddFormData> {
    return this.apiService
      .get<ApiResponse<SddFormData>>(API.MODIFY_SDD_DETAILS.SEARCH(unitId, productCode))
      .pipe(map(res => res.data ?? {} as SddFormData));
  }

  getLotNumbers(unitId: string, productCode: string): Observable<LotNumberOption[]> {
    return this.apiService
      .get<ApiResponse<LotNumberOption[]>>(API.MODIFY_SDD_DETAILS.LOT_NUMBERS(unitId, productCode))
      .pipe(map(res => res.data ?? []));
  }

  getWaferLotNumbers(): Observable<WaferLotOption[]> {
    return this.apiService
      .get<ApiResponse<WaferLotOption[]>>(API.MODIFY_SDD_DETAILS.WAFER_LOT_NUMBERS)
      .pipe(map(res => res.data ?? []));
  }

  getSterileMachines(): Observable<MachineOption[]> {
    return this.apiService
      .get<ApiResponse<MachineOption[]>>(API.MODIFY_SDD_DETAILS.STERILE_MACHINES)
      .pipe(map(res => res.data ?? []));
  }

  update(payload: SaveSddPayload): Observable<void> {
    return this.apiService
      .put<ApiResponse<void>>(API.MODIFY_SDD_DETAILS.UPDATE, payload)
      .pipe(map(() => void 0));
  }
}
