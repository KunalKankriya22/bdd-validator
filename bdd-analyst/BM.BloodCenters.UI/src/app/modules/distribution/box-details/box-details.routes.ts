import { Routes } from '@angular/router';

export const BOX_DETAILS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./box-management/box-management').then(
        (m) => m.BoxManagementComponent
      ),
  },
  {
    path: ':boxId',
    loadComponent: () =>
      import('./box-details-view/box-details-view').then(
        (m) => m.BoxDetailsViewComponent
      ),
  },
];
