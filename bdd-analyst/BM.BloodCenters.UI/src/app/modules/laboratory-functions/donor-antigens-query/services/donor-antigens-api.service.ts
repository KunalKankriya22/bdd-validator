import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  DonorAntigensData,
  DonorAntigensQueryResponse,
  DonorInterdiction
} from '../models/donor-antigens.model';

@Injectable({
  providedIn: 'root'
})
export class DonorAntigensApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves comprehensive antigen information for a specified donor
   * @param donorId Unique donor identifier
   * @returns Observable of donor antigens data
   */
  getDonorAntigens(donorId: string): Observable<DonorAntigensData> {
    const endpoint = API.DONOR_ANTIGENS_QUERY.GET(donorId);
    return this.apiService.get<DonorAntigensQueryResponse>(endpoint)
      .pipe(
        map(response => response.item)
      );
  }

  /**
   * Get donor interdictions
   * TODO: Replace with actual API endpoint when available
   * @param _donorId Unique donor identifier
   * @returns Observable of donor interdictions array
   */
  getDonorInterdictions(_donorId: string): Observable<DonorInterdiction[]> {
    // TODO: Implement API call when endpoint is available
    // const endpoint = API.DONOR_ANTIGENS_QUERY.INTERDICTIONS(_donorId);
    // return this.apiService.get<{ data: DonorInterdiction[] }>(endpoint)
    //   .pipe(map(response => response.data));

    // Temporary: return empty array until API endpoint is implemented
    return of([]);
  }
}
