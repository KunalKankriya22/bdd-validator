import { HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  AlternateIdTypeLovItem,
  CentralNoteItem,
  CentralNotesResponse,
  CheckDonorEligibilityRequest,
  CheckDonorEligibilityResponse,
  CityLovItem,
  CityStateLovItem,
  DonationTypeLovItem,
  DonorDetailsItem,
  DonorDetailsResponse,
  DonorPictureResponse,
  EthnicGroupLovItem,
  HeightLovItem,
  LovListResponse,
  PrintCardRequest,
  PrinterItem,
  PrintersResponse,
  ProcedureCodeLovItem,
  SponsorLovItem,
  YtdLossResponse,
} from '../models/lookup-donor-card.model';

@Injectable({ providedIn: 'root' })
export class LookupAndPrintDonorCardService {
  private readonly apiService = inject(ApiService);

  getDonorDetails(donorId: string, driveId: string): Observable<DonorDetailsItem> {
    const endpoint = `${API.LOOKUP_AND_PRINT_DONOR_CARD.DONOR_DETAILS(donorId)}?driveId=${encodeURIComponent(driveId)}`;
    return this.apiService
      .get<DonorDetailsResponse>(endpoint)
      .pipe(map(res => res.item!));
  }

  getDonorPicture(donorId: string): Observable<string | null> {
    return this.apiService
      .get<DonorPictureResponse>(
        API.LOOKUP_AND_PRINT_DONOR_CARD.DONOR_PICTURE(donorId),
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(map(res => res.item?.pictureBase64 ?? null));
  }

  getPrinters(): Observable<PrinterItem[]> {
    return this.apiService
      .get<PrintersResponse>(API.LOOKUP_AND_PRINT_DONOR_CARD.PRINTERS_LOV)
      .pipe(map(res => res.data ?? []));
  }

  printCard(request: PrintCardRequest): Observable<any> {
    return this.apiService.post(
      API.LOOKUP_AND_PRINT_DONOR_CARD.PRINT_CARD(request.donorId),
      request
    );
  }

  getYtdLoss(donorId: string): Observable<{ rbcLoss: number; plasmaLoss: number }> {
    return this.apiService
      .get<YtdLossResponse>(API.LOOKUP_AND_PRINT_DONOR_CARD.YTD_LOSS(donorId))
      .pipe(map(res => res.item ?? { rbcLoss: 0, plasmaLoss: 0 }));
  }

  getNotes(donorId: string): Observable<CentralNoteItem[]> {
    return this.apiService
      .get<CentralNotesResponse>(API.LOOKUP_AND_PRINT_DONOR_CARD.GET_NOTES(donorId))
      .pipe(map(res => res.data ?? []));
  }

  addNote(donorId: string, note: string): Observable<any> {
    return this.apiService.post(
      API.LOOKUP_AND_PRINT_DONOR_CARD.ADD_NOTE(donorId),
      { note }
    );
  }

  getDonationTypesLov(): Observable<DonationTypeLovItem[]> {
    return this.apiService
      .get<LovListResponse<DonationTypeLovItem>>(API.LOOKUP_AND_PRINT_DONOR_CARD.DONATION_TYPES_LOV)
      .pipe(map(res => res.data ?? []));
  }

  getProcedureCodesLov(donationType: string, donorId: string, donorWeight: number | null): Observable<ProcedureCodeLovItem[]> {
    let params = new HttpParams().set('donorId', donorId);
    if (donorWeight !== null && donorWeight > 0) {
      params = params.set('donorWeight', donorWeight);
    }
    return this.apiService
      .get<LovListResponse<ProcedureCodeLovItem>>(API.LOOKUP_AND_PRINT_DONOR_CARD.PROCEDURE_CODES_LOV(donationType), { params })
      .pipe(map(res => res.data ?? []));
  }

  getAlternateIdTypesLov(): Observable<AlternateIdTypeLovItem[]> {
    return this.apiService
      .get<LovListResponse<AlternateIdTypeLovItem>>(API.LOOKUP_AND_PRINT_DONOR_CARD.ALTERNATE_ID_TYPES_LOV)
      .pipe(map(res => res.data ?? []));
  }

  getAllCitiesLov(): Observable<CityLovItem[]> {
    return this.apiService
      .get<LovListResponse<CityLovItem>>(API.LOOKUP_AND_PRINT_DONOR_CARD.CITIES_LOV)
      .pipe(map(res => res.data ?? []));
  }

  getCityStateLov(params: { city?: string; zip?: string; state?: string; exact?: boolean }): Observable<CityStateLovItem[]> {
    let queryParams = params.zip
      ? `?zip=${encodeURIComponent(params.zip)}`
      : `?city=${encodeURIComponent(params.city ?? '')}`;
    if (params.state) queryParams += `&state=${encodeURIComponent(params.state)}`;
    if (params.exact) queryParams += '&exact=true';
    return this.apiService
      .get<LovListResponse<CityStateLovItem>>(`${API.LOOKUP_AND_PRINT_DONOR_CARD.CITY_STATE_LOV}${queryParams}`)
      .pipe(map(res => res.data ?? []));
  }

  getSponsorsLov(searchKeyword: string = ''): Observable<SponsorLovItem[]> {
    const queryParams = searchKeyword ? `?searchKeyword=${encodeURIComponent(searchKeyword)}` : '';
    return this.apiService
      .get<LovListResponse<SponsorLovItem>>(`${API.LOOKUP_AND_PRINT_DONOR_CARD.SPONSORS_LOV}${queryParams}`)
      .pipe(map(res => res.data ?? []));
  }

  checkDonorEligibility(request: CheckDonorEligibilityRequest): Observable<CheckDonorEligibilityResponse> {
    return this.apiService.post<CheckDonorEligibilityResponse>(
      API.LOOKUP_AND_PRINT_DONOR_CARD.CHECK_DONOR_ELIGIBILITY,
      request
    );
  }

  getHeightsLov(): Observable<HeightLovItem[]> {
    return this.apiService
      .get<LovListResponse<HeightLovItem>>(API.LOOKUP_AND_PRINT_DONOR_CARD.HEIGHT_LOV)
      .pipe(map(res => res.data ?? []));
  }

  getEthnicGroupsLov(): Observable<EthnicGroupLovItem[]> {
    return this.apiService
      .get<LovListResponse<EthnicGroupLovItem>>(API.LOOKUP_AND_PRINT_DONOR_CARD.ETHNIC_GROUPS_LOV)
      .pipe(map(res => res.data ?? []));
  }
}
