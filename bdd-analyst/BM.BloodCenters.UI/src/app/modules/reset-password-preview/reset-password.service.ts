import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

// Request/Response interfaces matching backend DTOs (PascalCase)
export interface GenerateTempPasswordRequest {
  UserId: string;
}

export interface GenerateTempPasswordResponse {
  success: boolean;
  message: string;
  userId?: string;
  username?: string;
  email?: string;
  temporaryPassword?: string;
  userFullName?: string;
  validityHours?: number;
}

export interface SendTempPasswordRequest {
  UserId: string;
  TemporaryPassword: string;
  Email: string;
  Username?: string;
  UserFullName?: string;
}

export interface SendTempPasswordResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetRequest {
  userId: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService {
  constructor(private apiService: ApiService) {}

  /**
   * Generate a temporary password for a user
   */
  generateTempPassword(userId: string): Observable<GenerateTempPasswordResponse> {
    const payload: GenerateTempPasswordRequest = { UserId: userId };
    return this.apiService.post<GenerateTempPasswordResponse>(
      API.SYSTEM_ADMIN.GENERATE_TEMP_PASSWORD,
      payload
    );
  }

  /**
   * Send temporary password to user via email
   */
  sendTempPassword(userId: string, temporaryPassword: string, email: string, username?: string, userFullName?: string): Observable<SendTempPasswordResponse> {
    const payload: SendTempPasswordRequest = {
      UserId: userId,
      TemporaryPassword: temporaryPassword,
      Email: email,
      Username: username,
      UserFullName: userFullName
    };
    return this.apiService.post<SendTempPasswordResponse>(
      API.SYSTEM_ADMIN.SEND_TEMP_PASSWORD,
      payload
    );
  }

  /**
   * Reset password (called automatically after 24-hour timeout)
   */
  resetPassword(userId: string): Observable<PasswordResetResponse> {
    const payload: PasswordResetRequest = { userId };
    return this.apiService.post<PasswordResetResponse>(
      API.SYSTEM_ADMIN.PASSWORD_RESET,
      payload
    );
  }
}
