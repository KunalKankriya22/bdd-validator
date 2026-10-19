import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  TransportBatchQueryDto,
  TransportBatchQueryResponse,
  TransportBatchDetailResponse,
  WarehouseLookupResponse,
  BatchStatusLookupResponse,
  RecentBatchResponse,
  TransportBatchHeaderDto,
  TransportBatchDetailDto,
  WarehouseLookupDto,
  BatchStatusLookupDto,
  RecentBatchDto
} from '../models/transport-batch-query.model';

/**
 * API Service for Transport Batch Query
 *
 * Provides methods to interact with the Transport Batch Query API endpoints.
 * All endpoints are read-only and filtered by the authenticated user's chapter.
 */
@Injectable({
  providedIn: 'root'
})
export class TransportBatchQueryApiService {
  private readonly http = inject(HttpClient);

  // Base URLs using centralized API constants
  private readonly BATCHES_URL = `${environment.apiUrl}${API.TRANSPORT_BATCH_QUERY.BATCHES}`;
  private readonly BATCH_DETAILS_URL = (batchId: string) =>
    `${environment.apiUrl}${API.TRANSPORT_BATCH_QUERY.BATCH_DETAILS(batchId)}`;
  private readonly WAREHOUSES_URL = `${environment.apiUrl}${API.TRANSPORT_BATCH_QUERY.WAREHOUSES}`;
  private readonly BATCH_STATUSES_URL = `${environment.apiUrl}${API.TRANSPORT_BATCH_QUERY.BATCH_STATUSES}`;
  private readonly RECENT_BATCHES_URL = `${environment.apiUrl}${API.TRANSPORT_BATCH_QUERY.RECENT_BATCHES}`;

  /**
   * Query transport batches with optional filters and pagination
   *
   * @param filters - Query filter parameters
   * @returns Observable of batch header data with total count
   */
  queryBatches(filters: TransportBatchQueryDto): Observable<{ data: TransportBatchHeaderDto[]; total: number }> {
    return this.http
      .post<TransportBatchQueryResponse>(this.BATCHES_URL, filters)
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        }))
      );
  }

  /**
   * Get all units associated with a specific transport batch
   *
   * @param batchId - The batch identifier
   * @returns Observable of unit detail data with total count
   */
  getBatchDetails(batchId: string): Observable<{ data: TransportBatchDetailDto[]; total: number }> {
    return this.http
      .get<TransportBatchDetailResponse>(this.BATCH_DETAILS_URL(batchId))
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        }))
      );
  }

  /**
   * Get active warehouse locations for dropdown/filter selection
   *
   * Automatically filtered by current chapter
   *
   * @returns Observable of warehouse lookup data
   */
  getWarehouses(): Observable<WarehouseLookupDto[]> {
    return this.http
      .get<WarehouseLookupResponse>(this.WAREHOUSES_URL)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get distinct batch statuses that exist in the current chapter
   *
   * @returns Observable of batch status lookup data
   */
  getBatchStatuses(): Observable<BatchStatusLookupDto[]> {
    return this.http
      .get<BatchStatusLookupResponse>(this.BATCH_STATUSES_URL)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get recent batches (last 183 days) for dropdown selection
   *
   * @param take - Number of batches to return (default: 50)
   * @returns Observable of recent batch data
   */
  getRecentBatches(take: number = 50): Observable<RecentBatchDto[]> {
    const params = new HttpParams().set('take', take.toString());

    return this.http
      .get<RecentBatchResponse>(this.RECENT_BATCHES_URL, { params })
      .pipe(map(response => response.data || []));
  }
}
