import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  UnitLevelQCDto,
  UnitLevelQCDetailDto,
  UnitLevelQCQueryDto,
  UnitLevelQCQueryResponse,
  UnitLevelQCDetailResponse,
  UnitLevelQCValidateRequest,
  UnitLevelQCValidateResponse,
  QcStatusResponse,
  CommitQcRequest,
  CommitQcResponse,
  ComponentsResponse,
  TestsResponse
} from '../models/unit-level-qc.model';

@Injectable({
  providedIn: 'root'
})
export class UnitLevelQcApiService {
  private readonly apiService = inject(ApiService);

  queryUnits(
    queryDto: UnitLevelQCQueryDto,
    take: number,
    skip: number
  ): Observable<UnitLevelQCQueryResponse> {
    const endpoint = API.UNIT_LEVEL_QC.QUERY(take, skip);
    return this.apiService.post<UnitLevelQCQueryResponse>(endpoint, queryDto);
  }

  getUnitById(unitId: string): Observable<UnitLevelQCDto> {
    const endpoint = API.UNIT_LEVEL_QC.GET_BY_ID(unitId);
    return this.apiService.get<UnitLevelQCDetailResponse>(endpoint).pipe(
      map(response => response.item)
    );
  }

  getUnitDetail(unitId: string): Observable<UnitLevelQCDetailDto> {
    const endpoint = API.UNIT_LEVEL_QC.GET_DETAIL(unitId);
    return this.apiService.get<UnitLevelQCDetailResponse>(endpoint).pipe(
      map(response => response.item)
    );
  }

  validateUnit(unitId: string): Observable<UnitLevelQCValidateResponse> {
    const endpoint = API.UNIT_LEVEL_QC.VALIDATE(unitId);
    const request: UnitLevelQCValidateRequest = { unitId };
    return this.apiService.post<UnitLevelQCValidateResponse>(endpoint, request, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    });
  }

  getQcStatus(unitId: string): Observable<QcStatusResponse> {
    const endpoint = API.UNIT_LEVEL_QC.QC_STATUS(unitId);
    return this.apiService.get<QcStatusResponse>(endpoint);
  }

  commitQc(unitId: string, request: CommitQcRequest): Observable<CommitQcResponse> {
    const endpoint = API.UNIT_LEVEL_QC.COMMIT_QC(unitId);
    return this.apiService.put<CommitQcResponse>(endpoint, request);
  }

  getComponents(unitId: string): Observable<ComponentsResponse> {
    const endpoint = API.UNIT_LEVEL_QC.COMPONENTS(unitId);
    return this.apiService.get<ComponentsResponse>(endpoint);
  }

  getScheduledTests(unitId: string): Observable<TestsResponse> {
    const endpoint = API.UNIT_LEVEL_QC.TESTS_SCHEDULED(unitId);
    return this.apiService.get<TestsResponse>(endpoint, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    });
  }

  getUnscheduledTests(unitId: string): Observable<TestsResponse> {
    const endpoint = API.UNIT_LEVEL_QC.TESTS_UNSCHEDULED(unitId);
    return this.apiService.get<TestsResponse>(endpoint, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    });
  }
}
