import { Injectable } from '@angular/core';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { MenuItem } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  getNavigationPath(menuItem: MenuItem): string {
    const routeKey = menuItem.routeKey;

    // Debug logging
    console.log('[NavigationService] MenuItem:', {
      label: menuItem.label,
      routeKey: routeKey,
      routePath: menuItem.routePath
    });

    if (!routeKey) {
      console.warn('[NavigationService] No routeKey found, redirecting to unauthorized');
      return ROUTE_REGISTRY[RouteKey.Unauthorized].path;
    }

    const resolvedPath = ROUTE_REGISTRY[routeKey]?.path;
    if (!resolvedPath) {
      console.warn('[NavigationService] No path found for routeKey:', routeKey, '- redirecting to unauthorized');
      return ROUTE_REGISTRY[RouteKey.Unauthorized].path;
    }

    console.log('[NavigationService] Resolved path:', resolvedPath);
    return resolvedPath;
  }
}
