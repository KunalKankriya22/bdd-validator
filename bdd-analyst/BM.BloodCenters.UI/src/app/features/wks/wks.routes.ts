import { Routes } from '@angular/router';

export const WKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./wks.component').then((m) => m.WksComponent),
  },
];
