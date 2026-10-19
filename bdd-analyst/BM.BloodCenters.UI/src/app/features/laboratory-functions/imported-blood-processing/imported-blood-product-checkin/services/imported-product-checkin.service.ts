import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { ContractDropdownDto, ProductCodeDropdownDto } from '../models/contract.model';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Imported Product Check-In Service
 * Handles lookup operations for contracts and product codes
 * Base URL: /api/v1/imported-product-checkin
 */
@Injectable({
  providedIn: 'root'
})
export class ImportedProductCheckinService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get list of active contracts for dropdown/selection
   */
  getContracts(): Observable<ContractDropdownDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_PRODUCT_CHECKIN.GET_CONTRACTS}`;
    return this.http.get<ApiResponse<ContractDropdownDto[]>>(url).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get list of valid product codes for a specific contract
   */
  getProductsForContract(contractId: string): Observable<ProductCodeDropdownDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_PRODUCT_CHECKIN.GET_PRODUCTS_FOR_CONTRACT(contractId)}`;
    return this.http.get<ApiResponse<ProductCodeDropdownDto[]>>(url).pipe(
      map(response => response.data)
    );
  }
}
