import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';

export interface LookupOption {
  value: string;
  label: string;
}

export interface IdNameLookupOption {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  private readonly apiService = inject(ApiService);

  /**
   * Get drive types from backend
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/drive-types
   */
  getDriveTypes(): Observable<LookupOption[]> {
    return this.apiService.get<LookupOption[]>('/api/v1/donor-recruitment/lookups/drive-types').pipe(
      map(response => response || [])
    );
  }

  /**
   * Get drive categories from backend
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/drive-categories
   */
  getDriveCategories(): Observable<LookupOption[]> {
    return this.apiService.get<LookupOption[]>('/api/v1/donor-recruitment/lookups/drive-categories').pipe(
      map(response => response || [])
    );
  }

  /**
   * Get recruiters for a chapter
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/recruiters?chapterId={id}
   */
  getRecruiters(chapterId: string): Observable<IdNameLookupOption[]> {
    return this.apiService.get<IdNameLookupOption[]>('/api/v1/donor-recruitment/lookups/recruiters', {
      params: new HttpParams().set('chapterId', chapterId)
    }).pipe(
      map(response => response || [])
    );
  }

  /**
   * Get locations for a chapter
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/locations?chapterId={id}
   */
  getLocations(chapterId: string): Observable<IdNameLookupOption[]> {
    return this.apiService.get<IdNameLookupOption[]>('/api/v1/donor-recruitment/lookups/locations', {
      params: new HttpParams().set('chapterId', chapterId)
    }).pipe(
      map(response => response || [])
    );
  }

  /**
   * Get territories for a chapter
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/territories?chapterId={id}
   */
  getTerritories(chapterId: string): Observable<IdNameLookupOption[]> {
    return this.apiService.get<IdNameLookupOption[]>('/api/v1/donor-recruitment/lookups/territories', {
      params: new HttpParams().set('chapterId', chapterId)
    }).pipe(
      map(response => response || [])
    );
  }

  /**
   * Get facilities from backend
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/facilities
   */
  getFacilities(): Observable<LookupOption[]> {
    return this.apiService.get<LookupOption[]>('/api/v1/donor-recruitment/lookups/facilities').pipe(
      map(response => response || [])
    );
  }

  /**
   * Get efficiency range parameter (EFRNG) from VALID_PARAMETERS
   * Used for staff calculation: staff_req = round((projected_show / total_hrs) / eff_range)
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/efficiency-range
   */
  getEfficiencyRange(): Observable<number> {
    return this.apiService.get<any>('/api/v1/donor-recruitment/lookups/efficiency-range').pipe(
      map(response => response?.efficiencyRange ?? 1.0)
    );
  }

  /**
   * Get sponsors for a chapter
   * Backend endpoint: GET /api/v1/donor-recruitment/lookups/sponsors?chapterId={id}
   */
  getSponsors(chapterId: string): Observable<IdNameLookupOption[]> {
    return this.apiService.get<IdNameLookupOption[]>('/api/v1/donor-recruitment/lookups/sponsors', {
      params: new HttpParams().set('chapterId', chapterId)
    }).pipe(
      map(response => response || [])
    );
  }
}
