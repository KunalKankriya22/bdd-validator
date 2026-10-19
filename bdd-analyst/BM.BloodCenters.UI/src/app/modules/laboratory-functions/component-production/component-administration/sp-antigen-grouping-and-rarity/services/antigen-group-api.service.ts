import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  AntigenGroupTest,
  AntigenGroupDropdown,
  AntigenGroupQueryParams,
  CreateAntigenGroupTestDto,
  UpdateAntigenGroupTestDto,
  LookUp,
  ReturnResult,
  AntigenGroupDefinitionApiDto,
  AntigenGroupLookupApiDto,
  TestIdLookupApiDto,
  TestResultLookupApiDto
} from '../models/sp-antigen-grouping.model';

@Injectable({
  providedIn: 'root'
})
export class AntigenGroupApiService {
  private readonly apiService = inject(ApiService);

  getAntigenGroupTests(
    take: number,
    skip: number,
    params: AntigenGroupQueryParams
  ): Observable<{ data: AntigenGroupTest[]; totalRecords: number }> {
    const endpoint = API.SP_ANTIGEN_GROUPS.LIST(take, skip);

    return this.apiService.post<ReturnResult<AntigenGroupDefinitionApiDto>>(endpoint, params).pipe(
      map(response => ({
        data: (response.data || []).map(dto => this.mapToAntigenGroupTest(dto)),
        totalRecords: response.totalCount || response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getAntigenGroupTestById(
    antigenGroup: string,
    testId: string
  ): Observable<AntigenGroupTest | null> {
    const endpoint = API.SP_ANTIGEN_GROUPS.GET_BY_ID(antigenGroup, testId);

    return this.apiService.get<AntigenGroupDefinitionApiDto>(endpoint).pipe(
      map(dto => dto ? this.mapToAntigenGroupTest(dto) : null),
      catchError(error => throwError(() => error))
    );
  }

  createAntigenGroupTest(dto: CreateAntigenGroupTestDto): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_GROUPS.CREATE;

    return this.apiService.post<ReturnResult>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateAntigenGroupTest(
    antigenGroup: string,
    testId: string,
    dto: UpdateAntigenGroupTestDto
  ): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_GROUPS.UPDATE(antigenGroup, testId);

    return this.apiService.put<ReturnResult>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteAntigenGroupTest(antigenGroup: string, testId: string): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_GROUPS.DELETE(antigenGroup, testId);

    return this.apiService.delete<ReturnResult>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getAntigenGroupsLov(): Observable<AntigenGroupDropdown[]> {
    const endpoint = API.SP_ANTIGEN_GROUPS.LOV_ANTIGEN_GROUPS;

    return this.apiService.get<ReturnResult<AntigenGroupLookupApiDto>>(endpoint).pipe(
      map(response => (response.data || []).map(dto => ({
        code: dto.code,
        description: dto.codeDesc
      }))),
      catchError(error => throwError(() => error))
    );
  }

  getTestIdsLov(): Observable<LookUp[]> {
    const endpoint = API.SP_ANTIGEN_GROUPS.LOV_TEST_IDS;

    return this.apiService.get<ReturnResult<TestIdLookupApiDto>>(endpoint).pipe(
      map(response => (response.data || []).map(dto => ({
        key: dto.testId,
        value: dto.testDesc
      }))),
      catchError(error => throwError(() => error))
    );
  }

  getTestResultsLov(testId: string): Observable<LookUp[]> {
    const endpoint = API.SP_ANTIGEN_GROUPS.LOV_TEST_RESULTS;
    const params = new HttpParams().set('testId', testId);

    return this.apiService.get<TestResultLookupApiDto[]>(endpoint, { params }).pipe(
      map(response => {
        const items: TestResultLookupApiDto[] = Array.isArray(response) ? response : (response as any).data || [];
        const seen = new Set<string>();
        return items.reduce<LookUp[]>((acc: LookUp[], dto: TestResultLookupApiDto) => {
          if (!seen.has(dto.resultStatus)) {
            seen.add(dto.resultStatus);
            acc.push({ key: dto.resultStatus, value: dto.codeDesc });
          }
          return acc;
        }, []);
      }),
      catchError(error => throwError(() => error))
    );
  }

  private mapToAntigenGroupTest(dto: AntigenGroupDefinitionApiDto): AntigenGroupTest {
    return {
      testId: dto.testId,
      description: dto.testDesc,
      result: dto.testResult,
      effDate: dto.effDate,
      termDate: dto.termDate,
      modificationDate: dto.lastModifiedDate,
      antigenGroupCode: dto.antigenGroup
    };
  }
}
