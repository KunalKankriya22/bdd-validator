import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductsInQuarantineResponse,
  QuarantineTypesResponse,
  ProductsInQuarantineQueryParams,
} from '../models/products-in-quarantine.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsInQuarantineApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves products in quarantine based on optional filter criteria
   * @param params Query parameters (quarantineType, take, skip)
   * @returns Observable of ProductsInQuarantineResponse
   */
  getProducts(params?: ProductsInQuarantineQueryParams): Observable<ProductsInQuarantineResponse> {
    const url = API.PRODUCTS_IN_QUARANTINE.GET_PRODUCTS(
      params?.quarantineType,
      params?.take,
      params?.skip
    );
    return this.apiService
      .get<ProductsInQuarantineResponse>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getQuarantineTypes(): Observable<QuarantineTypesResponse> {
    const url = API.PRODUCTS_IN_QUARANTINE.QUARANTINE_TYPES;
    return this.apiService
      .get<QuarantineTypesResponse>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
