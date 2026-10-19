import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API } from '@core/constants/api.constants';
import { environment } from '../../../../../environments/environment';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  item: T;
  data: T[];
}

import { QueryQcUnitsRequest } from '../models/qc-query-request.model';
import { QueryQcUnitsResponse, SummaryStats } from '../models/qc-query-response.model';
import { QcUnitListItem } from '../models/qc-unit-list-item.model';
import { QcUnitDetail } from '../models/qc-unit-detail.model';
import { SaveQcFlagsRequest } from '../models/qc-save-request.model';
import {
  ContractDropdownItem,
  BatchDropdownItem,
  TestSeriesDropdownItem,
  TestDropdownItem,
} from '../models/dropdown-options.model';

export interface CnrqcPageState {
  formValues: Record<string, unknown>;
  sessionId: string | null;
  units: QcUnitListItem[];
  selectedUnit: QcUnitListItem | null;
  unitDetail: QcUnitDetail | null;
  currentUnitIndex: number;
  summaryStats: SummaryStats | null;
  qcChanges: Map<string, string>;
  testSeriesLov: TestSeriesDropdownItem[];
  testsLov: TestDropdownItem[];
}

/**
 * Service for managing confirmatory QC units workflow
 * Handles session-based QC operations including query, reconciliation, and save
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmatoryQcService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private _savedState: CnrqcPageState | null = null;

  get savedState(): CnrqcPageState | null { return this._savedState; }
  saveState(state: CnrqcPageState): void { this._savedState = state; }
  clearState(): void { this._savedState = null; }

  /**
   * Query QC units using either All Results or Contract/Batch mode
   * Creates a session and acquires lock
   * @param request Query request with filter criteria
   * @returns Observable with session ID, units list, and summary stats
   */
  queryUnits(request: QueryQcUnitsRequest): Observable<QueryQcUnitsResponse> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.QUERY}`;
    return this.http
      .post<ApiResponse<QueryQcUnitsResponse>>(url, request)
      .pipe(map((response) => response.item));
  }

  /**
   * Get list of units for an active session
   * @param sessionId Session ID from query response
   * @returns Observable with units list
   */
  getUnits(sessionId: string): Observable<QcUnitListItem[]> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.UNITS(sessionId)}`;
    return this.http
      .get<ApiResponse<QcUnitListItem>>(url)
      .pipe(map((response) => response.data));
  }

  /**
   * Get detailed information for a specific unit
   * @param sessionId Session ID
   * @param unitId Unit ID
   * @returns Observable with unit detail including test results
   */
  getUnitDetail(sessionId: string, unitId: string): Observable<QcUnitDetail> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.UNIT_DETAIL(sessionId, unitId)}`;
    return this.http
      .get<ApiResponse<QcUnitDetail>>(url)
      .pipe(map((response) => response.item));
  }

  /**
   * Auto-reconcile all units in session
   * Sets QC=Yes if reason='OK', QC=No otherwise
   * @param sessionId Session ID
   * @returns Observable with success indicator
   */
  reconcileAll(sessionId: string): Observable<boolean> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.RECONCILE_ALL(sessionId)}`;
    return this.http
      .post<ApiResponse<boolean>>(url, {})
      .pipe(map((response) => response.item));
  }

  /**
   * Save QC flags (commit operation)
   * Inserts skip samples for QC=No, updates UTRS for QC=Yes, and releases lock
   * @param request Save request with unit QC flags
   * @returns Observable with success indicator
   */
  save(request: SaveQcFlagsRequest): Observable<boolean> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.SAVE(request.sessionId)}`;
    return this.http
      .post<ApiResponse<boolean>>(url, request)
      .pipe(map((response) => response.item));
  }

  /**
   * Clear session and release lock without saving
   * @param sessionId Session ID
   * @returns Observable with success indicator
   */
  clearSession(sessionId: string): Observable<boolean> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.CLEAR_SESSION(sessionId)}`;
    return this.http
      .delete<ApiResponse<boolean>>(url)
      .pipe(map((response) => response.item));
  }

  /**
   * Get contracts for dropdown (Contract/Batch filter mode)
   * @returns Observable with contracts list
   */
  getContracts(): Observable<ContractDropdownItem[]> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.CONTRACTS}`;
    return this.http
      .get<ApiResponse<ContractDropdownItem>>(url)
      .pipe(map((response) => response.data));
  }

  /**
   * Get batches for dropdown with "In Use" indicator
   * @param contractId Optional contract ID filter
   * @returns Observable with batches list
   */
  getBatches(contractId?: string): Observable<BatchDropdownItem[]> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.BATCHES(contractId)}`;
    return this.http
      .get<ApiResponse<BatchDropdownItem>>(url)
      .pipe(map((response) => response.data));
  }

  /**
   * Get test series for dropdown (All Results filter mode)
   * Timezone-aware: filters by chapter local date
   * @returns Observable with test series list
   */
  getTestSeries(): Observable<TestSeriesDropdownItem[]> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.TEST_SERIES}`;
    return this.http
      .get<ApiResponse<TestSeriesDropdownItem>>(url)
      .pipe(map((response) => response.data));
  }

  /**
   * Get tests for dropdown (All Results filter mode)
   * Timezone-aware: filters by chapter local date
   * @returns Observable with tests list
   */
  getTests(): Observable<TestDropdownItem[]> {
    const url = `${this.baseUrl}${API.CONFIRMATORY_QC.TESTS}`;
    return this.http
      .get<ApiResponse<TestDropdownItem>>(url)
      .pipe(map((response) => response.data));
  }
}
