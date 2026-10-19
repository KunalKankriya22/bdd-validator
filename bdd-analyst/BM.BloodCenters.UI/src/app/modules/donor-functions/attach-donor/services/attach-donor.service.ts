import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  GradedDonorDto,
  GradedDonationDto,
  SelectDonorRequestDto,
  MarkDuplicateRequestDto,
  MarkFalseDuplicateRequestDto,
  ApiResponse,
  SelectDonorResponseData,
  MarkDuplicatesResponseData,
  AddGradedDonorRequestDto,
  AttachDonorContext,
  TransactionType
} from '../models/attach-donor.model';

/**
 * Business error code to user-friendly message mapping
 * Error codes from backend API documentation
 */
const ATTACH_DONOR_ERROR_MESSAGES: Record<string, string> = {
  '16022': 'Donor is already attached to this transaction',
  '16023': 'Transaction has already been resolved with a different donor',
  '16028': 'Invalid transaction state - cannot attach donor',
  '16060': 'Donor record is locked by another user',
  '16107': 'Duplicate donor marking failed - donors must be from same transaction',
  '16113': 'Cannot mark donor as duplicate - donor is already selected',
  '16157': 'False duplicate flag cannot be removed once set',
  '16206': 'Transaction is in HOLD status and cannot be modified',
  '16211': 'Confirmation scan does not match donor ID',
  '21138': 'Database constraint violation - contact system administrator'
};

/**
 * Attach Donor Service
 * Handles all API calls for the Attach Donor feature (DRUREHLD)
 * Based on API documentation from MLT-10498
 */
@Injectable({
  providedIn: 'root'
})
export class AttachDonorService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Helper to get chapter ID from user session
   */
  private getChapterId(): string {
    return this.headerService.getCurrentChapterId() || '';
  }

  /**
   * Helper to get current username
   */
  private getUsername(): string {
    return this.headerService.getCurrentUsername() || '';
  }

  /**
   * Get graded donor matches for a transaction
   * Endpoint: GET /api/attach-donor/graded-donors/{transactionId}
   * @param transactionId - Unique transaction identifier
   * @returns Observable with array of graded donors
   */
  getGradedDonors(transactionId: string): Observable<GradedDonorDto[]> {
    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.GET_GRADED_DONORS(transactionId);

    return this.apiService.get<ApiResponse<GradedDonorDto[]>>(endpoint).pipe(
      map(response => {
        if (response.success) {
          return response.data || [];
        }
        throw new Error(response.message || 'Failed to fetch graded donors');
      }),
      catchError(error => {
        // error handled by caller
        return throwError(() => error);
      })
    );
  }

  /**
   * Get transaction details
   * Endpoint: GET /api/attach-donor/transaction/{transactionId}
   * @param transactionId - Unique transaction identifier
   * @returns Observable with transaction details
   */
  getTransaction(transactionId: string): Observable<GradedDonationDto> {
    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.GET_TRANSACTION(transactionId);

    return this.apiService.get<ApiResponse<GradedDonationDto>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Transaction not found');
      }),
      catchError(error => {
        // error handled by caller
        return throwError(() => error);
      })
    );
  }

  /**
   * Get transaction details by Unit ID
   * Endpoint: GET /api/v1/attach-donor/transaction/by-unit/{unitId}
   * @param unitId - Unique unit identifier
   * @returns Observable with transaction details
   */
  getTransactionByUnit(unitId: string): Observable<GradedDonationDto> {
    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.GET_TRANSACTION_BY_UNIT(unitId);

    return this.apiService.get<ApiResponse<GradedDonationDto>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Transaction not found for this Unit ID');
      }),
      catchError(error => {
        // error handled by caller
        return throwError(() => error);
      })
    );
  }

  /**
   * Select a donor and attach to transaction
   * Endpoint: POST /api/v1/attach-donor/select-donor
   * @param request - Basic request with transactionId and donorId
   * @param confirmationScan - Optional barcode scan for verification
   * @returns Observable with select donor response
   */
  selectDonor(
    request: { transactionId: string; donorId: string },
    confirmationScan?: string
  ): Observable<ApiResponse<SelectDonorResponseData>> {
    // Auto-populate chapter and user context
    const payload: SelectDonorRequestDto = {
      ...request,
      selectedBy: this.getUsername(),
      chapterId: this.getChapterId(),
      confirmationScan
    };

    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.SELECT_DONOR;

    return this.apiService.post<ApiResponse<SelectDonorResponseData>>(endpoint, payload).pipe(
      map(response => response),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Mark multiple donors as duplicates
   * Endpoint: POST /api/v1/attach-donor/mark-duplicates
   * @param request - Request with primaryDonorId, duplicateDonorIds, transactionId
   * @returns Observable with mark duplicates response
   */
  markDuplicates(request: {
    primaryDonorId: string;
    duplicateDonorIds: string[];
    transactionId: string;
  }): Observable<ApiResponse<MarkDuplicatesResponseData>> {
    // Validation: minimum 2 donors required
    if (request.duplicateDonorIds.length < 1) {
      return throwError(() => ({
        message: 'At least 2 donors total (1 primary + 1 duplicate) are required to mark duplicates'
      }));
    }

    // Auto-populate chapter context
    const payload: MarkDuplicateRequestDto = {
      ...request,
      chapterId: this.getChapterId()
    };

    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.MARK_DUPLICATES;

    return this.apiService.post<ApiResponse<MarkDuplicatesResponseData>>(endpoint, payload).pipe(
      map(response => response),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Mark a donor as false duplicate
   * Endpoint: POST /api/v1/attach-donor/mark-false-duplicate
   * @param request - Request with donorId, transactionId, and mandatory comments
   * @returns Observable with mark false duplicate response
   */
  markFalseDuplicate(request: {
    donorId: string;
    transactionId: string;
    comments: string;
  }): Observable<ApiResponse<void>> {
    // Validation: comments are mandatory
    if (!request.comments || request.comments.trim().length === 0) {
      return throwError(() => ({
        message: 'Comments are required when marking a donor as false duplicate'
      }));
    }

    // Auto-populate chapter context
    const payload: MarkFalseDuplicateRequestDto = {
      ...request,
      chapterId: this.getChapterId()
    };

    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.MARK_FALSE_DUPLICATE;

    return this.apiService.post<ApiResponse<void>>(endpoint, payload).pipe(
      map(response => response),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Put donor on hold
   * Endpoint: POST /api/v1/attach-donor/put-on-hold
   * @param donorId - Donor ID to put on hold
   * @param transactionId - Transaction ID
   * @returns Observable with API response
   */
  putDonorOnHold(donorId: string, transactionId: string): Observable<ApiResponse<any>> {
    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.PUT_DONOR_ON_HOLD;

    const payload = {
      donorId,
      transactionId,
      chapterId: this.getChapterId()
    };

    return this.apiService.post<ApiResponse<any>>(endpoint, payload).pipe(
      map(response => response),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get full donor information by ID (including employer details)
   * Endpoint: GET /api/v1/donors/{donorId}
   * @param donorId - Donor ID to fetch
   * @returns Observable with full donor information
   */
  getDonorById(donorId: string): Observable<any> {
    const endpoint = API.ADD_DONOR.GET_BY_ID(donorId);

    return this.apiService.get<ApiResponse<any>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          // Backend returns data as array [{...}], extract first element
          if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          // Fallback: if it's not an array, return as-is
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch donor demographics');
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Update donor personal information
   * Endpoint: PUT /api/v1/donors/{donorId}
   * @param donorId - Donor ID to update
   * @param donorData - Updated donor information
   * @returns Observable with update response
   */
  updateDonor(donorId: string, donorData: any): Observable<ApiResponse<any>> {
    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.UPDATE_DONOR(donorId);

    return this.apiService.put<ApiResponse<any>>(endpoint, donorData).pipe(
      map(response => response),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get employers lookup for dropdown
   * Endpoint: GET /api/v1/donors/lookups/employers
   * @param searchKeyword - Optional search filter
   * @returns Observable with employers list
   */
  getLookupEmployers(searchKeyword: string = ''): Observable<{ value: string; label: string }[]> {
    const endpoint = searchKeyword
      ? `${API.ADD_DONOR.LOOKUPS.EMPLOYERS}?searchKeyword=${encodeURIComponent(searchKeyword)}`
      : API.ADD_DONOR.LOOKUPS.EMPLOYERS;

    return this.apiService.get<ApiResponse<any>>(endpoint).pipe(
      map(response => {
        if (response.success && response.data) {
          // Backend returns nested array: data: [[{value, label}]]
          const items = Array.isArray(response.data[0]) ? response.data[0] : response.data;
          return items.map((item: any) => ({
            value: item.value || item.Value || '',
            label: item.label || item.Label || ''
          }));
        }
        return [];
      }),
      catchError(error => {
        // error handled — return empty
        // Return empty array instead of throwing error
        return of([]);
      })
    );
  }

  /**
   * Get city and state by ZIP code
   * Endpoint: GET /api/v1/shared/city-state?zip={zip}
   * @param zip - ZIP code to lookup
   * @returns Observable with array of city/state results (one ZIP can have multiple cities)
   */
  getCityStateByZip(zip: string): Observable<{ city: string; state: string; uspsId: number; zip: string }[]> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService.get<any>(API.ALTERNATE_DEMOGRAPHICS.CITY_STATE, {
      params: new HttpParams().set('zip', zip),
      context
    }).pipe(
      map(response => {
        if (response?.data) {
          return response.data || [];
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Search cities by keyword
   * Endpoint: GET /api/v1/donors/lookups/cities?searchKeyword={search}
   * @param search - Search keyword
   * @returns Observable with cities list
   */
  searchCities(search: string): Observable<{ code: string; description: string }[]> {
    if (!search || search.trim().length < 2) {
      return of([]);
    }

    return this.apiService.get<ApiResponse<any>>(
      API.ADD_DONOR.LOOKUPS.CITIES(search)
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError(() => of([]))
    );
  }

  /**
   * Get zip codes for a city
   * Endpoint: GET /api/v1/donors/lookups/zips?city={city}
   * @param city - City name
   * @returns Observable with zip codes list
   */
  getZipsByCity(city: string): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<ApiResponse<any>>(
      API.ADD_DONOR.LOOKUPS.ZIPS(city)
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError(() => of([]))
    );
  }

  /**
   * Extract lookup items from API response
   * Handles nested array structures from backend
   */
  private extractLookupItems(data: any): { code: string; description: string }[] {
    if (!data) return [];
    let items = data;
    if (Array.isArray(items) && items.length > 0 && Array.isArray(items[0])) {
      items = items[0];
    }
    if (!Array.isArray(items)) return [];
    return items.map((item: Record<string, string>) => ({
      code: item['value'] || item['Value'] || item['code'] || '',
      description: item['label'] || item['Label'] || item['description'] || '',
    }));
  }

  addGradedDonor(request: AddGradedDonorRequestDto): Observable<ApiResponse<any>> {
    const endpoint = API.DONOR_FUNCTIONS.ATTACH_DONOR.ADD_GRADED_DONOR;
    return this.apiService.post<ApiResponse<any>>(endpoint, request).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createDonor(donorData: any): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(API.ADD_DONOR.CREATE, donorData).pipe(
      map(response => response),
      catchError(error => this.handleError(error))
    );
  }

  getLookupEthnicGroups(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<ApiResponse<any>>(
      API.ADD_DONOR.LOOKUPS.ETHNIC_GROUPS
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError(() => of([]))
    );
  }

  validateAreaCode(areaCode: string): Observable<boolean> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService.get<ApiResponse<any>>(
      API.LOOKUPS.VALIDATE('AREAC', areaCode),
      { context }
    ).pipe(
      map(response => response?.success === true),
      catchError(() => of(false))
    );
  }

  validateZipCity(zip: string, city: string): Observable<boolean> {
    return this.getCityStateByZip(zip).pipe(
      map(results => {
        if (!results || results.length === 0) return false;
        return results.some(r => r.city?.toUpperCase() === city.toUpperCase());
      }),
      catchError(() => of(false))
    );
  }

  // --- Session storage context for cross-navigation state ---

  private readonly CONTEXT_KEY = 'attachDonorContext';
  private readonly MAX_AGE_MS = 30 * 60 * 1000;

  saveContext(context: Omit<AttachDonorContext, 'timestamp'>): void {
    try {
      const stored: AttachDonorContext = { ...context, timestamp: Date.now() };
      sessionStorage.setItem(this.CONTEXT_KEY, JSON.stringify(stored));
    } catch { /* ignore storage errors */ }
  }

  getContext(): AttachDonorContext | null {
    try {
      const raw = sessionStorage.getItem(this.CONTEXT_KEY);
      if (!raw) return null;
      const ctx: AttachDonorContext = JSON.parse(raw);
      if (Date.now() - ctx.timestamp > this.MAX_AGE_MS) {
        this.clearContext();
        return null;
      }
      return ctx;
    } catch {
      this.clearContext();
      return null;
    }
  }

  clearContext(): void {
    try { sessionStorage.removeItem(this.CONTEXT_KEY); } catch { /* ignore */ }
  }

  /**
   * Centralized error handler with business error code mapping
   */
  private handleError(error: any): Observable<never> {
    let errorMessage: string;

    // Extract error code from response
    const errorCode = error?.error?.errorCode ||
                      error?.error?.errorResponse?.errorCode;

    // Check for business error codes first
    if (errorCode && ATTACH_DONOR_ERROR_MESSAGES[errorCode]) {
      errorMessage = ATTACH_DONOR_ERROR_MESSAGES[errorCode];
    } else if (error?.error?.message) {
      // Backend provided a message
      errorMessage = error.error.message;
    } else {
      // Generic HTTP status fallback
      errorMessage = error?.status === 0
        ? 'Cannot connect to server. Please check your network connection.'
        : error?.message || 'An unexpected error occurred';
    }

    // error mapped to user-friendly message below

    return throwError(() => ({
      ...error,
      message: errorMessage,
      errorCode: errorCode || null
    }));
  }
}
