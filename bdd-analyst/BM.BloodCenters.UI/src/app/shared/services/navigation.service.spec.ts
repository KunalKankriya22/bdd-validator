import { NavigationService } from './navigation.service';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { MenuItem } from './menu.service';

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    service = new NavigationService();
    spyOn(console, 'log');
    spyOn(console, 'warn');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNavigationPath', () => {
    // ----- Branch 1: no routeKey -----
    it('should return unauthorized path when menuItem has no routeKey', () => {
      // Arrange
      const menuItem: MenuItem = { label: 'Test Item' };

      // Act
      const result = service.getNavigationPath(menuItem);

      // Assert
      expect(result).toBe(ROUTE_REGISTRY[RouteKey.Unauthorized].path);
    });

    it('should warn when menuItem has no routeKey', () => {
      // Arrange
      const menuItem: MenuItem = { label: 'Missing Route' };

      // Act
      service.getNavigationPath(menuItem);

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        '[NavigationService] No routeKey found, redirecting to unauthorized'
      );
    });

    it('should return unauthorized path when routeKey is undefined', () => {
      // Arrange
      const menuItem: MenuItem = { label: 'Undefined Route', routeKey: undefined };

      // Act
      const result = service.getNavigationPath(menuItem);

      // Assert
      expect(result).toBe(ROUTE_REGISTRY[RouteKey.Unauthorized].path);
    });

    // ----- Branch 2: routeKey exists but not in ROUTE_REGISTRY -----
    it('should return unauthorized path for unknown routeKey', () => {
      // Arrange
      const menuItem: MenuItem = {
        label: 'Unknown',
        routeKey: 'NONEXISTENT_ROUTE_KEY_12345' as RouteKey,
      };

      // Act
      const result = service.getNavigationPath(menuItem);

      // Assert
      expect(result).toBe(ROUTE_REGISTRY[RouteKey.Unauthorized].path);
    });

    it('should warn when routeKey has no matching path in registry', () => {
      // Arrange
      const menuItem: MenuItem = {
        label: 'Bad Route',
        routeKey: 'DOES_NOT_EXIST_99999' as RouteKey,
      };

      // Act
      service.getNavigationPath(menuItem);

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        '[NavigationService] No path found for routeKey:',
        'DOES_NOT_EXIST_99999',
        '- redirecting to unauthorized'
      );
    });

    // ----- Branch 3: valid routeKey with resolved path -----
    it('should return the resolved path for a valid routeKey', () => {
      // Arrange - find a valid routeKey from the registry
      const validRouteKey = Object.keys(ROUTE_REGISTRY).find(
        (key) => ROUTE_REGISTRY[key as RouteKey]?.path
      ) as RouteKey;

      // Guard: skip test if no valid route key found (should not happen)
      expect(validRouteKey).toBeDefined();

      const menuItem: MenuItem = {
        label: 'Valid Route',
        routeKey: validRouteKey,
      };

      // Act
      const result = service.getNavigationPath(menuItem);

      // Assert
      expect(result).toBe(ROUTE_REGISTRY[validRouteKey].path);
    });

    it('should log debug info with menuItem label, routeKey, and routePath', () => {
      // Arrange
      const validRouteKey = Object.keys(ROUTE_REGISTRY).find(
        (key) => ROUTE_REGISTRY[key as RouteKey]?.path
      ) as RouteKey;

      const menuItem: MenuItem = {
        label: 'Dashboard',
        routeKey: validRouteKey,
        routePath: '/dashboard',
      };

      // Act
      service.getNavigationPath(menuItem);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        '[NavigationService] MenuItem:',
        jasmine.objectContaining({
          label: 'Dashboard',
          routeKey: validRouteKey,
          routePath: '/dashboard',
        })
      );
    });

    it('should log the resolved path on success', () => {
      // Arrange
      const validRouteKey = Object.keys(ROUTE_REGISTRY).find(
        (key) => ROUTE_REGISTRY[key as RouteKey]?.path
      ) as RouteKey;

      const menuItem: MenuItem = {
        label: 'Test',
        routeKey: validRouteKey,
      };

      // Act
      service.getNavigationPath(menuItem);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        '[NavigationService] Resolved path:',
        ROUTE_REGISTRY[validRouteKey].path
      );
    });

    it('should not log resolved path when routeKey is missing', () => {
      // Arrange
      const menuItem: MenuItem = { label: 'No Route' };
      (console.log as jasmine.Spy).calls.reset();

      // Act
      service.getNavigationPath(menuItem);

      // Assert - only the MenuItem debug log should have been emitted, not the Resolved path log
      const logCalls = (console.log as jasmine.Spy).calls.allArgs();
      const resolvedPathCalls = logCalls.filter(
        (args: any[]) => args[0] === '[NavigationService] Resolved path:'
      );
      expect(resolvedPathCalls.length).toBe(0);
    });

    it('should not log resolved path when routeKey is unknown', () => {
      // Arrange
      const menuItem: MenuItem = {
        label: 'Bad',
        routeKey: 'UNKNOWN_ABC' as RouteKey,
      };
      (console.log as jasmine.Spy).calls.reset();

      // Act
      service.getNavigationPath(menuItem);

      // Assert - only the MenuItem debug log should have been emitted, not the Resolved path log
      const logCalls = (console.log as jasmine.Spy).calls.allArgs();
      const resolvedPathCalls = logCalls.filter(
        (args: any[]) => args[0] === '[NavigationService] Resolved path:'
      );
      expect(resolvedPathCalls.length).toBe(0);
    });

    // ----- Multiple valid route keys -----
    it('should resolve different valid route keys correctly', () => {
      // Arrange - find two distinct valid route keys
      const validKeys = Object.keys(ROUTE_REGISTRY).filter(
        (key) => ROUTE_REGISTRY[key as RouteKey]?.path
      ) as RouteKey[];

      if (validKeys.length >= 2) {
        const menuItem1: MenuItem = { label: 'Route 1', routeKey: validKeys[0] };
        const menuItem2: MenuItem = { label: 'Route 2', routeKey: validKeys[1] };

        // Act
        const result1 = service.getNavigationPath(menuItem1);
        const result2 = service.getNavigationPath(menuItem2);

        // Assert
        expect(result1).toBe(ROUTE_REGISTRY[validKeys[0]].path);
        expect(result2).toBe(ROUTE_REGISTRY[validKeys[1]].path);
      }
    });
  });
});
