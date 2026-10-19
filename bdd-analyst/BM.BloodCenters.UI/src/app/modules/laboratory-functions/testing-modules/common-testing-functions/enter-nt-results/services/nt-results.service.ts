import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CreateNtBatchRequestDto,
  AddUnitToNtBatchRequestDto,
  NtBatchDto,
  ValidTestDto,
  TestGroupDto,
  TestGroupValidationDto,
  AddUnitResponseDto,
  ApiSingleResponse,
  ApiDataResponse
} from '../models/nt-results.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class NtResultsService {
  private readonly apiService = inject(ApiService);

  createBatch(request: CreateNtBatchRequestDto): Observable<NtBatchDto> {
    return this.apiService.post<ApiSingleResponse<NtBatchDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.CREATE_BATCH, request
    ).pipe(
      map(response => response.item),
      catchError(error => throwError(() => error))
    );
  }

  addUnitToBatch(batchId: string, request: AddUnitToNtBatchRequestDto): Observable<AddUnitResponseDto> {
    return this.apiService.post<ApiSingleResponse<AddUnitResponseDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.ADD_UNIT(batchId), request
    ).pipe(
      map(response => response.item),
      catchError(error => throwError(() => error))
    );
  }

  getValidTests(testGroup?: string): Observable<ValidTestDto[]> {
    return this.apiService.get<ApiDataResponse<ValidTestDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.GET_TESTS(testGroup)
    ).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  getTestById(testId: string): Observable<ValidTestDto> {
    return this.apiService.get<ApiSingleResponse<ValidTestDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.GET_TEST(testId)
    ).pipe(
      map(response => response.item),
      catchError(error => throwError(() => error))
    );
  }

  getTestGroups(): Observable<TestGroupDto[]> {
    return this.apiService.get<ApiDataResponse<TestGroupDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.GET_TEST_GROUPS
    ).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  validateTestGroup(code: string): Observable<TestGroupValidationDto> {
    return this.apiService.get<ApiSingleResponse<TestGroupValidationDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.GET_TEST_GROUP_VALIDATE(code)
    ).pipe(
      map(response => response.item),
      catchError(error => throwError(() => error))
    );
  }

  getBatches(take: number = 25, skip: number = 0): Observable<{ data: NtBatchDto[]; total: number }> {
    return this.apiService.get<ApiDataResponse<NtBatchDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.GET_BATCHES(take, skip)
    ).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  getBatchById(batchId: string): Observable<NtBatchDto> {
    return this.apiService.get<ApiSingleResponse<NtBatchDto>>(
      API.LABORATORY.ENTER_NT_RESULTS.GET_BATCH(batchId)
    ).pipe(
      map(response => response.item),
      catchError(error => throwError(() => error))
    );
  }
}
