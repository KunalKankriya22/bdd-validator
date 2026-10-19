import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProcessCodeDto,
  UnitDetailsDto,
  ComponentEligibilityDto,
  VerifyComponentSuitabilityRequest,
  VerifyComponentSuitabilityResponse,
  VerifyComponentSuitabilityApiResponse,
} from '../models/verify-component-suitability-offline.model';

@Injectable({
  providedIn: 'root',
})
export class VerifyComponentSuitabilityOfflineService {
  private readonly apiService = inject(ApiService);

  getProcessCodes(): Observable<ProcessCodeDto[]> {
    return this.apiService
      .get<VerifyComponentSuitabilityApiResponse<ProcessCodeDto[]>>(
        API.VERIFY_COMPONENT_SUITABILITY_OFFLINE.PROCESS_CODES,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching process codes:', error);
          return throwError(() => error);
        }),
      );
  }

  getUnitDetails(unitId: string): Observable<UnitDetailsDto> {
    return this.apiService
      .get<VerifyComponentSuitabilityApiResponse<UnitDetailsDto>>(
        API.VERIFY_COMPONENT_SUITABILITY_OFFLINE.UNIT_DETAILS(unitId),
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching unit details:', error);
          return throwError(() => error);
        }),
      );
  }

  getEligibleComponents(unitId: string, processCode?: string): Observable<ComponentEligibilityDto[]> {
    return this.apiService
      .get<VerifyComponentSuitabilityApiResponse<ComponentEligibilityDto[]>>(
        API.VERIFY_COMPONENT_SUITABILITY_OFFLINE.ELIGIBLE_COMPONENTS(unitId, processCode),
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching eligible components:', error);
          return throwError(() => error);
        }),
      );
  }

  verify(
    request: VerifyComponentSuitabilityRequest,
  ): Observable<VerifyComponentSuitabilityResponse> {
    return this.apiService
      .post<VerifyComponentSuitabilityApiResponse<VerifyComponentSuitabilityResponse>>(
        API.VERIFY_COMPONENT_SUITABILITY_OFFLINE.VERIFY,
        request,
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error verifying component suitability:', error);
          return throwError(() => error);
        }),
      );
  }
}
