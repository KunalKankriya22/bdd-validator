import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  RegisterDonationDto,
  CreateRegisterDonationRequest,
  BatchRegisterDonationRequest,
  UpdateRegisterDonationRequest,
  RegisterDonationQuery,
  DriveLookupDto,
  ProcedureCodeLookupDto,
  VenipunctureCodeLookupDto,
  EmployeeLookupDto,
  InterdictionCodeLookupDto,
  EmployerLookupDto,
  DonationTypeLookupDto,
  SponsorLookupDto,
  CityStateLookupDto,
  DeferralReasonLookupDto,
  CodeDescriptionDto,
  EthnicGroupLookupDto,
  AlternateTypeLookupDto,
  CreateDonorRequest,
  CreateDonorResponse,
  FieldValidationResult,
} from '../models/donor-registration.model';
import type { UnitValidationApiResponse } from '../models/donor-registration.model';
import { DonorDemographics, DonorAddress } from '../../../registration/registration-general-functions/register-deferral/models/register-deferral.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total: number;
  item?: T;
  errorResponse?: { errorCode: string; error: string };
}

@Injectable({
  providedIn: 'root',
})
export class DonorRegistrationService {
  private readonly apiService = inject(ApiService);

  getAll(
    take: number,
    skip: number,
    query?: RegisterDonationQuery
  ): Observable<{ data: RegisterDonationDto[]; total: number }> {
    return this.apiService
      .post<ApiResponse<RegisterDonationDto[]>>(
        API.REGISTER_DONATION.GET_ALL(take, skip),
        query ?? {}
      )
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          total: res.total ?? 0,
        })),
        catchError((error) => {
          console.error('DonorRegistrationService.getAll failed:', error);
          return throwError(() => error);
        })
      );
  }

  getByTransactionId(
    transactionId: string
  ): Observable<RegisterDonationDto | null> {
    return this.apiService
      .get<ApiResponse<RegisterDonationDto>>(
        API.REGISTER_DONATION.GET_BY_ID(transactionId)
      )
      .pipe(
        map((res) => res.data ?? res.item ?? null),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getByTransactionId failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getByDonorId(donorId: string): Observable<RegisterDonationDto[]> {
    return this.apiService
      .get<ApiResponse<RegisterDonationDto[]>>(
        API.REGISTER_DONATION.GET_BY_DONOR(donorId)
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getByDonorId failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  createDonor(
    request: CreateDonorRequest
  ): Observable<ApiResponse<CreateDonorResponse>> {
    return this.apiService
      .post<ApiResponse<CreateDonorResponse>>(
        API.FIND_DONOR.CREATE_DONOR,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('DonorRegistrationService.createDonor failed:', error);
          return throwError(() => error);
        })
      );
  }

  create(
    request: CreateRegisterDonationRequest
  ): Observable<ApiResponse<RegisterDonationDto>> {
    return this.apiService
      .post<ApiResponse<RegisterDonationDto>>(
        API.REGISTER_DONATION.CREATE,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('DonorRegistrationService.create failed:', error);
          return throwError(() => error);
        })
      );
  }

  registerHold(
    request: CreateRegisterDonationRequest
  ): Observable<ApiResponse<RegisterDonationDto>> {
    return this.apiService
      .post<ApiResponse<RegisterDonationDto>>(
        API.REGISTER_DONATION.HOLD,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('DonorRegistrationService.registerHold failed:', error);
          return throwError(() => error);
        })
      );
  }

  batchCreate(
    request: BatchRegisterDonationRequest
  ): Observable<ApiResponse<RegisterDonationDto[]>> {
    return this.apiService
      .post<ApiResponse<RegisterDonationDto[]>>(
        API.REGISTER_DONATION.BATCH_CREATE,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('DonorRegistrationService.batchCreate failed:', error);
          return throwError(() => error);
        })
      );
  }

  update(
    transactionId: string,
    request: UpdateRegisterDonationRequest
  ): Observable<ApiResponse<RegisterDonationDto>> {
    return this.apiService
      .put<ApiResponse<RegisterDonationDto>>(
        API.REGISTER_DONATION.UPDATE(transactionId),
        request
      )
      .pipe(
        catchError((error) => {
          console.error('DonorRegistrationService.update failed:', error);
          return throwError(() => error);
        })
      );
  }

  deleteDonation(
    transactionId: string
  ): Observable<ApiResponse<string>> {
    return this.apiService
      .delete<ApiResponse<string>>(
        API.REGISTER_DONATION.DELETE(transactionId)
      )
      .pipe(
        catchError((error) => {
          console.error('DonorRegistrationService.delete failed:', error);
          return throwError(() => error);
        })
      );
  }

  getDrives(driveDate: string): Observable<DriveLookupDto[]> {
    const params = new HttpParams().set('driveDate', driveDate);
    return this.apiService
      .get<ApiResponse<DriveLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.DRIVES,
        { params }
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('DonorRegistrationService.getDrives failed:', error);
          return throwError(() => error);
        })
      );
  }

  getProcedureCodes(): Observable<ProcedureCodeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<ProcedureCodeLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.PROCEDURE_CODES
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getProcedureCodes failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getProcedureCodesByDonationType(donationType: string): Observable<ProcedureCodeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<ProcedureCodeLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.PROCEDURE_CODES_BY_TYPE(donationType)
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getProcedureCodesByDonationType failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getVenipunctureCodes(): Observable<VenipunctureCodeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<{ attribCode: string; attribDesc: string | null }[]>>(
        API.REGISTER_DONATION_LOOKUPS.VENIPUNCTURE_CODES
      )
      .pipe(
        map((res) =>
          (res.data ?? []).map((item) => ({
            code: item.attribCode,
            description: item.attribDesc,
          }))
        ),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getVenipunctureCodes failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getEmployees(driveDate: string, driveId?: string): Observable<EmployeeLookupDto[]> {
    let params = new HttpParams().set('driveDate', driveDate);
    if (driveId) {
      params = params.set('driveId', driveId);
    }
    return this.apiService
      .get<ApiResponse<EmployeeLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.EMPLOYEES,
        { params }
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getEmployees failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getInterdictionCodes(): Observable<InterdictionCodeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<InterdictionCodeLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.INTERDICTION_CODES
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error(
            'DonorRegistrationService.getInterdictionCodes failed:',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getDonationTypes(): Observable<DonationTypeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<DonationTypeLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.DONATION_TYPES
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('DonorRegistrationService.getDonationTypes failed:', error);
          return throwError(() => error);
        })
      );
  }

  getEquipmentTypes(): Observable<CodeDescriptionDto[]> {
    return this.apiService
      .get<ApiResponse<CodeDescriptionDto[]>>(API.REGISTER_DONATION_LOOKUPS.EQUIPMENT_TYPES)
      .pipe(map((res) => res.data ?? []));
  }

  getEthnicGroups(): Observable<EthnicGroupLookupDto[]> {
    return this.apiService
      .get<ApiResponse<EthnicGroupLookupDto[]>>(API.REGISTER_DONATION_LOOKUPS.ETHNIC_GROUPS)
      .pipe(map((res) => res.data ?? []));
  }

  getAlternateIdTypes(): Observable<AlternateTypeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<AlternateTypeLookupDto[]>>(API.REGISTER_DONATION_LOOKUPS.ALTERNATE_ID_TYPES)
      .pipe(map((res) => res.data ?? []));
  }

  getReactionCodes(): Observable<CodeDescriptionDto[]> {
    return this.apiService
      .get<ApiResponse<CodeDescriptionDto[]>>(API.REGISTER_DONATION_LOOKUPS.REACTION_CODES)
      .pipe(map((res) => res.data ?? []));
  }

  getSponsors(searchKeyword: string): Observable<SponsorLookupDto[]> {
    const params = new HttpParams().set('searchKeyword', searchKeyword);
    return this.apiService
      .get<ApiResponse<SponsorLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.SPONSORS,
        { params }
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('DonorRegistrationService.getSponsors failed:', error);
          return throwError(() => error);
        })
      );
  }

  getEmployers(searchTerm: string): Observable<EmployerLookupDto[]> {
    return this.apiService
      .get<ApiResponse<EmployerLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.EMPLOYERS(searchTerm)
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('DonorRegistrationService.getEmployers failed:', error);
          return throwError(() => error);
        })
      );
  }

  getCityState(query: { zip?: string; city?: string }): Observable<CityStateLookupDto[]> {
    let params = new HttpParams();
    if (query.zip) params = params.set('zip', query.zip);
    if (query.city) params = params.set('city', query.city);
    return this.apiService
      .get<ApiResponse<CityStateLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.CITY_STATE,
        { params }
      )
      .pipe(
        map((res) => res.data ?? []),
        catchError((error) => {
          console.error('DonorRegistrationService.getCityState failed:', error);
          return throwError(() => error);
        })
      );
  }

  getDeferralReasons(donationType: string, driveDate: string): Observable<DeferralReasonLookupDto[]> {
    return this.apiService
      .get<ApiResponse<DeferralReasonLookupDto[]>>(
        API.REGISTER_DONATION_LOOKUPS.DEFERRAL_REASONS(donationType, driveDate)
      )
      .pipe(
        map((res) => (res.data ?? []).filter(
          (d) => d.reasonCode !== '0' && !d.reasonCode.endsWith(',')
        )),
        catchError((error) => {
          console.error('DonorRegistrationService.getDeferralReasons failed:', error);
          return throwError(() => error);
        })
      );
  }

  validateUnitId(unitId: string, validateFfValue: string): Observable<UnitValidationApiResponse> {
    return this.apiService.post<UnitValidationApiResponse>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
      { unitId, validateFfValue },
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  checkExistingUnitId(unitId: string): Observable<boolean> {
    return this.apiService
      .get<ApiResponse<boolean>>(
        API.REGISTER_DONATION.CHECK_DUPLICATE_UNIT(unitId),
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        map((res) => !!res.item),
        catchError(() => of(false))
      );
  }

  validateStaff(staffId: string, driveDate: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.REGISTER_DEFERRAL.VALIDATE_STAFF(staffId, driveDate),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  validateEquipmentType(equipType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.REGISTER_DEFERRAL.VALIDATE_EQUIPMENT_TYPE(equipType)
    );
  }

  validateEthnicGroup(ethnicGroup: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.REGISTER_DEFERRAL.VALIDATE_ETHNIC_GROUP(ethnicGroup)
    );
  }

  validateAlternateIdType(alternateIdType: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.REGISTER_DEFERRAL.VALIDATE_ALTERNATE_ID_TYPE(alternateIdType)
    );
  }

  validateCity(city: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.REGISTER_DEFERRAL.VALIDATE_CITY(city)
    );
  }

  validateZipCity(city: string, zip: string): Observable<FieldValidationResult> {
    return this.apiService.get<FieldValidationResult>(
      API.REGISTER_DEFERRAL.VALIDATE_ZIP_CITY(city, zip)
    );
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
}
