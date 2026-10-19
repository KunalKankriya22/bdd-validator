import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  TestIdOption,
  ReagentCodeOption,
  ReagentCodeDetailOption,
  LotNumberOption,
  ReagentIdOption,
  CodeDescOption,
  SupplierOption,
  ReagentDto,
  ReagentSearchRequest,
  ReagentSearchResponse,
  TestKitsResponse,
  PreparationDetailDto
} from '../models/reagent-query.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface BeReagentResultDto {
  chapterId?: string;
  testId?: string;
  reagentCode?: string;
  reagentName?: string;
  reagentType?: string;
  reagentId?: string;
  lotNumber?: string;
  kitLotNumber?: string;
  receivedDate?: string;
  expiryDate?: string;
  supplierCode?: string;
  supplierName?: string;
  containerId?: string;
  controlInd?: string;
  storageLocation?: string;
  minStorageTemp?: string;
  maxStorageTemp?: string;
  noOfTests?: string;
  remainingTests?: string;
  visualQcFlag?: string;
  rejectReasonCode?: string;
  rejectReasonDescription?: string;
  packageInsertDate?: string;
  receivedBy?: string;
  disposition?: string;
  preparationFlag?: string;
  noteId?: number | null;
}

interface BeSearchResponse {
  data: BeReagentResultDto[];
  total: number;
  success: boolean;
}

const SKIP_TOAST = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({
  providedIn: 'root'
})
export class ReagentQueryService {
  private readonly http = inject(HttpClient);

  getTestIds(): Observable<TestIdOption[]> {
    return this.http
      .get<ApiResponse<TestIdOption[]>>(`${environment.apiUrl}${API.REAGENT_QUERY.TESTS_DROPDOWN}`, SKIP_TOAST)
      .pipe(map(r => r.data || []));
  }

  getTestsFromStore(): Observable<TestIdOption[]> {
    return this.http
      .get<ApiResponse<TestIdOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.TESTS}`)
      .pipe(map(r => r.data || []));
  }

  getReagentCodes(testId: string): Observable<ReagentCodeOption[]> {
    const params = new HttpParams().set('testId', testId);
    return this.http
      .get<ApiResponse<ReagentCodeOption[]>>(`${environment.apiUrl}${API.REAGENT_QUERY.REAGENT_CODES_DROPDOWN}`, { ...SKIP_TOAST, params })
      .pipe(map(r => r.data || []));
  }

  getLotNumbers(testId: string, reagentCode?: string | null): Observable<LotNumberOption[]> {
    let params = new HttpParams().set('testId', testId);
    if (reagentCode) params = params.set('reagentCode', reagentCode);
    return this.http
      .get<ApiResponse<LotNumberOption[]>>(`${environment.apiUrl}${API.REAGENT_QUERY.LOT_NUMBERS_DROPDOWN}`, { ...SKIP_TOAST, params })
      .pipe(map(r => r.data || []));
  }

  getReagentIds(testId: string): Observable<ReagentIdOption[]> {
    const params = new HttpParams().set('testId', testId);
    return this.http
      .get<ApiResponse<ReagentIdOption[]>>(
        `${environment.apiUrl}${API.REAGENT_QUERY.REAGENT_IDS_DROPDOWN}`,
        { ...SKIP_TOAST, params }
      )
      .pipe(map(r => r.data || []));
  }

  searchReagents(request: ReagentSearchRequest): Observable<ReagentSearchResponse> {
    return this.http
      .post<BeSearchResponse>(`${environment.apiUrl}${API.REAGENT_QUERY.SEARCH}`, request, SKIP_TOAST)
      .pipe(map(r => ({
        reagents: (r.data || []).map(item => ({
          reagent: item.reagentCode ?? '',
          reagentDescription: item.reagentName ?? '',
          reagentId: item.reagentId ?? '',
          receivedDate: item.receivedDate ?? '',
          supplier: item.supplierCode ?? '',
          supplierDescription: item.supplierName ?? '',
          expirationDate: item.expiryDate ?? '',
          disposition: item.disposition ?? '',
          kitLotNo: item.kitLotNumber ?? '',
          lotNo: item.lotNumber ?? '',
          receivedBy: item.receivedBy ?? '',
          containerId: item.containerId ?? '',
          controlIndicator: item.controlInd ?? '',
          storageLocation: item.storageLocation ?? '',
          minimumTemperature: item.minStorageTemp ?? '',
          maximumTemperature: item.maxStorageTemp ?? '',
          noOfTests: item.noOfTests ?? '',
          reagentAcceptability: item.visualQcFlag ?? '',
          packageInsertDate: item.packageInsertDate ?? '',
          reagentRejectReason: item.rejectReasonCode ?? '',
          rejectionDescription: item.rejectReasonDescription ?? '',
          reagentType: item.reagentType ?? '',
          remaining: item.remainingTests ?? '',
          noteId: item.noteId ?? null,
          preparationFlag: item.preparationFlag ?? null,
        } as ReagentDto)),
        totalRecords: r.total || 0
      })));
  }

  getTestKits(reagentId: string, testId: string): Observable<TestKitsResponse> {
    const params = new HttpParams().set('testId', testId);
    return this.http
      .get<ApiResponse<TestKitsResponse>>(`${environment.apiUrl}${API.REAGENT_QUERY.BASE}/${reagentId}/test-kits`, { ...SKIP_TOAST, params })
      .pipe(map(r => (Array.isArray(r.data) ? r.data[0] : r.data) || { reagentId, kits: [] }));
  }

  getNote(noteId: number): Observable<string | null> {
    return this.http
      .get<ApiResponse<{ note: string }>>(`${environment.apiUrl}${API.REAGENT_QUERY.BASE}/notes/${noteId}`, SKIP_TOAST)
      .pipe(map(r => r.data?.note ?? null));
  }

  getPreparationDetails(reagentId: string): Observable<PreparationDetailDto[]> {
    return this.http
      .get<ApiResponse<PreparationDetailDto[]>>(`${environment.apiUrl}${API.REAGENT_QUERY.BASE}/${reagentId}/preparation-details`, SKIP_TOAST)
      .pipe(map(r => r.data || []));
  }

  getReagentTypes(): Observable<CodeDescOption[]> {
    return this.http
      .get<ApiResponse<CodeDescOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.REAGENT_TYPES}`)
      .pipe(map(r => r.data || []));
  }

  getReagentCodeDetails(testId: string, reagentType?: string): Observable<ReagentCodeDetailOption[]> {
    let params = new HttpParams().set('testId', testId);
    if (reagentType) {
      params = params.set('reagentType', reagentType);
    }
    return this.http
      .get<ApiResponse<ReagentCodeDetailOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.REAGENT_CODES}`, { params })
      .pipe(map(r => r.data || []));
  }

  getReagentStoreIds(testId: string): Observable<ReagentIdOption[]> {
    const params = new HttpParams().set('testId', testId);
    return this.http
      .get<ApiResponse<ReagentIdOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.REAGENT_IDS}`, { params })
      .pipe(map(r => r.data || []));
  }

  getSuppliers(): Observable<SupplierOption[]> {
    return this.http
      .get<ApiResponse<SupplierOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.SUPPLIERS}`)
      .pipe(map(r => r.data || []));
  }

  getContainerTypes(): Observable<CodeDescOption[]> {
    return this.http
      .get<ApiResponse<CodeDescOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.CONTAINERS}`)
      .pipe(map(r => r.data || []));
  }

  getStorageLocations(): Observable<CodeDescOption[]> {
    return this.http
      .get<ApiResponse<CodeDescOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.STORAGE_LOCATIONS}`)
      .pipe(map(r => r.data || []));
  }

  getRejectReasons(): Observable<CodeDescOption[]> {
    return this.http
      .get<ApiResponse<CodeDescOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.REJECT_REASONS}`)
      .pipe(map(r => r.data || []));
  }

  getControlIndicators(controlFlag?: string): Observable<CodeDescOption[]> {
    const params = controlFlag ? new HttpParams().set('controlFlag', controlFlag) : undefined;
    return this.http
      .get<ApiResponse<CodeDescOption[]>>(`${environment.apiUrl}${API.REAGENT_STORE.LOOKUPS.CONTROL_INDICATORS}`, { ...(params ? { params } : {}) })
      .pipe(map(r => r.data || []));
  }
}
