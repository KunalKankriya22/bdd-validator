import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  TbWsOption,
  TestIdOption,
  ResultCodeOption,
  SecondTechTestResultRow,
  SecondTechTestResultResponse,
  SaveSecondTechResultsRequest,
  SaveSecondTechResultsResponse,
  SecondTechValidationResult
} from '../models';

interface ApiListResponse<T> {
  success: boolean;
  statusCode: number;
  data: T[];
  totalCount: number;
}

interface ApiObjectResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

interface SaveResultData {
  resultSummary: string | null;
  hasDiscrepancy: boolean;
  discrepancyMessage: string | null;
  reconciled: boolean;
  resultsMoved: boolean;
}

@Injectable({ providedIn: 'root' })
export class SecondTechTestResultVerificationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/second-tech-test-result';

  getTbWsOptions(): Observable<TbWsOption[]> {
    return this.http
      .get<ApiListResponse<TbWsOption>>(`${this.baseUrl}/test-batch-options`)
      .pipe(map(r => (r.success && r.data ? r.data : [])));
  }

  getTestIdOptions(tbId: string): Observable<TestIdOption[]> {
    return this.http
      .get<ApiListResponse<TestIdOption>>(`${this.baseUrl}/test-id-options/${encodeURIComponent(tbId)}`)
      .pipe(map(r => (r.success && r.data ? r.data : [])));
  }

  getResultCodes(testId: string, antigenFlag: string): Observable<ResultCodeOption[]> {
    const params = new HttpParams().set('testId', testId).set('antigenFlag', antigenFlag);
    return this.http
      .get<ApiListResponse<ResultCodeOption>>(`${this.baseUrl}/result-code-options`, { params })
      .pipe(map(r => (r.success && r.data ? r.data : [])));
  }

  searchTestResults(tbId: string, testId: string): Observable<SecondTechTestResultResponse> {
    return this.http
      .post<ApiListResponse<SecondTechTestResultRow>>(
        `${this.baseUrl}/search-sort-filter/1000/0`,
        { tbId, testId }
      )
      .pipe(
        map(r => ({
          results: r.success && r.data ? r.data : [],
          totalCount: r.totalCount ?? 0
        })),
        catchError(err => {
          if (err?.status === 400) {
            return of({ results: [], totalCount: 0 });
          }
          throw err;
        })
      );
  }

  saveTestResults(request: SaveSecondTechResultsRequest): Observable<SaveSecondTechResultsResponse> {
    const body = {
      tbId: request.tbId,
      testId: request.testId,
      results: request.results.map(r => ({
        tbSeqNo: r.tbSeqNo,
        unitId: r.unitId,
        tempResult2: r.tempResult2 || null
      }))
    };
    return this.http
      .post<ApiObjectResponse<SaveResultData>>(`${this.baseUrl}/save`, body)
      .pipe(
        map(r => ({
          success: r.success,
          message: r.data?.resultSummary ?? undefined,
          hasDiscrepancy: r.data?.hasDiscrepancy ?? false
        }))
      );
  }

  validateResults(results: SecondTechTestResultRow[]): SecondTechValidationResult {
    const countMap = new Map<string, number>();
    results.forEach(r => {
      if (r.tempResult2) {
        countMap.set(r.tempResult2, (countMap.get(r.tempResult2) ?? 0) + 1);
      }
    });

    const summaryParts: string[] = [];
    countMap.forEach((count, code) => summaryParts.push(`${count}:${code}`));
    const resultSummary = summaryParts.join('; ') + (summaryParts.length ? ';' : '');

    const warnings: string[] = [];
    if (summaryParts.length > 0) {
      warnings.push(`Warn:9200: Result Entered - ${resultSummary}. Do you want to continue?`);
    }

    const hasDiscrepancy = results.some(
      r => r.tempResult2 && r.tempResult1 && r.tempResult2 !== r.tempResult1
    );

    return {
      hasWarnings: warnings.length > 0,
      warnings,
      resultSummary,
      hasDiscrepancy
    };
  }
}
