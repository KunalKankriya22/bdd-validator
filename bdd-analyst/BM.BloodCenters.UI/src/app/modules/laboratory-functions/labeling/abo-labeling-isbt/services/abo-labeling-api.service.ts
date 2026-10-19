import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  ValidateUnitRequestDto,
  ValidateUnitResultDto,
  ValidateProductRequestDto,
  ValidateProductResultDto,
  ValidateBarcodeRequestDto,
  ValidateBarcodeResultDto,
  GenerateLabelRequestDto,
  GenerateLabelResultDto,
  LabelFormatDto,
} from '../models/abo-labeling.model';

/**
 * API Response wrapper from backend
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

/**
 * ABO Labeling ISBT API Service
 * Provides endpoints for ABO/RH blood type labeling with ISBT-128 compliant barcode validation
 * and label generation for laboratory operations.
 *
 * @Injectable providedIn: 'root'
 */
@Injectable({ providedIn: 'root' })
export class AboLabelingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/laboratory/abo-labeling`;

  /**
   * Validates a scanned unit ID, extracts check digit, and retrieves unit details
   * @param request ValidateUnitRequestDto
   * @returns Observable<ValidateUnitResultDto>
   */
  validateUnit(request: ValidateUnitRequestDto): Observable<ValidateUnitResultDto> {
    return this.http
      .post<ApiResponse<ValidateUnitResultDto>>(`${this.baseUrl}/validate-unit`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Validates a scanned product code against the active product master
   * @param request ValidateProductRequestDto
   * @returns Observable<ValidateProductResultDto>
   */
  validateProduct(request: ValidateProductRequestDto): Observable<ValidateProductResultDto> {
    return this.http
      .post<ApiResponse<ValidateProductResultDto>>(`${this.baseUrl}/validate-product`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Validates barcode format and parses date values from Code 128 or Codabar formats
   * @param request ValidateBarcodeRequestDto
   * @returns Observable<ValidateBarcodeResultDto>
   */
  validateBarcode(request: ValidateBarcodeRequestDto): Observable<ValidateBarcodeResultDto> {
    return this.http
      .post<ApiResponse<ValidateBarcodeResultDto>>(`${this.baseUrl}/validate-barcode`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Generates ISBT-compliant label data with 9 formatted lines for printing
   * @param request GenerateLabelRequestDto
   * @returns Observable<GenerateLabelResultDto>
   */
  generateLabel(request: GenerateLabelRequestDto): Observable<GenerateLabelResultDto> {
    return this.http
      .post<ApiResponse<GenerateLabelResultDto>>(`${this.baseUrl}/generate-label`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Retrieves available label formats and their specifications
   * @returns Observable<LabelFormatDto[]>
   */
  getLabelFormats(): Observable<LabelFormatDto[]> {
    return this.http
      .get<ApiResponse<LabelFormatDto[]>>(`${this.baseUrl}/label-formats`)
      .pipe(map((response) => response.data));
  }
}
