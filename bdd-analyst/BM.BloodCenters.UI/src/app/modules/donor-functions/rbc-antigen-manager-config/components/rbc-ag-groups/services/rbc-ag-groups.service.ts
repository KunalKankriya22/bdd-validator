import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import moment from 'moment';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ApiResult,
  AntigenGroupOption,
  AntigenGroupRow,
  RbcAgGroupApiModel,
  RbcAgGroupBatchUpdateRequest,
  RbcAgGroupCreateRequest,
  RbcAgGroupFilterOption,
  RbcAgGroupLookupItem,
  RbcAgGroupSearchRequest,
  RbcAgGroupUpdateRequest,
} from '../models/rbc-ag-groups.model';

@Injectable({ providedIn: 'root' })
export class RbcAgGroupsService {
  private readonly api = inject(ApiService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  search(
    take: number,
    skip: number,
    request: RbcAgGroupSearchRequest,
  ): Observable<{ data: AntigenGroupRow[]; total: number }> {
    const endpoint = API.DONOR_FUNCTIONS.RBC_AG_GROUPS.SEARCH(take, skip);
    return this.api.post<ApiResult<RbcAgGroupApiModel>>(endpoint, request).pipe(
      map(res => ({
        data: (res.data ?? []).map(item => this.mapToRow(item)),
        total: res.total ?? 0,
      })),
      catchError(err => throwError(() => err)),
    );
  }

  create(records: RbcAgGroupCreateRequest[]): Observable<ApiResult<null>> {
    return this.api
      .post<ApiResult<null>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.CREATE, records)
      .pipe(catchError(err => throwError(() => err)));
  }

  update(records: RbcAgGroupUpdateRequest[]): Observable<ApiResult<null>> {
    return this.api
      .put<ApiResult<null>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.UPDATE, records)
      .pipe(catchError(err => throwError(() => err)));
  }

  batchUpdate(request: RbcAgGroupBatchUpdateRequest): Observable<ApiResult<null>> {
    return this.api
      .put<ApiResult<null>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.BATCH_UPDATE, request)
      .pipe(catchError(err => throwError(() => err)));
  }

  delete(auditKey: number): Observable<ApiResult<null>> {
    return this.api
      .delete<ApiResult<null>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.DELETE(auditKey))
      .pipe(catchError(err => throwError(() => err)));
  }

  getFilterOptions(): Observable<AntigenGroupOption[]> {
    return this.api
      .get<ApiResult<RbcAgGroupFilterOption>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.FILTER_OPTIONS)
      .pipe(
        map(res =>
          (res.data ?? []).map(opt => ({
            name: opt.antigenGroup,
            displayOrder: opt.antigenGrpDispOrder,
          })),
        ),
        catchError(err => throwError(() => err)),
      );
  }

  lookupAntigenGroups(): Observable<string[]> {
    return this.api
      .get<ApiResult<RbcAgGroupLookupItem>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.LOOKUP_ANTIGEN_GROUPS)
      .pipe(
        map(res => (res.data ?? []).map(d => d.value)),
        catchError(err => throwError(() => err)),
      );
  }

  lookupSerTestIds(): Observable<string[]> {
    return this.api
      .get<ApiResult<RbcAgGroupLookupItem>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.LOOKUP_SER_TEST_IDS)
      .pipe(
        map(res => (res.data ?? []).map(d => d.value)),
        catchError(err => throwError(() => err)),
      );
  }

  lookupMolTestIds(): Observable<string[]> {
    return this.api
      .get<ApiResult<RbcAgGroupLookupItem>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.LOOKUP_MOL_TEST_IDS)
      .pipe(
        map(res => (res.data ?? []).map(d => d.value)),
        catchError(err => throwError(() => err)),
      );
  }

  checkGroupExists(antigenGroup: string): Observable<boolean> {
    return this.api
      .post<ApiResult<boolean>>(API.DONOR_FUNCTIONS.RBC_AG_GROUPS.CHECK_GROUP_EXISTS, { antigenGroup })
      .pipe(
        map(res => res.item === true),
        catchError(err => throwError(() => err)),
      );
  }

  private mapToRow(item: RbcAgGroupApiModel): AntigenGroupRow {
    return {
      auditKey: item.auditKey,
      serologicalTest: item.serAgTestId,
      serologicalSeq: item.serTestDispOrder,
      molecularTest: item.molAgTestId ?? '',
      molecularSeq: item.molTestDispOrder ?? 0,
      effectiveDate: this.formatDate(item.effDate),
      terminationDate: item.termDate ? this.formatDate(item.termDate) : '',
    };
  }

  private formatDate(iso: string): string {
    const m = moment.utc(iso);
    if (!m.isValid()) return '';
    const localM = this.chapterTimezoneService.convertGmtToLocal(m);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${String(localM.date()).padStart(2, '0')}-${months[localM.month()]}-${localM.year()}`;
  }
}
