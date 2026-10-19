import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LabelingInterdictionOverrideModel,
  LabelingInterdictionOverrideSearchParamsDto,
  LabelingInterdictionOverrideDropdowns,
  LabelingInterdictionOverrideCreateDto,
  LabelingInterdictionOverrideUpdateDto
} from '../models/labeling-interdiction-override.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface TableResponse {
  Success?: boolean;
  Data?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  Total?: number;
  total?: number;
  Item?: Record<string, unknown>;
  item?: Record<string, unknown>;
  Message?: string;
  message?: string;
}

interface DropdownItem {
  Code?: string;
  code?: string;
  Description?: string;
  description?: string;
}

interface DropdownResponseData {
  DonorDecisionCodes?: (DropdownItem | string)[];
  donorDecisionCodes?: (DropdownItem | string)[];
  ProductTypes?: (DropdownItem | string)[];
  productTypes?: (DropdownItem | string)[];
  InterCodes?: (DropdownItem | string)[];
  interCodes?: (DropdownItem | string)[];
  InterTypes?: { code: string; description: string }[];
  interTypes?: { code: string; description: string }[];
}

interface FilterDropdownOption {
  key: string;
  value: string;
}

interface FilterDropdownData {
  CueOptions?: FilterDropdownOption[];
  cueOptions?: FilterDropdownOption[];
  TypeOptions?: FilterDropdownOption[];
  typeOptions?: FilterDropdownOption[];
}

interface FilterDropdownResponse {
  data?: FilterDropdownData[];
  Data?: FilterDropdownData[];
}

interface MutationResponse {
  Data?: LabelingInterdictionOverrideModel;
  data?: LabelingInterdictionOverrideModel;
  Total?: number;
  total?: number;
  Message?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabelingInterdictionOverrideService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Labeling Interdiction Override table data with pagination
   * POST /api/v1/labeling-interdiction-override/search-sort-filter/{take}/{skip}
   */
  getLabelingInterdictionOverrides(
    take: number,
    skip: number,
    params: LabelingInterdictionOverrideSearchParamsDto
  ): Observable<{ data: LabelingInterdictionOverrideModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE(take, skip);

    return this.apiService.post<TableResponse>(endpoint, params).pipe(
      map(response => this.extractTableData(response)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get dropdown values for filter and form
   * GET /api/v1/labeling-interdiction-override/dropdowns
   */
  getDropdowns(): Observable<LabelingInterdictionOverrideDropdowns> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_DROPDOWNS;

    return this.apiService.get<TableResponse>(endpoint).pipe(
      map(response => this.extractDropdownData(response)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get filter dropdown values (Cue + Type from actual data table)
   * GET /api/v1/labeling-interdiction-override/filter-dropdown
   */
  getFilterDropdown(): Observable<{ cueOptions: FilterDropdownOption[]; typeOptions: FilterDropdownOption[] }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_FILTER_DROPDOWN;

    return this.apiService.get<FilterDropdownResponse>(endpoint).pipe(
      map(response => {
        const data = response?.data?.[0] || response?.Data?.[0] || {};
        return {
          cueOptions: data.CueOptions || data.cueOptions || [],
          typeOptions: data.TypeOptions || data.typeOptions || []
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Create a new Labeling Interdiction Override
   * POST /api/v1/labeling-interdiction-override/create
   */
  createOverride(data: LabelingInterdictionOverrideCreateDto): Observable<{ data: LabelingInterdictionOverrideModel | null; totalRecords: number; message: string }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_CREATE;

    return this.apiService.post<MutationResponse>(endpoint, data).pipe(
      map(response => ({
        data: response?.Data ?? response?.data ?? null,
        totalRecords: response?.Total ?? response?.total ?? 0,
        message: response?.Message ?? response?.message ?? ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update an existing Labeling Interdiction Override
   * PUT /api/v1/labeling-interdiction-override/update
   */
  updateOverride(data: LabelingInterdictionOverrideUpdateDto): Observable<{ data: LabelingInterdictionOverrideModel | null; totalRecords: number; message: string }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_INTERDICTION_OVERRIDE_UPDATE;

    return this.apiService.put<MutationResponse>(endpoint, data).pipe(
      map(response => ({
        data: response?.Data ?? response?.data ?? null,
        totalRecords: response?.Total ?? response?.total ?? 0,
        message: response?.Message ?? response?.message ?? ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Extract table data from BE response.
   * BE returns PascalCase: { Success, Data: [...], Total, Item, Message }
   */
  private extractTableData(response: TableResponse): { data: LabelingInterdictionOverrideModel[]; totalRecords: number } {
    if (!response) {
      return { data: [], totalRecords: 0 };
    }

    const rawData = response.Data || response.data || [];
    const total: number = response.Total ?? response.total ?? rawData.length;

    const normalizedData = rawData.map(item => this.normalizePropertyNames(item));

    return { data: normalizedData, totalRecords: total };
  }

  /**
   * Extract dropdown data from BE response.
   * BE returns PascalCase wrapper: { Data, Item, Total }
   */
  private extractDropdownData(response: TableResponse): LabelingInterdictionOverrideDropdowns {
    if (!response) {
      return {};
    }

    let dropdownData: DropdownResponseData | null = null;

    if (response.Item) {
      dropdownData = response.Item as unknown as DropdownResponseData;
    } else if (response.item) {
      dropdownData = response.item as unknown as DropdownResponseData;
    } else if (response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
      dropdownData = response.Data[0] as unknown as DropdownResponseData;
    } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      dropdownData = response.data[0] as unknown as DropdownResponseData;
    } else if (response.Data && !Array.isArray(response.Data)) {
      dropdownData = response.Data as unknown as DropdownResponseData;
    } else if (response.data && !Array.isArray(response.data)) {
      dropdownData = response.data as unknown as DropdownResponseData;
    }

    if (!dropdownData) {
      return {};
    }

    return {
      donorDecisionCodes: this.extractDonorDecisionCodes(dropdownData),
      productTypes: this.extractCodeDescriptionArray(dropdownData.ProductTypes || dropdownData.productTypes || []),
      interCodes: this.extractCodeDescriptionArray(dropdownData.InterCodes || dropdownData.interCodes || []),
      interTypes: dropdownData.InterTypes || dropdownData.interTypes || []
    };
  }

  private extractDonorDecisionCodes(data: DropdownResponseData): { code: string; description: string }[] {
    const codes = data.DonorDecisionCodes || data.donorDecisionCodes || [];

    if (!Array.isArray(codes) || codes.length === 0) {
      return [];
    }

    return codes.map((item: DropdownItem | string) => {
      if (typeof item === 'string') {
        return { code: item, description: '' };
      }
      return {
        code: item.Code || item.code || '',
        description: item.Description || item.description || ''
      };
    });
  }

  private extractCodeDescriptionArray(items: (DropdownItem | string)[]): { code: string; description: string }[] {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item: DropdownItem | string) => {
      if (typeof item === 'string') {
        return { code: item, description: '' };
      }
      return {
        code: item.Code || item.code || '',
        description: item.Description || item.description || ''
      };
    });
  }

  private normalizePropertyNames(item: Record<string, unknown>): LabelingInterdictionOverrideModel {
    if (!item) return {};

    return {
      donorDecisionCode: (item['DonorDecisionCode'] ?? item['donorDecisionCode'] ?? undefined) as string | undefined,
      donorDecisionDescription: (item['DonorDecisionDescription'] ?? item['donorDecisionDescription'] ?? undefined) as string | undefined,
      productType: (item['ProductType'] ?? item['productType'] ?? undefined) as string | undefined,
      productTypeDescription: (item['ProductTypeDescription'] ?? item['productTypeDescription'] ?? undefined) as string | undefined,
      interCode: (item['InterCode'] ?? item['interCode'] ?? undefined) as string | undefined,
      interDescription: (item['InterDescription'] ?? item['interDescription'] ?? undefined) as string | undefined,
      interType: (item['InterType'] ?? item['interType'] ?? undefined) as string | undefined,
      overrideDescription: (item['OverrideDescription'] ?? item['overrideDescription'] ?? undefined) as string | undefined,
      effectiveDate: (item['EffectiveDate'] ?? item['effectiveDate'] ?? null) as Date | null,
      terminationDate: (item['TerminationDate'] ?? item['terminationDate'] ?? null) as Date | null,
      lastModifiedDate: (item['LastModifiedDate'] ?? item['lastModifiedDate'] ?? null) as Date | null
    };
  }
}
