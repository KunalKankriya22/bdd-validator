import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReturnResult,
  GroupInterdictionLookupDto,
  DonationsResponse,
  GroupInterdictionParams,
  SelectableInterdiction,
  ValidInterdiction,
  PlaceInterdictionRequest,
  PlaceInterdictionResponse,
  RemoveInterdictionRequest,
  RemoveInterdictionResponse,
  DonorsResponse,
  DonorRecord,
  DonorGroupInterdictionParams,
  PlaceDonorInterdictionRequest,
  RemoveDonorInterdictionRequest,
  DonorInterdictionResponse,
  DonorGroupInterdictionComment,
  DonorGroupInterdictionCommentQuery,
  AddDonorGroupInterdictionCommentRequest
} from '../models/maintain-group-interdictions.model';
import { ApiResponse } from '@shared/interfaces/donor.interface';

@Injectable({
  providedIn: 'root'
})
export class MaintainGroupInterdictionsService {
  private readonly apiService = inject(ApiService);

  getGroupModes(): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_GROUP_MODES;

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching group modes:', error);
        return throwError(() => error);
      })
    );
  }

  getValuesByMode(mode: string): Observable<GroupInterdictionLookupDto[]> {
    let endpoint: string;

    switch (mode) {
      case 'DRIVE':
        endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_DRIVE_IDS;
        break;
      case 'COLL':
        endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_COLLECTION_DATES;
        break;
      case 'BATCH':
        endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_BATCH_IDS;
        break;
      default:
        return throwError(() => new Error(`Unknown group mode: ${mode}`));
    }

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching values by mode:', error);
        return throwError(() => error);
      })
    );
  }

  retrieveDonations(params: GroupInterdictionParams): Observable<DonationsResponse> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_DONATIONS;

    return this.apiService.post<ReturnResult<DonationsResponse>>(endpoint, params).pipe(
      map(response => response.item || { donations: [], totalDonors: 0 }),
      catchError(error => {
        console.error('Error retrieving donations:', error);
        return throwError(() => error);
      })
    );
  }

  getExistingInterCodes(params: GroupInterdictionParams): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_INTER_CODES;

    return this.apiService.post<ReturnResult<GroupInterdictionLookupDto>>(endpoint, params).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching existing interdiction codes:', error);
        return throwError(() => error);
      })
    );
  }

  getValidInterdictions(interType: string): Observable<SelectableInterdiction[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_VALID_INTERDICTIONS;

    return this.apiService.post<ReturnResult<ValidInterdiction>>(endpoint, { interType }).pipe(
      map(response => (response.data || []).map(item => ({ ...item, selected: false }))),
      catchError(error => {
        console.error('Error fetching valid interdictions:', error);
        return throwError(() => error);
      })
    );
  }

  placeInterdictions(request: PlaceInterdictionRequest): Observable<PlaceInterdictionResponse> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.PLACE_INTERDICTIONS;

    return this.apiService.post<ReturnResult<PlaceInterdictionResponse>>(endpoint, request).pipe(
      map(response => response.item || { results: [], successCount: 0, failureCount: 0, totalUnits: 0, totalInterCodes: 0, committed: false }),
      catchError(error => {
        console.error('Error placing interdictions:', error);
        return throwError(() => error);
      })
    );
  }

  removeInterdictions(request: RemoveInterdictionRequest): Observable<RemoveInterdictionResponse> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.REMOVE_INTERDICTIONS;

    return this.apiService.post<ReturnResult<RemoveInterdictionResponse>>(endpoint, request).pipe(
      map(response => response.item || { results: [], successCount: 0, failureCount: 0, totalUnits: 0, totalInterCodes: 0, committed: false }),
      catchError(error => {
        console.error('Error removing interdictions:', error);
        return throwError(() => error);
      })
    );
  }

  getInterTypes(): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_INTER_TYPES;

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching interdiction types:', error);
        return throwError(() => error);
      })
    );
  }

  getTermReasons(): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_GROUP_INTERDICTIONS.GET_TERM_REASONS;

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching termination reasons:', error);
        return throwError(() => error);
      })
    );
  }

  // Donor Group Interdiction Methods (Donors Tab)

  getDonorGroupModes(): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_GROUP_MODES;

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donor group modes:', error);
        return throwError(() => error);
      })
    );
  }

  getDonorGroupValues(mode: string): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_GROUP_VALUES(mode);

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donor group values:', error);
        return throwError(() => error);
      })
    );
  }

  retrieveDonors(params: DonorGroupInterdictionParams): Observable<DonorsResponse> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_DONORS;

    return this.apiService.post<ReturnResult<DonorRecord>>(endpoint, params).pipe(
      map(response => ({
        donors: response.data || [],
        totalDonors: response.total || 0
      })),
      catchError(error => {
        console.error('Error retrieving donors:', error);
        return throwError(() => error);
      })
    );
  }

  getExistingDonorInterCodes(params: DonorGroupInterdictionParams): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_INTER_CODES;

    return this.apiService.post<ReturnResult<GroupInterdictionLookupDto>>(endpoint, params).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching existing donor interdiction codes:', error);
        return throwError(() => error);
      })
    );
  }

  placeDonorInterdictions(request: PlaceDonorInterdictionRequest): Observable<DonorInterdictionResponse> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.PLACE_INTERDICTIONS;

    return this.apiService.post<ReturnResult<DonorInterdictionResponse>>(endpoint, request).pipe(
      map(response => response.item || { results: [], successCount: 0, failureCount: 0, totalDonors: 0, totalInterCodes: 0 }),
      catchError(error => {
        console.error('Error placing donor interdictions:', error);
        return throwError(() => error);
      })
    );
  }

  removeDonorInterdictions(request: RemoveDonorInterdictionRequest): Observable<DonorInterdictionResponse> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.REMOVE_INTERDICTIONS;

    // Ensure deferralChoice is included with default value 'B' if not specified
    const requestWithDefaults = {
      ...request,
      deferralChoice: request.deferralChoice || 'B'
    };

    return this.apiService.post<ReturnResult<DonorInterdictionResponse>>(endpoint, requestWithDefaults).pipe(
      map(response => response.item || { results: [], successCount: 0, failureCount: 0, totalDonors: 0, totalInterCodes: 0 }),
      catchError(error => {
        console.error('Error removing donor interdictions:', error);
        return throwError(() => error);
      })
    );
  }

  getDonorTermReasons(): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_TERM_REASONS;

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donor termination reasons:', error);
        return throwError(() => error);
      })
    );
  }

  getDonorInterdictionComments(query: DonorGroupInterdictionCommentQuery): Observable<DonorGroupInterdictionComment[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_COMMENTS;

    return this.apiService.post<ReturnResult<DonorGroupInterdictionComment>>(endpoint, query).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donor interdiction comments:', error);
        return throwError(() => error);
      })
    );
  }

  addDonorInterdictionComment(request: AddDonorGroupInterdictionCommentRequest): Observable<ApiResponse<null>> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.ADD_COMMENT;

    return this.apiService.post<ApiResponse<null>>(endpoint, request).pipe(
      catchError(error => {
        console.error('Error adding donor interdiction comment:', error);
        return throwError(() => error);
      })
    );
  }

  getDonorInterTypes(): Observable<GroupInterdictionLookupDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_INTER_TYPES;

    return this.apiService.get<ReturnResult<GroupInterdictionLookupDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donor interdiction types:', error);
        return throwError(() => error);
      })
    );
  }

  getValidDonorInterdictions(interType: string): Observable<SelectableInterdiction[]> {
    const endpoint = API.DONOR_FUNCTIONS.MAINTAIN_DONOR_GROUP_INTERDICTIONS.GET_VALID_INTERDICTIONS;

    return this.apiService.post<ReturnResult<ValidInterdiction>>(endpoint, { interType }).pipe(
      map(response => (response.data || []).map(item => ({ ...item, selected: false }))),
      catchError(error => {
        console.error('Error fetching valid donor interdictions:', error);
        return throwError(() => error);
      })
    );
  }

}
