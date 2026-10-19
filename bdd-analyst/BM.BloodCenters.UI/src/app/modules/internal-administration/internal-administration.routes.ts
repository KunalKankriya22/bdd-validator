import { Routes } from '@angular/router';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { removePathPrefix } from '@core/utils/route-utils';

// Extract path relative to /internal-administration
const bloodCenterInventoryLevelQueryPath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.BloodCenterInventoryLevelQuery].path,
  '/internal-administration'
);

export const INTERNAL_ADMINISTRATION_ROUTES: Routes = [
  {
    path: bloodCenterInventoryLevelQueryPath,
    loadComponent: ROUTE_REGISTRY[RouteKey.BloodCenterInventoryLevelQuery].loadComponent,
  },
];
