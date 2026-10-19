import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  TestDropdownDto,
  WorksheetDropdownDto,
  PendingTestDto,
  TestBandResponseDto,
  ValidResultDto,
  ValidInterpretationDto,
  ValidTestBandDto,
  ReconcileTestRequest,
  UpdateBandValuesRequest,
  ValidateCombinationRequest,
  ValidateCombinationResponse,
  CommitReconciliationRequest,
  OtherBandDto,
  OtherBandSaveRequest,
  NoteDto,
  SaveNoteRequest,
} from '../models/multiple-observation-reconciliation.model';

@Injectable({ providedIn: 'root' })
export class MultipleObservationReconciliationApiService {
  private readonly http = inject(HttpClient);

  getWorksheetsDropdown(): Observable<ReturnResult<WorksheetDropdownDto>> {
    return this.http.get<ReturnResult<WorksheetDropdownDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.WORKSHEETS_DROPDOWN,
    );
  }

  getTestsDropdown(tbId: string): Observable<ReturnResult<TestDropdownDto>> {
    return this.http.get<ReturnResult<TestDropdownDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.TESTS_DROPDOWN(tbId),
    );
  }

  getPendingTests(testId: string, tbId: string): Observable<ReturnResult<PendingTestDto>> {
    const params = new HttpParams()
      .set('testId', testId)
      .set('tbId', tbId);
    return this.http.get<ReturnResult<PendingTestDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.PENDING_TESTS,
      { params },
    );
  }

  getTestDetails(unitId: string, tbId: string, testId: string, tbSeqNo: number): Observable<ReturnResult<TestBandResponseDto>> {
    return this.http.get<ReturnResult<TestBandResponseDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.TEST_DETAILS(unitId, tbId, testId, tbSeqNo),
    );
  }

  getValidResults(testId: string): Observable<ReturnResult<ValidResultDto>> {
    return this.http.get<ReturnResult<ValidResultDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.VALID_RESULTS(testId),
    );
  }

  getValidInterpretations(testId: string): Observable<ReturnResult<ValidInterpretationDto>> {
    return this.http.get<ReturnResult<ValidInterpretationDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.VALID_INTERPRETATIONS(testId),
    );
  }

  getValidTestBands(testId: string, testType: string): Observable<ReturnResult<ValidTestBandDto>> {
    return this.http.get<ReturnResult<ValidTestBandDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.VALID_TEST_BANDS(testId, testType),
    );
  }

  updateBandValues(unitId: string, tbId: string, testId: string, tbSeqNo: number, request: UpdateBandValuesRequest): Observable<ReturnResult<{ totalUpdated: number }>> {
    return this.http.put<ReturnResult<{ totalUpdated: number }>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.UPDATE_BAND_VALUES(unitId, tbId, testId, tbSeqNo),
      request,
    );
  }

  validateCombination(request: ValidateCombinationRequest): Observable<ReturnResult<ValidateCombinationResponse>> {
    return this.http.post<ReturnResult<ValidateCombinationResponse>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.VALIDATE_COMBINATION,
      request,
    );
  }

  reconcileTest(unitId: string, tbId: string, testId: string, tbSeqNo: number, request: ReconcileTestRequest): Observable<ReturnResult<void>> {
    return this.http.put<ReturnResult<void>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.RECONCILE(unitId, tbId, testId, tbSeqNo),
      request,
    );
  }

  commitReconciliation(request: CommitReconciliationRequest): Observable<ReturnResult<unknown>> {
    return this.http.post<ReturnResult<unknown>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.COMMIT_RECONCILIATION,
      request,
    );
  }

  getOtherBands(unitId: string, tbId: string, testId: string, tbSeqNo: number): Observable<ReturnResult<OtherBandDto>> {
    return this.http.get<ReturnResult<OtherBandDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.OTHER_BANDS_GET(unitId, tbId, testId, tbSeqNo),
    );
  }

  saveOtherBands(request: OtherBandSaveRequest): Observable<ReturnResult<unknown>> {
    return this.http.post<ReturnResult<unknown>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.OTHER_BANDS_SAVE,
      request,
    );
  }

  deleteOtherBands(unitId: string, tbId: string, testId: string, tbSeqNo: number): Observable<ReturnResult<unknown>> {
    return this.http.delete<ReturnResult<unknown>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.OTHER_BANDS_DELETE(unitId, tbId, testId, tbSeqNo),
    );
  }

  getNote(tbId: string, testId: string, unitId: string, tbSeqNo: number): Observable<ReturnResult<NoteDto>> {
    return this.http.get<ReturnResult<NoteDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.NOTES_GET(tbId, testId, unitId, tbSeqNo),
    );
  }

  saveNote(request: SaveNoteRequest): Observable<ReturnResult<NoteDto>> {
    return this.http.post<ReturnResult<NoteDto>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.NOTES_SAVE,
      request,
    );
  }

  deleteNote(noteId: number): Observable<ReturnResult<unknown>> {
    return this.http.delete<ReturnResult<unknown>>(
      API.MULTIPLE_OBSERVATION_RECONCILIATION.NOTES_DELETE(noteId),
    );
  }
}
