import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductAntigenSearchRequest,
  ProductAntigenSearchResponse,
  ProductTypeOption,
  AboRhTypeOption,
  InventoryClassOption,
  AntigenGroupOption,
  WarehouseOption,
  ValidAntigenOption,
  AntigenGroupDetail,
  ApiResponse
} from '../models/products-with-antigens.models';

@Injectable({
  providedIn: 'root'
})
export class ProductsWithAntigensService {
  private readonly apiService = inject(ApiService);

  /**
   * Search for products with specified antigen criteria
   * POST /api/v1/products-with-antigens/search
   */
  searchProducts(request: ProductAntigenSearchRequest): Observable<ProductAntigenSearchResponse> {
    return this.apiService
      .post<ApiResponse<ProductAntigenSearchResponse | ProductAntigenSearchResponse[]>>(
        API.PRODUCTS_WITH_ANTIGENS.SEARCH,
        request
      )
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0) {
            return data[0] as ProductAntigenSearchResponse;
          }
          return (data as ProductAntigenSearchResponse) || {
            results: [],
            totalCount: 0,
            pageSize: request.take || 10,
            offset: request.skip || 0
          };
        }),
        catchError(error => {
          console.error('Error searching products with antigens:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get product type dropdown options
   * GET /api/v1/products-with-antigens/dropdowns/product-types
   */
  getProductTypes(): Observable<ProductTypeOption[]> {
    return this.apiService
      .get<ApiResponse<ProductTypeOption[] | ProductTypeOption[][]>>(API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.PRODUCT_TYPES)
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] as ProductTypeOption[];
          }
          return (data as ProductTypeOption[]) || [];
        }),
        catchError(error => {
          console.error('Error fetching product types:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get ABO/Rh type dropdown options
   * GET /api/v1/products-with-antigens/dropdowns/abo-rh-types
   */
  getAboRhTypes(): Observable<AboRhTypeOption[]> {
    return this.apiService
      .get<ApiResponse<AboRhTypeOption[] | AboRhTypeOption[][]>>(API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.ABO_RH_TYPES)
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] as AboRhTypeOption[];
          }
          return (data as AboRhTypeOption[]) || [];
        }),
        catchError(error => {
          console.error('Error fetching ABO/Rh types:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get inventory class dropdown options
   * GET /api/v1/products-with-antigens/dropdowns/inventory-classes
   */
  getInventoryClasses(): Observable<InventoryClassOption[]> {
    return this.apiService
      .get<ApiResponse<InventoryClassOption[] | InventoryClassOption[][]>>(API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.INVENTORY_CLASSES)
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] as InventoryClassOption[];
          }
          return (data as InventoryClassOption[]) || [];
        }),
        catchError(error => {
          console.error('Error fetching inventory classes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get antigen group dropdown options
   * GET /api/v1/products-with-antigens/dropdowns/antigen-groups
   */
  getAntigenGroups(): Observable<AntigenGroupOption[]> {
    return this.apiService
      .get<ApiResponse<AntigenGroupOption[] | AntigenGroupOption[][]>>(API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.ANTIGEN_GROUPS)
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] as AntigenGroupOption[];
          }
          return (data as AntigenGroupOption[]) || [];
        }),
        catchError(error => {
          console.error('Error fetching antigen groups:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get warehouse dropdown options
   * GET /api/v1/products-with-antigens/dropdowns/warehouses
   */
  getWarehouses(): Observable<WarehouseOption[]> {
    return this.apiService
      .get<ApiResponse<WarehouseOption[] | WarehouseOption[][]>>(API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.WAREHOUSES)
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] as WarehouseOption[];
          }
          return (data as WarehouseOption[]) || [];
        }),
        catchError(error => {
          console.error('Error fetching warehouses:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get valid antigens for dropdown
   * GET /api/v1/products-with-antigens/dropdowns/valid-antigens
   */
  getValidAntigens(): Observable<ValidAntigenOption[]> {
    return this.apiService
      .get<ApiResponse<ValidAntigenOption[] | ValidAntigenOption[][]>>(API.PRODUCTS_WITH_ANTIGENS.DROPDOWNS.VALID_ANTIGENS)
      .pipe(
        map(response => {
          const data = response?.data;
          if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] as ValidAntigenOption[];
          }
          return (data as ValidAntigenOption[]) || [];
        }),
        catchError(error => {
          console.error('Error fetching valid antigens:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get antigen group detail with pre-defined antigen criteria
   * GET /api/v1/products-with-antigens/antigen-groups/{groupCode}/detail
   */
  getAntigenGroupDetail(groupCode: string): Observable<AntigenGroupDetail> {
    return this.apiService
      .get<ApiResponse<AntigenGroupDetail>>(
        API.PRODUCTS_WITH_ANTIGENS.ANTIGEN_GROUP_DETAIL(groupCode)
      )
      .pipe(
        map(response => response?.data || {
          groupCode: '',
          groupDescription: '',
          antigens: []
        }),
        catchError(error => {
          console.error('Error fetching antigen group detail:', error);
          return throwError(() => error);
        })
      );
  }
}
