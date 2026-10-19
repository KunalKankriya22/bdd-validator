import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  AssociateLetterToInterdictionModel,
  AssociateLetterToInterdictionSearchRequest,
  AssociateLetterToInterdictionFilterRequest,
  CreateAssociateLetterToInterdictionDto,
  UpdateAssociateLetterToInterdictionDto,
  InterdictionDropdown,
  DonationTypeDropdown,
  LetterDropdown,
  FilterLetterDropdown,
  ApiResponse
} from '../models/associate-letter-to-interdiction.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AssociateLetterToInterdictionService {
  private readonly apiService = inject(ApiService);

  search(
    request: AssociateLetterToInterdictionSearchRequest
  ): Observable<{ data: AssociateLetterToInterdictionModel[]; totalRecords: number }> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.SEARCH;

    return this.apiService.post<ApiResponse<AssociateLetterToInterdictionModel[]>>(endpoint, request).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getByCompositeKey(
    interCode: string,
    donationType: string,
    letterId: string
  ): Observable<AssociateLetterToInterdictionModel> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.GET_BY_KEY(interCode, donationType, letterId);

    return this.apiService.get<ApiResponse<AssociateLetterToInterdictionModel>>(endpoint).pipe(
      map(response => response.data as AssociateLetterToInterdictionModel),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  create(payload: CreateAssociateLetterToInterdictionDto): Observable<ApiResponse<AssociateLetterToInterdictionModel>> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.CREATE;

    return this.apiService.post<ApiResponse<AssociateLetterToInterdictionModel>>(endpoint, payload).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  update(
    interCode: string,
    donationType: string,
    letterId: string,
    payload: UpdateAssociateLetterToInterdictionDto
  ): Observable<ApiResponse<AssociateLetterToInterdictionModel>> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.UPDATE(interCode, donationType, letterId);

    return this.apiService.put<ApiResponse<AssociateLetterToInterdictionModel>>(endpoint, payload).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  delete(
    interCode: string,
    donationType: string,
    letterId: string
  ): Observable<ApiResponse<void>> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.DELETE(interCode, donationType, letterId);

    return this.apiService.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getInterdictionsDropdown(): Observable<InterdictionDropdown[]> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.INTERDICTIONS_DROPDOWN;

    return this.apiService.get<ApiResponse<InterdictionDropdown[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getDonationTypesDropdown(): Observable<DonationTypeDropdown[]> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.DONATION_TYPES_DROPDOWN;

    return this.apiService.get<ApiResponse<DonationTypeDropdown[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getLettersDropdown(): Observable<LetterDropdown[]> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.LETTERS_DROPDOWN;

    return this.apiService.get<ApiResponse<LetterDropdown[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getFilterInterdictionsDropdown(filter: AssociateLetterToInterdictionFilterRequest): Observable<InterdictionDropdown[]> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.FILTER_INTERDICTIONS_DROPDOWN;

    return this.apiService.post<ApiResponse<InterdictionDropdown[]>>(endpoint, filter).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getFilterDonationTypesDropdown(filter: AssociateLetterToInterdictionFilterRequest): Observable<DonationTypeDropdown[]> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.FILTER_DONATION_TYPES_DROPDOWN;

    return this.apiService.post<ApiResponse<DonationTypeDropdown[]>>(endpoint, filter).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getFilterLettersDropdown(filter: AssociateLetterToInterdictionFilterRequest): Observable<FilterLetterDropdown[]> {
    const endpoint = API.DONOR_FUNCTIONS.ASSOCIATE_LETTER_TO_INTERDICTION.FILTER_LETTERS_DROPDOWN;

    return this.apiService.post<ApiResponse<FilterLetterDropdown[]>>(endpoint, filter).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
