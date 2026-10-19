import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  RextractContract,
  RextractParameter,
  RextractBatchSummary,
  RextractBatchTest,
  RextractUnitDetail,
  ExecuteExtractRequest,
  ApiResponse,
  ResetUnderExtractDto,
  ResetUnderExtractRequestDto,
  ResetUnderExtractResult,
} from './rextract.model';

interface FilterOptionsResponse {
  success: boolean;
  data: { contractId: string; company: string; centerId: string }[];
}
interface ParameterOptionsResponse {
  success: boolean;
  data: { resultParmId: string }[];
}
interface BatchesRequestBody {
  contractId: string;
  resultParmId: string;
  afterTime: null;
  beforeTime: null;
}
interface BatchesResponse {
  success: boolean;
  data: {
    batchId: string;
    insertDats: string;
    profileSetId: string;
    batchChapterId: string;
    profileSeqNo: number;
    unitCount: number;
  }[];
}
interface BatchTestsResponse {
  success: boolean;
  data: { testId: string }[];
}
interface BatchUnitsResponse {
  success: boolean;
  data: {
    unitId: string;
    osUnitId: string;
    testId: string;
    testSeqNo: number;
    resultStatus1: string;
    chkDigit: string;
    osChkDigit: string;
    collDate: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class RextractApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/re-extract-test-results';
  private readonly resetUnderExtractUrl = '/api/v1/reset-under-extract';

  getContracts(): Observable<RextractContract[]> {
    return this.http.get<FilterOptionsResponse>(`${this.baseUrl}/filter-options`).pipe(
      map(r => r.success && r.data
        ? r.data.map(d => ({ contractId: d.contractId, company: d.company, centerId: d.centerId }))
        : []
      )
    );
  }

  getParameters(contractId: string): Observable<RextractParameter[]> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<ParameterOptionsResponse>(`${this.baseUrl}/parameter-options`, { params }).pipe(
      map(r => r.success && r.data
        ? r.data.map(d => ({ resultParmId: d.resultParmId }))
        : []
      )
    );
  }

  getBatches(contractId: string, resultParmId: string): Observable<RextractBatchSummary[]> {
    const body: BatchesRequestBody = { contractId, resultParmId, afterTime: null, beforeTime: null };
    return this.http.post<BatchesResponse>(`${this.baseUrl}/batches`, body).pipe(
      map(r => r.success && r.data
        ? r.data.map(d => ({
            batchId: d.batchId,
            unitCount: d.unitCount,
            insertDats: d.insertDats,
            profileSetId: d.profileSetId,
            batchChapterId: d.batchChapterId,
            profileSeqNo: d.profileSeqNo,
          }))
        : []
      )
    );
  }

  getBatchTests(batchId: string, contractId: string, profileSetId: string, profileSeqNo: number): Observable<RextractBatchTest[]> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('profileSetId', profileSetId)
      .set('profileSeqNo', profileSeqNo.toString());
    return this.http.get<BatchTestsResponse>(`${this.baseUrl}/batches/${batchId}/tests`, { params }).pipe(
      map(r => r.success && r.data ? r.data.map(d => ({ testId: d.testId })) : [])
    );
  }

  getBatchUnits(batchId: string, contractId: string, chapterId: string, extractDate: string): Observable<RextractUnitDetail[]> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('chapterId', chapterId)
      .set('extractDate', extractDate);
    return this.http.get<BatchUnitsResponse>(`${this.baseUrl}/batches/${batchId}/units`, { params }).pipe(
      map(r => r.success && r.data
        ? r.data.map(d => ({
            batchTestId: '',
            unitId: d.unitId,
            osUnitId: d.osUnitId,
            testId: d.testId,
            testSeqNo: d.testSeqNo,
            resultStatus1: d.resultStatus1,
            chkDigit: d.chkDigit,
            osChkDigit: d.osChkDigit,
            collDate: d.collDate,
          }))
        : []
      )
    );
  }

  getEligibleRecords(): Observable<ResetUnderExtractDto[]> {
    return this.http.get<ApiResponse<ResetUnderExtractDto[]>>(this.resetUnderExtractUrl).pipe(
      map(r => r.success && r.data ? r.data : [])
    );
  }

  resetUnderExtract(request: ResetUnderExtractRequestDto): Observable<ApiResponse<ResetUnderExtractResult>> {
    return this.http.post<ApiResponse<ResetUnderExtractResult>>(`${this.resetUnderExtractUrl}/reset`, request);
  }

  executeExtract(request: ExecuteExtractRequest): Observable<ApiResponse<null>> {
    const body = {
      contractId: request.contractId,
      resultParmId: request.resultParmId,
      extractTime: request.extractTime,
      rsmAutoReport: request.rsmAutoReport,
    };
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/execute`, body);
  }
}
