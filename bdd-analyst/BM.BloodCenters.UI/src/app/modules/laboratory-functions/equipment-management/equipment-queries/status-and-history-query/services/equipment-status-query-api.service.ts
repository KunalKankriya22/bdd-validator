import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  EquipmentStatusItem,
  EquipmentStatusQueryDto,
  EquipmentLookupDto,
  EquipmentIdLookupDto,
  EquipmentReferenceLookupDto,
  EquipmentStatisticsDto,
  ConfigurableDetailDto,
} from '../models/status-and-history-query.model';

@Injectable({ providedIn: 'root' })
export class EquipmentStatusQueryApiService {
  private readonly apiService = inject(ApiService);

  getEquipmentList(
    query: EquipmentStatusQueryDto,
  ): Observable<ReturnResult<EquipmentStatusItem>> {
    return this.apiService.post<ReturnResult<EquipmentStatusItem>>(
      API.EQUIPMENT_QUERY.LIST,
      query,
    );
  }

  getEquipmentById(
    equipType: string,
    equipId: string,
    equipReference: string,
  ): Observable<ReturnResult<EquipmentStatusItem>> {
    return this.apiService.get<ReturnResult<EquipmentStatusItem>>(
      API.EQUIPMENT_QUERY.GET_BY_ID(equipType, equipId, equipReference),
    );
  }

  getEquipmentTypes(): Observable<ReturnResult<EquipmentLookupDto>> {
    return this.apiService.get<ReturnResult<EquipmentLookupDto>>(
      API.EQUIPMENT_QUERY.TYPES,
    );
  }

  getEquipmentStatuses(): Observable<ReturnResult<EquipmentLookupDto>> {
    return this.apiService.get<ReturnResult<EquipmentLookupDto>>(
      API.EQUIPMENT_QUERY.STATUSES,
    );
  }

  getEquipmentIds(
    equipType: string,
  ): Observable<ReturnResult<EquipmentIdLookupDto>> {
    return this.apiService.get<ReturnResult<EquipmentIdLookupDto>>(
      API.EQUIPMENT_QUERY.IDS_BY_TYPE(equipType),
    );
  }

  getEquipmentReferences(
    equipType: string,
    equipId: string,
  ): Observable<ReturnResult<EquipmentReferenceLookupDto>> {
    return this.apiService.get<ReturnResult<EquipmentReferenceLookupDto>>(
      API.EQUIPMENT_QUERY.REFERENCES(equipType, equipId),
    );
  }

  getStatistics(
    equipType: string,
    equipId: string,
    equipReference: string,
  ): Observable<ReturnResult<EquipmentStatisticsDto>> {
    return this.apiService.get<ReturnResult<EquipmentStatisticsDto>>(
      API.EQUIPMENT_QUERY.STATISTICS(equipType, equipId, equipReference),
    );
  }

  getEquipmentParmValues(
    equipType: string,
    equipId: string,
    equipReference: string,
  ): Observable<ReturnResult<ConfigurableDetailDto>> {
    return this.apiService.get<ReturnResult<ConfigurableDetailDto>>(
      API.EQUIPMENT_QUERY.PARAMETERS(equipType, equipId, equipReference),
    );
  }
}
