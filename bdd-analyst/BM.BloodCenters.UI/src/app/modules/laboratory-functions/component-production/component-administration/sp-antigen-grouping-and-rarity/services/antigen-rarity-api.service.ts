import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  AntigenRarityTest,
  AntigenRarityQueryParams,
  CombinationNumberDropdown,
  CreateAntigenRarityHeaderDto,
  CreateAntigenRarityDetailDto,
  UpdateAntigenRarityHeaderDto,
  UpdateAntigenRarityDetailDto,
  LookUp,
  ReturnResult,
  ValidRarityCodeHeaderApiDto,
  ValidRarityCodeDetailApiDto,
  MatrixIdLovApiDto,
  RarityTestIdLovApiDto,
  RarityTestResultLovApiDto
} from '../models/sp-antigen-grouping.model';

@Injectable({
  providedIn: 'root'
})
export class AntigenRarityApiService {
  private readonly apiService = inject(ApiService);

  getDetailsByMatrixId(
    matrixId: number,
    take: number,
    skip: number
  ): Observable<{ data: AntigenRarityTest[]; totalRecords: number }> {
    const endpoint = API.SP_ANTIGEN_RARITIES.DETAILS_LIST(matrixId, take, skip);

    return this.apiService.get<ReturnResult<ValidRarityCodeDetailApiDto>>(endpoint).pipe(
      map(response => ({
        data: (response.data || []).map(dto => this.mapToAntigenRarityTest(dto)),
        totalRecords: response.totalCount || response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getHeaderById(matrixId: number): Observable<ValidRarityCodeHeaderApiDto> {
    const endpoint = API.SP_ANTIGEN_RARITIES.GET_BY_ID(matrixId);
    return this.apiService.get<ValidRarityCodeHeaderApiDto>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  createHeader(dto: CreateAntigenRarityHeaderDto): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_RARITIES.CREATE;

    return this.apiService.post<ReturnResult>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateHeader(matrixId: number, dto: UpdateAntigenRarityHeaderDto): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_RARITIES.UPDATE(matrixId);

    return this.apiService.put<ReturnResult>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteHeader(matrixId: number): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_RARITIES.DELETE(matrixId);

    return this.apiService.delete<ReturnResult>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  createDetail(dto: CreateAntigenRarityDetailDto): Observable<ReturnResult> {
    const endpoint = API.SP_ANTIGEN_RARITIES.DETAILS(dto.matrixId);

    return this.apiService.post<ReturnResult>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateDetail(
    matrixId: number,
    testId: string,
    dto: UpdateAntigenRarityDetailDto
  ): Observable<ReturnResult> {
    const endpoint = `${API.SP_ANTIGEN_RARITIES.DETAILS(matrixId)}/${encodeURIComponent(testId)}`;

    return this.apiService.put<ReturnResult>(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteDetail(matrixId: number, testId: string): Observable<ReturnResult> {
    const endpoint = `${API.SP_ANTIGEN_RARITIES.DETAILS(matrixId)}/${encodeURIComponent(testId)}`;

    return this.apiService.delete<ReturnResult>(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getMatrixIdsLov(): Observable<CombinationNumberDropdown[]> {
    const endpoint = API.SP_ANTIGEN_RARITIES.LOV_MATRIX_IDS;

    return this.apiService.get<MatrixIdLovApiDto[]>(endpoint).pipe(
      map(response => (response || []).map(dto => ({
        matrixId: dto.matrixId,
        rarityPercent: dto.rarityPercent,
        antigenCombination: dto.antigenCombination
      } as CombinationNumberDropdown))),
      catchError(error => throwError(() => error))
    );
  }

  getTestIdsLov(): Observable<LookUp[]> {
    const endpoint = API.SP_ANTIGEN_RARITIES.LOV_TEST_IDS;

    return this.apiService.get<RarityTestIdLovApiDto[]>(endpoint).pipe(
      map(response => (response || []).map(dto => ({
        key: dto.testId,
        value: dto.testDesc
      }))),
      catchError(error => throwError(() => error))
    );
  }

  getTestResultsLov(testId: string): Observable<LookUp[]> {
    const endpoint = API.SP_ANTIGEN_RARITIES.LOV_TEST_RESULTS;
    const params = new HttpParams().set('testId', testId);

    return this.apiService.get<RarityTestResultLovApiDto[]>(endpoint, { params }).pipe(
      map(response => {
        const items: RarityTestResultLovApiDto[] = Array.isArray(response) ? response : (response as any).data || [];
        const seen = new Set<string>();
        return items.reduce<LookUp[]>((acc: LookUp[], dto: RarityTestResultLovApiDto) => {
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

  private mapToAntigenRarityTest(dto: ValidRarityCodeDetailApiDto): AntigenRarityTest {
    return {
      testId: dto.testId,
      description: dto.testDescription || '',
      result: dto.testResult,
      effDate: dto.effDate,
      termDate: dto.termDate,
      modificationDate: dto.lastModifiedDate,
      matrixId: dto.matrixId
    };
  }
}
