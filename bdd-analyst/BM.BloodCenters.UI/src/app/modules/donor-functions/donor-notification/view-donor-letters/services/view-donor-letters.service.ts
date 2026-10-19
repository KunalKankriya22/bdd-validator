import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  DonorLetterDto,
  DonorLetterDetailDto,
  LetterCodeLookupDto,
  DonorLookupDto,
  ReturnResult,
  DonorLettersQueryParams,
  DonorLookupQueryParams,
} from '../models/view-donor-letters.model';

@Injectable({
  providedIn: 'root',
})
export class ViewDonorLettersService {
  private readonly apiService = inject(ApiService);

  queryDonorLetters(
    params: DonorLettersQueryParams
  ): Observable<{ data: DonorLetterDto[]; total: number }> {
    let httpParams = new HttpParams()
      .set('fromDate', params.fromDate)
      .set('toDate', params.toDate)
      .set('take', (params.take ?? 10).toString())
      .set('skip', (params.skip ?? 0).toString());

    if (params.letterCode) httpParams = httpParams.set('letterCode', params.letterCode);
    if (params.donorId) httpParams = httpParams.set('donorId', params.donorId);
    if (params.sortColumn) httpParams = httpParams.set('sortColumn', params.sortColumn);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.apiService
      .get<ReturnResult<DonorLetterDto>>(API.DONOR_LETTERS.BASE, { params: httpParams })
      .pipe(
        map((response) => ({
          data: response.data || [],
          total: response.total || 0,
        })),
        catchError((error) => {
          console.error('Error querying donor letters:', error);
          return throwError(() => error);
        })
      );
  }

  getDonorLetterDetail(
    donorId: string,
    letterSeqNo: string
  ): Observable<DonorLetterDetailDto | null> {
    return this.apiService
      .get<{ success: boolean; data: DonorLetterDetailDto; message: string }>(
        API.DONOR_LETTERS.DETAIL(donorId, letterSeqNo)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching donor letter detail:', error);
          return throwError(() => error);
        })
      );
  }

  getLetterCodes(): Observable<LetterCodeLookupDto[]> {
    return this.apiService
      .get<{ success: boolean; data: LetterCodeLookupDto[]; message: string }>(
        API.DONOR_LETTERS.LETTER_CODES
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching letter codes:', error);
          return throwError(() => error);
        })
      );
  }

  getDonors(params: DonorLookupQueryParams): Observable<DonorLookupDto[]> {
    let httpParams = new HttpParams()
      .set('fromDate', params.fromDate)
      .set('toDate', params.toDate);

    if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);

    return this.apiService
      .get<{ success: boolean; data: DonorLookupDto[]; message: string }>(
        API.DONOR_LETTERS.DONORS,
        { params: httpParams }
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching donors:', error);
          return throwError(() => error);
        })
      );
  }
}
