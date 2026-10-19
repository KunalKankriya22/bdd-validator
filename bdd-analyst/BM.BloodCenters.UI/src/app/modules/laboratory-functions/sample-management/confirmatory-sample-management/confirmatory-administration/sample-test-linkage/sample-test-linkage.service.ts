import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';

import { API } from '@core/constants/api.constants';
import { SampleType, TestIdOption, TestLinkageRow } from './sample-test-linkage.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data: T;
  total?: number;
}

interface SampleTypeDto {
  code: string;
  description: string;
}

interface ValidTestDto {
  testId: string;
  description: string;
}

interface TestLinkageDto {
  sampleType: string;
  testId: string;
  testDescription: string;
  effDate: string | null;
  termDate: string | null;
}

export interface SaveLinkagePayload {
  sampleType: string;
  linkages: Array<{
    testId: string;
    effDate: string | null;
    termDate: string | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class SampleTestLinkageService {
  constructor(private readonly http: HttpClient) {}

  getValidTests(): Observable<TestIdOption[]> {
    return this.http
      .get<ApiResponse<ApiResponse<ValidTestDto[]>>>(API.SAMPLE_TEST_LINKAGE.VALID_TESTS)
      .pipe(
        map(res =>
          (res.data?.data ?? []).map(dto => ({ value: dto.testId, label: dto.description }))
        )
      );
  }

  getSampleTypes(): Observable<SampleType[]> {
    return this.http
      .get<ApiResponse<ApiResponse<SampleTypeDto[]>>>(API.SAMPLE_TEST_LINKAGE.SAMPLE_TYPES)
      .pipe(
        map(res =>
          (res.data?.data ?? []).map(dto => ({ code: dto.code, name: dto.description }))
        )
      );
  }

  getTestLinkages(sampleType: string): Observable<TestLinkageRow[]> {
    return this.http
      .get<ApiResponse<ApiResponse<TestLinkageDto[]>>>(
        API.SAMPLE_TEST_LINKAGE.TEST_LINKAGES(sampleType)
      )
      .pipe(
        map(res =>
          (res.data?.data ?? []).map((dto, i) => ({
            _rowId: String(i + 1),
            testId: dto.testId,
            effectiveDate: dto.effDate ? moment(dto.effDate) : null,
            terminationDate: dto.termDate ? moment(dto.termDate) : null,
          }))
        )
      );
  }

  saveTestLinkages(sampleType: string, rows: TestLinkageRow[]): Observable<void> {
    const payload: SaveLinkagePayload = {
      sampleType,
      linkages: rows.map(r => ({
        testId: r.testId,
        effDate: r.effectiveDate ? r.effectiveDate.format('YYYY-MM-DD') : null,
        termDate: r.terminationDate ? r.terminationDate.format('YYYY-MM-DD') : null,
      })),
    };
    return this.http
      .post<ApiResponse<any>>(API.SAMPLE_TEST_LINKAGE.SAVE, payload)
      .pipe(map(() => undefined));
  }
}
