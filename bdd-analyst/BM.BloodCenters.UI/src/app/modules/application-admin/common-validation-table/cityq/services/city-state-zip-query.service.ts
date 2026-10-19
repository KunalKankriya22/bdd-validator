import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ValidCityStateDto,
  CreateValidCityStateDto,
  UpdateValidCityStateDto,
  ValidCityStateQueryDto,
  StateDto,
  CityDto,
  CountyDto,
  ApiResponse,
  CityStateZipQueryParams
} from '../models/city-state-zip-query.model';

/**
 * Service for City, State, and Zip Query API operations
 * Base URL: /api/v1/valid-city-state
 */
@Injectable({
  providedIn: 'root'
})
export class CityStateZipQueryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_BASE}`;

  /**
   * Query city/state/zip records with pagination, filtering, and sorting
   * POST /valid-city-state/{take}/{skip}
   */
  query(
    take: number,
    skip: number,
    filters: CityStateZipQueryParams
  ): Observable<{ data: ValidCityStateDto[]; totalRecords: number }> {
    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_QUERY(take, skip);
    const fullUrl = `${environment.apiUrl}${url}`;

    const payload: ValidCityStateQueryDto = {
      state: filters.state || undefined,
      city: filters.city || undefined,
      zip: filters.zip || undefined,
      county: filters.county || undefined,
      commonlyUsedFlag: filters.commonlyUsedFlag || undefined,
      searchKeyword: filters.searchKeyword || undefined,
      sortColumn: filters.sortColumn || undefined,
      sortOrder: filters.sortOrder || undefined
    };

    return this.http.post<ApiResponse<ValidCityStateDto[]>>(fullUrl, payload).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || response.totalRecords || 0
      }))
    );
  }

  /**
   * Get a single city/state/zip record by ID
   * GET /valid-city-state/{uspsId}
   */
  getById(uspsId: number): Observable<ValidCityStateDto> {
    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_GET_BY_ID(uspsId);
    const fullUrl = `${environment.apiUrl}${url}`;

    return this.http.get<ApiResponse<ValidCityStateDto>>(fullUrl).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create a new city/state/zip record
   * POST /valid-city-state
   */
  create(dto: CreateValidCityStateDto): Observable<ValidCityStateDto> {
    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_CREATE;
    const fullUrl = `${environment.apiUrl}${url}`;

    return this.http.post<ApiResponse<ValidCityStateDto>>(fullUrl, dto).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update an existing city/state/zip record
   * PUT /valid-city-state/{uspsId}
   */
  update(uspsId: number, dto: UpdateValidCityStateDto): Observable<ValidCityStateDto> {
    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_UPDATE(uspsId);
    const fullUrl = `${environment.apiUrl}${url}`;

    return this.http.put<ApiResponse<ValidCityStateDto>>(fullUrl, dto).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get list of states for dropdown
   * GET /valid-city-state/states
   */
  getStates(): Observable<StateDto[]> {
    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_STATES;
    const fullUrl = `${environment.apiUrl}${url}`;

    return this.http.get<ApiResponse<StateDto[]>>(fullUrl).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get list of cities for a given state
   * GET /valid-city-state/cities?state={state}
   */
  getCities(state: string): Observable<CityDto[]> {
    if (!state) {
      throw new Error('State is required to fetch cities');
    }

    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_CITIES(state);
    const fullUrl = `${environment.apiUrl}${url}`;

    return this.http.get<ApiResponse<CityDto[]>>(fullUrl).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get list of counties for a given state
   * GET /valid-city-state/counties?state={state}
   */
  getCounties(state: string, city: string): Observable<CountyDto[]> {
    if (!state) {
      throw new Error('State is required to fetch counties');
    }
    if (!city) {
      throw new Error('City is required to fetch counties');
    }

    const url = API.APPLICATION_ADMIN.VALID_CITY_STATE_COUNTIES(state, city);
    const fullUrl = `${environment.apiUrl}${url}`;

    return this.http.get<ApiResponse<CountyDto[]>>(fullUrl).pipe(
      map(response => response.data || [])
    );
  }
}
