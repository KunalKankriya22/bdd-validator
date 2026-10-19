import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideSearchParamsDto,
  DonorInterdictionOverrideDropdowns,
  DonorInterdictionOverrideCreateDto,
  DonorInterdictionOverrideUpdateDto
} from '../models/donor-interdiction-override.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class DonorInterdictionOverrideService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Donor Interdiction Override table data with pagination
   * POST /api/v1/application-admin/donor-interdiction-override/{take}/{skip}
   */
  getDonorInterdictionOverrides(
    take: number,
    skip: number,
    params: DonorInterdictionOverrideSearchParamsDto
  ): Observable<{ data: DonorInterdictionOverrideModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE(take, skip);

    return this.apiService.post<any>(endpoint, params).pipe(
      map(response => this.extractTableData(response)),
      catchError(error => {
        console.error('Error fetching donor interdiction override data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get dropdown values for filter and form
   * GET /api/v1/donor-interdiction-override/dropdowns
   */
  getDropdowns(): Observable<DonorInterdictionOverrideDropdowns> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_DROPDOWNS;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => this.extractDropdownData(response)),
      catchError(error => {
        console.error('Error fetching donor interdiction override dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct CUE and Type values from override records for filter panel
   * GET /api/v1/application-admin/donor-interdiction-override/filter-options
   */
  getFilterOptions(): Observable<DonorInterdictionOverrideDropdowns> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_FILTER_OPTIONS;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => this.extractDropdownData(response)),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Donor Interdiction Override
   * POST /api/v1/application-admin/donor-interdiction-override
   */
  createOverride(data: DonorInterdictionOverrideCreateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_CREATE;

    return this.apiService.post<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating donor interdiction override:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing Donor Interdiction Override
   * PUT /api/v1/application-admin/donor-interdiction-override/{donorDecisionCode}/{productType}/{interCode}
   */
  updateOverride(data: DonorInterdictionOverrideUpdateDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_UPDATE(
      data.originalDonorDecisionCode || data.donorDecisionCode,
      data.originalProductType || data.productType,
      data.originalInterCode || data.interCode
    );

    // Remove original key fields from request body - they are only used for URL construction
    const { originalDonorDecisionCode, originalProductType, originalInterCode, ...payload } = data;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating donor interdiction override:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attribute codes filtered by attribute group
   * GET /api/v1/application-admin/donor-interdiction-override/dropdowns/attrib-codes/{attribGroup}
   */
  getAttribCodesByGroup(attribGroup: string): Observable<{ code: string; description: string }[]> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_INTERDICTION_OVERRIDE_ATTRIB_CODES_BY_GROUP(attribGroup);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return this.extractCodeDescriptionArray(items);
      }),
      catchError(error => {
        console.error('Error fetching attribute codes by group:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Extract table data from BE response.
   * BE returns: { Success, Data: [...], Total, Item, Message }
   */
  private extractTableData(response: any): { data: DonorInterdictionOverrideModel[]; totalRecords: number } {
    if (!response) {
      return { data: [], totalRecords: 0 };
    }

    const rawData: any[] = response.Data || response.data || [];
    const total: number = response.Total ?? response.total ?? rawData.length;

    // Data already matches our model field names from API
    const normalizedData = rawData.map(item => this.normalizePropertyNames(item));

    return { data: normalizedData, totalRecords: total };
  }

  /**
   * Extract dropdown data from BE response.
   */
  private extractDropdownData(response: any): DonorInterdictionOverrideDropdowns {
    if (!response) {
      return {};
    }

    let dropdownData: any = null;

    if (response.Item) {
      dropdownData = response.Item;
    } else if (response.item) {
      dropdownData = response.item;
    } else if (response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
      dropdownData = response.Data[0];
    } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      dropdownData = response.data[0];
    } else if (response.Data && !Array.isArray(response.Data)) {
      dropdownData = response.Data;
    } else if (response.data && !Array.isArray(response.data)) {
      dropdownData = response.data;
    } else if (response.DonorDecisionCodes || response.donorDecisionCodes ||
               response.ProductTypes || response.productTypes ||
               response.InterCodes || response.interCodes ||
               response.InterTypes || response.interTypes ||
               response.AttribGroups || response.attribGroups ||
               response.AttribCodes || response.attribCodes) {
      dropdownData = response;
    }

    if (!dropdownData) {
      return {};
    }

    return {
      donorDecisionCodes: this.extractCodeDescriptionArray(
        dropdownData.DonorDecisionCodes || dropdownData.donorDecisionCodes ||
        dropdownData.DecisionCodes || dropdownData.decisionCodes || []
      ),
      productTypes: this.extractCodeDescriptionArray(
        dropdownData.ProductTypes || dropdownData.productTypes ||
        dropdownData.ProductType || dropdownData.productType || []
      ),
      attributeGroups: this.extractCodeDescriptionArray(
        dropdownData.AttribGroups || dropdownData.attribGroups ||
        dropdownData.AttribGroup || dropdownData.attribGroup ||
        dropdownData.AttributeGroups || dropdownData.attributeGroups ||
        dropdownData.AttrGroups || dropdownData.attrGroups || []
      ),
      attributeCodes: this.extractCodeDescriptionArray(
        dropdownData.AttribCodes || dropdownData.attribCodes ||
        dropdownData.AttribCode || dropdownData.attribCode ||
        dropdownData.AttributeCodes || dropdownData.attributeCodes ||
        dropdownData.AttrCodes || dropdownData.attrCodes || []
      ),
      interCodes: this.extractCodeDescriptionArray(
        dropdownData.InterCodes || dropdownData.interCodes ||
        dropdownData.InterdictionCodes || dropdownData.interdictionCodes || []
      ),
      interTypes: this.extractCodeDescriptionArray(
        dropdownData.InterTypes || dropdownData.interTypes ||
        dropdownData.InterdictionTypes || dropdownData.interdictionTypes || []
      )
    };
  }

  /**
   * Extract an array of { code, description } from BE response.
   */
  private extractCodeDescriptionArray(items: any[]): { code: string; description: string }[] {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item: any) => {
      if (typeof item === 'string') {
        return { code: item, description: '' };
      }
      return {
        code: item.Code || item.code || '',
        description: item.Description || item.description || ''
      };
    });
  }

  /**
   * Normalize property names from API response to model.
   * API returns camelCase which matches our model.
   */
  private normalizePropertyNames(item: any): DonorInterdictionOverrideModel {
    if (!item) return {};

    return {
      donorDecisionCode: item.donorDecisionCode ?? item.DonorDecisionCode ?? undefined,
      decisionDesc: item.decisionDesc ?? item.DecisionDesc ?? undefined,
      productType: item.productType ?? item.ProductType ?? undefined,
      productTypeDesc: item.productTypeDesc ?? item.ProductTypeDesc ?? undefined,
      attributeGroup: item.attribGroup ?? item.AttribGroup ?? item.attributeGroup ?? item.AttributeGroup ?? undefined,
      attributeCode: item.attribCode ?? item.AttribCode ?? item.attributeCode ?? item.AttributeCode ?? undefined,
      interCode: item.interCode ?? item.InterCode ?? undefined,
      interDesc: item.interDesc ?? item.InterDesc ?? undefined,
      interType: item.interType ?? item.InterType ?? undefined,
      overrideDesc: item.overrideDesc ?? item.OverrideDesc ?? undefined,
      effDate: item.effDate ?? item.EffDate ?? null,
      termDate: item.termDate ?? item.TermDate ?? null,
      lastModifiedDate: item.lastModifiedDate ?? item.LastModifiedDate ?? null,
      programId: item.programId ?? item.ProgramId ?? undefined
    };
  }
}
