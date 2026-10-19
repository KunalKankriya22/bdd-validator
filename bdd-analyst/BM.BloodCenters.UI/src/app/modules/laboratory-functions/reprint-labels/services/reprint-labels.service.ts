import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../../../../core/constants/api.constants';
import {
  ApiResponse,
  ValidateUnitRequest,
  ValidateUnitResponse,
  ProcessLabelRequest,
  ProcessLabelResponse,
  VerifyLabelRequest,
  VerifyLabelResponse,
  LabelTypeOption,
  UnitComponent,
} from '../models/reprint-labels.model';

@Injectable({ providedIn: 'root' })
export class ReprintLabelsService {
  private readonly http = inject(HttpClient);
  private readonly api = API.REPRINT_LABELS;

  getLabelTypes(): Observable<ApiResponse<LabelTypeOption>> {
    return this.http.get<ApiResponse<LabelTypeOption>>(this.api.LABEL_TYPES);
  }

  validateUnit(request: ValidateUnitRequest): Observable<ApiResponse<ValidateUnitResponse>> {
    return this.http.post<ApiResponse<ValidateUnitResponse>>(this.api.VALIDATE_UNIT, request);
  }

  processLabel(request: ProcessLabelRequest): Observable<ApiResponse<ProcessLabelResponse>> {
    return this.http.post<ApiResponse<ProcessLabelResponse>>(this.api.PROCESS_LABEL, request);
  }

  verifyLabel(request: VerifyLabelRequest): Observable<ApiResponse<VerifyLabelResponse>> {
    return this.http.post<ApiResponse<VerifyLabelResponse>>(this.api.VERIFY, request);
  }

  getComponents(unitId: string, labelType: string): Observable<ApiResponse<UnitComponent>> {
    return this.http.get<ApiResponse<UnitComponent>>(this.api.COMPONENTS(unitId, labelType));
  }

  getAboLov(productCode: string, codeScheme: string): Observable<ApiResponse<LabelTypeOption>> {
    return this.http.get<ApiResponse<LabelTypeOption>>(this.api.LOV_ABO_VALUES(productCode, codeScheme));
  }

  getSpecialTestLov(productType: string): Observable<ApiResponse<LabelTypeOption>> {
    return this.http.get<ApiResponse<LabelTypeOption>>(this.api.LOV_SPECIAL_TEST(productType));
  }

}
