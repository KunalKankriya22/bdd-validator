import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  AdhocContractDto,
  AdhocBatchDto,
  AdhocBatchUnitDto,
  AdhocTestDto,
  AdhocTestGroupDto,
  AdhocCustomContractDto,
  AdhocValidateUnitResultDto,
  AdhocCheckInRequestDto,
  AdhocCheckInResponseDto,
} from '../models/ad-hoc-tube-check-in.model';

@Injectable({ providedIn: 'root' })
export class AdHocTubeCheckInService {
  private readonly apiService = inject(ApiService);

  getContracts(searchTerm?: string): Observable<AdhocContractDto[]> {
    const params = searchTerm ? new HttpParams().set('searchTerm', searchTerm) : undefined;
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.CONTRACTS, params ? { params } : undefined).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(error => throwError(() => error))
    );
  }

  getContractById(contractId: string): Observable<AdhocContractDto> {
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.CONTRACT_BY_ID(contractId)).pipe(
      map(response => response?.data ?? response),
      catchError(error => throwError(() => error))
    );
  }

  getBatches(contractId: string): Observable<AdhocBatchDto[]> {
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.BATCHES(contractId)).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(error => throwError(() => error))
    );
  }

  getBatchDetails(contractId: string, batchId: string): Observable<AdhocBatchDto> {
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.BATCH_DETAILS(contractId, batchId)).pipe(
      map(response => response?.data ?? response),
      catchError(error => throwError(() => error))
    );
  }

  getUnitsInBatch(batchId: string): Observable<AdhocBatchUnitDto[]> {
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.BATCH_UNITS(batchId)).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(error => throwError(() => error))
    );
  }

  getTestGroups(): Observable<AdhocTestGroupDto[]> {
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.TEST_GROUPS).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(error => throwError(() => error))
    );
  }

  getValidTests(testGroup?: string): Observable<AdhocTestDto[]> {
    const params = testGroup ? new HttpParams().set('testGroup', testGroup) : undefined;
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.TESTS, params ? { params } : undefined).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(error => throwError(() => error))
    );
  }

  getBatchTests(batchId: string): Observable<AdhocCustomContractDto[]> {
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.BATCH_TESTS(batchId)).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(error => throwError(() => error))
    );
  }

  validateUnit(unitId: string, contractId?: string): Observable<AdhocValidateUnitResultDto> {
    const params = contractId ? new HttpParams().set('contractId', contractId) : undefined;
    return this.apiService.get<any>(API.ADHOC_TUBE_CHECKIN.VALIDATE_UNIT(unitId), params ? { params } : undefined).pipe(
      map(response => response?.data ?? response),
      catchError(error => throwError(() => error))
    );
  }

  checkInUnit(request: AdhocCheckInRequestDto): Observable<AdhocCheckInResponseDto> {
    return this.apiService.post<any>(API.ADHOC_TUBE_CHECKIN.CHECK_IN, request).pipe(
      map(response => response?.item ?? response?.data ?? response),
      catchError(error => throwError(() => error))
    );
  }
}
