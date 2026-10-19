import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../shared/services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderService } from '../../../shared/services/header.service';
import { LoginService } from '../../../shared/services/login.service';
import { RestrictionService } from '../../../shared/services/restriction.service';

/**
 * OktaCallbackComponent
 *
 * Handles the Okta OAuth redirect after successful authentication.
 * This component:
 * 1. Intercepts the callback from Okta with authorization code
 * 2. Processes the redirect using OktaAuth's handleLoginRedirect()
 * 3. Retrieves Okta user information from ID token (email)
 * 4. Calls /api/v1/system-users/by-email/{userEmail} to get application-specific user details
 * 5. Stores userId in sessionStorage (tab-scoped) for downstream application logic
 * 6. Stores authentication method in sessionStorage
 * 7. Loads full system user data via HeaderService
 * 8. Redirects to the home page on successful authentication
 * 9. Shows a loading spinner while processing
 */
@Component({
  selector: 'app-okta-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, TranslateModule],
  template: `
    <div class="okta-callback-container">
      <div class="callback-content">
        <mat-spinner diameter="50"></mat-spinner>
        <h2>Processing login...</h2>
        <p>Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .okta-callback-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .callback-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        background: white;
        padding: 48px 32px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        min-width: 300px;
      }

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #333;
        font-family: 'Roboto', sans-serif;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
        font-family: 'Roboto', sans-serif;
      }

      ::ng-deep .mat-progress-spinner circle {
        stroke: #667eea !important;
      }
    `,
  ],
})
export class OktaCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private headerService = inject(HeaderService);
  private loginService = inject(LoginService);
  private restrictionService = inject(RestrictionService);

  async ngOnInit(): Promise<void> {
    console.log('Okta callback: Processing authentication...');
    try {
      // Handle the Okta login redirect
      await this.authService.handleLoginRedirect();

      // Get Okta user information from ID token
      const oktaUser = await this.authService.getUser();

      if (!oktaUser) {
        throw new Error('Failed to retrieve Okta user information');
      }

      // DEBUG: Log all Okta user claims to see what's available
      console.log('Okta user claims:', oktaUser);

      // Extract email from Okta user claims
      // Okta typically provides: email, preferred_username, or sub
      const userEmail = oktaUser.email || oktaUser.preferred_username;

      if (!userEmail) {
        throw new Error('No email found in Okta user claims');
      }

      console.log('Okta callback: User authenticated with email:', userEmail);
      console.log('Okta callback: Fetching application-specific user details...');

      // Clear stale chapter/warehouse session data from any previous session
      this.headerService.clearSession();
      sessionStorage.removeItem('driveContext');
      sessionStorage.removeItem('labelPrinterContext');

      // Fetch application-specific user details using the email from Okta
      // This API call returns the userId that the application uses
      this.headerService.fetchSystemUserByEmail(userEmail).subscribe({
        next: (userData) => {
          if (!userData || !userData.userId) {
            console.error('Okta callback: Invalid user response format:', userData);
            this.loginService.storeAuthMethod('okta');
            // Set access-denied restriction flag before navigation
            this.restrictionService.setAccessDeniedActive();
            this.router.navigate(['/access-denied']);
            return;
          }

          console.log('Okta callback: User details fetched successfully, userId:', userData.userId);

          this.loginService.storeUsername(userData.userId);
          this.loginService.storeAuthMethod('okta');
          this.checkAndStorePasswordConfig(userData.userId);
        },
        error: (error) => {
          console.error('Error fetching user details by email:', error);
          this.loginService.storeAuthMethod('okta');

          if (error?.message === 'MULTIPLE_USERS_FOUND') {
            // Set okta-restriction flag before navigation to block access to other routes
            this.restrictionService.setOktaRestrictionActive();
            this.router.navigate(['/okta-restriction']);
          } else {
            // Set access-denied restriction flag before navigation
            this.restrictionService.setAccessDeniedActive();
            this.router.navigate(['/access-denied']);
          }
        }
      });
    } catch (error: unknown) {
      console.error('Error during Okta login redirect handling', error);

      // Set access-denied restriction flag before navigation
      this.restrictionService.setAccessDeniedActive();
      this.router.navigate(['/access-denied']);
    } finally {
      sessionStorage.removeItem('okta_login_started');
    }
  }

  /**
   * Check password configuration and store in sessionStorage
   * @param username Username to check password config for
   */
  private checkAndStorePasswordConfig(username: string): void {
    this.loginService.checkPasswordConfig(username).subscribe({
      next: (config) => {
        // Store password configuration in sessionStorage
        this.loginService.storePasswordConfig(config);

        // Navigate to home page
        // Note: For Okta users, we don't force password reset even if isResetPasswordRequested is true
        // This is because Okta manages passwords externally
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Failed to check password configuration:', error);
        // Navigate to home even if config check fails (don't block Okta users)
        this.router.navigate(['/home']);
      }
    });
  }
}
