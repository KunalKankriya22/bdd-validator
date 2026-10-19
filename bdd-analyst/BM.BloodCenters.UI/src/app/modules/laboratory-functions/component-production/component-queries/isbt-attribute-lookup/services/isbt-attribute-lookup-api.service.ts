import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  IsbtAttributeDto,
  IsbtAttributeGroupDto,
  ProductFormulaDto,
  ProductLovOption,
  AttributeGroupLovOption,
  AttributeCodeLovOption,
  IsbtAttributeSearchParams,
  CodeMappingResultDto,
  ApiResponse,
} from '../models/isbt-attribute-lookup.model';

@Injectable({
  providedIn: 'root',
})
export class IsbtAttributeLookupApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Search ISBT attributes by group or code
   *
   * FMB Behavior (cpqalook_fmb.xml):
   * - Query: WHERE ATTRIB_GROUP = :ctrl_block_1.attrib_group ORDER BY ATTRIB_CODE
   * - ALWAYS passes attribGroup parameter (even if empty/null)
   * - When attribGroup is empty/null → returns ZERO records
   * - NO date filtering (shows all records: future, active, terminated)
   * - NO unit_scheme_type filtering (only in LOV dropdowns, not main query)
   */
  searchAttributes(params: IsbtAttributeSearchParams): Observable<IsbtAttributeDto[]> {
    let httpParams = new HttpParams();

    // CRITICAL: Always pass attribGroup parameter (even if empty string)
    // This matches FMB behavior where :ctrl_block_1.attrib_group is always bound to the query
    // Use !== undefined check instead of truthy check to allow empty strings
    if (params.attribGroup !== undefined) {
      httpParams = httpParams.set('attribGroup', params.attribGroup);
    }
    if (params.oldGroup !== undefined) {
      httpParams = httpParams.set('oldGroup', params.oldGroup);
    }
    if (params.attribCode !== undefined) {
      httpParams = httpParams.set('attribCode', params.attribCode);
    }
    if (params.oldAttribCode !== undefined) {
      httpParams = httpParams.set('oldAttribCode', params.oldAttribCode);
    }
    // FMB does NOT pass unitSchemeType in main query (only used in LOV dropdowns)

    return this.apiService
      .get<ApiResponse<IsbtAttributeDto[]>>(API.ISBT_ATTRIBUTE_LOOKUP.SEARCH, { params: httpParams })
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get attribute group details by code
   */
  getAttributeGroup(code: string): Observable<IsbtAttributeGroupDto> {
    return this.apiService
      .get<ApiResponse<IsbtAttributeGroupDto>>(`${API.ISBT_ATTRIBUTE_LOOKUP.GET_GROUP}/${code}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get all attribute groups for LOV
   */
  getAttributeGroupsLov(): Observable<AttributeGroupLovOption[]> {
    return this.apiService
      .get<ApiResponse<AttributeGroupLovOption[]>>(API.ISBT_ATTRIBUTE_LOOKUP.GET_GROUPS_LOV)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get all new ISBT codes (V%) for LOV
   */
  getNewCodesLov(): Observable<AttributeCodeLovOption[]> {
    return this.apiService
      .get<ApiResponse<AttributeCodeLovOption[]>>(API.ISBT_ATTRIBUTE_LOOKUP.GET_NEW_CODES_LOV)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get all old codes (non-V%) for LOV
   */
  getOldCodesLov(): Observable<AttributeCodeLovOption[]> {
    return this.apiService
      .get<ApiResponse<AttributeCodeLovOption[]>>(API.ISBT_ATTRIBUTE_LOOKUP.GET_OLD_CODES_LOV)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get product formula details by product code
   */
  getProductFormula(productCode: string): Observable<ProductFormulaDto> {
    return this.apiService
      .get<ApiResponse<ProductFormulaDto>>(`${API.ISBT_ATTRIBUTE_LOOKUP.GET_PRODUCT}/${productCode}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get all products for LOV
   */
  getProductsLov(): Observable<ProductLovOption[]> {
    return this.apiService
      .get<ApiResponse<ProductLovOption[]>>(API.ISBT_ATTRIBUTE_LOOKUP.GET_PRODUCTS_LOV)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get old attribute code from new attribute code (code-to-code mapping)
   * FMB: ATTRIB_CODE.KEY-NEXT-ITEM trigger
   */
  getOldCodeFromNewCode(code: string): Observable<CodeMappingResultDto> {
    return this.apiService
      .get<ApiResponse<CodeMappingResultDto>>(`${API.ISBT_ATTRIBUTE_LOOKUP.CODE_MAPPING_NEW_TO_OLD}/${code}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get new attribute code from old attribute code (code-to-code mapping)
   * FMB: OLD_ATTRIB_CODE.KEY-NEXT-ITEM trigger
   */
  getNewCodeFromOldCode(code: string): Observable<CodeMappingResultDto> {
    return this.apiService
      .get<ApiResponse<CodeMappingResultDto>>(`${API.ISBT_ATTRIBUTE_LOOKUP.CODE_MAPPING_OLD_TO_NEW}/${code}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get group mapping (reverse lookup between new and old groups)
   */
  getGroupMapping(mappingType: 'new-to-old' | 'old-to-new', code: string): Observable<string> {
    return this.apiService
      .get<ApiResponse<{ mappedGroupCode: string }>>(`${API.ISBT_ATTRIBUTE_LOOKUP.GET_GROUP_MAPPING}/${mappingType}/${code}`)
      .pipe(map((response) => response.data.mappedGroupCode));
  }
}
