import { Component, OnInit, OnDestroy, ViewEncapsulation, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';
import { ChapterTimezoneService } from '../../services/chapter-timezone.service';
import { SnackbarService } from '../../services/snackbar.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChangePasswordComponent } from '../../../modules/system-administration/change-password/change-password';
import { ChangeChapterComponent } from '../../../modules/system-administration/change-chapter/change-chapter';
import { VersionInfoDialogComponent } from '../version-info-dialog/version-info-dialog.component';
import { ROUTES } from '../../../core/constants/route.constants';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from '../../../core/constants/timezone.constants';
/**
 * Header component for the application
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private loginService = inject(LoginService);
  private authService = inject(AuthService);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private snackbarService = inject(SnackbarService);
  private dateTimeInterval?: number;
  private timeRefreshStarted = false;
  private invalidTimezoneNotified = false;

  /**
   * Current date/time string for display
   */
  public currentDateTime: string = '';

  /**
   * Constructor
   * @param headerService - Service for header, navigation, and footer data
   */
  public constructor(
    public headerService: HeaderService
  ) {
    // React to user login and chapter changes - start/restart time refresh
    effect(() => {
      const user = this.headerService.headerConfig()?.user;
      const chapterId = this.headerService.chapterId();
      const chapterTimeZone = this.headerService.chapterTimeZone();

      // Start time refresh only when user is loaded AND timezone is available
      if (user && chapterTimeZone) {
        if (!this.timeRefreshStarted) {
          // First time - start the interval
          this.timeRefreshStarted = true;
          this.startTimeRefresh();
        } else {
          // Chapter changed - immediately update time with new timezone
          this.updateDateTime();
        }
      }
    });
  }

  /**
   * Lifecycle hook that is called after data-bound properties are initialized
   */
  public ngOnInit(): void {
    // Load user data from API on component initialization
    // Time refresh will automatically start via effect() when user data is loaded
    this.headerService.loadUserData();
  }

  /**
   * Starts the datetime refresh interval
   * Called on first login and updates immediately when chapter changes
   */
  private startTimeRefresh(): void {
    // Initialize datetime immediately
    this.updateDateTime();

    // Update every minute
    this.dateTimeInterval = window.setInterval(() => {
      this.updateDateTime();
    }, 60000);
  }

  /**
   * Lifecycle hook that is called when component is destroyed
   */
  public ngOnDestroy(): void {
    if (this.dateTimeInterval) {
      clearInterval(this.dateTimeInterval);
    }
  }

  /**
   * Handles user profile click
   * @param event - Click event
   */
  public onProfileClick(event: Event): void {
    event.preventDefault();
    console.log('Profile clicked');
  }

  /**
   * Handles logo click
   * @param event - Click event
   */
  public onLogoClick(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/home']);
  }

  /**
   * Handles logout action
   * Supports both Okta SSO logout and standard logout
   * @param event - Click event
   */
  public async onLogout(event: Event): Promise<void> {
    event.preventDefault();

    this.loginService.broadcastLogout();

    // Check if user authenticated via Okta
    if (this.loginService.isOktaUser()) {
      // Okta SSO logout: clears local session AND terminates Okta SSO session
      try {
        // Clear local authentication cookies
        this.loginService.clearToken();
        // Clear chapter/warehouse cookies
        this.headerService.clearCookies();

        // Clear chapter timezone data
        this.chapterTimezoneService.clearChapterLocalDate();
        sessionStorage.removeItem('driveContext');
        sessionStorage.removeItem('labelPrinterContext');

        // Perform Okta logout (redirects to Okta and then back to postLogoutRedirectUri)
        await this.authService.logout();
      } catch (error) {
        console.error('Error during Okta logout:', error);
        // Even if Okta logout fails, clear local state and redirect
        this.loginService.clearToken();
        this.chapterTimezoneService.clearChapterLocalDate();
        this.headerService.clearCookies();
        sessionStorage.removeItem('driveContext');
        sessionStorage.removeItem('labelPrinterContext');
        this.router.navigate([ROUTES.AUTH.LOGIN]);
      }
    } else {
      // Standard logout: clear local authentication cookies
      this.loginService.clearToken();
      // Clear chapter/warehouse cookies
      this.headerService.clearCookies();

      // Clear chapter timezone data
      this.chapterTimezoneService.clearChapterLocalDate();
      sessionStorage.removeItem('driveContext');
        sessionStorage.removeItem('labelPrinterContext');

      this.router.navigate([ROUTES.AUTH.LOGIN]);
    }
  }

  /**
   * Updates the current date/time display formatted as DD-MON-YYYY, HH:MM with chapter's timezone
   * Timezone is dynamically retrieved from the chapter configuration
   */
  private updateDateTime(): void {
    let timeZone = this.headerService.chapterTimeZone();
    if (!timeZone) return;

    const now = new Date();

    if (!TIMEZONE_OFFSET_REGEX.test(timeZone)) {
      if (!this.invalidTimezoneNotified) {
        this.snackbarService.showError(
          `Invalid timezone value "${timeZone}" configured for this chapter. Defaulting to GMT.`
        );
        this.invalidTimezoneNotified = true;
      }
      timeZone = '+00:00';
    } else {
      this.invalidTimezoneNotified = false;
    }

    const sign = timeZone[0] === '+' ? 1 : -1;
    const [hh, mm] = timeZone.slice(1).split(':').map(Number);
    const local = new Date(now.getTime() + sign * (hh * 60 + mm) * 60000);

    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const monthName = MONTHS[local.getUTCMonth()];
    const day = String(local.getUTCDate()).padStart(2, '0');
    const year = local.getUTCFullYear();
    const hour = String(local.getUTCHours()).padStart(2, '0');
    const minute = String(local.getUTCMinutes()).padStart(2, '0');
    const displayLabel = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? `GMT${timeZone}`;

    this.currentDateTime = `${day}-${monthName.toUpperCase()}-${year}, ${hour}:${minute} ${displayLabel}`;
  }

  /**
   * Gets the database prefix label for display
   */
  public getDatabaseLabel(): string {
    return this.headerService.databasePrefix();
  }

  /**
   * Gets the database name tooltip
   */
  public getDatabaseTooltip(): string {
    return this.headerService.databaseName();
  }

  /**
   * Gets the chapter ID label for display
   */
  public getChapterLabel(): string {
    return this.headerService.chapterId();
  }

  /**
   * Gets the chapter tooltip (printHdr)
   */
  public getChapterTooltip(): string {
    return this.headerService.chapterPrintHdr();
  }

  /**
   * Gets the warehouse ID label for display
   */
  public getWarehouseLabel(): string {
    return this.headerService.warehouseId();
  }

  /**
   * Check if current user can change password
   * Okta users cannot change password through the application
   * @returns True if user can change password (non-Okta users only)
   */
  public canChangePassword(): boolean {
    return !this.loginService.isOktaUser();
  }

  /**
   * Opens the change password dialog
   * Uses cookie service to determine password configuration requirements
   * Only available for non-Okta users
   * @param event - Click event
   */
  public onChangePassword(event: Event): void {
    event.preventDefault();

    // Double-check: should not be called for Okta users
    if (this.loginService.isOktaUser()) {
      console.warn('Change password is not available for Okta users');
      return;
    }

    // First, check cookie service for password configuration
    const passwordConfig = this.loginService.getStoredPasswordConfig();
    const isStrongPasswordRequired = passwordConfig?.isStrongPasswordConfigured ?? false;

    // Open the change password dialog with the configuration from cookies
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: '600px',
      disableClose: false,
      autoFocus: true,
      data: {
        isMandatory: false, // User-initiated password change (not mandatory)
        isStrongPasswordRequired: isStrongPasswordRequired // From cookies
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        console.log('Password changed successfully:', result);
        // TODO: Show success message or perform additional actions
      }
    });
  }

onChangeChapter(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  const dialogRef = this.dialog.open(ChangeChapterComponent, {
    width: '650px',
    autoFocus: false,
    disableClose: true,
    data: {
      chapterId: this.headerService.chapterId(),
      chapterName: this.headerService.chapterName(),
      warehouseId: this.headerService.warehouseId(),
      warehouseName: this.headerService.warehouseName()
    }
  });

  dialogRef.afterClosed().subscribe((updated: boolean) => {
    if (updated === true) {
      // Chapter data refresh is handled by each component via chapterChanged$ subscription.
    }
  });
}

  /**
   * Opens the version information dialog
   * Displays the BloodCenter application release version
   * @param event - Click event
   */
  public onVersionClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.dialog.open(VersionInfoDialogComponent, {
      width: '500px',
      autoFocus: true,
      disableClose: false
    });
  }

}