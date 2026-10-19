import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  LicensedProductsResponse,
  LicensedProductRequest,
  LicensedProductParamsDto,
  Chapter,
  ValidProduct,
  LicensedProductsApiResponse,
  LicensedProductDto
} from '../models/licensed-products.model';

interface ChapterLookupDto {
  chapterId: string;
  chapterName: string;
}

@Injectable({
  providedIn: 'root'
})
export class LicensedProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/licensed-products`;

  // Cache for valid products (Observable)
  private validProducts$?: Observable<ValidProduct[]>;

  // Cache for valid products (synchronous data)
  private cachedValidProducts: ValidProduct[] = [];

  /**
   * Get licensed products with pagination and filtering
   * Backend: POST /licensed-products/{take}/{skip} with body
   */
  getLicensedProducts(
    chapterId: string,
    pageSize: number,
    skip: number,
    params?: LicensedProductParamsDto
  ): Observable<LicensedProductsResponse> {
    const body = {
      chapterId: chapterId,
      searchKeyword: params?.searchKeyword || null,
      sortColumn: params?.sortColumn || null,
      sortOrder: params?.sortOrder || null
    };

    return this.http.post<LicensedProductsApiResponse>(`${this.baseUrl}/${pageSize}/${skip}`, body).pipe(
      map(response => ({
        data: response.item?.map((item: LicensedProductDto) => ({
          ...item,
          productDescription: item.productDesc // Map ProductDesc to ProductDescription
        })) || [],
        total: response.total || 0
      }))
    );
  }

  /**
   * Get all active chapters for licensed products
   * Backend: GET /api/v1/licensed-products/active/lookup
   */
  getChapters(): Observable<Chapter[]> {
    return this.http.get<ChapterLookupDto[]>(`${this.baseUrl}/active/lookup`).pipe(
      map(chapters => chapters || [])
    );
  }

  /**
   * Get all active valid products (cached)
   * Backend: GET /licensed-products/product-codes
   */
  getValidProducts(): Observable<ValidProduct[]> {
    if (!this.validProducts$) {
      this.validProducts$ = this.http.get<any>(`${this.baseUrl}/product-codes`).pipe(
        map(response => response.item?.map((item: any) => ({
          productCode: item.productCode,
          productDesc: item.productDesc
        })) || []),
        map(products => {
          // Store in synchronous cache
          this.cachedValidProducts = products;
          return products;
        }),
        shareReplay(1)
      );
    }
    return this.validProducts$;
  }

  /**
   * Get cached valid products synchronously (returns empty array if not loaded yet)
   */
  getCachedValidProducts(): ValidProduct[] {
    return this.cachedValidProducts;
  }

  /**
   * Clear cached valid products (call after adding new product)
   */
  clearValidProductsCache(): void {
    this.validProducts$ = undefined;
    this.cachedValidProducts = [];
  }

  /**
   * Get licensed product by product code and chapter
   * Backend: POST /licensed-products/{productCode}/details with chapterId in body
   */
  getLicensedProductById(productCode: string, chapterId: string): Observable<LicensedProductDto> {
    const body = {
      chapterId: chapterId
    };
    return this.http.post<LicensedProductDto>(`${this.baseUrl}/${productCode}/details`, body);
  }

  /**
   * Create new licensed product
   * Backend: POST /licensed-products with chapterId in body
   */
  createLicensedProduct(request: LicensedProductRequest, chapterId: string): Observable<void> {
    const body = {
      chapterId: chapterId,
      productCode: request.productCode,
      osokFlag: request.osokFlag,
      effDate: request.effDate,
      termDate: request.termDate
    };
    return this.http.post<void>(this.baseUrl, body);
  }

  /**
   * Update existing licensed product
   * Backend: PUT /licensed-products/{productCode} with chapterId in body
   */
  updateLicensedProduct(
    productCode: string,
    chapterId: string,
    request: Partial<LicensedProductRequest>
  ): Observable<void> {
    const body = {
      chapterId: chapterId,
      osokFlag: request.osokFlag,
      effDate: request.effDate,
      termDate: request.termDate
    };
    return this.http.put<void>(`${this.baseUrl}/${productCode}`, body);
  }
}
