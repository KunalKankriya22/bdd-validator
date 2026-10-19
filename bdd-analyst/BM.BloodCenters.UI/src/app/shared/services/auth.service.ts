import { inject, Injectable } from '@angular/core';
import { IDToken, OktaAuth } from '@okta/okta-auth-js';
import { Observable, from, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API } from '../../core/constants/api.constants';
import { ApiService } from './api.service';

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
    private oktaAuth: OktaAuth;
    private apiService = inject(ApiService);

    constructor() {
        this.oktaAuth = new OktaAuth({
            ...environment.okta,
            tokenManager: {
                storage: 'sessionStorage'
            },
            restoreOriginalUri: async () => {
                // Navigation is handled by OktaCallbackComponent
            }
        });

        // Enable automatic token renewal
        // This will automatically renew tokens before they expire
        this.oktaAuth.tokenManager.on('renewed', (key, newToken, oldToken) => {
            console.log('Token renewed:', key);
        });

        this.oktaAuth.tokenManager.on('expired', (key, expiredToken) => {
            console.log('Token expired:', key);
            // Token has expired and automatic renewal failed
            // This is a fallback - user should be redirected to login
        });

        this.oktaAuth.tokenManager.on('error', (error) => {
            console.error('Token manager error:', error);
            // Handle token errors (e.g., network issues during renewal)
        });

        // Start the service (enables automatic token renewal)
        this.oktaAuth.start();
    }

  async isAuthenticated(): Promise<boolean> {
    return await this.oktaAuth.isAuthenticated();
  }

  login(): Observable<void> {
    return from(this.oktaAuth.signInWithRedirect());
  }

  async logout(): Promise<void> {
    // Clear tokens from storage first
   // await this.clearTokens();
    // Sign out from Okta (redirects to Okta and then to postLogoutRedirectUri)
    await this.oktaAuth.signOut({
         revokeAccessToken: true,
         revokeRefreshToken: true,
         postLogoutRedirectUri: window.location.origin + '/'
    });
  }

   async getUser(): Promise<any> {
        const token = await this.oktaAuth.tokenManager.get('idToken');

        if (token && 'claims' in token) {
            return (token as IDToken).claims;
        }

        return null;
    }

    getAccessToken(): string | undefined {
      return this.oktaAuth.getAccessToken();
    }

    
   async handleLoginRedirect(): Promise<void> {
        await this.oktaAuth.handleLoginRedirect();
    }

    /**
     * Check if user has valid Okta session
     * @returns Promise<boolean> indicating if user is authenticated with valid tokens
     */
    async hasValidSession(): Promise<boolean> {
        try {
            const accessToken = await this.oktaAuth.tokenManager.get('accessToken');
            const idToken = await this.oktaAuth.tokenManager.get('idToken');

            // Both tokens should exist and not be expired
            return !!(accessToken && idToken);
        } catch (error) {
            console.error('Error checking session validity:', error);
            return false;
        }
    }

    /**
     * Manually renew tokens
     * Useful for ensuring fresh tokens before critical operations
     * @returns Promise that resolves when tokens are renewed
     */
    async renewTokens(): Promise<void> {
        try {
            await this.oktaAuth.tokenManager.renew('accessToken');
            await this.oktaAuth.tokenManager.renew('idToken');
            console.log('Tokens renewed successfully');
        } catch (error) {
            console.error('Error renewing tokens:', error);
            throw error;
        }
    }

    /**
     * Clear all Okta tokens from storage
     * Called during logout or when tokens become invalid
     */
    async clearTokens(): Promise<void> {
        await this.oktaAuth.tokenManager.clear();
    }

    // expose oktaAuth instance if caller needs lower-level operations
    getOktaAuth(): OktaAuth {
        return this.oktaAuth;
    }

    checkOktaEnabled(): Observable<any> {
      return this.apiService.get(`okta-auth`);
    }

    forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.apiService.post<ForgotPasswordResponse>(
      API.AUTH.FORGOT_PASSWORD,
      { email }
    );
  }

    resetPasswordWithToken(token: string, newPassword: string, confirmPassword: string): Observable<ResetPasswordResponse> {
    return this.apiService.post<ResetPasswordResponse>(
      API.AUTH.RESET_PASSWORD_WITH_TOKEN,
      { token, newPassword, confirmPassword }
    );
  }
}
