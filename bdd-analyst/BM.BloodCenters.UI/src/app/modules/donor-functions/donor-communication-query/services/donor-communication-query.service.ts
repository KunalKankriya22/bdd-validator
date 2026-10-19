import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonorCommunicationQueryRequest,
  DonorCommunicationQueryResponse,
  CommunicationRecord,
  ActionCodeOption,
  UpdateCommunicationRequest,
  UpdateCommunicationResponse,
  CommunicationCompositeId,
  CommunicationTypeOption,
  CommunicationTypeResponse,
  CommunicationCodeOption,
  CommunicationCodeResponse,
  UserListItem,
  CommunicationDropdownsResponse,
} from '../models/donor-communication-query.model';

/**
 * Service for Donor Communication Query API operations
 * JIRA: MLT-11066
 * Base URL: /api/v1/donor-communication-query
 */
@Injectable({ providedIn: 'root' })
export class DonorCommunicationQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Query donor communications with pagination and filters
   * @param request - Query filters (fromDate and toDate are required)
   * @param take - Number of records to return
   * @param skip - Number of records to skip
   * @returns Observable of communication records with total count
   */
  query(
    request: DonorCommunicationQueryRequest,
    take: number = 25,
    skip: number = 0,
  ): Observable<{ data: CommunicationRecord[]; total: number }> {
    // Transform boolean pendingActionsOnly to "T"/"F" for API
    const apiRequest = {
      ...request,
      pendingActionsOnly: request.pendingActionsOnly === true ? 'T' :
                          request.pendingActionsOnly === false ? 'F' :
                          undefined
    };

    return this.apiService
      .post<any>(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.QUERY(take, skip),
        apiRequest
      )
      .pipe(
        map((response) => ({
          data: (response.Data || response.data || []).map((item: any) => this.mapToCamelCase(item)),
          total: response.Total || response.total || 0,
        })),
      );
  }

  /**
   * Map API response from PascalCase to camelCase
   */
  private mapToCamelCase(item: any): CommunicationRecord {
    return {
      donorId: item.DonorId || item.donorId,
      name: item.Name || item.name,
      dob: item.Dob || item.dob,
      sex: item.Sex || item.sex,
      abo: item.Abo || item.abo,
      comType: item.ComType || item.comType,
      comCode: item.ComCode || item.comCode,
      insertUser: item.InsertUser || item.insertUser,

      // Display dates (chapter local time)
      comDate: item.ComDate || item.comDate,
      insertDate: item.InsertDate || item.insertDate,
      targetDate: item.TargetDate !== undefined ? item.TargetDate : (item.targetDate !== undefined ? item.targetDate : null),
      actionDate: item.ActionDate !== undefined ? item.ActionDate : (item.actionDate !== undefined ? item.actionDate : null),

      // GMT dates (for API operations)
      insertDateGmt: item.InsertDateGmt || item.insertDateGmt,
      targetDateGmt: item.TargetDateGmt !== undefined ? item.TargetDateGmt : (item.targetDateGmt !== undefined ? item.targetDateGmt : null),
      actionDateGmt: item.ActionDateGmt !== undefined ? item.ActionDateGmt : (item.actionDateGmt !== undefined ? item.actionDateGmt : null),

      actionCode: item.ActionCode !== undefined ? item.ActionCode : (item.actionCode !== undefined ? item.actionCode : null),
      comDesc: item.ComDesc !== undefined ? item.ComDesc : (item.comDesc !== undefined ? item.comDesc : null),
      chapterId: item.ChapterId || item.chapterId,
    };
  }

  /**
   * Get a single communication record by composite ID
   * @param id - Composite ID containing donorId, comType, comCode, insertUser, insertDate
   * @returns Observable of communication record
   */
  getById(id: CommunicationCompositeId): Observable<CommunicationRecord> {
    return this.apiService
      .get<any>(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.GET_BY_ID(
          id.donorId,
          id.comType,
          id.comCode,
          id.insertUser,
          id.insertDate
        )
      )
      .pipe(
        map((response) => {
          const data = response.Data || response.data;
          if (data && data.length > 0) {
            return this.mapToCamelCase(data[0]);
          }
          throw new Error('Record not found');
        }),
      );
  }

  /**
   * Update a communication record
   * Limited to: actionCode, targetDate, actionDate, comDesc
   * @param id - Composite ID
   * @param request - Update payload
   * @returns Observable of updated communication record
   */
  update(
    id: CommunicationCompositeId,
    request: UpdateCommunicationRequest,
  ): Observable<UpdateCommunicationResponse> {
    return this.apiService
      .put<any>(
        API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.UPDATE(
          id.donorId,
          id.comType,
          id.comCode,
          id.insertUser,
          id.insertDate
        ),
        request
      )
      .pipe(
        map((response) => {
          const success = response.Success !== undefined ? response.Success : response.success;
          if (!success) {
            const errorResponse = response.ErrorResponse || response.errorResponse;
            const message = response.Message || response.message;
            throw new Error(errorResponse?.Error || errorResponse?.error || message || 'Update failed');
          }
          return {
            success: success,
            message: response.Message || response.message || '',
            statusCode: response.StatusCode || response.statusCode || 200,
            data: response.Data || response.data,
            errorResponse: response.ErrorResponse || response.errorResponse,
          };
        }),
      );
  }

  /**
   * Get active action codes for dropdown
   * @returns Observable of action code options
   */
  getActionCodes(): Observable<ActionCodeOption[]> {
    return this.apiService
      .get<any>(API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.ACTION_CODES)
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response.map((item: any) => ({
              code: item.CommCode || item.commCode || item.code,
              description: item.Description || item.description,
            }));
          }
          // Handle wrapped response format (PascalCase or camelCase)
          const data = response.Data || response.data || [];
          return data.map((item: any) => ({
            code: item.CommCode || item.commCode || item.code,
            description: item.Description || item.description,
          }));
        }),
      );
  }

  /**
   * Get communication types for dropdown
   * @returns Observable of communication type options
   */
  getCommunicationTypes(): Observable<CommunicationTypeOption[]> {
    return this.apiService
      .get<any>(API.COMMON_LETTER.COMMUNICATION_TYPES)
      .pipe(
        map((response) => {
          const success = response.Success !== undefined ? response.Success : response.success;
          const data = response.Data || response.data;
          if (success && data) {
            return data.map((item: any) => ({
              code: item.Code || item.code,
              description: item.Description || item.description,
            }));
          }
          return [];
        }),
      );
  }

  /**
   * Get communication codes for a specific communication type (cascading dropdown)
   * @param commType - Communication type code
   * @returns Observable of communication code options
   */
  getCommunicationCodes(commType: string): Observable<CommunicationCodeOption[]> {
    return this.apiService
      .get<any>(API.COMMON_LETTER.COMMUNICATION_CODES(commType))
      .pipe(
        map((response) => {
          const success = response.Success !== undefined ? response.Success : response.success;
          const data = response.Data || response.data;
          if (success && data) {
            return data.map((item: any) => ({
              code: item.Code || item.code,
              description: item.Description || item.description,
            }));
          }
          return [];
        }),
      );
  }

  /**
   * Get both communication type and communication code dropdowns in a single call
   * @returns Observable of communication dropdowns (type and code)
   */
  getCommunicationDropdowns(): Observable<CommunicationDropdownsResponse> {
    return this.apiService
      .get<any>(API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.COMMUNICATION_DROPDOWNS)
      .pipe(
        map((response) => ({
          communicationType: (response.communicationType || []).map((item: any) => ({
            key: item.key || '',
            value: item.value || '',
            description: item.description || '',
          })),
          communicationCode: (response.communicationCode || []).map((item: any) => ({
            key: item.key || '',
            value: item.value || '',
            description: item.description || '',
          })),
        })),
      );
  }

  /**
   * Get users who created donor communications within a date range
   * @param fromDate - Optional start date (defaults to 90 days ago)
   * @param toDate - Optional end date (defaults to today)
   * @returns Observable of user list items
   */
  getUsers(fromDate?: string, toDate?: string): Observable<UserListItem[]> {
    let params = new HttpParams();

    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.apiService
      .get<any>(API.DONOR_FUNCTIONS.DONOR_COMMUNICATION_QUERY.USERS, { params })
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response.map((item: any) => ({
              userId: item.UserId || item.userId,
              userName: item.UserName || item.userName,
            }));
          }
          // Handle wrapped response format (PascalCase or camelCase)
          const data = response.Data || response.data || [];
          return data.map((item: any) => ({
            userId: item.UserId || item.userId,
            userName: item.UserName || item.userName,
          }));
        }),
      );
  }
}
