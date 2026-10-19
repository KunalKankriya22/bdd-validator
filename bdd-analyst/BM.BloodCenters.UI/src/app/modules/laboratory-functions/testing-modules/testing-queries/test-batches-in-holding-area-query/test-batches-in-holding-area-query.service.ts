import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  HoldingTestQueryParams,
  HoldingTestModel,
  ViewInterdictionModel,
  ReturnResult,
  FilterValuesResult,
  MenuAccessResult,
} from './test-batches-in-holding-area-query.model';

@Injectable({
  providedIn: 'root',
})
export class TestBatchesInHoldingAreaQueryService {
  private http = inject(HttpClient);

  private menuAccessCache = new Map<string, boolean>();

  getHoldingTests(params: HoldingTestQueryParams): Observable<ReturnResult<HoldingTestModel[]>> {
    return this.http.post<ReturnResult<HoldingTestModel[]>>(
      API.HOLDING_TESTS_QUERY.SEARCH,
      params
    );
  }

  getTestIds(allOrPending: string): Observable<ReturnResult<string[]>> {
    const httpParams = new HttpParams().set('allOrPending', allOrPending);
    return this.http.get<ReturnResult<string[]>>(
      API.HOLDING_TESTS_QUERY.TEST_IDS,
      { params: httpParams }
    );
  }

  getBatchIds(allOrPending: string, testId?: string | null): Observable<ReturnResult<string[]>> {
    let httpParams = new HttpParams().set('allOrPending', allOrPending);
    if (testId) {
      httpParams = httpParams.set('testId', testId);
    }
    return this.http.get<ReturnResult<string[]>>(
      API.HOLDING_TESTS_QUERY.BATCH_IDS,
      { params: httpParams }
    );
  }

  getInterdictions(tbId: string): Observable<ReturnResult<ViewInterdictionModel[]>> {
    const httpParams = new HttpParams().set('tbId', tbId);
    return this.http.get<ReturnResult<ViewInterdictionModel[]>>(
      API.HOLDING_TESTS_QUERY.INTERDICTIONS,
      { params: httpParams }
    );
  }

  checkMenuAccess(execName: string): Observable<MenuAccessResult> {
    const httpParams = new HttpParams().set('execName', execName);
    return this.http.get<MenuAccessResult>(
      API.HOLDING_TESTS_QUERY.CHECK_MENU_ACCESS,
      { params: httpParams }
    );
  }

  getFilterValues(params: Partial<HoldingTestQueryParams>): Observable<ReturnResult<FilterValuesResult>> {
    return this.http.post<ReturnResult<FilterValuesResult>>(
      API.HOLDING_TESTS_QUERY.FILTER_VALUES,
      params
    );
  }

  getCachedMenuAccess(execName: string): boolean | undefined {
    return this.menuAccessCache.get(execName);
  }

  setCachedMenuAccess(execName: string, hasAccess: boolean): void {
    this.menuAccessCache.set(execName, hasAccess);
  }
}
