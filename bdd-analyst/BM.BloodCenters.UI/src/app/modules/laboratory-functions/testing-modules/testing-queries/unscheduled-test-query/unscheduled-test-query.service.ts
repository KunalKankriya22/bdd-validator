import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

export interface TestIdOption {
  testId: string;
  testDescription: string;
}

export interface UnscheduledTestResultDto {
  unitId: string;
  chkDigit: string;
  testId: string;
  testSeqNo: number;
  resultStatus1?: string;
  resultStatus1Desc?: string;
  tbId?: string;
  absorbance?: string;
  ratio?: string;
  resultDats?: string;
  resultUserId?: string;
  testingLabCode?: string;
  tbSeqNo?: number;
  wellNumber?: string;
  testMode?: string;
  testModeDesc?: string;
  resultStatus2?: string;
  resultStatus2Desc?: string;
  chapterId?: string;
  testChapterId?: string;
  collDateExists: boolean;
  collDate?: string;
}

export interface UnscheduledTestQueryPayload {
  testId?: string | null;
  unitId?: string | null;
  fromCollDate?: string | null;
  toCollDate?: string | null;
  ntsFlag?: string | null;
  showCancel?: string | null;
  reactive?: string | null;
  take: number;
  skip: number;
}

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total?: number;
  statusCode?: number;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class UnscheduledTestQueryService {
  private readonly api = inject(ApiService);

  getTestIds(): Observable<ApiListResponse<TestIdOption>> {
    return this.api.get<ApiListResponse<TestIdOption>>(API.UNSCHEDULED_TEST_QUERY.TEST_IDS);
  }

  search(payload: UnscheduledTestQueryPayload): Observable<ApiListResponse<UnscheduledTestResultDto>> {
    return this.api.post<ApiListResponse<UnscheduledTestResultDto>>(
      API.UNSCHEDULED_TEST_QUERY.SEARCH,
      payload,
    );
  }
}
