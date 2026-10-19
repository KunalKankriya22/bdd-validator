import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReagentStoreDto,
  CreateReagentStoreRequestDto,
  UpdateReagentStoreRequestDto,
  ReagentStoreQueryDto,
  ApiResponse,
} from '../models/enter-reagents-into-repository.model';
import {
  TestIdOption,
  CodeDescOption,
  ReagentCodeDetailOption,
  SupplierOption,
  ReagentIdOption,
} from '../../reagent-query/models/reagent-query.model';

@Injectable({ providedIn: 'root' })
export class EnterReagentsApiService {
  private readonly apiService = inject(ApiService);

  getAll(take: number, skip: number, query: ReagentStoreQueryDto): Observable<{ data: ReagentStoreDto[]; totalCount: number }> {
    const url = API.REAGENT_STORE.LIST(take, skip);
    return this.apiService.post<ApiResponse<ReagentStoreDto[]>>(url, query).pipe(
      map(r => ({ data: r?.data || [], totalCount: r?.totalCount ?? 0 })),
      catchError(e => throwError(() => e))
    );
  }

  getById(reagentId: string, testId: string): Observable<ReagentStoreDto> {
    return this.apiService.get<ApiResponse<ReagentStoreDto>>(API.REAGENT_STORE.GET_BY_ID(reagentId, testId)).pipe(
      map(r => {
        if (r?.item) return r.item;
        if (Array.isArray(r?.data) && r.data.length > 0) return r.data[0];
        return r?.data as any;
      }),
      catchError(e => throwError(() => e))
    );
  }

  create(dto: CreateReagentStoreRequestDto): Observable<ApiResponse<ReagentStoreDto>> {
    return this.apiService.post<ApiResponse<ReagentStoreDto>>(API.REAGENT_STORE.CREATE, dto).pipe(
      catchError(e => throwError(() => e))
    );
  }

  update(reagentId: string, testId: string, dto: UpdateReagentStoreRequestDto): Observable<ApiResponse<ReagentStoreDto>> {
    return this.apiService.put<ApiResponse<ReagentStoreDto>>(API.REAGENT_STORE.UPDATE(reagentId, testId), dto).pipe(
      catchError(e => throwError(() => e))
    );
  }

  getTests(): Observable<TestIdOption[]> {
    return this.apiService.get<ApiResponse<TestIdOption[]>>(API.REAGENT_STORE.LOOKUPS.TESTS).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getReagentTypes(): Observable<CodeDescOption[]> {
    return this.apiService.get<ApiResponse<CodeDescOption[]>>(API.REAGENT_STORE.LOOKUPS.REAGENT_TYPES).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getReagentCodes(testId: string): Observable<ReagentCodeDetailOption[]> {
    return this.apiService.get<ApiResponse<ReagentCodeDetailOption[]>>(`${API.REAGENT_STORE.LOOKUPS.REAGENT_CODES}?testId=${encodeURIComponent(testId)}`).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getSuppliers(): Observable<SupplierOption[]> {
    return this.apiService.get<ApiResponse<SupplierOption[]>>(API.REAGENT_STORE.LOOKUPS.SUPPLIERS).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getContainerTypes(): Observable<CodeDescOption[]> {
    return this.apiService.get<ApiResponse<CodeDescOption[]>>(API.REAGENT_STORE.LOOKUPS.CONTAINERS).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getStorageLocations(): Observable<CodeDescOption[]> {
    return this.apiService.get<ApiResponse<CodeDescOption[]>>(API.REAGENT_STORE.LOOKUPS.STORAGE_LOCATIONS).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getRejectReasons(): Observable<CodeDescOption[]> {
    return this.apiService.get<ApiResponse<CodeDescOption[]>>(API.REAGENT_STORE.LOOKUPS.REJECT_REASONS).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }

  getControlIndicators(): Observable<CodeDescOption[]> {
    return this.apiService.get<ApiResponse<CodeDescOption[]>>(API.REAGENT_STORE.LOOKUPS.CONTROL_INDICATORS).pipe(
      map(r => r?.data || []),
      catchError(e => throwError(() => e))
    );
  }
}
