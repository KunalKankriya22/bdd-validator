import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ApiResponse,
  CityStateResult,
  DeferralInterdictionLookupDto,
  DeferralReasonLookupOption,
  DeferralRegistrationRequest,
  DeferralRegistrationResponse,
  DeferralSearchResult,
  RegisterHoldRequest,
  DonationTypeLookupOption,
  DonorAddress,
  DonorDemographics,
  DriveOption,
  EmployeeOption,
  EmployerLookupOption,
  FieldValidationResult,
  LookupOption,
  ProcedureCodeLookupOption,
  RegistrationResult,
  ValidationResult,
} from '../models/register-deferral.model';

@Injectable({ providedIn: 'root' })
export class RegisterDeferralService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  private donationTypesCache$: Observable<DonationTypeLookupOption[]> | null = null;
  private equipmentTypesCache$: Observable<LookupOption[]> | null = null;
  private ethnicGroupsCache$: Observable<LookupOption[]> | null = null;
  private deferralTypesCache$: Observable<LookupOption[]> | null = null;
  private alternateIdTypesCache$: Observable<LookupOption[]> | null = null;
  private employeesCache$: Observable<EmployeeOption[]> | null = null;

  getDrives(driveDate: string): Observable<DriveOption[]> {
    return this.apiService
      .get<ApiResponse<DriveOption[]>>(API.REGISTER_DEFERRAL.GET_DRIVES(driveDate))
      .pipe(map((res) => res.data));
  }

  validateDeferralId(deferralId: string): Observable<ValidationResult> {
    return this.apiService.post<ApiResponse<ValidationResult>>(
      API.REGISTER_DEFERRAL.VALIDATE_DEFERRAL_ID,
      { deferralId }
    ).pipe(map((res) => res.data));
  }

  checkDeferralExists(deferralId: string): Observable<boolean> {
    return this.apiService
      .get<ApiResponse<boolean>>(API.REGISTER_DEFERRAL.CHECK_DEFERRAL_EXISTS(deferralId))
      .pipe(map((res) => res.data));
  }

  getDonor(donorId: string): Observable<DonorDemographics> {
    return this.apiService
      .get<ApiResponse<DonorDemographics>>(API.REGISTER_DEFERRAL.GET_DONOR(donorId))
      .pipe(map((res) => res.data));
  }

  getDonorAddress(donorId: string): Observable<DonorAddress> {
    return this.apiService
      .get<ApiResponse<DonorAddress>>(API.REGISTER_DEFERRAL.GET_DONOR_ADDRESS(donorId))
      .pipe(map((res) => res.data));
  }

  registerDeferral(request: DeferralRegistrationRequest): Observable<RegistrationResult> {
    return this.apiService
      .post<ApiResponse<RegistrationResult>>(API.REGISTER_DEFERRAL.REGISTER, request)
      .pipe(map((res) => res.data));
  }

  registerHold(request: RegisterHoldRequest): Observable<RegistrationResult> {
    return this.apiService
      .post<ApiResponse<RegistrationResult>>(API.REGISTER_DEFERRAL.REGISTER_HOLD, request)
      .pipe(map((res) => res.data));
  }

  updateDeferral(request: DeferralRegistrationRequest): Observable<RegistrationResult> {
    return this.apiService
      .put<ApiResponse<RegistrationResult>>(API.REGISTER_DEFERRAL.UPDATE, request)
      .pipe(map((res) => res.data));
  }

  getDeferral(deferralId: string): Observable<DeferralRegistrationResponse> {
    return this.apiService
      .get<ApiResponse<DeferralRegistrationResponse>>(API.REGISTER_DEFERRAL.GET_DEFERRAL(deferralId))
      .pipe(map((res) => res.data));
  }

  searchDeferral(deferralId: string): Observable<DeferralSearchResult[]> {
    return this.apiService
      .post<ApiResponse<DeferralSearchResult[]>>(API.REGISTER_DEFERRAL.SEARCH_DEFERRAL, { deferralId })
      .pipe(map((res) => res.data));
  }

  getEmployees(driveDate: string): Observable<EmployeeOption[]> {
    if (!this.employeesCache$) {
      this.employeesCache$ = this.apiService
        .get<ApiResponse<EmployeeOption[]>>(API.REGISTER_DEFERRAL.GET_EMPLOYEES(driveDate))
        .pipe(map((res) => res.data), shareReplay(1));
    }
    return this.employeesCache$;
  }

  getDonationTypes(): Observable<DonationTypeLookupOption[]> {
    if (!this.donationTypesCache$) {
      this.donationTypesCache$ = this.apiService
        .get<ApiResponse<DonationTypeLookupOption[]>>(API.REGISTER_DEFERRAL.GET_DONATION_TYPES)
        .pipe(map((res) => res.data), shareReplay(1));
    }
    return this.donationTypesCache$;
  }

  getProcedureCodes(donationType: string): Observable<ProcedureCodeLookupOption[]> {
    return this.apiService
      .get<ApiResponse<ProcedureCodeLookupOption[]>>(API.REGISTER_DEFERRAL.GET_PROCEDURE_CODES(donationType))
      .pipe(map((res) => res.data));
  }

  getDeferralReasons(driveDate: string, donationType: string): Observable<DeferralReasonLookupOption[]> {
    return this.apiService
      .get<ApiResponse<DeferralReasonLookupOption[]>>(API.REGISTER_DEFERRAL.GET_DEFERRAL_REASONS(driveDate, donationType))
      .pipe(map((res) => res.data));
  }

  getEquipmentTypes(): Observable<LookupOption[]> {
    if (!this.equipmentTypesCache$) {
      this.equipmentTypesCache$ = this.apiService
        .get<ApiResponse<LookupOption[]>>(API.REGISTER_DEFERRAL.GET_EQUIPMENT_TYPES)
        .pipe(map((res) => res.data), shareReplay(1));
    }
    return this.equipmentTypesCache$;
  }

  getEthnicGroups(): Observable<LookupOption[]> {
    if (!this.ethnicGroupsCache$) {
      this.ethnicGroupsCache$ = this.apiService
        .get<ApiResponse<LookupOption[]>>(API.REGISTER_DEFERRAL.GET_ETHNIC_GROUPS)
        .pipe(map((res) => res.data), shareReplay(1));
    }
    return this.ethnicGroupsCache$;
  }

  getEthnicRequired(): Observable<boolean> {
    return this.apiService.get<ApiResponse<{ ethnicRequired: string }>>(
      API.REGISTER_DEFERRAL.GET_ETHNIC_REQUIRED,
    ).pipe(
      map((res) => res.data?.ethnicRequired === 'Y'),
      catchError(() => of(false)),
    );
  }

  getInterdictions(): Observable<DeferralInterdictionLookupDto[]> {
    return this.apiService
      .get<ApiResponse<DeferralInterdictionLookupDto[]>>(API.REGISTER_DEFERRAL.GET_INTERDICTIONS)
      .pipe(map((res) => res.data));
  }

  getEmployers(searchTerm?: string): Observable<EmployerLookupOption[]> {
    return this.apiService
      .get<ApiResponse<EmployerLookupOption[]>>(API.REGISTER_DEFERRAL.GET_EMPLOYERS(searchTerm))
      .pipe(map((res) => res.data));
  }

  getCities(searchTerm: string): Observable<CityStateResult[]> {
    return this.apiService
      .get<ApiResponse<CityStateResult[]>>(API.REGISTER_DEFERRAL.GET_CITIES(searchTerm))
      .pipe(map((res) => res.data));
  }

  getZipsByCity(city: string): Observable<{ code: string; description: string }[]> {
    return this.getCities(city).pipe(
      map((results) =>
        results
          .map((r) => ({ code: r.zip || '', description: `${r.city} - ${r.state}` }))
          .filter((r) => r.code !== '')
      )
    );
  }

  getZipLookup(zip: string): Observable<CityStateResult[]> {
    return this.apiService
      .get<ApiResponse<CityStateResult[]>>(API.REGISTER_DEFERRAL.ZIP_LOOKUP(zip))
      .pipe(map((res) => res.data));
  }

  getDeferralTypes(): Observable<LookupOption[]> {
    if (!this.deferralTypesCache$) {
      this.deferralTypesCache$ = this.apiService
        .get<ApiResponse<LookupOption[]>>(API.REGISTER_DEFERRAL.GET_DEFERRAL_TYPES)
        .pipe(map((res) => res.data), shareReplay(1));
    }
    return this.deferralTypesCache$;
  }

  getAlternateIdTypes(): Observable<LookupOption[]> {
    if (!this.alternateIdTypesCache$) {
      this.alternateIdTypesCache$ = this.apiService
        .get<ApiResponse<LookupOption[]>>(API.REGISTER_DEFERRAL.GET_ALTERNATE_ID_TYPES)
        .pipe(map((res) => res.data), shareReplay(1));
    }
    return this.alternateIdTypesCache$;
  }

  checkAgeLimits(dateOfBirth: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.CHECK_AGE_LIMITS(dateOfBirth));
  }

  checkOnlineDonation(donorId: string): Observable<{ hasOnlineRegistration: boolean }> {
    return this.apiService
      .get<ApiResponse<{ hasOnlineRegistration: boolean }>>(API.REGISTER_DEFERRAL.CHECK_ONLINE_DONATION(donorId))
      .pipe(map((res) => res.data));
  }

  validateStaff(staffId: string, driveDate: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_STAFF(staffId, driveDate));
  }

  validateDonationTypeField(donationType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_DONATION_TYPE(donationType));
  }

  validateProcedureCodeField(donationType: string, procedureCode: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_PROCEDURE_CODE(donationType, procedureCode));
  }

  validateEquipmentTypeField(equipType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_EQUIPMENT_TYPE(equipType));
  }

  validateDeferralReasonField(reasonCode: string, donationType: string, driveDate: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_DEFERRAL_REASON(reasonCode, donationType, driveDate));
  }

  validateCityField(city: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_CITY(city));
  }

  validateZipCityField(city: string, zip: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_ZIP_CITY(city, zip));
  }

  validateEthnicGroupField(ethnicGroup: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_ETHNIC_GROUP(ethnicGroup));
  }

  validateAlternateIdTypeField(alternateIdType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(API.REGISTER_DEFERRAL.VALIDATE_ALTERNATE_ID_TYPE(alternateIdType));
  }

  validateAreaCode(areaCode: string): Observable<boolean> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService.get<ApiResponse<unknown>>(
      API.LOOKUPS.VALIDATE('AREAC', areaCode),
      { context }
    ).pipe(
      map(response => response?.success === true),
      catchError(() => of(false)),
    );
  }

  createEmployer(request: { employerName: string; city: string; state: string; zip: string }): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(API.REGISTER_DEFERRAL.CREATE_EMPLOYER, request)
      .pipe(map((res) => res.data));
  }

  clearCaches(): void {
    this.donationTypesCache$ = null;
    this.equipmentTypesCache$ = null;
    this.ethnicGroupsCache$ = null;
    this.deferralTypesCache$ = null;
    this.alternateIdTypesCache$ = null;
    this.employeesCache$ = null;
  }
}
