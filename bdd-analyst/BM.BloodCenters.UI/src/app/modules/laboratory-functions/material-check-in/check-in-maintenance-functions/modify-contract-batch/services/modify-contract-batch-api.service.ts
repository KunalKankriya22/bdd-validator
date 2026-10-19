import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  QueryContractBatchRequestDto,
  QueryContractBatchResponseDto,
  ValidateContractRequestDto,
  ValidateContractResponseDto,
  ModifyContractBatchRequestDto,
  ModifyContractBatchResponseDto,
  ContractOption,
  BatchOption,
  ProfileSetOption,
  ReceivedDateOption,
} from '../models/modify-contract-batch.model';

interface ApiResponse<T> {
  success?: boolean;
  data?: T[];
  item?: T;
  message?: string;
  total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ModifyContractBatchApiService {
  private readonly http = inject(HttpClient);

  getContractOptions(): Observable<ContractOption[]> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.CONTRACTS}`;
    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => (response.data || []).map((c: any) => ({
        contractId: c.contractId || c.ContractId,
        description: c.company || c.Company || '',
        contractType: c.contractType || c.ContractType || '',
      }))),
    );
  }

  getReceivedDates(contractId: string): Observable<ReceivedDateOption[]> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.RECEIVED_DATES}`;
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<ApiResponse<any>>(url, { params }).pipe(
      map((response) => (response.data || []).map((d: any) => ({
        receivedDate: this.parseDate(d.receivedDate || d.ReceivedDate),
      }))),
    );
  }

  getBatchOptions(contractId: string, receivedDate?: Date, contractType?: string, profileSetId?: string): Observable<BatchOption[]> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.BATCHES}`;
    let params = new HttpParams().set('contractId', contractId);
    if (receivedDate) params = params.set('receivedDate', this.serializeDate(receivedDate));
    if (contractType) params = params.set('contractType', contractType);
    if (profileSetId) params = params.set('profileSetId', profileSetId);
    return this.http.get<ApiResponse<any>>(url, { params }).pipe(
      map((response) => (response.data || []).map((b: any) => ({
        batchId: b.batchId || b.BatchId,
      }))),
    );
  }

  getProfileSetOptions(contractId: string): Observable<ProfileSetOption[]> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.PROFILE_SETS}`;
    const params = new HttpParams().set('contractId', contractId);
    return this.http.get<ApiResponse<any>>(url, { params }).pipe(
      map((response) => (response.data || []).map((p: any) => ({
        profileSetId: p.profileSetId || p.ProfileSetId,
        description: p.profileDesc || p.ProfileDesc || '',
      }))),
    );
  }

  getContractTests(contractId: string, contractType?: string, profileSetId?: string): Observable<string[]> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.CONTRACT_TESTS}`;
    let params = new HttpParams().set('contractId', contractId);
    if (contractType) params = params.set('contractType', contractType);
    if (profileSetId) params = params.set('profileSetId', profileSetId);
    return this.http.get<ApiResponse<string>>(url, { params }).pipe(
      map((response) => response.data || []),
    );
  }

  queryContractBatch(request: QueryContractBatchRequestDto): Observable<QueryContractBatchResponseDto> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.QUERY}`;
    const payload = {
      oldContractId: request.oldContractId,
      oldBatchId: request.oldBatchId,
      oldRcvdCollDate: this.serializeDate(request.oldRcvdCollDate),
    };

    return this.http.post<ApiResponse<any>>(url, payload).pipe(
      map((response) => {
        const data = response.data?.[0] || ({} as any);
        return {
          oldContractId: data.oldContractId || data.OldContractId || request.oldContractId,
          oldBatchId: data.oldBatchId || data.OldBatchId || request.oldBatchId,
          oldRcvdCollDate: data.oldRcvdCollDate ? this.parseDate(data.oldRcvdCollDate || data.OldRcvdCollDate) : request.oldRcvdCollDate,
          oldContractType: data.oldContractType || data.OldContractType || '',
          oldProfileSetId: data.oldProfileSetId || data.OldProfileSetId || '',
          oldContractDescription: data.oldContractDescription || '',
          units: (data.units || data.Units || []).map((u: any) => ({
            unitId: u.unitId || u.UnitId,
            osUnitId: u.osUnitId || u.OsUnitId || u.unitId || u.UnitId,
            collDate: (u.collDate || u.CollDate) ? this.parseDate(u.collDate || u.CollDate) : null,
            contractId: u.contractId || u.ContractId,
            batchId: u.batchId || u.BatchId,
            receivedDate: u.receivedDate ? this.parseDate(u.receivedDate || u.ReceivedDate) : null,
            chapterId: u.chapterId || u.ChapterId || '',
            changeFlag: u.changeFlag || u.ChangeFlag || 'N',
            oldProfile: u.oldProfile || u.OldProfile || '',
            newProfile: u.newProfile || u.NewProfile || '',
            externalUnitId: u.osUnitId || u.OsUnitId || null,
            internalUnitId: u.unitId || u.UnitId,
          })),
          totalUnits: data.units?.length || 0,
        } as QueryContractBatchResponseDto;
      }),
    );
  }

  validateContract(request: ValidateContractRequestDto): Observable<ValidateContractResponseDto> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.VALIDATE}`;
    const payload = {
      newContractId: request.newContractId,
      newBatchId: request.newBatchId,
      newRcvdCollDate: this.serializeDate(request.newRcvdCollDate),
      newContractType: request.newContractType,
    };

    return this.http.post<ApiResponse<any>>(url, payload).pipe(
      map((response) => {
        const data = response.data?.[0] || ({} as any);
        return {
          isValid: data.isValid ?? data.IsValid ?? false,
          profileSetId: data.profileSetId || data.ProfileSetId || '',
          contractType: data.contractType || data.ContractType || '',
          contractDescription: data.contractDescription || data.ContractDescription || '',
          message: data.message || data.Message || '',
        } as ValidateContractResponseDto;
      }),
    );
  }

  modifyContractBatch(request: ModifyContractBatchRequestDto): Observable<ModifyContractBatchResponseDto> {
    const url = `${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.MODIFY}`;
    const payload = {
      oldContractInfo: {
        ...request.oldContractInfo,
        oldRcvdCollDate: this.serializeDate(request.oldContractInfo.oldRcvdCollDate),
      },
      newContractInfo: {
        ...request.newContractInfo,
        newRcvdCollDate: this.serializeDate(request.newContractInfo.newRcvdCollDate),
      },
      units: request.units.map((unit) => ({
        ...unit,
        collDate: this.serializeDate(unit.collDate),
      })),
    };

    return this.http.post<ApiResponse<any>>(url, payload).pipe(
      map((response) => {
        const data = response.data?.[0] || ({} as any);
        return {
          success: data.success ?? data.Success ?? false,
          message: data.message || data.Message || '',
          generatedBatchId: data.newBatchId || data.NewBatchId || '',
          unitsModified: data.unitsModified ?? data.UnitsModified ?? 0,
          unitsSkipped: 0,
          warnings: data.warnings || [],
        } as ModifyContractBatchResponseDto;
      }),
    );
  }

  private serializeDate(date: Date | string): string {
    return moment(date).format('YYYY-MM-DD');
  }

  private parseDate(value: Date | string): Date {
    const m = moment(value);
    return m.isValid() ? m.toDate() : new Date(value);
  }
}
