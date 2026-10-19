import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReturnResult,
  RetrieveRequest,
  RetrieveResponse,
  RollbackRequest,
  CollectionDateInfo
} from '../models/rollback-donation-audit.model';

@Injectable({ providedIn: 'root' })
export class RollbackDonationAuditService {
  private readonly apiService = inject(ApiService);

  retrieve(request: RetrieveRequest): Observable<ReturnResult<RetrieveResponse>> {
    return this.apiService.post<ReturnResult<RetrieveResponse>>(
      API.ROLLBACK_DONATION_AUDIT.RETRIEVE,
      request
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  rollback(request: RollbackRequest): Observable<ReturnResult<boolean>> {
    return this.apiService.post<ReturnResult<boolean>>(
      API.ROLLBACK_DONATION_AUDIT.ROLLBACK,
      request
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getCollectionDates(unitId: string): Observable<ReturnResult<CollectionDateInfo[]>> {
    return this.apiService.get<ReturnResult<CollectionDateInfo[]>>(
      API.ROLLBACK_DONATION_AUDIT.GET_COLLECTION_DATES(unitId)
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
