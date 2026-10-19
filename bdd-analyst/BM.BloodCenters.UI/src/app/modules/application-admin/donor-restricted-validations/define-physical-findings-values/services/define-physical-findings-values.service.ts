import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  DefinePhysicalFindingsValuesModel,
  DefinePhysicalFindingsValuesParamsDto,
  DefinePhysicalFindingsValuesResponse,
  PhysicalRuleFormData
} from '../models/define-physical-findings-values.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
  Data?: T[];
  Total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DefinePhysicalFindingsValuesService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  constructor() {}

  /**
   * Get Physical Rules table data with pagination
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefinePhysicalFindingsValues(
    take: number,
    skip: number,
    params: DefinePhysicalFindingsValuesParamsDto = {}
  ): Observable<DefinePhysicalFindingsValuesResponse> {
    const endpoint = API.APPLICATION_ADMIN.PHYSICAL_RULES_GET;

    // Map frontend field names to backend field names
    const requestBody: any = {
      chapterId: this.headerService.getCurrentChapterId(),
      take,
      skip,
      searchKeyword: params.searchKeyword,
      donationType: params.donationType,
      procedureCode: params.procedureCode
    };

    if (params.sort === 'D') {
      requestBody.sortOrder = 'DESC';
    } else if (params.sort === 'A') {
      requestBody.sortOrder = 'ASC';
    }

    // Map filter field names to match backend expectations
    if (params.operator) {
      requestBody.itemOperator = params.operator; // Frontend: operator -> Backend: itemOperator
    }
    if (params.interdiction) {
      requestBody.interCode = params.interdiction; // Frontend: interdiction -> Backend: interCode
    }
    if (params.manualAuditFindingsFlag) {
      requestBody.manualAuditFlag = params.manualAuditFindingsFlag === 'Y' ? 'Y' : 'NULL';
    }
    if (params.equipmentType) {
      requestBody.equipType = params.equipmentType; // Frontend: equipmentType -> Backend: equipType
    }
    if (params.effectiveDate) {
      requestBody.effDate = params.effectiveDate; // Frontend: effectiveDate -> Backend: effDate
    }
    if (params.effectivePeriod) {
      requestBody.effectivePeriod = params.effectivePeriod; // Period type (After/Before)
    }
    if (params.terminationDate) {
      requestBody.termDate = params.terminationDate; // Frontend: terminationDate -> Backend: termDate
    }
    if (params.terminationPeriod) {
      requestBody.terminationPeriod = params.terminationPeriod; // Period type (After/Before)
    }

    return this.apiService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        const rawData = response.data || response.Data || [];
        const mappedData = rawData.map((item: any) => ({
          physicalCode: item.physicalCode,
          physicalCodeDescription: item.physicalCodeDescription,
          dataType: item.dataType,
          minimumValue: item.itemValue,
          maximumValue: item.itemValueMax,
          operator: item.itemOperator,
          gender: item.gender,
          fromAge: item.fromAge,
          toAge: item.toAge,
          interdiction: item.interCode,
          interdictionDescription: item.interdictionDescription,
          equipmentType: item.equipType,
          equipmentTypeDescription: item.equipmentTypeDescription,
          commentsRequired: item.commentReqFlag || 'N',
          manualAuditRequired: item.manualAuditFlag || 'N',
          effectiveDate: item.effDate,
          terminationDate: item.termDate,
          donationType: item.donationType,
          donationTypeDescription: item.donationTypeDescription,
          procedureCode: item.procedureCode,
          procedureCodeDescription: item.procedureCodeDescription
        }));

        return {
          data: mappedData,
          totalRecords: response.totalCount || response.total || response.Total || 0
        };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Physical Rule
   * @param data - Physical rule form data
   * @returns Observable with result
   */
  createPhysicalRule(data: PhysicalRuleFormData): Observable<{ success: boolean; message: string }> {
    const endpoint = API.APPLICATION_ADMIN.PHYSICAL_RULES_CREATE;

    const requestBody = {
      chapterId: 'ALL',
      programId: 'PHYRULE',
      donationType: data.donationType,
      procedureCode: data.procedureCode,
      physicalCode: data.physicalCode,
      dataType: data.dataType,
      itemValue: data.minimumValue,
      itemValueMax: data.maximumValue,
      itemOperator: data.operator,
      gender: data.gender,
      fromAge: data.fromAge,
      toAge: data.toAge,
      interCode: data.interdiction,
      commentReqFlag: data.commentsRequired === 'Y' ? 'Y' : null,
      equipType: data.equipmentType,
      manualAuditFlag: data.manualAuditRequired === 'Y' ? 'Y' : null,
      effDate: this.toLocalDateString(data.effectiveDate),
      termDate: this.toLocalDateString(data.terminationDate)
    };

    return this.apiService.post<ReturnResult<DefinePhysicalFindingsValuesModel>>(endpoint, requestBody).pipe(
      map(response => ({
        success: response.success ?? true,
        message: response.message || 'Physical Rule added successfully'
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing Physical Rule
   * @param data - Physical rule form data
   * @returns Observable with result
   */
  updatePhysicalRule(data: PhysicalRuleFormData): Observable<{ success: boolean; message: string }> {
    const endpoint = API.APPLICATION_ADMIN.PHYSICAL_RULES_UPDATE;

    const requestBody = {
      chapterId: 'ALL',
      programId: 'PHYRULE',
      donationType: data.donationType,
      procedureCode: data.procedureCode,
      physicalCode: data.physicalCode,
      newProcedureCode: data.newProcedureCode ?? null,
      newPhysicalCode: data.newPhysicalCode ?? null,
      dataType: data.dataType,
      itemValue: data.minimumValue,
      itemValueMax: data.maximumValue,
      itemOperator: data.operator,
      gender: data.gender,
      fromAge: data.fromAge || null,
      toAge: data.toAge || null,
      interCode: data.interdiction,
      commentReqFlag: data.commentsRequired === 'Y' ? 'Y' : null,
      equipType: data.equipmentType,
      manualAuditFlag: data.manualAuditRequired === 'Y' ? 'Y' : null,
      effDate: this.toLocalDateString(data.effectiveDate),
      termDate: this.toLocalDateString(data.terminationDate)
    };

    return this.apiService.put<any>(endpoint, requestBody).pipe(
      map(response => ({
        success: response.success ?? true,
        message: response.message || 'Physical Rule updated successfully'
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all dropdown/lookup values for form and filters
   * Returns all lookups in a single response
   * @returns Observable with all lookup values
   */
  getLookups(): Observable<any> {
    const chapterId = this.headerService.getCurrentChapterId();
    const endpoint = `${API.APPLICATION_ADMIN.PHYSICAL_RULES_LOOKUPS}/lookups?chapterId=${encodeURIComponent(chapterId)}`;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const rawData = response.data || response.Data || response;
        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        return data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private toLocalDateString(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = date instanceof Date ? date : (date as any).toDate ? (date as any).toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }
}

