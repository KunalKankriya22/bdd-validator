import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { API } from 'src/app/core/constants/api.constants';
import {
  TestBatchOption, TestOption, RunOption, KitOption,
  DeviceOption, ReagentOption, BatchDetail,
  RetrieveResult, ControlBatchParameter, ControlBatchReagent, ControlBatchUnit,
  ValidateParameterRequest, ValidateParameterResult,
  SaveRequest, SaveResult,
} from '../models/enter-control-values.model';

@Injectable({ providedIn: 'root' })
export class EnterControlValuesService {
  private readonly apiService = inject(ApiService);

  getTestBatchOptions(): Observable<TestBatchOption[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.LOOKUPS_TEST_BATCHES)
      .pipe(map((r) => r.data || r.Data || []));
  }

  getTestOptions(tbId: string): Observable<TestOption[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.LOOKUPS_TESTS(tbId))
      .pipe(map((r) => r.data || r.Data || []));
  }

  getBatchDetail(tbId: string, testId: string): Observable<BatchDetail> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.BATCH_DETAIL(tbId, testId))
      .pipe(map((r) => r.item || r.Item));
  }

  getRunOptions(testId: string, parmType: string): Observable<RunOption[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.LOOKUPS_RUNS(testId, parmType))
      .pipe(map((r) => r.data || r.Data || []));
  }

  getKitOptions(testId: string, kitLotNumber?: string): Observable<KitOption[]> {
    const url = kitLotNumber
      ? `${API.CONTROL_BATCH.LOOKUPS_KITS(testId)}?kitLotNumber=${encodeURIComponent(kitLotNumber)}`
      : API.CONTROL_BATCH.LOOKUPS_KITS(testId);
    return this.apiService
      .get<any>(url)
      .pipe(map((r) => r.data || r.Data || []));
  }

  getDeviceOptions(relatedCode: string): Observable<DeviceOption[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.LOOKUPS_DEVICES(relatedCode))
      .pipe(map((r) => r.data || r.Data || []));
  }

  getReagentLovOptions(testId: string, relatedCode: string): Observable<ReagentOption[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.LOOKUPS_REAGENTS(testId, relatedCode))
      .pipe(map((r) => r.data || r.Data || []));
  }

  retrieve(request: { tbId: string; testId: string; runId?: string; testKitId: string }): Observable<RetrieveResult> {
    return this.apiService
      .post<any>(API.CONTROL_BATCH.RETRIEVE, request)
      .pipe(map((r) => r.item || r.Item));
  }

  validateParameter(request: ValidateParameterRequest): Observable<ValidateParameterResult> {
    return this.apiService
      .post<any>(API.CONTROL_BATCH.VALIDATE_PARAMETER, request, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      })
      .pipe(map((r) => r.item || r.Item));
  }

  save(request: SaveRequest): Observable<SaveResult> {
    return this.apiService
      .post<any>(API.CONTROL_BATCH.SAVE, request)
      .pipe(map((r) => r.item || r.Item));
  }

  getReagents(testKitId: string, chapterId: string): Observable<ControlBatchReagent[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.REAGENTS(testKitId, chapterId))
      .pipe(map((r) => r.data || r.Data || []));
  }

  getUnits(tbId: string, testId: string, chapterId: string): Observable<ControlBatchUnit[]> {
    return this.apiService
      .get<any>(API.CONTROL_BATCH.UNITS(tbId, testId, chapterId))
      .pipe(map((r) => r.data || r.Data || []));
  }
}
