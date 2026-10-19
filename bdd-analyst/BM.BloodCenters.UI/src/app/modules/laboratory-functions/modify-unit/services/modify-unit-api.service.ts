import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { API } from '@core/constants/api.constants';
import {
  ModifyUnitCollectionDate,
  ModifyUnitDetails,
  ModifyUnitUpdateRequest,
  ModifyUnitUpdateResponse,
  DriveOption,
  GroupSiteOption,
  AboOption,
  CatalogOption,
  LotOption,
  BatchOption,
  AttrGroupOption,
  AttrCodeOption,
  EquipTypeOption,
  SerialNumberOption,
  DdCodeOption,
} from '../models/modify-unit.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable()
export class ModifyUnitApiService {
  private readonly http = inject(HttpClient);

  getCollectionDates(unitId: string): Observable<ModifyUnitCollectionDate[]> {
    return this.http
      .get<ApiResponse<ModifyUnitCollectionDate>>(API.MODIFY_UNIT.COLLECTION_DATES(unitId))
      .pipe(map((r) => r.data ?? []));
  }

  getDetails(unitId: string, collDate: string): Observable<ModifyUnitDetails | null> {
    return this.http
      .get<ApiResponse<ModifyUnitDetails>>(API.MODIFY_UNIT.DETAILS(unitId, collDate))
      .pipe(map((r) => r.item ?? null));
  }

  update(request: ModifyUnitUpdateRequest): Observable<ModifyUnitUpdateResponse> {
    return this.http
      .put<ApiResponse<ModifyUnitUpdateResponse>>(API.MODIFY_UNIT.UPDATE, request, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(map((r) => r.item!));
  }

  getDrives(collDate: string): Observable<DriveOption[]> {
    return this.http
      .get<ApiResponse<DriveOption>>(API.MODIFY_UNIT.DRIVES(collDate))
      .pipe(map((r) => r.data ?? []));
  }

  getGroupSites(driveId: string): Observable<GroupSiteOption[]> {
    return this.http
      .get<ApiResponse<GroupSiteOption>>(API.MODIFY_UNIT.GROUP_SITES(driveId))
      .pipe(map((r) => r.data ?? []));
  }

  getAboValues(): Observable<AboOption[]> {
    return this.http
      .get<ApiResponse<AboOption>>(API.MODIFY_UNIT.ABO_VALUES)
      .pipe(map((r) => r.data ?? []));
  }

  getCatalogs(): Observable<CatalogOption[]> {
    return this.http
      .get<ApiResponse<CatalogOption>>(API.MODIFY_UNIT.CATALOGS)
      .pipe(map((r) => r.data ?? []));
  }

  getLots(catalogNumber: string): Observable<LotOption[]> {
    return this.http
      .get<ApiResponse<LotOption>>(API.MODIFY_UNIT.LOTS(catalogNumber))
      .pipe(map((r) => r.data ?? []));
  }

  getBatches(): Observable<BatchOption[]> {
    return this.http
      .get<ApiResponse<BatchOption>>(API.MODIFY_UNIT.BATCHES)
      .pipe(map((r) => r.data ?? []));
  }

  getAttributeGroups(): Observable<AttrGroupOption[]> {
    return this.http
      .get<ApiResponse<AttrGroupOption>>(API.MODIFY_UNIT.ATTRIBUTE_GROUPS)
      .pipe(map((r) => r.data ?? []));
  }

  getAttributeCodes(attribGroup: string, codeScheme?: string): Observable<AttrCodeOption[]> {
    return this.http
      .get<ApiResponse<AttrCodeOption>>(API.MODIFY_UNIT.ATTRIBUTE_CODES(attribGroup, codeScheme))
      .pipe(map((r) => r.data ?? []));
  }

  getEquipmentTypes(attribGroup: string, attribCode: string): Observable<EquipTypeOption[]> {
    return this.http
      .get<ApiResponse<EquipTypeOption>>(API.MODIFY_UNIT.EQUIPMENT_TYPES(attribGroup, attribCode))
      .pipe(map((r) => r.data ?? []));
  }

  getSerialNumbers(equipType: string): Observable<SerialNumberOption[]> {
    return this.http
      .get<ApiResponse<SerialNumberOption>>(API.MODIFY_UNIT.SERIAL_NUMBERS(equipType))
      .pipe(map((r) => r.data ?? []));
  }

  getDonorDecisionCodes(): Observable<DdCodeOption[]> {
    return this.http
      .get<ApiResponse<DdCodeOption>>(API.MODIFY_UNIT.DONOR_DECISION_CODES)
      .pipe(map((r) => r.data ?? []));
  }
}
