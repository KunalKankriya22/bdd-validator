import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReturnResult,
  CodeTypeDto,
  UserGroupDto,
  EquipmentMasterCodeDto,
  CreateEquipmentMasterCodeRequest,
  UpdateEquipmentMasterCodeRequest,
  EquipmentMasterCodeFilter,
} from '../models/equipment-master-code.model';

@Injectable({ providedIn: 'root' })
export class EquipmentMasterCodeService {
  private readonly apiService = inject(ApiService);

  getCodeTypes(): Observable<CodeTypeDto[]> {
    return this.apiService
      .get<ReturnResult<CodeTypeDto>>(API.EQUIPMENT_MASTER_CODES.CODE_TYPES)
      .pipe(
        map(r => r.data ?? []),
        catchError(err => throwError(() => err)),
      );
  }

  getUserGroups(): Observable<UserGroupDto[]> {
    return this.apiService
      .get<ReturnResult<UserGroupDto>>(API.EQUIPMENT_MASTER_CODES.USER_GROUPS)
      .pipe(
        map(r => r.data ?? []),
        catchError(err => throwError(() => err)),
      );
  }

  getByCodeType(
    codeType: string,
    searchTerm?: string,
    take?: number,
    skip?: number,
    sort?: string,
    filter?: EquipmentMasterCodeFilter,
  ): Observable<{ data: EquipmentMasterCodeDto[]; total: number }> {
    const effectiveDate = filter?.effectiveDate ? this.formatDateParam(filter.effectiveDate) : undefined;
    const terminationDate = filter?.terminationDate ? this.formatDateParam(filter.terminationDate) : undefined;

    return this.apiService
      .get<ReturnResult<EquipmentMasterCodeDto>>(
        API.EQUIPMENT_MASTER_CODES.GET_BY_CODE_TYPE(
          codeType, searchTerm, take, skip, sort,
          effectiveDate, terminationDate,
          filter?.effectiveDatePeriod, filter?.terminationDatePeriod,
          filter?.userGroup,
        ),
      )
      .pipe(
        map(r => ({ data: r.data ?? [], total: r.total ?? r.data?.length ?? 0 })),
        catchError(err => throwError(() => err)),
      );
  }

  private formatDateParam(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  create(request: CreateEquipmentMasterCodeRequest): Observable<ReturnResult<EquipmentMasterCodeDto>> {
    return this.apiService
      .post<ReturnResult<EquipmentMasterCodeDto>>(API.EQUIPMENT_MASTER_CODES.CREATE, request)
      .pipe(catchError(err => throwError(() => err)));
  }

  update(
    codeType: string,
    code: string,
    request: UpdateEquipmentMasterCodeRequest,
  ): Observable<ReturnResult<EquipmentMasterCodeDto>> {
    return this.apiService
      .put<ReturnResult<EquipmentMasterCodeDto>>(API.EQUIPMENT_MASTER_CODES.UPDATE(codeType, code), request)
      .pipe(catchError(err => throwError(() => err)));
  }

  delete(codeType: string, code: string): Observable<ReturnResult<boolean>> {
    return this.apiService
      .delete<ReturnResult<boolean>>(API.EQUIPMENT_MASTER_CODES.DELETE(codeType, code))
      .pipe(catchError(err => throwError(() => err)));
  }
}
