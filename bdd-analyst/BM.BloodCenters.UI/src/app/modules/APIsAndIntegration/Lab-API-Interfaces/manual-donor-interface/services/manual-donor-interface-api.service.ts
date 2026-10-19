import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  TestResultOption,
  ManualDonorInterfaceSubmitDto,
  ManualDonorInterfaceResponseDto,
  TestResultsResponseDto,
  TestResultCodeDto,
  UnitDetailsDto,
  UnitDetailsApiResponse
} from '../models/manual-donor-interface.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ManualDonorInterfaceApiService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get test results dropdown values
   * GET /api/v1/manual-donor-interface/abo-results
   * @returns Observable with test result options
   */
  getTestResults(): Observable<TestResultOption[]> {
    const endpoint = API.APPLICATION_ADMIN.MANUAL_DONOR_INTERFACE_TEST_RESULTS;

    return this.apiService.get<TestResultsResponseDto>(endpoint).pipe(
      map(response => {
        const testResults = response?.data || [];
        return testResults.map((item: TestResultCodeDto) => ({
          code: item.priorAbo,
          description: item.description
        }));
      }),
      catchError(error => {
        console.error('Error fetching test results:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get unit details (COLL_DATE) after unit scan
   * GET /api/v1/manual-donor-interface/unit-details?unitId={unitId}
   */
  getUnitDetails(unitId: string): Observable<UnitDetailsDto | null> {
    const endpoint = `${API.APPLICATION_ADMIN.MANUAL_DONOR_INTERFACE_UNIT_DETAILS}?unitId=${encodeURIComponent(unitId)}`;
    return this.apiService.get<UnitDetailsApiResponse>(endpoint).pipe(
      map(response => (response?.success ? response.item : null) ?? null),
      catchError(error => {
        console.error('Error fetching unit details:', error);
        return of(null);
      })
    );
  }

  /**
   * Submit manual donor interface form
   * POST /api/v1/manual-donor-interface/process
   * @param unitId - Unit identifier
   * @param donorVerified - Was donor verified in donor system (yes/no)
   * @param hasAssertion - Does unit have a permanent assertion (yes/no)
   * @param priorTestResult - Selected prior ABO/Rh test result code
   * @returns Observable with response message
   */
  submitManualDonorInterface(
    unitId: string,
    donorVerified: string,
    hasAssertion: string,
    priorTestResult: string
  ): Observable<ManualDonorInterfaceResponseDto> {
    const chapterId = this.headerService.chapterId() ?? '';
    const endpoint = API.APPLICATION_ADMIN.MANUAL_DONOR_INTERFACE_SUBMIT;

    const payload: ManualDonorInterfaceSubmitDto = {
      unitId: unitId.trimEnd(),
      chapterId: chapterId,
      donorChecked: donorVerified === 'yes' ? 'Y' : 'N',
      permanentAssertion: hasAssertion === 'yes' ? 'Y' : 'N',
      priorAbo: priorTestResult
    };

    return this.apiService.post<ManualDonorInterfaceResponseDto>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error submitting manual donor interface:', error);
        return throwError(() => error);
      })
    );
  }

}
