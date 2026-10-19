import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import {
  DonationsOnHoldApiResponse,
  DonationOnHold,
  DonationsOnHoldRequest,
  DonationHoldDetail,
  DonorHoldDetail,
  DonationsOnHoldLookups,
  LookupsApiResponse,
  LookupsData,
  LookupItem,
} from '../models/donations-on-hold-query.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from '../../../../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class DonationsOnHoldQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  private static readonly DEFAULT_TAKE = 5000;
  private static readonly DEFAULT_SKIP = 0;

  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId,
    });
  }

  /**
   * POST /api/v1/donations-on-hold/{take}/{skip}
   * Maps to DonationsOnHoldController.SearchAsync
   */
  search(
    params: DonationsOnHoldRequest,
    take: number = DonationsOnHoldQueryService.DEFAULT_TAKE,
    skip: number = DonationsOnHoldQueryService.DEFAULT_SKIP,
  ): Observable<{ data: DonationOnHold[]; total: number; appliedFromDate?: string; appliedToDate?: string }> {
    return this.apiService
      .post<DonationsOnHoldApiResponse<DonationOnHold>>(
        API.RECRUITMENT.DONATIONS_ON_HOLD.SEARCH(take, skip),
        params,
        { headers: this.getHeaders() },
      )
      .pipe(
        map((response) => ({
          data: response.data || [],
          total: response.total || 0,
          appliedFromDate: response.appliedFromDate,
          appliedToDate: response.appliedToDate,
        })),
        catchError((error) => {
          if (error.status === 404 && error.error?.success === true) {
            return of({ data: [] as DonationOnHold[], total: 0 });
          }
          return throwError(() => error);
        }),
      );
  }

  /**
   * GET /api/v1/donations-on-hold/{transactionId}/donation-holds?activeOnly={activeOnly}
   * Maps to DonationsOnHoldController.GetDonationHoldsAsync
   */
  getDonationHolds(
    transactionId: string,
    activeOnly: boolean = true,
  ): Observable<DonationHoldDetail[]> {
    const endpoint = API.RECRUITMENT.DONATIONS_ON_HOLD.DONATION_HOLDS(transactionId);
    const params = new HttpParams().set('activeOnly', String(activeOnly));

    return this.apiService
      .get<DonationsOnHoldApiResponse<DonationHoldDetail>>(endpoint, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map((response) => (response.data || []).map((item: any) => ({
          interType: item.interType || '',
          holdCode: item.interCode || '',
          description: item.interDescription || '',
          createdDate: item.insertDate || '',
          terminationDate: item.termDate || '',
          comments: item.comments || '',
          effectiveDate: item.releaseDate || '',
          status: '',
          createdBy: '',
        }))),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  /**
   * GET /api/v1/donations-on-hold/{transactionId}/donor-holds/{donorId}?activeOnly={activeOnly}
   * Maps to DonationsOnHoldController.GetDonorHoldsAsync
   */
  getDonorHolds(
    transactionId: string,
    donorId: string,
    activeOnly: boolean = true,
  ): Observable<DonorHoldDetail[]> {
    const endpoint = API.RECRUITMENT.DONATIONS_ON_HOLD.DONOR_HOLDS(transactionId, donorId);
    const params = new HttpParams().set('activeOnly', String(activeOnly));

    return this.apiService
      .get<DonationsOnHoldApiResponse<DonorHoldDetail>>(endpoint, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map((response) => (response.data || []).map((item: any) => ({
          interType: item.interType || '',
          holdCode: item.interCode || '',
          description: item.interDescription || '',
          effectiveDate: item.effDate || '',
          terminationDate: item.termDate || '',
          createdDate: item.insertDate || '',
          status: '',
          interdictionCode: item.interCode || '',
          donorId: donorId,
          createdBy: '',
        }))),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  getLookups(): Observable<DonationsOnHoldLookups> {
    return this.apiService
      .get<LookupsApiResponse>(API.RECRUITMENT.DONATIONS_ON_HOLD.LOOKUPS, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => this.mapLookupsResponse(response)),
        catchError(() => of(this.getEmptyLookups())),
      );
  }

  getDrivesLookup(fromDate?: string, toDate?: string): Observable<LookupItem[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.apiService
      .get<{ data: LookupItem[] }>(API.RECRUITMENT.DONATIONS_ON_HOLD.DRIVES_LOOKUP, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({
            code: item.code,
            description: item.description || item.code,
          })),
        ),
        catchError(() => of([])),
      );
  }

  getUsersLookup(fromDate?: string, toDate?: string): Observable<LookupItem[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.apiService
      .get<{ data: LookupItem[] }>(API.RECRUITMENT.DONATIONS_ON_HOLD.USERS_LOOKUP, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map((response) =>
          (response.data || []).map((item) => ({
            code: item.code,
            description: item.description || item.code,
          })),
        ),
        catchError(() => of([])),
      );
  }

  private mapLookupsResponse(response: LookupsApiResponse): DonationsOnHoldLookups {
    const data: LookupsData | LookupsApiResponse = response?.item || response?.data || response;
    const mapItems = (items: LookupItem[] | undefined): LookupItem[] =>
      (items || []).map((item) => ({
        code: item.code,
        description: item.description || item.code,
      }));

    return {
      showTerms: [
        { code: 'N', description: 'No' },
        { code: 'Y', description: 'Yes' },
      ],
      drives: mapItems(data?.drives),
      users: mapItems(data?.users),
      donationTypes: mapItems(data?.donationTypes),
      procedureCodes: mapItems(data?.procedureCodes),
      holds: mapItems((data as LookupsData)?.holdCodes || (data as LookupsApiResponse)?.holdCodes),
    };
  }

  private getEmptyLookups(): DonationsOnHoldLookups {
    return {
      showTerms: [
        { code: 'N', description: 'No' },
        { code: 'Y', description: 'Yes' },
      ],
      drives: [],
      users: [],
      donationTypes: [],
      procedureCodes: [],
      holds: [],
    };
  }
}
