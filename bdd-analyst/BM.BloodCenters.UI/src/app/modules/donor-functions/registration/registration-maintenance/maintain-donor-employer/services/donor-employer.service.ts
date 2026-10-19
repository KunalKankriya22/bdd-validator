import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { API } from '../../../../../../core/constants/api.constants';
import { ApiService } from '../../../../../../shared/services/api.service';
import {
  DonorEmployer,
  DonorEmployerSearchRequest,
  DonorEmployerSearchResponse,
  CreateDonorEmployerRequest,
  UpdateDonorEmployerRequest,
  StateOption,
  CountryOption,
  AutocompleteOption,
  CityState
} from '../models/donor-employer.model';

interface ApiResponse<T> {
  data: T;
  item?: T;
  message?: string;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class DonorEmployerService {
  private apiService = inject(ApiService);

  search(
    take: number,
    skip: number,
    request: DonorEmployerSearchRequest
  ): Observable<DonorEmployerSearchResponse> {
    return this.apiService.post<ApiResponse<DonorEmployer[]>>(
      API.DONOR_EMPLOYER.SEARCH(take, skip), request
    ).pipe(
      map((response) => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError((error) => {
        console.error('DonorEmployerService.search failed:', error);
        return throwError(() => error);
      })
    );
  }

  getById(employerId: string): Observable<DonorEmployer> {
    return this.apiService.get<ApiResponse<DonorEmployer> & { item?: DonorEmployer }>(
      API.DONOR_EMPLOYER.GET_BY_ID(employerId)
    ).pipe(
      map((response) => response.item || response.data),
      catchError((error) => {
        console.error('DonorEmployerService.getById failed:', error);
        return throwError(() => error);
      })
    );
  }

  create(request: CreateDonorEmployerRequest): Observable<ApiResponse<DonorEmployer>> {
    return this.apiService.post<ApiResponse<DonorEmployer>>(
      API.DONOR_EMPLOYER.CREATE, request
    ).pipe(
      catchError((error) => {
        console.error('DonorEmployerService.create failed:', error);
        return throwError(() => error);
      })
    );
  }

  update(request: UpdateDonorEmployerRequest): Observable<ApiResponse<DonorEmployer>> {
    return this.apiService.put<ApiResponse<DonorEmployer>>(
      API.DONOR_EMPLOYER.UPDATE, request
    ).pipe(
      catchError((error) => {
        console.error('DonorEmployerService.update failed:', error);
        return throwError(() => error);
      })
    );
  }

  getAutocomplete(searchType: string, searchName: string): Observable<AutocompleteOption[]> {
    return this.apiService.post<ApiResponse<DonorEmployer[]>>(
      API.DONOR_EMPLOYER.AUTOCOMPLETE, { SearchType: searchType, SearchName: searchName }
    ).pipe(
      map((response) => {
        const data = response.data || [];
        return data.map(employer => ({
          employerId: employer.employerId,
          employerName: employer.employerName
        }));
      }),
      catchError((error) => {
        console.error('DonorEmployerService.getAutocomplete failed:', error);
        return throwError(() => error);
      })
    );
  }

  getStates(): Observable<StateOption[]> {
    return this.apiService.get<StateOption[]>(API.CHAPTER.STATES_LOOKUP).pipe(
      catchError((error) => {
        console.error('DonorEmployerService.getStates failed:', error);
        return throwError(() => error);
      })
    );
  }

  getCountries(): Observable<CountryOption[]> {
    return this.apiService.get<CountryOption[]>(API.CHAPTER.COUNTRIES_LOOKUP).pipe(
      catchError((error) => {
        console.error('DonorEmployerService.getCountries failed:', error);
        return throwError(() => error);
      })
    );
  }

  getCityStateByZip(zipCode: string): Observable<CityState | null> {
    return this.apiService.get<ApiResponse<CityState>>(
      API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.CITY_STATE_BY_ZIP(zipCode)
    ).pipe(
      map((response) => response.data || null),
      catchError(() => of(null))
    );
  }

  searchCities(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<ApiResponse<unknown>>(
      API.DONOR_EMPLOYER.LOOKUPS.CITIES
    ).pipe(
      map((response) => this.extractLookupItems(response.data)),
      catchError(() => of([]))
    );
  }

  getZipsByCity(city: string): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<ApiResponse<unknown>>(
      API.DONOR_EMPLOYER.LOOKUPS.ZIPS(city)
    ).pipe(
      map((response) => this.extractLookupItems(response.data)),
      catchError(() => of([]))
    );
  }

  private extractLookupItems(data: unknown): { code: string; description: string }[] {
    if (!data || typeof data !== 'object') return [];

    if (Array.isArray(data)) {
      return data.map((item: LookupItemRaw) => ({
        code: item?.code || '',
        description: item?.description || ''
      }));
    }

    const typedData = data as Record<string, unknown>;
    if (typedData['$values'] && Array.isArray(typedData['$values'])) {
      return (typedData['$values'] as LookupItemRaw[]).map((item: LookupItemRaw) => ({
        code: item?.code || '',
        description: item?.description || ''
      }));
    }

    return [];
  }
}

interface LookupItemRaw {
  code?: string;
  description?: string;
}
