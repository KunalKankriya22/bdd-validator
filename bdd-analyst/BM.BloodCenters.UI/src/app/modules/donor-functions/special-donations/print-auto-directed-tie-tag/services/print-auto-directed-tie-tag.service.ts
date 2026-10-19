import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

import type {
  TieTagSearchCriteriaDto,
  PatientSearchResultDto,
  TieTagDetailsDto,
  TieTagPrintRequestDto,
  PatientTypeDto,
  AttributeCodeDto,
  PrinterDto,
  IrradiationPromptDto,
  ApiResponse,
  DonationsResponse
} from '../models/print-auto-directed-tie-tag.models';

@Injectable({
  providedIn: 'root'
})
export class PrintAutoDirectedTieTagService {
  private readonly apiService = inject(ApiService);

  getPatients(): Observable<PatientSearchResultDto[]> {
    return this.apiService
      .get<ApiResponse<PatientSearchResultDto[]>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.PATIENTS)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching patients:', error);
          return throwError(() => error);
        })
      );
  }

  searchPatients(criteria: TieTagSearchCriteriaDto): Observable<PatientSearchResultDto[]> {
    return this.apiService
      .post<ApiResponse<PatientSearchResultDto[]>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.SEARCH, criteria)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error searching patients:', error);
          return throwError(() => error);
        })
      );
  }

  getTransferDetails(
    patientId: string,
    surgeryId: string,
    surgeryDate: string
  ): Observable<TieTagDetailsDto> {
    const params = new HttpParams()
      .set('patientId', patientId)
      .set('surgeryId', surgeryId)
      .set('surgeryDate', surgeryDate);

    return this.apiService
      .get<ApiResponse<TieTagDetailsDto>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.DETAILS, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching transfer details:', error);
          return throwError(() => error);
        })
      );
  }

  getDonations(patientId: string, surgeryId: string): Observable<DonationsResponse> {
    const params = new HttpParams()
      .set('patientId', patientId)
      .set('surgeryId', surgeryId);

    return this.apiService
      .get<DonationsResponse>(API.PRINT_AUTO_DIRECTED_TIE_TAG.DONATIONS, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching donations:', error);
          return throwError(() => error);
        })
      );
  }

  getPatientTypes(): Observable<PatientTypeDto[]> {
    return this.apiService
      .get<ApiResponse<PatientTypeDto[]>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.PATIENT_TYPES)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching patient types:', error);
          return throwError(() => error);
        })
      );
  }

  getAttributes(): Observable<AttributeCodeDto[]> {
    return this.apiService
      .get<ApiResponse<AttributeCodeDto[]>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.ATTRIBUTES)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching attributes:', error);
          return throwError(() => error);
        })
      );
  }

  getPrinters(): Observable<PrinterDto[]> {
    return this.apiService
      .get<ApiResponse<PrinterDto[]>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.PRINTERS)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error fetching printers:', error);
          return throwError(() => error);
        })
      );
  }

  getIrradiationPrompt(): Observable<IrradiationPromptDto> {
    return this.apiService
      .get<ApiResponse<IrradiationPromptDto>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.IRRADIATION_PROMPT)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching irradiation prompt:', error);
          return throwError(() => error);
        })
      );
  }

  validatePrintRequest(request: TieTagPrintRequestDto): Observable<ApiResponse<void>> {
    return this.apiService
      .post<ApiResponse<void>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.VALIDATE_PRINT, request)
      .pipe(
        catchError(error => {
          console.error('Error validating print request:', error);
          return throwError(() => error);
        })
      );
  }

  printTieTags(request: TieTagPrintRequestDto): Observable<ApiResponse<void>> {
    return this.apiService
      .post<ApiResponse<void>>(API.PRINT_AUTO_DIRECTED_TIE_TAG.PRINT, request)
      .pipe(
        catchError(error => {
          console.error('Error printing tie tags:', error);
          return throwError(() => error);
        })
      );
  }
}
