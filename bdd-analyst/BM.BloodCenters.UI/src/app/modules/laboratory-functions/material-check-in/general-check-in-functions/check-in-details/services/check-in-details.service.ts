import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

import {
  DriveOption,
  DropdownOption,
  AttributeCodeOption,
  MachineOption,
  UnitDetail,
  SavePayload,
  CheckedInUnit,
} from '../models/check-in-details.model';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T[];
  item?: T;
  total?: number;
}

interface ValidateUnitResultDto {
  unitId: string;
  parsedUnitId: string;
  alreadyCheckedIn: boolean;
  hasTubeData: boolean;
  driveId?: string;
  siteName?: string;
  collDate?: string;
  collDateAfterTestResult?: boolean;
}

interface AttributeGroupDto {
  group: string;
  description: string;
}

interface AttributeCodeDto {
  code: string;
  description: string;
  requiresEquipment: string;
  parmCode: string;
}

interface MachineDto {
  equipType: string;
  description: string;
  serialNumber: string;
  equipReference: string;
}

interface AboValueDto {
  code: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CheckInDetailsService {
  private readonly apiService = inject(ApiService);

  getDrives(collDate: string): Observable<DriveOption[]> {
    return this.apiService
      .get<ApiResponse<{ driveId: string; groupSiteId: string; siteName: string }>>(
        API.CHECK_IN_DETAILS.GET_DRIVES(collDate)
      )
      .pipe(map(res => (res.data ?? []).map(d => ({
        value:       d.driveId,
        label:       `${d.driveId} — ${d.siteName}`,
        siteName:    d.siteName,
        groupSiteId: d.groupSiteId,
      }))));
  }

  getDriveDescription(driveId: string, collDate: string): Observable<{ siteName: string; groupSiteId: string }> {
    return this.apiService
      .get<ApiResponse<{ groupSiteId: string; siteName: string }>>(
        API.CHECK_IN_DETAILS.GET_DRIVE_DESCRIPTION(driveId, collDate)
      )
      .pipe(map(res => ({
        siteName:    res.item?.siteName    ?? '',
        groupSiteId: res.item?.groupSiteId ?? '',
      })));
  }

  validateUnit(unitId: string, collDate: string, driveId: string): Observable<ValidateUnitResultDto> {
    return this.apiService
      .post<ApiResponse<ValidateUnitResultDto>>(
        API.CHECK_IN_DETAILS.VALIDATE_UNIT,
        { unitId, collDate, driveId }
      )
      .pipe(map(res => res.item!));
  }

  getUnitDetails(unitId: string, collDate: string): Observable<UnitDetail | null> {
    return this.apiService
      .get<ApiResponse<UnitDetail>>(API.CHECK_IN_DETAILS.GET_UNIT_DETAILS(unitId, collDate))
      .pipe(map(res => res.item ?? null));
  }

  getAttributeGroups(): Observable<DropdownOption[]> {
    return this.apiService
      .get<ApiResponse<AttributeGroupDto>>(API.CHECK_IN_DETAILS.GET_ATTRIBUTE_GROUPS)
      .pipe(map(res => (res.data ?? []).map(g => ({
        value: g.group,
        label: `${g.group} — ${g.description}`,
      }))));
  }

  getAttributeCodes(attribGroup: string, chapterId: string): Observable<AttributeCodeOption[]> {
    return this.apiService
      .get<ApiResponse<AttributeCodeDto>>(API.CHECK_IN_DETAILS.GET_ATTRIBUTE_CODES(attribGroup, chapterId))
      .pipe(map(res => (res.data ?? []).map(c => ({
        value:             c.code,
        label:             `${c.code} — ${c.description}`,
        requiresEquipment: c.requiresEquipment === 'Y',
        parmCode:          c.parmCode ?? '',
      }))));
  }

  getMachines(attribGroup: string, attribCode: string): Observable<MachineOption[]> {
    return this.apiService
      .get<ApiResponse<MachineDto>>(API.CHECK_IN_DETAILS.GET_MACHINES(attribGroup, attribCode))
      .pipe(map(res => (res.data ?? []).map(m => ({
        value:        m.equipReference,
        label:        `${m.serialNumber} — ${m.description}`,
        donorCue:     m.description,
        serialNumber: m.serialNumber,
        equipType:    m.equipType,
      }))));
  }

  getAboValues(): Observable<DropdownOption[]> {
    return this.apiService
      .get<ApiResponse<AboValueDto>>(API.CHECK_IN_DETAILS.GET_ABO_VALUES)
      .pipe(map(res => (res.data ?? []).map(a => ({
        value: a.code,
        label: `${a.code} — ${a.description}`,
      }))));
  }

  getChapterConfig(): Observable<{ maxBleedTime: number; slowBleedTime: number; cueScanFlag: string; timeLimitDays: number }> {
    return this.apiService
      .get<ApiResponse<{ maxBleedTime: number; slowBleedTime: number; cueScanFlag: string; timeLimitDays: number }>>(
        API.CHECK_IN_DETAILS.GET_CHAPTER_CONFIG
      )
      .pipe(map(res => ({
        maxBleedTime:  res.item?.maxBleedTime  ?? 0,
        slowBleedTime: res.item?.slowBleedTime ?? 0,
        cueScanFlag:   res.item?.cueScanFlag   ?? 'Y',
        timeLimitDays: res.item?.timeLimitDays ?? 3,
      })));
  }

  getUnits(driveId: string, collDate: string): Observable<CheckedInUnit[]> {
    return this.apiService
      .get<ApiResponse<CheckedInUnit>>(API.CHECK_IN_DETAILS.GET_UNITS(driveId, collDate))
      .pipe(map(res => res.data ?? []));
  }

  getBagConfigs(): Observable<DropdownOption[]> {
    return this.apiService
      .get<ApiResponse<{ code: string; description: string }>>(API.CHECK_IN_DETAILS.GET_BAG_CONFIGS)
      .pipe(map(res => (res.data ?? []).map(b => ({ value: b.code, label: `${b.code} — ${b.description}` }))));
  }

  getFirstSeparationTime(unitId: string): Observable<string | null> {
    return this.apiService
      .get<ApiResponse<string>>(API.CHECK_IN_DETAILS.GET_SEPARATION_TIME(unitId))
      .pipe(map(res => res.item ?? null));
  }

  save(payload: SavePayload): Observable<{ success: boolean; message?: string; errorCode?: string; warningCode?: string }> {
    return this.apiService
      .post<ApiResponse<{ success: boolean; message?: string; warningCode?: string }>>(API.CHECK_IN_DETAILS.CHECK_IN, payload)
      .pipe(map(res => ({
        success: res.success === true,
        message: res.message,
        errorCode: res.error,
        warningCode: res.item?.warningCode,
      })));
  }
}
