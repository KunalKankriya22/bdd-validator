import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { API } from '../../../../core/constants/api.constants';
import { ApiService } from '../../../../shared/services/api.service';
import {
  ValidTestParmDto,
  CreateValidTestParmRequestDto,
  UpdateValidTestParmRequestDto,
  ValidTestParmQueryDto,
  ApiResponse,
  DatatypeLookup,
  VoidCodeLookup,
  RelatedCodeLookup
} from '../models/tparm.model';

@Injectable({
  providedIn: 'root'
})
export class TparmApiService {
  private readonly apiService = inject(ApiService);

  getAll(
    take: number = 50,
    skip: number = 0,
    query?: ValidTestParmQueryDto
  ): Observable<{ data: ValidTestParmDto[]; totalCount: number }> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.SEARCH(take, skip);
    const body = query || {};
    return this.apiService.post<ApiResponse<ValidTestParmDto[]>>(endpoint, body).pipe(
      map(response => ({
        data: response.data,
        totalCount: response.totalCount ?? 0
      })),
      catchError(error => {
        console.error('Error fetching parameters:', error);
        return throwError(() => error);
      })
    );
  }

  getById(parmCode: string): Observable<ValidTestParmDto> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.GET_BY_ID(parmCode);
    return this.apiService.get<ApiResponse<ValidTestParmDto>>(endpoint).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching parameter:', error);
        return throwError(() => error);
      })
    );
  }

  create(request: CreateValidTestParmRequestDto): Observable<{ parmCode: string }> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.CREATE;
    return this.apiService.post<ApiResponse<{ parmCode: string }>>(endpoint, request).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error creating parameter:', error);
        return throwError(() => error);
      })
    );
  }

  update(parmCode: string, request: UpdateValidTestParmRequestDto): Observable<void> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.UPDATE(parmCode);
    return this.apiService.put<ApiResponse<void>>(endpoint, request).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating parameter:', error);
        return throwError(() => error);
      })
    );
  }

  delete(parmCode: string): Observable<void> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.DELETE(parmCode);
    return this.apiService.delete<ApiResponse<void>>(endpoint).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting parameter:', error);
        return throwError(() => error);
      })
    );
  }

  getDatatypes(): Observable<DatatypeLookup[]> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.LOOKUP_DATATYPES;
    return this.apiService.get<any>(endpoint).pipe(
      map(response => this.extractArray<DatatypeLookup>(response)),
      catchError(error => {
        console.error('Error fetching datatypes:', error);
        return throwError(() => error);
      })
    );
  }

  getVoidCodes(): Observable<VoidCodeLookup[]> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.LOOKUP_VOID_CODES;
    return this.apiService.get<any>(endpoint).pipe(
      map(response => this.extractArray<VoidCodeLookup>(response)),
      catchError(error => {
        console.error('Error fetching void codes:', error);
        return throwError(() => error);
      })
    );
  }

  getRelatedCodes(datatype: string, excludeParmCode?: string, searchText?: string): Observable<RelatedCodeLookup[]> {
    const endpoint = API.VALID_TEST_STAGING_PARAMETERS.LOOKUP_RELATED_CODES;
    let options: { params?: HttpParams } | undefined;
    let params = new HttpParams().set('datatype', datatype);
    if (excludeParmCode) {
      params = params.set('excludeParmCode', excludeParmCode);
    }
    if (searchText) {
      params = params.set('searchText', searchText);
    }
    options = { params };
    return this.apiService.get<any>(endpoint, options).pipe(
      map(response => this.extractArray<RelatedCodeLookup>(response)),
      catchError(error => {
        console.error('Error fetching related codes:', error);
        return throwError(() => error);
      })
    );
  }

  private extractArray<T>(response: any): T[] {
    if (Array.isArray(response)) return response as T[];
    return (response?.data ?? response?.item ?? []) as T[];
  }
}
