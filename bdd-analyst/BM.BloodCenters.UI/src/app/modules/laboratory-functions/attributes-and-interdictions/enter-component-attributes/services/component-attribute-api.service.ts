import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
  SaveComponentAttributeRequest,
} from '../models/component-attribute.model';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data: T;
  total?: number;
}

/**
 * API Service for Component Attributes
 * MLT-13081: Fixed to use Laboratory module endpoints (plural: /component-attributes)
 * Note: ProductAttributes module uses singular: /component-attribute
 */
@Injectable()
export class ComponentAttributeApiService {
  private readonly baseUrl = '/api/v1/component-attributes';

  constructor(private readonly http: HttpClient) {}

  /**
   * Get all attributes for a component (Laboratory module endpoint)
   * GET /api/v1/component-attributes/{unitId}/{collDate}/{productCode}
   */
  getComponentAttributes(
    unitId: string,
    collDate: string,
    productCode: string,
    attribGroup?: string,
    attribCode?: string,
    take: number = 100,
    skip: number = 0
  ): Observable<ComponentAttributeDto[]> {
    // Format date as ISO 8601 datetime string
    const dateTime = collDate.includes('T') ? collDate : `${collDate}T00:00:00`;

    const url = `${this.baseUrl}/${unitId}/${dateTime}/${productCode}`;
    console.log('📞 Get attributes API call:');
    console.log('   URL:', url);

    return this.http.get<ApiResponse<any[]>>(url).pipe(
      map(response => {
        console.log('✅ Get attributes response:', response);
        const items = response.data || [];
        if (items.length > 0) {
          console.log('📋 Raw API item keys:', Object.keys(items[0]));
          console.log('📋 Raw API first item:', JSON.stringify(items[0]));
        }
        return items.map(item => this.normalizeAttribute(item));
      })
    );
  }

  /**
   * Get valid products for a unit (Laboratory module endpoint)
   * GET /api/v1/component-attributes/products/{unitId}/{collDate}?codeScheme=I
   */
  getProductsForUnit(unitId: string, collDate: string, codeScheme: string = 'I'): Observable<ComponentProductDto[]> {
    // Format date as ISO 8601 datetime string
    const dateTime = collDate.includes('T') ? collDate : `${collDate}T00:00:00`;
    const params = new HttpParams().set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<ComponentProductDto[]>>(
      `${this.baseUrl}/products/${unitId}/${dateTime}`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get attribute groups for a product type (Laboratory module endpoint)
   * GET /api/v1/component-attributes/attribute-groups/{productType}?codeScheme=I
   */
  getAttributeGroups(productType: string, productCode: string, codeScheme: string = 'I'): Observable<AttributeGroupDto[]> {
    const params = new HttpParams().set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<AttributeGroupDto[]>>(
      `${this.baseUrl}/attribute-groups/${productType}`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get attribute codes for a group (Laboratory module endpoint)
   * GET /api/v1/component-attributes/attribute-codes/{productType}/{attribGroup}?unitId={unitId}&collDate={collDate}&productCode={productCode}
   */
  getAttributeCodes(
    productType: string,
    attribGroup: string,
    unitId: string,
    collDate: string,
    productCode: string,
    codeScheme: string = 'I'
  ): Observable<AttributeCodeDto[]> {
    // Format date as ISO 8601 datetime string
    const dateTime = collDate.includes('T') ? collDate : `${collDate}T00:00:00`;
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', dateTime)
      .set('productCode', productCode);

    return this.http.get<ApiResponse<AttributeCodeDto[]>>(
      `${this.baseUrl}/attribute-codes/${productType}/${attribGroup}`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Lookup ALL attribute codes for a group (without exclusion filter).
   * Used to get descriptions for codes already assigned to the component.
   */
  lookupAttributeCodes(
    productType: string,
    attribGroup: string,
  ): Observable<AttributeCodeDto[]> {
    return this.http.get<ApiResponse<AttributeCodeDto[]>>(
      `${this.baseUrl}/attribute-codes/${productType}/${attribGroup}`,
    ).pipe(
      map(response => response.data || [])
    );
  }

  private normalizeAttribute(item: any): ComponentAttributeDto {
    return {
      unitId: item.unitId ?? item.UnitId ?? '',
      collDate: item.collDate ?? item.CollDate ?? item.collDats ?? item.CollDats ?? '',
      chapterId: item.chapterId ?? item.ChapterId ?? '',
      productCode: item.productCode ?? item.ProductCode ?? '',
      productDesc: item.productDesc ?? item.ProductDesc ?? item.productDescription ?? item.ProductDescription ?? item.description ?? item.Description ?? null,
      productType: item.productType ?? item.ProductType ?? null,
      attribGroup: item.attribGroup ?? item.AttribGroup ?? item.attributeGroup ?? item.AttributeGroup ?? '',
      attribCode: item.attribCode ?? item.AttribCode ?? item.attributeCode ?? item.AttributeCode ?? '',
      attribDesc: item.attribDesc ?? item.AttribDesc ?? item.attribDescription ?? item.AttribDescription ?? item.description ?? item.Description ?? item.attributeDescription ?? item.AttributeDescription ?? null,
      procDate: item.procDate ?? item.ProcDate ?? item.procDats ?? item.ProcDats ?? item.processDate ?? item.ProcessDate ?? item.processDats ?? item.ProcessDats ?? null,
      insertDate: item.insertDate ?? item.InsertDate ?? item.insertDats ?? item.InsertDats ?? new Date(),
      insertUser: item.insertUser ?? item.InsertUser ?? item.insertUserId ?? item.InsertUserId ?? '',
      programId: item.programId ?? item.ProgramId ?? null,
      expiryDate: item.expiryDate ?? item.ExpiryDate ?? item.componentExpiryDate ?? item.ComponentExpiryDate ?? item.expirationDate ?? item.ExpirationDate ?? null,
      newExpiryDate: item.newExpiryDate ?? item.NewExpiryDate ?? null,
      interCode: item.interCode ?? item.InterCode ?? null,
    };
  }

  /**
   * Save a new component attribute (Laboratory module endpoint)
   * POST /api/v1/component-attributes
   */
  saveComponentAttribute(request: SaveComponentAttributeRequest): Observable<ComponentAttributeDto> {
    return this.http.post<ApiResponse<ComponentAttributeDto>>(this.baseUrl, request).pipe(
      map(response => response.data)
    );
  }
}
