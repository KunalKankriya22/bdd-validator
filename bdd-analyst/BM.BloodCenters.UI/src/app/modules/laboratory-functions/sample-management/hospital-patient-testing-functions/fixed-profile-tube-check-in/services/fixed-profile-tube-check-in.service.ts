import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  FixedProfileTubeCheckinDto,
  CreateTubeCheckinRequestDto,
  UpdateTubeCheckinRequestDto,
  TubeCheckinQueryDto,
  ContractDropdownDto,
  BatchDropdownDto,
  ContractOption,
  BatchCheckinRequestDto,
  BatchCheckinResponseDto,
} from '../models/fixed-profile-tube-check-in.model';

@Injectable({
  providedIn: 'root',
})
export class FixedProfileTubeCheckInService {
  private readonly http = inject(HttpClient);

  getAll(
    take: number,
    skip: number,
    query: TubeCheckinQueryDto
  ): Observable<ReturnResult<FixedProfileTubeCheckinDto[]>> {
    return this.http.post<ReturnResult<FixedProfileTubeCheckinDto[]>>(
      API.FIXED_PROFILE_TUBES.LIST(take, skip),
      query
    );
  }

  getById(osUnitId: string): Observable<ReturnResult<FixedProfileTubeCheckinDto>> {
    return this.http.get<ReturnResult<FixedProfileTubeCheckinDto>>(
      API.FIXED_PROFILE_TUBES.GET_BY_ID(osUnitId)
    );
  }

  create(dto: CreateTubeCheckinRequestDto): Observable<ReturnResult<any>> {
    return this.http.post<ReturnResult<any>>(
      API.FIXED_PROFILE_TUBES.CREATE,
      dto
    );
  }

  update(osUnitId: string, dto: UpdateTubeCheckinRequestDto): Observable<ReturnResult<any>> {
    return this.http.put<ReturnResult<any>>(
      API.FIXED_PROFILE_TUBES.UPDATE(osUnitId),
      dto
    );
  }

  deleteRecord(osUnitId: string): Observable<ReturnResult<any>> {
    return this.http.delete<ReturnResult<any>>(
      API.FIXED_PROFILE_TUBES.DELETE(osUnitId)
    );
  }

  getContracts(): Observable<ContractOption[]> {
    return this.http
      .get<ReturnResult<ContractDropdownDto[]>>(API.FIXED_PROFILE_TUBES.CONTRACTS)
      .pipe(
        map((response) =>
          (response.data || []).map((c) => ({
            contractId: c.contractId,
            description: c.company,
            redTubeAvailable: c.redTubeAvailable ?? true,
            red2TubeAvailable: c.red2TubeAvailable ?? true,
            purpleTubeAvailable: c.purpleTubeAvailable ?? true,
            purple2TubeAvailable: c.purple2TubeAvailable ?? true,
          }))
        )
      );
  }

  getBatches(contractId: string): Observable<BatchDropdownDto[]> {
    const params = new HttpParams().set('contractId', contractId);
    return this.http
      .get<ReturnResult<BatchDropdownDto[]>>(API.FIXED_PROFILE_TUBES.BATCHES, { params })
      .pipe(map((response) => response.data || []));
  }

  /**
   * NEW API: Batch check-in with BATCH_INPUTS header and UTRS test scheduling
   * POST /api/v1/fixed-profile-tube-checkin/checkin
   *
   * Benefits over old create() method:
   * - Auto-generates batch ID (MMDDYY-TS####)
   * - Creates BATCH_INPUTS header record
   * - Automatically schedules all contract tests in UTRS
   * - Supports multiple units in single atomic transaction
   * - Links orphaned records (UTRS, UNIT_INTERDICTIONS)
   */
  batchCheckin(request: BatchCheckinRequestDto): Observable<BatchCheckinResponseDto> {
    return this.http.post<BatchCheckinResponseDto>(
      API.FIXED_PROFILE_TUBE_CHECKIN.CHECKIN,
      request
    );
  }
}
