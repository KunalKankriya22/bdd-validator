import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnitDetailsResponse,
  VoidInterfaceRequest,
  VoidInterfaceResponse,
} from '../models/void-donor-interface.model';

@Injectable({
  providedIn: 'root',
})
export class VoidDonorInterfaceApiService {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  /**
   * Get unit details by unit ID
   * @param unitId - Unit identifier
   * @returns Observable of unit details response
   */
  getUnitDetails(unitId: string): Observable<UnitDetailsResponse> {
    return this.apiService
      .get<UnitDetailsResponse>(API.VOID_DONOR_INTERFACE.GET_UNIT_DETAILS(unitId))
      .pipe(
        catchError((error) => {
          this.loggingService.error('getUnitDetails failed', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Void donor interface data
   * Deletes test results and interdictions in a transaction
   * @param request - Unit ID, collection date, and confirmation
   * @returns Observable of void operation response
   */
  voidInterface(request: VoidInterfaceRequest): Observable<VoidInterfaceResponse> {
    return this.apiService
      .post<VoidInterfaceResponse>(API.VOID_DONOR_INTERFACE.VOID, request)
      .pipe(
        catchError((error) => {
          this.loggingService.error('voidInterface failed', error);
          return throwError(() => error);
        })
      );
  }

}

