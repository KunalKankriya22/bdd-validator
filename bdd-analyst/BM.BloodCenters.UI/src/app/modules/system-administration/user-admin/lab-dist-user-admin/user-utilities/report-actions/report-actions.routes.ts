import { Routes } from '@angular/router';
import { authGuard } from '../../../../../../guards/auth.guard';

/**
 * Report Actions feature routes
 */
export const REPORT_ACTIONS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./report-actions-list/report-actions-list.component').then(
            m => m.ReportActionsListComponent
          ),
        title: 'Report Actions'
      }
    ]
  }
];
