import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import {
  BatchHeaderDto,
  BatchDetailDto,
  BatchDropdownDto,
  ReasonCodeDto,
  ReconcileBatchRequestDto,
  ReconcileBatchResponseDto,
  ApiResponse,
  ApiResponseSingle,
} from '../models/reconcile-lab-warehouse-batch.model';

/**
 * API Service for Reconcile Lab Warehouse Batch (CPIWHRCL/LBWHRCL)
 * Handles all HTTP requests for reconciling lab warehouse transfer batches
 */
@Injectable({
  providedIn: 'root',
})
export class ReconcileLabWarehouseBatchApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/reconcile-lab-warehouse-batch`;

  /**
   * Get list of closed batches available for reconciliation (dropdown options)
   * @returns Observable of batch dropdown options
   */
  getBatches(): Observable<BatchDropdownDto[]> {
    return this.http.get<ApiResponse<BatchDropdownDto>>(`${this.baseUrl}/batches`).pipe(
      map((response) => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        return [];
      })
    );
  }

  /**
   * Get batch header information for a specific batch ID
   * Only returns batches with status 'CLOSE' (ready for reconciliation)
   * @param batchId The batch identifier
   * @returns Observable of batch header data
   */
  getBatchHeader(batchId: string): Observable<BatchHeaderDto | null> {
    return this.http
      .get<ApiResponseSingle<BatchHeaderDto>>(`${this.baseUrl}/batch-header/${encodeURIComponent(batchId)}`)
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
   * Get pending reconciliation items for a batch
   * Only returns items that have not yet been reconciled (RECEIVE_USER and RECEIVE_DATE are NULL)
   * @param batchId The batch identifier
   * @returns Observable of batch detail items
   */
  getBatchDetails(batchId: string): Observable<BatchDetailDto[]> {
    return this.http
      .get<ApiResponse<BatchDetailDto>>(`${this.baseUrl}/batch-details/${encodeURIComponent(batchId)}`)
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.length > 0) {
            return response.data[0];
          }
          return [];
        })
      );
  }

  /**
   * Get active reconciliation reason codes for dropdown selection
   * Only returns codes that are currently active (within EFF_DATE and TERM_DATE)
   * @returns Observable of reason codes
   */
  getReasonCodes(): Observable<ReasonCodeDto[]> {
    return this.http.get<ApiResponse<ReasonCodeDto>>(`${this.baseUrl}/reason-codes`).pipe(
      map((response) => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        return [];
      })
    );
  }

  /**
   * Reconcile batch detail records
   * Updates LAB_WH_TRANS_DTL records, updates warehouse IDs in UNITS or COMPONENTS,
   * manages interdictions (insert 'WTP', delete 'INTR'), and marks batch as 'RECON' when all items are reconciled
   * @param request The reconciliation request with batch ID and detail items
   * @returns Observable of reconciliation response
   */
  reconcileBatch(request: ReconcileBatchRequestDto): Observable<ReconcileBatchResponseDto> {
    return this.http.put<ApiResponseSingle<ReconcileBatchResponseDto>>(`${this.baseUrl}/reconcile`, request).pipe(
      map((response) => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error(response.message || 'Reconciliation failed');
      })
    );
  }
}
