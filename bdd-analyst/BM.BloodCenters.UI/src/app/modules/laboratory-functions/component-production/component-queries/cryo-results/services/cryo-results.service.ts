import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../../../shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  WorksheetIdsResponse,
  WorksheetIdItem,
  CryoResultUnitsResponse,
  CryoResultUnit,
} from '../models/cryo-results.model';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class CryoResultsService {
  private readonly apiService = inject(ApiService);

  getWorksheetIds(daysBack: number = 21): Observable<WorksheetIdItem[]> {
    const endpoint = API.CRYO_RESULTS_QUERY.GET_WORKSHEETS;
    const params = new HttpParams().set('daysBack', daysBack.toString());

    return this.apiService
      .get<WorksheetIdsResponse>(endpoint, { params })
      .pipe(
        map((response) => response.data || []),
        catchError((error) => throwError(() => error)),
      );
  }

  getUnitsAwaitingResults(
    worksheetId: string,
    take: number,
    skip: number,
    sortColumn?: string | null,
    sortOrder?: string | null,
  ): Observable<{ data: CryoResultUnit[]; totalRecords: number }> {
    const endpoint = API.CRYO_RESULTS_QUERY.GET_UNITS(worksheetId, take, skip);

    let params = new HttpParams();
    if (sortColumn) {
      params = params.set('sortColumn', sortColumn);
    }
    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    return this.apiService
      .get<CryoResultUnitsResponse>(endpoint, { params })
      .pipe(
        map((response) => ({
          data: (response.data || []).map((unit) => ({
            unitId: unit.chkDigit
              ? `${unit.unitId}-${unit.chkDigit}`
              : unit.unitId,
            collDate: this.formatDate(unit.collDate),
            actualProductCode: unit.actualProductCode || '',
            productShortName: unit.productShortName || '',
            thawMethod: unit.thawMethod || '',
            thawTemperature:
              unit.thawTemperature != null
                ? unit.thawTemperature.toFixed(1)
                : '',
            sepInd: unit.sepInd || '',
            freezeTime: this.formatDateTime(unit.freezeTime),
          })),
          totalRecords: response.total || 0,
        })),
        catchError((error) => throwError(() => error)),
      );
  }

  private formatDate(isoDate: string | null): string {
    if (!isoDate) return '';
    const m = moment(isoDate);
    return m.isValid() ? m.format('D-MMM-YYYY').toUpperCase() : '';
  }

  private formatDateTime(isoDate: string | null): string {
    if (!isoDate) return '';
    const m = moment(isoDate);
    return m.isValid() ? m.format('D-MMM-YYYY, HH:mm').toUpperCase() : '';
  }
}
