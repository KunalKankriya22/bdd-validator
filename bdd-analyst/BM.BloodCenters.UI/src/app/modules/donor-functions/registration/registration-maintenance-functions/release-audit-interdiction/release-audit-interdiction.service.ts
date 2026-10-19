import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchRequest,
  SearchResponse,
  ReleaseRequest,
  ReleaseResponse,
  SearchResponseData,
  RemoveRequest,
  RemovalReason,
  RemovalReasonsResponse,
  Interdiction,
  TerminatedInterdictionsResponse
} from './release-audit-interdiction.models';

@Injectable({ providedIn: 'root' })
export class ReleaseAuditInterdictionService {
  private readonly apiService = inject(ApiService);

  search(request: SearchRequest): Observable<SearchResponseData> {
    let params = new HttpParams().set('option', request.option);

    if (request.unitId) {
      params = params.set('unitId', request.unitId);
    }
    if (request.deferralId) {
      params = params.set('deferralId', request.deferralId);
    }
    if (request.collDate) {
      params = params.set('collDate', request.collDate);
    }
    return this.apiService
      .get<SearchResponse>(API.RELEASE_AUDIT_INTERDICTIONS.SEARCH, { params })
      .pipe(
        map(res => {
          if (res.success && res.item) {
            return res.item;
          }
          // eslint-disable-next-line no-throw-literal
          throw {
            error: {
              errorCode: res.errorCode,
              errorResponse: res.errorResponse,
              message: res.message || res.errorResponse?.error || 'Failed to search'
            }
          };
        }),
        catchError(error => throwError(() => error))
      );
  }

  release(request: ReleaseRequest): Observable<ReleaseResponse> {
    return this.apiService
      .put<ReleaseResponse>(API.RELEASE_AUDIT_INTERDICTIONS.RELEASE, request)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }

  getTerminatedInterdictions(transactionId: string): Observable<Interdiction[]> {
    const params = new HttpParams().set('transactionId', transactionId);
    return this.apiService
      .get<TerminatedInterdictionsResponse>(API.RELEASE_AUDIT_INTERDICTIONS.TERMINATED, { params })
      .pipe(
        map(res => {
          if (res.success && res.item) {
            return res.item;
          }
          throw { error: { errorCode: res.errorCode, message: 'Failed to fetch terminated interdictions' } };
        }),
        catchError(error => throwError(() => error))
      );
  }

  getRemovalReasons(): Observable<RemovalReason[]> {
    return this.apiService
      .get<RemovalReasonsResponse>(API.RELEASE_AUDIT_INTERDICTIONS.REMOVAL_REASONS)
      .pipe(
        map(res => {
          if (res.success && res.item) {
            return res.item;
          }
          throw { error: { errorCode: res.errorCode, message: 'Failed to fetch removal reasons' } };
        }),
        catchError(error => throwError(() => error))
      );
  }

  remove(request: RemoveRequest): Observable<ReleaseResponse> {
    return this.apiService
      .put<ReleaseResponse>(API.RELEASE_AUDIT_INTERDICTIONS.REMOVE, request)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }
}
