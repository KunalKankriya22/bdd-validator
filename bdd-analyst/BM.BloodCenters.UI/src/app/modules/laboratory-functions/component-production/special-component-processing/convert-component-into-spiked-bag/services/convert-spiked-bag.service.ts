import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { ApiResponse } from '@features/dcattr/dcattr.models';
import {
  ProcessCode,
  ProductType,
  AttributeGroup,
  AttributeCode,
  CatalogNumber,
  UnitValidationResponse,
  DeriveProductRequest,
  DeriveProductResponse,
  VerifyProductRequest,
  ConvertComponentRequest,
  ConvertComponentResponse,
  ReprintLabelRequest,
  ProductProcessAttributeResponse,
  AttributeGroupForProduct,
  AttributeTypeForProduct
} from '../models/convert-spiked-bag.model';

@Injectable({
  providedIn: 'root'
})
export class ConvertSpikedBagService {
  private readonly http = inject(HttpClient);

  /**
   * Get all active process codes
   */
  getProcessCodes(): Observable<ProcessCode[]> {
    return this.http
      .get<any>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PROCESS_CODES}`)
      .pipe(
        map(response => {
          // Handle nested data structure: response.data.data contains the array
          const nestedData = response?.data?.data || response?.data || [];
          return nestedData as ProcessCode[];
        })
      );
  }

  /**
   * Get valid product types
   */
  getProductTypes(): Observable<ProductType[]> {
    return this.http
      .get<ApiResponse<ProductType[]>>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PRODUCT_TYPES}`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Validate unit for conversion
   */
  validateUnit(unitId: string): Observable<UnitValidationResponse> {
    return this.http
      .get<ApiResponse<UnitValidationResponse>>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALIDATE_UNIT(unitId)}`)
      .pipe(map(response => response.data as UnitValidationResponse));
  }

  /**
   * Get valid products for unit (filtered by process code)
   */
  getProducts(unitId: string, collDate: string, processCode: string): Observable<any[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('processCode', processCode);

    return this.http
      .get<any>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.PRODUCTS}`, { params })
      .pipe(
        map(response => {
          // Handle API response structure: { success: true, data: [...], message: "..." }
          // API returns data array directly
          return response?.data || [];
        })
      );
  }

  /**
   * Get valid attributes for function and product type
   */
  getAttributes(functionName: string, productType: string): Observable<{ groups: AttributeGroup[]; codes: AttributeCode[] }> {
    return this.http
      .get<ApiResponse<{ groups: AttributeGroup[]; codes: AttributeCode[] }>>(
        `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTES(functionName, productType)}`
      )
      .pipe(map(response => response.data || { groups: [], codes: [] }));
  }

  /**
   * Get valid catalog numbers for product type
   */
  getValidCatalogs(productType: string, unitId: string): Observable<CatalogNumber[]> {
    const params = new HttpParams()
      .set('productType', productType)
      .set('unitId', unitId);
    return this.http
      .get<any>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALID_CATALOGS}`, { params })
      .pipe(
        map(response => {
          // Handle nested API response structure similar to process codes
          const nestedData = response?.data?.data || response?.data || [];
          return nestedData as CatalogNumber[];
        })
      );
  }

  /**
   * Derive new product based on attribute selection
   */
  deriveProduct(request: DeriveProductRequest): Observable<DeriveProductResponse> {
    return this.http
      .post<DeriveProductResponse>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.DERIVE_PRODUCT}`, request);
  }

  /**
   * Verify product code
   */
  verifyProduct(request: VerifyProductRequest): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VERIFY_PRODUCT}`, request);
  }

  /**
   * Convert component into spiked bag
   */
  convertComponent(request: ConvertComponentRequest): Observable<ConvertComponentResponse> {
    return this.http
      .post<ConvertComponentResponse>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.CONVERT}`, request);
  }

  /**
   * Reprint ISBT label
   */
  reprintLabel(request: ReprintLabelRequest): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.REPRINT_LABEL}`, request);
  }

  /**
   * Get attribute group and code from FR_VPRODUCT_PROCESSES
   * Auto-populates based on old product code and process code combination
   * @param oldProductCode - The product code to convert (e.g., 'P1234567')
   * @param processCode - The process code (e.g., 'REG', 'IRRAD')
   * @param unitId - The unit ID for suitability check lookup
   * @param unitSchemeType - Unit scheme type (default 'I' for ISBT)
   */
  getAttributesForProcess(
    oldProductCode: string,
    processCode: string,
    unitId: string,
    unitSchemeType: string = 'I'
  ): Observable<ProductProcessAttributeResponse> {
    const params = new HttpParams()
      .set('oldProductCode', oldProductCode)
      .set('processCode', processCode)
      .set('unitId', unitId)
      .set('unitSchemeType', unitSchemeType);

    return this.http
      .get<ProductProcessAttributeResponse>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTES_FOR_PROCESS}`, { params });
  }

  /**
   * Validate catalog number against database
   * Matches FRICON2 CATALOG_NUMBER.VALIDATE_FIELD trigger logic
   *
   * SQL Query (from FMB line 93):
   * SELECT DISTINCT catalog_number
   * FROM valid_catalog_details
   * WHERE catalog_number = :catalogNumber
   *   AND chapter_id = :chapterId
   *   AND (product_type = :productType OR INSTR(NVL(sub_prod_types,' '), :productType, 1) > 0)
   *   AND :sysdate BETWEEN eff_date AND NVL(term_date, :sysdate + 365)
   *   AND base_catalog_no IN (
   *     SELECT catalog_number
   *     FROM valid_lots VL
   *     WHERE chapter_id = :chapterId
   *       AND EXISTS (
   *         SELECT 'X' FROM master_codes
   *         WHERE code_type = 'CMC'
   *           AND INSTR(VL.sp_flag, code, 1) > 0
   *           AND INSTR(code_desc, :programName, 1) > 0
   *           AND :sysdate BETWEEN eff_date AND NVL(term_date, :sysdate + 365)
   *       )
   *       AND lot_number IN (
   *         SELECT bag_lot_number
   *         FROM component_spiking
   *         WHERE unit_id = :unitId
   *       )
   *       AND :sysdate BETWEEN eff_date AND NVL(term_date, :sysdate + 365)
   *   )
   *
   * @param catalogNumber - The catalog number to validate
   * @param productType - Product type from selected product
   * @param unitId - Unit ID for component_spiking lookup
   */
  validateCatalogNumber(
    catalogNumber: string,
    productType: string,
    unitId: string
  ): Observable<{ success: boolean; message: string }> {
    const params = new HttpParams()
      .set('catalogNumber', catalogNumber)
      .set('productType', productType)
      .set('unitId', unitId);

    return this.http
      .get<{ success: boolean; message: string }>(
        `${environment.apiUrl}${API.CONVERT_SPIKED_BAG.VALIDATE_CATALOG}`,
        { params }
      );
  }

  /**
   * Get attribute groups for a specific product (FRICON2 dropdown)
   */
  getAttributeGroupsForProduct(oldProductCode: string): Observable<AttributeGroupForProduct[]> {
    const params = new HttpParams().set('oldProductCode', oldProductCode);

    return this.http
      .get<any>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTE_GROUPS}`, { params })
      .pipe(
        map(response => response?.data || [])
      );
  }

  /**
   * Get attribute types for a specific product and attribute group (FRICON2 dropdown)
   */
  getAttributeTypesForProduct(
    oldProductCode: string,
    attributeGroup: string,
    unitId: string,
    collectionDate: string,
    productType: string,
    unitSchemeType: string = 'I'
  ): Observable<AttributeTypeForProduct[]> {
    const params = new HttpParams()
      .set('oldProductCode', oldProductCode)
      .set('attributeGroup', attributeGroup)
      .set('unitId', unitId)
      .set('collectionDate', collectionDate)
      .set('productType', productType)
      .set('unitSchemeType', unitSchemeType);

    return this.http
      .get<any>(`${environment.apiUrl}${API.CONVERT_SPIKED_BAG.ATTRIBUTE_TYPES}`, { params })
      .pipe(
        map(response => response?.data || [])
      );
  }
}
