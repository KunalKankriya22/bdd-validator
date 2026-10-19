import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import type {
  ProcessCodeItem,
  StageCodeItem,
  ProductCodeItem,
  CellCodeItem,
  UnitInfoResponse,
  ComponentInfoResponse,
  SearchDifferentialRequest,
  ComponentDiffHdr,
  ComponentDifferentialHeaderResponse,
  CreateDifferentialRequest,
  UpdateDifferentialRequest,
  ComponentDifferentialApiResponse,
} from '../models/enter-component-differential.model';

@Injectable({ providedIn: 'root' })
export class EnterComponentDifferentialService {
  private readonly apiService = inject(ApiService);

  getProcessCodes(): Observable<ProcessCodeItem[]> {
    return this.apiService.get<ComponentDifferentialApiResponse<{ code: string; description: string }[]>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_PROCESS_CODES
    ).pipe(
      map((response) => (response?.data ?? []).map(item => ({
        processCode: item.code,
        description: item.description,
      }))),
      catchError(() => of([]))
    );
  }

  getStageCodes(processCode: string): Observable<StageCodeItem[]> {
    return this.apiService.get<ComponentDifferentialApiResponse<{ code: string; description: string }[]>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_STAGE_CODES(processCode),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => (response?.data ?? []).map(item => ({
        stageCode: item.code,
        description: item.description,
      }))),
      catchError(() => of([]))
    );
  }

  getCellCodes(): Observable<CellCodeItem[]> {
    return this.apiService.get<ComponentDifferentialApiResponse<{ code: string; description: string }[]>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_CELL_CODES
    ).pipe(
      map((response) => (response?.data ?? []).map(item => ({
        cellCode: item.code,
        description: item.description,
      }))),
      catchError(() => of([]))
    );
  }

  getProductCodes(unitId: string, collDate: string, processCode: string): Observable<ProductCodeItem[]> {
    return this.apiService.get<ComponentDifferentialApiResponse<ProductCodeItem[]>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_PRODUCT_CODES(unitId, collDate, processCode),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => response?.data ?? []),
      catchError(() => of([]))
    );
  }

  getUnitInfo(unitId: string): Observable<UnitInfoResponse | null> {
    return this.apiService.get<ComponentDifferentialApiResponse<UnitInfoResponse>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_UNIT_INFO(unitId),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => response?.data ?? null),
      catchError(() => of(null))
    );
  }

  getComponentInfo(
    unitId: string, collDate: string, productCode: string,
    componentPrefix: string, processCode: string
  ): Observable<ComponentInfoResponse | null> {
    return this.apiService.get<ComponentDifferentialApiResponse<ComponentInfoResponse>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_COMPONENT_INFO(unitId, collDate, productCode, componentPrefix, processCode),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => response?.data ?? null),
      catchError(() => of(null))
    );
  }

  search(take: number, skip: number, filters: SearchDifferentialRequest): Observable<{ data: ComponentDiffHdr[]; total: number }> {
    return this.apiService.post<ComponentDifferentialApiResponse<ComponentDiffHdr[]>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.SEARCH(take, skip),
      filters,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => ({
        data: response?.data ?? [],
        total: response?.total ?? 0,
      })),
      catchError(() => of({ data: [], total: 0 }))
    );
  }

  getById(differentialId: number): Observable<ComponentDifferentialHeaderResponse | null> {
    return this.apiService.get<ComponentDifferentialApiResponse<ComponentDifferentialHeaderResponse>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.GET_BY_ID(differentialId),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => response?.data ?? null),
      catchError(() => of(null))
    );
  }

  create(request: CreateDifferentialRequest): Observable<ComponentDifferentialApiResponse<{ differentialId: number; cellCode: string }>> {
    return this.apiService.post<ComponentDifferentialApiResponse<{ differentialId: number; cellCode: string }>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.CREATE,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  update(differentialId: number, cellCode: string, request: UpdateDifferentialRequest): Observable<ComponentDifferentialApiResponse<{ differentialId: number; cellCode: string }>> {
    return this.apiService.put<ComponentDifferentialApiResponse<{ differentialId: number; cellCode: string }>>(
      API.ENTER_COMPONENT_DIFFERENTIAL.UPDATE(differentialId, cellCode),
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
