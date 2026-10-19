import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import {
  TestIdOption,
  OverrideRuleModel,
  OverrideRuleRequestParams,
  InterdictionCode,
  OverrideRuleEditModel,
  TestResult,
  TestResultApiResponse
} from '../models/override-rules.model';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
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
}

@Injectable({
  providedIn: 'root'
})
export class OverrideRulesApiService {
  private readonly apiService = inject(ApiService);
  private readonly loginService = inject(LoginService);
  private readonly headerService = inject(HeaderService);

  getTestIds(searchKeyword?: string): Observable<TestIdOption[]> {
    const endpoint = API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.TEST_IDS;

    let params = new HttpParams();
    if (searchKeyword) {
      params = params.set('searchKeyword', searchKeyword);
    }
    params = params.set('chapterId', this.headerService.getCurrentChapterId());

    return this.apiService.get<ReturnResult<TestIdOption>>(endpoint, { params })
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getOverrideRules(
    take: number,
    skip: number,
    params: OverrideRuleRequestParams
  ): Observable<{ data: OverrideRuleModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.GET_RULES(take, skip);
    const body = this.buildRequestBody(params);

    return this.apiService.post<ReturnResult<OverrideRuleModel>>(endpoint, body)
      .pipe(
        map(response => ({
          data: response.data || [],
          totalRecords: response.total || 0
        })),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getInterdictionCodes(): Observable<InterdictionCode[]> {
    const endpoint = API.APPLICATION_ADMIN.APP_ADMIN_INTERDICTION_CODES;

    return this.apiService.get<ReturnResult<InterdictionCode>>(endpoint)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getInterdictionCodesForFilter(testId?: string): Observable<InterdictionCode[]> {
    const endpoint = API.APPLICATION_ADMIN.APP_ADMIN_INTERDICTION_CODES_FILTER;
    let params = new HttpParams();
    if (testId) {
      params = params.set('testId', testId);
    }

    return this.apiService.get<ReturnResult<InterdictionCode>>(endpoint, { params })
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getTestResults(): Observable<TestResult[]> {
    const endpoint = API.APPLICATION_ADMIN.TEST_RESULTS;
    const params = new HttpParams().set('chapterId', this.headerService.getCurrentChapterId());

    return this.apiService.get<ReturnResult<TestResultApiResponse>>(endpoint, { params })
      .pipe(
        map(response => (response.data || []).map(item => ({
          resultCode: item.resulT_CODE,
          resultDescription: item.resulT_DESCRIPTION
        }))),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  saveBulkOverrideRules(rules: OverrideRuleEditModel[]): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.TEST_RESULT_OVERRIDE_RULES.SAVE;
    const loggedInUser = this.loginService.getStoredUsername();
    const chapterId = this.headerService.getCurrentChapterId();

    // Add userId and chapterId to each rule
    const rulesWithUserInfo = rules.map(rule => ({
      ...rule,
      userId: loggedInUser,
      chapterId: chapterId
    }));

    return this.apiService.post<any>(endpoint, rulesWithUserInfo)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  private buildRequestBody(params: OverrideRuleRequestParams): any {
    const body: any = {};

    if (params.testId) {
      body.testId = params.testId;
    }
    if (params.chapterId) {
      body.chapterId = params.chapterId;
    }
    if (params.searchKeyword) {
      body.searchKeyword = params.searchKeyword;
    }
    if (params.overrideFlag) {
      body.overrideFlag = params.overrideFlag;
    }
    if (params.interdictionCode) {
      body.interCode = params.interdictionCode;
    }
    if (params.effectiveDatePeriod) {
      body.periodEffDate = params.effectiveDatePeriod;
    }
    if (params.effectiveDate) {
      body.effectiveDate = params.effectiveDate;
    }
    if (params.terminationDatePeriod) {
      body.periodTermDate = params.terminationDatePeriod;
    }
    if (params.terminationDate) {
      body.terminationDate = params.terminationDate;
    }
    if (params.sort) {
      body.sort = params.sort;
    }

    return body;
  }
}
