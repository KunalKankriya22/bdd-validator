import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';

import {
  ReInterfaceDonorToLabUnit,
  ReInterfaceDonorToLabExecuteRequest,
  ReInterfaceDonorToLabResponse
} from '../models/re-interface-donor-to-lab.model';

@Injectable({
  providedIn: 'root'
})
export class ReInterfaceDonorToLabApiService {
  private readonly apiService = inject(ApiService);

  getUnitData(unitId: string): Observable<ReInterfaceDonorToLabUnit> {
    const endpoint = API.APPLICATION_ADMIN.RE_INTERFACE_DONOR_TO_LAB(unitId);

    return this.apiService.get<ReInterfaceDonorToLabResponse>(
      endpoint,
      {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      }
    ).pipe(
      switchMap(response => {
        if (response.success && response.item) {
          return of(response.item);
        }
        if (response.success && response.data?.length) {
          return of(response.data[0]);
        }
        return throwError(() => ({
          error: {
            message: response.message || 'Unit not found or cannot be re-interfaced',
            errorResponse: response.errorResponse
          }
        }));
      })
    );
  }

  executeReInterface(request: ReInterfaceDonorToLabExecuteRequest): Observable<ReInterfaceDonorToLabResponse> {
    const endpoint = API.APPLICATION_ADMIN.RE_INTERFACE_DONOR_TO_LAB_EXECUTE;

    return this.apiService.post<ReInterfaceDonorToLabResponse>(endpoint, request);
  }
}
