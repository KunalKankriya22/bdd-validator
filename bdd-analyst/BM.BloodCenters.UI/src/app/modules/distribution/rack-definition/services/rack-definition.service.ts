import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  RackDetailListDto,
  RackDetailQueryDto,
  CreateRackDetailDto,
  UpdateRackDetailDto,
  LovOption,
  ReturnResult
} from '../models/rack-definition.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class RackDefinitionService {
  private readonly apiService = inject(ApiService);

  getRackDetails(
    take: number,
    skip: number,
    queryDto: RackDetailQueryDto
  ): Observable<{ data: RackDetailListDto[]; totalRecords: number }> {
    return this.apiService
      .post<ReturnResult<RackDetailListDto>>(API.RACK_DEFINITION.GET_PAGINATED(take, skip), queryDto)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  createRack(dto: CreateRackDetailDto): Observable<ReturnResult<any>> {
    return this.apiService.post(API.RACK_DEFINITION.CREATE, dto);
  }

  updateRack(dto: UpdateRackDetailDto): Observable<ReturnResult<any>> {
    return this.apiService.put(API.RACK_DEFINITION.UPDATE, dto);
  }

  getWarehouseLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.WAREHOUSE_LOV);
  }

  getDeviceTypeLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.DEVICE_TYPE_LOV);
  }

  getDeviceNumberLov(warehouseId: string, deviceType: string): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.DEVICE_NUMBER_LOV(warehouseId, deviceType));
  }

  getStorageTypeLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.STORAGE_TYPE_LOV);
  }

  getProductTypeLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.PRODUCT_TYPE_LOV);
  }

  getAboRhLov(): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.ABORH_LOV);
  }

  getFilterRackNumbers(wId: string, dType: string, dNum: string, sClass: string): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.FILTER_RACK_NUMBERS(wId, dType, dNum, sClass));
  }

  getFilterProductTypes(wId: string, dType: string, dNum: string, sClass: string): Observable<ReturnResult<LovOption>> {
    return this.apiService.get(API.RACK_DEFINITION.FILTER_PRODUCT_TYPES(wId, dType, dNum, sClass));
  }
}
