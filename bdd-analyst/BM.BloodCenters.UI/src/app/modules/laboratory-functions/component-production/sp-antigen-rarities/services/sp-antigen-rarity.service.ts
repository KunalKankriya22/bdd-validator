import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  SpAntigenRarity,
  CreateSpAntigenRarityDto,
  UpdateSpAntigenRarityDto,
  SpAntigenRarityParamsDto,
  ApiResponse
} from '../models/sp-antigen-rarity.model';

/**
 * Service for SP' Antigen Rarities API operations
 */
@Injectable({
  providedIn: 'root'
})
export class SpAntigenRarityService {
  private apiService = inject(ApiService);
  private readonly API_BASE = '/api/v1/sp-antigen-rarities';

  getAntigenRarities(
    take: number,
    skip: number,
    params: SpAntigenRarityParamsDto
  ): Observable<ApiResponse<SpAntigenRarity[]>> {
    return this.apiService
      .post<ApiResponse<SpAntigenRarity[]>>(
        `${this.API_BASE}/${take}/${skip}`,
        params
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching antigen rarities:', error);
          return throwError(() => error);
        })
      );
  }

  getAntigenRarityById(rarityCode: string): Observable<ApiResponse<SpAntigenRarity>> {
    return this.apiService
      .get<ApiResponse<SpAntigenRarity>>(
        `${this.API_BASE}/${encodeURIComponent(rarityCode)}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching antigen rarity by ID:', error);
          return throwError(() => error);
        })
      );
  }

  createAntigenRarity(data: CreateSpAntigenRarityDto): Observable<ApiResponse<unknown>> {
    return this.apiService
      .post<ApiResponse<unknown>>(this.API_BASE, data)
      .pipe(
        catchError((error) => {
          console.error('Error creating antigen rarity:', error);
          return throwError(() => error);
        })
      );
  }

  updateAntigenRarity(
    rarityCode: string,
    data: UpdateSpAntigenRarityDto
  ): Observable<ApiResponse<unknown>> {
    return this.apiService
      .put<ApiResponse<unknown>>(
        `${this.API_BASE}/${encodeURIComponent(rarityCode)}`,
        data
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating antigen rarity:', error);
          return throwError(() => error);
        })
      );
  }

  deleteAntigenRarity(rarityCode: string): Observable<ApiResponse<boolean>> {
    return this.apiService
      .delete<ApiResponse<boolean>>(
        `${this.API_BASE}/${encodeURIComponent(rarityCode)}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error deleting antigen rarity:', error);
          return throwError(() => error);
        })
      );
  }
}
