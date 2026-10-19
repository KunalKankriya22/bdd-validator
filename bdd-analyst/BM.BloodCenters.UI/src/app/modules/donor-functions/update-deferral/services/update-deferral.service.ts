import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  DeferralDetailDto,
  UpdateDeferralRequestDto,
  ApiResponse,
  DriveLookupDto,
  EmployeeLookupDto,
  DonationTypeLookupDto,
  ProcedureCodeLookupDto,
  EquipmentTypeLookupDto,
  DeferralReasonLookupDto,
  EthnicGroupLookupDto,
  EmployerLookupDto,
  CityLookupDto,
  CreateDeferralInterdictionDto,
  DeferralInterdictionDto,
  FieldValidationResult,
  ManualHoldLookupDto,
  CountryLookupDto,
  AlternateTypeLookupDto,
} from '../models/update-deferral.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateDeferralService {
  private readonly apiService = inject(ApiService);

  private donationTypesCache$: Observable<DonationTypeLookupDto[]> | null = null;
  private equipmentTypesCache$: Observable<EquipmentTypeLookupDto[]> | null = null;
  private ethnicGroupsCache$: Observable<EthnicGroupLookupDto[]> | null = null;

  getDeferralById(deferralId: string): Observable<DeferralDetailDto> {
    return this.apiService.get<ApiResponse<DeferralDetailDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_BY_ID(deferralId),
    ).pipe(
      map((response) => {
        if (!response.success || !response.data || response.data.length === 0) {
          throw new Error(response.message || 'Deferral not found');
        }
        return response.data[0];
      }),
    );
  }

  updateDeferral(
    deferralId: string,
    updateRequest: UpdateDeferralRequestDto,
  ): Observable<ApiResponse<void>> {
    return this.apiService.put<ApiResponse<void>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.UPDATE(deferralId),
      updateRequest,
    );
  }

  validateDeferralId(deferralId: string): Observable<boolean> {
    return this.apiService.get<ApiResponse<boolean>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE(deferralId),
    ).pipe(
      map((response) => response.data?.[0] ?? false),
    );
  }

  // Interdiction methods

  getInterdictions(transactionId: string): Observable<DeferralInterdictionDto[]> {
    return this.apiService.get<ApiResponse<DeferralInterdictionDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_INTERDICTIONS(transactionId),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  addInterdiction(dto: CreateDeferralInterdictionDto): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.ADD_INTERDICTION,
      dto,
    );
  }

  removeInterdiction(transactionId: string, interCode: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.REMOVE_INTERDICTION(transactionId, interCode),
    );
  }

  // Lookup methods

  getDrives(driveDate?: string): Observable<DriveLookupDto[]> {
    return this.apiService.get<ApiResponse<DriveLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DRIVES(driveDate),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getEmployees(driveDate?: string): Observable<EmployeeLookupDto[]> {
    return this.apiService.get<ApiResponse<EmployeeLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_EMPLOYEES(driveDate),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getDonationTypes(): Observable<DonationTypeLookupDto[]> {
    if (!this.donationTypesCache$) {
      this.donationTypesCache$ = this.apiService.get<ApiResponse<DonationTypeLookupDto>>(
        API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DONATION_TYPES,
      ).pipe(
        map((res) => res.data ?? []),
        catchError(() => of([])),
        shareReplay(1),
      );
    }
    return this.donationTypesCache$;
  }

  getProcedureCodes(donationType?: string): Observable<ProcedureCodeLookupDto[]> {
    return this.apiService.get<ApiResponse<ProcedureCodeLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_PROCEDURE_CODES(donationType),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getEquipmentTypes(): Observable<EquipmentTypeLookupDto[]> {
    if (!this.equipmentTypesCache$) {
      this.equipmentTypesCache$ = this.apiService.get<ApiResponse<EquipmentTypeLookupDto>>(
        API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_EQUIPMENT_TYPES,
      ).pipe(
        map((res) => res.data ?? []),
        catchError(() => of([])),
        shareReplay(1),
      );
    }
    return this.equipmentTypesCache$;
  }

  getDeferralReasons(donationType?: string): Observable<DeferralReasonLookupDto[]> {
    return this.apiService.get<ApiResponse<DeferralReasonLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DEFERRAL_REASONS(donationType),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getEthnicGroups(): Observable<EthnicGroupLookupDto[]> {
    if (!this.ethnicGroupsCache$) {
      this.ethnicGroupsCache$ = this.apiService.get<ApiResponse<EthnicGroupLookupDto>>(
        API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_ETHNIC_GROUPS,
      ).pipe(
        map((res) => res.data ?? []),
        catchError(() => of([])),
        shareReplay(1),
      );
    }
    return this.ethnicGroupsCache$;
  }

  getEmployers(searchKeyword?: string): Observable<EmployerLookupDto[]> {
    return this.apiService.get<ApiResponse<EmployerLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_EMPLOYERS(searchKeyword),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getCities(searchTerm: string): Observable<CityLookupDto[]> {
    return this.apiService.get<ApiResponse<CityLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_CITIES(searchTerm),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getZipLookup(zip: string): Observable<CityLookupDto[]> {
    return this.apiService.get<ApiResponse<CityLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.ZIP_LOOKUP(zip),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getManualHolds(): Observable<ManualHoldLookupDto[]> {
    return this.apiService.get<ApiResponse<ManualHoldLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_MANUAL_HOLDS,
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getEthnicRequired(): Observable<boolean> {
    return this.apiService.get<ApiResponse<{ ethnicRequired: string }>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_ETHNIC_REQUIRED,
    ).pipe(
      map((res) => res.data?.[0]?.ethnicRequired === 'Y'),
      catchError(() => of(false)),
    );
  }

  getCountries(): Observable<CountryLookupDto[]> {
    return this.apiService.get<ApiResponse<CountryLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_COUNTRIES,
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getAlternateIdTypes(): Observable<AlternateTypeLookupDto[]> {
    return this.apiService.get<ApiResponse<AlternateTypeLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_ALTERNATE_ID_TYPES_LOOKUP,
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getEmployerCities(searchTerm: string): Observable<CityLookupDto[]> {
    return this.apiService.get<ApiResponse<CityLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.EMPLOYER_CITIES(searchTerm),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getEmployerZipLookup(zip: string): Observable<CityLookupDto[]> {
    return this.apiService.get<ApiResponse<CityLookupDto>>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.EMPLOYER_ZIP_LOOKUP(zip),
    ).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  // Field validation methods

  validateStaff(staffId: string, driveDate?: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_STAFF(staffId, driveDate),
    );
  }

  validateDonationType(donationType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_DONATION_TYPE(donationType),
    );
  }

  validateProcedureCode(donationType: string, procedureCode: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_PROCEDURE_CODE(donationType, procedureCode),
    );
  }

  validateEquipmentType(equipType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_EQUIPMENT_TYPE(equipType),
    );
  }

  validateDeferralReason(reasonCode: string, donationType?: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_DEFERRAL_REASON(reasonCode, donationType),
    );
  }

  validateCityField(city: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_CITY(city),
    );
  }

  validateZipCityField(city: string, zip: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_ZIP_CITY(city, zip),
    );
  }

  validateAlternateIdTypeField(alternateIdType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_ALTERNATE_ID_TYPE(alternateIdType),
    );
  }

  validateEthnicGroupField(ethnicGroup: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_ETHNIC_GROUP(ethnicGroup),
    );
  }

  validateScanId(scanId: string, donorId?: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_SCAN_ID(scanId, donorId),
    );
  }

  createEmployer(request: { employerName: string; city: string; state: string; zip: string }): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.CREATE_EMPLOYER, request)
      .pipe(map((res) => res.data));
  }

  clearCaches(): void {
    this.donationTypesCache$ = null;
    this.equipmentTypesCache$ = null;
    this.ethnicGroupsCache$ = null;
  }
}
