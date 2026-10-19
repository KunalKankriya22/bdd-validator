import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import {
  DaylightSavingsModel,
  DaylightSavingsParamsDto,
  DaylightSavingsFilterLov,
  DaylightSavingsDropdownLov,
  DaylightSavingsDto,
  UpdateDaylightSavingsDto
} from '../models/daylight-savings.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DaylightSavingsService {
  private readonly apiService = inject(ApiService);

  private chapters$: Observable<{ chapterId: string; chapterName: string }[]> | null = null;
  private dropdown$: Observable<ReturnResult<DaylightSavingsDropdownLov>> | null = null;
  private timeZoneRegionsCache = new Map<string, Observable<ReturnResult<DaylightSavingsDropdownLov>>>();

  getDaylightSavings(
    take: number,
    skip: number,
    params: DaylightSavingsParamsDto
  ): Observable<{ data: DaylightSavingsModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS(take, skip);

    return this.apiService
      .post<ReturnResult<DaylightSavingsModel>>(endpoint, params)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  getDaylightSavingsFilters(): Observable<ReturnResult<DaylightSavingsFilterLov>> {
    return this.apiService.get(
      API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_FILTERS
    );
  }

  getDaylightSavingsDropdown(): Observable<ReturnResult<DaylightSavingsDropdownLov>> {
    if (!this.dropdown$) {
      this.dropdown$ = this.apiService.get<ReturnResult<DaylightSavingsDropdownLov>>(
        API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_DROPDOWN
      ).pipe(shareReplay(1));
    }
    return this.dropdown$;
  }

  getChapters(): Observable<{ chapterId: string; chapterName: string }[]> {
    if (!this.chapters$) {
      this.chapters$ = this.apiService.get<ReturnResult<{ chapterId: string; chapterName: string }>>(
        API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_CHAPTERS
      ).pipe(
        map(res => res.data ?? []),
        shareReplay(1)
      );
    }
    return this.chapters$;
  }

  addDaylightSavings(
    payload: DaylightSavingsDto
  ): Observable<ReturnResult<DaylightSavingsModel>> {
    return this.apiService.post(
      API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_ADD_EDIT,
      payload
    );
  }

  updateDaylightSavings(
    payload: UpdateDaylightSavingsDto
  ): Observable<ReturnResult<DaylightSavingsModel>> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_ADD_EDIT,
      payload
    );
  }

  getTimeZoneRegionsByOffset(baseOffset: string): Observable<ReturnResult<DaylightSavingsDropdownLov>> {
    const cached = this.timeZoneRegionsCache.get(baseOffset);
    if (cached) return cached;

    const encodedOffset = encodeURIComponent(baseOffset);
    const result$ = this.apiService.get<ReturnResult<DaylightSavingsDropdownLov>>(
      `${API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_TIMEZONE_REGIONS}?baseOffset=${encodedOffset}`
    ).pipe(shareReplay(1));

    this.timeZoneRegionsCache.set(baseOffset, result$);
    return result$;
  }
}
