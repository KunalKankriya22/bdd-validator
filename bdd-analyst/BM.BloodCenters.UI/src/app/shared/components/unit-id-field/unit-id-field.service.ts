import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { UnitValidationApiResponse } from './unit-id-field.model';

@Injectable({ providedIn: 'root' })
export class UnitIdFieldService {
  private apiService = inject(ApiService);

  validateUnitId(unitId: string, validateFfValue: string): Observable<UnitValidationApiResponse> {
    return this.apiService.post<UnitValidationApiResponse>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
      { unitId, validateFfValue },
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
