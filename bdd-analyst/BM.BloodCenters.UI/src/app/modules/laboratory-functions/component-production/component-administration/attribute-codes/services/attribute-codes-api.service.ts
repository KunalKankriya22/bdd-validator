import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  AttributeCodeModel,
  AttributeCodeFormValue,
  AttributeCodeQueryParamsDto,
  AttributeGroupDropdownItem
} from '../models/attribute-codes.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  data: T;
  total?: number;
}

/**
 * Backend DTO structure from ValidAttributeDto
 */

interface ValidAttributeDto {
  attribGroup: string;
  attribCode: string;
  attribDesc: string;
  price?: number | null;
  unitSchemeType: string;
  statusFlag: string;
  interCode?: string | null;
  stopLabelFlag: string;
  assignAfterLabelFlag: string;
  showOnLabelFlag: string;
  deleteAllowed?: string | null;
  attribCustom: string;
  normalStockFlag: string;
  creditFlag: string;
  serviceCode?: string | null;
  attribLabel?: string | null;
  attribAbbrev?: string | null;
  attribPosition?: number | null;
  attribType: string;
  exclusivityFlag: string;
  eqCode128AttribGroup?: string | null;
  eqCode128AttribCode?: string | null;
  effDate?: string | null;
  termDate?: string | null;
  programId?: string | null;
  lastModifiedDate?: string | null;
}

interface ValidAttributeQueryDto {
  attribGroup?: string;
  attribCode?: string;
  unitSchemeType?: string;
  statusFlag?: string;
  attribType?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
  stopLabelFlag?: string;
  exclusivityFlag?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttributeCodesApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all attribute codes with pagination, filtering, and sorting
   */
  getAttributeCodes(
    take: number,
    skip: number,
    queryDto: AttributeCodeQueryParamsDto = {}
  ): Observable<{ data: AttributeCodeModel[]; total: number }> {
    const body: ValidAttributeQueryDto = {
      attribGroup: queryDto.attribGroup,
      attribCode: queryDto.attributeCode,
      searchKeyword: queryDto.searchKeyword,
      sortColumn: queryDto.sortColumn,
      sortOrder: queryDto.sortOrder,
      stopLabelFlag: queryDto.stopLabelFlag,
      exclusivityFlag: queryDto.exclusivityFlag,
      effectiveDateFrom: queryDto.effectiveDateFrom,
      effectiveDateTo: queryDto.effectiveDateTo,
      terminationDateFrom: queryDto.terminationDateFrom,
      terminationDateTo: queryDto.terminationDateTo
    };

    // Debug: Log the request body
    console.log('🔍 API Request Body:', body);

    return this.apiService
      .post<ApiResponse<ValidAttributeDto[]>>(
        API.VALID_ATTRIBUTES.GET_ALL(take, skip),
        body
      )
      .pipe(
        map((response) => ({
          data: (response.data || []).map(this.mapToFrontendModel),
          total: response.total || 0
        }))
      );
  }

  /**
   * Create a new attribute code
   */
  createAttributeCode(
    attributeGroup: string,
    formValue: AttributeCodeFormValue
  ): Observable<AttributeCodeModel> {
    const payload = this.mapToCreateDto(attributeGroup, formValue);

    // Skip interceptor error toast - component will handle error display
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);

    return this.apiService
      .post<ApiResponse<ValidAttributeDto>>(API.VALID_ATTRIBUTES.CREATE, payload, { context })
      .pipe(
        map((response) => {
          // Check if backend returned an error (success: false)
          if (response.success === false) {
            // Create an error object that matches HttpErrorResponse structure
            const error = {
              error: {
                message: response.message,
                statusCode: response.statusCode,
                errorCode: response.errorCode
              },
              message: response.message,
              status: response.statusCode || 400
            };
            throw error;
          }
          return this.mapToFrontendModel(response.data);
        })
      );
  }

  /**
   * Update an existing attribute code
   */
  updateAttributeCode(
    attributeGroup: string,
    attributeCode: string,
    unitSchemeType: string,
    formValue: AttributeCodeFormValue
  ): Observable<AttributeCodeModel> {
    const payload = this.mapToUpdateDto(formValue);

    // Skip interceptor error toast - component will handle error display
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);

    return this.apiService
      .put<ApiResponse<ValidAttributeDto>>(
        API.VALID_ATTRIBUTES.UPDATE(attributeGroup, attributeCode, unitSchemeType),
        payload,
        { context }
      )
      .pipe(
        map((response) => {
          // Check if backend returned an error (success: false)
          if (response.success === false) {
            // Create an error object that matches HttpErrorResponse structure
            const error = {
              error: {
                message: response.message,
                statusCode: response.statusCode,
                errorCode: response.errorCode
              },
              message: response.message,
              status: response.statusCode || 400
            };
            throw error;
          }

          if (!response || !response.data) {
            throw new Error('Invalid response from server - missing data field');
          }
          return this.mapToFrontendModel(response.data);
        })
      );
  }

  /**
   * Map backend ValidAttributeDto to frontend AttributeCodeModel
   */
  private mapToFrontendModel(dto: ValidAttributeDto | null | undefined): AttributeCodeModel {
    // Handle null/undefined dto (error responses)
    if (!dto) {
      throw new Error('Server returned invalid data format');
    }

    // Validate required fields
    if (!dto.attribGroup || !dto.attribCode) {
      throw new Error('Server response missing required fields (attribGroup or attribCode)');
    }

    // Backend returns only 4 fields on update: attribGroup, attribCode, unitSchemeType, attribDesc
    // Handle partial responses defensively
    return {
      attributeGroup: dto.attribGroup,
      attributeCode: dto.attribCode,
      description: dto.attribDesc,
      unitSchemeType: dto.unitSchemeType,
      // Optional fields - may be undefined in update responses
      price: dto.price ?? null,
      statusFlag: dto.statusFlag ?? '',
      interCode: dto.interCode ?? null,
      stopLabelFlag: dto.stopLabelFlag ?? '',
      assignAfterLabelFlag: dto.assignAfterLabelFlag ?? '',
      showOnLabelFlag: dto.showOnLabelFlag ?? '',
      deleteAllowed: dto.deleteAllowed ?? null,
      attributeCustom: dto.attribCustom ?? '',
      normalStockFlag: dto.normalStockFlag ?? '',
      creditFlag: dto.creditFlag ?? '',
      serviceCode: dto.serviceCode ?? null,
      attributeLabel: dto.attribLabel ?? null,
      attributeAbbrev: dto.attribAbbrev ?? null,
      attributePosition: dto.attribPosition ?? null,
      attributeType: dto.attribType ?? '',
      exclusivityFlag: dto.exclusivityFlag ?? '',
      eqCode128AttributeGroup: dto.eqCode128AttribGroup ?? null,
      eqCode128AttributeCode: dto.eqCode128AttribCode ?? null,
      effectiveDate: dto.effDate ?? null,
      terminationDate: dto.termDate ?? null,
      programId: dto.programId ?? null,
      lastModifiedDate: dto.lastModifiedDate ?? null
    };
  }

  /**
   * Get attribute groups dropdown
   */
  getAttributeGroups(): Observable<AttributeGroupDropdownItem[]> {
    return this.apiService
      .get<ApiResponse<{ code: string; codeDesc: string }[]>>(
        API.VALID_ATTRIBUTES.ATTRIBUTE_GROUPS
      )
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({
            code: item.code,
            description: item.codeDesc
          }))
        )
      );
  }

  /**
   * Get attribute codes dropdown for a specific attribute group
   */
  getAttributeCodesDropdown(attribGroup: string): Observable<Array<{ value: string; label: string }>> {
    // Use the main GET_ALL endpoint with the attribute group filter
    const body = {
      attribGroup: attribGroup
    };

    return this.apiService
      .post<ApiResponse<ValidAttributeDto[]>>(
        API.VALID_ATTRIBUTES.GET_ALL(100, 0), // Get up to 100 codes for dropdown (API max limit)
        body
      )
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({
            value: item.attribCode,
            label: item.attribCode
          }))
        )
      );
  }

  /**
   * Get interdiction codes dropdown
   */
  getInterdictionCodes(statusFlag: string = 'A'): Observable<Array<{ value: string; label: string; description: string }>> {
    return this.apiService
      .get<any>(
        API.VALID_ATTRIBUTES.INTERDICTION_CODES(statusFlag)
      )
      .pipe(
        map((response) => {
          const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
          return items.map((item: any) => ({
            value: item.interCode || item.InterCode || '',
            label: item.interCode || item.InterCode || '',
            description: item.interDesc || item.InterDesc || ''
          }));
        })
      );
  }

  /**
   * Map frontend form value to backend create DTO
   */
  private mapToCreateDto(attributeGroup: string, formValue: AttributeCodeFormValue): any {
    // FMB Validation: statusFlag 'A' is only valid for ALERT group
    // For all other groups, use 'H' (HOLD) as default
    const defaultStatusFlag = attributeGroup.toUpperCase() === 'ALERT' ? 'A' : 'H';

    return {
      attribGroup: attributeGroup,
      attribCode: formValue.attributeCode,
      attribDesc: formValue.description,
      unitSchemeType: formValue.unitScheme || 'C',
      statusFlag: formValue.statusFlag || defaultStatusFlag,
      attribType: formValue.attributeType || '',
      attribLabel: formValue.attributeLabel || null,
      attribAbbrev: formValue.attributeAbbrev || null,
      attribPosition: formValue.attributePosition || null,
      normalStockFlag: formValue.normalStockFlag,
      assignAfterLabelFlag: formValue.assignAfterLabelFlag,
      effDate: formValue.effectiveDate?.format('YYYY-MM-DD') || null,
      termDate: formValue.terminationDate?.format('YYYY-MM-DD') || null,
      interCode: formValue.interCode || null,
      stopLabelFlag: formValue.stopLabelFlag || 'N',
      showOnLabelFlag: formValue.showOnLabelFlag || 'Y',
      attribCustom: formValue.attributeCustom || 'N',
      creditFlag: formValue.creditFlag || 'Y',
      exclusivityFlag: formValue.exclusivityFlag || 'Y',
      deleteAllowed: formValue.deleteAllowed || 'Y',
      price: formValue.price || null,
      serviceCode: formValue.serviceCode || null
    };
  }

  /**
   * Map frontend form value to backend update DTO
   */
  private mapToUpdateDto(formValue: AttributeCodeFormValue): any {
    return {
      attribDesc: formValue.description,
      unitSchemeType: formValue.unitScheme,
      attribType: formValue.attributeType || '',
      attribLabel: formValue.attributeLabel || null,
      attribAbbrev: formValue.attributeAbbrev || null,
      attribPosition: formValue.attributePosition || null,
      normalStockFlag: formValue.normalStockFlag,
      assignAfterLabelFlag: formValue.assignAfterLabelFlag,
      effDate: formValue.effectiveDate?.format('YYYY-MM-DD') || null,
      termDate: formValue.terminationDate?.format('YYYY-MM-DD') || null,
      interCode: formValue.interCode || null,
      stopLabelFlag: formValue.stopLabelFlag || 'N',
      showOnLabelFlag: formValue.showOnLabelFlag || 'Y',
      attribCustom: formValue.attributeCustom || 'N',
      creditFlag: formValue.creditFlag || 'Y',
      exclusivityFlag: formValue.exclusivityFlag || 'Y',
      deleteAllowed: formValue.deleteAllowed || 'Y',
      price: formValue.price || null,
      serviceCode: formValue.serviceCode || null,
      statusFlag: formValue.statusFlag || 'H'
    };
  }
}