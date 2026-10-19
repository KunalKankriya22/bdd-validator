import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  TestBatchDetailsResult,
  ScheduledTestDto,
  UnscheduledTestDto,
  HoldingTestDto,
  TestBatchParmDto,
  WorksheetLovDto,
  TestIdLovDto,
  ApiListResponse,
  ApiSingleResult,
  BatchNoteDto,
  BatchNotesResponse,
  BatchNoteDeleteResponse
} from '../models/test-batch-details.model';

@Injectable({ providedIn: 'root' })
export class TestBatchDetailsApiService {
  private readonly apiService = inject(ApiService);

  getTestBatchDetails(worksheetId: string, testId: string): Observable<TestBatchDetailsResult> {
    return this.apiService.get<ApiSingleResult<TestBatchDetailsResult>>(
      API.TEST_BATCH_DETAILS_QUERY.DETAILS(worksheetId, testId)
    ).pipe(map(r => r.item ?? r.data[0]));
  }

  getScheduledTests(worksheetId: string, testId: string): Observable<ScheduledTestDto[]> {
    return this.apiService.get<ApiListResponse<ScheduledTestDto[]>>(
      API.TEST_BATCH_DETAILS_QUERY.SCHEDULED_TESTS(worksheetId, testId)
    ).pipe(map(r => r.data.flat()));
  }

  getUnscheduledTests(worksheetId: string, testId: string): Observable<UnscheduledTestDto[]> {
    return this.apiService.get<ApiListResponse<UnscheduledTestDto[]>>(
      API.TEST_BATCH_DETAILS_QUERY.UNSCHEDULED_TESTS(worksheetId, testId)
    ).pipe(map(r => r.data.flat()));
  }

  getHoldingTests(worksheetId: string, testId: string): Observable<HoldingTestDto[]> {
    return this.apiService.get<ApiListResponse<HoldingTestDto[]>>(
      API.TEST_BATCH_DETAILS_QUERY.HOLDING_TESTS(worksheetId, testId)
    ).pipe(map(r => r.data.flat()));
  }

  getParameters(worksheetId: string, testId: string): Observable<TestBatchParmDto[]> {
    return this.apiService.get<ApiListResponse<TestBatchParmDto[]>>(
      API.TEST_BATCH_DETAILS_QUERY.PARAMETERS(worksheetId, testId)
    ).pipe(map(r => r.data.flat()));
  }

  getRecentWorksheets(): Observable<WorksheetLovDto[]> {
    return this.apiService.get<ApiListResponse<WorksheetLovDto[]>>(
      API.TEST_BATCH_DETAILS_QUERY.WORKSHEETS
    ).pipe(map(r => r.data.flat()));
  }

  getTestsForWorksheet(worksheetId: string): Observable<TestIdLovDto[]> {
    return this.apiService.get<ApiListResponse<TestIdLovDto[]>>(
      API.TEST_BATCH_DETAILS_QUERY.TESTS_FOR_WORKSHEET(worksheetId)
    ).pipe(map(r => r.data.flat()));
  }

  getNotes(worksheetId: string): Observable<BatchNoteDto[]> {
    return this.apiService.get<BatchNotesResponse>(
      API.TEST_BATCH_DETAILS_QUERY.NOTES(worksheetId)
    ).pipe(map(r => r.data));
  }

  addNote(worksheetId: string, note: string): Observable<BatchNoteDto[]> {
    return this.apiService.post<BatchNotesResponse>(
      API.TEST_BATCH_DETAILS_QUERY.NOTES(worksheetId),
      { note }
    ).pipe(map(r => r.data));
  }

  updateNote(worksheetId: string, auditKey: number, note: string): Observable<BatchNoteDto[]> {
    return this.apiService.put<BatchNotesResponse>(
      API.TEST_BATCH_DETAILS_QUERY.NOTE(worksheetId, auditKey),
      { note }
    ).pipe(map(r => r.data));
  }

  deleteNote(worksheetId: string, auditKey: number): Observable<boolean> {
    return this.apiService.delete<BatchNoteDeleteResponse>(
      API.TEST_BATCH_DETAILS_QUERY.NOTE(worksheetId, auditKey)
    ).pipe(map(r => r.item));
  }
}
