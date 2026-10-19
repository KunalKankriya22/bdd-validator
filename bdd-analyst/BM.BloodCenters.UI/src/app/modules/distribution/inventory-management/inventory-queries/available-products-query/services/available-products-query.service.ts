import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface LookupItem {
  code: string;
  description: string | null;
}

export interface LookupsData {
  productTypes: LookupItem[];
  productCodes: LookupItem[];
  inventoryClasses: LookupItem[];
  warehouses: LookupItem[];
  bloodTypes: LookupItem[];
  attributeGroups: LookupItem[];
  attributeCodes: LookupItem[];
}

export interface LookupsResponse {
  success: boolean;
  message?: string;
  statusCode?: number;
  item: LookupsData;
  error?: string;
  errorCode?: string;
}

export interface AvailableProductsQueryRequest {
  chapterId: string;
  warehouseId: string;
  inventoryClass: string;
  productType: string;
  productCode?: string;
  bloodType?: string;
  attributeGroup?: string;
  attributeCode?: string;
  sortDirection?: string;
}

export interface AvailableProduct {
  unitId: string;
  checkDigit: string | null;
  productCode: string | null;
  aliquot: string | null;
  bloodType: string | null;
  bloodTypeDesc: string | null;
  expDate: string | null;
  collDate: string | null;
  daysToExpiration: number | null;
  warehouseId: string | null;
  inventoryClass: string | null;
  productType: string | null;
}

export interface ProductAttribute {
  attributeGroup: string;
  attributeCode: string;
  description: string;
  levelType: string;
}

export interface ProductAntigen {
  antigenCode: string;
  antigenDescription: string;
  confirmFlag: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  item?: T;
  total: number;
  error?: string;
  errorCode?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AvailableProductsQueryService {
  private readonly baseUrl = '/api/v1/inventory-management/available-products';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  // Single endpoint to get all lookups
  getLookups(attributeGroup?: string): Observable<LookupsResponse> {
    let url = `${this.baseUrl}/lookups`;
    if (attributeGroup) {
      url += `?attributeGroup=${encodeURIComponent(attributeGroup)}`;
    }
    return this.http
      .get<LookupsResponse>(url)
      .pipe(catchError((error) => this.handleError(error, 'Error loading lookup data')));
  }

  // Get product codes filtered by product type
  getProductCodes(productType: string): Observable<ApiResponse<LookupItem>> {
    return this.http
      .get<ApiResponse<LookupItem>>(
        `${this.baseUrl}/lookups/product-codes?productType=${encodeURIComponent(productType)}`
      )
      .pipe(catchError((error) => this.handleError(error, 'Error loading product codes')));
  }

  // Get attribute codes filtered by attribute group
  getAttributeCodes(attributeGroup: string): Observable<ApiResponse<LookupItem>> {
    return this.http
      .get<ApiResponse<LookupItem>>(
        `${this.baseUrl}/lookups/attribute-codes?attributeGroup=${encodeURIComponent(attributeGroup)}`
      )
      .pipe(catchError((error) => this.handleError(error, 'Error loading attribute codes')));
  }

  // Query endpoints
  queryProducts(
    request: AvailableProductsQueryRequest,
    take: number = 10,
    skip: number = 0,
  ): Observable<ApiResponse<AvailableProduct>> {
    return this.http
      .post<ApiResponse<AvailableProduct>>(`${this.baseUrl}/query/${take}/${skip}`, request)
      .pipe(
        catchError((error) => {
          if (!error?.error?.errors) {
            const msg =
              error?.error?.message || error?.message || 'Error querying available products';
            this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          }
          return throwError(() => error);
        }),
      );
  }

  getProductAttributes(unitId: string): Observable<ApiResponse<ProductAttribute>> {
    return this.http
      .get<ApiResponse<ProductAttribute>>(`${this.baseUrl}/${unitId}/attributes`)
      .pipe(
        catchError((error) => {
          const msg =
            error?.error?.message || error?.message || 'Error fetching product attributes';
          this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          return throwError(() => error);
        }),
      );
  }

  getProductAntigens(unitId: string): Observable<ApiResponse<ProductAntigen>> {
    return this.http
      .get<ApiResponse<ProductAntigen>>(`${this.baseUrl}/${unitId}/antigens`)
      .pipe(
        catchError((error) => {
          const msg =
            error?.error?.message || error?.message || 'Error fetching antigen test results';
          this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          return throwError(() => error);
        }),
      );
  }

  private handleError(error: unknown, defaultMsg: string): Observable<never> {
    const err = error as { error?: { message?: string }; message?: string };
    const msg = err?.error?.message || err?.message || defaultMsg;
    this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    return throwError(() => error);
  }
}
