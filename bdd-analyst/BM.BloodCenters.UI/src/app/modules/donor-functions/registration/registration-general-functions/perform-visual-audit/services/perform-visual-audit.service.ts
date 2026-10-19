import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  SearchUnitRequest,
  SearchUnitResponse,
  SaveAuditRequest,
  ResetAuditRequest,
  ResetOption,
  ReturnResult
} from '../models/perform-visual-audit.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';

export interface UnitValidationRequest {
  unitId: string;
  validateFfValue: string;
}

export interface UnitValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  parsedUnitId?: string;
  checkDigit?: string;
  codeScheme?: string;
  manualUnitId?: string;
  codabarUnitScheme?: string;
  entryMode?: string;  // "S" (scan) or "M" (manual)
  barcodeType?: string;  // "CODE128" or "CODABAR"
  chapterScheme?: string;
}

// Validation constants
const VALIDATE_FF_VALUE_DONOR = 'DONOR';

interface SearchApiResponse {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: SearchUnitResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class PerformVisualAuditService {
  private readonly apiService = inject(ApiService);

  searchByUnitId(request: SearchUnitRequest): Observable<SearchUnitResponse> {
    return this.apiService
      .post<SearchApiResponse>(API.VISUAL_AUDIT.SEARCH, request)
      .pipe(
        map(res => {
          if (res.success && res.data && res.data.length > 0) return res.data[0];
          throw new Error(res.message || 'No data found');
        })
      );
  }

  saveAudit(request: SaveAuditRequest): Observable<ReturnResult<void>> {
    return this.apiService.post<ReturnResult<void>>(API.VISUAL_AUDIT.SAVE, request);
  }

  resetAudit(request: ResetAuditRequest): Observable<ReturnResult<void>> {
    return this.apiService.post<ReturnResult<void>>(API.VISUAL_AUDIT.RESET, request);
  }

  getResetOptions(): Observable<ResetOption[]> {
    return this.apiService
      .get<ReturnResult<ResetOption[]>>(API.VISUAL_AUDIT.RESET_OPTIONS)
      .pipe(
        map(res => (res.success && res.data ? res.data as ResetOption[] : []))
      );
  }

  validateUnitId(unitId: string): Observable<UnitValidationResult> {
    const request: UnitValidationRequest = {
      unitId,
      validateFfValue: VALIDATE_FF_VALUE_DONOR
    };
    return this.apiService
      .post<ReturnResult<UnitValidationResult>>(API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT, request)
      .pipe(
        map(res => {
          // Backend sends single validation result in 'item' property
          if (res.success && (res.item || res.data)) {
            return res.item || res.data!;
          }
          // If not successful, throw error with backend error message (structured for component error handling)
          const err = {
            error: {
              errorCode: res.errorCode,
              message: res.error || res.message
            }
          };
          throw err;
        })
      );
  }
}
