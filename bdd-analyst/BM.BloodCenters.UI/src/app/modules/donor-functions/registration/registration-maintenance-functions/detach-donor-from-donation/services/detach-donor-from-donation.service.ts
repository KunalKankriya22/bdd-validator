import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReturnResult,
  DonationWithDonorDto,
  DetachDonorRequest,
  BleedTimeDetailsDto
} from '../models/detach-donor-from-donation.model';

@Injectable({ providedIn: 'root' })
export class DetachDonorFromDonationService {
  private readonly apiService = inject(ApiService);

  getDonationsByUnitId(unitId: string): Observable<ReturnResult<DonationWithDonorDto>> {
    return this.apiService.get<ReturnResult<DonationWithDonorDto>>(
      API.DETACH_DONOR_FROM_DONATION.GET_DONATIONS(unitId)
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  validateDonation(unitId: string, collDate: string): Observable<ReturnResult<DonationWithDonorDto>> {
    return this.apiService.get<ReturnResult<DonationWithDonorDto>>(
      API.DETACH_DONOR_FROM_DONATION.VALIDATE(unitId, collDate)
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getBleedTimeDetails(unitId: string): Observable<ReturnResult<BleedTimeDetailsDto>> {
    return this.apiService.get<ReturnResult<BleedTimeDetailsDto>>(
      API.DETACH_DONOR_FROM_DONATION.BLEED_TIME_DETAILS(unitId)
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  detachDonor(request: DetachDonorRequest): Observable<ReturnResult<object>> {
    return this.apiService.post<ReturnResult<object>>(
      API.DETACH_DONOR_FROM_DONATION.DETACH,
      request
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
