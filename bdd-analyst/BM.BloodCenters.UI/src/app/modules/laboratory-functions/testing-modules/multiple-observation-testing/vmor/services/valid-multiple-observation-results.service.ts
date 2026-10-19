import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  VmorTestDto,
  VmorBandResultDto,
  VmorSaveRequestDto,
  VmorTestsApiResponse,
  VmorBandResultsApiResponse,
  VmorSaveApiResponse,
} from '../valid-multiple-observation-results.model';

@Injectable({ providedIn: 'root' })
export class VmorService {
  private apiService = inject(ApiService);

  getTests(): Observable<VmorTestDto[]> {
    return this.apiService
      .get<VmorTestsApiResponse>(API.VALID_MULTIPLE_OBSERVATION_RESULTS.GET_TESTS)
      .pipe(map(res => res.data.data));
  }

  getBandResults(testId: string): Observable<VmorBandResultDto[]> {
    return this.apiService
      .get<VmorBandResultsApiResponse>(
        API.VALID_MULTIPLE_OBSERVATION_RESULTS.GET_BAND_RESULTS(testId)
      )
      .pipe(map(res => res.data.data));
  }

  saveBandResults(payload: VmorSaveRequestDto): Observable<VmorBandResultDto[]> {
    return this.apiService
      .post<VmorSaveApiResponse>(
        API.VALID_MULTIPLE_OBSERVATION_RESULTS.SAVE_BAND_RESULTS,
        payload
      )
      .pipe(map(res => res.data.data));
  }
}
