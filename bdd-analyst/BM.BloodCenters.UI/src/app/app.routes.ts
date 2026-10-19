import { Routes } from '@angular/router';
import { Home } from './shared/components/home/home';
import { MainLayout } from './shared/components/main-layout/main-layout';
import { ResetPasswordPreviewComponent } from './modules/reset-password-preview/reset-password-preview';
import { DefineDurationBetweenProceduresComponent } from './modules/application-admin/wellsky-restricted-validation-tables/define-duration-between-procedures/define-duration-between-procedures';
import { authGuard } from './guards/auth.guard';
import { oktaRestrictionGuard } from './guards/okta-restriction.guard';
import { accessLevelGuard, accessLevelChildGuard } from './guards/access-level.guard';
import { ROUTE_REGISTRY } from './core/constants/route-registry';
import { RouteKey } from './core/constants/route-keys';
import { removePathPrefix } from './core/utils/route-utils';

export const routes: Routes = [
  { path: 'preview/reset-password-ui', component: ResetPasswordPreviewComponent },
  /**
   * AUTH ROUTES (NO LAYOUT)
   */
  {
    path: '',
    loadChildren: () =>
      import('./modules/authentication/auth.routes').then((m) => m.AUTH_ROUTES)
  },

  /**
   * APP ROUTES (WITH HEADER + SIDENAV)
   * --------------------------- */
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard, oktaRestrictionGuard],
    // canActivateChild: [accessLevelChildGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      {
        path: 'mappings/:code',
        loadComponent: () => import('./modules/application-admin/common-validation-table/emf-processes/view-edit-mappings/process-code-mappings/process-code-mappings').then(m => m.ProcessCodeMappingsComponent)
      },
      //{ path: 'donor', component: Donor },
      { path: 'donor-functions',  loadChildren: () =>
       import('./modules/donor-functions/donor-functions.routes').then((m) => m.DONOR_FUNCTIONS_ROUTES)
      },
      
      { path: 'application-administration', loadChildren: () =>
       import('./modules/application-admin/application-admin.routes').then((m) => m.APPLICATION_ADMIN_ROUTES)
      },

      { path: 'internal-administration', loadChildren: () =>
       import('./modules/internal-administration/internal-administration.routes').then((m) => m.INTERNAL_ADMINISTRATION_ROUTES)
      },

      { path: 'system-administration', loadChildren: () =>
       import('./modules/system-administration/system-administration.routes').then((m) => m.SYSTEM_ADMINISTRATION_ROUTES)
      },

      { path: 'laboratory-functions', loadChildren: () =>
       import('./modules/laboratory-functions/laboratory-functions.routes').then((m) => m.LABORATORY_FUNCTIONS_ROUTES)
      },

      { path: 'product-management-functions', loadChildren: () =>
       import('./modules/product-management-functions/product-management-functions.routes').then((m) => m.PRODUCT_MANAGEMENT_FUNCTIONS_ROUTES)
      },

      { path: 'apis-integration', loadChildren: () =>
       import('./modules/APIsAndIntegration/apis-and-integration.routes').then((m) => m.APIS_AND_INTEGRATION_ROUTES)
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.AssociateLetterToInterdiction].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.AssociateLetterToInterdiction].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.AlternateIdConfiguration].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.AlternateIdConfiguration].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DriveStatistics].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.DriveStatistics].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DefferalEntryDetails].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.DefferalEntryDetails].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DonationEntryDetails].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.DonationEntryDetails].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DonorEligibility].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorEligibility].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.ISBTUnitCheckDigit].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.ISBTUnitCheckDigit].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.NotesQuery].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.NotesQuery].loadComponent,
      },

      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.CustomerProfile].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.CustomerProfile].loadComponent,
      },
      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.AddCustomerProfile].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.AddCustomerProfile].loadComponent,
      },
      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.CustomerProfileDetails].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.CustomerProfileDetails].loadComponent,
      },

      { path: 'lab', component: Home }, // Placeholder
      { path: 'distribution', loadChildren: () =>
        import('./modules/distribution/distribution.routes').then((m) => m.DISTRIBUTION_ROUTES)
      },
      { path: 'user-utilities', component: Home }, // Placeholder


      // Lab - Leaf routes only
      { path: 'lab/test-results', component: Home }, // TODO: Create TestResultsComponent
      { path: 'lab/sample-tracking', component: Home }, // TODO: Create SampleTrackingComponent

      // User Utilities - Leaf routes only
      { path: 'user-utilities/profile', component: Home }, // TODO: Create ProfileComponent
      { path: 'user-utilities/preferences', component: Home }, // TODO: Create PreferencesComponent

      { path: 'application-admin/wellsky-restricted/define-duration-between-procedure', component: DefineDurationBetweenProceduresComponent },

      // Unauthorized access page
      {
        path: 'unauthorized',
        loadComponent: () => import('./shared/components/unauthorized/unauthorized').then(m => m.UnauthorizedComponent)
      },

      /* FALLBACK (keep URL) */
      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.SendLetterTest].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.SendLetterTest].loadComponent,
      },
      {
        path: removePathPrefix(ROUTE_REGISTRY[RouteKey.DonorsByEventsQuery].path, '/'),
        loadComponent: ROUTE_REGISTRY[RouteKey.DonorsByEventsQuery].loadComponent,
      },
      { path: '**', component: Home }
    ],
  },
];
