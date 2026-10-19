import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  SamplesQuerySearchRequest,
  UnitRecord,
  UnitDetailsResponse,
  SampleCheckinDetailsResponse,
  SamplesQueryNote,
  NoteIndicators,
} from '../models/samples-query.model';

@Injectable({ providedIn: 'root' })
export class SamplesQueryApiService {
  private readonly http = inject(HttpClient);

  search(
    request: SamplesQuerySearchRequest,
    take = 10,
    skip = 0,
  ): Observable<ReturnResult<UnitRecord[]>> {
    return this.http.post<ReturnResult<UnitRecord[]>>(
      API.SAMPLES_QUERY.SEARCH(take, skip),
      request,
    );
  }

  getUnitDetails(unitId: string): Observable<ReturnResult<UnitDetailsResponse>> {
    return this.http.get<ReturnResult<UnitDetailsResponse>>(
      API.SAMPLES_QUERY.UNIT_DETAILS(unitId),
    );
  }

  validateUnit(unitId: string, isScanned = false): Observable<ReturnResult<boolean>> {
    return this.http.get<ReturnResult<boolean>>(
      API.SAMPLES_QUERY.VALIDATE_UNIT(unitId, isScanned),
    );
  }

  getBatches(): Observable<ReturnResult<string[]>> {
    return this.http.get<ReturnResult<string[]>>(
      API.SAMPLES_QUERY.BATCHES,
    );
  }

  getSampleCheckinDetails(unitId: string): Observable<ReturnResult<SampleCheckinDetailsResponse>> {
    return this.http.get<ReturnResult<SampleCheckinDetailsResponse>>(
      API.SAMPLES_QUERY.SAMPLE_CHECKIN_DETAILS(unitId),
    );
  }

  getSampleNotes(unitId: string, collDate: string): Observable<ReturnResult<SamplesQueryNote[]>> {
    return this.http.get<ReturnResult<SamplesQueryNote[]>>(
      API.SAMPLES_QUERY.SAMPLE_NOTES(unitId, collDate),
    );
  }

  getCheckinNotes(batchId: string): Observable<ReturnResult<SamplesQueryNote[]>> {
    return this.http.get<ReturnResult<SamplesQueryNote[]>>(
      API.SAMPLES_QUERY.CHECKIN_NOTES(batchId),
    );
  }

  getTestNotes(unitId: string, testId: string, auditKey: number): Observable<ReturnResult<SamplesQueryNote[]>> {
    return this.http.get<ReturnResult<SamplesQueryNote[]>>(
      API.SAMPLES_QUERY.TEST_NOTES(unitId, testId, auditKey),
    );
  }

  getNoteCounts(unitId: string): Observable<ReturnResult<NoteIndicators>> {
    return this.http.get<ReturnResult<NoteIndicators>>(
      API.SAMPLES_QUERY.NOTE_COUNTS(unitId),
    );
  }
}
