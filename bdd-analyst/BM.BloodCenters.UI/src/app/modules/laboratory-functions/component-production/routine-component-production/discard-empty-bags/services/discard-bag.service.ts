import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import {
  RejectReasonDto,
  UnitDiscardValidationDto,
  DiscardBagRequestDto,
  DiscardBagResponseDto,
  ApiResponse
} from '../models/discard-bag.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

/**
 * Service for Discard Empty Bags API operations
 * Integrates with BM.BloodCenters.API Lab module
 */
@Injectable({
  providedIn: 'root'
})
export class DiscardBagService {
  private readonly apiService = inject(ApiService);

  /**
   * Get active rejection reason codes for dropdown
   * GET /api/v1/discard-empty-bags/reject-reasons
   * @returns Observable with list of active rejection reasons
   */
  getRejectReasons(): Observable<RejectReasonDto[]> {
    const endpoint = API.DISCARD_EMPTY_BAGS.REJECT_REASONS;

    return this.apiService.get<ApiResponse<RejectReasonDto>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate unit for discard empty bags (early validation)
   * Checks unit existence and bag availability
   * GET /api/v1/discard-empty-bags/validate-unit-for-discard/{unitId}
   * @param unitId - Unit identifier (13-char parsed ID)
   * @param chapterId - Optional chapter ID
   * @returns Observable with unit validation result
   */
  validateUnitForDiscard(unitId: string, chapterId?: string): Observable<UnitDiscardValidationDto> {
    const endpoint = API.DISCARD_EMPTY_BAGS.VALIDATE_UNIT_FOR_DISCARD(unitId);
    let params = new HttpParams();
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService.get<ApiResponse<UnitDiscardValidationDto>>(endpoint, { params }).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error('No validation data returned');
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get available catalog numbers for a unit (for dropdown)
   * GET /api/v1/discard-empty-bags/available-catalogs/{unitId}
   * @param unitId - Unit identifier
   * @param chapterId - Optional chapter ID (uses user context if not provided)
   * @returns Observable with list of available catalog numbers
   */
  getAvailableCatalogs(unitId: string, chapterId?: string): Observable<string[]> {
    const endpoint = API.DISCARD_EMPTY_BAGS.AVAILABLE_CATALOGS(unitId);
    let params = new HttpParams();
    if (chapterId) {
      params = params.set('chapterId', chapterId);
    }

    return this.apiService.get<ApiResponse<string>>(endpoint, { params }).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Discard an empty bag by creating a COMPONENTS record
   * POST /api/v1/discard-empty-bags/discard
   * @param request - Discard bag request DTO
   * @returns Observable with discard bag response
   */
  discardBag(request: DiscardBagRequestDto): Observable<DiscardBagResponseDto> {
    const endpoint = API.DISCARD_EMPTY_BAGS.DISCARD;

    return this.apiService.post<ApiResponse<DiscardBagResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error('No data returned from discard API');
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
