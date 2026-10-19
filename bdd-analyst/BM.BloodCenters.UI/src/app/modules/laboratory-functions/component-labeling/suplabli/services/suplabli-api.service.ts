import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  AbandonedLabelRequest,
  ApiResponse,
  ChapterConfigResponse,
  ConfirmVerificationRequest,
  LovOption,
  PrinterConfigResponse,
  ProcessLabelRequest,
  ProcessLabelResponse,
  ReprintRequest,
  ValidateUnitRequest,
  ValidateUnitResponse,
} from '../models/suplabli.model';

@Injectable({ providedIn: 'root' })
export class SuplabliApiService {
  private readonly http = inject(HttpClient);
  private readonly api = API.ABO_LABELING_ISBT_SUPER;

  getPrinterConfig(): Observable<ApiResponse<PrinterConfigResponse>> {
    return this.http.get<ApiResponse<PrinterConfigResponse>>(this.api.PRINTER_CONFIG);
  }

  validateAccess(): Observable<ApiResponse<ChapterConfigResponse>> {
    return this.http.get<ApiResponse<ChapterConfigResponse>>(this.api.VALIDATE_ACCESS);
  }

  validateUnit(request: ValidateUnitRequest): Observable<ApiResponse<ValidateUnitResponse>> {
    return this.http.post<ApiResponse<ValidateUnitResponse>>(this.api.VALIDATE_UNIT, request);
  }

  processLabel(request: ProcessLabelRequest): Observable<ApiResponse<ProcessLabelResponse>> {
    return this.http.post<ApiResponse<ProcessLabelResponse>>(this.api.PROCESS_LABEL, request);
  }

  confirmVerification(request: ConfirmVerificationRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(this.api.CONFIRM_VERIFICATION, request);
  }

  reprint(request: ReprintRequest): Observable<ApiResponse<ProcessLabelResponse>> {
    return this.http.post<ApiResponse<ProcessLabelResponse>>(this.api.REPRINT, request);
  }

  getLovAboValues(codeScheme?: string): Observable<ApiResponse<LovOption[]>> {
    const params = codeScheme ? `?codeScheme=${encodeURIComponent(codeScheme)}` : '';
    return this.http.get<ApiResponse<LovOption[]>>(`${this.api.LOV_ABO_VALUES}${params}`);
  }

  getLovSpecialTestCodes(): Observable<ApiResponse<LovOption[]>> {
    return this.http.get<ApiResponse<LovOption[]>>(this.api.LOV_SPECIAL_TEST_CODES);
  }

  logAbandonedLabel(request: AbandonedLabelRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(this.api.LOG_ABANDONED, request);
  }
}
