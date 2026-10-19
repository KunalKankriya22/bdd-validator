import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  PhysicalFindingsTemplateQueryParams,
  PhysicalFindingsTemplateResponse,
  PhysicalFindingsTemplateDetails,
  CreatePhysicalFindingsTemplateDto,
  UpdatePhysicalFindingsTemplateDto,
  UpdateTerminationDateDto,
  BatchUpdateTerminationDateDto,
  DropdownOption
} from '../models/physical-findings-template.model';

/**
 * API endpoints for Physical Findings Template
 * Base Route: /physical-findings-templates
 */
const API_BASE = '/api/v1/physical-findings-templates';

const API_ENDPOINTS = {
  // 1. Get All Templates (Paginated) - POST /{take}/{skip}
  GET_TEMPLATES: (take: number, skip: number) => `${API_BASE}/${take}/${skip}`,

  // 2. Get Template by ID - GET /{templateId}?chapterId={chapterId}&donationType={donationType}&procedureCode={procedureCode}
  GET_TEMPLATE_BY_ID: (templateId: string, chapterId: string, donationType: string, procedureCode?: string | null) => {
    let url = `${API_BASE}/${encodeURIComponent(templateId)}?chapterId=${encodeURIComponent(chapterId)}&donationType=${encodeURIComponent(donationType)}`;
    if (procedureCode) {
      url += `&procedureCode=${encodeURIComponent(procedureCode)}`;
    }
    return url;
  },

  // 3. Get Template List (LOV Dropdown) - GET /templates?donationType={donationType}&procedureCode={procedureCode}
  GET_TEMPLATE_LIST: (donationType: string, procedureCode?: string | null) => {
    let url = `${API_BASE}/templates?donationType=${encodeURIComponent(donationType)}`;
    if (procedureCode) {
      url += `&procedureCode=${encodeURIComponent(procedureCode)}`;
    }
    return url;
  },

  // 4. Create Template - POST /
  CREATE_TEMPLATE: API_BASE,

  // 5. Update Term Date - PATCH /{templateId}/term-date?chapterId={chapterId}&donationType={donationType}&procedureCode={procedureCode}
  UPDATE_TERM_DATE: (templateId: string, chapterId: string, donationType: string, procedureCode?: string | null) => {
    let url = `${API_BASE}/${encodeURIComponent(templateId)}/term-date?chapterId=${encodeURIComponent(chapterId)}&donationType=${encodeURIComponent(donationType)}`;
    if (procedureCode) {
      url += `&procedureCode=${encodeURIComponent(procedureCode)}`;
    }
    return url;
  },

  // 6. Update Template - PUT /{templateId}
  UPDATE_TEMPLATE: (templateId: string) => `${API_BASE}/${encodeURIComponent(templateId)}`,

  // 7. Delete Physical Code from Template - DELETE /{templateId}/{physicalCode}?donationType={donationType}&procedureCode={procedureCode}
  DELETE_PHYSICAL_CODE: (templateId: string, physicalCode: string, donationType: string, procedureCode?: string | null) => {
    let url = `${API_BASE}/${encodeURIComponent(templateId)}/${encodeURIComponent(physicalCode)}?donationType=${encodeURIComponent(donationType)}`;
    if (procedureCode) {
      url += `&procedureCode=${encodeURIComponent(procedureCode)}`;
    }
    return url;
  },

  // 8. Get Donation Types (Dropdown) - GET /donation-types?showInactive={showInactive}&forFilter={forFilter}
  GET_DONATION_TYPES: (showInactive: boolean = false, forFilter: boolean = false) =>
    `${API_BASE}/donation-types?showInactive=${showInactive}&forFilter=${forFilter}`,

  // 9. Get Procedure Codes (Dropdown) - GET /procedure-codes?donationType={donationType}&showInactive={showInactive}&forFilter={forFilter}
  GET_PROCEDURE_CODES: (donationType: string, showInactive: boolean = false, forFilter: boolean = false) =>
    `${API_BASE}/procedure-codes?donationType=${encodeURIComponent(donationType)}&showInactive=${showInactive}&forFilter=${forFilter}`,

  // 9b. Get All Procedure Codes (no donationType filter) - GET /procedure-codes?showInactive={showInactive}&forFilter={forFilter}
  GET_ALL_PROCEDURE_CODES: (showInactive: boolean = false, forFilter: boolean = false) =>
    `${API_BASE}/procedure-codes?showInactive=${showInactive}&forFilter=${forFilter}`,

  // 10. Get Physical Codes (Dropdown) - GET /physical-codes
  GET_PHYSICAL_CODES: `${API_BASE}/physical-codes`,

  // 10b. Get Physical Codes By Rules (Filtered) - GET /physical-codes/by-rules?donationType={donationType}&procedureCode={procedureCode}
  GET_PHYSICAL_CODES_BY_RULES: (donationType: string, procedureCode?: string | null) => {
    let url = `${API_BASE}/physical-codes/by-rules?donationType=${encodeURIComponent(donationType)}`;
    if (procedureCode) {
      url += `&procedureCode=${encodeURIComponent(procedureCode)}`;
    }
    return url;
  },

  // 11. Batch Update Term Date - PATCH /batch/term-date
  BATCH_UPDATE_TERM_DATE: `${API_BASE}/batch/term-date`
};

/**
 * API Response interfaces
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  statusCode: number;
}

interface DropdownItem {
  code: string;
  description: string;
  boxNumber?: number;
  dataType?: string;
}

interface CreateTemplateResponse {
  success: boolean;
  item: unknown;
  message: string;
  statusCode: number;
  data?: { templateId: string }[];
}

interface UpdateResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhysicalFindingsTemplateService {
  private headerService = inject(HeaderService);

  constructor(private apiService: ApiService) {}

  /**
   * Get paginated list of physical findings templates
   * POST /{take}/{skip}
   */
  getTemplates(
    take: number,
    skip: number,
    params?: PhysicalFindingsTemplateQueryParams
  ): Observable<PhysicalFindingsTemplateResponse> {
    const url = API_ENDPOINTS.GET_TEMPLATES(take, skip);
    const body = {
      donationType: params?.donationType,
      procedureCode: params?.procedureCode,
      templateId: params?.templateId,
      physicalCode: params?.physicalCode,
      status: params?.status,
      showInactive: params?.showInactive ?? false,
      searchText: params?.searchKeyword,
      sortDirection: params?.sort,
      sortColumn: params?.sortColumn,
      effectiveDateBefore: params?.effectiveDateBefore,
      effectiveDateAfter: params?.effectiveDateAfter,
      terminationDateBefore: params?.terminationDateBefore,
      terminationDateAfter: params?.terminationDateAfter
    };
    return this.apiService.post<PhysicalFindingsTemplateResponse>(url, body);
  }

  /**
   * Format date to API format (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get template by ID
   * GET /{templateId}?chapterId={chapterId}&donationType={donationType}&procedureCode={procedureCode}
   */
  getTemplateDetails(
    templateId: string,
    donationType: string,
    procedureCode?: string | null
  ): Observable<PhysicalFindingsTemplateDetails> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.get<PhysicalFindingsTemplateDetails>(
      API_ENDPOINTS.GET_TEMPLATE_BY_ID(templateId, chapterId, donationType, procedureCode)
    );
  }

  /**
   * Get template list for dropdown (LOV)
   * GET /templates?donationType={donationType}&procedureCode={procedureCode}
   */
  getTemplateList(
    donationType: string,
    procedureCode?: string | null
  ): Observable<ApiResponse<{ templateId: string; status: string; effDate: string; termDate: string }[]>> {
    return this.apiService.get(
      API_ENDPOINTS.GET_TEMPLATE_LIST(donationType, procedureCode)
    );
  }

  /**
   * Get donation types for dropdown
   * GET /donation-types
   */
  getDonationTypes(showInactive: boolean = false, forFilter: boolean = false): Observable<ApiResponse<DropdownItem[]>> {
    return this.apiService.get<ApiResponse<DropdownItem[]>>(
      API_ENDPOINTS.GET_DONATION_TYPES(showInactive, forFilter)
    );
  }

  /**
   * Get procedure codes for a specific donation type
   * GET /procedure-codes?donationType={donationType}&showInactive={showInactive}&forFilter={forFilter}
   */
  getProcedureCodes(donationType: string, showInactive: boolean = false, forFilter: boolean = false): Observable<ApiResponse<DropdownItem[]>> {
    return this.apiService.get<ApiResponse<DropdownItem[]>>(
      API_ENDPOINTS.GET_PROCEDURE_CODES(donationType, showInactive, forFilter)
    );
  }

  /**
   * Get all procedure codes (not scoped to a donation type)
   * GET /procedure-codes?showInactive={showInactive}&forFilter={forFilter}
   */
  getAllProcedureCodes(showInactive: boolean = false, forFilter: boolean = false): Observable<ApiResponse<DropdownItem[]>> {
    return this.apiService.get<ApiResponse<DropdownItem[]>>(
      API_ENDPOINTS.GET_ALL_PROCEDURE_CODES(showInactive, forFilter)
    );
  }

  /**
   * Get physical codes for dropdown
   * GET /physical-codes
   */
  getPhysicalCodes(): Observable<ApiResponse<DropdownItem[]>> {
    return this.apiService.get<ApiResponse<DropdownItem[]>>(
      API_ENDPOINTS.GET_PHYSICAL_CODES
    );
  }

  /**
   * Get add panel dropdown options (donation types)
   * Wrapper for getDonationTypes to match existing interface
   */
  getAddDropdowns(): Observable<{ donationTypes: DropdownOption[] }> {
    return new Observable(subscriber => {
      this.getDonationTypes().subscribe({
        next: (response) => {
          const donationTypes: DropdownOption[] = (response.data || []).map(item => ({
            key: item.description,
            value: item.code
          }));
          subscriber.next({ donationTypes });
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  /**
   * Get physical codes filtered by donation type and procedure code
   * GET /physical-codes/by-rules?donationType={donationType}&procedureCode={procedureCode}
   */
  getPhysicalCodesByRules(donationType: string, procedureCode?: string | null): Observable<ApiResponse<DropdownItem[]>> {
    return this.apiService.get<ApiResponse<DropdownItem[]>>(
      API_ENDPOINTS.GET_PHYSICAL_CODES_BY_RULES(donationType, procedureCode)
    );
  }

  /**
   * Get available physical codes for selection panel
   * Uses by-rules endpoint when donationType is provided, falls back to unfiltered endpoint
   */
  getAvailablePhysicalCodes(donationType?: string, procedureCode?: string | null): Observable<{ data: { physicalCode: string; description: string; boxNumber: number | null; dataType: string }[] }> {
    const source$ = donationType
      ? this.getPhysicalCodesByRules(donationType, procedureCode)
      : this.getPhysicalCodes();

    return new Observable(subscriber => {
      source$.subscribe({
        next: (response) => {
          const data = (response.data || []).map(item => ({
            physicalCode: item.code,
            description: item.description,
            boxNumber: item.boxNumber ?? null,
            dataType: item.dataType ?? ''
          }));
          subscriber.next({ data });
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  /**
   * Create a new physical findings template
   * POST /
   */
  createTemplate(
    data: CreatePhysicalFindingsTemplateDto
  ): Observable<{ message: string; data?: { templateId: string }[] }> {
    const body = {
      chapterId: this.headerService.getCurrentChapterId(),
      donationType: data.donationType,
      procedureCode: data.procedureCode,
      effDate: data.effectiveDate,
      termDate: data.terminationDate,
      resolveOverlaps: data.resolveOverlaps ?? false,
      physicalCodes: data.physicalCodes.map(pc => ({
        physicalCode: pc.physicalCode,
        sortSequence: pc.sortSequence,
        dataType: pc.dataType ?? null
      }))
    };
    return this.apiService.post<CreateTemplateResponse>(API_ENDPOINTS.CREATE_TEMPLATE, body, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409])
    });
  }

  /**
   * Update an existing template
   * PUT /{templateId}
   */
  updateTemplate(
    data: UpdatePhysicalFindingsTemplateDto
  ): Observable<{ message: string }> {
    const body: Record<string, unknown> = {
      chapterId: this.headerService.getCurrentChapterId(),
      donationType: data.donationType,
      procedureCode: data.procedureCode,
      resolveOverlaps: data.resolveOverlaps ?? false,
      physicalCodes: data.physicalCodes.map(pc => ({
        physicalCode: pc.physicalCode,
        sortSequence: pc.sortSequence,
        dataType: pc.dataType ?? null,
        auditKey: pc.auditKey ?? null
      }))
    };

    if (data.effectiveDate) {
      const effDate = data.effectiveDate instanceof Date
        ? data.effectiveDate
        : new Date(data.effectiveDate as string);
      body['effDate'] = effDate.toISOString();
    }

    if (data.terminationDate) {
      const date = data.terminationDate instanceof Date
        ? data.terminationDate
        : new Date(data.terminationDate as string);
      body['termDate'] = date.toISOString();
    } else {
      body['termDate'] = null;
    }

    return this.apiService.put<UpdateResponse>(
      API_ENDPOINTS.UPDATE_TEMPLATE(data.templateId),
      body,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, [409]) }
    );
  }

  /**
   * Update termination date for a single template
   * PATCH /{templateId}/term-date?chapterId={chapterId}&donationType={donationType}&procedureCode={procedureCode}
   */
  updateTerminationDate(
    data: UpdateTerminationDateDto
  ): Observable<{ message: string; updatedCount: number }> {
    const templateId = data.templateIds[0];
    const chapterId = this.headerService.getCurrentChapterId();
    const url = API_ENDPOINTS.UPDATE_TERM_DATE(templateId, chapterId, data.donationType, data.procedureCode);

    // Format termination date as ISO string if not already
    let termDate: string;
    if (typeof data.terminationDate === 'string') {
      termDate = data.terminationDate;
    } else {
      termDate = (data.terminationDate as Date).toISOString();
    }

    const body = {
      termDate: termDate
    };
    return this.apiService.patch<UpdateResponse>(url, body) as unknown as Observable<{ message: string; updatedCount: number }>;
  }

  /**
   * Batch update termination dates for multiple templates
   * PATCH /batch/term-date
   */
  batchUpdateTerminationDate(
    data: BatchUpdateTerminationDateDto
  ): Observable<{ message: string; updatedCount: number }> {
    return this.apiService.patch<UpdateResponse>(
      API_ENDPOINTS.BATCH_UPDATE_TERM_DATE,
      data
    ) as unknown as Observable<{ message: string; updatedCount: number }>;
  }

  /**
   * Delete a physical code from template
   * DELETE /{templateId}/{physicalCode}?donationType={donationType}&procedureCode={procedureCode}
   */
  deletePhysicalCode(
    templateId: string,
    physicalCode: string,
    donationType: string,
    procedureCode?: string | null
  ): Observable<{ message: string }> {
    return this.apiService.delete<UpdateResponse>(
      API_ENDPOINTS.DELETE_PHYSICAL_CODE(templateId, physicalCode, donationType, procedureCode)
    );
  }

  /**
   * Delete template - legacy method kept for compatibility
   */
  deleteTemplate(
    templateId: string,
    donationType: string,
    procedureCode: string | null
  ): Observable<{ message: string }> {
    // This would need to delete all physical codes from the template
    // For now, return a placeholder
    console.warn('deleteTemplate is deprecated. Use deletePhysicalCode instead.');
    return new Observable(subscriber => {
      subscriber.next({ message: 'Not implemented' });
      subscriber.complete();
    });
  }
}
