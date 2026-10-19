import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ReturnResult,
  OpenBatch,
  ValidTest,
  TestKitLookup,
  TestBatchResponse,
  ValidateUnitRequest,
  ValidateUnitResponse,
  ValidateTestRequest,
  ValidateTestResponse,
  CreateTestBatchRequest,
  PrintableTest,
  SubmitPrintRequest,
} from '../models/create-test-batch.model';

@Injectable({ providedIn: 'root' })
export class CreateTestBatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/create-test-batch`;

  getOpenBatches(): Observable<ReturnResult<OpenBatch>> {
    return this.http.get<ReturnResult<OpenBatch>>(`${this.baseUrl}/open-batches`);
  }

  getBatchById(tbId: string): Observable<ReturnResult<TestBatchResponse>> {
    return this.http.get<ReturnResult<TestBatchResponse>>(`${this.baseUrl}/${encodeURIComponent(tbId)}`);
  }

  getValidTests(): Observable<ReturnResult<ValidTest>> {
    return this.http.get<ReturnResult<ValidTest>>(`${this.baseUrl}/valid-tests`);
  }

  getTestKits(testId: string): Observable<ReturnResult<TestKitLookup>> {
    return this.http.get<ReturnResult<TestKitLookup>>(`${this.baseUrl}/test-kits/${encodeURIComponent(testId)}`);
  }

  validateUnit(request: ValidateUnitRequest): Observable<ReturnResult<ValidateUnitResponse>> {
    return this.http.post<ReturnResult<ValidateUnitResponse>>(`${this.baseUrl}/validate-unit`, request);
  }

  validateTest(request: ValidateTestRequest): Observable<ReturnResult<ValidateTestResponse>> {
    return this.http.post<ReturnResult<ValidateTestResponse>>(`${this.baseUrl}/validate-test`, request);
  }

  createOrUpdateBatch(request: CreateTestBatchRequest): Observable<ReturnResult<TestBatchResponse>> {
    return this.http.post<ReturnResult<TestBatchResponse>>(this.baseUrl, request);
  }

  getPrintableTests(tbId: string): Observable<ReturnResult<PrintableTest>> {
    return this.http.get<ReturnResult<PrintableTest>>(`${this.baseUrl}/${encodeURIComponent(tbId)}/printable-tests`);
  }

  submitPrint(request: SubmitPrintRequest): Observable<ReturnResult<boolean>> {
    return this.http.post<ReturnResult<boolean>>(`${this.baseUrl}/print-worksheets`, request);
  }
}
