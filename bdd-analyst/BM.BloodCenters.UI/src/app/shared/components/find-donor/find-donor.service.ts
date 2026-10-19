import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  FindDonorSearchCriteria,
  FindDonorResponse,
  FindDonorResult,
  AlternateIdType,
  AlternateIdTypesResponse,
  DonorLookupResponse,
  FindDonorConfig,
  FindDonorConfigResponse
} from './find-donor.model';

@Injectable({
  providedIn: 'root'
})
export class FindDonorService {
  private readonly apiService = inject(ApiService);

  getAlternateIdTypes(): Observable<AlternateIdType[]> {
    return this.apiService
      .get<AlternateIdTypesResponse>(API.FIND_DONOR.ALTERNATE_ID_TYPES)
      .pipe(map(res => res.data ?? []));
  }

  searchDonors(
    criteria: FindDonorSearchCriteria
  ): Observable<{ data: FindDonorResult[]; total: number }> {
    return this.apiService
      .post<FindDonorResponse>(API.FIND_DONOR.SEARCH, criteria)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          total: res.total ?? 0
        }))
      );
  }

  lookupDonorId(donorId: string): Observable<DonorLookupResponse> {
    return this.apiService.get<DonorLookupResponse>(
      API.FIND_DONOR.LOOKUP_DONOR_ID(donorId)
    );
  }

  getConfig(programName?: string): Observable<FindDonorConfig> {
    const params = programName ? `?programName=${encodeURIComponent(programName)}` : '';
    return this.apiService
      .get<FindDonorConfigResponse>(`${API.FIND_DONOR.CONFIG}${params}`)
      .pipe(
        map(res => res.item ?? {
          confirmatoryField: 'N',
          firstNameVisible: true,
          donorIdEnabled: false,
          donorIdDoubleEntry: false,
          allowNew: 'N',
          allowSelect: 'N',
          allowHold: 'N',
          selectAllowedLevels: 5,
          newAllowedLevel: 1,
          selectAllowedMultilevel: 0,
          gradingLevel: 5,
          altIdMode: 'A',
          fields: {}
        })
      );
  }
}
