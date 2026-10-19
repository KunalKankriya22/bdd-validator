import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import { API } from '../../../../../../core/constants/api.constants';
import {
  ValidReagentCode,
  CreateValidReagentCodeDto,
  UpdateValidReagentCodeDto,
  ValidReagentCodeQueryDto,
  ValidReagentCodeApiResponse,
  ValidReagentCodeOperationResponse,
  ValidTestLov,
  ReagentTypeLov,
  ControlFlagLov,
  PreparationFlagLov
} from '../models/valid-reagent-code.model';

@Injectable({ providedIn: 'root' })
export class ValidReagentCodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get all valid reagent codes with filtering
   * Uses GET with query parameters
   */
  getAll(queryDto: ValidReagentCodeQueryDto): Observable<{ data: ValidReagentCode[]; totalRecords: number }> {
    const params: any = {};

    if (queryDto.TestId) params.testId = queryDto.TestId;
    if (queryDto.ShowTerm) params.showTerm = queryDto.ShowTerm;
    if (queryDto.ReagentType) params.reagentType = queryDto.ReagentType;
    if (queryDto.ControlFlag) params.controlFlag = queryDto.ControlFlag;
    if (queryDto.EffectiveDatePeriod) params.effectiveDatePeriod = queryDto.EffectiveDatePeriod;
    if (queryDto.EffectiveDateAfter) params.effectiveDateAfter = queryDto.EffectiveDateAfter;
    if (queryDto.TerminationDatePeriod) params.terminationDatePeriod = queryDto.TerminationDatePeriod;
    if (queryDto.TerminationDateAfter) params.terminationDateAfter = queryDto.TerminationDateAfter;
    if (queryDto.SearchKeyword) params.searchKeyword = queryDto.SearchKeyword;
    if (queryDto.SortColumn) params.sortColumn = queryDto.SortColumn;
    if (queryDto.SortOrder) params.sortOrder = queryDto.SortOrder;
    if (queryDto.Take !== undefined) params.take = queryDto.Take;
    if (queryDto.Skip !== undefined) params.skip = queryDto.Skip;

    const url = `${this.baseUrl}${API.VALID_REAGENT_CODES.LIST}`;
    return this.http
      .get<ValidReagentCodeApiResponse<ValidReagentCode>>(url, { params })
      .pipe(
        map((response) => ({
          data: response.data || [],
          totalRecords: response.total || 0
        })),
        catchError((error) => {
          console.error('Error fetching valid reagent codes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a single valid reagent code by composite primary key (testId + reagentCode)
   */
  getById(testId: string, reagentCode: string): Observable<ValidReagentCode | null> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_CODES.GET_BY_ID(testId, reagentCode)}`;
    return this.http
      .get<ValidReagentCodeApiResponse<ValidReagentCode>>(url)
      .pipe(
        map((response) => {
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError((error) => {
          console.error('Error fetching valid reagent code by ID:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new valid reagent code
   */
  create(dto: CreateValidReagentCodeDto): Observable<ValidReagentCodeOperationResponse> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_CODES.CREATE}`;
    return this.http
      .post<ValidReagentCodeOperationResponse>(url, dto)
      .pipe(
        catchError((error) => {
          console.error('Error creating valid reagent code:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing valid reagent code
   */
  update(
    testId: string,
    reagentCode: string,
    dto: UpdateValidReagentCodeDto
  ): Observable<ValidReagentCodeOperationResponse> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_CODES.UPDATE(testId, reagentCode)}`;
    return this.http
      .put<ValidReagentCodeOperationResponse>(url, dto)
      .pipe(
        catchError((error) => {
          console.error('Error updating valid reagent code:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a valid reagent code (soft delete - sets termination date)
   */
  delete(testId: string, reagentCode: string): Observable<ValidReagentCodeOperationResponse> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_CODES.DELETE(testId, reagentCode)}`;
    return this.http
      .delete<ValidReagentCodeOperationResponse>(url)
      .pipe(
        catchError((error) => {
          console.error('Error deleting valid reagent code:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of valid tests for Test ID dropdown (LOV)
   */
  getValidTestsLov(): Observable<ValidTestLov[]> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_CODES.TEST_LOV}`;
    return this.http
      .get<ValidReagentCodeApiResponse<ValidTestLov>>(url)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching valid tests LOV:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of reagent types for dropdown (LOV)
   * Hardcoded based on FMB validation: R-Reagent, C-Control, S-Substrate
   */
  getReagentTypesLov(): Observable<ReagentTypeLov[]> {
    return new Observable((observer) => {
      const reagentTypes: ReagentTypeLov[] = [
        { code: 'R', description: 'Reagent' },
        { code: 'C', description: 'Control' },
        { code: 'S', description: 'Substrate' }
      ];
      observer.next(reagentTypes);
      observer.complete();
    });
  }

  /**
   * Get list of control flags for dropdown (LOV)
   * Hardcoded based on FMB validation: P-Positive, N-Negative
   */
  getControlFlagsLov(): Observable<ControlFlagLov[]> {
    return new Observable((observer) => {
      const controlFlags: ControlFlagLov[] = [
        { code: 'P', description: 'Positive' },
        { code: 'N', description: 'Negative' }
      ];
      observer.next(controlFlags);
      observer.complete();
    });
  }

  /**
   * Get list of preparation flags for dropdown (LOV)
   * Hardcoded based on FMB validation: P, Y, I, N
   */
  getPreparationFlagsLov(): Observable<PreparationFlagLov[]> {
    return new Observable((observer) => {
      const preparationFlags: PreparationFlagLov[] = [
        { code: 'P', description: 'Prep necessary' },
        { code: 'Y', description: 'Used in preparation' },
        { code: 'I', description: 'Intermediate' },
        { code: 'N', description: 'Not required' }
      ];
      observer.next(preparationFlags);
      observer.complete();
    });
  }
}
