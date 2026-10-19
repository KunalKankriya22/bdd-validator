import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import {
  ProductTypeAttribute,
  ProductTypeAttributeResponse,
  ProductTypeAttributeParamsDto,
  CreateProductTypeAttributeDto,
  UpdateProductTypeAttributeDto
} from '../models/product-type-attribute.model';
import {
  AnticoagulantCodeLov,
  ProductTypeLov,
  AttributeGroupLov,
  AttributeCodeLov,
  ProductClassLov,
  ModifierCodeLov
} from '../models/product-type-attribute-lov.model';

@Injectable({
  providedIn: 'root'
})
export class PrdtyatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/product-type-attributes`;

  getProductTypeAttributes(
    take: number,
    skip: number,
    params?: ProductTypeAttributeParamsDto
  ): Observable<ProductTypeAttributeResponse> {
    const body = {
      searchKeyword: params?.searchKeyword || null,
      anticoagulantCode: params?.anticoagulantCode || null,
      productType: params?.productType || null,
      attribute: params?.attribute || null,
      effectiveDateFrom: params?.effectiveDateFrom || null,
      effectiveDateTo: params?.effectiveDateTo || null,
      terminationDateFrom: params?.terminationDateFrom || null,
      terminationDateTo: params?.terminationDateTo || null
    };

    return this.http.post<ProductTypeAttributeResponse>(
      `${this.baseUrl}/${take}/${skip}`,
      body
    );
  }

  getProductTypeAttribute(
    productType: string,
    attributeGroup: string,
    attributeCode: string,
    anticoagulantCode: string,
    volume: number | string
  ): Observable<ProductTypeAttribute> {
    const vol = volume ?? 0;
    const url = `${this.baseUrl}/${encodeURIComponent(productType)}/${encodeURIComponent(attributeGroup)}/${encodeURIComponent(attributeCode)}/${encodeURIComponent(anticoagulantCode)}/${vol}`;
    return this.http.get<{ data: ProductTypeAttribute }>(url).pipe(
      map(response => response.data)
    );
  }

  createProductTypeAttribute(dto: CreateProductTypeAttributeDto): Observable<any> {
    return this.http.post<any>(this.baseUrl, dto);
  }

  updateProductTypeAttribute(
    productType: string,
    attributeGroup: string,
    attributeCode: string,
    anticoagulantCode: string,
    volume: number | string,
    dto: UpdateProductTypeAttributeDto
  ): Observable<any> {
    const vol = volume ?? 0;
    const url = `${this.baseUrl}/${encodeURIComponent(productType)}/${encodeURIComponent(attributeGroup)}/${encodeURIComponent(attributeCode)}/${encodeURIComponent(anticoagulantCode)}/${vol}`;
    return this.http.put<any>(url, dto);
  }

  getAnticoagulantCodes(): Observable<AnticoagulantCodeLov[]> {
    return this.http.get<{ data: AnticoagulantCodeLov[] }>(`${this.baseUrl}/lookups/anticoagulant-codes`).pipe(
      map(response => response.data)
    );
  }

  getProductTypes(): Observable<ProductTypeLov[]> {
    return this.http.get<{ data: ProductTypeLov[] }>(`${this.baseUrl}/lookups/product-types`).pipe(
      map(response => response.data)
    );
  }

  getAttributeGroups(): Observable<AttributeGroupLov[]> {
    return this.http.get<{ data: AttributeGroupLov[] }>(`${this.baseUrl}/lookups/attribute-groups`).pipe(
      map(response => response.data)
    );
  }

  getAttributeCodes(attributeGroup: string): Observable<AttributeCodeLov[]> {
    return this.http.get<{ data: AttributeCodeLov[] }>(
      `${this.baseUrl}/lookups/attribute-codes/${encodeURIComponent(attributeGroup)}`
    ).pipe(
      map(response => response.data)
    );
  }

  getProductClasses(): Observable<ProductClassLov[]> {
    return this.http.get<{ data: ProductClassLov[] }>(`${this.baseUrl}/lookups/product-classes`).pipe(
      map(response => response.data)
    );
  }

  getModifierCodes(): Observable<ModifierCodeLov[]> {
    return this.http.get<{ data: ModifierCodeLov[]}>(`${this.baseUrl}/lookups/modifier-codes`).pipe(
      map(response => response.data)
    );
  }

  getAnticoagulantCodesFilter(): Observable<AnticoagulantCodeLov[]> {
    return this.http.get<{ data: AnticoagulantCodeLov[] }>(`${this.baseUrl}/filters/anticoagulant-codes`).pipe(
      map(response => response.data)
    );
  }

  getProductTypesFilter(): Observable<ProductTypeLov[]> {
    return this.http.get<{ data: ProductTypeLov[] }>(`${this.baseUrl}/filters/product-types`).pipe(
      map(response => response.data)
    );
  }

  getAttributesFilter(): Observable<AttributeGroupLov[]> {
    return this.http.get<{ data: AttributeGroupLov[] }>(`${this.baseUrl}/filters/attributes`).pipe(
      map(response => response.data)
    );
  }
}
