import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../../shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  AssociateNicknameToName,
  AssociateNicknameApiModel,
  AssociateNicknameApiResponse,
  AssociateNicknameSingleApiResponse,
  AssociateNicknameCreateRequest,
  AssociateNicknameUpdateRequest,
  AssociateNicknameFilter,
  AssociateNicknameMutationResponse,
} from '../models/associate-nickname-to-name.model';

@Injectable({
  providedIn: 'root',
})
export class AssociateNicknameToNameApiService {
  private apiService = inject(ApiService);

  // Transform API model to frontend model
  private transformApiModel(apiModel: AssociateNicknameApiModel): AssociateNicknameToName {
    const isActive = this.calculateIsActive(apiModel.termDate);

    return {
      nickName: apiModel.nickName,
      firstName: apiModel.firstName,
      effDate: apiModel.effDate,
      termDate: apiModel.termDate || null,
      programId: apiModel.programId,
      insertDate: apiModel.insertDate,
      insertUser: apiModel.insertUser,
      auditKey: apiModel.auditKey,
      isActive,
    };
  }

  // Calculate if record is active based on termination date
  private calculateIsActive(termDate: string | null | undefined): boolean {
    if (!termDate) return true;
    const termination = new Date(termDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    termination.setHours(0, 0, 0, 0);
    return termination >= today;
  }

  // GET list with filters - POST /api/v1/associate-nickname-to-name/{take}/{skip}
  getAssociateNicknames(
    take: number,
    skip: number,
    filter?: AssociateNicknameFilter
  ): Observable<{ data: AssociateNicknameToName[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.ASSOCIATE_NICKNAME_TO_NAME_SEARCH(take, skip);
    const requestBody = this.buildRequestBody(filter);

    return this.apiService.post<AssociateNicknameApiResponse>(endpoint, requestBody).pipe(
      map((response) => {
        const transformedData = (response.data || []).map(item => this.transformApiModel(item));
        return {
          data: transformedData,
          total: response.total || 0,
        };
      }),
      catchError((error) => {
        console.error('Error fetching associate nicknames:', error);
        return throwError(() => error);
      })
    );
  }

  // GET single record - GET /api/v1/associate-nickname-to-name/{nickName}/{firstName}
  getAssociateNicknameByKey(
    nickName: string,
    firstName: string
  ): Observable<AssociateNicknameToName> {
    const endpoint = API.APPLICATION_ADMIN.ASSOCIATE_NICKNAME_TO_NAME_BY_KEY(nickName, firstName);
    return this.apiService.get<AssociateNicknameSingleApiResponse>(endpoint).pipe(
      map((response) => this.transformApiModel(response.item)),
      catchError((error) => {
        console.error('Error fetching associate nickname:', error);
        return throwError(() => error);
      })
    );
  }

  // CREATE - POST /api/v1/associate-nickname-to-name
  createAssociateNickname(
    request: AssociateNicknameCreateRequest
  ): Observable<AssociateNicknameMutationResponse> {
    const endpoint = API.APPLICATION_ADMIN.ASSOCIATE_NICKNAME_TO_NAME_CREATE;
    return this.apiService.post<AssociateNicknameMutationResponse>(endpoint, request).pipe(
      catchError((error) => {
        console.error('Error creating associate nickname:', error);
        return throwError(() => error);
      })
    );
  }

  // UPDATE - PUT /api/v1/associate-nickname-to-name/{nickName}/{firstName}
  updateAssociateNickname(
    nickName: string,
    firstName: string,
    request: AssociateNicknameUpdateRequest
  ): Observable<AssociateNicknameMutationResponse> {
    const endpoint = API.APPLICATION_ADMIN.ASSOCIATE_NICKNAME_TO_NAME_UPDATE(nickName, firstName);
    return this.apiService.put<AssociateNicknameMutationResponse>(endpoint, request).pipe(
      catchError((error) => {
        console.error('Error updating associate nickname:', error);
        return throwError(() => error);
      })
    );
  }

  // Build request body for search/filter
  private buildRequestBody(filter?: AssociateNicknameFilter): any {
    if (!filter) return {};

    const requestBody: any = {};

    if (filter.searchItem) {
      requestBody.searchItem = filter.searchItem;
    }
    if (filter.nickName) {
      requestBody.nickName = filter.nickName;
    }
    if (filter.firstName) {
      requestBody.firstName = filter.firstName;
    }
    if (filter.effectiveDate) {
      requestBody.effectiveDate = filter.effectiveDate;
    }
    if (filter.effectivePeriod) {
      requestBody.effectivePeriod = filter.effectivePeriod;
    }
    if (filter.terminationDate) {
      requestBody.terminationDate = filter.terminationDate;
    }
    if (filter.terminationPeriod) {
      requestBody.terminationPeriod = filter.terminationPeriod;
    }
    if (filter.includeTerminated !== undefined) {
      requestBody.includeTerminated = filter.includeTerminated;
    }
    if (filter.sort) {
      requestBody.sort = filter.sort;
    }

    return requestBody;
  }
}
