import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';
import { RestrictionService } from '../../services/restriction.service';
import { ROUTES } from '../../../core/constants/route.constants';

@Component({
  selector: 'app-okta-restriction',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule],
  templateUrl: './okta-restriction.html',
  styleUrl: './okta-restriction.scss',
})
export class OktaRestrictionComponent implements OnInit {
  public headerService = inject(HeaderService);
  private router = inject(Router);
  private loginService = inject(LoginService);
  private authService = inject(AuthService);
  private restrictionService = inject(RestrictionService);

  ngOnInit(): void {
    this.headerService.clearCookies();
    // Set restriction flag to ensure it's active (defensive, in case user navigates directly)
    this.restrictionService.setOktaRestrictionActive();
  }

  public async onLogout(event: Event): Promise<void> {
    event.preventDefault();

    this.loginService.broadcastLogout();

    // Clear restriction flag to allow normal navigation after logout
    this.restrictionService.clearOktaRestriction();

    try {
      this.loginService.clearToken();
      this.headerService.clearCookies();
      await this.authService.logout();
    } catch (error) {
      console.error('Error during Okta logout:', error);
      this.loginService.clearToken();
      this.headerService.clearCookies();
      this.router.navigate([ROUTES.AUTH.LOGIN]);
    }
  }
}
