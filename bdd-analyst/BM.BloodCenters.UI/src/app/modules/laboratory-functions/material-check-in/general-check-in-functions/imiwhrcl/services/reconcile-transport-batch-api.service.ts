import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  BatchHeaderDto,
  BatchReconciliationDto,
  ReasonCodeDto,
  ReconcileBatchRequestDto,
  ReconcileBatchResponseDto,
  ApiResponse,
} from '../models/reconcile-transport-batch.model';

/**
 * API Service for Reconcile Transport Batch (IMIWHRCL)
 * Handles all HTTP requests for reconciling warehouse transport batches
 */
@Injectable({
  providedIn: 'root',
})
export class ReconcileTransportBatchApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.RECONCILE_TRANSPORT_BATCH.BASE}`;

  /**
   * Get list of closed batches available for reconciliation (dropdown options)
   * Endpoint: GET /api/reconcile-transport-batch/batches
   * @returns Observable of batch header options
   */
  getBatches(): Observable<BatchHeaderDto[]> {
    return this.http
      .get<ApiResponse<BatchHeaderDto[]>>(`${this.baseUrl}/batches`)
      .pipe(map((response) => (response.success && response.data ? response.data : [])));
  }

  /**
   * Get batch details with unreceived units
   * Endpoint: GET /api/reconcile-transport-batch/{batchId}
   * @param batchId The batch identifier
   * @returns Observable of batch reconciliation data
   */
  getBatchDetails(batchId: string): Observable<BatchReconciliationDto | null> {
    return this.http
      .get<ApiResponse<BatchReconciliationDto[]>>(
        `${this.baseUrl}/${encodeURIComponent(batchId)}`
      )
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        })
      );
  }

  /**
   * Get active rejection reason codes for dropdown selection
   * Endpoint: GET /api/reconcile-transport-batch/reason-codes
   * @returns Observable of reason codes
   */
  getReasonCodes(): Observable<ReasonCodeDto[]> {
    return this.http
      .get<ApiResponse<ReasonCodeDto[]>>(`${this.baseUrl}/reason-codes`)
      .pipe(map((response) => (response.success && response.data ? response.data : [])));
  }

  /**
   * Reconcile batch units (accept or reject)
   * Endpoint: PUT /api/reconcile-transport-batch/{batchId}/reconcile
   * Units with reconReason are quarantined, units without are accepted
   * @param batchId The batch identifier
   * @param request The reconciliation request with units
   * @returns Observable of reconciliation response
   */
  reconcileBatch(
    batchId: string,
    request: ReconcileBatchRequestDto
  ): Observable<ReconcileBatchResponseDto> {
    return this.http
      .put<ApiResponse<ReconcileBatchResponseDto>>(
        `${this.baseUrl}/${encodeURIComponent(batchId)}/reconcile`,
        request
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Reconciliation failed');
        })
      );
  }
}
