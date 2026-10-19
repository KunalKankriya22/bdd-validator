import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  ContractOption,
  BatchOption,
  ProfileSetOption,
  TubesCheckinQueryResponse,
  ProfileTest,
  AdditionalTest,
} from '../models/tubes-checkin-query.model';
import { TubeNoteDto, CreateTubeNoteRequest, UpdateTubeNoteRequest } from '../tubes-notes-panel/tubes-notes-panel';

@Injectable({ providedIn: 'root' })
export class TubesCheckinQueryApiService {
  private readonly http = inject(HttpClient);

  /**
   * Get list of regional contracts
   */
  getContracts(): Observable<ReturnResult<ContractOption[]>> {
    return this.http.get<ReturnResult<ContractOption[]>>(
      API.TUBES_CHECKIN_QUERY.CONTRACTS,
    );
  }

  /**
   * Get batches for a specific contract and optional checkin date
   */
  getBatches(contractId: string, checkinDate?: string): Observable<ReturnResult<BatchOption[]>> {
    let params = new HttpParams();
    if (checkinDate) {
      params = params.set('checkinDate', checkinDate);
    }

    return this.http.get<ReturnResult<BatchOption[]>>(
      API.TUBES_CHECKIN_QUERY.BATCHES(contractId),
      { params }
    );
  }

  /**
   * Get checkin dates for a contract (backend endpoint exists but not used in UI currently)
   */
  getCheckinDates(contractId: string): Observable<ReturnResult<any[]>> {
    return this.http.get<ReturnResult<any[]>>(
      API.TUBES_CHECKIN_QUERY.CHECKIN_DATES(contractId),
    );
  }

  /**
   * Execute tubes check-in query
   */
  query(
    contractId: string,
    checkinDate: string | null,
    batchId: string | null,
    take = 100,
    skip = 0,
    sortColumn = 'UnitId',
    sortOrder = 'ASC',
  ): Observable<ReturnResult<TubesCheckinQueryResponse>> {
    let params = new HttpParams()
      .set('contractId', contractId)
      .set('take', take)
      .set('skip', skip)
      .set('sortColumn', sortColumn)
      .set('sortOrder', sortOrder);

    if (checkinDate) {
      params = params.set('checkinDate', checkinDate);
    }
    if (batchId) {
      params = params.set('batchId', batchId);
    }

    return this.http.get<ReturnResult<TubesCheckinQueryResponse>>(
      API.TUBES_CHECKIN_QUERY.QUERY,
      { params },
    );
  }

  /**
   * Get profile tests for a unit
   */
  getProfileTests(
    contractId: string,
    profileSetId: string,
    profileSeqNo: number,
  ): Observable<ReturnResult<ProfileTest[]>> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('profileSetId', profileSetId)
      .set('profileSeqNo', profileSeqNo.toString());

    return this.http.get<ReturnResult<ProfileTest[]>>(
      API.TUBES_CHECKIN_QUERY.PROFILE_TESTS,
      { params },
    );
  }

  /**
   * Get additional tests for a unit
   * @param cbcUnitId CBC Unit identifier (from backend API docs)
   * @param profileSetId Optional profile set identifier
   * @param tubeProfileSetId Optional tube profile set identifier
   */
  getAdditionalTests(
    cbcUnitId: string,
    profileSetId?: string,
    tubeProfileSetId?: string,
  ): Observable<ReturnResult<AdditionalTest[]>> {
    let params = new HttpParams();
    if (profileSetId) {
      params = params.set('profileSetId', profileSetId);
    }
    if (tubeProfileSetId) {
      params = params.set('tubeProfileSetId', tubeProfileSetId);
    }

    return this.http.get<ReturnResult<AdditionalTest[]>>(
      API.TUBES_CHECKIN_QUERY.ADDITIONAL_TESTS(cbcUnitId),
      { params },
    );
  }

  /**
   * Get notes for a batch
   * @param batchId The batch identifier
   * @param contractId The contract identifier (required by backend)
   */
  getBatchNotes(batchId: string, contractId: string): Observable<ReturnResult<TubeNoteDto[]>> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<ReturnResult<TubeNoteDto[]>>(
      `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}`,
      { params }
    );
  }

  /**
   * Create a note for a batch
   * @param batchId The batch identifier
   * @param contractId The contract identifier (required by backend)
   * @param request The note content
   */
  createBatchNote(batchId: string, contractId: string, request: CreateTubeNoteRequest): Observable<ReturnResult<TubeNoteDto>> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.post<ReturnResult<TubeNoteDto>>(
      `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}`,
      request,
      { params }
    );
  }

  /**
   * Update a note for a batch
   * @param batchId The batch identifier
   * @param contractId The contract identifier (required by backend)
   * @param noteId The audit key of the note to update
   * @param request The updated note content
   */
  updateBatchNote(batchId: string, contractId: string, noteId: string, request: UpdateTubeNoteRequest): Observable<ReturnResult<TubeNoteDto>> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.put<ReturnResult<TubeNoteDto>>(
      `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}/${encodeURIComponent(noteId)}`,
      request,
      { params }
    );
  }

  /**
   * Delete a note for a batch
   * @param batchId The batch identifier
   * @param contractId The contract identifier (required by backend)
   * @param noteId The audit key of the note to delete
   */
  deleteBatchNote(batchId: string, contractId: string, noteId: string): Observable<ReturnResult<void>> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http.delete<ReturnResult<void>>(
      `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}/${encodeURIComponent(noteId)}`,
      { params }
    );
  }
}
