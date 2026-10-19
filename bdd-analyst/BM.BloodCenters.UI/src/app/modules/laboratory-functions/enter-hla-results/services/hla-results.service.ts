import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  HlaRetrieveByUnitRequest,
  DonorHlaInfo,
  DonorHlaInfoResponse,
  SaveHlaResultsRequest,
  SaveHlaResultsResponse,
  ValidHlaAntigen,
  ValidHlaAntigensResponse
} from '../models/hla-results.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class HlaResultsService {
  private readonly apiService = inject(ApiService);

  retrieveDonorByUnitId(request: HlaRetrieveByUnitRequest): Observable<DonorHlaInfo | null> {
    const endpoint = API.DONOR_FUNCTIONS.HLA_RESULTS.RETRIEVE_BY_UNIT;

    return this.apiService.post<DonorHlaInfoResponse>(endpoint, request).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      }),
      catchError(error => throwError(() => error))
    );
  }

  retrieveDonorByDonorId(donorId: string): Observable<DonorHlaInfo | null> {
    const endpoint = API.DONOR_FUNCTIONS.HLA_RESULTS.GET_BY_DONOR(donorId);

    return this.apiService.get<DonorHlaInfoResponse>(endpoint).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      }),
      catchError(error => throwError(() => error))
    );
  }

  saveHlaResults(request: SaveHlaResultsRequest): Observable<SaveHlaResultsResponse> {
    const endpoint = API.DONOR_FUNCTIONS.HLA_RESULTS.SAVE;

    return this.apiService.post<SaveHlaResultsResponse>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateHlaResults(donorId: string, request: SaveHlaResultsRequest): Observable<SaveHlaResultsResponse> {
    const endpoint = API.DONOR_FUNCTIONS.HLA_RESULTS.UPDATE(donorId);

    return this.apiService.put<SaveHlaResultsResponse>(endpoint, request).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getValidAntigens(locus: 'A' | 'B'): Observable<ValidHlaAntigen[]> {
    const endpoint = API.DONOR_FUNCTIONS.HLA_RESULTS.GET_VALID_ANTIGENS(locus);

    return this.apiService.get<ValidHlaAntigensResponse>(endpoint).pipe(
      map(response => {
        if (response.data && response.data.length > 0 && response.data[0]) {
          return response.data[0];
        }
        return [];
      }),
      catchError(error => throwError(() => error))
    );
  }
}
