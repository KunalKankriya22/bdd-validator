import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidateRequest,
  ValidateResponse,
  TransferRequest,
  TransferResponse,
} from '../models/link-test-results.model';

@Injectable({ providedIn: 'root' })
export class LinkTestResultsApiService {
  private readonly apiService = inject(ApiService);

  validate(request: ValidateRequest): Observable<ValidateResponse> {
    return this.apiService
      .post<ValidateResponse>(API.LINK_TEST_RESULTS.VALIDATE, request)
      .pipe(catchError((error) => throwError(() => error)));
  }

  transfer(request: TransferRequest): Observable<TransferResponse> {
    return this.apiService
      .post<TransferResponse>(API.LINK_TEST_RESULTS.TRANSFER, request)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
