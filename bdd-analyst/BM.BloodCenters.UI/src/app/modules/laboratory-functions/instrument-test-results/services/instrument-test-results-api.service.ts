import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ValidInstrumentTestScheduleDto,
  CreateValidInstrumentTestScheduleRequestDto,
  UpdateValidInstrumentTestScheduleRequestDto,
  ValidInstrumentTestScheduleQueryDto,
  InstrumentLookupDto,
  InstrumentTestLookupDto,
  InstrumentTestDetailDto,
  CreateInstrumentTestRequestDto,
  UpdateInstrumentTestRequestDto,
  ApiResponse,
  InstrumentResultDto,
  InstrumentResultQueryDto,
  ResultStatusDropdownDto,
  MachineLookupDto,
  TestDropdownDto,
  CreateInstrumentResultDto,
  UpdateInstrumentResultDto,
} from '../models/instrument-test-results.model';

@Injectable({ providedIn: 'root' })
export class InstrumentTestResultsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * POST /valid-instrument-test-schedules
   * Returns paginated list of schedules matching the filter body.
   * take/skip are passed as query params; filter fields go in the request body.
   */
  getAll(
    take: number,
    skip: number,
    query?: ValidInstrumentTestScheduleQueryDto
  ): Observable<{ data: ValidInstrumentTestScheduleDto[]; totalCount: number }> {
    const params = new HttpParams()
      .set('take', take.toString())
      .set('skip', skip.toString());
    const context = new HttpContext().set(SKIP_ERROR_TOAST, [404]);

    return this.apiService
      .post<ApiResponse<ValidInstrumentTestScheduleDto[]>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.LIST,
        query ?? {},
        { params, context }
      )
      .pipe(
        map((res) => {
          const data = res.data ?? [];
          return {
            data,
            totalCount: res.totalCount ?? res.total ?? data.length,
          };
        }),
        catchError((err) => {
          if (err?.status === 404) {
            return of({ data: [], totalCount: 0 });
          }
          throw err;
        })
      );
  }

  /**
   * GET /valid-instrument-test-schedules/{machineId}
   * Returns a single record; chapterId and machineTestId narrow the lookup.
   */
  getById(
    machineId: string,
    chapterId?: string | null,
    machineTestId?: string | null
  ): Observable<ValidInstrumentTestScheduleDto> {
    let params = new HttpParams();
    if (chapterId) params = params.set('chapterId', chapterId);
    if (machineTestId) params = params.set('machineTestId', machineTestId);

    return this.apiService
      .get<ApiResponse<ValidInstrumentTestScheduleDto>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.GET_BY_ID(machineId),
        { params }
      )
      .pipe(map((res) => res.data!));
  }

  /**
   * POST /valid-instrument-test-schedules/create
   * Full validation create — enforces no-duplicate check (BR-028).
   */
  create(
    dto: CreateValidInstrumentTestScheduleRequestDto
  ): Observable<ValidInstrumentTestScheduleDto> {
    return this.apiService
      .post<ApiResponse<ValidInstrumentTestScheduleDto>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.CREATE,
        dto
      )
      .pipe(map((res) => res.data!));
  }

  /**
   * PUT /valid-instrument-test-schedules/{machineId}/{chapterId}/{machineTestId}
   * Update an existing record identified by its composite PK.
   * Send originalEffDate in dto when the effective date has changed (BR-005).
   */
  update(
    machineId: string,
    chapterId: string,
    machineTestId: string,
    dto: UpdateValidInstrumentTestScheduleRequestDto
  ): Observable<ValidInstrumentTestScheduleDto> {
    return this.apiService
      .put<ApiResponse<ValidInstrumentTestScheduleDto>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.UPDATE(machineId, chapterId, machineTestId),
        dto
      )
      .pipe(map((res) => res.data!));
  }

  /**
   * GET /valid-instrument-test-schedules/instruments
   * Instruments (machines) dropdown — filtered by chapterId effectivity.
   */
  getInstruments(chapterId: string): Observable<InstrumentLookupDto[]> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<ApiResponse<InstrumentLookupDto[]>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.INSTRUMENTS,
        { params }
      )
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * GET /valid-instrument-test-schedules/instrument-tests/{instrumentId}
   * Machine test IDs for a given instrument — cascades from machine selection.
   * Filtered by chapterId effectivity (VALID_INSTRUMENT_TESTS table).
   */
  getInstrumentTests(instrumentId: string, chapterId: string): Observable<InstrumentTestLookupDto[]> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<ApiResponse<InstrumentTestLookupDto[]>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.INSTRUMENT_TESTS(instrumentId),
        { params }
      )
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * GET /valid-instrument-test-schedules/all-instrument-tests/{instrumentId}
   * All tests for a given instrument from VALID_INSTRUMENT_TESTS (FMB VINTST grid).
   */
  getAllInstrumentTests(
    instrumentId: string,
    chapterId: string
  ): Observable<{ data: InstrumentTestDetailDto[]; totalCount: number }> {
    const params = new HttpParams().set('chapterId', chapterId);
    const context = new HttpContext().set(SKIP_ERROR_TOAST, [404]);
    return this.apiService
      .get<ApiResponse<InstrumentTestDetailDto[]>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.ALL_INSTRUMENT_TESTS(instrumentId),
        { params, context }
      )
      .pipe(
        map((res) => {
          const data = res.data ?? [];
          return { data, totalCount: res.totalCount ?? res.total ?? data.length };
        }),
        catchError((err) => {
          if (err?.status === 404) return of({ data: [], totalCount: 0 });
          throw err;
        })
      );
  }

  /**
   * GET /valid-instrument-test-schedules/lifetrack-tests
   * All active tests from VALID_TESTS (FMB VINTST Test ID LOV).
   */
  getValidTests(chapterId: string): Observable<TestDropdownDto[]> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<ApiResponse<TestDropdownDto[]>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.LIFETRACK_TESTS,
        { params }
      )
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * POST /valid-instrument-test-schedules/create-instrument-test
   * Creates a new record in VALID_INSTRUMENT_TESTS (FMB VINTST).
   */
  createInstrumentTest(dto: CreateInstrumentTestRequestDto): Observable<InstrumentTestDetailDto> {
    return this.apiService
      .post<ApiResponse<InstrumentTestDetailDto>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.CREATE_INSTRUMENT_TEST,
        dto
      )
      .pipe(map((res) => res.data!));
  }

  /**
   * PUT /valid-instrument-test-schedules/update-instrument-test/{chapterId}/{machineId}/{testId}
   * Updates machineTestId and/or termDate on VALID_INSTRUMENT_TESTS.
   */
  updateInstrumentTest(
    chapterId: string,
    machineId: string,
    testId: string,
    dto: UpdateInstrumentTestRequestDto
  ): Observable<InstrumentTestDetailDto> {
    return this.apiService
      .put<ApiResponse<InstrumentTestDetailDto>>(
        API.VALID_INSTRUMENT_TEST_SCHEDULES.UPDATE_INSTRUMENT_TEST(chapterId, machineId, testId),
        dto
      )
      .pipe(map((res) => res.data!));
  }

  // ── Instrument Results (VINTSTRS / MLT-12476) ──────────────────────────────

  /** POST /instrument-test-results/{take}/{skip} — paginated list for a test */
  getInstrumentResults(
    take: number,
    skip: number,
    query: InstrumentResultQueryDto
  ): Observable<{ data: InstrumentResultDto[]; totalCount: number }> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, [404]);
    return this.apiService
      .post<ApiResponse<InstrumentResultDto[]>>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.GET_ALL(take, skip),
        query,
        { context }
      )
      .pipe(
        map((res) => {
          const data = res.data ?? [];
          return { data, totalCount: res.totalCount ?? res.total ?? data.length };
        }),
        catchError((err) => {
          if (err?.status === 404) return of({ data: [], totalCount: 0 });
          throw err;
        })
      );
  }

  /** GET /instrument-test-results/result-statuses/dropdown/{testId} */
  getResultStatusesDropdown(testId: string, chapterId: string): Observable<ResultStatusDropdownDto[]> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<ResultStatusDropdownDto[]>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.RESULT_STATUSES_DROPDOWN(testId),
        { params }
      );
  }

  /** GET /instrument-test-results/machines/dropdown */
  getMachinesDropdown(chapterId: string): Observable<MachineLookupDto[]> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<MachineLookupDto[]>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.MACHINES_DROPDOWN,
        { params }
      );
  }

  /** GET /instrument-test-results/tests/dropdown/{machineId} */
  getTestsDropdown(machineId: string): Observable<TestDropdownDto[]> {
    return this.apiService
      .get<TestDropdownDto[]>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.TESTS_DROPDOWN(machineId)
      );
  }

  /** GET /instrument-test-results/{chapterId}/{machineId}/{testId}/{resultStatus} */
  getInstrumentResultById(
    chapterId: string,
    machineId: string,
    testId: string,
    resultStatus: string
  ): Observable<InstrumentResultDto> {
    return this.apiService
      .get<ApiResponse<InstrumentResultDto>>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.GET_BY_ID(chapterId, machineId, testId, resultStatus)
      )
      .pipe(map((res) => res.data!));
  }

  /** POST /instrument-test-results */
  createInstrumentResult(dto: CreateInstrumentResultDto): Observable<InstrumentResultDto> {
    return this.apiService
      .post<ApiResponse<InstrumentResultDto>>(API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.CREATE, dto)
      .pipe(map((res) => res.data!));
  }

  /** PUT /instrument-test-results/{chapterId}/{machineId}/{testId}/{resultStatus} */
  updateInstrumentResult(
    chapterId: string,
    machineId: string,
    testId: string,
    resultStatus: string,
    dto: UpdateInstrumentResultDto
  ): Observable<InstrumentResultDto> {
    return this.apiService
      .put<ApiResponse<InstrumentResultDto>>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.UPDATE(chapterId, machineId, testId, resultStatus),
        dto
      )
      .pipe(map((res) => res.data!));
  }

  /** DELETE /instrument-test-results/{chapterId}/{machineId}/{testId}/{resultStatus} */
  deleteInstrumentResult(
    chapterId: string,
    machineId: string,
    testId: string,
    resultStatus: string
  ): Observable<void> {
    return this.apiService
      .delete<ApiResponse<void>>(
        API.APPLICATION_ADMIN.INSTRUMENT_TEST_RESULTS.DELETE(chapterId, machineId, testId, resultStatus)
      )
      .pipe(map(() => void 0));
  }
}
