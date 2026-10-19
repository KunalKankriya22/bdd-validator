import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

export interface UpdatePasswordRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidatePasswordHistoryRequest {
  userId: string;
  newPassword: string;
}

export interface ValidatePasswordHistoryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { isValid: boolean; pwdHistoryCount: number }[];
}

export interface PasswordConfiguration {
  pwd_History: number;
  pwd_Min_Length: number;
  pwd_Min_Caps: number;
  pwd_Min_Lower: number;
  pwd_Min_Number: number;
  pwd_Min_Special: number;
  pwd_Min_Char_Chg: number;
  pwd_Lockout: number;
  pwd_Intrvl: number;
  pwd_Method: string;
  pwd_Special: string;
  pwd_War_Msg: number;
  pwd_Lockout_Interval: number;
  pwd_Lockout_Period: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChangePasswordService {
  private readonly apiService = inject(ApiService);

  updatePassword(request: UpdatePasswordRequest): Observable<any> {
    return this.apiService.post<any>(API.SYSTEM_ADMIN.UPDATE_PASSWORD, request);
  }

  getPasswordConfiguration(): Observable<PasswordConfiguration> {
    return this.apiService.get<PasswordConfiguration>(API.SYSTEM_ADMIN.PASSWORD_CONFIGURATION);
  }

  validatePasswordHistory(request: ValidatePasswordHistoryRequest): Observable<ValidatePasswordHistoryResponse> {
    return this.apiService.post<ValidatePasswordHistoryResponse>(API.SYSTEM_ADMIN.VALIDATE_PASSWORD_HISTORY, request);
  }
}
