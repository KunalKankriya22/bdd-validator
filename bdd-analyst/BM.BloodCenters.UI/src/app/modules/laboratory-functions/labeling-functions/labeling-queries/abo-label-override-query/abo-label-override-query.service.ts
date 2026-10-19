import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { ApiResponse, AboLabelOverrideRecord, ValidateUnitResponseDto } from './abo-label-override-query.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class AboLabelOverrideQueryService {
  private readonly apiService = inject(ApiService);

  validateUnit(unitId: string): Observable<ApiResponse<ValidateUnitResponseDto[]>> {
    return this.apiService.get<ApiResponse<ValidateUnitResponseDto[]>>(
      API.ABO_LABEL_OVERRIDE_QUERY.VALIDATE_UNIT(unitId),
      SKIP,
    );
  }

  getOverrideRecords(unitId: string): Observable<ApiResponse<AboLabelOverrideRecord[]>> {
    return this.apiService.get<ApiResponse<AboLabelOverrideRecord[]>>(
      API.ABO_LABEL_OVERRIDE_QUERY.GET_BY_UNIT(unitId),
      SKIP,
    );
  }
}
