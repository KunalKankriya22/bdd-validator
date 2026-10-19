import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { UserAccount } from '../../../shared/interfaces/user-account.interface';
import { of } from 'rxjs';

export interface GetUserAccountsRequest {
  periodEffDate?: string | null;
  periodTermDate?: string | null;
  effectiveDate?: string | null;
  termDate?: string | null;
  searchKeyword?: string | null;
  sortDirection?: string | null;
  accountStatus?: string | null;
}

export interface UserAccountApiResponse {
  useR_ID: string;
  chapteR_ID: string;
  stafF_NO: string;
  useR_FIRST_NAME: string;
  useR_LAST_NAME: string;
  useR_INITIALS?: string;
  efF_DATE: string;
  terM_DATE?: string | null;
  prograM_ID: string;
  useR_CLASS: string;
  testinG_LAB_CODE: string;
  prinT_ID?: string;
  customeR_ID?: string;
  warehousE_ID?: string;
  inserT_USER?: string;
  inserT_DATE?: string;
  kT_USER_ID?: string;
  aD_USER_ID?: string;
  skiP_AD?: string;
  department?: string;
  phone?: string;
  lasT_MODIFIED_DATE?: string;
  useR_EMAIL?: string;
  iS_PASSWORD_LOCKED: 'Y' | 'N';
  accountStatus?: 'ACTIVE' | 'LOCKED';
  lockouT_DATE?: string | null;
}

export interface ToggleLockUserAccountRequest {
  userId: string;
  isLocked: boolean;
}

export interface ToggleLockUserAccountResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserAccountService {
  private readonly getUserAccountsEndpoint = 'api/v1/donors/User/GetUserAccounts';
  private readonly toggleLockEndpoint = 'api/v1/donors/User/ToggleLockUserAccount';

  constructor(private apiService: ApiService) { }

  getUserAccounts(request: GetUserAccountsRequest): Observable<UserAccount[]> {
    return this.apiService
      .post<UserAccountApiResponse[]>(this.getUserAccountsEndpoint, request)
      .pipe(
        map(apiList => apiList.map(api => this.mapToUiUser(api)))
      );
  }

  toggleAccountLock(userId: string, isLocked: boolean): Observable<ToggleLockUserAccountResponse> {
    const request: ToggleLockUserAccountRequest = {
      userId,
      isLocked
    };

    return this.apiService
      .put<ToggleLockUserAccountResponse>(this.toggleLockEndpoint, request);
  }

  private mapToUiUser(api: UserAccountApiResponse): UserAccount {
    // Derive isActive from accountStatus if available, otherwise fall back to iS_PASSWORD_LOCKED
    const isActive = api.accountStatus && api.accountStatus.trim()
      ? api.accountStatus === 'ACTIVE'
      : api.iS_PASSWORD_LOCKED !== 'Y';

    return {
      userId: api.useR_ID || '',
      name: `${api.useR_FIRST_NAME || ''} ${api.useR_LAST_NAME || ''}`.trim(),
      userClass: api.useR_CLASS || '',
      labCode: api.testinG_LAB_CODE || '',
      effectiveDate: api.efF_DATE ? api.efF_DATE.split('T')[0] : '',
      terminationDate: api.terM_DATE ? api.terM_DATE.split('T')[0] : undefined,
      isActive: isActive,
      email: api.useR_EMAIL || undefined
    };
  }
}
