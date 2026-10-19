import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  MofTestDto,
  MofTestTypeDto,
  MofBandDto,
  MofBandCreateDto,
  MofBandUpdateDto,
  MofResequenceDto,
  MofTestsApiResponse,
  MofTestTypesApiResponse,
  MofBandsApiResponse,
  MofBandApiResponse,
} from '../models/multiple-observation-fields.model';

@Injectable({ providedIn: 'root' })
export class MofApiService {
  private apiService = inject(ApiService);

  getTests(): Observable<MofTestDto[]> {
    return this.apiService
      .get<any>(API.MULTIPLE_OBSERVATION_FIELDS.TESTS)
      .pipe(map(res => this.extractArray<MofTestDto>(res)));
  }

  getTestTypes(testId: string): Observable<MofTestTypeDto[]> {
    return this.apiService
      .get<any>(API.MULTIPLE_OBSERVATION_FIELDS.TEST_TYPES(testId))
      .pipe(map(res => this.extractArray<MofTestTypeDto>(res)));
  }

  getBands(testId: string, testType: string): Observable<MofBandDto[]> {
    return this.apiService
      .post<any>(
        API.MULTIPLE_OBSERVATION_FIELDS.SEARCH(100, 0),
        { testId, testType }
      )
      .pipe(map(res => this.extractArray<MofBandDto>(res)));
  }

  createBand(request: MofBandCreateDto): Observable<MofBandDto> {
    return this.apiService
      .post<any>(API.MULTIPLE_OBSERVATION_FIELDS.CREATE, request)
      .pipe(map(res => this.extractItem<MofBandDto>(res)));
  }

  updateBand(testId: string, testType: string, bandSeq: number, request: MofBandUpdateDto): Observable<MofBandDto> {
    return this.apiService
      .put<any>(
        API.MULTIPLE_OBSERVATION_FIELDS.UPDATE(testId, testType, bandSeq),
        request
      )
      .pipe(map(res => this.extractItem<MofBandDto>(res)));
  }

  deleteBand(testId: string, testType: string, bandSeq: number): Observable<void> {
    return this.apiService
      .delete<void>(API.MULTIPLE_OBSERVATION_FIELDS.DELETE(testId, testType, bandSeq));
  }

  resequence(request: MofResequenceDto): Observable<MofBandDto[]> {
    return this.apiService
      .put<any>(API.MULTIPLE_OBSERVATION_FIELDS.RESEQUENCE, request)
      .pipe(map(res => this.extractArray<MofBandDto>(res)));
  }

  private extractArray<T>(response: any): T[] {
    if (Array.isArray(response)) return response as T[];
    if (Array.isArray(response?.data?.data)) return response.data.data as T[];
    if (Array.isArray(response?.data)) return response.data as T[];
    return [] as T[];
  }

  private extractItem<T>(response: any): T {
    if (response?.data?.data) return response.data.data as T;
    if (response?.data) return response.data as T;
    return response as T;
  }
}
