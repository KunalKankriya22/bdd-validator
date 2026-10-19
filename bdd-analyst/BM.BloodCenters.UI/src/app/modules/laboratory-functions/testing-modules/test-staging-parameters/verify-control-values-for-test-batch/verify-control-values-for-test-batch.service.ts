import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  TestBatchLovDto,
  TestBatchTestLovDto,
  TestRunLovDto,
  TestKitLovDto,
  ParmValueLovDto,
  TestBatchDetail,
  TestBatchParm,
  TestBatchReagent,
  TestBatchHoldingTest,
  TestBatchParmVerifyDto,
} from './verify-control-values-for-test-batch.model';

/**
 * Service for Verify Control Values for Test Batch (TSIENTPM)
 * Integrates with all 10 backend API endpoints
 */
@Injectable({
  providedIn: 'root',
})
export class VerifyControlValuesForTestBatchService {
  private readonly http = inject(HttpClient);

  /**
   * Get pending test batches (LOV)
   * GET /lab/test-batch-parms/batches?techMode={mode}
   */
  async getPendingBatches(techMode: string = '0'): Promise<TestBatchLovDto[]> {
    const params = new HttpParams().set('techMode', techMode);
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: TestBatchLovDto[] }>(
        API.TEST_BATCH_PARM.GET_PENDING_BATCHES,
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get eligible tests within a batch (LOV)
   * GET /lab/test-batch-parms/batches/{tbId}/tests?techMode={mode}
   */
  async getBatchTests(
    tbId: string,
    techMode: string = '0'
  ): Promise<TestBatchTestLovDto[]> {
    const params = new HttpParams().set('techMode', techMode);
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: TestBatchTestLovDto[] }>(
        API.TEST_BATCH_PARM.GET_BATCH_TESTS(tbId),
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get valid test runs for a test (LOV)
   * GET /lab/test-batch-parms/runs?testId={id}&parmType={type}
   */
  async getTestRuns(
    testId: string,
    parmType?: string
  ): Promise<TestRunLovDto[]> {
    let params = new HttpParams().set('testId', testId);
    if (parmType) {
      params = params.set('parmType', parmType);
    }
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: TestRunLovDto[] }>(
        API.TEST_BATCH_PARM.GET_TEST_RUNS,
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get valid test kits for a test (LOV)
   * GET /lab/test-batch-parms/test-kits?testId={id}&kitLotNumber={lot}
   */
  async getTestKits(
    testId: string,
    kitLotNumber?: string
  ): Promise<TestKitLovDto[]> {
    let params = new HttpParams().set('testId', testId);
    if (kitLotNumber) {
      params = params.set('kitLotNumber', kitLotNumber);
    }
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: TestKitLovDto[] }>(
        API.TEST_BATCH_PARM.GET_TEST_KITS,
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get parameter value LOV (for device/reagent parameter types)
   * GET /lab/test-batch-parms/parameter-values?datatype={type}
   */
  async getParmValuesLov(datatype: string): Promise<ParmValueLovDto[]> {
    const params = new HttpParams().set('datatype', datatype);
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: ParmValueLovDto[] }>(
        API.TEST_BATCH_PARM.GET_PARM_VALUES_LOV,
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get batch detail with test info
   * GET /lab/test-batch-parms/{tbId}/{testId}
   */
  async getBatchDetail(
    tbId: string,
    testId: string
  ): Promise<TestBatchDetail | null> {
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; item: TestBatchDetail }>(
        API.TEST_BATCH_PARM.GET_BATCH_DETAIL(tbId, testId)
      )
    );
    return response.item || null;
  }

  /**
   * Get test batch parameters
   * GET /lab/test-batch-parms/{tbId}/{testId}/parameters
   */
  async getParameters(
    tbId: string,
    testId: string,
    sortColumn?: string,
    sortDirection?: string,
    searchTerm?: string
  ): Promise<TestBatchParm[]> {
    let params = new HttpParams();
    if (sortColumn) {
      params = params.set('sortColumn', sortColumn);
    }
    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: TestBatchParm[] }>(
        API.TEST_BATCH_PARM.GET_PARAMETERS(tbId, testId),
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get reagent information for a test kit
   * GET /lab/test-batch-parms/{tbId}/{testId}/reagents?testKitId={kitId}
   */
  async getReagents(
    tbId: string,
    testId: string,
    testKitId: string,
    sortColumn?: string,
    sortDirection?: string
  ): Promise<TestBatchReagent[]> {
    let params = new HttpParams().set('testKitId', testKitId);
    if (sortColumn) {
      params = params.set('sortColumn', sortColumn);
    }
    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: TestBatchReagent[] }>(
        API.TEST_BATCH_PARM.GET_REAGENTS(tbId, testId),
        { params }
      )
    );
    return response.data || [];
  }

  /**
   * Get holding test results (units in batch) with pagination
   * GET /lab/test-batch-parms/{tbId}/{testId}/results/{take}/{skip}
   */
  async getHoldingTests(
    tbId: string,
    testId: string,
    take: number = 25,
    skip: number = 0,
    sortColumn?: string,
    sortDirection?: string
  ): Promise<{ data: TestBatchHoldingTest[]; totalCount: number }> {
    let params = new HttpParams();
    if (sortColumn) {
      params = params.set('sortColumn', sortColumn);
    }
    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }
    const response = await firstValueFrom(
      this.http.get<{
        success: boolean;
        data: TestBatchHoldingTest[];
        totalCount: number;
      }>(API.TEST_BATCH_PARM.GET_HOLDING_TESTS(tbId, testId, take, skip), { params })
    );
    return {
      data: response.data || [],
      totalCount: response.totalCount || 0,
    };
  }

  /**
   * Verify/save parameters and commit batch
   * PUT /lab/test-batch-parms/{tbId}/{testId}/verify
   */
  /**
   * Save parameters (FMB KEY-COMMIT).
   * If all acceptable, commits automatically. If non-acceptable, saves but doesn't commit.
   */
  async saveParameters(
    tbId: string,
    testId: string,
    dto: TestBatchParmVerifyDto
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    const response = await firstValueFrom(
      this.http.put<{ success: boolean; message?: string; data?: any }>(
        API.TEST_BATCH_PARM.SAVE_PARAMETERS(tbId, testId),
        dto
      )
    );
    return response;
  }

  /**
   * Confirm batch (FMB CONTINUE = 'Y' + COMMIT_BATCH).
   * Calls move_holding_tests to void non-acceptable tests.
   */
  async confirmBatch(
    tbId: string,
    testId: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(
        API.TEST_BATCH_PARM.CONFIRM_BATCH(tbId, testId),
        {}
      )
    );
    return response;
  }

  /**
   * Acquire pessimistic lock on batch/test (FMB SBCLIB.object_lock_unlock 'L')
   */
  async lockBatch(
    tbId: string,
    testId: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(
        API.TEST_BATCH_PARM.LOCK(tbId, testId),
        {}
      )
    );
    return response;
  }

  /**
   * Release pessimistic lock on batch/test (FMB SBCLIB.object_lock_unlock 'U')
   */
  async unlockBatch(
    tbId: string,
    testId: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(
        API.TEST_BATCH_PARM.UNLOCK(tbId, testId),
        {}
      )
    );
    return response;
  }

  /**
   * Validate batch before loading parameters (FMB KEY-NEXT-ITEM checks)
   * Checks band header reconciliation (error 1223) and result entries (error 1407)
   */
  async validateBatch(
    tbId: string,
    testId: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await firstValueFrom(
      this.http.post<{ success: boolean; message?: string }>(
        API.TEST_BATCH_PARM.VALIDATE(tbId, testId),
        {}
      )
    );
    return response;
  }
}
