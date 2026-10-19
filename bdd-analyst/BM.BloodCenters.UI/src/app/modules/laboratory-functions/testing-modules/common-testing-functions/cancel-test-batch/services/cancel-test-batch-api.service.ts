import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  WorksheetDto,
  TestIdDto,
  UnitDisplayDto,
  CancelBatchRequest,
  CancelBatchResponseDto,
} from '../models/cancel-test-batch.model';

@Injectable({ providedIn: 'root' })
export class CancelTestBatchApiService {
  private readonly http = inject(HttpClient);

  getWorksheets(): Observable<ReturnResult<WorksheetDto[]>> {
    return this.http.get<ReturnResult<WorksheetDto[]>>(
      API.LABORATORY_FUNCTIONS.CANCEL_TEST_BATCH.WORKSHEETS,
    );
  }

  getTestIds(tbId: string): Observable<ReturnResult<TestIdDto[]>> {
    return this.http.get<ReturnResult<TestIdDto[]>>(
      API.LABORATORY_FUNCTIONS.CANCEL_TEST_BATCH.TESTS(tbId),
    );
  }

  getUnitsInBatch(tbId: string): Observable<ReturnResult<UnitDisplayDto[]>> {
    return this.http.get<ReturnResult<UnitDisplayDto[]>>(
      API.LABORATORY_FUNCTIONS.CANCEL_TEST_BATCH.UNITS(tbId),
    );
  }

  cancelBatch(request: CancelBatchRequest): Observable<ReturnResult<CancelBatchResponseDto>> {
    return this.http.post<ReturnResult<CancelBatchResponseDto>>(
      API.LABORATORY_FUNCTIONS.CANCEL_TEST_BATCH.CANCEL,
      request,
    );
  }
}
