import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { HttpHeaders, HttpParams, HttpContext } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from '../../../../../core/constants/http-context.constants';

import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import {
  FindDonorBlockModel,
  ProgramRuleApiResponse,
  AddProgramRuleDto,
  UpdateProgramRuleDto,
  FieldConfigurationApiResponse,
  FieldConfigurationEntry,
  FieldConfigurationDto,
  ProgramIdOption
} from '../models/find-donor-block.model';

@Injectable({
  providedIn: 'root'
})
export class FindDonorBlockService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);
  private readonly BASE_URL = '/api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program';

  /**
   * Get HTTP headers with Chapter ID
   */
  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId
    });
  }

  /**
   * Convert API response to UI model
   */
  private mapApiResponseToModel(apiData: ProgramRuleApiResponse): FindDonorBlockModel {
    return {
      programName: apiData.programName,
      createNewDonor: apiData.allowCreate === 'Y',
      gradeLevel: apiData.gradingLevel || '',
      newAllowed: this.mapYNOToValue(apiData.allowNew),
      newAllowedGrade: apiData.newAllowedLevel || '',
      selectAllowed: this.mapYNOToValue(apiData.allowSelect),
      selectAllowedGrade: apiData.selectAllowedLevels || '',
      selectMultipleGrade: apiData.selectAllowedMultilevel || '',
      holdAllowed: this.mapYNOToValue(apiData.allowHold),
      flag1: apiData.flag1 === 'Y',
      flag2: apiData.flag2 === 'Y',
      flag3: apiData.flag3 === 'Y',
      flag4: apiData.flag4 === 'Y',
      multipleSelection: apiData.multipleSelection,
      updateKeyInfo: apiData.updateKeyInfo,
      enforcePassword: apiData.enforcePassword
    };
  }

  /**
   * Map Y/N/O values to boolean or "Optional"
   */
  private mapYNOToValue(value?: string): boolean | string {
    if (!value) return false;
    if (value === 'Y') return true;
    if (value === 'O') return 'Optional';
    return false;
  }

  /**
   * Map boolean or "Optional" to Y/N/O
   */
  private mapValueToYNO(value: boolean | string | undefined): string {
    if (value === true) return 'Y';
    if (value === 'Optional') return 'O';
    return 'N';
  }

  /**
   * Get all program rules
   * GET /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program
   */
  getProgramRules(searchKeyword?: string): Observable<FindDonorBlockModel[]> {
    const headers = this.getHeaders().set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');
    let params = new HttpParams().set('_t', Date.now().toString());
    if (searchKeyword) {
      params = params.set('search', searchKeyword);
    }
    return this.apiService.get<ProgramRuleApiResponse[]>(
      this.BASE_URL,
      {
        headers: headers,
        params: params
      }
    ).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(item => this.mapApiResponseToModel(item));
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new program rule
   * POST /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program
   */
  addProgramRule(data: AddProgramRuleDto): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>(
      this.BASE_URL,
      data,
      { headers: this.getHeaders(), context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update program rule
   * PUT /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program/{programName}
   */
  updateProgramRule(programName: string, data: UpdateProgramRuleDto): Observable<{ message: string }> {
    const endpoint = `${this.BASE_URL}/${encodeURIComponent(programName)}`;

    return this.apiService.put<{ message: string }>(
      endpoint,
      data,
      { headers: this.getHeaders(), context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get field configurations for a program
   * GET /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program/{programName}/fields
   */
  getFieldConfigurations(programName: string): Observable<FieldConfigurationEntry[]> {
    const endpoint = `${this.BASE_URL}/${encodeURIComponent(programName)}/fields`;
    return this.apiService.get<FieldConfigurationApiResponse[]>(
      endpoint,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(item => ({
            fieldName: item.fieldName,
            required: item.required === 'Y',
            numberOfEntries: item.noOfEntries,
            functionCheck: item.functionCheck === 'Y',
            protectedEntry: item.protectedEntry === 'Y'
          }));
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new field configuration for a program
   * POST /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program/{programName}/fields
   */
  addFieldConfiguration(programName: string, data: FieldConfigurationDto): Observable<{ message: string }> {
    const endpoint = `${this.BASE_URL}/${encodeURIComponent(programName)}/fields`;
    return this.apiService.post<{ message: string }>(
      endpoint,
      data,
      { headers: this.getHeaders(), context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update field configurations for a program (bulk update)
   * PUT /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program/{programName}/fields
   */
  updateFieldConfigurations(programName: string, data: FieldConfigurationDto[]): Observable<{ message: string; programName: string; updatedCount: number }> {
    const endpoint = `${this.BASE_URL}/${encodeURIComponent(programName)}/fields`;
    return this.apiService.put<{ message: string; programName: string; updatedCount: number }>(
      endpoint,
      data,
      { headers: this.getHeaders(), context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a field configuration for a program
   * DELETE /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program/{programName}/fields/{fieldName}
   */
  deleteFieldConfiguration(programName: string, fieldName: string): Observable<{ message: string }> {
    const endpoint = `${this.BASE_URL}/${encodeURIComponent(programName)}/fields/${encodeURIComponent(fieldName)}`;
    return this.apiService.delete<{ message: string }>(
      endpoint,
      { headers: this.getHeaders(), context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Convert UI form data to API DTO for add operation
   */
  mapFormDataToAddDto(formData: any): AddProgramRuleDto {
    return {
      programName: formData.programName,
      allowCreate: formData.createNewDonor ? 'Y' : 'N',
      multipleSelection: formData.multipleSelection || 'N',
      gradingLevel: formData.gradeLevel,
      updateKeyInfo: formData.updateKeyInfo || 'N',
      allowNew: this.mapValueToYNO(formData.newAllowed),
      allowSelect: this.mapValueToYNO(formData.selectAllowed),
      allowHold: this.mapValueToYNO(formData.holdAllowed),
      flag1: formData.flag1 ? 'Y' : 'N',
      flag2: formData.flag2 ? 'Y' : 'N',
      flag3: formData.flag3 ? 'Y' : 'N',
      flag4: formData.flag4 ? 'Y' : 'N',
      selectAllowedLevels: formData.selectAllowedGrade || '0',
      newAllowedLevel: formData.newAllowedGrade || '0',
      selectAllowedMultilevel: formData.selectMultipleGrade || '0',
      enforcePassword: formData.enforcePassword ? 'Y' : 'N'
    };
  }

  /**
   * Convert UI form data to API DTO for update operation
   */
  mapFormDataToUpdateDto(formData: any): UpdateProgramRuleDto {
    return {
      programName: formData.programName || '',
      allowCreate: formData.createNewDonor ? 'Y' : 'N',
      multipleSelection: formData.multipleSelection || 'N',
      gradingLevel: formData.gradeLevel || '0',
      updateKeyInfo: formData.updateKeyInfo || 'N',
      allowNew: this.mapValueToYNO(formData.newAllowed),
      allowSelect: this.mapValueToYNO(formData.selectAllowed),
      allowHold: this.mapValueToYNO(formData.holdAllowed),
      flag1: formData.flag1 ? 'Y' : 'N',
      flag2: formData.flag2 ? 'Y' : 'N',
      flag3: formData.flag3 ? 'Y' : 'N',
      flag4: formData.flag4 ? 'Y' : 'N',
      selectAllowedLevels: formData.selectAllowedGrade || '0',
      newAllowedLevel: formData.newAllowedGrade || '0',
      selectAllowedMultilevel: formData.selectMultipleGrade || '0',
      enforcePassword: formData.enforcePassword || 'N'
    };
  }

  /**
   * Convert field configuration form data to API DTO
   */
  mapFieldConfigToDto(fieldData: any): FieldConfigurationDto {
    return {
      fieldName: fieldData.fieldName,
      required: fieldData.required ? 'Y' : 'N',
      noOfEntries: fieldData.numberOfEntries,
      functionCheck: fieldData.functionCheck ? 'Y' : 'N',
      protectedEntry: fieldData.protectedEntry ? 'Y' : 'N'
    };
  }

  /**
   * Get program IDs for dropdown
   * GET /api/v1/system-users/program-ids
   */
  getProgramIds(): Observable<ProgramIdOption[]> {
    return this.apiService.get<any>(
      '/api/v1/system-users/program-ids',
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response?.data && Array.isArray(response.data)) {
          return response.data as ProgramIdOption[];
        }
        if (Array.isArray(response)) {
          return response as ProgramIdOption[];
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get grade levels from DONOR_GRADING_MATRIX
   * GET /api/v1/application-administration/donor-restricted-validation-tables/configure-find-donor-program/grade-levels
   */
  getGradeLevels(): Observable<string[]> {
    const endpoint = `${this.BASE_URL}/grade-levels`;
    return this.apiService.get<{ grade: number }[]>(
      endpoint,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(item => String(item.grade));
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get dropdown values for add/edit panel.
   * Program names from existing rules; grade levels from DONOR_GRADING_MATRIX via dedicated
   * endpoint, falling back to values derived from existing rules if the endpoint is unavailable.
   */
  getDropdownValues(): Observable<{ programNames: string[], gradeLevels: string[] }> {
    return this.getProgramRules().pipe(
      switchMap(programs => {
        const programNames = [...new Set(programs.map(p => p.programName))].sort();

        return this.getGradeLevels().pipe(
          map(gradeLevels => ({ programNames, gradeLevels })),
          catchError(() => {
            const gradeLevelsSet = new Set(
              programs.map(p => p.gradeLevel).filter((g): g is string => !!g)
            );
            const gradeLevels = gradeLevelsSet.size > 0
              ? [...gradeLevelsSet].sort()
              : ['0', '1', '2', '3', '4'];
            return of({ programNames, gradeLevels });
          })
        );
      }),
      catchError(error => throwError(() => error))
    );
  }
}
