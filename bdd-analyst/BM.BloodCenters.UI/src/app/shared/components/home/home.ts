import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AlertComponent } from '../alert/alert.component';
import { LoginService } from '../../services/login.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../../../modules/system-administration/change-password/change-password';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    TranslateModule,
    AlertComponent,
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private dialog = inject(MatDialog);

  constructor(public loginService: LoginService) {}

  ngOnInit(): void {
    // Check if password reset is requested after successful login
    this.checkPasswordResetRequired();
  }

  /**
   * Check if password reset is required and show mandatory change password dialog
   */
  private checkPasswordResetRequired(): void {
    const passwordConfig = this.loginService.getStoredPasswordConfig();

    // If password reset is requested, show mandatory change password dialog
    if (passwordConfig?.isResetPasswordRequested === true) {
      this.openMandatoryChangePasswordDialog(passwordConfig.isStrongPasswordConfigured);
    }
  }

  /**
   * Open mandatory change password dialog
   * User cannot close this dialog until they successfully change their password
   * @param isStrongPasswordRequired Whether strong password configuration is required
   */
  private openMandatoryChangePasswordDialog(isStrongPasswordRequired: boolean): void {
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: '600px',
      disableClose: true, // Mandatory - user cannot close without changing password
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass: 'change-password-dialog',
      data: {
        isMandatory: true, // Indicate this is mandatory password change
        isStrongPasswordRequired: isStrongPasswordRequired // Pass strong password flag
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Only proceed after successful password change
      if (result && result.success) {
        // Update password config in cookies to mark reset as complete
        const currentConfig = this.loginService.getStoredPasswordConfig();
        if (currentConfig) {
          this.loginService.storePasswordConfig({
            isStrongPasswordConfigured: currentConfig.isStrongPasswordConfigured,
            isResetPasswordRequested: false // Reset is now complete
          });
        }
      } else {
        // If dialog closed without success (shouldn't happen with disableClose: true),
        // open it again to enforce password change
        this.openMandatoryChangePasswordDialog(isStrongPasswordRequired);
      }
    });
  }

}

