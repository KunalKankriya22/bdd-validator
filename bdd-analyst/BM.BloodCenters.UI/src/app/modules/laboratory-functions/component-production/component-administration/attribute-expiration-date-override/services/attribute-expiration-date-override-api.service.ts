import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  AttributeExpirationDateOverrideModel,
  AttributeExpirationDateOverrideCreateDto,
  AttributeExpirationDateOverrideUpdateDto,
  AttributeExpirationDateOverrideQueryParamsDto,
  AttributeExpirationDateOverrideResponseDto,
  FilterDropdownResponse,
  AddDropdownResponse,
  AttributeDropdown
} from '../models/attribute-expiration-date-override.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
  total?: number;
  totalCount?: number;
}

interface ApiAttributeExpirationDateOverride {
  attribCode: string;
  ovrAttribCode: string;
  attribDesc?: string;
  ovrAttribDesc?: string;
  effDate?: string;
  termDate?: string;
  modifiedDate?: string;
  modifiedUser?: string;
  auditKey?: number;
  programId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttributeExpirationDateOverrideApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Maps API response fields to frontend model fields
   */
  private mapApiToModel(apiData: ApiAttributeExpirationDateOverride): AttributeExpirationDateOverrideModel {
    return {
      attributeCode: apiData.attribCode,
      attributeDescription: apiData.attribDesc || '',
      overrideAttribute: apiData.ovrAttribCode,
      overrideDescription: apiData.ovrAttribDesc || '',
      effDate: apiData.effDate || '',
      termDate: apiData.termDate,
      lastModifiedDate: apiData.modifiedDate,
      auditKey: apiData.auditKey,
      programId: apiData.programId
    };
  }

  getAttributeExpirationDateOverrides(
    take: number,
    skip: number,
    params: AttributeExpirationDateOverrideQueryParamsDto
  ): Observable<AttributeExpirationDateOverrideResponseDto> {
    const url = API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.LIST(take, skip);
    const payload: Record<string, unknown> = {};

    if (params.overrideAttribute) payload['ovrAttribCode'] = params.overrideAttribute;
    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.effDate) payload['effDate'] = params.effDate;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.termDate) payload['termDate'] = params.termDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;
    if (params.sortColumn) payload['sortColumn'] = params.sortColumn;
    if (params.sortOrder) payload['sortOrder'] = params.sortOrder;

    return this.apiService
      .post<ApiResponse<ApiAttributeExpirationDateOverride[]>>(url, payload)
      .pipe(
        map((response) => {
          const apiData = response?.data || [];
          const data = apiData.map(item => this.mapApiToModel(item));
          const totalCount = response?.total ?? response?.totalCount ?? data.length;
          return { data, totalCount };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getAttributeExpirationDateOverrideById(
    attribCode: string,
    ovrAttribCode: string
  ): Observable<AttributeExpirationDateOverrideModel> {
    const url = API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.GET_BY_ID(attribCode, ovrAttribCode);
    return this.apiService
      .get<ApiResponse<ApiAttributeExpirationDateOverride[]>>(url)
      .pipe(
        map((response) => {
          const apiData = response?.data?.[0];
          if (!apiData) {
            throw new Error('Record not found');
          }
          return this.mapApiToModel(apiData);
        }),
        catchError((error) => throwError(() => error))
      );
  }

  createAttributeExpirationDateOverride(
    dto: AttributeExpirationDateOverrideCreateDto
  ): Observable<ApiResponse<AttributeExpirationDateOverrideModel>> {
    const payload = {
      attribCode: dto.attributeCode,
      ovrAttribCode: dto.overrideAttribute,
      effDate: dto.effDate,
      termDate: dto.termDate
    };

    return this.apiService
      .post<ApiResponse<ApiAttributeExpirationDateOverride>>(
        API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.CREATE,
        payload
      )
      .pipe(
        map((response) => ({
          ...response,
          data: response.data ? this.mapApiToModel(response.data) : {} as AttributeExpirationDateOverrideModel
        })),
        catchError((error) => throwError(() => error))
      );
  }

  updateAttributeExpirationDateOverride(
    attribCode: string,
    ovrAttribCode: string,
    dto: AttributeExpirationDateOverrideUpdateDto
  ): Observable<ApiResponse<AttributeExpirationDateOverrideModel>> {
    const url = API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.UPDATE(attribCode, ovrAttribCode);
    const payload = {
      effDate: dto.effDate,
      termDate: dto.termDate
    };

    return this.apiService
      .put<ApiResponse<ApiAttributeExpirationDateOverride>>(url, payload)
      .pipe(
        map((response) => ({
          ...response,
          data: response.data ? this.mapApiToModel(response.data) : {} as AttributeExpirationDateOverrideModel
        })),
        catchError((error) => throwError(() => error))
      );
  }

  getFilterDropdown(params: AttributeExpirationDateOverrideQueryParamsDto = {}): Observable<FilterDropdownResponse> {
    const payload: Record<string, unknown> = {};

    if (params.searchKeyword) payload['searchKeyword'] = params.searchKeyword;
    if (params.effDate) payload['effDate'] = params.effDate;
    if (params.effDatePeriod) payload['effDatePeriod'] = params.effDatePeriod;
    if (params.termDate) payload['termDate'] = params.termDate;
    if (params.termDatePeriod) payload['termDatePeriod'] = params.termDatePeriod;

    return this.apiService
      .post<AttributeDropdown[]>(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.FILTER_DROPDOWN, payload)
      .pipe(
        map((attributes) => ({
          overrideAttributes: (attributes || []).map(attr => ({
            key: attr.attribCode,
            value: attr.attribCode
          }))
        })),
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Get add/edit dropdown values (All active master data)
   * TEMPORARY: Using attributes-dropdown endpoint until backend implements add-dropdown
   * TODO: Switch to GET /api/v1/attribute-expiration-date-override/add-dropdown when available
   * Used for: Populating dropdowns in Add/Edit dialogs
   * Data sources:
   * - attributeCodes: ISBT attribute codes (active records with descriptions)
   * - overrideAttributes: ISBT override attribute codes (active records with descriptions)
   * @returns Observable with add/edit dropdown values
   */
  getAddDropdown(): Observable<AddDropdownResponse> {
    // Temporary workaround: Use attributes-dropdown for both attribute and override dropdowns
    return this.getAttributesDropdown().pipe(
      map((attributes) => ({
        attributeCodes: attributes.map(attr => ({
          key: attr.attribCode,
          value: attr.attribCode,
          description: attr.attribDesc
        })),
        overrideAttributes: attributes.map(attr => ({
          key: attr.attribCode,
          value: attr.attribCode,
          description: attr.attribDesc
        }))
      })),
      catchError((error) => {
        console.error('Add dropdown fallback failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an attribute expiration date override
   * DELETE /api/v1/attribute-expiration-date-override/{attribCode}/{ovrAttribCode}
   * @param attribCode - Attribute code to be overridden
   * @param ovrAttribCode - Overriding attribute code
   * @returns Observable with delete response
   */
  deleteAttributeExpirationDateOverride(
    attribCode: string,
    ovrAttribCode: string
  ): Observable<ApiResponse<boolean>> {
    const url = API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.DELETE(attribCode, ovrAttribCode);
    return this.apiService
      .delete<ApiResponse<boolean>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /**
   * Get attributes dropdown for LOV (List of Values)
   * GET /api/v1/attribute-expiration-date-override/attributes-dropdown
   * Returns active ISBT attribute codes based on chapter local date
   * @returns Observable with attribute dropdown values
   */
  getAttributesDropdown(): Observable<AttributeDropdown[]> {
    return this.apiService
      .get<AttributeDropdown[]>(API.ATTRIBUTE_EXPIRATION_DATE_OVERRIDE.ATTRIBUTES_DROPDOWN)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
