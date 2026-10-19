import { AccessLevelService } from './access-level.service';

describe('AccessLevelService', () => {
  let service: AccessLevelService;

  beforeEach(() => {
    service = new AccessLevelService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have zero access level', () => {
      expect(service.userAccessLevel()).toBe(0);
    });

    it('should have empty userId', () => {
      expect(service.userId()).toBe('');
    });

    it('should have empty groupId', () => {
      expect(service.groupId()).toBe('');
    });

    it('should not be loaded', () => {
      expect(service.isLoaded()).toBe(false);
    });
  });

  describe('setAccessInfo', () => {
    it('should set userId, groupId, and accessLevel', () => {
      service.setAccessInfo('user1', 'group1', 5);
      expect(service.userId()).toBe('user1');
      expect(service.groupId()).toBe('group1');
      expect(service.userAccessLevel()).toBe(5);
    });

    it('should mark as loaded when userId is set', () => {
      service.setAccessInfo('user1', 'group1', 5);
      expect(service.isLoaded()).toBe(true);
    });
  });

  describe('canAccess', () => {
    beforeEach(() => {
      service.setAccessInfo('user1', 'group1', 5);
    });

    it('should return true when access level is sufficient', () => {
      expect(service.canAccess(3)).toBe(true);
      expect(service.canAccess(5)).toBe(true);
    });

    it('should return false when access level is insufficient', () => {
      expect(service.canAccess(6)).toBe(false);
      expect(service.canAccess(10)).toBe(false);
    });

    it('should return true for level 0', () => {
      expect(service.canAccess(0)).toBe(true);
    });
  });

  describe('canAccessRoute', () => {
    beforeEach(() => {
      service.setAccessInfo('user1', 'group1', 5);
    });

    it('should return true when no route map is set', () => {
      expect(service.canAccessRoute('/any/path')).toBe(true);
    });

    it('should return true for exact route match with sufficient access', () => {
      const map = new Map<string, number>();
      map.set('/admin', 3);
      service.setRouteAccessMap(map);
      expect(service.canAccessRoute('/admin')).toBe(true);
    });

    it('should return false for exact route match with insufficient access', () => {
      const map = new Map<string, number>();
      map.set('/admin', 8);
      service.setRouteAccessMap(map);
      expect(service.canAccessRoute('/admin')).toBe(false);
    });

    it('should match child routes to parent', () => {
      const map = new Map<string, number>();
      map.set('/admin', 3);
      service.setRouteAccessMap(map);
      expect(service.canAccessRoute('/admin/users')).toBe(true);
    });

    it('should use the most specific route match', () => {
      const map = new Map<string, number>();
      map.set('/admin', 3);
      map.set('/admin/users', 8);
      service.setRouteAccessMap(map);
      expect(service.canAccessRoute('/admin/users/edit')).toBe(false);
    });

    it('should strip query params from URL', () => {
      const map = new Map<string, number>();
      map.set('/admin', 3);
      service.setRouteAccessMap(map);
      expect(service.canAccessRoute('/admin?tab=1')).toBe(true);
    });

    it('should return true for unmatched routes', () => {
      const map = new Map<string, number>();
      map.set('/admin', 3);
      service.setRouteAccessMap(map);
      expect(service.canAccessRoute('/other')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should reset all values', () => {
      service.setAccessInfo('user1', 'group1', 5);
      service.setRouteAccessMap(new Map([['/', 1]]));

      service.clear();

      expect(service.userId()).toBe('');
      expect(service.groupId()).toBe('');
      expect(service.userAccessLevel()).toBe(0);
      expect(service.isLoaded()).toBe(false);
      expect(service.canAccessRoute('/admin')).toBe(true);
    });
  });
});
