import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  ReturnResult,
  BatchIdLovDto,
  CreateLabWarehouseCheckoutDto,
  UpdateLabWarehouseCheckoutDto,
  LabWarehouseCheckoutDto,
  LabWarehouseCheckoutQueryDto,
  ValidProductDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ValidateProductRequestDto,
  ValidateProductResponseDto
} from '../models/lab-warehouse-checkout.model';

/**
 * Lab Warehouse Checkout API Service
 * JIRA: MLT-12943 | Base: /lab-warehouse-checkout
 */
@Injectable({
  providedIn: 'root'
})
export class LabWarehouseCheckoutApiService {
  private apiService = inject(ApiService);
  private readonly baseUrl = 'api/v1/lab-warehouse-checkout';

  getCheckoutRecords(
    take: number,
    skip: number,
    query: LabWarehouseCheckoutQueryDto
  ): Observable<ReturnResult<LabWarehouseCheckoutDto>> {
    return this.apiService.post<ReturnResult<LabWarehouseCheckoutDto>>(
      `${this.baseUrl}/${take}/${skip}`,
      query
    );
  }

  getCheckoutById(
    batchId: string,
    unitId: string,
    productCode: string
  ): Observable<ReturnResult<LabWarehouseCheckoutDto>> {
    return this.apiService.get<ReturnResult<LabWarehouseCheckoutDto>>(
      `${this.baseUrl}/${encodeURIComponent(batchId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`
    );
  }

  createCheckout(
    dto: CreateLabWarehouseCheckoutDto
  ): Observable<ReturnResult<LabWarehouseCheckoutDto>> {
    return this.apiService.post<ReturnResult<LabWarehouseCheckoutDto>>(
      this.baseUrl,
      dto
    );
  }

  updateCheckout(
    batchId: string,
    unitId: string,
    productCode: string,
    dto: UpdateLabWarehouseCheckoutDto
  ): Observable<ReturnResult<LabWarehouseCheckoutDto>> {
    return this.apiService.put<ReturnResult<LabWarehouseCheckoutDto>>(
      `${this.baseUrl}/${encodeURIComponent(batchId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`,
      dto
    );
  }

  deleteCheckout(
    batchId: string,
    unitId: string,
    productCode: string
  ): Observable<ReturnResult<boolean>> {
    return this.apiService.delete<ReturnResult<boolean>>(
      `${this.baseUrl}/${encodeURIComponent(batchId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(productCode)}`
    );
  }

  getBatchIdLov(): Observable<BatchIdLovDto[]> {
    return this.apiService.get<ReturnResult<BatchIdLovDto>>(
      `${this.baseUrl}/batch-id-lov`
    ).pipe(
      map(response => response.data ?? [])
    );
  }

  getValidProducts(
    unitId: string,
    warehouseId?: string
  ): Observable<ValidProductDto[]> {
    let params = new HttpParams().set('unitId', unitId);
    if (warehouseId) params = params.set('warehouseId', warehouseId);

    return this.apiService.get<ReturnResult<ValidProductDto>>(
      `${this.baseUrl}/valid-products`,
      { params }
    ).pipe(
      map(response => response.data ?? [])
    );
  }

  closeBatch(batchId: string): Observable<ReturnResult<object>> {
    return this.apiService.post<ReturnResult<object>>(
      `${this.baseUrl}/close-batch/${encodeURIComponent(batchId)}`,
      {}
    );
  }

  /**
   * Validate unit for checkout - returns warnings if any
   * POST /lab-warehouse-checkout/validate-unit
   */
  validateUnit(request: ValidateUnitRequestDto): Observable<ValidateUnitResponseDto> {
    return this.apiService.post<{ success: boolean; statusCode: number; item: ValidateUnitResponseDto }>(
      `${this.baseUrl}/validate-unit`,
      request
    ).pipe(
      map(response => response.item)
    );
  }

  /**
   * Validate product for checkout - returns warnings if any
   * POST /lab-warehouse-checkout/validate-product
   */
  validateProduct(request: ValidateProductRequestDto): Observable<ValidateProductResponseDto> {
    return this.apiService.post<{ success: boolean; statusCode: number; item: ValidateProductResponseDto }>(
      `${this.baseUrl}/validate-product`,
      request
    ).pipe(
      map(response => response.item)
    );
  }
}
