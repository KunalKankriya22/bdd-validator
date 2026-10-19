import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ComponentDetailsDto,
  AboValueDto,
  OverrideCodeDto,
  EmergencyProductDto,
  EmergencyReleaseRequestDto,
  EmergencyReleaseResponseDto,
  ProcessEmergencyLabelRequestDto,
  ProcessEmergencyLabelResponseDto,
  EmergencyAbandonedLabelRequestDto,
  EmergencyMedicalReleaseApiResponse,
} from '../models/emergency-medical-release.model';

@Injectable({
  providedIn: 'root',
})
export class EmergencyMedicalReleaseApiService {
  private readonly apiService = inject(ApiService);

  getComponent(
    unitId: string,
    codeScheme: string = 'I',
  ): Observable<EmergencyMedicalReleaseApiResponse<ComponentDetailsDto>> {
    const params = new HttpParams().set('codeScheme', codeScheme);
    return this.apiService.get<EmergencyMedicalReleaseApiResponse<ComponentDetailsDto>>(
      API.EMERGENCY_MEDICAL_RELEASE.GET_COMPONENT(unitId),
      { params },
    );
  }

  getAboValues(
    codeScheme: string = 'I',
  ): Observable<EmergencyMedicalReleaseApiResponse<AboValueDto[]>> {
    const params = new HttpParams().set('codeScheme', codeScheme);
    return this.apiService.get<EmergencyMedicalReleaseApiResponse<AboValueDto[]>>(
      API.EMERGENCY_MEDICAL_RELEASE.GET_ABO_VALUES,
      { params },
    );
  }

  getOverrideCodes(): Observable<EmergencyMedicalReleaseApiResponse<OverrideCodeDto[]>> {
    return this.apiService.get<EmergencyMedicalReleaseApiResponse<OverrideCodeDto[]>>(
      API.EMERGENCY_MEDICAL_RELEASE.GET_OVERRIDE_CODES,
    );
  }

  getProducts(
    unitId: string,
    codeScheme: string = 'I',
  ): Observable<EmergencyMedicalReleaseApiResponse<EmergencyProductDto[]>> {
    const params = new HttpParams().set('codeScheme', codeScheme);
    return this.apiService.get<EmergencyMedicalReleaseApiResponse<EmergencyProductDto[]>>(
      API.EMERGENCY_MEDICAL_RELEASE.GET_PRODUCTS(unitId),
      { params },
    );
  }

  getComponentPrefixes(
    unitId: string,
    productCode: string,
  ): Observable<EmergencyMedicalReleaseApiResponse<string[]>> {
    return this.apiService.get<EmergencyMedicalReleaseApiResponse<string[]>>(
      API.EMERGENCY_MEDICAL_RELEASE.GET_COMPONENT_PREFIXES(unitId, productCode),
    );
  }

  processRelease(
    request: EmergencyReleaseRequestDto,
  ): Observable<EmergencyMedicalReleaseApiResponse<EmergencyReleaseResponseDto>> {
    return this.apiService.post<EmergencyMedicalReleaseApiResponse<EmergencyReleaseResponseDto>>(
      API.EMERGENCY_MEDICAL_RELEASE.RELEASE,
      request,
    );
  }

  processLabel(
    request: ProcessEmergencyLabelRequestDto,
  ): Observable<EmergencyMedicalReleaseApiResponse<ProcessEmergencyLabelResponseDto>> {
    return this.apiService.post<EmergencyMedicalReleaseApiResponse<ProcessEmergencyLabelResponseDto>>(
      API.EMERGENCY_MEDICAL_RELEASE.PROCESS_LABEL,
      request,
    );
  }

  logAbandoned(
    request: EmergencyAbandonedLabelRequestDto,
  ): Observable<EmergencyMedicalReleaseApiResponse<boolean>> {
    return this.apiService.post<EmergencyMedicalReleaseApiResponse<boolean>>(
      API.EMERGENCY_MEDICAL_RELEASE.LOG_ABANDONED,
      request,
    );
  }
}
