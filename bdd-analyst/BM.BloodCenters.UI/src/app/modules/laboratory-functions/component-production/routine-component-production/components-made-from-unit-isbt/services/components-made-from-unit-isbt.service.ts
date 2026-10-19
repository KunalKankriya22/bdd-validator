import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  ProductTypeItem,
  AttributeItem,
  CatalogNumberItem,
  ProductDeterminationResult,
  ComponentRow,
  ComponentCreateRequest,
  ComponentCreateResponseData,
  ReprintLabelRequest,
  ReprintLabelResponseData,
  UnitValidationResult,
  ApiResponse
} from '../models/components-made-from-unit-isbt.model';

@Injectable({
  providedIn: 'root'
})
export class ComponentsMadeFromUnitIsbtService {
  private readonly apiService = inject(ApiService);
  private readonly baseUrl = '/api/v1/components-made-from-unit';

  /**
   * GET /api/v1/components-made-from-unit/dropdowns/product-types
   * Returns all valid product types (excludes CRYO) within effective date range
   */
  getProductTypes(): Observable<ProductTypeItem[]> {
    return this.apiService.get<ApiResponse<ProductTypeItem>>(`${this.baseUrl}/dropdowns/product-types`)
      .pipe(map(response => response.data));
  }

  /**
   * GET /api/v1/components-made-from-unit/dropdowns/attributes?productType={productType}
   * Returns valid attribute codes for a given product type, filtered by chapter configuration
   */
  getAttributes(productTypeCode: string): Observable<AttributeItem[]> {
    const params = new HttpParams().set('productType', productTypeCode);
    return this.apiService.get<ApiResponse<AttributeItem>>(
      `${this.baseUrl}/dropdowns/attributes`,
      { params }
    ).pipe(map(response => response.data));
  }

  /**
   * POST /api/v1/components-made-from-unit/validate-unit
   * Validates a unit ID for component production
   * Checks: unit existence, pheresis status, bleed times, bag code, product type duplication, product matrix
   */
  validateUnit(unitId: string, productType: string): Observable<UnitValidationResult> {
    return this.apiService.post<ApiResponse<UnitValidationResult>>(
      `${this.baseUrl}/validate-unit`,
      { unitId, productType }
    ).pipe(map(response => response.data[0]));
  }

  /**
   * GET /api/v1/components-made-from-unit/dropdowns/catalog-numbers?productType={productType}&unitId={unitId}
   * Returns catalog numbers valid for the product type and unit combination
   * Only shows catalogs that haven't been fully used
   */
  getCatalogNumbers(unitId: string, productTypeCode: string): Observable<CatalogNumberItem[]> {
    const params = new HttpParams()
      .set('productType', productTypeCode)
      .set('unitId', unitId);
    return this.apiService.get<ApiResponse<CatalogNumberItem>>(
      `${this.baseUrl}/dropdowns/catalog-numbers`,
      { params }
    ).pipe(map(response => response.data));
  }

  /**
   * POST /api/v1/components-made-from-unit/determine-product
   * Determines the product code from product type + catalog number + optional attribute
   * May return a single resolved product or multiple options for user selection
   */
  determineProductCode(
    unitId: string,
    collDate: string,
    productTypeCode: string,
    catalogNumber: string,
    attribCode?: string
  ): Observable<ProductDeterminationResult> {
    return this.apiService.post<ApiResponse<ProductDeterminationResult>>(
      `${this.baseUrl}/determine-product`,
      {
        unitId,
        collDate,
        productType: productTypeCode,
        catalogNumber,
        attribCode
      }
    ).pipe(map(response => response.data[0]));
  }

  /**
   * GET /api/v1/components-made-from-unit/{unitId}/components?collDate={collDate}&take={take}&skip={skip}
   * Returns all components made from a unit
   * Excludes rejected components
   * Includes volume calculation and product description
   */
  getComponents(unitId: string, collDate: string, take: number = 100, skip: number = 0): Observable<ComponentRow[]> {
    const params = new HttpParams()
      .set('collDate', collDate)
      .set('take', take.toString())
      .set('skip', skip.toString());
    return this.apiService.get<ApiResponse<ComponentRow>>(
      `${this.baseUrl}/${unitId}/components`,
      { params }
    ).pipe(map(response => response.data));
  }

  /**
   * POST /api/v1/components-made-from-unit
   * Creates a new component for the unit
   *
   * Response (201 - Created):
   * {
   *   "success": true,
   *   "statusCode": 201,
   *   "message": "Component successfully added",
   *   "data": [{
   *     "UnitId": "W633311070052",
   *     "ProductCode": "E2457V00",
   *     "CatalogNumber": "4TE0088994",
   *     "Weight": 200,
   *     "ExpiryDate": "2011-07-06T23:59:00",
   *     "ComponentPrefix": "E2",
   *     "CmvStatus": "N"
   *   }],
   *   "total": 1,
   *   "errorResponse": {"errorCode": "8010", "error": "Component successfully added"}
   * }
   *
   * Error codes:
   * - 9728: Verify product code doesn't match
   * - 4317: Weight required but not provided
   * - 0250: Weight out of range (must be 1-999.99)
   * - 0260: WB unit already separated
   * - 0230: Component creation failed (DB error)
   */
  createComponent(request: ComponentCreateRequest): Observable<ApiResponse<ComponentCreateResponseData>> {
    return this.apiService.post<ApiResponse<ComponentCreateResponseData>>(
      this.baseUrl,
      request
    );
  }

  /**
   * POST /api/v1/components-made-from-unit/reprint-label
   * Generates label data for reprinting a component label
   * Validates required fields and checks time limits for FFP-family products
   *
   * Response (200 - Success):
   * {
   *   "success": true,
   *   "message": "Label data generated",
   *   "statusCode": 200,
   *   "data": [{
   *     "unitId": "W633311070052",
   *     "productCode": "E0385V00",
   *     "productDesc": "RED BLOOD CELLS|AS5/450mL/refg...",
   *     "productType": "RBC",
   *     "collDate": "2011-05-25T00:00:00",
   *     "expiryDate": "2011-07-06T23:59:00",
   *     "cmvStatus": "N",
   *     "preprintedLabel": false,
   *     "timeLimitWarning": null
   *   }],
   *   "total": 1
   * }
   *
   * Error codes:
   * - 9741: Insufficient information, label cannot be printed
   */
  reprintLabel(request: ReprintLabelRequest): Observable<ApiResponse<ReprintLabelResponseData>> {
    return this.apiService.post<ApiResponse<ReprintLabelResponseData>>(
      `${this.baseUrl}/reprint-label`,
      request
    );
  }
}
