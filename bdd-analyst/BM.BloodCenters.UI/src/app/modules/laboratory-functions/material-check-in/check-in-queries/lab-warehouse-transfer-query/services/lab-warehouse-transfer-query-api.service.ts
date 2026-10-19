import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  LabWhTransHdrDto,
  LabWhTransQueryDto,
  LabWhTransQueryResponse,
  LabWhTransCompleteDto,
  WarehouseLookupDto,
  BatchIdLookupDto,
  StatusLookupDto
} from '../models/lab-warehouse-transfer-query.model';

/**
 * API Service for Lab Warehouse Transfer Query
 * Handles all API calls related to warehouse transfer queries
 *
 * Base URL: /api/lab-warehouse-transfer-query
 * JIRA: MLT-12991
 */
@Injectable({ providedIn: 'root' })
export class LabWarehouseTransferQueryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.LAB_WAREHOUSE_TRANSFER_QUERY.BASE}`;

  /**
   * Query warehouse transfers with filters and pagination
   * POST /lab-warehouse-transfer-query/{take}/{skip}
   *
   * @param query - Filter criteria (all fields optional)
   * @param take - Number of records to return (max 100)
   * @param skip - Number of records to skip for pagination
   * @returns Observable of query response with headers and total count
   *
   * Default behavior: If no dates provided, returns last 30 days
   */
  queryTransfers(
    query: LabWhTransQueryDto,
    take: number = 100,
    skip: number = 0
  ): Observable<LabWhTransQueryResponse> {
    const url = `${this.baseUrl}/${take}/${skip}`;
    return this.http.post<LabWhTransQueryResponse>(url, query);
  }

  /**
   * Get single warehouse transfer header by batch ID
   * GET /lab-warehouse-transfer-query/header/{batchId}
   *
   * @param batchId - Unique batch identifier
   * @returns Observable of warehouse transfer header
   * @throws 404 if batch not found
   */
  getHeader(batchId: string): Observable<LabWhTransHdrDto> {
    const url = `${this.baseUrl}/header/${encodeURIComponent(batchId)}`;
    return this.http.get<LabWhTransHdrDto>(url);
  }

  /**
   * Get complete warehouse transfer (header + unit details)
   * GET /lab-warehouse-transfer-query/complete/{batchId}
   *
   * @param batchId - Unique batch identifier
   * @returns Observable of complete warehouse transfer data
   * @throws 404 if batch not found
   */
  getComplete(batchId: string): Observable<LabWhTransCompleteDto> {
    const url = `${this.baseUrl}/complete/${encodeURIComponent(batchId)}`;
    return this.http.get<LabWhTransCompleteDto>(url);
  }

  /**
   * Get warehouse lookup values for dropdown lists
   * GET /lab-warehouse-transfer-query/warehouses
   *
   * @returns Observable of warehouse lookup array
   */
  getWarehouses(): Observable<WarehouseLookupDto[]> {
    const url = `${this.baseUrl}/warehouses`;
    return this.http.get<WarehouseLookupDto[]>(url);
  }

  getBatchIds(): Observable<BatchIdLookupDto[]> {
    const url = `${this.baseUrl}/batch-ids`;
    return this.http.get<BatchIdLookupDto[]>(url);
  }

  getStatuses(): Observable<StatusLookupDto[]> {
    const url = `${this.baseUrl}/statuses`;
    return this.http.get<StatusLookupDto[]>(url);
  }
}
