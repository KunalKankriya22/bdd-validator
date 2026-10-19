import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

export interface PlateControlDto {
  tbId: string;
  refControl: string;
  refAbsorbance: string;
  cutOffValue: string;
  refRatio: string;
  refResult: string;
  insertDats: string;
}

export interface TestIdDto {
  testId: string;
  testDesc?: string;
}

export interface TestBatchIdDto {
  tbId: string;
  testDesc?: string;
}

export interface PlateControlQueryPayload {
  testId: string;
  tbId?: string | null;
  take: number;
  skip: number;
  sortColumn?: string;
  sortOrder?: string;
}

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class PlateControlsQueryService {
  private readonly api = inject(ApiService);

  getTestIds(): Observable<ApiListResponse<TestIdDto>> {
    return this.api.get<ApiListResponse<TestIdDto>>(API.PLATE_CONTROLS_QUERY.TEST_IDS);
  }

  getTestBatchIds(testId?: string): Observable<ApiListResponse<TestBatchIdDto>> {
    const params = testId
      ? new HttpParams().set('testId', testId)
      : undefined;
    return this.api.get<ApiListResponse<TestBatchIdDto>>(API.PLATE_CONTROLS_QUERY.TEST_BATCH_IDS, { params });
  }

  query(payload: PlateControlQueryPayload): Observable<ApiListResponse<PlateControlDto>> {
    return this.api.post<ApiListResponse<PlateControlDto>>(API.PLATE_CONTROLS_QUERY.QUERY, payload);
  }
}
