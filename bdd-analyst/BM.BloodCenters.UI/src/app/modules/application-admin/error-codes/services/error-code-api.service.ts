import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API } from '../../../../core/constants/api.constants';
import { ApiService } from '../../../../shared/services/api.service';
import {
  ErrorCodeListApiResponse,
  ErrorCodeMutationApiResponse,
  ErrorCodeCreateRequest,
  ErrorCodeListRequest,
  PaginationParams,
  TabType,
  ErrorCodeListResponse,
  mapApiResponseToErrorCode,
  CodeExistenceCheckResponse
} from '../models/error-code.model';

/**
 * Service for managing error codes API operations
 * Handles API calls for donor error codes
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorCodeApiService {
  private apiService = inject(ApiService);

  /**
   * Build request body with only defined/non-empty values
   * Helper method to avoid code duplication
   */
  private buildRequestBody(filters: ErrorCodeListRequest): ErrorCodeListRequest {
    const requestBody: ErrorCodeListRequest = {};
    
    if (filters.searchKeyword !== undefined && filters.searchKeyword !== '') {
      requestBody.searchKeyword = filters.searchKeyword;
    }
    if (filters.codeFrom !== undefined && filters.codeFrom !== '') {
      requestBody.codeFrom = filters.codeFrom;
    }
    if (filters.codeTo !== undefined && filters.codeTo !== '') {
      requestBody.codeTo = filters.codeTo;
    }
    if (filters.auditFlag !== undefined && filters.auditFlag !== '') {
      requestBody.auditFlag = filters.auditFlag;
    }
    if (filters.errorType !== undefined && filters.errorType !== '') {
      requestBody.errorType = filters.errorType;
    }
    if (filters.showEmpty !== undefined) { 
      requestBody.showEmpty = filters.showEmpty;
    }
    if (filters.sort !== undefined && filters.sort !== '') {
      requestBody.sort = filters.sort;
    }
    
    return requestBody;
  }

  /**
   * Generic method to fetch error codes for any tab type
   * Helper method to avoid code duplication
   */
  private fetchErrorCodesList(
    endpoint: string,
    filters: ErrorCodeListRequest,
    errorContext: string
  ): Observable<ErrorCodeListResponse> {
    const requestBody = this.buildRequestBody(filters);

    return this.apiService.post<ErrorCodeListApiResponse>(endpoint, requestBody).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch error codes');
        }
        
        return {
          data: response.data.map(apiResponse => mapApiResponseToErrorCode(apiResponse)),
          total: response.total
        };
      }),
      catchError(error => {
        console.error(`Error fetching ${errorContext} error codes:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donor error codes list with filters and pagination
   * POST /api/v1/application-admin/donor-error-codes/{take}/{skip}
   */
  getDonorErrorCodes(
    filters: ErrorCodeListRequest,
    pagination: PaginationParams
  ): Observable<ErrorCodeListResponse> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_ERROR_CODES(
      pagination.take,
      pagination.skip
    );
    return this.fetchErrorCodesList(endpoint, filters, 'donor');
  }

  /**
   * Generic method to create or update error codes
   * Helper method to avoid code duplication
   */
  private mutateErrorCode(
    endpoint: string,
    request: ErrorCodeCreateRequest,
    method: 'POST' | 'PUT',
    errorContext: string
  ): Observable<ErrorCodeMutationApiResponse> {
    const requestBody = {
      errorCode: request.errorCode,
      errorType: request.errorType,
      auditFlag: request.auditFlag,
      error: request.error
    };

    const apiCall = method === 'POST' 
      ? this.apiService.post<ErrorCodeMutationApiResponse>(endpoint, requestBody)
      : this.apiService.put<ErrorCodeMutationApiResponse>(endpoint, requestBody);

    return apiCall.pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || response.error || 'Failed to mutate error code');
        }
        return response;
      }),
      catchError(error => {
        const action = method === 'POST' ? 'creating' : 'updating';
        console.error(`Error ${action} ${errorContext} error code:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new donor error code
   * POST /api/v1/application-admin/donor-error-code
   */
  createDonorErrorCode(request: ErrorCodeCreateRequest): Observable<ErrorCodeMutationApiResponse> {
    return this.mutateErrorCode(API.APPLICATION_ADMIN.DONOR_ERROR_CODE, request, 'POST', 'donor');
  }

  /**
   * Update an existing donor error code
   * PUT /api/v1/application-admin/donor-error-code
   */
  updateDonorErrorCode(
    errorCode: string,
    request: ErrorCodeCreateRequest
  ): Observable<ErrorCodeMutationApiResponse> {
    const updateRequest = { ...request, errorCode };
    return this.mutateErrorCode(API.APPLICATION_ADMIN.DONOR_ERROR_CODE, updateRequest, 'PUT', 'donor');
  }

  /**
   * Check if a donor error code already exists
   * GET /api/v1/application-admin/is-code/{code}
   */
  checkDonorCodeExists(code: string): Observable<boolean> {
    const endpoint = API.APPLICATION_ADMIN.IS_CODE_EXISTS(code);
    return this.apiService.get<CodeExistenceCheckResponse>(endpoint).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to check code existence');
        }
        return response.item.isExists;
      }),
      catchError(error => {
        console.error('Error checking donor code existence:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if a lab error code already exists
   * GET /api/v1/application-admin/is-code/{code}
   */
  checkLabCodeExists(code: string): Observable<boolean> {
    const endpoint = API.APPLICATION_ADMIN.IS_CODE_EXISTS(code);
    return this.apiService.get<CodeExistenceCheckResponse>(endpoint).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to check code existence');
        }
        return response.item.isExists;
      }),
      catchError(error => {
        console.error('Error checking lab code existence:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if a distribution error code already exists
   * GET /api/v1/application-admin/is-code/{code}
   */
  checkDistributionCodeExists(code: string): Observable<boolean> {
    const endpoint = API.APPLICATION_ADMIN.IS_CODE_EXISTS(code);
    return this.apiService.get<CodeExistenceCheckResponse>(endpoint).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to check code existence');
        }
        return response.item.isExists;
      }),
      catchError(error => {
        console.error('Error checking distribution code existence:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generic method to check if error code exists based on tab type
   */
  checkCodeExists(tabType: TabType, code: string): Observable<boolean> {
    if (tabType === TabType.DONOR) {
      return this.checkDonorCodeExists(code);
    } else if (tabType === TabType.LAB) {
      return this.checkLabCodeExists(code);
    } else if (tabType === TabType.DISTRIBUTION) {
      return this.checkDistributionCodeExists(code);
    }

    return throwError(() => new Error(`Tab type ${tabType} not yet implemented`));
  }

  /**
   * Get lab error codes list with filters and pagination
   * POST /api/v1/admin/lab-error-codes/{take}/{skip}
   */
  getLabErrorCodes(
    filters: ErrorCodeListRequest,
    pagination: PaginationParams
  ): Observable<ErrorCodeListResponse> {
    const endpoint = API.APPLICATION_ADMIN.LAB_ERROR_CODES(
      pagination.take,
      pagination.skip
    );
    return this.fetchErrorCodesList(endpoint, filters, 'lab');
  }

  /**
   * Get distribution error codes list with filters and pagination
   * POST /api/v1/application-admin/distribution-error-codes/{take}/{skip}
   */
  getDistributionErrorCodes(
    filters: ErrorCodeListRequest,
    pagination: PaginationParams
  ): Observable<ErrorCodeListResponse> {
    const endpoint = API.APPLICATION_ADMIN.DISTRIBUTION_ERROR_CODES(
      pagination.take,
      pagination.skip
    );
    return this.fetchErrorCodesList(endpoint, filters, 'distribution');
  }

  /**
   * Generic method for error codes based on tab type
   */
  getErrorCodes(
    tabType: TabType,
    filters: ErrorCodeListRequest,
    pagination: PaginationParams
  ): Observable<ErrorCodeListResponse> {
    if (tabType === TabType.DONOR) {
      return this.getDonorErrorCodes(filters, pagination);
    } else if (tabType === TabType.LAB) {
      return this.getLabErrorCodes(filters, pagination);
    } else if (tabType === TabType.DISTRIBUTION) {
      return this.getDistributionErrorCodes(filters, pagination);
    }
    
    return throwError(() => new Error(`Tab type ${tabType} not yet implemented`));
  }

  /**
   * Create a new lab error code
   * POST /api/v1/admin/lab-error-code
   */
  createLabErrorCode(request: ErrorCodeCreateRequest): Observable<ErrorCodeMutationApiResponse> {
    return this.mutateErrorCode(API.APPLICATION_ADMIN.LAB_ERROR_CODE, request, 'POST', 'lab');
  }

  /**
   * Update an existing lab error code
   * PUT /api/v1/admin/lab-error-code
   */
  updateLabErrorCode(
    errorCode: string,
    request: ErrorCodeCreateRequest
  ): Observable<ErrorCodeMutationApiResponse> {
    const updateRequest = { ...request, errorCode };
    return this.mutateErrorCode(API.APPLICATION_ADMIN.LAB_ERROR_CODE, updateRequest, 'PUT', 'lab');
  }

  /**
   * Create a new distribution error code
   * POST /api/v1/application-admin/distribution-error-code
   */
  createDistributionErrorCode(request: ErrorCodeCreateRequest): Observable<ErrorCodeMutationApiResponse> {
    return this.mutateErrorCode(API.APPLICATION_ADMIN.DISTRIBUTION_ERROR_CODE, request, 'POST', 'distribution');
  }

  /**
   * Update an existing distribution error code
   * PUT /api/v1/application-admin/distribution-error-code
   */
  updateDistributionErrorCode(
    errorCode: string,
    request: ErrorCodeCreateRequest
  ): Observable<ErrorCodeMutationApiResponse> {
    const updateRequest = { ...request, errorCode };
    return this.mutateErrorCode(API.APPLICATION_ADMIN.DISTRIBUTION_ERROR_CODE, updateRequest, 'PUT', 'distribution');
  }

  /**
   * Generic create method based on tab type
   */
  createErrorCode(
    tabType: TabType,
    request: ErrorCodeCreateRequest
  ): Observable<ErrorCodeMutationApiResponse> {
    if (tabType === TabType.DONOR) {
      return this.createDonorErrorCode(request);
    } else if (tabType === TabType.LAB) {
      return this.createLabErrorCode(request);
    } else if (tabType === TabType.DISTRIBUTION) {
      return this.createDistributionErrorCode(request);
    }
    
    return throwError(() => new Error(`Tab type ${tabType} not yet implemented`));
  }

  /**
   * Generic update method based on tab type
   */
  updateErrorCode(
    tabType: TabType,
    errorCode: string,
    request: ErrorCodeCreateRequest
  ): Observable<ErrorCodeMutationApiResponse> {
    if (tabType === TabType.DONOR) {
      return this.updateDonorErrorCode(errorCode, request);
    } else if (tabType === TabType.LAB) {
      return this.updateLabErrorCode(errorCode, request);
    } else if (tabType === TabType.DISTRIBUTION) {
      return this.updateDistributionErrorCode(errorCode, request);
    }
    
    return throwError(() => new Error(`Tab type ${tabType} not yet implemented`));
  }
}