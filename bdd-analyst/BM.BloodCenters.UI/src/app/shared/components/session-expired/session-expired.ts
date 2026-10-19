import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { ROUTES } from '../../../core/constants/route.constants';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule],
  templateUrl: './session-expired.html',
  styleUrl: './session-expired.scss',
})
export class SessionExpiredComponent implements OnInit {
  public headerService = inject(HeaderService);
  public readonly loginRoute = ROUTES.AUTH.LOGIN;
  private loginService = inject(LoginService);

  ngOnInit(): void {
    this.loginService.clearToken();
    this.headerService.clearSession();
  }
}
