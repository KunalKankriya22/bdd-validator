/**
 * Service for Product/Procedure Matrix - Pheresis API
 * JIRA: MLT-12847
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse,
  ProcProdMatrix,
  MatrixListResponse,
  CreateMatrixDto,
  UpdateMatrixDto,
  MatrixQueryDto,
  ProcedureDropdown,
  ProductTypeDropdown,
  ProcedureAttributeEquipment,
  CreateProcedureAttributeEquipmentDto,
  UpdateProcedureAttributeEquipmentDto,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  EquipmentTypeDropdown,
  ParameterCodeDropdown,
  EquipmentProductCgmpMatrix,
  CreateEquipmentCgmpMatrixDto,
  UpdateEquipmentCgmpMatrixDto,
  EquipmentCgmpMatrixQueryDto,
  EquipmentTypeDropdownCgmp,
  ParameterCodeDropdownCgmp
} from '../models/matrix-pheresis.model';

@Injectable({
  providedIn: 'root'
})
export class MatrixPheresisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/proc-prod-matrix`;
  private readonly attrEquipBaseUrl = `${environment.apiUrl}/api/v1/procedure-attribute-equipment`;
  private readonly checkInDetailsBaseUrl = `${environment.apiUrl}/api/v1/check-in-details`;
  private readonly cgmpBaseUrl = `${environment.apiUrl}/api/v1/equipment-product-cgmp`;

  /**
   * Get matrix records with filters and pagination
   */
  getMatrixRecords(take: number, skip: number, filters?: MatrixQueryDto): Observable<MatrixListResponse> {
    return this.http.post<ApiResponse<ProcProdMatrix[]>>(
      `${this.baseUrl}/${take}/${skip}`,
      filters || {}
    ).pipe(
      map(res => ({
        data: res.data || [],
        totalCount: res.total || 0
      }))
    );
  }

  /**
   * Get single matrix record by composite key
   */
  getMatrixRecord(proc: string, productType: string): Observable<ProcProdMatrix> {
    return this.http.get<ApiResponse<ProcProdMatrix[]>>(
      `${this.baseUrl}/${proc}/${productType}`
    ).pipe(
      map(res => res.data?.[0]!)
    );
  }

  /**
   * Create new matrix record
   */
  createMatrix(data: CreateMatrixDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.baseUrl, data);
  }

  /**
   * Update existing matrix record
   */
  updateMatrix(proc: string, productType: string, data: UpdateMatrixDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/${proc}/${productType}`,
      data
    );
  }

  /**
   * Delete matrix record (soft delete - sets TERM_DATE)
   */
  deleteMatrix(proc: string, productType: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/${proc}/${productType}`
    );
  }

  /**
   * Get procedures dropdown data
   */
  getProcedures(): Observable<ProcedureDropdown[]> {
    return this.http.get<ProcedureDropdown[]>(
      `${this.baseUrl}/dropdowns/procedures`
    );
  }

  /**
   * Get product types dropdown data
   */
  getProductTypes(): Observable<ProductTypeDropdown[]> {
    return this.http.get<ProductTypeDropdown[]>(
      `${this.baseUrl}/dropdowns/product-types`
    );
  }

  // ============================================
  // Tab 2: Procedure Attribute/Equipment Matrix
  // ============================================

  /**
   * Get attribute equipment records with pagination and filters
   */
  getAttributeEquipmentRecords(
    take: number,
    skip: number,
    attribGroup?: string,
    sortColumn?: string,
    sortOrder?: 'ASC' | 'DESC'
  ): Observable<{ data: ProcedureAttributeEquipment[]; totalCount: number }> {
    const query: Record<string, any> = {
      attribGroup: attribGroup || undefined,
      sortColumn: sortColumn || undefined,
      sortOrder: sortOrder || undefined
    };

    interface PaginatedResponse {
      success: boolean;
      statusCode: number;
      message?: string;
      data?: any[];
      totalCount?: number;
      total?: number;
    }

    return this.http.post<PaginatedResponse>(
      `${this.attrEquipBaseUrl}/${take}/${skip}`,
      query
    ).pipe(
      map(res => ({
        data: (res.data || []).map(this.mapAttributeEquipmentFromApi),
        totalCount: res.totalCount || res.total || 0
      }))
    );
  }

  /**
   * Map API response to frontend model
   * API returns: AttribGroup, AttribGroupDesc, AttribCode, AttribCodeDesc, EquipType, EquipDesc, ParmCode, ParmDesc, EffDate, TermDate
   */
  private mapAttributeEquipmentFromApi(apiItem: any): ProcedureAttributeEquipment {
    return {
      // Keep API field names (PascalCase from C#)
      attribGroup: apiItem.attribGroup,
      attribGroupDesc: apiItem.attribGroupDesc,
      attribCode: apiItem.attribCode,
      attribCodeDesc: apiItem.attribCodeDesc,
      equipType: apiItem.equipType,
      equipDesc: apiItem.equipDesc,
      parmCode: apiItem.parmCode,
      parmDesc: apiItem.parmDesc,
      effDate: apiItem.effDate,
      termDate: apiItem.termDate,
      lastModifiedDate: apiItem.lastModifiedDate,
      // Map to frontend-friendly names for component use (camelCase)
      attributeGroup: apiItem.attribGroup,
      attributeCode: apiItem.attribCode,
      attributeDesc: apiItem.attribCodeDesc,
      equipmentType: apiItem.equipType,
      equipmentDesc: apiItem.equipDesc,
      parameterCode: apiItem.parmCode,
      parameterDesc: apiItem.parmDesc
    };
  }

  /**
   * Create new attribute equipment record
   */
  createAttributeEquipment(data: CreateProcedureAttributeEquipmentDto): Observable<ApiResponse<any>> {
    // Data is already in correct format (attribGroup, attribCode, equipType, parmCode, effDate, termDate)
    return this.http.post<ApiResponse<any>>(this.attrEquipBaseUrl, data);
  }

  /**
   * Update existing attribute equipment record
   */
  updateAttributeEquipment(
    attributeGroup: string,
    attributeCode: string,
    equipmentType: string,
    parameterCode: string,
    originalEffDate: string,
    data: UpdateProcedureAttributeEquipmentDto
  ): Observable<ApiResponse<any>> {
    const params = {
      attribGroup: attributeGroup,
      attribCode: attributeCode,
      equipType: equipmentType,
      parmCode: parameterCode,
      originalEffDate: originalEffDate
    };

    return this.http.put<ApiResponse<any>>(
      this.attrEquipBaseUrl,
      data,
      { params }
    );
  }

  /**
   * Get attribute groups dropdown data
   */
  getAttributeGroups(): Observable<AttributeGroupDropdown[]> {
    return this.http.get<ApiResponse<AttributeGroupDropdown[]>>(
      `${this.attrEquipBaseUrl}/attribute-groups`
    ).pipe(
      map(res => {
        // Map API response (code, codeDesc) to frontend model (attributeGroup, description)
        const data = res.data || [];
        return data.map((item: any) => ({
          attributeGroup: item.code,
          description: item.codeDesc
        }));
      })
    );
  }

  /**
   * Get attribute codes dropdown data (cascading - depends on attribute group)
   */
  getAttributeCodes(attributeGroup: string): Observable<AttributeCodeDropdown[]> {
    return this.http.get<ApiResponse<AttributeCodeDropdown[]>>(
      `${this.attrEquipBaseUrl}/attribute-codes/${encodeURIComponent(attributeGroup)}`
    ).pipe(
      map(res => {
        // Map API response (AttribCode, AttribDesc) to frontend model (attributeCode, description)
        const data = res.data || [];
        return data.map((item: any) => ({
          attributeCode: item.attribCode,
          description: item.attribDesc
        }));
      })
    );
  }

  /**
   * Get equipment types dropdown data
   */
  getEquipmentTypes(): Observable<EquipmentTypeDropdown[]> {
    return this.http.get<ApiResponse<EquipmentTypeDropdown[]>>(
      `${this.attrEquipBaseUrl}/equipment-types`
    ).pipe(
      map(res => {
        // Map API response (Code, CodeDesc) to frontend model (equipmentType, description)
        const data = res.data || [];
        return data.map((item: any) => ({
          equipmentType: item.code,
          description: item.codeDesc
        }));
      })
    );
  }

  /**
   * Get parameter codes dropdown data
   */
  getParameterCodes(): Observable<ParameterCodeDropdown[]> {
    return this.http.get<ApiResponse<ParameterCodeDropdown[]>>(
      `${this.attrEquipBaseUrl}/parameter-codes`
    ).pipe(
      map(res => {
        // Map API response (Code, CodeDesc) to frontend model (parameterCode, description)
        const data = res.data || [];
        return data.map((item: any) => ({
          parameterCode: item.code,
          description: item.codeDesc
        }));
      })
    );
  }

  // ============================================
  // Tab 3: Equipment/Product cGMP Matrix
  // ============================================

  getEquipmentCgmpMatrixRecords(
    take: number,
    skip: number,
    filters?: EquipmentCgmpMatrixQueryDto
  ): Observable<{ data: EquipmentProductCgmpMatrix[]; totalCount: number }> {
    return this.http.post<ApiResponse<EquipmentProductCgmpMatrix[]>>(
      `${this.cgmpBaseUrl}/${take}/${skip}`,
      filters || {}
    ).pipe(
      map(res => ({
        data: res.data || [],
        totalCount: res.totalCount || res.total || 0
      }))
    );
  }

  createEquipmentCgmpMatrix(data: CreateEquipmentCgmpMatrixDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.cgmpBaseUrl, data);
  }

  updateEquipmentCgmpMatrix(
    equipType: string,
    proc: string,
    productCode: string,
    parmCode: string,
    data: UpdateEquipmentCgmpMatrixDto
  ): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.cgmpBaseUrl}/${encodeURIComponent(equipType)}/${encodeURIComponent(proc)}/${encodeURIComponent(productCode)}/${encodeURIComponent(parmCode)}`,
      data
    );
  }

  getEquipmentTypesCgmp(): Observable<EquipmentTypeDropdownCgmp[]> {
    return this.http.get<EquipmentTypeDropdownCgmp[]>(
      `${this.cgmpBaseUrl}/equipment-types`
    );
  }

  getProceduresCgmp(): Observable<ProcedureDropdown[]> {
    return this.http.get<ProcedureDropdown[]>(
      `${this.cgmpBaseUrl}/procedures`
    );
  }

  getProductTypesCgmp(): Observable<ProductTypeDropdown[]> {
    return this.http.get<any[]>(
      `${this.cgmpBaseUrl}/products`
    ).pipe(
      map(data => data.map(item => ({
        productCode: item.productType,
        productDesc: item.productTypeDesc
      })))
    );
  }

  getParameterCodesCgmp(): Observable<ParameterCodeDropdownCgmp[]> {
    return this.http.get<ParameterCodeDropdownCgmp[]>(
      `${this.cgmpBaseUrl}/parameters`
    );
  }
}
