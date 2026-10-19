import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  DonorSearchRequest,
  DonorSearchResponse,
  MatchGradeSummary,
  SessionResult
} from '../models/donor-routine-logic.model';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonorRoutineLogicService {
  private readonly apiService = inject(ApiService);
  private readonly baseEndpoint = 'api/v1/donor-routine-logic';

  /**
   * Search for donors using Find Donor Routine Logic with grading
   */
  searchDonors(request: DonorSearchRequest): Observable<DonorSearchResponse> {
    return this.apiService.post<ApiResponse<DonorSearchResponse[]>>(
      `${this.baseEndpoint}/search`,
      request
    ).pipe(
      map(response => {
        // API returns array with single object, extract it
        return response.data[0];
      })
    );
  }

  /**
   * Get donor routine logic records with pagination
   */
  getDonorRoutineLogic(take: number, skip: number): Observable<{ data: SessionResult[]; total: number }> {
    return this.apiService.post<ApiResponse<SessionResult[]>>(
      `${this.baseEndpoint}/${take}/${skip}`,
      {}
    ).pipe(
      map(response => ({
        data: response.data,
        total: response.total
      }))
    );
  }

  /**
   * Get donor search results for a specific session
   */
  getSessionResults(sessionId: string): Observable<MatchGradeSummary> {
    return this.apiService.get<ApiResponse<SessionResult[]>>(
      `${this.baseEndpoint}/session/${sessionId}`
    ).pipe(
      map(response => {
        const results = response.data;

        // Calculate grade counts from results
        const grade1Count = results.filter(r => r.grade === 1).length;
        const grade2Count = results.filter(r => r.grade === 2).length;
        const grade3Count = results.filter(r => r.grade === 3).length;
        const grade4Count = results.filter(r => r.grade === 4).length;
        const grade5Count = results.filter(r => r.grade === 5).length;

        return {
          sessionId,
          totalDonors: results.length,
          grade1Count,
          grade2Count,
          grade3Count,
          grade4Count,
          grade5Count,
          results
        };
      })
    );
  }

  /**
   * Get session results array by session ID
   */
  getSessionResultsBySessionId(sessionId: string): Observable<SessionResult[]> {
    return this.apiService.get<ApiResponse<SessionResult[]>>(
      `${this.baseEndpoint}/session/${sessionId}`
    ).pipe(
      map(response => response.data)
    );
  }
}
