import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  ApiItemResponse,
  ContractDto,
  OptionCodeDto,
  ReasonCodeDto,
  BatchUnitsRequestDto,
  BatchUnitDto,
  SkippedUnitDto,
  SkippedUnitsRequestDto,
  ValidateUnitRequestDto,
  UnitValidationResultDto,
  SkipUnitsRequestDto,
  SkipUnitsResultDto,
  ResetUnitsRequestDto,
  ResetUnitsResultDto,
  TestBatchOption,
} from '../models/skip-results-from-extraction.model';

@Injectable({ providedIn: 'root' })
export class SkipResultsFromExtractionApiService {
  private readonly http = inject(HttpClient);

  /** GET /skip-results-from-extraction/contracts */
  getContracts(): Observable<ContractDto[]> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.CONTRACTS}`;
    return this.http.get<ApiResponse<ContractDto[]>>(url).pipe(
      map((response) => response.data || [])
    );
  }

  /** GET /skip-results-from-extraction/option-codes */
  getOptionCodes(): Observable<OptionCodeDto[]> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.OPTION_CODES}`;
    return this.http.get<ApiResponse<OptionCodeDto[]>>(url).pipe(
      map((response) => response.data || [])
    );
  }

  /**
   * GET /skip-results-from-extraction/reason-codes/{optionCode}
   * @param optionCode - 'S' for skip reasons, 'R' for reset reasons
   */
  getReasonCodes(optionCode: 'S' | 'R'): Observable<ReasonCodeDto[]> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.REASON_CODES}/${optionCode}`;
    return this.http
      .get<ApiResponse<Array<{ value: string; label: string }>>>(url)
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({ code: item.value, codeDesc: item.label }))
        )
      );
  }

  /** GET /skip-results-from-extraction/batches/{contractId} */
  getBatches(contractId: string): Observable<TestBatchOption[]> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.BATCHES}/${contractId}`;
    return this.http
      .get<ApiResponse<Array<{ value: string; label: string }>>>(url)
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({ batchId: item.value, displayText: item.label }))
        )
      );
  }

  /** POST /skip-results-from-extraction/batch-units */
  getBatchUnits(request: BatchUnitsRequestDto): Observable<BatchUnitDto[]> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.BATCH_UNITS}`;
    return this.http.post<ApiResponse<BatchUnitDto[]>>(url, request).pipe(
      map((response) => response.data || [])
    );
  }

  /** POST /skip-results-from-extraction/validate-unit */
  validateUnit(request: ValidateUnitRequestDto): Observable<UnitValidationResultDto> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.VALIDATE_UNIT}`;
    return this.http
      .post<ApiItemResponse<{ unitId: string; collDate: string; osUnitId: string }>>(url, request)
      .pipe(
        map((response) => ({
          isValid: response.success,
          unitId: response.item?.unitId ?? null,
          osUnitId: response.item?.osUnitId ?? null,
          collDate: response.item?.collDate ?? null,
          errorMessage: response.success ? null : (response.message || 'Unit not found or not eligible for skip'),
        }))
      );
  }

  /**
   * POST /skip-results-from-extraction/skipped-units/search-sort-filter/{take}/{skip}
   * Used in Reset mode to load currently skipped units.
   */
  getSkippedUnits(request: SkippedUnitsRequestDto, take = 1000, skip = 0): Observable<{ data: SkippedUnitDto[]; total: number }> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIPPED_UNITS}/${take}/${skip}`;
    return this.http.post<ApiResponse<SkippedUnitDto[]>>(url, request).pipe(
      map((response) => ({ data: response.data || [], total: response.total ?? 0 }))
    );
  }

  /** POST /skip-results-from-extraction/skip */
  skipUnits(request: SkipUnitsRequestDto): Observable<ApiResponse<SkipUnitsResultDto[]>> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.SKIP}`;
    return this.http.post<ApiResponse<SkipUnitsResultDto[]>>(url, request);
  }

  /** POST /skip-results-from-extraction/reset */
  resetUnits(request: ResetUnitsRequestDto): Observable<ApiResponse<ResetUnitsResultDto[]>> {
    const url = `${environment.apiUrl}${API.SKIP_RESULTS_FROM_EXTRACTION.RESET}`;
    return this.http.post<ApiResponse<ResetUnitsResultDto[]>>(url, request);
  }
}
