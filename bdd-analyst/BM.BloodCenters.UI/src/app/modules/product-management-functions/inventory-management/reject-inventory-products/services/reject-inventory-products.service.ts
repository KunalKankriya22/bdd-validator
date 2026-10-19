import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  RejectedInventoryItem,
  RejectionCodeItem,
  ProductCodeItem,
  RejectInventoryRequest,
  RejectInventorySearchResponse,
  RejectInventoryFilterCriteria,
  UnitValidationRequest,
  UnitValidationResponse
} from '../models/reject-inventory-products.model';

@Injectable({
  providedIn: 'root'
})
export class RejectInventoryProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Search for rejected inventory products based on filter criteria
   */
  searchRejectedInventory(
    criteria: RejectInventoryFilterCriteria,
    pageIndex: number = 0,
    pageSize: number = 10
  ): Observable<ApiResponse<RejectInventorySearchResponse>> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    if (criteria.unitId) {
      params = params.set('unitId', criteria.unitId);
    }
    if (criteria.productCode) {
      params = params.set('productCode', criteria.productCode);
    }
    if (criteria.rejectionCode) {
      params = params.set('rejectionCode', criteria.rejectionCode);
    }

    return this.http.get<ApiResponse<RejectInventorySearchResponse>>(
      `${this.baseUrl}${API.REJECT_INVENTORY_PRODUCTS.SEARCH}`,
      { params }
    );
  }

  /**
   * Validate a unit ID before rejection
   */
  validateUnit(request: UnitValidationRequest): Observable<ApiResponse<UnitValidationResponse>> {
    return this.http.post<ApiResponse<UnitValidationResponse>>(
      `${this.baseUrl}${API.REJECT_INVENTORY_PRODUCTS.VALIDATE_UNIT}`,
      request
    );
  }

  /**
   * Reject an inventory product
   */
  rejectInventoryProduct(request: RejectInventoryRequest): Observable<ApiResponse<RejectedInventoryItem>> {
    return this.http.post<ApiResponse<RejectedInventoryItem>>(
      `${this.baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECT}`,
      request
    );
  }

  /**
   * Get rejection codes lookup list
   */
  getRejectionCodes(): Observable<ApiResponse<RejectionCodeItem[]>> {
    return this.http.get<ApiResponse<RejectionCodeItem[]>>(
      `${this.baseUrl}${API.REJECT_INVENTORY_PRODUCTS.REJECTION_CODES}`
    );
  }

  /**
   * Get product codes lookup list for a specific unit
   */
  getProductCodes(unitId: string, collDate: string, codeScheme: string = 'I'): Observable<ApiResponse<ProductCodeItem[]>> {
    let params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<ProductCodeItem[]>>(
      `${this.baseUrl}${API.REJECT_INVENTORY_PRODUCTS.PRODUCT_CODES}`,
      { params }
    );
  }

}
