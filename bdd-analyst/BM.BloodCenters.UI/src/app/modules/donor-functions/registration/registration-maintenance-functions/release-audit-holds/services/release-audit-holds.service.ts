import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import moment from 'moment';
import {
  AuditHoldRecord,
  AuditHoldsParamsDto,
  AuditHoldsResponse,
  HoldDetails,
  HoldDetailRecord,
  DropdownOption,
  ReturnResult,
  DonationUnit,
  GetHoldsRequest,
  HoldRecord,
  PlaceHoldRequest,
  RemoveHoldRequest,
  InterdictionCode,
  DeferDonorConfig,
  GetHoldCommentsRequest,
  HoldCommentsResponse,
  HoldDetailsRequest,
  HoldDetailApiRecord,
  HoldDetailApiResponse
} from '../models/release-audit-holds.model';
import { ApiService } from '@shared/services/api.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';

/**
 * Service for managing release audit holds
 */
@Injectable({
  providedIn: 'root'
})
export class ReleaseAuditHoldsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get donation unit details by unit ID
   */
  getDonationUnit(unitId: string): Observable<ReturnResult<DonationUnit>> {
    return this.apiService.get<ReturnResult<DonationUnit>>(
      API.RELEASE_AUDIT_HOLDS.GET_UNIT(unitId)
    ).pipe(
      catchError(error => {

        return throwError(() => error);
      })
    );
  }

  /**
   * Get audit holds with pagination and filtering
   */
  getAuditHolds(params: AuditHoldsParamsDto): Observable<AuditHoldsResponse> {
    const request: GetHoldsRequest = {
      startDate: params.fromCollectionDate || '',
      endDate: params.toCollectionDate || '',
      unitId: params.unitId,
      donationType: params.donationType,
      procedureCode: params.donationProcedure,
      auditHoldType: params.auditHoldType,
      collectionDate: params.collectionDate,
      searchText: params.searchKeyword,
      sortDirection: params.sort?.endsWith(':desc') ? 'DESC' : 'ASC'
    };

    return this.apiService.post<ReturnResult<HoldRecord>>(
      API.RELEASE_AUDIT_HOLDS.GET_HOLDS,
      request
    ).pipe(
      map(response => {
        const formatDate = (d: string | null | undefined): string => {
          return d ? DateFieldValidationUtility.formatDateForUI(moment(d)).toUpperCase() : '';
        };

        const data: AuditHoldRecord[] = (response.data || []).map(hold => ({
          unitId: hold.unitId,
          collectionDate: formatDate(hold.collDate),
          name: hold.donorName ? hold.donorName.replace(/,/g, '') : '',
          dateOfBirth: formatDate(hold.dateOfBirth),
          sex: hold.gender,
          donorId: hold.donorId,
          donationType: hold.donationType,
          donationProcedure: hold.procedureCode,
          hold: hold.interCode,
          origin: hold.originatedFrom,
          reason: hold.reasonCode,
          removed: hold.termDate ? 'X' : null,
          transactionId: hold.transactionId,
          interDescription: hold.interDescription,
          groupId: hold.groupId,
          groupMode: hold.groupMode,
          sourceCode: hold.sourceCode,
          holdSource: hold.holdSource,
          effectiveDate: formatDate(hold.effectiveDate),
          insertDate: formatDate(hold.insertDate),
          termDate: hold.termDate ? formatDate(hold.termDate) : null,
          releaseUser: hold.releaseUser || null
        }));

        return {
          data,
          totalRecords: data.length,
          pageIndex: 0,
          pageSize: data.length
        };
      }),
      catchError(error => {

        return throwError(() => error);
      })
    );
  }

  /**
   * Place a hold on a unit
   */
  placeHold(unitId: string, request: PlaceHoldRequest): Observable<ReturnResult<any>> {
    return this.apiService.post<ReturnResult<any>>(
      API.RELEASE_AUDIT_HOLDS.PLACE_HOLD(unitId),
      request
    ).pipe(
      catchError(error => {

        return throwError(() => error);
      })
    );
  }

  /**
   * Remove a hold from a unit
   */
  removeHold(unitId: string, request: RemoveHoldRequest): Observable<ReturnResult<void>> {
    return this.apiService.post<ReturnResult<void>>(
      API.RELEASE_AUDIT_HOLDS.REMOVE_HOLD(unitId),
      request
    ).pipe(
      catchError(error => {

        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction codes (LOV)
   */
  getInterdictionCodes(): Observable<DropdownOption[]> {
    return this.apiService.get<ReturnResult<InterdictionCode>>(
      API.RELEASE_AUDIT_HOLDS.GET_INTERDICTION_CODES
    ).pipe(
      map(response => {
        return (response.data || []).map(code => ({
          value: code.code,
          label: code.description
        }));
      }),
      catchError(error => {

        return of([]);
      })
    );
  }

  /**
   * Build hold details from loaded audit hold records (no API call needed).
   * Segments records by holdSource into unit holds and donor holds.
   */
  buildHoldDetails(
    allRecords: AuditHoldRecord[],
    unitId: string,
    collectionDate: string | Date
  ): HoldDetails {
    const matchingRecords = allRecords.filter(
      r => r.unitId === unitId
    );

    const unitHoldRecords = matchingRecords
      .filter(r => r.holdSource !== 'DONOR')
      .map(r => this.mapToHoldDetailRecord(r));

    const donorHoldRecords = matchingRecords
      .filter(r => r.holdSource === 'DONOR')
      .map(r => this.mapToHoldDetailRecord(r));

    return {
      unitHolds: {
        unitId,
        collectionDate,
        holds: unitHoldRecords
      },
      donorHolds: {
        unitId,
        collectionDate,
        holds: donorHoldRecords
      }
    };
  }

  private mapToHoldDetailRecord(record: AuditHoldRecord): HoldDetailRecord {
    return {
      type: record.hold,
      code: record.reason,
      description: record.interDescription,
      unitId: record.unitId || null,
      displayUnitId: null,
      entryDate: record.insertDate,
      effectiveDate: record.effectiveDate,
      terminationDate: record.termDate,
      insUser: null,
      relDate: null,
      relUser: record.releaseUser,
      comments: null
    };
  }

  getDonationTypes(request: GetHoldsRequest): Observable<DropdownOption[]> {
    return this.apiService.post<ReturnResult<InterdictionCode>>(
      API.RELEASE_AUDIT_HOLDS.GET_DONATION_TYPES,
      request
    ).pipe(
      map(response => {
        return (response.data || []).map(item => ({
          value: item.code,
          label: item.description
        }));
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getDonationProcedures(request: GetHoldsRequest): Observable<DropdownOption[]> {
    return this.apiService.post<ReturnResult<InterdictionCode>>(
      API.RELEASE_AUDIT_HOLDS.GET_DONATION_PROCEDURES,
      request
    ).pipe(
      map(response => {
        return (response.data || []).map(item => ({
          value: item.code,
          label: item.description
        }));
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getAuditHoldTypes(request: GetHoldsRequest): Observable<DropdownOption[]> {
    return this.apiService.post<ReturnResult<InterdictionCode>>(
      API.RELEASE_AUDIT_HOLDS.GET_AUDIT_HOLD_TYPES,
      request
    ).pipe(
      map(response => {
        return (response.data || []).map(item => ({
          value: item.code,
          label: item.description
        }));
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Get defer donor configuration including dropdown options and default dates
   */
  getDeferDonorConfig(collDate: string): Observable<DeferDonorConfig> {
    return this.apiService.get<ReturnResult<DeferDonorConfig>>(
      API.RELEASE_AUDIT_HOLDS.GET_DEFER_DONOR_CONFIG(collDate)
    ).pipe(
      map(response => {
        const config = response.item || (response.data && response.data[0]);
        if (!config) {
          return {
            isDeferDonorEnabled: false,
            options: [],
            defaultTermDate: '',
            defaultEffDateOk: '',
            defaultEffDateNft: ''
          };
        }
        return config;
      }),
      catchError(error => {
        return of({
          isDeferDonorEnabled: false,
          options: [],
          defaultTermDate: '',
          defaultEffDateOk: '',
          defaultEffDateNft: ''
        });
      })
    );
  }

  getHoldComments(unitId: string, request: GetHoldCommentsRequest): Observable<ReturnResult<HoldCommentsResponse>> {
    return this.apiService.post<ReturnResult<HoldCommentsResponse>>(
      API.RELEASE_AUDIT_HOLDS.GET_HOLD_COMMENTS(unitId),
      request
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getUnitHolds(request: HoldDetailsRequest): Observable<HoldDetailRecord[]> {
    return this.apiService.post<HoldDetailApiResponse>(
      API.RELEASE_AUDIT_HOLDS.GET_UNIT_HOLDS,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map(response => (response.data || []).map(item => this.mapApiToHoldDetailRecord(item))),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getDonorHolds(request: HoldDetailsRequest): Observable<HoldDetailRecord[]> {
    return this.apiService.post<HoldDetailApiResponse>(
      API.RELEASE_AUDIT_HOLDS.GET_DONOR_HOLDS,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map(response => (response.data || []).map(item => this.mapApiToHoldDetailRecord(item))),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private mapApiToHoldDetailRecord(item: HoldDetailApiRecord): HoldDetailRecord {
    return {
      type: item.interType,
      code: item.interCode,
      description: item.description,
      unitId: item.unitId || null,
      displayUnitId: item.displayUnitId || null,
      entryDate: item.entryDate || '',
      effectiveDate: item.effDate || '',
      terminationDate: item.terminationDate || null,
      insUser: item.insertUser || null,
      relDate: item.releaseDate || null,
      relUser: item.releaseUser || null,
      comments: item.comments || null
    };
  }

}
