import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  SpAntigenGroup,
  CreateSpAntigenGroupDto,
  UpdateSpAntigenGroupDto,
  SpAntigenGroupParamsDto,
  ApiResponse,
  AntigenGroupDropdown,
  AntigenRarityDropdown
} from '../models/sp-antigen-group.model';

/**
 * Service for SP' Antigen Groups API operations
 */
@Injectable({
  providedIn: 'root'
})
export class SpAntigenGroupService {
  private apiService = inject(ApiService);
  private readonly API_BASE = '/api/v1/sp-antigen-groups';

  getAntigenGroups(
    take: number,
    skip: number,
    params: SpAntigenGroupParamsDto
  ): Observable<ApiResponse<SpAntigenGroup[]>> {
    return this.apiService
      .post<ApiResponse<SpAntigenGroup[]>>(
        `${this.API_BASE}/${take}/${skip}`,
        params
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching antigen groups:', error);
          return throwError(() => error);
        })
      );
  }

  getAntigenGroupById(testId: string): Observable<ApiResponse<SpAntigenGroup>> {
    return this.apiService
      .get<ApiResponse<SpAntigenGroup>>(
        `${this.API_BASE}/${encodeURIComponent(testId)}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching antigen group by ID:', error);
          return throwError(() => error);
        })
      );
  }

  createAntigenGroup(data: CreateSpAntigenGroupDto): Observable<ApiResponse<unknown>> {
    return this.apiService
      .post<ApiResponse<unknown>>(this.API_BASE, data)
      .pipe(
        catchError((error) => {
          console.error('Error creating antigen group:', error);
          return throwError(() => error);
        })
      );
  }

  updateAntigenGroup(
    testId: string,
    data: UpdateSpAntigenGroupDto
  ): Observable<ApiResponse<unknown>> {
    return this.apiService
      .put<ApiResponse<unknown>>(
        `${this.API_BASE}/${encodeURIComponent(testId)}`,
        data
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating antigen group:', error);
          return throwError(() => error);
        })
      );
  }

  deleteAntigenGroup(testId: string): Observable<ApiResponse<boolean>> {
    return this.apiService
      .delete<ApiResponse<boolean>>(
        `${this.API_BASE}/${encodeURIComponent(testId)}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error deleting antigen group:', error);
          return throwError(() => error);
        })
      );
  }

  getAntigenGroupsDropdown(): Observable<AntigenGroupDropdown[]> {
    return this.apiService
      .get<AntigenGroupDropdown[]>(`${this.API_BASE}/dropdowns/antigen-groups`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching antigen groups dropdown:', error);
          return throwError(() => error);
        })
      );
  }

  getAntigenRaritiesDropdown(): Observable<AntigenRarityDropdown[]> {
    return this.apiService
      .get<AntigenRarityDropdown[]>(`${this.API_BASE}/dropdowns/antigen-rarities`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching antigen rarities dropdown:', error);
          return throwError(() => error);
        })
      );
  }
}
