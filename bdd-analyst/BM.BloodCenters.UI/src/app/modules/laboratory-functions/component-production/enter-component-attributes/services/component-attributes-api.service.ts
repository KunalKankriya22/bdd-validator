import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

import {
  AddComponentAttributeRequestDto,
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
  ApiResponse,
} from '../models/component-attributes.model';

/**
 * API Service for Component Attributes
 * Handles all HTTP requests to /api/component-attributes endpoints
 */
@Injectable({ providedIn: 'root' })
export class ComponentAttributesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/component-attributes`;

  /**
   * Add a component attribute
   * POST /component-attributes
   *
   * Business Logic:
   * - Validates unit, component, and attribute
   * - Converts process date to GMT
   * - Inserts attribute
   * - Auto-inserts interdiction if attribute has inter_code
   * - Recalculates expiry if attribute has life span
   * - Resets component label if expiry changes
   */
  addComponentAttribute(request: AddComponentAttributeRequestDto): Observable<ComponentAttributeDto> {
    return this.http.post<ApiResponse<ComponentAttributeDto>>(this.baseUrl, request).pipe(
      map((res) => {
        if (!res.success || !res.item) {
          throw new Error('Invalid response from server');
        }
        return res.item;
      }),
      catchError((error) => {
        console.error('addComponentAttribute failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attributes for a specific component
   * GET /component-attributes/{unitId}/{collDate}/{productCode}
   */
  getAttributesForComponent(
    unitId: string,
    collDate: string,
    productCode: string
  ): Observable<ComponentAttributeDto[]> {
    const url = `${this.baseUrl}/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}`;

    return this.http.get<ApiResponse<ComponentAttributeDto[]>>(url).pipe(
      map((res) => res.data ?? []),
      catchError((error) => {
        console.error('getAttributesForComponent failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get valid products for a unit (LOV)
   * GET /component-attributes/products/{unitId}/{collDate}
   *
   * Returns only products with components that are not rejected and have lab status
   */
  getProductsForUnit(unitId: string, collDate: string): Observable<ComponentProductDto[]> {
    const url = `${this.baseUrl}/products/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}`;

    return this.http.get<ApiResponse<ComponentProductDto[]>>(url).pipe(
      map((res) => res.data ?? []),
      catchError((error) => {
        console.error('getProductsForUnit failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attribute groups for a product type (LOV)
   * GET /component-attributes/attribute-groups/{productType}
   *
   * Excludes 'ALERT' and 'DON' groups
   */
  getAttributeGroups(productType: string): Observable<AttributeGroupDto[]> {
    const url = `${this.baseUrl}/attribute-groups/${encodeURIComponent(productType)}`;

    return this.http.get<ApiResponse<AttributeGroupDto[]>>(url).pipe(
      map((res) => res.data ?? []),
      catchError((error) => {
        console.error('getAttributeGroups failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attribute codes for a group (LOV)
   * GET /component-attributes/attribute-codes/{productType}/{attribGroup}?unitId=&collDate=&productCode=
   *
   * Excludes attributes already assigned to the component
   */
  getAttributeCodes(
    productType: string,
    attribGroup: string,
    unitId: string,
    collDate: string,
    productCode: string
  ): Observable<AttributeCodeDto[]> {
    const url = `${this.baseUrl}/attribute-codes/${encodeURIComponent(productType)}/${encodeURIComponent(attribGroup)}`;

    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('productCode', productCode);

    return this.http.get<ApiResponse<AttributeCodeDto[]>>(url, { params }).pipe(
      map((res) => res.data ?? []),
      catchError((error) => {
        console.error('getAttributeCodes failed:', error);
        return throwError(() => error);
      })
    );
  }
}
