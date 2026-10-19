import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  ProcedureCode,
  ProcedureCodeApiModel,
  ProcedureCodeApiResponse,
  ProcedureCodeCreateRequest,
  ProcedureCodeUpdateRequest,
  ProcedureCodeFilter,
  ProcedureCodeMutationResponse,
  ValidProcedureTypeFilterDropdownValues,
} from '../models/procedure-code.model';

@Injectable({
  providedIn: 'root',
})
export class ProcedureCodeApiService {
  private apiService = inject(ApiService);

  // Transform API model to frontend model
  private transformApiModel(apiModel: ProcedureCodeApiModel): ProcedureCode {
    return {
      procedureCode: apiModel.ProcedureCode,
      description: apiModel.Description,
      deferralDays: apiModel.Duration,
      achievementCredits: apiModel.CreditCount,
      procedureDuration: apiModel.SchViewInterval,
      sequence: apiModel.SortSequence,
      effectiveDate: apiModel.EffDate,
      terminationDate: apiModel.TermDate,
      standardRbcLoss: apiModel.StandardRbcLoss,
      standardPlasmaLoss: apiModel.StandardPlasmaLoss,
      extracorporealRbcLoss: apiModel.EcvRbcLoss,
      extracorporealPlasmaLoss: apiModel.EcvPlasmaLoss,
      chapterId: apiModel.ChapterId,
      isActive: apiModel.IsActive,
    };
  }

  getProcedureCodes(
    take: number,
    skip: number,
    filter?: ProcedureCodeFilter
  ): Observable<{ data: ProcedureCode[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_CODES(take, skip);
    const requestBody = this.buildRequestBody(filter);

    return this.apiService.post<ProcedureCodeApiResponse>(endpoint, requestBody).pipe(
      map((response) => {
        const transformedData = (response.Data || []).map(item => this.transformApiModel(item));
        return {
          data: transformedData,
          total: response.TotalCount || 0,
        };
      }),
      catchError((error) => {
        console.error('Error fetching procedure codes:', error);
        return throwError(() => error);
      })
    );
  }

  createProcedureCode(request: ProcedureCodeCreateRequest): Observable<ProcedureCodeMutationResponse> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_CODE_CREATE;
    return this.apiService.post<ProcedureCodeMutationResponse>(endpoint, request).pipe(
      catchError((error) => {
        console.error('Error creating procedure code:', error);
        return throwError(() => error);
      })
    );
  }

  updateProcedureCode(procedureCode: string, request: ProcedureCodeUpdateRequest): Observable<ProcedureCodeMutationResponse> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_CODE_UPDATE(procedureCode);
    return this.apiService.put<ProcedureCodeMutationResponse>(endpoint, request).pipe(
      catchError((error) => {
        console.error('Error updating procedure code:', error);
        return throwError(() => error);
      })
    );
  }

  getProcedureCodeByCode(code: string): Observable<ProcedureCode> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_CODE_BY_CODE(code);
    return this.apiService.get<ProcedureCodeApiModel>(endpoint).pipe(
      map((apiModel) => this.transformApiModel(apiModel)),
      catchError((error) => {
        console.error('Error fetching procedure code:', error);
        return throwError(() => error);
      })
    );
  }

  getProcedureCodeDropdowns(): Observable<{ procedureCodes: string[]; deferralDays: number[] }> {
    const endpoint = API.APPLICATION_ADMIN.PROCEDURE_CODE_FILTERS;
    return this.apiService.get<ValidProcedureTypeFilterDropdownValues>(endpoint).pipe(
      map((response) => {
        const procedureCodes = (response.procedureCodes || [])
          .map(item => String(item.procedureCode))
          .filter(code => code !== undefined && code !== null && code !== '' && code !== 'undefined' && code !== 'null');

        const deferralDays = (response.deferralDays || [])
          .map(item => item.duration)
          .filter(days => days !== undefined && days !== null);

        return {
          procedureCodes,
          deferralDays
        };
      }),
      catchError((error) => {
        console.error('Error fetching procedure code dropdowns:', error);
        return throwError(() => error);
      })
    );
  }

  private buildRequestBody(filter?: ProcedureCodeFilter): any {
    if (!filter) return {};

    const requestBody: any = {};

    if (filter.search) {
      requestBody.search = filter.search;
    }
    if (filter.procedureCode) {
      requestBody.procedureCode = filter.procedureCode;
    }
    if (filter.deferralDays !== undefined && filter.deferralDays !== null) {
      requestBody.deferralDays = filter.deferralDays;
    }
    if (filter.effDatePeriod) {
      requestBody.effDatePeriod = filter.effDatePeriod;
    }
    if (filter.effDate) {
      requestBody.effDate = filter.effDate;
    }
    if (filter.termDatePeriod) {
      requestBody.termDatePeriod = filter.termDatePeriod;
    }
    if (filter.termDate) {
      requestBody.termDate = filter.termDate;
    }
    if (filter.sortColumn) {
      requestBody.sortColumn = filter.sortColumn;
    }
    if (filter.sortDirection) {
      requestBody.sortDirection = filter.sortDirection;
    }

    return requestBody;
  }
}
