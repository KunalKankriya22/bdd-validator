import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  WorksheetInfoDto,
  PendingUnitDto,
  UnitTestDto,
  SubmitResultsRequestDto,
  SubmitResultsResponseDto,
  CloseWorksheetResponseDto,
  ValidResultDto,
  WorksheetOptionDto,
  PendingCountDto,
} from '../models/antigen-result-entry.model';

@Injectable({
  providedIn: 'root',
})
export class AntigenResultEntryService {
  private readonly http = inject(HttpClient);

  validateWorksheet(tbId: string): Observable<WorksheetInfoDto> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.VALIDATE_WORKSHEET(tbId)}`;
    return this.http
      .get<ApiResponse<WorksheetInfoDto>>(url)
      .pipe(map((response) => response.data!));
  }

  getPendingUnits(tbId: string): Observable<PendingUnitDto[]> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.PENDING_UNITS(tbId)}`;
    return this.http
      .get<ApiResponse<PendingUnitDto[]>>(url)
      .pipe(map((response) => response.data!));
  }

  getUnitTests(tbId: string, unitId: string): Observable<UnitTestDto[]> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.UNIT_TESTS(tbId, unitId)}`;
    return this.http
      .get<ApiResponse<UnitTestDto[]>>(url)
      .pipe(map((response) => response.data!));
  }

  getValidResults(testId: number | string): Observable<ValidResultDto[]> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.VALID_RESULTS(testId)}`;
    return this.http
      .get<any>(url)
      .pipe(map((response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      }));
  }

  submitResults(request: SubmitResultsRequestDto): Observable<SubmitResultsResponseDto> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.SUBMIT_RESULTS}`;
    return this.http
      .post<ApiResponse<SubmitResultsResponseDto>>(url, request)
      .pipe(map((response) => response.data!));
  }

  closeWorksheet(tbId: string): Observable<CloseWorksheetResponseDto> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.CLOSE_WORKSHEET(tbId)}`;
    return this.http
      .post<ApiResponse<CloseWorksheetResponseDto>>(url, {})
      .pipe(map((response) => response.data!));
  }

  getWorksheets(): Observable<WorksheetOptionDto[]> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.WORKSHEETS}`;
    return this.http
      .get<ApiResponse<WorksheetOptionDto[]>>(url)
      .pipe(map((response) => response.data!));
  }

  getPendingCount(tbId: string): Observable<PendingCountDto> {
    const url = `${environment.apiUrl}${API.ANTIGEN_RESULT_ENTRY.PENDING_COUNT(tbId)}`;
    return this.http
      .get<ApiResponse<PendingCountDto>>(url)
      .pipe(map((response) => response.data!));
  }
}
