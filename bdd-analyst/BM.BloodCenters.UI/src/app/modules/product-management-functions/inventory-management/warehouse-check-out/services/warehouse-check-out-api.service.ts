import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  WarehouseCheckOutBatchDto,
  WarehouseDropdownDto,
  CreateBatchRequestDto,
  UpdateBatchRequestDto,
  AddProductRequestDto,
  UnitLookupDto,
  ApiListResponse,
  ApiItemResponse,
} from '../models/warehouse-check-out.model';

@Injectable({
  providedIn: 'root',
})
export class WarehouseCheckOutApiService {
  private readonly apiService = inject(ApiService);

  getBatches(): Observable<WarehouseCheckOutBatchDto[]> {
    return this.apiService
      .get<ApiListResponse<WarehouseCheckOutBatchDto>>(API.WAREHOUSE_CHECKOUT.BATCHES)
      .pipe(
        map((r) => r.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  getBatchById(batchId: string): Observable<WarehouseCheckOutBatchDto> {
    return this.apiService
      .get<ApiItemResponse<WarehouseCheckOutBatchDto>>(
        API.WAREHOUSE_CHECKOUT.BATCH_BY_ID(batchId)
      )
      .pipe(
        map((r) => r.item),
        catchError((error) => throwError(() => error))
      );
  }

  getWarehouses(): Observable<WarehouseDropdownDto[]> {
    return this.apiService
      .get<ApiListResponse<WarehouseDropdownDto>>(API.WAREHOUSE_CHECKOUT.WAREHOUSES)
      .pipe(
        map((r) => r.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  createBatch(
    request: CreateBatchRequestDto
  ): Observable<ApiListResponse<{ batchId: string }>> {
    return this.apiService
      .post<ApiListResponse<{ batchId: string }>>(
        API.WAREHOUSE_CHECKOUT.CREATE_BATCH,
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateBatch(
    batchId: string,
    request: UpdateBatchRequestDto
  ): Observable<ApiListResponse<any>> {
    return this.apiService
      .put<ApiListResponse<any>>(
        API.WAREHOUSE_CHECKOUT.UPDATE_BATCH(batchId),
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  addProduct(
    batchId: string,
    request: AddProductRequestDto
  ): Observable<ApiListResponse<any>> {
    return this.apiService
      .post<ApiListResponse<any>>(
        API.WAREHOUSE_CHECKOUT.ADD_PRODUCT(batchId),
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  removeProduct(
    batchId: string,
    productCode: string,
    unitId?: string,
    aliquot?: string
  ): Observable<ApiListResponse<any>> {
    let params = new HttpParams();
    if (unitId) params = params.set('unitId', unitId);
    if (aliquot) params = params.set('aliquot', aliquot);

    return this.apiService
      .delete<ApiListResponse<any>>(
        API.WAREHOUSE_CHECKOUT.REMOVE_PRODUCT(batchId, productCode),
        { params }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  lookupUnit(unitId: string): Observable<UnitLookupDto[]> {
    return this.apiService
      .get<ApiListResponse<UnitLookupDto>>(
        API.WAREHOUSE_CHECKOUT.UNIT_LOOKUP(unitId),
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        map((r) => r.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  commitBatch(batchId: string): Observable<ApiListResponse<any>> {
    return this.apiService
      .post<ApiListResponse<any>>(
        API.WAREHOUSE_CHECKOUT.COMMIT(batchId),
        null,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }
}
