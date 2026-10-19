import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { DonorInterdictionsResponse, DonorDetailsResponse } from '../models/donor-interdictions.model';

/**
 * API Service for Donor Interdictions (DPWDNINT)
 * Calls backend endpoints:
 * - GET /api/v1/donor/{donorId}/interdiction-details
 * - GET /api/v1/donor/{donorId}/interdictions
 */
@Injectable({
  providedIn: 'root'
})
export class DonorInterdictionsApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get donor details for interdictions page
   * @param donorId - Donor ID
   * @returns Observable of donor details
   */
  getDonorDetails(donorId: string): Observable<DonorDetailsResponse> {
    const endpoint = API.MAINTAIN_DONOR_INTERDICTION.DONOR_DETAILS(donorId);
    return this.apiService.get<DonorDetailsResponse>(endpoint);
  }

  /**
   * Get donor interdiction history
   * @param donorId - Donor ID
   * @param showTerminated - Include terminated interdictions (default: false)
   * @returns Observable of donor interdictions response
   */
  getDonorInterdictions(
    donorId: string,
    showTerminated: boolean = false
  ): Observable<DonorInterdictionsResponse> {
    const endpoint = API.MAINTAIN_DONOR_INTERDICTION.INTERDICTIONS(donorId);
    const params = new HttpParams().set('showTerminated', showTerminated.toString());

    return this.apiService.get<DonorInterdictionsResponse>(endpoint, { params });
  }
}
