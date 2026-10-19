import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../../shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  ValidDonationTypeProcedureCodeModel,
  ValidDonationTypeProcedureCodeApiModel,
  ValidDonationTypeProcedureCodeParamsDto,
  DonationTypeProcedureCodeFilterLov,
  AddDonationTypeProcedureCodeDto,
  UpdateDonationTypeProcedureCodeDto,
  DonationTypeLookup,
  ProcedureCodeLookup,
  AttributeGroupLookup,
  AttributeCodeLookup,
  ReturnResult,
  ApiOperationResponse,
  DropdownOptionsResponse,
  AttributeCodesResponse
} from '../models/valid-donation-type-procedure-code.model';

@Injectable({
  providedIn: 'root'
})
export class ValidDonationTypeProcedureCodeService {
  constructor(private apiService: ApiService) {}

  /**
   * Get paginated valid donation type procedure code data
   */
  getValidDonationTypeProcedureCodes(
    pageNumber: number,
    pageSize: number,
    params?: ValidDonationTypeProcedureCodeParamsDto
  ): Observable<{ data: ValidDonationTypeProcedureCodeModel[]; totalRecords: number }> {
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    const payload = {
      searchKeyword: params?.searchKeyword || '',
      donationType: params?.donationType || '',
      procedureCode: params?.procedureCode || '',
      attribGroup: params?.attributeGroup || '',
      attribCode: params?.attributeCode || '',
      effectiveDate: params?.effectiveDate || null,
      effectivePeriod: params?.period || '',
      terminationDate: params?.terminationDate || null,
      terminationPeriod: params?.terminationPeriod || '',
      sort: params?.sort || ''
    };

    return this.apiService.post<{
      success: boolean;
      message: string;
      statusCode: number;
      data: ValidDonationTypeProcedureCodeApiModel[];
      total: number;
      errorResponse: { errorCode: string; error: string };
    }>(
      API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_GET(take, skip),
      payload
    ).pipe(
      map((response) => ({
        data: this.transformApiModelsToPascalCase(response?.data || []),
        totalRecords: response?.total || 0
      }))
    );
  }

  /**
   * Transform API response models (camelCase) to PascalCase models
   */
  private transformApiModelsToPascalCase(
    apiModels: ValidDonationTypeProcedureCodeApiModel[]
  ): ValidDonationTypeProcedureCodeModel[] {
    return apiModels.map(item => ({
      DonationType: item.donationType,
      ProcedureCode: item.procedureCode,
      AttribGroup: item.attribGroup,
      AttribCode: item.attribCode,
      EffDate: item.effDate,
      TermDate: item.termDate,
      SortSequence: item.sortSequence,
      LastModifiedDate: item.lastModifiedDate,
      ProgramId: item.programId,
      Status: item.status
    }));
  }

  /**
   * Get filter dropdown values using dedicated LOV endpoints
   */
  getFilters(): Observable<ReturnResult<DonationTypeProcedureCodeFilterLov>> {
    return forkJoin({
      donationTypes: this.apiService.get<{ data: DonationTypeLookup[], total?: number }>(
        API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_DONATION_TYPES_FILTER
      ),
      procedureCodes: this.apiService.get<{ data: ProcedureCodeLookup[], total?: number }>(
        API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_PROCEDURE_CODES_FILTER
      ),
      attributeGroups: this.apiService.get<{ data: AttributeGroupLookup[], total?: number }>(
        API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_GROUPS_FILTER
      )
    }).pipe(
      map(response => ({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          donationTypes: response.donationTypes?.data || [],
          procedureCodes: response.procedureCodes?.data || [],
          attributeGroups: response.attributeGroups?.data || []
        }
      }))
    );
  }

  /**
   * Get donation type lookup options
   */
  getDonationTypes(): Observable<{ data: DonationTypeLookup[] }> {
    return this.apiService.get<{ data: DonationTypeLookup[], total?: number }>(
      API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_DONATION_TYPES_LOV
    ).pipe(
      map((response) => ({
        data: response?.data || []
      }))
    );
  }

  /**
   * Get procedure code lookup options
   */
  getProcedureCodes(): Observable<{ data: ProcedureCodeLookup[] }> {
    return this.apiService.get<{ data: ProcedureCodeLookup[], total?: number }>(
      API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_PROCEDURE_CODES_LOV
    ).pipe(
      map((response) => ({
        data: response?.data || []
      }))
    );
  }

  /**
   * Get attribute group lookup options
   */
  getAttributeGroups(): Observable<{ data: AttributeGroupLookup[] }> {
    return this.apiService.get<{ data: AttributeGroupLookup[], total?: number }>(
      API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_GROUPS_LOV
    ).pipe(
      map((response) => ({
        data: response?.data || []
      }))
    );
  }

  /**
   * Get attribute code lookup options based on attribute group
   * @param attribGroup Optional attribute group to filter by
   */
  getAttributeCodes(attribGroup?: string): Observable<AttributeCodesResponse> {
    let url: string = API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_CODES_LOV;
    if (attribGroup) {
      url = `${url}?attribGroup=${encodeURIComponent(attribGroup)}`;
    }
    return this.apiService.get<{ data: AttributeCodeLookup[], total?: number }>(url).pipe(
      map((response) => ({
        data: response?.data || []
      }))
    );
  }

  /**
   * Add new valid donation type procedure code record
   */
  addRecord(data: AddDonationTypeProcedureCodeDto): Observable<ApiOperationResponse> {
    return this.apiService.post<ApiOperationResponse>(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ADD, data);
  }

  /**
   * Update existing valid donation type procedure code record
   */
  updateRecord(data: UpdateDonationTypeProcedureCodeDto): Observable<ApiOperationResponse> {
    return this.apiService.put<ApiOperationResponse>(API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_UPDATE, data);
  }

  /**
   * Get all dropdown options using dedicated LOV endpoints
   * Note: Attribute codes are loaded separately based on attribute group selection
   */
  getAllDropdownOptions(): Observable<DropdownOptionsResponse> {
    return forkJoin({
      donationTypes: this.apiService.get<{ data: DonationTypeLookup[], total?: number }>(
        API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_DONATION_TYPES_LOV
      ),
      procedureCodes: this.apiService.get<{ data: ProcedureCodeLookup[], total?: number }>(
        API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_PROCEDURE_CODES_LOV
      ),
      attributeGroups: this.apiService.get<{ data: AttributeGroupLookup[], total?: number }>(
        API.APPLICATION_ADMIN.VALID_DONATION_PROC_ATTRIBUTES_ATTRIB_GROUPS_LOV
      )
    }).pipe(
      map(response => ({
        donationTypes: response.donationTypes?.data || [],
        procedureCodes: response.procedureCodes?.data || [],
        attributeGroups: response.attributeGroups?.data || []
      }))
    );
  }
}
