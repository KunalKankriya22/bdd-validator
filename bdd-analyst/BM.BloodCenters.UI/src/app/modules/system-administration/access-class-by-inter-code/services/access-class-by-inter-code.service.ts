import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AccessClass,
  AccessClassSearchParams,
  AccessClassResponse,
  AccessClassUsersResponse,
  AccessClassInterdictionsResponse,
  InterdictionCodeLov
} from '../models/access-class-by-inter-code.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AccessClassByInterCodeService {
  private readonly apiService = inject(ApiService);

  getAccessClassesByInterCode(
    params: AccessClassSearchParams
  ): Observable<{ data: AccessClass[]; totalRecords: number; message: string }> {
    const endpoint = API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE;

    let httpParams = new HttpParams();
    if (params.interCode) {
      httpParams = httpParams.set('interCode', params.interCode);
    }
    if (params.sortOrder) {
      httpParams = httpParams.set('sortDir', params.sortOrder);
    }

    return this.apiService.get<AccessClassResponse>(endpoint, { params: httpParams }).pipe(
      map(response => ({
        data: (response.data || []).map(item => ({
          ...item,
          insDate: item.insDate ? item.insDate.toUpperCase() : item.insDate
        })),
        totalRecords: response.total || 0,
        message: response.message
      })),
      catchError(error => throwError(() => error))
    );
  }

  getAttachedUsers(
    accessClass: string,
    sortDir: string = 'ASC'
  ): Observable<AccessClassUsersResponse> {
    const endpoint = API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE_USERS(accessClass);

    let httpParams = new HttpParams()
      .set('sortDir', sortDir);

    return this.apiService.get<AccessClassUsersResponse>(endpoint, { params: httpParams }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getInterdictions(
    accessClass: string,
    sortDir: string = 'ASC'
  ): Observable<AccessClassInterdictionsResponse> {
    const endpoint = API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE_INTERDICTIONS(accessClass);

    let httpParams = new HttpParams()
      .set('sortDir', sortDir);

    return this.apiService.get<AccessClassInterdictionsResponse>(endpoint, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        data: (response.data || []).map(item => ({
          ...item,
          insertDate: item.insertDate ? item.insertDate.toUpperCase() : item.insertDate
        }))
      })),
      catchError(error => throwError(() => error))
    );
  }

  getInterdictionCodesLov(): Observable<InterdictionCodeLov[]> {
    const endpoint = API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE_LOV_INTERDICTION_CODES;

    return this.apiService.get<{ data: InterdictionCodeLov[] }>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }
}
