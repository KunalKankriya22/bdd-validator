import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { API } from 'src/app/core/constants/api.constants';
import { SearchForDonorCriteria, SearchForDonorResponse, DonorSearchResult } from './search-for-donor.model';

@Injectable({
  providedIn: 'root'
})
export class SearchForDonorService {
  private readonly apiService = inject(ApiService);

  searchDonors(
    criteria: SearchForDonorCriteria
  ): Observable<{ data: DonorSearchResult[]; total: number }> {
    const endpoint = API.SEARCH_FOR_DONOR.SEARCH;

    return this.apiService
      .post<SearchForDonorResponse>(endpoint, criteria, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, [400, 404])
      })
      .pipe(
        map(res => ({
          data: res.data ?? [],
          total: res.total ?? 0
        }))
      );
  }

  validateDeferralId(deferralId: string): Observable<any> {
    return this.apiService.post<any>(
      API.SEARCH_FOR_DONOR.VALIDATE_DEFERRAL_ID,
      { deferralId },
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  lookupDonorId(donorId: string): Observable<any> {
    return this.apiService.get<any>(
      API.FIND_DONOR.LOOKUP_DONOR_ID(donorId),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
