import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  TestObservationDto,
  ApiResponse,
  TestObservationQueryParams,
  TestIdLookupDto,
  TestBatchLookupDto,
  BandValueLookupDto,
  ResultCodeLookupDto,
  EditReasonLookupDto,
  CheckDigitDto,
  NoteDto,
  SaveAllRequestDto,
  CreateNoteRequestDto,
  UpdateNoteRequestDto,
} from '../models/edit-test-observation-results.model';

@Injectable({
  providedIn: 'root',
})
export class EditTestObservationResultsApiService {
  private readonly apiService = inject(ApiService);

  getTestObservation(
    unitId: string,
    params: TestObservationQueryParams
  ): Observable<TestObservationDto> {
    const url = API.TEST_OBSERVATION.GET(unitId, params);
    return this.apiService.get<ApiResponse<TestObservationDto>>(url).pipe(
      map((response) => response?.data as TestObservationDto),
      catchError((error) => throwError(() => error))
    );
  }

  saveAll(
    unitId: string,
    testChapterId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number,
    request: SaveAllRequestDto
  ): Observable<ApiResponse<unknown>> {
    const url = API.TEST_OBSERVATION.SAVE_ALL(unitId, testChapterId, testId, tbId, tbSeqNo);
    return this.apiService.put<ApiResponse<unknown>>(url, request).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getTestIds(unitId: string): Observable<TestIdLookupDto[]> {
    const url = API.TEST_OBSERVATION.LOOKUP_TEST_IDS(unitId);
    return this.apiService.get<ApiResponse<TestIdLookupDto[]>>(url).pipe(
      map((response) => response?.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  getTestBatches(unitId: string, testId: string): Observable<TestBatchLookupDto[]> {
    const url = API.TEST_OBSERVATION.LOOKUP_TEST_BATCHES(unitId, testId);
    return this.apiService.get<ApiResponse<TestBatchLookupDto[]>>(url).pipe(
      map((response) => response?.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  getBandValues(testId: string): Observable<BandValueLookupDto[]> {
    const url = API.TEST_OBSERVATION.LOOKUP_BAND_VALUES(testId);
    return this.apiService.get<ApiResponse<BandValueLookupDto[]>>(url).pipe(
      map((response) => response?.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  getResultCodes(testId: string): Observable<ResultCodeLookupDto[]> {
    const url = API.TEST_OBSERVATION.LOOKUP_RESULT_CODES(testId);
    return this.apiService.get<ApiResponse<ResultCodeLookupDto[]>>(url).pipe(
      map((response) => response?.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  getEditReasons(): Observable<EditReasonLookupDto[]> {
    const url = API.TEST_OBSERVATION.LOOKUP_EDIT_REASONS();
    return this.apiService.get<ApiResponse<EditReasonLookupDto[]>>(url).pipe(
      map((response) => response?.data ?? []),
      catchError((error) => throwError(() => error))
    );
  }

  getCheckDigit(unitId: string): Observable<CheckDigitDto> {
    const url = API.TEST_OBSERVATION.LOOKUP_CHECK_DIGIT(unitId);
    return this.apiService.get<ApiResponse<CheckDigitDto>>(url).pipe(
      map((response) => response?.data as CheckDigitDto),
      catchError((error) => throwError(() => error))
    );
  }

  getNotes(
    unitId: string,
    testChapterId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number
  ): Observable<NoteDto | null> {
    const url = API.TEST_OBSERVATION.NOTES_GET(unitId, testChapterId, testId, tbId, tbSeqNo);
    return this.apiService.get<ApiResponse<NoteDto>>(url).pipe(
      map((response) => response?.data ?? null),
      catchError((error) => throwError(() => error))
    );
  }

  createNote(
    unitId: string,
    testChapterId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number,
    request: CreateNoteRequestDto
  ): Observable<ApiResponse<NoteDto>> {
    const url = API.TEST_OBSERVATION.NOTES_CREATE(unitId, testChapterId, testId, tbId, tbSeqNo);
    return this.apiService.post<ApiResponse<NoteDto>>(url, request).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateNote(noteId: number, request: UpdateNoteRequestDto): Observable<ApiResponse<unknown>> {
    const url = API.TEST_OBSERVATION.NOTES_UPDATE(noteId);
    return this.apiService.put<ApiResponse<unknown>>(url, request).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteNote(noteId: number): Observable<ApiResponse<unknown>> {
    const url = API.TEST_OBSERVATION.NOTES_DELETE(noteId);
    return this.apiService.delete<ApiResponse<unknown>>(url).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteOtherBand(
    unitId: string,
    testChapterId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number,
    tech: string
  ): Observable<ApiResponse<unknown>> {
    const url = API.TEST_OBSERVATION.DELETE_OTHER_BAND(unitId, testChapterId, testId, tbId, tbSeqNo, tech);
    return this.apiService.delete<ApiResponse<unknown>>(url).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
