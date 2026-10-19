import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import { ValidMasterCodesService } from '../../../../shared/services/valid-master-codes.service';
import {
  DonorDemographicsDto,
  UpdateDonorDemographicsDto,
  ReturnResult,
  MasterCodeOption,
  CityStateResult,
  EmployerSearchRequest,
  EmployerResult
} from '../models/donor-demographics.model';

@Injectable({
  providedIn: 'root'
})
export class DonorDemographicsService {
  private readonly http = inject(HttpClient);
  private readonly lookupService = inject(ValidMasterCodesService);

  getDemographics(donorId: string): Observable<DonorDemographicsDto> {
    if (!donorId || !donorId.trim()) {
      return throwError(() => new Error('Donor ID is required'));
    }

    const cleanDonorId = donorId.trim();
    const url = `${environment.apiUrl}${API.DONOR_DEMOGRAPHICS.GET(cleanDonorId)}`;

    return this.http.get<ReturnResult<DonorDemographicsDto>>(url).pipe(
      map((response) => {
        if (response?.success) {
          const result = response.item ?? response.data?.[0];
          if (result) {
            return result;
          }
        }
        throw new Error(
          response?.message || response?.errorResponse?.error || 'Failed to retrieve donor demographics'
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }

  updateDemographics(
    donorId: string,
    data: UpdateDonorDemographicsDto
  ): Observable<ReturnResult<void>> {
    if (!donorId || !donorId.trim()) {
      return throwError(() => new Error('Donor ID is required'));
    }

    const cleanDonorId = donorId.trim();
    const url = `${environment.apiUrl}${API.DONOR_DEMOGRAPHICS.UPDATE(cleanDonorId)}`;

    return this.http.put<ReturnResult<void>>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  getLanguages(): Observable<MasterCodeOption[]> {
    const url = `${environment.apiUrl}${API.LOOKUPS.BY_CODE_TYPE('LANG')}`;
    return this.http.get<any>(url, { params: { activeOnly: 'true' } }).pipe(
      map(response => (response?.data || []).map((item: any) => ({
        code: item.code,
        description: item.description,
        active: item.isActive
      }))),
      catchError(() => {
        return this.lookupService.getByCodeType('LANG').pipe(
          map(items => items.map(i => ({ code: i.code, description: i.description, active: true })))
        );
      })
    );
  }

  getEthnicities(): Observable<MasterCodeOption[]> {
    const url = `${environment.apiUrl}${API.LOOKUPS.BY_CODE_TYPE('ETHGP')}`;
    return this.http.get<any>(url, { params: { activeOnly: 'true' } }).pipe(
      map(response => (response?.data || []).map((item: any) => ({
        code: item.code,
        description: item.description,
        active: item.isActive
      }))),
      catchError(() => {
        return this.lookupService.getByCodeType('ETHGP').pipe(
          map(items => items.map(i => ({ code: i.code, description: i.description, active: true })))
        );
      })
    );
  }

  getSalutations(): Observable<MasterCodeOption[]> {
    const url = `${environment.apiUrl}${API.LOOKUPS.BY_CODE_TYPE('SALUT')}`;
    return this.http.get<any>(url, { params: { activeOnly: 'false' } }).pipe(
      map(response => (response?.data || []).map((item: any) => ({
        code: item.code,
        description: item.description,
        active: item.isActive
      }))),
      catchError(() => {
        return this.lookupService.getByCodeType('SALUT').pipe(
          map(items => items.map(i => ({ code: i.code, description: i.description, active: true })))
        );
      })
    );
  }

  getHeights(): Observable<MasterCodeOption[]> {
    const url = `${environment.apiUrl}${API.LOOKUPS.BY_CODE_TYPE('HGHT')}`;
    return this.http.get<any>(url, { params: { activeOnly: 'true' } }).pipe(
      map(response => (response?.data || []).map((item: any) => ({
        code: item.code,
        description: item.description,
        active: item.isActive
      }))),
      catchError(() => of([]))
    );
  }

  getCityStateByCity(city: string): Observable<CityStateResult[]> {
    const url = `${environment.apiUrl}${API.DONOR_DEMOGRAPHICS.CITY_STATE}`;
    return this.http.get<any>(url, { params: { city } }).pipe(
      map(response => response?.data || []),
      catchError(this.handleError)
    );
  }

  getCityStateByZip(zip: string): Observable<CityStateResult[]> {
    const url = `${environment.apiUrl}${API.DONOR_DEMOGRAPHICS.CITY_STATE}`;
    return this.http.get<any>(url, { params: { zip } }).pipe(
      map(response => response?.data || []),
      catchError(this.handleError)
    );
  }

  searchEmployers(request: EmployerSearchRequest, take = 100, skip = 0): Observable<{ data: EmployerResult[]; total: number }> {
    const url = `${environment.apiUrl}${API.DONOR_EMPLOYER.SEARCH(take, skip)}`;
    return this.http.post<any>(url, {
      searchName: request.searchName,
      searchType: request.searchType,
      sortColumn: request.sortColumn || 'employerName',
      sortDirection: request.sortDirection || 'A'
    }).pipe(
      map(response => ({
        data: response?.data || [],
        total: response?.total || 0
      })),
      catchError(this.handleError)
    );
  }

  validateAreaCode(areaCode: string): Observable<boolean> {
    const url = `${environment.apiUrl}${API.LOOKUPS.VALIDATE('AREAC', areaCode)}`;
    return this.http.get<any>(url).pipe(
      map(response => response?.success === true),
      catchError(() => of(false))
    );
  }

  private handleError(error: HttpErrorResponse | any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error instanceof HttpErrorResponse) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'Donor not found';
      } else if (error.status === 400) {
        errorMessage = error.error?.errorResponse?.error || error.error?.error || 'Validation failed';
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred';
      } else if (error.status === 0) {
        errorMessage = 'Network error - unable to reach server';
      } else {
        errorMessage = `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
