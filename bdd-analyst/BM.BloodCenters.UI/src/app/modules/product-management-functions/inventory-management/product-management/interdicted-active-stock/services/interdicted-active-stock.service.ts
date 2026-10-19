import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  InterdictedProduct,
  InventoryClassOption,
  ProductTypeOption
} from '../models/interdicted-active-stock.model';

@Injectable({
  providedIn: 'root'
})
export class InterdictedActiveStockService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getInventoryClasses(): Observable<ApiResponse<InventoryClassOption[]>> {
    return this.http.get<ApiResponse<InventoryClassOption[]>>(
      `${this.baseUrl}${API.INTERDICTED_ACTIVE_STOCK.INVENTORY_CLASSES}`
    );
  }

  getProductTypes(): Observable<ApiResponse<ProductTypeOption[]>> {
    return this.http.get<ApiResponse<ProductTypeOption[]>>(
      `${this.baseUrl}${API.INTERDICTED_ACTIVE_STOCK.PRODUCT_TYPES}`
    );
  }

  getInterdictedProducts(
    inventoryClass: string,
    productType: string,
    take: number,
    skip: number,
    sortDirection: 'A' | 'D' = 'A',
    searchTerm: string = ''
  ): Observable<ApiResponse<InterdictedProduct[]>> {
    let params = new HttpParams()
      .set('take', take.toString())
      .set('skip', skip.toString())
      .set('sortDirection', sortDirection);

    if (inventoryClass) {
      params = params.set('inventoryClass', inventoryClass);
    }
    if (productType) {
      params = params.set('productType', productType);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<ApiResponse<InterdictedProduct[]>>(
      `${this.baseUrl}${API.INTERDICTED_ACTIVE_STOCK.QUERY}`,
      { params }
    );
  }
}
