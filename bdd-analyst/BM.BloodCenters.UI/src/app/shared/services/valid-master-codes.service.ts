import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API } from '../../core/constants/api.constants';
import { CountryModel } from '../models/international-address.model';

/** Generic code/description pair from VALID_MASTER_CODES */
export interface MasterCodeItem {
  code: string;
  description: string;
}

/**
 * Shared Lookup Service
 *
 * Provides cached access to lookup data from VALID_MASTER_CODES.
 * Fetches once per session and serves from memory on subsequent calls.
 *
 * @example
 * // Countries (convenience method)
 * this.lookupService.getCountries().subscribe(countries => { ... });
 *
 * // Any CODE_TYPE via generic method
 * this.lookupService.getByCodeType('STATE').subscribe(states => { ... });
 * this.lookupService.getByCodeType('DRVTY').subscribe(driveTypes => { ... });
 *
 * // Force refresh
 * this.lookupService.clearCache('CNTRY');
 */
@Injectable({
  providedIn: 'root'
})
export class ValidMasterCodesService {
  private readonly apiService = inject(ApiService);

  private readonly cache = new Map<string, unknown[]>();
  private readonly inflight = new Map<string, Observable<unknown[]>>();

  /**
   * Generic lookup by CODE_TYPE from VALID_MASTER_CODES.
   * Results are cached in memory after the first call per codeType.
   *
   * @param codeType - The CODE_TYPE to fetch (e.g. 'CNTRY', 'STATE', 'DRVTY')
   * @param searchKeyword - Optional search filter
   */
  getByCodeType(codeType: string, searchKeyword?: string): Observable<MasterCodeItem[]> {
    const cacheKey = searchKeyword ? `${codeType}:${searchKeyword}` : codeType;
    return this.getCached<MasterCodeItem>(cacheKey, () =>
      this.apiService.get<any>(API.LOOKUPS.BY_CODE_TYPE(codeType), {
        params: searchKeyword ? { searchKeyword } as any : undefined
      }).pipe(
        map(response => response?.data || response?.Data || [])
      )
    );
  }

  /**
   * Get countries (CODE_TYPE = 'CNTRY').
   * Convenience method — uses the dedicated /shared/countries endpoint.
   * Results are cached in memory after the first call.
   */
  getCountries(): Observable<CountryModel[]> {
    return this.getCached<CountryModel>('CNTRY', () =>
      this.apiService.get<any>(API.INTERNATIONAL_ADDRESS.COUNTRIES).pipe(
        map(response => response?.data || response?.Data || [])
      )
    );
  }

  /**
   * Clear cached data for a specific code type or all caches.
   * @param key - Cache key to clear (e.g. 'CNTRY', 'STATE'). Omit to clear all.
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.inflight.delete(key);
    } else {
      this.cache.clear();
      this.inflight.clear();
    }
  }

  /**
   * Generic cache-or-fetch helper.
   * Returns cached data if available, otherwise fetches, caches, and returns.
   * Deduplicates concurrent requests for the same key.
   */
  private getCached<T>(key: string, fetchFn: () => Observable<T[]>): Observable<T[]> {
    const cached = this.cache.get(key) as T[] | undefined;
    if (cached) {
      return of(cached);
    }

    const existing = this.inflight.get(key) as Observable<T[]> | undefined;
    if (existing) {
      return existing;
    }

    const request$ = fetchFn().pipe(
      tap(data => {
        this.cache.set(key, data);
        this.inflight.delete(key);
      })
    );

    this.inflight.set(key, request$ as Observable<unknown[]>);
    return request$;
  }
}
