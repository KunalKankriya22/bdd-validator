import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  DonationDetailsResponse,
  DonationDetailsQuery,
  DonorHeaderResponse,
  ApiListResponse,
  ApiItemResponse,
  EquipSupplyItem,
  DonationAttribute,
  AuxDonation,
  SponsorLookup,
  DonationDetailsAccess,
  PhysicalFindingComment,
} from '../models/donation-details.model';

@Injectable({ providedIn: 'root' })
export class DonationDetailsApiService {
  private readonly apiService = inject(ApiService);

  getDonationDetails(
    donorId: string,
    take: number,
    skip: number,
    query: DonationDetailsQuery,
  ): Observable<DonationDetailsResponse> {
    const endpoint = API.DONATION_DETAILS.GET(donorId, take, skip);
    return this.apiService.post<DonationDetailsResponse>(endpoint, query);
  }

  getDonorHeader(donorId: string): Observable<DonorHeaderResponse> {
    const endpoint = API.DONOR_DEMOGRAPHICS.HEADER(donorId);
    return this.apiService.get<DonorHeaderResponse>(endpoint);
  }

  getEquipSupply(transactionId: string): Observable<ApiListResponse<EquipSupplyItem>> {
    const endpoint = API.DONATION_DETAILS.EQUIP_SUPPLY(transactionId);
    return this.apiService.get<ApiListResponse<EquipSupplyItem>>(endpoint);
  }

  getAttributes(transactionId: string): Observable<ApiListResponse<DonationAttribute>> {
    const endpoint = API.DONATION_DETAILS.ATTRIBUTES(transactionId);
    return this.apiService.get<ApiListResponse<DonationAttribute>>(endpoint);
  }

  getAuxDonations(donorId: string): Observable<ApiListResponse<AuxDonation>> {
    const endpoint = API.DONATION_DETAILS.AUX_DONATIONS(donorId);
    return this.apiService.get<ApiListResponse<AuxDonation>>(endpoint);
  }

  searchSponsors(searchText: string): Observable<ApiListResponse<SponsorLookup>> {
    const endpoint = `${API.DONATION_DETAILS.SPONSOR_SEARCH}?searchText=${encodeURIComponent(searchText)}`;
    return this.apiService.get<ApiListResponse<SponsorLookup>>(endpoint);
  }

  updateCreditSponsor(unitId: string, collDate: string, creditSponsor: string): Observable<ApiItemResponse<boolean>> {
    const endpoint = `${API.DONATION_DETAILS.UPDATE_CREDIT_SPONSOR(unitId)}?collDate=${encodeURIComponent(collDate)}`;
    return this.apiService.put<ApiItemResponse<boolean>>(endpoint, { creditSponsor });
  }

  getAccess(): Observable<ApiItemResponse<DonationDetailsAccess>> {
    return this.apiService.get<ApiItemResponse<DonationDetailsAccess>>(API.DONATION_DETAILS.ACCESS);
  }

  getPhysicalComments(transactionId: string): Observable<ApiListResponse<PhysicalFindingComment>> {
    const endpoint = API.DONATION_DETAILS.PHYSICAL_COMMENTS(transactionId);
    return this.apiService.get<ApiListResponse<PhysicalFindingComment>>(endpoint);
  }

  getPhysicalFindingsWithDetails(unitId: string, collectionDate?: string): Observable<ApiListResponse<any>> {
    let endpoint = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_PHYSICAL_FINDINGS(unitId);
    if (collectionDate) endpoint += `?collectionDate=${encodeURIComponent(collectionDate)}`;
    return this.apiService.get<ApiListResponse<any>>(endpoint);
  }
}
