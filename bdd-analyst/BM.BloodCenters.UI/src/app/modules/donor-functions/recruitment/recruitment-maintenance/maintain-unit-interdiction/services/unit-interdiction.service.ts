import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchParams,
  SearchResponse,
  GetInterdictionsParams,
  GetInterdictionsResponse,
  UnitInterdiction,
  ActiveInterdiction,
  CreateInterdictionsRequest,
  TerminateInterdictionRequest,
  ReleaseInterdictionRequest,
  InterdictionCode,
  InterdictionCodesResponse,
  TerminationReason,
  TerminationReasonsResponse,
  SearchOption,
  ApiResponse,
  SearchOptionsResponse
} from '../models/unit-interdiction.model';

@Injectable({
  providedIn: 'root'
})
export class UnitInterdictionService {
  private apiService = inject(ApiService);

  /**
   * Search for donation/deferral by unit ID, deferral ID, or transaction ID
   */
  searchDonation(params: SearchParams): Observable<SearchResponse> {
    return this.apiService.post<SearchResponse>(
      API.UNIT_INTERDICTION.SEARCH,
      params
    ).pipe(
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Map API active interdictions to UnitInterdiction format
   */
  mapActiveInterdictionsToUnitInterdictions(activeInterdictions: ActiveInterdiction[], transactionId: string): UnitInterdiction[] {
    return activeInterdictions.map((inter, index) => {
      return {
        id: `${transactionId}-${index}`, // Generate ID since API doesn't provide one
        transactionId: transactionId,
        code: inter.interCode,
        description: inter.interDesc,
        type: inter.interType,
        effectiveDate: inter.insertDate,
        terminationDate: inter.termDate || inter.terminationDate || undefined,
        releaseDate: inter.releaseDate || undefined,
        userId: inter.insertUser,
        releaseUser: inter.releaseUser || undefined,
        originated: inter.originatedFrom || inter.groupMode || '',
        reason: inter.reasonCode || inter.terminationReason || undefined,
        reasonDescription: inter.terminationReasonDesc,
        groupMode: inter.groupMode,
        groupId: inter.groupId,
        comments: undefined,
        isTerminated: inter.isTerminated || false,
        isReleased: inter.isReleased || false,
        canTerminate: inter.canTerminate ?? true, // Default to true if not provided
        canRelease: inter.canRelease ?? false // Default to false if not provided
      };
    });
  }

  /**
   * Get interdictions for a transaction
   */
  getInterdictions(params: GetInterdictionsParams): Observable<UnitInterdiction[]> {
    return this.apiService.post<GetInterdictionsResponse | ActiveInterdiction[]>(
      API.UNIT_INTERDICTION.GET,
      params
    ).pipe(
      map((response) => {
        // Handle wrapped response { data: [...] } or direct array
        let rawData: ActiveInterdiction[] = [];
        if (response && 'data' in response && Array.isArray(response.data)) {
          rawData = response.data;
        } else if (Array.isArray(response)) {
          rawData = response;
        }

        // Map API response to UnitInterdiction format
        // Note: API may return termDate/reasonCode (older format) or terminationDate/terminationReason (newer format)
        return rawData.map((item, index) => {
          return {
            id: `${params.transactionId}-${index}`,
            transactionId: params.transactionId || '',
            code: item.interCode || '',
            description: item.interDesc || '',
            type: item.interType || '',
            effectiveDate: item.insertDate || '',
            terminationDate: item.termDate || item.terminationDate || undefined,
            releaseDate: item.releaseDate || undefined,
            userId: item.insertUser || '',
            releaseUser: item.releaseUser || undefined,
            originated: item.originatedFrom || item.groupMode || '',
            reason: item.reasonCode || item.terminationReason || undefined,
            reasonDescription: item.terminationReasonDesc || undefined,
            groupMode: item.groupMode || undefined,
            groupId: item.groupId || undefined,
            comments: undefined,
            isTerminated: item.isTerminated || false,
            isReleased: item.isReleased || false,
            canTerminate: item.canTerminate ?? true, // Default to true if not provided
            canRelease: item.canRelease ?? false // Default to false if not provided
          };
        });
      }),
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Create new interdictions for a transaction
   */
  createInterdictions(request: CreateInterdictionsRequest): Observable<ApiResponse> {
    return this.apiService.post<ApiResponse>(
      API.UNIT_INTERDICTION.CREATE,
      request
    ).pipe(
      map((response) => {
        // Check if API returned success: false in the response body
        if (response && response.success === false) {
          throw {
            error: response.error || response.message || 'Failed to create interdiction',
            message: response.message || response.error || 'Failed to create interdiction',
            errorCode: response.errorCode,
            statusCode: response.statusCode
          };
        }
        return response;
      }),
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Terminate an interdiction with reason
   */
  terminateInterdiction(data: TerminateInterdictionRequest): Observable<ApiResponse> {
    return this.apiService.put<ApiResponse>(
      API.UNIT_INTERDICTION.TERMINATE,
      data
    ).pipe(
      map((response) => {
        // Check if API returned success: false in the response body
        if (response && response.success === false) {
          throw {
            error: response.error || response.message || 'Failed to terminate interdiction',
            message: response.message || response.error || 'Failed to terminate interdiction',
            errorCode: response.errorCode,
            statusCode: response.statusCode
          };
        }
        return response;
      }),
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Release an interdiction
   */
  releaseInterdiction(data: ReleaseInterdictionRequest): Observable<ApiResponse> {
    return this.apiService.put<ApiResponse>(
      API.UNIT_INTERDICTION.RELEASE,
      data
    ).pipe(
      map((response) => {
        // Check if API returned success: false in the response body
        if (response && response.success === false) {
          throw {
            error: response.error || response.message || 'Failed to release interdiction',
            message: response.message || response.error || 'Failed to release interdiction',
            errorCode: response.errorCode,
            statusCode: response.statusCode
          };
        }
        return response;
      }),
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Get search options (Donation/Deferral)
   */
  getSearchOptions(): Observable<SearchOption[]> {
    return this.apiService.get<SearchOptionsResponse>(
      API.UNIT_INTERDICTION.SEARCH_OPTIONS
    ).pipe(
      map((response) => {
        const options = response.item?.searchModes || [];
        // Filter out any options with null/undefined value or label
        return options.filter(opt => opt?.value && opt?.label);
      }),
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Get available interdiction codes
   */
  getInterdictionCodes(): Observable<InterdictionCode[]> {
    return this.apiService.get<InterdictionCodesResponse>(
      API.UNIT_INTERDICTION.INTERDICTION_CODES
    ).pipe(
      map((response) => {
        const codes = response.data || [];
        return codes.map(item => ({
          code: item.interCode,
          type: item.interType,
          description: item.interDesc
        }));
      }),
      catchError((error: unknown) => throwError(() => error))
    );
  }

  /**
   * Get termination reasons
   */
  getTerminationReasons(): Observable<TerminationReason[]> {
    return this.apiService.get<TerminationReasonsResponse>(
      API.UNIT_INTERDICTION.TERMINATION_REASONS
    ).pipe(
      map((response) => response.data || []),
      catchError((error: unknown) => throwError(() => error))
    );
  }
}
