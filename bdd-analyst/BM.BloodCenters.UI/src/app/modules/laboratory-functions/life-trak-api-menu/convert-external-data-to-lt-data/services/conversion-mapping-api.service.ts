import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  SourceApplicationDto,
  TargetValueTypeDto,
  ConversionMappingDto,
  ConversionMappingQueryDto,
  CreateConversionMappingDto,
  UpdateConversionMappingDto,
  ApiResponse,
} from '../models/conversion-mapping.model';

/**
 * API Service for Conversion Mapping operations
 * Uses API constants from @core/constants/api.constants
 */
@Injectable({
  providedIn: 'root',
})
export class ConversionMappingApiService {
  private readonly http = inject(HttpClient);

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  /**
   * Get source applications list (LOV)
   * GET /conversion-mappings/source-applications
   */
  getSourceApplications(): Observable<ApiResponse<SourceApplicationDto>> {
    const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.CONVERSION_MAPPING_SOURCE_APPLICATIONS}`;
    return this.http.get<ApiResponse<SourceApplicationDto>>(url);
  }

  /**
   * Get target value types list (LOV)
   * GET /conversion-mappings/target-types
   */
  getTargetValueTypes(): Observable<ApiResponse<TargetValueTypeDto>> {
    const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.CONVERSION_MAPPING_TARGET_TYPES}`;
    return this.http.get<ApiResponse<TargetValueTypeDto>>(url);
  }

  /**
   * Get all conversion mappings with filtering
   * POST /conversion-mappings/{take}/{skip}
   */
  getConversionMappings(
    take: number,
    skip: number,
    query: ConversionMappingQueryDto
  ): Observable<ApiResponse<ConversionMappingDto>> {
    const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.CONVERSION_MAPPING_LIST(take, skip)}`;
    return this.http.post<ApiResponse<ConversionMappingDto>>(
      url,
      query,
      this.httpOptions
    );
  }

  /**
   * Create new conversion mapping
   * POST /conversion-mappings
   */
  createConversionMapping(
    dto: CreateConversionMappingDto
  ): Observable<ApiResponse<ConversionMappingDto>> {
    const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.CONVERSION_MAPPING_CREATE}`;
    return this.http.post<ApiResponse<ConversionMappingDto>>(
      url,
      dto,
      this.httpOptions
    );
  }

  /**
   * Update existing conversion mapping
   * PUT /conversion-mappings/{sourceApplId}/{targetApplId}/{sourceValue}/{targetValue}/{targetValueType}
   */
  updateConversionMapping(
    sourceApplId: string,
    targetApplId: string,
    sourceValue: string,
    targetValue: string,
    targetValueType: string,
    dto: UpdateConversionMappingDto
  ): Observable<ApiResponse<ConversionMappingDto>> {
    const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.CONVERSION_MAPPING_UPDATE(
      sourceApplId,
      targetApplId,
      sourceValue,
      targetValue,
      targetValueType
    )}`;
    return this.http.put<ApiResponse<ConversionMappingDto>>(
      url,
      dto,
      this.httpOptions
    );
  }
}
