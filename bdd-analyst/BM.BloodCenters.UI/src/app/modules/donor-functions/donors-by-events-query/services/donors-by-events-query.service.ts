import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import moment from 'moment';
import {
  DonorSearchRequestDto,
  DonorSearchResultDto,
  SearchTypeOption,
  ValueCodeOption,
  DriveLovOption,
  ApiResponse,
  SearchTypesResponse
} from '../models/donors-by-events-query.model';

/**
 * Service for Donors by Events Query API
 * Base URL: /api/donor-search
 */
@Injectable({
  providedIn: 'root'
})
export class DonorsByEventsQueryService {
  private readonly apiService = inject(ApiService);

  getSearchTypes(): Observable<SearchTypeOption[]> {
    return this.apiService.get<SearchTypesResponse>(API.DONOR_FUNCTIONS.DONORS_BY_EVENTS_QUERY.SEARCH_TYPES)
      .pipe(map(response => response.data ?? []));
  }

  searchDonors(request: DonorSearchRequestDto): Observable<ApiResponse<DonorSearchResultDto>> {
    const payload = {
      searchType: request.searchType,
      startDate: request.startDate ? moment(request.startDate).format('YYYY-MM-DD') : null,
      endDate: request.endDate ? moment(request.endDate).format('YYYY-MM-DD') : null,
      code: request.code || null,
      driveId: request.driveId || null,
      includePinMailed: request.includePinMailed || false,
      take: request.take || 10,
      skip: request.skip || 0,
      sortColumn: request.sortColumn || 'DonorName',
      sortDirection: request.sortDirection || 'ASC'
    };
    return this.apiService.post<ApiResponse<DonorSearchResultDto>>(
      API.DONOR_FUNCTIONS.DONORS_BY_EVENTS_QUERY.SEARCH,
      payload
    );
  }

  getValueCodes(searchType: string): Observable<ValueCodeOption[]> {
    return this.apiService.get<ApiResponse<ValueCodeOption>>(
      `${API.DONOR_FUNCTIONS.DONORS_BY_EVENTS_QUERY.VALUE_CODES}?searchType=${encodeURIComponent(searchType)}`
    ).pipe(map(response => response.data));
  }

  getDrivesLov(chapterId: string): Observable<DriveLovOption[]> {
    return this.apiService.get<ApiResponse<DriveLovOption>>(
      `${API.DONOR_FUNCTIONS.DONORS_BY_EVENTS_QUERY.DRIVES_LOV}?chapterId=${encodeURIComponent(chapterId)}`
    ).pipe(map(response => (response.data || []).map(d => ({
      driveId: d.driveId,
      description: d.description || `${d.driveId}${d.sponsorName ? ' - ' + d.sponsorName : ''}`,
      driveDate: d.driveDate,
      sponsorName: d.sponsorName
    }))));
  }
}
