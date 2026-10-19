import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  TestForUnit,
  TestBatch,
  TestBandResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteDetails
} from '../models/results-observations.interface';

@Injectable({
  providedIn: 'root'
})
export class ResultsObservationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/results-observations';

  /**
   * Validates that a unit has completed test results
   * @param unitId Unit identifier
   * @returns Observable of validation response
   */
  validateUnit(unitId: string): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(
      `${this.baseUrl}/validate-unit/${unitId}`
    );
  }

  /**
   * Gets list of available tests for a unit
   * @param unitId Unit identifier
   * @returns Observable of tests array
   */
  getTestsForUnit(unitId: string): Observable<ApiResponse<TestForUnit[]>> {
    return this.http.get<ApiResponse<TestForUnit[]>>(
      `${this.baseUrl}/tests-for-unit/${unitId}`
    );
  }

  /**
   * Gets all test batches for a unit+test combination
   * @param unitId Unit identifier
   * @param testId Test identifier (will be URL-encoded)
   * @returns Observable of test batches array
   */
  getTestBatches(unitId: string, testId: string): Observable<ApiResponse<TestBatch[]>> {
    return this.http.get<ApiResponse<TestBatch[]>>(
      `${this.baseUrl}/test-batches/${unitId}/${encodeURIComponent(testId)}`
    );
  }

  /**
   * Gets complete test band observation details for a specific batch
   * @param unitId Unit identifier
   * @param testId Test identifier (will be URL-encoded)
   * @param tbId Test batch ID
   * @param tbSeqNo Sequence number
   * @returns Observable of band details response
   */
  getBandDetails(
    unitId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number
  ): Observable<ApiResponse<TestBandResponse>> {
    return this.http.get<ApiResponse<TestBandResponse>>(
      `${this.baseUrl}/band-details/${unitId}/${encodeURIComponent(testId)}/${tbId}/${tbSeqNo}`
    );
  }

  /**
   * Creates a new note for a test batch observation
   * @param request Create note request with batch identifiers and note text
   * @returns Observable of created note details
   */
  createNote(request: CreateNoteRequest): Observable<ApiResponse<NoteDetails>> {
    return this.http.post<ApiResponse<NoteDetails>>(
      `${this.baseUrl}/notes`,
      request
    );
  }

  /**
   * Updates an existing note
   * @param noteId Note identifier from band-details response
   * @param request Update note request with new note text
   * @returns Observable of void response
   */
  updateNote(noteId: number, request: UpdateNoteRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/notes/${noteId}`,
      request
    );
  }

  /**
   * Deletes a note and unlinks it from the test batch header
   * @param noteId Note identifier from band-details response
   * @param unitId Unit identifier
   * @param testId Test identifier
   * @param tbId Test batch ID
   * @param tbSeqNo Sequence number
   * @param testChapterId Test chapter ID
   * @returns Observable of void response
   */
  deleteNote(
    noteId: number,
    unitId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number,
    testChapterId: string
  ): Observable<ApiResponse<void>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('testId', testId)
      .set('tbId', tbId)
      .set('tbSeqNo', tbSeqNo.toString())
      .set('testChapterId', testChapterId);

    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/notes/${noteId}`,
      { params }
    );
  }
}
