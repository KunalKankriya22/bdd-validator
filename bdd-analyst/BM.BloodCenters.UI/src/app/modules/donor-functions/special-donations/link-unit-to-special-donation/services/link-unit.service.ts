import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  PatientModel,
  PatientQueryParams,
  PatientListResponse,
  PatientDetail,
  ShipLocationOption
} from '../models/patient.model';
import {
  SpecialDonorModel,
  DonorSelectionModel,
  LinkedUnitModel,
  LinkUnitRequest,
  UnlinkUnitRequest,
  LinkUnitResponse,
  CreateDonorRequest,
  SpecialUnitQueryDto,
  SpecialUnitListItemDto,
  SpecialUnit,
  DirectedDonorDto,
  DirectedDonorDetailDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ValidateScanUnitRequestDto,
  ValidateScanUnitResponseDto,
  DonorDemographicsDto,
  LinkUnitRequestDto,
  LinkUnitValidationResponseDto,
  ReturnResult
} from '../models/special-donor.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

/**
 * Service for Link Unit to Special Donation functionality
 */
@Injectable({
  providedIn: 'root'
})
export class LinkUnitService {
  private apiService = inject(ApiService);

  /**
   * Get patients list with filtering and search
   */
  getPatients(params: PatientQueryParams, take: number = 25, skip: number = 0): Observable<PatientListResponse> {
    const queryDto: SpecialUnitQueryDto = {
      patId: null,
      surgId: null,
      status: this.mapStatusToApi(params.status),
      searchKeyword: params.searchText || null,
      sortColumn: params.sortColumn || null,
      sortOrder: (params.sortOrder as 'ASC' | 'DESC') || null,
      surgeryDate: params.surgeryDate || null,
      surgeryDatePeriod: params.surgeryDatePeriod || null,
      neededByDate: params.neededByDate || null,
      neededByDatePeriod: params.neededByDatePeriod || null
    };

    const url = API.SPECIAL_UNITS.GET_ALL(take, skip);

    return this.apiService.post<ReturnResult<SpecialUnitListItemDto>>(url, queryDto).pipe(
      map(response => {
        const patients = (response.data || []).map(p => this.mapApiItemToPatientModel(p));
        return {
          data: patients,
          totalCount: response.total || 0
        };
      })
    );
  }


  /**
   * Get patient by ID
   * Note: The API doesn't have a separate patient detail endpoint.
   * Patient info is already available from the main grid (SpecialUnitListItemDto).
   */
  getPatientById(patId: string, surgId: string, chapterId: string): Observable<PatientDetail | null> {
    const queryDto: SpecialUnitQueryDto = {
      patId: patId,
      surgId: surgId,
      status: null,
      searchKeyword: null,
      sortColumn: null,
      sortOrder: null,
      surgeryDate: null,
      surgeryDatePeriod: null,
      neededByDate: null,
      neededByDatePeriod: null
    };

    const url = API.SPECIAL_UNITS.GET_ALL(1, 0);

    return this.apiService.post<ReturnResult<SpecialUnitListItemDto>>(url, queryDto).pipe(
      map(response => {
        const item = response.data?.[0];
        if (!item) return null;
        const nameParts = (item.patientName || '').split(', ');
        return {
          patId: item.patId,
          patLastName: nameParts[0] || '',
          patFirstName: nameParts[1] || '',
          dateOfBirth: item.dob,
          sex: item.sex,
          surgId: item.surgId,
          surgDate: item.surgeryDate,
          surgeryDay: '',
          patTypeDescription: item.patTypeDesc || '',
          phoneNumber: undefined
        } as PatientDetail;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Get special donors (directed donors) for a patient
   * GET /special-units/donors/{patId}/{surgId}
   */
  getSpecialDonors(patId: string, surgId: string, chapterId: string): Observable<SpecialDonorModel[]> {
    const url = API.SPECIAL_UNITS.GET_DONORS(patId, surgId);

    return this.apiService.get<ReturnResult<DirectedDonorDto>>(url, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [404])
    }).pipe(
      map(response => {
        return (response.data || []).map(d => ({
          donorNumber: d.seqNo,
          firstName: d.firstName,
          lastName: d.lastName,
          phoneNumber: d.phone || undefined,
          internationalPhone: d.intlPhone || undefined
        }));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get linked units for a patient
   * GET /special-units/linked-units/{patId}/{surgId}
   */
  getLinkedUnits(patId: string, surgId: string, chapterId: string): Observable<LinkedUnitModel[]> {
    const url = API.SPECIAL_UNITS.GET_LINKED_UNITS(patId, surgId);

    return this.apiService.get<ReturnResult<SpecialUnit>>(url, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [404])
    }).pipe(
      map(response => {
        return (response.data || []).map(u => ({
          unitId: u.unitId,
          displayUnitId: u.displayUnitId || u.unitId,
          collectionDate: u.collDate,
          seqNo: u.seqNo,
          consigneeId: u.consigneeId || undefined,
          shipDate: u.shipDate || undefined
        }));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get directed donor detail
   * GET /special-units/donors/{patId}/{surgId}/{seqNo}
   */
  getDonorDetail(patId: string, surgId: string, seqNo: number): Observable<DirectedDonorDetailDto | null> {
    const url = API.SPECIAL_UNITS.GET_DONOR_DETAIL(patId, surgId, seqNo);

    return this.apiService.get<ReturnResult<DirectedDonorDetailDto>>(url).pipe(
      map(response => {
        return response.item || null;
      })
    );
  }

  /**
   * Validate unit and get collection date
   * POST /special-units/validate-unit
   */
  validateUnit(unitId: string, chapterId: string): Observable<ValidateUnitResponseDto> {
    const requestDto: ValidateUnitRequestDto = {
      unitId,
      chapterId
    };

    const url = API.SPECIAL_UNITS.VALIDATE_UNIT;

    return this.apiService.post<ValidateUnitResponseDto>(url, requestDto);
  }

  /**
   * Validate scanned unit — combined registration check + demographics + business validations
   * POST /special-units/validate-scan-unit
   */
  validateScanUnit(unitId: string, patId: string, surgId: string, seqNo: number): Observable<ReturnResult<ValidateScanUnitResponseDto>> {
    const dto: ValidateScanUnitRequestDto = { unitId, patId, surgId, seqNo };
    const url = API.SPECIAL_UNITS.VALIDATE_SCAN_UNIT;
    return this.apiService.post<ReturnResult<ValidateScanUnitResponseDto>>(url, dto);
  }

  /**
   * Get donor demographics by unit and collection date
   * GET /special-units/donor-demographics/{unitId}/{collDate}
   */
  getDonorDemographics(unitId: string, collDate: string): Observable<DonorDemographicsDto | null> {
    const url = API.SPECIAL_UNITS.GET_DONOR_DEMOGRAPHICS(unitId, collDate);

    return this.apiService.get<ReturnResult<DonorDemographicsDto>>(url).pipe(
      map(response => {
        return response.item || null;
      })
    );
  }

  /**
   * Search for donors (for dropdown)
   */
  searchDonors(searchText: string): Observable<DonorSelectionModel[]> {
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  /**
   * Get ship location options for filter dropdown
   * Note: This is derived from the shipTo field in the main grid data.
   * No separate lookup endpoint is currently used.
   */
  getShipLocations(): Observable<ShipLocationOption[]> {
    return of([]);
  }

  /**
   * Link a unit to a patient
   * POST /special-units/link
   *
   * Two-pass flow:
   * 1. First call with overrideWarnings = false
   * 2. If warnings returned, show to user and allow override
   * 3. Re-call with overrideWarnings = true if user confirms
   */
  linkUnit(request: LinkUnitRequest): Observable<LinkUnitResponse> {
    const dto: LinkUnitRequestDto = {
      patId: request.patientId,
      surgId: request.surgId,
      seqNo: request.seqNo,
      unitId: request.unitId,
      collDate: request.collectionDate,
      consigneeId: request.consigneeId || null,
      shipDate: request.shipDate || null,
      overrideWarnings: request.overrideWarnings || false
    };

    const url = API.SPECIAL_UNITS.LINK_UNIT;

    return this.apiService.post<ReturnResult<LinkUnitValidationResponseDto | boolean>>(url, dto).pipe(
      map(response => {
        const linkResponse: LinkUnitResponse = {
          success: response.success,
          message: response.message || '',
          statusCode: response.statusCode,
          item: response.item
        };

        return linkResponse;
      })
    );
  }

  /**
   * Unlink a unit from a patient
   * DELETE /special-units/unlink/{patId}/{surgId}/{seqNo}/{unitId}/{collDate}
   *
   * Show confirmation dialog ("Do you really want to unlink?") BEFORE calling this.
   */
  unlinkUnit(request: UnlinkUnitRequest): Observable<LinkUnitResponse> {
    // Format collection date as YYYY-MM-DD
    const formattedCollDate = request.collectionDate.split('T')[0];

    const url = API.SPECIAL_UNITS.UNLINK_UNIT(
      request.patientId,
      request.surgId,
      request.seqNo,
      request.unitId,
      formattedCollDate
    );

    return this.apiService.delete<ReturnResult<boolean>>(url).pipe(
      map(response => {
        const unlinkResponse: LinkUnitResponse = {
          success: response.success,
          message: response.message || '',
          statusCode: response.statusCode,
          item: response.item
        };

        return unlinkResponse;
      })
    );
  }

  /**
   * Create a new directed donor
   * POST /special-units/donors
   */
  createDonor(request: CreateDonorRequest): Observable<ReturnResult<any>> {
    const url = API.SPECIAL_UNITS.CREATE_DONOR;
    return this.apiService.post<ReturnResult<any>>(url, request);
  }

  /**
   * Map UI status to API status
   */
  private mapStatusToApi(status?: string): 'A' | 'I' | 'B' | null {
    if (!status) return 'B'; // Default to Both

    switch (status.toLowerCase()) {
      case 'active':
        return 'A';
      case 'closed':
        return 'I';
      default:
        return 'B';
    }
  }

  /**
   * Map API SpecialUnitListItemDto to UI PatientModel
   */
  private mapApiItemToPatientModel(item: SpecialUnitListItemDto): PatientModel {
    return {
      patientId: item.patId,
      patientName: item.patientName,
      dateOfBirth: item.dob,
      sex: item.sex,
      surgeryDate: item.surgeryDate,
      neededBy: item.dateNeededBy,
      shipTo: item.shipTo,
      status: item.status === 'A' ? 'Active' : 'Closed',
      surgId: item.surgId
    };
  }
}
