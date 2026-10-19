import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout.component';
import { LoginComponent } from './login/login';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { OktaCallbackComponent } from './callback/okta-callback.component';
import { SessionExpiredComponent } from '../../shared/components/session-expired/session-expired';
import { AccessDeniedComponent } from '../../shared/components/access-denied/access-denied';
import { OktaRestrictionComponent } from '../../shared/components/okta-restriction/okta-restriction';
import { oktaRestrictionGuard } from '../../guards/okta-restriction.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [oktaRestrictionGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent},
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'login/callback', component: OktaCallbackComponent }
    ]
  },
  { path: 'session-expired', component: SessionExpiredComponent, canActivate: [oktaRestrictionGuard] },
  { path: 'access-denied', component: AccessDeniedComponent, canActivate: [oktaRestrictionGuard] },
  { path: 'okta-restriction', component: OktaRestrictionComponent }
];
