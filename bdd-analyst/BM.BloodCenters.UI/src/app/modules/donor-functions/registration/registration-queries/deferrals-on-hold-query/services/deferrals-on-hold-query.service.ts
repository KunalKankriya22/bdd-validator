import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import {
  ReturnResult,
  DeferralHoldModel,
  DeferralHoldQueryDto,
  DonorInterdictionModel,
  DonationInterdictionModel,
  LookupDto,
  ApiDeferralHoldSearchParamDto,
  ApiDeferralHoldDto,
  ApiDonorInterdictionDto,
  ApiDonationInterdictionDto,
  ApiDriveLovDto,
  ApiUserLovDto,
  ApiTransactionLovDto,
  ApiInterdictionCodeLovDto,
  ApiDeferralLovDto,
  ApiSetLovDto,
} from '../models/deferrals-on-hold-query.model';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from '../../../../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class DeferralsOnHoldQueryService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  private getHeaders(): HttpHeaders {
    const chapterId = this.headerService.chapterId();
    return new HttpHeaders({
      'X-Chapter-Id': chapterId,
    });
  }

  searchDeferralHolds(
    take: number,
    skip: number,
    queryDto: DeferralHoldQueryDto
  ): Observable<{ data: DeferralHoldModel[]; total: number }> {
    const apiRequest = this.buildApiSearchParams(queryDto);
    return this.apiService
      .post<ReturnResult<ApiDeferralHoldDto>>(
        API.DEFERRAL_HOLD.SEARCH(take, skip),
        apiRequest,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => ({
          data: (response.data || []).map((dto) => this.mapDeferralHoldResponse(dto)),
          total: response.total || 0,
        })),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  getDonorInterdictions(
    transactionId: string,
    activeOnly: boolean = false
  ): Observable<DonorInterdictionModel[]> {
    return this.apiService
      .get<ReturnResult<ApiDonorInterdictionDto>>(
        API.DEFERRAL_HOLD.DONOR_INTERDICTIONS(transactionId, activeOnly),
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => this.mapDonorInterdictionResponse(dto))
        ),
        catchError((error) => throwError(() => error))
      );
  }

  getDonationInterdictions(
    transactionId: string,
    activeOnly: boolean = false
  ): Observable<DonationInterdictionModel[]> {
    return this.apiService
      .get<ReturnResult<ApiDonationInterdictionDto>>(
        API.DEFERRAL_HOLD.DONATION_INTERDICTIONS(transactionId, activeOnly),
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => this.mapDonationInterdictionResponse(dto))
        ),
        catchError((error) => throwError(() => error))
      );
  }

  getDrivesLov(fromDate?: string, toDate?: string): Observable<LookupDto[]> {
    const url = this.buildUrlWithParams(API.DEFERRAL_HOLD.LOOKUPS.DRIVES, { fromDate, toDate });
    return this.apiService
      .get<ReturnResult<ApiDriveLovDto>>(url, { headers: this.getHeaders() })
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => ({
            code: dto.driveId,
            description: dto.sponsorName ? `${dto.driveId} - ${dto.sponsorName}` : dto.driveId,
          }))
        ),
        catchError(() => of([]))
      );
  }

  getUsersLov(fromDate?: string, toDate?: string, driveId?: string): Observable<LookupDto[]> {
    const url = this.buildUrlWithParams(API.DEFERRAL_HOLD.LOOKUPS.USERS, { fromDate, toDate, driveId });
    return this.apiService
      .get<ReturnResult<ApiUserLovDto>>(url, { headers: this.getHeaders() })
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => ({
            code: dto.userId,
            description: (() => {
              const cleaned = dto.userName?.replace(/^[\s,\-]+|[\s,\-]+$/g, '');
              return cleaned ? `${dto.userId} - ${cleaned}` : dto.userId;
            })(),
          }))
        ),
        catchError(() => of([]))
      );
  }

  getTransactionsLov(fromDate?: string, toDate?: string, driveId?: string): Observable<LookupDto[]> {
    const url = this.buildUrlWithParams(API.DEFERRAL_HOLD.LOOKUPS.TRANSACTIONS, { fromDate, toDate, driveId });
    return this.apiService
      .get<ReturnResult<ApiTransactionLovDto>>(url, { headers: this.getHeaders() })
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => ({
            code: dto.transactionId,
            description: dto.collDate ? `${dto.transactionId} - ${dto.collDate}` : dto.transactionId,
          }))
        ),
        catchError(() => of([]))
      );
  }

  getDeferralsLov(fromDate?: string, toDate?: string, driveId?: string): Observable<LookupDto[]> {
    const url = this.buildUrlWithParams(API.DEFERRAL_HOLD.LOOKUPS.DEFERRALS, { fromDate, toDate, driveId });
    return this.apiService
      .get<ReturnResult<ApiDeferralLovDto>>(url, { headers: this.getHeaders() })
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => ({
            code: dto.deferralId,
            description: dto.deferralId,
          }))
        ),
        catchError(() => of([]))
      );
  }

  getSetsLov(fromDate?: string, toDate?: string): Observable<LookupDto[]> {
    const url = this.buildUrlWithParams(API.DEFERRAL_HOLD.LOOKUPS.SETS, { fromDate, toDate });
    return this.apiService
      .get<ReturnResult<ApiSetLovDto>>(url, { headers: this.getHeaders() })
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => ({
            code: dto.setId,
            description: dto.setId,
          }))
        ),
        catchError(() => of([]))
      );
  }

  getInterdictionCodesLov(): Observable<LookupDto[]> {
    return this.apiService
      .get<ReturnResult<ApiInterdictionCodeLovDto>>(
        API.DEFERRAL_HOLD.LOOKUPS.INTERDICTION_CODES,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) =>
          (response.data || []).map((dto) => ({
            code: dto.interCode,
            description: dto.interDesc,
          }))
        ),
        catchError(() => of([]))
      );
  }

  private buildApiSearchParams(queryDto: DeferralHoldQueryDto): ApiDeferralHoldSearchParamDto {
    return {
      fromDate: queryDto.driveDateFrom || undefined,
      toDate: queryDto.driveDateTo || undefined,
      driveId: queryDto.driveId || undefined,
      setId: queryDto.batchId || undefined,
      deferralId: queryDto.deferralId || undefined,
      transactionId: queryDto.transactionId || undefined,
      userId: queryDto.userId || undefined,
      interCode: queryDto.interdictionCode || undefined,
      sortColumn: queryDto.sortBy ? this.mapSortColumn(queryDto.sortBy) : undefined,
      sort: queryDto.sortDirection ? this.mapSortDirection(queryDto.sortDirection) : undefined,
    };
  }

  private mapSortColumn(column: string): string {
    const columnMap: Record<string, string> = {
      deferralId: 'DeferralId',
      transactionId: 'TransactionId',
      driveId: 'DriveId',
      donorId: 'DonorId',
      collDate: 'CollDate',
      donationType: 'DonationType',
      procedureCode: 'ProcedureCode',
      user: 'InsertUser',
      dateTimeOfRegistration: 'InsertDate',
      auditComplete: 'NAuditFlag',
    };
    return columnMap[column] || column;
  }

  private mapSortDirection(direction: string): string {
    if (direction === 'DESC' || direction === 'D') return 'D';
    return 'A';
  }

  private mapDeferralHoldResponse(dto: ApiDeferralHoldDto): DeferralHoldModel {
    return {
      deferralId: dto.deferralId,
      transactionId: dto.transactionId,
      batchId: dto.setId ?? '',
      driveId: dto.driveId,
      donorId: dto.donorId,
      collDate: dto.collDate ?? '',
      donorName: dto.donorName ?? '',
      donationType: dto.donationType,
      procedureCode: dto.procedureCode,
      user: dto.insertUser,
      dateTimeOfRegistration: dto.insertDate ?? '',
      auditComplete: dto.nAuditFlag,
    };
  }

  private mapDonorInterdictionResponse(dto: ApiDonorInterdictionDto): DonorInterdictionModel {
    return {
      type: dto.interType,
      code: dto.interCode,
      description: dto.interDescription,
      originatedFrom: dto.originatedFrom,
      entryDate: dto.insertDate ?? '',
      effectiveDate: dto.effDate ?? '',
      terminationDate: dto.termDate ?? '',
    };
  }

  private mapDonationInterdictionResponse(dto: ApiDonationInterdictionDto): DonationInterdictionModel {
    return {
      type: dto.interType,
      code: dto.interCode,
      description: dto.reason,
      entryDate: dto.insertDate ?? '',
      terminationDate: dto.termDate ?? '',
      comment: dto.comments,
    };
  }

  private buildUrlWithParams(baseUrl: string, params: Record<string, string | undefined>): string {
    const queryParts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        queryParts.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
    return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl;
  }
}
