import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonationEntryDetailsWithDonor,
  DonationEntryDetailsResponse,
} from '@shared/models/donation-entry-details.model';

@Injectable({
  providedIn: 'root',
})
export class DonationEntryDetailsService {
  private readonly apiService = inject(ApiService);

  getEntryDetails(unitId: string, collDate?: string): Observable<DonationEntryDetailsWithDonor> {
    return this.apiService
      .get<DonationEntryDetailsResponse>(API.RECRUITMENT.DONATION_ENTRY_DETAILS.GET_WITH_DONOR(unitId, collDate))
      .pipe(map((response) => response?.item));
  }
}
